import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { repoRoot } from './helpers/markdown.mjs';

// github-repo-bootstrap names actions on GitHub state in four sections. Each
// carries a command example so an agent does not recall `gh` and `gh api` calls
// from memory, and every write is preceded by a read of the state it changes
// (#251).
const SECTIONS = [
  '6. Repository and Actions settings',
  '7. Security settings',
  '8. CI first, ruleset second',
  '10. Post-bootstrap API audit',
];
const READ_FIRST = SECTIONS.slice(0, 3);
const WRITE = /^gh (repo edit|api -X (PUT|PATCH|POST))\b/;

export function sectionBody(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const next = rest.findIndex((line) => /^## /.test(line));
  return (next === -1 ? rest : rest.slice(0, next)).join('\n');
}

export function ghLines(body) {
  const lines = [];
  let inBash = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^```bash\s*$/.test(line)) inBash = true;
    else if (/^```\s*$/.test(line)) inBash = false;
    else if (inBash && /^gh /.test(line)) lines.push(line);
  }
  return lines;
}

export function readsBeforeWrites(commands) {
  const firstWrite = commands.findIndex((line) => WRITE.test(line));
  if (firstWrite === -1) return { hasWrite: false, ok: true };
  return { hasWrite: true, ok: commands.slice(0, firstWrite).some((line) => !WRITE.test(line)) };
}

test('ghLines reads only gh lines inside bash fences', () => {
  const body = 'text\n```bash\n# note\ngh repo view\nls\n```\ngh not-in-fence\n```powershell\ngh no\n```\n';
  assert.deepEqual(ghLines(body), ['gh repo view']);
});

test('readsBeforeWrites needs a read ahead of the first write', () => {
  assert.deepEqual(readsBeforeWrites(['gh repo view', 'gh repo edit --x']), { hasWrite: true, ok: true });
  assert.deepEqual(readsBeforeWrites(['gh repo edit --x', 'gh repo view']), { hasWrite: true, ok: false });
  assert.deepEqual(readsBeforeWrites(['gh api -X PUT a']), { hasWrite: true, ok: false });
  assert.deepEqual(readsBeforeWrites(['gh repo view']), { hasWrite: false, ok: true });
});

test('github-repo-bootstrap has a gh example in each settings section (#251)', async () => {
  const text = await readFile(join(repoRoot, 'skills', 'github-repo-bootstrap', 'SKILL.md'), 'utf8');
  for (const heading of SECTIONS) {
    const body = sectionBody(text, heading);
    assert.notEqual(body, null, `missing section "## ${heading}"`);
    assert.ok(ghLines(body).length > 0, `"${heading}" has no gh command example`);
  }
});

test('github-repo-bootstrap reads state before it writes it (#251)', async () => {
  const text = await readFile(join(repoRoot, 'skills', 'github-repo-bootstrap', 'SKILL.md'), 'utf8');
  for (const heading of READ_FIRST) {
    const result = readsBeforeWrites(ghLines(sectionBody(text, heading)));
    assert.equal(result.hasWrite, true, `"${heading}" should show the write it describes`);
    assert.equal(result.ok, true, `"${heading}" must show a read before its first write`);
  }
});

test('github-repo-bootstrap stays under 250 lines and uses placeholders only (#251)', async () => {
  const text = await readFile(join(repoRoot, 'skills', 'github-repo-bootstrap', 'SKILL.md'), 'utf8');
  assert.ok(text.split(/\r?\n/).length < 250, 'the bootstrap skill grew past 250 lines');
  assert.doesNotMatch(text, /github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+/, 'use {owner}/{repo}, not a real URL');
});
