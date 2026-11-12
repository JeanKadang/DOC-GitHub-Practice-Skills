import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import test from 'node:test';

import { repoRoot, stripFences } from './helpers/markdown.mjs';

// The installer copies only skills/<name>/ into a consumer's home (#356). A
// skill that links or names a file elsewhere in this repository points at
// nothing once installed.
const skillsRoot = join(repoRoot, 'skills');
const thisRepoOnlyRoots = ['education/', 'contracts/', 'scripts/install-skills', 'tests/helpers/'];

async function skillMarkdownFiles() {
  const files = [];
  for (const skill of await readdir(skillsRoot, { withFileTypes: true })) {
    if (!skill.isDirectory()) continue;
    const pending = [join(skillsRoot, skill.name)];
    while (pending.length > 0) {
      const directory = pending.pop();
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) pending.push(path);
        else if (entry.name.endsWith('.md')) files.push({ path, skillDir: join(skillsRoot, skill.name) });
      }
    }
  }
  return files;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

test('skill Markdown links stay inside the installed skill directory (#356)', async () => {
  const problems = [];
  for (const { path, skillDir } of await skillMarkdownFiles()) {
    const source = stripFences(await readFile(path, 'utf8'));
    for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
      const resolved = resolve(dirname(path), target.split('#')[0]);
      const inside = resolved === skillDir || resolved.startsWith(skillDir + sep);
      if (!inside || !(await exists(resolved))) {
        problems.push(`${relative(repoRoot, path)}: ${target}`);
      }
    }
  }
  assert.deepEqual(problems, [], `links that break once installed:\n${problems.join('\n')}`);
});

test('skill Markdown names no path that exists only in this repository (#356)', async () => {
  const problems = [];
  for (const { path } of await skillMarkdownFiles()) {
    const source = stripFences(await readFile(path, 'utf8'));
    for (const match of source.matchAll(/`([^`\n]+)`/g)) {
      if (thisRepoOnlyRoots.some((root) => match[1].startsWith(root))) {
        problems.push(`${relative(repoRoot, path)}: ${match[1]}`);
      }
    }
  }
  assert.deepEqual(problems, [], `this-repository-only paths in skills:\n${problems.join('\n')}`);
});

test('the portability check catches a this-repository-only path (#356)', () => {
  const sample = 'see `education/0_prerequisites/module-0-1.md` for more';
  assert.ok([...sample.matchAll(/`([^`\n]+)`/g)].some((m) => thisRepoOnlyRoots.some((root) => m[1].startsWith(root))));
});
