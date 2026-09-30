import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { validateRepository } from '../scripts/validate-skills.mjs';

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
