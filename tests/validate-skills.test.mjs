import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  findDefaultPromptProblems,
  findDescriptionProblems,
  findUnknownSkillReferences,
  validateRepository,
} from '../scripts/validate-skills.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoots = [];

async function fixtureFromRepo() {
  const root = await mkdtemp(join(tmpdir(), 'validate-skills-'));
  fixtureRoots.push(root);
  await cp(join(repoRoot, 'contracts'), join(root, 'contracts'), { recursive: true });
  await cp(join(repoRoot, 'skills'), join(root, 'skills'), { recursive: true });
  await cp(join(repoRoot, 'package.json'), join(root, 'package.json'));
  return root;
}

async function updateInventory(root, update) {
  const path = join(root, 'contracts', 'skill-inventory.json');
  const inventory = JSON.parse(await readFile(path, 'utf8'));
  update(inventory);
  await writeFile(path, `${JSON.stringify(inventory, null, 2)}\n`);
}

test.after(async () => {
  await Promise.all(fixtureRoots.map((root) => rm(root, { recursive: true, force: true })));
});

test('accepts the canonical twelve-skill checkout', async () => {
  const result = await validateRepository(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.equal(result.skills.length, 12);
});

async function appendToSkill(root, name, text) {
  const path = join(root, 'skills', name, 'SKILL.md');
  const current = await readFile(path, 'utf8');
  await writeFile(path, current + "\n" + text + "\n");
}

test('rejects a plugin:skill reference that is not in the roster (#119)', async () => {
  const root = await fixtureFromRepo();
  await appendToSkill(root, 'github-contributing', 'See `superpowers:receiving-code-review` for more.');
  const result = await validateRepository(root);
  assert.match(result.errors.join("\n"), /github-contributing.*superpowers:receiving-code-review/s);
});

test('rejects an unmarked reference to a file that only exists in this repository (#119)', async () => {
  const root = await fixtureFromRepo();
  await appendToSkill(root, 'github-issue-first', 'Read `docs/repo-settings-snapshot.md` first.');
  const result = await validateRepository(root);
  assert.match(result.errors.join("\n"), /github-issue-first.*docs\/repo-settings-snapshot\.md/s);
});

test('accepts a repository-only reference that is explicitly marked (#119)', async () => {
  const root = await fixtureFromRepo();
  await appendToSkill(root, 'github-issue-first', 'Read `docs/repo-settings-snapshot.md` (this repository only).');
  const result = await validateRepository(root);
  assert.deepEqual(result.errors, []);
});

test('rejects an unmarked ADR number reference (#119)', async () => {
  const root = await fixtureFromRepo();
  await appendToSkill(root, 'github-projects', 'The reasoning is in ADR 0003.');
  const result = await validateRepository(root);
  assert.match(result.errors.join("\n"), /github-projects.*ADR 0003/s);
});

test('accepts generic directory advice and label examples (#119)', async () => {
  const root = await fixtureFromRepo();
  await appendToSkill(root, 'github-issue-first', 'Keep decisions in `docs/adr/` and encode the area as `area:auth`.');
  const result = await validateRepository(root);
  assert.deepEqual(result.errors, []);
});

test('rejects an unregistered github skill directory', async () => {
  const root = await fixtureFromRepo();
  await mkdir(join(root, 'skills', 'github-unregistered'));
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /unregistered skill/i);
});

test('rejects missing companion files', async () => {
  const root = await fixtureFromRepo();
  await rm(join(root, 'skills', 'github-repo-review', 'review-prompt.md'));
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /review-prompt\.md/);
});

test('rejects a missing mandatory file even when its inventory declaration is removed', async () => {
  const root = await fixtureFromRepo();
  await updateInventory(root, (inventory) => {
    const review = inventory.skills.find(({ name }) => name === 'github-repo-review');
    review.requiredFiles = review.requiredFiles.filter((path) => path !== 'review-prompt.md');
  });
  await rm(join(root, 'skills', 'github-repo-review', 'review-prompt.md'));
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /review-prompt\.md/);
});

test('reports malformed skill entries and requiredFiles shapes without throwing', async () => {
  const root = await fixtureFromRepo();
  await updateInventory(root, (inventory) => {
    inventory.skills[0] = null;
    inventory.skills[1].requiredFiles = 'SKILL.md';
  });
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /skill entry/i);
  assert.match(result.errors.join('\n'), /requiredFiles.*array/i);
});

test('rejects unsafe and duplicate required file paths', async () => {
  const root = await fixtureFromRepo();
  await updateInventory(root, (inventory) => {
    inventory.skills[0].requiredFiles.push(
      '../README.md',
      'C:drive-relative',
      'nested\\file',
      '/absolute',
      'nested//file',
      'SKILL.md',
    );
  });
  const result = await validateRepository(root);
  const errors = result.errors.join('\n');
  assert.match(errors, /unsafe required file path: \.\.\/README\.md/i);
  assert.match(errors, /unsafe required file path: C:drive-relative/i);
  assert.match(errors, /unsafe required file path: nested\\file/i);
  assert.match(errors, /unsafe required file path: \/absolute/i);
  assert.match(errors, /unsafe required file path: nested\/\/file/i);
  assert.match(errors, /duplicate required file path/i);
});

test('rejects invalid inventory metadata and a noncanonical duplicate roster', async () => {
  const root = await fixtureFromRepo();
  await updateInventory(root, (inventory) => {
    inventory.schemaVersion = 2;
    inventory.packageVersion = '9.9.9';
    inventory.skills.at(-1).name = inventory.skills[0].name;
  });
  const result = await validateRepository(root);
  const errors = result.errors.join('\n');
  assert.match(errors, /schemaVersion/i);
  assert.match(errors, /packageVersion/i);
  assert.match(errors, /duplicate skill name/i);
  assert.match(errors, /canonical skill names/i);
});

test('requires mandatory file declarations even while files exist', async () => {
  const root = await fixtureFromRepo();
  await updateInventory(root, (inventory) => {
    const hygiene = inventory.skills.find(({ name }) => name === 'github-hygiene');
    hygiene.requiredFiles = [];
  });
  const result = await validateRepository(root);
  const errors = result.errors.join('\n');
  assert.match(errors, /mandatory required file SKILL\.md/i);
  assert.match(errors, /mandatory required file agents\/openai\.yaml/i);
});

test('rejects a frontmatter name that differs from its directory', async () => {
  const root = await fixtureFromRepo();
  await writeFile(join(root, 'skills', 'github-hygiene', 'SKILL.md'), '---\nname: wrong\n---\n');
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /frontmatter name/i);
});

// Validator rules added for #129: each fails on a seeded violation.
test('findDescriptionProblems rejects a missing, empty, or over-long description (#129)', () => {
  assert.deepEqual(findDescriptionProblems('Use when merging pull requests.'), []);
  assert.equal(findDescriptionProblems(undefined).length, 1);
  assert.equal(findDescriptionProblems('   ').length, 1);
  assert.match(findDescriptionProblems('x'.repeat(1025))[0], /1025 characters; the limit is 1024/);
  assert.deepEqual(findDescriptionProblems('x'.repeat(1024)), []);
});

test('findDefaultPromptProblems requires the prompt to invoke the skill by name (#129)', () => {
  assert.deepEqual(findDefaultPromptProblems('Use $github-hygiene to merge.', 'github-hygiene'), []);
  assert.equal(findDefaultPromptProblems('Use $github-releases to merge.', 'github-hygiene').length, 1);
  assert.equal(findDefaultPromptProblems('Merge the pull request.', 'github-hygiene').length, 1);
  assert.equal(findDefaultPromptProblems(undefined, 'github-hygiene').length, 1);
});

test('findUnknownSkillReferences flags a github- token that is not a skill (#129)', () => {
  const source = [
    'See `github-hygiene` and the `github-actions` label.',
    'Hand off to `github-hygine` instead.',
    '```text',
    '`github-in-a-fence`',
    '```',
  ].join('\n');
  const problems = findUnknownSkillReferences(source);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].line, 2);
  assert.match(problems[0].message, /github-hygine/);
});

test('rejects an over-long description in a skill (#129)', async () => {
  const root = await fixtureFromRepo();
  const path = join(root, 'skills', 'github-hygiene', 'SKILL.md');
  const current = await readFile(path, 'utf8');
  await writeFile(path, current.replace(/^description: .*$/m, `description: ${'x'.repeat(1100)}`));
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /github-hygiene.*1100 characters; the limit is 1024/s);
});

test('rejects a default_prompt that does not name its skill (#129)', async () => {
  const root = await fixtureFromRepo();
  const path = join(root, 'skills', 'github-hygiene', 'agents', 'openai.yaml');
  const current = await readFile(path, 'utf8');
  await writeFile(path, current.replace('$github-hygiene', 'the hygiene skill'));
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /github-hygiene.*default_prompt must invoke the skill as \$github-hygiene/s);
});

test('rejects a cross-reference to a skill that does not exist (#129)', async () => {
  const root = await fixtureFromRepo();
  await appendToSkill(root, 'github-contributing', 'Hand this to `github-hygine`.');
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /github-contributing.*github-hygine.*not a skill in this roster/s);
});

test('findLengthWarning warns past 400 lines and stays quiet below it (#129)', async () => {
  const { findLengthWarning } = await import('../scripts/validate-skills.mjs');
  assert.equal(findLengthWarning('line\n'.repeat(399)), null);
  assert.match(findLengthWarning('line\n'.repeat(450)), /451 lines, over 400/);
});

test('the validator reports a long skill as a warning, not an error (#129)', async () => {
  const root = await fixtureFromRepo();
  await appendToSkill(root, 'github-hygiene', 'Extra line.\n'.repeat(250));
  const result = await validateRepository(root);
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join('\n'), /github-hygiene SKILL\.md is \d+ lines, over 400/);
});
