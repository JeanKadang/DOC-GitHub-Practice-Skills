import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { CANONICAL_SKILLS } from '../scripts/validate-skills.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function sortedNames(list) {
  return list.map(({ name }) => name).sort();
}

function sortedRequiredFiles(files) {
  return [...files].sort();
}

function byName(list) {
  return new Map(list.map((skill) => [skill.name, skill.requiredFiles]));
}

function parsePowerShellRoster(source) {
  const blockMatch = source.match(/\$canonicalRequiredFiles = \[ordered\]@\{\r?\n([\s\S]*?)\r?\n\}/);
  if (!blockMatch) {
    throw new Error('Could not locate $canonicalRequiredFiles block in install-skills.ps1');
  }

  const lineRegex = /^\s*'([^']+)'\s*=\s*@\(([^)]*)\)\s*$/gm;
  const roster = [];
  let match;
  while ((match = lineRegex.exec(blockMatch[1])) !== null) {
    const [, name, itemsRaw] = match;
    const requiredFiles = [...itemsRaw.matchAll(/'([^']*)'/g)].map(([, item]) => item);
    roster.push({ name, requiredFiles });
  }
  return roster;
}

test('canonical skill roster agrees across skill-inventory.json, validate-skills.mjs, and install-skills.ps1', async () => {
  const inventory = JSON.parse(
    await readFile(join(repoRoot, 'contracts', 'skill-inventory.json'), 'utf8'),
  );
  const installerSource = await readFile(join(repoRoot, 'scripts', 'install-skills.ps1'), 'utf8');
  const installerRoster = parsePowerShellRoster(installerSource);

  assert.deepEqual(
    sortedNames(inventory.skills),
    sortedNames(CANONICAL_SKILLS),
    'contracts/skill-inventory.json names diverge from validate-skills.mjs CANONICAL_SKILLS',
  );
  assert.deepEqual(
    sortedNames(installerRoster),
    sortedNames(CANONICAL_SKILLS),
    'install-skills.ps1 $canonicalRequiredFiles names diverge from validate-skills.mjs CANONICAL_SKILLS',
  );

  const inventoryByName = byName(inventory.skills);
  const installerByName = byName(installerRoster);

  for (const canonical of CANONICAL_SKILLS) {
    assert.deepEqual(
      sortedRequiredFiles(inventoryByName.get(canonical.name) ?? []),
      sortedRequiredFiles(canonical.requiredFiles),
      `contracts/skill-inventory.json requiredFiles for ${canonical.name} diverge from CANONICAL_SKILLS`,
    );
    assert.deepEqual(
      sortedRequiredFiles(installerByName.get(canonical.name) ?? []),
      sortedRequiredFiles(canonical.requiredFiles),
      `install-skills.ps1 requiredFiles for ${canonical.name} diverge from CANONICAL_SKILLS`,
    );
  }
});
