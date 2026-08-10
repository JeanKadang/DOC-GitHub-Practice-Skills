import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

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
      /Refs #N\s+(?:guarantees?|ensures?|keeps?)[\s\S]{0,80}(?:issue )?(?:open|stays open|remains open)/i,
      `${relativePath} must not promise that Refs controls issue state`,
    );
  }
});
