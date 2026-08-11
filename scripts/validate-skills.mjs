import { readFile, readdir, stat } from 'node:fs/promises';
import { join, posix, resolve, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

export const CANONICAL_SKILLS = [
  { name: 'github-for-ado-users', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
  { name: 'github-hygiene', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
  { name: 'github-issue-first', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
  { name: 'github-pr-review', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
  { name: 'github-projects', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
  { name: 'github-repo-bootstrap', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
  {
    name: 'github-repo-review',
    requiredFiles: ['SKILL.md', 'agents/openai.yaml', 'review-prompt.md'],
  },
  { name: 'github-security-response', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
];

const CANONICAL_NAMES = CANONICAL_SKILLS.map(({ name }) => name);

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error('missing YAML frontmatter');
  }
  return parse(match[1]);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSafeRelativePath(path) {
  return (
    typeof path === 'string' &&
    path.length > 0 &&
    !path.includes('\\') &&
    !posix.isAbsolute(path) &&
    !win32.isAbsolute(path) &&
    win32.parse(path).root === '' &&
    posix.normalize(path) === path &&
    path !== '.' &&
    !path.startsWith('../')
  );
}

export async function validateRepository(root = process.cwd()) {
  const errors = [];
  const warnings = [];
  const inventoryPath = join(root, 'contracts', 'skill-inventory.json');
  let inventory;

  try {
    inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  } catch (error) {
    errors.push(`Cannot load skill inventory: ${error.message}`);
    return { errors, warnings, skills: [] };
  }

  if (!isObject(inventory)) {
    errors.push('Skill inventory must be a JSON object.');
    return { errors, warnings, skills: [] };
  }
  if (inventory.schemaVersion !== 1) {
    errors.push('Skill inventory schemaVersion must be 1.');
  }

  try {
    const packageData = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    if (
      typeof inventory.packageVersion !== 'string' ||
      inventory.packageVersion.length === 0 ||
      inventory.packageVersion !== packageData.version
    ) {
      errors.push('Skill inventory packageVersion must match package.json version.');
    }
  } catch (error) {
    errors.push(`Cannot validate skill inventory packageVersion: ${error.message}`);
  }

  const skills = Array.isArray(inventory.skills) ? inventory.skills : [];
  if (!Array.isArray(inventory.skills)) {
    errors.push('Skill inventory must contain a skills array.');
  }

  const validEntries = [];
  const registeredNames = [];
  const seenNames = new Set();
  for (const [index, skill] of skills.entries()) {
    if (!isObject(skill)) {
      errors.push(`Inventory skill entry at index ${index} must be an object.`);
      continue;
    }
    if (typeof skill.name !== 'string' || skill.name.length === 0) {
      errors.push(`Inventory skill entry at index ${index} must have a non-empty string name.`);
      continue;
    }
    registeredNames.push(skill.name);
    if (seenNames.has(skill.name)) {
      errors.push(`Duplicate skill name in inventory: ${skill.name}`);
    }
    seenNames.add(skill.name);

    if (!Array.isArray(skill.requiredFiles)) {
      errors.push(`Inventory skill ${skill.name} requiredFiles must be an array.`);
      validEntries.push({ name: skill.name, requiredFiles: [] });
      continue;
    }

    const safeFiles = [];
    const seenFiles = new Set();
    for (const requiredFile of skill.requiredFiles) {
      if (!isSafeRelativePath(requiredFile)) {
        errors.push(`Skill ${skill.name} has unsafe required file path: ${String(requiredFile)}`);
        continue;
      }
      if (seenFiles.has(requiredFile)) {
        errors.push(`Skill ${skill.name} has duplicate required file path: ${requiredFile}`);
        continue;
      }
      seenFiles.add(requiredFile);
      safeFiles.push(requiredFile);
    }
    validEntries.push({ name: skill.name, requiredFiles: safeFiles });
  }

  const uniqueRegisteredNames = [...new Set(registeredNames)].sort();
  if (
    uniqueRegisteredNames.length !== CANONICAL_NAMES.length ||
    uniqueRegisteredNames.some((name, index) => name !== CANONICAL_NAMES[index])
  ) {
    errors.push(`Inventory must contain exactly the canonical skill names: ${CANONICAL_NAMES.join(', ')}`);
  }

  const canonicalByName = new Map(CANONICAL_SKILLS.map((skill) => [skill.name, skill]));
  for (const skill of validEntries) {
    const canonical = canonicalByName.get(skill.name);
    if (!canonical) {
      continue;
    }
    for (const mandatoryFile of canonical.requiredFiles) {
      if (!skill.requiredFiles.includes(mandatoryFile)) {
        errors.push(`Skill ${skill.name} inventory is missing mandatory required file ${mandatoryFile}.`);
      }
    }
  }

  let actualNames = [];
  try {
    actualNames = (await readdir(join(root, 'skills'), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('github-'))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    errors.push(`Cannot inspect skills directory: ${error.message}`);
  }

  const canonicalNameSet = new Set(CANONICAL_NAMES);
  for (const name of actualNames) {
    if (!canonicalNameSet.has(name)) {
      errors.push(`Unregistered skill directory: ${name}`);
    }
  }

  const entriesByName = new Map(validEntries.map((skill) => [skill.name, skill]));
  for (const canonical of CANONICAL_SKILLS) {
    const skillRoot = join(root, 'skills', canonical.name);
    if (!actualNames.includes(canonical.name)) {
      errors.push(`Registered skill directory is missing: ${canonical.name}`);
      continue;
    }

    const checkedFiles = new Set();
    for (const requiredFile of canonical.requiredFiles) {
      checkedFiles.add(requiredFile);
      if (!(await isFile(join(skillRoot, requiredFile)))) {
        errors.push(`Skill ${canonical.name} is missing mandatory file ${requiredFile}`);
      }
    }
    for (const requiredFile of entriesByName.get(canonical.name)?.requiredFiles ?? []) {
      if (!checkedFiles.has(requiredFile) && !(await isFile(join(skillRoot, requiredFile)))) {
        errors.push(`Skill ${canonical.name} is missing required file ${requiredFile}`);
      }
    }

    const skillPath = join(skillRoot, 'SKILL.md');
    if (await isFile(skillPath)) {
      try {
        const frontmatter = parseFrontmatter(await readFile(skillPath, 'utf8'));
        if (frontmatter?.name !== canonical.name) {
          errors.push(`Skill ${canonical.name} frontmatter name must match its directory.`);
        }
      } catch (error) {
        errors.push(`Skill ${canonical.name} frontmatter is invalid: ${error.message}`);
      }
    }

    const metadataPath = join(skillRoot, 'agents', 'openai.yaml');
    if (await isFile(metadataPath)) {
      try {
        const metadata = parse(await readFile(metadataPath, 'utf8'));
        for (const field of ['display_name', 'short_description', 'default_prompt']) {
          const value = metadata?.interface?.[field];
          if (typeof value !== 'string' || value.trim() === '') {
            errors.push(
              `Skill ${canonical.name} agents/openai.yaml requires non-empty interface.${field}`,
            );
          }
        }
      } catch (error) {
        errors.push(`Skill ${canonical.name} agents/openai.yaml is invalid: ${error.message}`);
      }
    }
  }

  return { errors, warnings, skills };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await validateRepository();
  for (const error of result.errors) {
    console.error(`ERROR: ${error}`);
  }
  for (const warning of result.warnings) {
    console.warn(`WARNING: ${warning}`);
  }
  console.log(
    `Validated ${result.skills.length} skills: ${result.errors.length} errors, ${result.warnings.length} warnings.`,
  );
  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}
