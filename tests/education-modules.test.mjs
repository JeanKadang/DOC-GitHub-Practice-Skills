import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { repoRoot } from './helpers/markdown.mjs';

// Education modules name their prerequisites in prose ("Anyone who's completed
// Modules 2.1 and 2.2") and the README lists every module in its Materials
// section. Both were wired by hand after the renumbering (#161) and verified by
// grep. These checks fail when a prerequisite names a module that does not
// exist, or a module file is missing from the README Materials list (#210).
const MODULE_FILE = /^module-(\d+)-(\d+)-.+\.md$/;
const MODULE_NUMBER = /\d+\.\d+/g;
// "Module 1.1", "Modules 1.1 and 1.2", "Modules 3.1, 3.2, and 3.4-3.6", "2.3 to 2.9".
const MODULE_REFERENCE = /Modules?\s+(\d+\.\d+(?:(?:\s*,\s*and\s+|\s*,\s*|\s+and\s+|\s+to\s+|\s*[-–]\s*)\d+\.\d+)*)/g;

// The Audience paragraph runs from its label to the next blank line or the next
// bold label (the Format line follows it with no blank line between).
export function audienceParagraph(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith('**Audience:**'));
  if (start === -1) return '';
  const collected = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || line.startsWith('**')) break;
    collected.push(line);
  }
  return collected.join(' ');
}

export function namedModules(paragraph) {
  const named = new Set();
  for (const match of paragraph.matchAll(MODULE_REFERENCE)) {
    for (const number of match[1].match(MODULE_NUMBER)) named.add(number);
  }
  return [...named];
}

export function prerequisiteProblems(modules) {
  const existing = new Set(modules.map((module) => module.id));
  const problems = [];
  for (const module of modules) {
    for (const id of namedModules(audienceParagraph(module.source))) {
      if (!existing.has(id)) {
        problems.push(`${module.path} names Module ${id}, which does not exist`);
      }
    }
  }
  return problems;
}

export function missingFromMaterials(readme, paths) {
  const section = readme.slice(readme.indexOf('\n## Materials'));
  return paths.filter((path) => !section.includes(`(${path})`));
}

async function loadModules() {
  const educationDir = join(repoRoot, 'education');
  const modules = [];
  for (const folder of (await readdir(educationDir, { withFileTypes: true })).filter((entry) => entry.isDirectory())) {
    for (const name of await readdir(join(educationDir, folder.name))) {
      const match = MODULE_FILE.exec(name);
      if (!match) continue;
      const path = `${folder.name}/${name}`;
      modules.push({
        id: `${match[1]}.${match[2]}`,
        path,
        source: await readFile(join(educationDir, path), 'utf8'),
      });
    }
  }
  return modules;
}

test('audienceParagraph stops at the next label, and namedModules reads lists and ranges', () => {
  const source = [
    '**Audience:** Anyone who has done Modules 1.1 and 1.2, or Module 2.1.',
    'Optional, and independent of Modules 3.1, 3.2, and 3.4-3.6.',
    '**Format:** Mentions Module 9.9, which is outside the audience paragraph.',
  ].join('\n');
  const named = namedModules(audienceParagraph(source));
  assert.deepEqual(named.sort(), ['1.1', '1.2', '2.1', '3.1', '3.2', '3.4', '3.6']);
});

test('a prerequisite that names a nonexistent module is reported', () => {
  const modules = [
    { id: '1.1', path: '1_beginners/module-1-1-a.md', source: '**Audience:** Anyone.\n' },
    { id: '2.1', path: '2_intermediate/module-2-1-b.md', source: '**Audience:** Anyone who has done Modules 1.1 and 1.7.\n' },
  ];
  assert.deepEqual(prerequisiteProblems(modules), [
    '2_intermediate/module-2-1-b.md names Module 1.7, which does not exist',
  ]);
});

test('a module file missing from the README Materials list is reported', () => {
  const readme = '# T\n\n## Where do I start?\n\n(1_beginners/module-1-3-x.md)\n\n## Materials\n\n- [A](1_beginners/module-1-1-a.md)\n';
  assert.deepEqual(
    missingFromMaterials(readme, ['1_beginners/module-1-1-a.md', '1_beginners/module-1-3-x.md']),
    ['1_beginners/module-1-3-x.md'],
  );
});

test('every education prerequisite names a module that exists (#210)', async () => {
  assert.deepEqual(prerequisiteProblems(await loadModules()), []);
});

test('the README Materials list names every module file (#210)', async () => {
  const modules = await loadModules();
  assert.ok(modules.length >= 20, `expected the module files to be found, got ${modules.length}`);
  const readme = await readFile(join(repoRoot, 'education', 'README.md'), 'utf8');
  assert.deepEqual(missingFromMaterials(readme, modules.map((module) => module.path)), []);
});
