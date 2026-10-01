import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { CANONICAL_SKILLS } from '../scripts/validate-skills.mjs';
import { repoRoot } from './helpers/markdown.mjs';

const skillNames = CANONICAL_SKILLS.map(({ name }) => name);

async function read(relativePath) {
  return readFile(join(repoRoot, relativePath), 'utf8');
}

/** Names from `names` that `text` never mentions. */
export function missingNames(text, names) {
  return names.filter((name) => !text.includes(name));
}

// The roster is hardcoded in three places (inventory, validator, installer) and
// roster-consistency.test.mjs keeps those equal. It is also listed by hand on
// every surface a reader or an agent starts from, and a skill added to the
// three but not these is invisible there (#129).
const ROSTER_SURFACES = [
  'README.md',
  'AGENTS.md',
  'docs/GUIDE.md',
  'docs/chatgpt.md',
  '.github/ISSUE_TEMPLATE/bug.yml',
  '.github/ISSUE_TEMPLATE/improvement.yml',
];

test('missingNames reports a seeded omission', () => {
  assert.deepEqual(missingNames('github-hygiene github-releases', ['github-hygiene', 'github-projects']), [
    'github-projects',
  ]);
});

for (const surface of ROSTER_SURFACES) {
  test(`${surface} names every canonical skill`, async () => {
    assert.deepEqual(missingNames(await read(surface), skillNames), []);
  });
}

// Version stamps (#129). The skillset version lives in package.json; the docs
// that carry a stamp must agree with it. SECURITY.md names the latest
// *published* release, which may lag the package version between a version bump
// and the tag, so it may be older but never newer.
export function parseVersion(text) {
  const match = /v?(\d+)\.(\d+)\.(\d+)/.exec(text);
  return match ? match.slice(1).map(Number) : null;
}

export function compareVersions(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

test('compareVersions orders versions', () => {
  assert.equal(compareVersions([0, 3, 0], [0, 3, 0]), 0);
  assert.equal(compareVersions([0, 2, 9], [0, 3, 0]), -1);
  assert.equal(compareVersions([0, 4, 0], [0, 3, 9]), 1);
});

test('policy documents carry the package version', async () => {
  const packageVersion = parseVersion(JSON.parse(await read('package.json')).version);
  const stamps = [
    ['docs/GUIDE.md', /\*\*Policy version:\*\*\s*(\S+)/],
    ['docs/MAINTAINING.md', /\*\*Applies to:\*\*\s*(\S+)/],
    ['docs/WORKFLOW.md', /\*\*Applies to:\*\*\s*(\S+)/],
  ];
  for (const [file, pattern] of stamps) {
    const match = pattern.exec(await read(file));
    assert.ok(match, `${file} must carry a version stamp`);
    assert.equal(
      compareVersions(parseVersion(match[1]), packageVersion),
      0,
      `${file} says ${match[1]} but package.json says ${packageVersion.join('.')}`,
    );
  }
});

test('SECURITY.md names a published release no newer than the package version', async () => {
  const packageVersion = parseVersion(JSON.parse(await read('package.json')).version);
  const match = /latest published release is (v?\d+\.\d+\.\d+)/.exec(await read('SECURITY.md'));
  assert.ok(match, 'SECURITY.md must name the latest published release');
  assert.notEqual(
    compareVersions(parseVersion(match[1]), packageVersion),
    1,
    `SECURITY.md names ${match[1]}, newer than package.json ${packageVersion.join('.')}`,
  );
});

// Release-note labels (#129, #134): .github/release.yml groups notes by label,
// and the label-copy workflow only copies labels that release.yml groups. A
// category with no matching entry in the workflow's allow-list never reaches a
// pull request, so its notes fall into "Other".
export function releaseCategoryLabels(releaseYaml) {
  const labels = new Set();
  const categories = releaseYaml.split(/\r?\n\s*categories:\s*\r?\n/)[1] ?? '';
  for (const match of categories.matchAll(/^\s*-\s+(?!title:)["']?([^"'\s]+)["']?\s*$/gm)) {
    if (match[1] !== '*') labels.add(match[1]);
  }
  return [...labels].sort();
}

export function workflowAllowedCategories(workflowYaml) {
  const match = /allowed_categories="([^"]*)"/.exec(workflowYaml);
  return match ? match[1].split(/\s+/).filter(Boolean).sort() : [];
}

test('releaseCategoryLabels and workflowAllowedCategories parse seeded input', () => {
  const yaml = [
    'changelog:',
    '  exclude:',
    '    labels:',
    '      - ignore-for-release',
    '  categories:',
    '    - title: Fixes',
    '      labels:',
    '        - bug',
    '    - title: Other',
    '      labels:',
    '        - "*"',
  ].join('\n');
  assert.deepEqual(releaseCategoryLabels(yaml), ['bug']);
  assert.deepEqual(workflowAllowedCategories('allowed_categories="bug enhancement"'), ['bug', 'enhancement']);
});

test('every release-note category label is copied by the label workflow', async () => {
  const categories = releaseCategoryLabels(await read('.github/release.yml'));
  const allowed = new Set(workflowAllowedCategories(await read('.github/workflows/label-pr-from-issue.yml')));
  assert.ok(categories.length > 0, 'release.yml must define categories');
  const missing = categories.filter((label) => !allowed.has(label));
  assert.deepEqual(missing, [], `categories not in the label workflow allow-list: ${missing.join(', ')}`);
});

// ChatGPT Custom GPT Knowledge accepts at most 20 files (ADR 0006, and
// docs/chatgpt.md). The export is one file per required skill file, so adding a
// skill or a bundled file can push it past the limit without any other check
// noticing (#129). The provenance files (LICENSE, manifest.json) are optional
// to upload and are not counted against the limit.
export const CHATGPT_KNOWLEDGE_FILE_LIMIT = 20;

export function chatGPTExportFileCount(skills) {
  return skills.reduce(
    (total, skill) => total + skill.requiredFiles.filter((file) => file !== 'agents/openai.yaml').length,
    0,
  );
}

test('chatGPTExportFileCount skips the Codex sidecar', () => {
  assert.equal(
    chatGPTExportFileCount([
      { name: 'a', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
      { name: 'b', requiredFiles: ['SKILL.md', 'agents/openai.yaml', 'x.md'] },
    ]),
    3,
  );
});

test('the ChatGPT export stays within the 20-file Knowledge limit', async () => {
  const inventory = JSON.parse(await read('contracts/skill-inventory.json'));
  const count = chatGPTExportFileCount(inventory.skills);
  assert.ok(
    count <= CHATGPT_KNOWLEDGE_FILE_LIMIT,
    `the export is ${count} files, over ChatGPT's ${CHATGPT_KNOWLEDGE_FILE_LIMIT}-file Knowledge limit (ADR 0006)`,
  );
});
