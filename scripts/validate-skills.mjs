import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

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

  const skills = Array.isArray(inventory.skills) ? inventory.skills : [];
  if (!Array.isArray(inventory.skills)) {
    errors.push('Skill inventory must contain a skills array.');
  }

  const registered = new Set(skills.map(({ name }) => name));
  let actualNames = [];
  try {
    actualNames = (await readdir(join(root, 'skills'), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('github-'))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    errors.push(`Cannot inspect skills directory: ${error.message}`);
  }

  for (const name of actualNames) {
    if (!registered.has(name)) {
      errors.push(`Unregistered skill directory: ${name}`);
    }
  }

  for (const skill of skills) {
    const skillRoot = join(root, 'skills', skill.name);
    if (!actualNames.includes(skill.name)) {
      errors.push(`Registered skill directory is missing: ${skill.name}`);
      continue;
    }

    for (const requiredFile of skill.requiredFiles ?? []) {
      if (!(await isFile(join(skillRoot, requiredFile)))) {
        errors.push(`Skill ${skill.name} is missing required file ${requiredFile}`);
      }
    }

    const skillPath = join(skillRoot, 'SKILL.md');
    if (await isFile(skillPath)) {
      try {
        const frontmatter = parseFrontmatter(await readFile(skillPath, 'utf8'));
        if (frontmatter?.name !== skill.name) {
          errors.push(`Skill ${skill.name} frontmatter name must match its directory.`);
        }
      } catch (error) {
        errors.push(`Skill ${skill.name} frontmatter is invalid: ${error.message}`);
      }
    }

    const metadataPath = join(skillRoot, 'agents', 'openai.yaml');
    if (await isFile(metadataPath)) {
      try {
        const metadata = parse(await readFile(metadataPath, 'utf8'));
        for (const field of ['display_name', 'short_description', 'default_prompt']) {
          const value = metadata?.interface?.[field];
          if (typeof value !== 'string' || value.trim() === '') {
            errors.push(`Skill ${skill.name} agents/openai.yaml requires non-empty interface.${field}`);
          }
        }
      } catch (error) {
        errors.push(`Skill ${skill.name} agents/openai.yaml is invalid: ${error.message}`);
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
