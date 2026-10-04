import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';

import { repoRoot } from './helpers/markdown.mjs';
import { REVIEWED_LABEL, countUnchecked, findRows, renderReport } from '../scripts/closure-audit.mjs';

const issue = (overrides) => ({
  number: 1,
  title: 'T',
  stateReason: 'COMPLETED',
  closedAt: '2026-08-11T10:00:00Z',
  labels: [],
  body: '- [ ] a criterion',
  ...overrides,
});

test('countUnchecked counts open boxes and ignores ticked ones', () => {
  assert.equal(countUnchecked('- [ ] one\n- [x] two\n  - [ ] three\n* [ ] four'), 3);
  assert.equal(countUnchecked('- [X] done'), 0);
  assert.equal(countUnchecked(null), 0);
});

test('countUnchecked ignores a quoted example inside a fenced block', () => {
  const body = 'Write a box like this:\n```md\n- [ ] example\n```\n- [x] real';
  assert.equal(countUnchecked(body), 0);
});

test('findRows lists only completed issues with an open box, in number order', () => {
  const rows = findRows([
    issue({ number: 9 }),
    issue({ number: 3, stateReason: 'NOT_PLANNED' }),
    issue({ number: 5, body: '- [x] done' }),
    issue({ number: 2, body: '- [ ] a\n- [ ] b' }),
  ]);
  assert.deepEqual(rows.map((row) => [row.number, row.unchecked]), [[2, 2], [9, 1]]);
  assert.equal(rows[0].closedAt, '2026-08-11');
});

test('an issue labelled as reviewed is not reported', () => {
  const rows = findRows([issue({ labels: [{ name: REVIEWED_LABEL }] })]);
  assert.deepEqual(rows, []);
});

test('the report names the rows and tells the maintainer what to do', () => {
  const report = renderReport(findRows([issue({ number: 7, title: 'a | b' })]), { date: '2026-10-05', checked: 40 });
  assert.match(report, /Last run: 2026-10-05\. Checked 40 issues/);
  assert.match(report, /\| #7 \| a \\\| b \| 2026-08-11 \| 1 \|/);
  assert.match(report, new RegExp(REVIEWED_LABEL));
  assert.match(report, /reopens and edits nothing/);
});

test('an empty result still produces a report', () => {
  const report = renderReport([], { date: '2026-10-05', checked: 40 });
  assert.match(report, /No issue closed as completed has an unchecked/);
});

test('the audit workflow is scheduled weekly, report-only, and minimally privileged (#115)', async () => {
  const workflow = parse(await readFile(join(repoRoot, '.github', 'workflows', 'closure-audit.yml'), 'utf8'));
  assert.equal(workflow.on.schedule.length, 1);
  assert.match(workflow.on.schedule[0].cron, /^\d+ \d+ \* \* \d$/);
  assert.ok('workflow_dispatch' in workflow.on);
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.deepEqual(workflow.jobs.audit.permissions, { contents: 'read', issues: 'write' });
  const commands = workflow.jobs.audit.steps.map((step) => step.run ?? '').join('\n');
  for (const forbidden of [/gh issue (close|reopen)/, /gh issue comment/]) {
    assert.doesNotMatch(commands, forbidden);
  }
  // The only issue it may edit is the tracking issue found by title.
  assert.match(commands, /gh issue edit "\$existing" --body-file report\.md/);
});
