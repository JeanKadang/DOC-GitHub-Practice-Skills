import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { repoRoot } from './helpers/markdown.mjs';

// docs/compatibility.md (#149) records what has been checked against each tool.
// A row that does not say whether it was checked would make the record look
// like support, so every row must end in an explicit status, and a Verified row
// must carry the date of the check.
export function statusProblems(markdown) {
  const problems = [];
  const rows = markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith('|') && !/^\|\s*-/.test(line) && !/^\|\s*(Tool|Surface)\s*\|/.test(line));
  for (const row of rows) {
    const cells = row.split('|').slice(1, -1).map((cell) => cell.trim());
    const status = cells[cells.length - 1];
    const name = cells[0];
    if (!/^\*\*(Verified|Verified earlier|Unverified)\*\*/.test(status)) {
      problems.push(`${name}: status must start with **Verified**, **Verified earlier**, or **Unverified**`);
    } else if (!/^\*\*Unverified\*\*/.test(status) && !/\d{4}-\d{2}-\d{2}/.test(status)) {
      problems.push(`${name}: a verified row must carry the date of the check`);
    }
  }
  return problems;
}

test('statusProblems accepts dated and unverified rows and flags the rest', () => {
  const table = [
    '| Tool | Status |',
    '| --- | --- |',
    '| A | **Verified** 2026-10-05 |',
    '| B | **Unverified** |',
    '| C | **Verified** |',
    '| D | works |',
  ].join('\n');
  assert.deepEqual(statusProblems(table), [
    'C: a verified row must carry the date of the check',
    'D: status must start with **Verified**, **Verified earlier**, or **Unverified**',
  ]);
});

test('every row of the compatibility record has an explicit status (#149)', async () => {
  const text = await readFile(join(repoRoot, 'docs', 'compatibility.md'), 'utf8');
  assert.deepEqual(statusProblems(text), []);
  assert.match(text, /Personal scope/);
  assert.match(text, /Repository and cloud scope/);
  for (const field of ['Install path', 'Discovery result', 'Sample invocation', 'Update check']) {
    assert.ok(text.includes(field), `the personal-scope table must have a "${field}" column`);
  }
});
