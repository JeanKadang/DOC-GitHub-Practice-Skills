import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { repoRoot } from './helpers/markdown.mjs';

// Self-paced learners have no facilitator to tell them what access an exercise
// needs, what a good result looks like, or what to do when a step fails (#151).
// Every module with an exercise states all five, as bold labels.
export const EXERCISE_LABELS = ['Permissions', 'Starting state', 'Success state', 'Likely errors', 'Cleanup'];

// Modules that are reading only, with no exercise to run.
const READING_ONLY = new Set(['0.1', '3.5']);
const MODULE_FILE = /^module-(\d+)-(\d+)-.+\.md$/;

export function missingLabels(source) {
  return EXERCISE_LABELS.filter((label) => !source.includes(`**${label}:**`));
}

export function exerciseProblems(modules) {
  const problems = [];
  for (const module of modules) {
    if (READING_ONLY.has(module.id)) continue;
    const missing = missingLabels(module.source);
    if (missing.length > 0) problems.push(`${module.path} is missing: ${missing.join(', ')}`);
  }
  return problems;
}

async function loadModules() {
  const educationDir = join(repoRoot, 'education');
  const modules = [];
  for (const folder of (await readdir(educationDir, { withFileTypes: true })).filter((entry) => entry.isDirectory())) {
    for (const name of await readdir(join(educationDir, folder.name))) {
      const match = MODULE_FILE.exec(name);
      if (!match) continue;
      const path = `${folder.name}/${name}`;
      modules.push({ id: `${match[1]}.${match[2]}`, path, source: await readFile(join(educationDir, path), 'utf8') });
    }
  }
  return modules;
}

test('missingLabels names each absent label', () => {
  assert.deepEqual(missingLabels('**Permissions:** x\n**Cleanup:** y'), ['Starting state', 'Success state', 'Likely errors']);
});

test('a module without a Likely errors label is reported, and reading-only modules are skipped', () => {
  const full = EXERCISE_LABELS.map((label) => `**${label}:** x`).join('\n');
  const modules = [
    { id: '1.1', path: '1_beginners/module-1-1-a.md', source: full },
    { id: '1.3', path: '1_beginners/module-1-3-b.md', source: full.replace('**Likely errors:**', '') },
    { id: '3.5', path: '3_advanced/module-3-5-c.md', source: 'reading only' },
  ];
  assert.deepEqual(exerciseProblems(modules), ['1_beginners/module-1-3-b.md is missing: Likely errors']);
});

test('every module with an exercise states permissions, starting and success state, likely errors, and cleanup (#151)', async () => {
  const modules = await loadModules();
  assert.ok(modules.length >= 20, `expected the module files to be found, got ${modules.length}`);
  assert.deepEqual(exerciseProblems(modules), []);
});

test('no exercise tells every learner to push a branch with the same fixed name (#151)', async () => {
  const sharedNames = /git (?:checkout -b|switch -c|push -u origin) (?:conflict-[ab]|docs\/fix-readme-typo|docs\/add-contributor-line|docs\/adr-0001-postgresql)(?![-\w<])/;
  const offenders = (await loadModules()).filter((module) => sharedNames.test(module.source)).map((module) => module.path);
  assert.deepEqual(offenders, []);
});
