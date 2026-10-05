import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

import { repoRoot } from './helpers/markdown.mjs';

// docs/superpowers holds historical plans and specs that the other Markdown
// checks skip (#137). Its README is the only guard: it must list every file and
// every link in it must resolve.
const directory = join(repoRoot, 'docs', 'superpowers');

export function indexedTargets(readme) {
  return [...readme.matchAll(/\]\(([^)#\s]+\.md)\)/g)]
    .map((match) => match[1])
    .filter((target) => !/^[a-z][a-z0-9+.-]*:/i.test(target));
}

test('indexedTargets reads relative Markdown link targets only', () => {
  const text = '| [spec](specs/a.md) | [plan](plans/b.md#x) | [site](https://example.test/c.md) |';
  assert.deepEqual(indexedTargets(text), ['specs/a.md']);
});

test('the superpowers README lists every plan and spec and every link resolves (#137)', async () => {
  const readme = await readFile(join(directory, 'README.md'), 'utf8');
  const targets = indexedTargets(readme);
  const missingFiles = [];
  for (const target of targets) {
    try {
      await readFile(resolve(directory, target));
    } catch {
      missingFiles.push(target);
    }
  }
  assert.deepEqual(missingFiles, [], `links that do not resolve: ${missingFiles.join(', ')}`);

  const listed = new Set(targets.map((target) => resolve(directory, target)));
  const unlisted = [];
  for (const folder of ['plans', 'specs']) {
    for (const name of await readdir(join(directory, folder))) {
      if (name.endsWith('.md') && !listed.has(join(directory, folder, name))) unlisted.push(`${folder}/${name}`);
    }
  }
  assert.deepEqual(unlisted, [], `files missing from the index: ${unlisted.join(', ')}`);
});

test('the superpowers README says the files are historical (#137)', async () => {
  const readme = await readFile(join(directory, 'README.md'), 'utf8');
  assert.match(readme, /\*\*historical\*\*/);
  assert.match(readme, /shipped result wins/);
});

test('every ADR citation of a superpowers file points at a file that exists (#137)', async () => {
  const adrDirectory = join(repoRoot, 'docs', 'adr');
  const broken = [];
  for (const name of await readdir(adrDirectory)) {
    if (!name.endsWith('.md')) continue;
    const text = await readFile(join(adrDirectory, name), 'utf8');
    for (const match of text.matchAll(/docs\/superpowers\/((?:plans|specs)\/[\w.-]+\.md)/g)) {
      try {
        await readFile(join(directory, match[1]));
      } catch {
        broken.push(`${name}: ${match[1]}`);
      }
    }
  }
  assert.deepEqual(broken, []);
});
