import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';

import { repoRoot } from './helpers/markdown.mjs';
import {
  REPORT_TITLE,
  REVIEWED_LABEL,
  countUnchecked,
  findMilestoneProblems,
  findRows,
  findUnassigned,
  flattenPages,
  renderReport,
} from '../scripts/closure-audit.mjs';

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

const open = (overrides) => ({ number: 1, title: 'T', milestone: null, author: { login: 'JeanKadang', is_bot: false }, ...overrides });
const milestone = (overrides) => ({ number: 1, title: 'M', state: 'open', open_issues: 1, closed_issues: 0, ...overrides });

test('findUnassigned lists open issues with no milestone and skips bot-written ones (#243)', () => {
  const rows = findUnassigned([
    open({ number: 9 }),
    open({ number: 4, milestone: { title: 'v0.4.0' } }),
    open({ number: 2, author: { login: 'app/github-actions', is_bot: true } }),
    open({ number: 3 }),
  ]);
  assert.deepEqual(rows.map((row) => row.number), [3, 9]);
});

test('findMilestoneProblems names empty open and closed-with-open milestones (#243)', () => {
  const problems = findMilestoneProblems([
    milestone({ number: 1, title: 'fine' }),
    milestone({ number: 2, title: 'empty', open_issues: 0, closed_issues: 5 }),
    milestone({ number: 3, title: 'done and clean', state: 'closed', open_issues: 0 }),
    milestone({ number: 4, title: 'closed too soon', state: 'closed', open_issues: 2 }),
  ]);
  assert.deepEqual(problems.emptyOpen.map((m) => m.title), ['empty']);
  assert.deepEqual(problems.closedWithOpen.map((m) => m.title), ['closed too soon']);
});

test('flattenPages accepts slurped pages, a flat list, and nothing (#243)', () => {
  assert.deepEqual(flattenPages([[{ a: 1 }], [{ a: 2 }]]), [{ a: 1 }, { a: 2 }]);
  assert.deepEqual(flattenPages([{ a: 1 }]), [{ a: 1 }]);
  assert.deepEqual(flattenPages(undefined), []);
});

test('the report lists each milestone problem with a link-free row and says what to do (#243)', () => {
  const problems = findMilestoneProblems([
    milestone({ number: 2, title: 'empty', open_issues: 0, closed_issues: 5 }),
    milestone({ number: 4, title: 'closed too soon', state: 'closed', open_issues: 2 }),
  ]);
  const report = renderReport([], {
    date: '2026-10-05',
    checked: 3,
    milestones: { unassigned: [{ number: 232, title: 'Pilot' }], ...problems, openCount: 4, milestoneCount: 2 },
  });
  assert.match(report, /4 open issues, and 2 milestones/);
  assert.match(report, /Open issues without a milestone \(1\)\n\n- #232 Pilot/);
  assert.match(report, /Open milestones with no open issues \(1\)\n\n- empty \(5 closed\)/);
  assert.match(report, /Closed milestones that still have open issues \(1\)\n\n- closed too soon \(2 open\)/);
  assert.match(report, /Issues written by a bot are not listed/);
});

test('a clean milestone check says so, and the section is absent without milestone data (#243)', () => {
  const clean = renderReport([], {
    date: '2026-10-05',
    checked: 3,
    milestones: { unassigned: [], emptyOpen: [], closedWithOpen: [], openCount: 1, milestoneCount: 1 },
  });
  assert.match(clean, /Every open issue has a milestone/);
  assert.doesNotMatch(renderReport([], { date: '2026-10-05', checked: 3 }), /## Milestones and open issues/);
});

test('the workflow feeds the milestone data to the script and uses the script title (#243)', async () => {
  const workflow = parse(await readFile(join(repoRoot, '.github', 'workflows', 'closure-audit.yml'), 'utf8'));
  assert.equal(workflow.jobs.audit.env.REPORT_TITLE, REPORT_TITLE);
  const commands = workflow.jobs.audit.steps.map((step) => step.run ?? '').join('\n');
  assert.match(commands, /gh issue list --state open .*--json number,title,milestone,author/s);
  assert.match(commands, /gh api --paginate --slurp "repos\/\$GITHUB_REPOSITORY\/milestones\?state=all"/);
  assert.match(commands, /--closed closed\.json --open open\.json --milestones milestones\.json/);
  // Still report-only: no milestone or issue is changed.
  assert.doesNotMatch(commands, /gh api [^\n]*(-X|--method) (PATCH|POST|DELETE)/);
  assert.doesNotMatch(commands, /gh issue edit [^\n]*--milestone/);
});
