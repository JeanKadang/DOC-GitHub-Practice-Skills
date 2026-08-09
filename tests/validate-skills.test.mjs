import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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
  return root;
}

test.after(async () => {
  await Promise.all(fixtureRoots.map((root) => rm(root, { recursive: true, force: true })));
});

test('accepts the canonical eight-skill checkout', async () => {
  const result = await validateRepository(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.equal(result.skills.length, 8);
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

test('rejects a frontmatter name that differs from its directory', async () => {
  const root = await fixtureFromRepo();
  await writeFile(join(root, 'skills', 'github-hygiene', 'SKILL.md'), '---\nname: wrong\n---\n');
  const result = await validateRepository(root);
  assert.match(result.errors.join('\n'), /frontmatter name/i);
});
