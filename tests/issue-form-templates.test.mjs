import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import test from 'node:test';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

async function findTemplateYamlFiles() {
  const skillsRoot = join(repoRoot, 'skills');
  const files = [];
  for (const skillEntry of await readdir(skillsRoot, { withFileTypes: true })) {
    if (!skillEntry.isDirectory()) continue;
    const templatesDir = join(skillsRoot, skillEntry.name, 'templates');
    let templateEntries;
    try {
      templateEntries = await readdir(templatesDir, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const templateEntry of templateEntries) {
      if (templateEntry.isFile() && templateEntry.name.endsWith('.yml')) {
        files.push(join(templatesDir, templateEntry.name));
      }
    }
  }
  return files;
}

test('every bundled templates/*.yml file is valid YAML', async () => {
  const files = await findTemplateYamlFiles();
  assert.ok(files.length > 0, 'expected at least one bundled templates/*.yml file to exist');

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotThrow(() => parse(source), `${file} must be valid YAML`);
  }
});

test('every bundled GitHub issue-form template has the required shape', async () => {
  const files = await findTemplateYamlFiles();
  let issueFormCount = 0;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const doc = parse(source);

    // Only files with a top-level `body` array are GitHub issue forms
    // (e.g. bug.yml, improvement.yml) - a sibling like config.yml is a
    // different, non-issue-form shape and is skipped here.
    if (!Array.isArray(doc.body)) continue;
    issueFormCount += 1;

    assert.equal(typeof doc.name, 'string', `${file}: top-level "name" must be a string`);
    assert.ok(doc.name.length > 0, `${file}: top-level "name" must not be empty`);
    assert.equal(typeof doc.description, 'string', `${file}: top-level "description" must be a string`);
    assert.ok(doc.body.length > 0, `${file}: "body" must have at least one field`);

    for (const [index, field] of doc.body.entries()) {
      assert.equal(typeof field.type, 'string', `${file}: body[${index}] must have a string "type"`);
      assert.ok(
        field.attributes && typeof field.attributes.label === 'string' && field.attributes.label.length > 0,
        `${file}: body[${index}] (type "${field.type}") must have a non-empty attributes.label`,
      );
    }
  }

  assert.ok(issueFormCount > 0, 'expected at least one bundled file to be a GitHub issue form (have a "body" array)');
});
