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

// Form field types and the completion contract (#145). GitHub accepts only these
// field types; a typo makes the whole form fail to render. The portable forms
// collect an expected outcome (not acceptance criteria) from the reporter, and
// the triage step turns it into criteria, so the field must be required.
const FIELD_TYPES = new Set(['markdown', 'textarea', 'input', 'dropdown', 'checkboxes']);

export function formProblems(doc) {
  const problems = [];
  const ids = new Set();
  for (const [index, field] of doc.body.entries()) {
    if (!FIELD_TYPES.has(field.type)) problems.push(`body[${index}] has unknown type "${field.type}"`);
    if (field.id !== undefined) {
      if (ids.has(field.id)) problems.push(`duplicate id "${field.id}"`);
      ids.add(field.id);
    }
    if (field.type !== 'markdown' && field.id === undefined) problems.push(`body[${index}] has no id`);
    if (field.type === 'dropdown' && !(Array.isArray(field.attributes?.options) && field.attributes.options.length > 0)) {
      problems.push(`dropdown "${field.id}" has no options`);
    }
  }
  return problems;
}

export function contractField(doc, id) {
  return doc.body.find((field) => field.id === id && field.type === 'textarea' && field.validations?.required === true);
}

test('formProblems flags an unknown type, a duplicate id, a missing id, and an empty dropdown', () => {
  const form = {
    body: [
      { type: 'textbox', id: 'a', attributes: { label: 'A' } },
      { type: 'textarea', id: 'b', attributes: { label: 'B' } },
      { type: 'textarea', id: 'b', attributes: { label: 'B2' } },
      { type: 'input', attributes: { label: 'C' } },
      { type: 'dropdown', id: 'd', attributes: { label: 'D', options: [] } },
    ],
  };
  assert.deepEqual(formProblems(form), [
    'body[0] has unknown type "textbox"',
    'duplicate id "b"',
    'body[3] has no id',
    'dropdown "d" has no options',
  ]);
});

test('contractField finds only a required textarea with the given id', () => {
  const doc = { body: [{ type: 'textarea', id: 'x', validations: { required: false } }, { type: 'input', id: 'y', validations: { required: true } }] };
  assert.equal(contractField(doc, 'x'), undefined);
  assert.equal(contractField(doc, 'y'), undefined);
  assert.ok(contractField({ body: [{ type: 'textarea', id: 'x', validations: { required: true } }] }, 'x'));
});

test('bundled issue forms use valid field types and collect a required expected outcome (#145)', async () => {
  const templates = join(repoRoot, 'skills', 'github-repo-configure', 'templates');
  const bug = parse(await readFile(join(templates, 'bug.yml'), 'utf8'));
  const improvement = parse(await readFile(join(templates, 'improvement.yml'), 'utf8'));
  for (const [name, doc] of [['bug.yml', bug], ['improvement.yml', improvement]]) {
    assert.deepEqual(formProblems(doc), [], `${name} has invalid fields`);
  }
  assert.ok(contractField(bug, 'expected'), 'bug.yml must require an Expected behavior field');
  assert.ok(contractField(improvement, 'outcome'), 'improvement.yml must require an Expected outcome field');
  for (const doc of [bug, improvement]) {
    const field = contractField(doc, doc === bug ? 'expected' : 'outcome');
    assert.match(field.attributes.description, /acceptance criteria when triaging/);
  }
});

test('the skills make the triage step explicit (#145)', async () => {
  const configure = await readFile(join(repoRoot, 'skills', 'github-repo-configure', 'SKILL.md'), 'utf8');
  const issueFirst = await readFile(join(repoRoot, 'skills', 'github-issue-first', 'SKILL.md'), 'utf8');
  assert.match(configure, /expected outcome/i);
  assert.match(configure, /Turning that outcome into observable acceptance\s+criteria is a triage step/);
  assert.match(issueFirst, /gets its criteria at\s+triage/);
});
