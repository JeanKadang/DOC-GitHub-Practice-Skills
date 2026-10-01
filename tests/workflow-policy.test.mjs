import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { findMarkdownFiles, repoRoot as markdownRoot } from './helpers/markdown.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const policyFiles = [
  'skills/github-hygiene/SKILL.md',
  'skills/github-issue-first/SKILL.md',
  'skills/github-repo-bootstrap/SKILL.md',
  'CONTRIBUTING.md',
  'docs/WORKFLOW.md',
  'docs/GUIDE.md',
  'docs/MAINTAINING.md',
];
const falseOpenAssurance =
  /(?:Refs #N\s+(?:guarantees?|ensures?|keeps?)[\s\S]{0,80}(?:issue )?(?:open|stays open|remains open)|the PR may merge, but the issue (?:stays|remains) open)/i;

async function policyText(relativePath) {
  return readFile(join(repoRoot, relativePath), 'utf8');
}

test('connected-branch guidance preserves acceptance gates after merge', async () => {
  for (const relativePath of policyFiles) {
    const content = await policyText(relativePath);
    assert.match(content, /Refs #N/i, `${relativePath} must describe Refs #N`);
    assert.match(
      content,
      /Refs #N[\s\S]{0,180}(?:does not|doesn't|cannot) guarantee[\s\S]{0,120}(?:open|stays open)[\s\S]{0,120}connected (?:development )?branch/i,
      `${relativePath} must say a connected branch can defeat Refs open-state intent`,
    );
    assert.match(
      content,
      /after (?:every )?merge[\s\S]{0,300}(?:audit|verify)[\s\S]{0,120}(?:issue )?state[\s\S]{0,120}(?:issue )?body/i,
      `${relativePath} must require a post-merge state-and-body audit`,
    );
    assert.match(
      content,
      /(?:unchecked|unmet|unevaluated)[\s\S]{0,220}reopen/i,
      `${relativePath} must require reopening an issue whose acceptance gate has not passed`,
    );
  }
});

test('policy never claims Refs guarantees an issue remains open', async () => {
  for (const relativePath of policyFiles) {
    const content = await policyText(relativePath);
    assert.doesNotMatch(
      content,
      falseOpenAssurance,
      `${relativePath} must not promise that Refs controls issue state`,
    );
  }
});

test('false assurance detector rejects the former merge claim', () => {
  assert.match('The PR may merge, but the issue stays open.', falseOpenAssurance);
});

// Release notes (#147): the skillset's generated notes list merged pull
// requests, so education-only pull requests must be labelled and excluded.
test('release notes exclude education-only pull requests and the label is copied from the issue (#147)', async () => {
  const releaseConfig = await readFile(join(repoRoot, '.github', 'release.yml'), 'utf8');
  const excludeBlock = /exclude:\s*\r?\n\s*labels:\s*\r?\n((?:\s*-\s*\S+\r?\n)+)/.exec(releaseConfig);
  assert.ok(excludeBlock, 'release.yml must have changelog.exclude.labels');
  assert.match(excludeBlock[1], /-\s*education\b/);
  const labeler = await readFile(
    join(repoRoot, '.github', 'workflows', 'label-pr-from-issue.yml'),
    'utf8',
  );
  assert.match(labeler, /allowed_categories="[^"]*\beducation\b[^"]*"/);
  const maintaining = await readFile(join(repoRoot, 'docs', 'MAINTAINING.md'), 'utf8');
  assert.match(maintaining.replace(/\s+/g, ' '), /must carry the `education` label/);
});

// The closure-safety wording used to be scanned in seven files. A false claim
// that Refs keeps an issue open can appear in any lesson or skill, so scan every
// published Markdown file. docs/review holds point-in-time reports, docs/adr
// records past decisions (ADR 0001 quotes the claim it corrected), and
// docs/superpowers holds unlinted planning artifacts (#137).
test('no published Markdown promises that Refs keeps an issue open (#129)', async () => {
  const skipped = ['docs/review/', 'docs/adr/'];
  const offenders = [];
  for (const file of await findMarkdownFiles()) {
    const relativePath = relative(markdownRoot, file).split(sep).join('/');
    if (skipped.some((prefix) => relativePath.startsWith(prefix))) continue;
    if (falseOpenAssurance.test(await readFile(file, 'utf8'))) offenders.push(relativePath);
  }
  assert.deepEqual(offenders, [], `files that promise Refs controls issue state: ${offenders.join(', ')}`);
});
