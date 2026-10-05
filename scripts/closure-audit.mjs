// Report-only repository audit (#115, #243). Two checks, one Markdown report on
// stdout. It changes nothing; a maintainer decides what each row needs.
//
// 1. Closure (#115): issues closed as completed that still carry an unchecked
//    acceptance criterion.
// 2. Milestones (#243): open issues with no milestone, open milestones with no
//    open issues, and closed milestones that still have open issues.
//
//   node scripts/closure-audit.mjs [YYYY-MM-DD] --closed closed.json \
//     [--open open.json --milestones milestones.json]
//
// closed.json: `gh issue list --state closed --json number,title,body,stateReason,closedAt,labels`
// open.json:   `gh issue list --state open --json number,title,milestone,author`
// milestones.json: `gh api --paginate --slurp "repos/<owner>/<repo>/milestones?state=all"`
// Without --open and --milestones, only the closure section is written.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// An issue with this label has had a scope decision recorded on it (a criterion
// superseded or not applicable), so its unchecked box is deliberate.
export const REVIEWED_LABEL = 'closure-audit-reviewed';

export const REPORT_TITLE = 'Repository audit: closure evidence and milestone consistency';

const UNCHECKED = /^\s*[-*+]\s+\[ \]/;
const FENCE = /^\s*(```|~~~)/;

// Count unchecked task boxes outside fenced code blocks, so a quoted example of
// `- [ ]` in an issue body is not mistaken for an open criterion.
export function countUnchecked(body) {
  let inFence = false;
  let count = 0;
  for (const line of String(body ?? '').split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && UNCHECKED.test(line)) count += 1;
  }
  return count;
}

export function findRows(issues) {
  return issues
    .filter((issue) => issue.stateReason === 'COMPLETED')
    .filter((issue) => !(issue.labels ?? []).some((label) => label.name === REVIEWED_LABEL))
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      closedAt: String(issue.closedAt ?? '').slice(0, 10),
      unchecked: countUnchecked(issue.body),
    }))
    .filter((row) => row.unchecked > 0)
    .sort((a, b) => a.number - b.number);
}

// Open issues with no milestone. An issue written by a bot (the audit's own
// tracking issue, for one) is exempt: it is a report, not planned work.
export function findUnassigned(openIssues) {
  return openIssues
    .filter((issue) => !issue.milestone)
    .filter((issue) => issue.author?.is_bot !== true)
    .map((issue) => ({ number: issue.number, title: issue.title }))
    .sort((a, b) => a.number - b.number);
}

// `gh api --paginate --slurp` returns an array of pages; a single page or a
// flat list is accepted too.
export function flattenPages(pages) {
  return (pages ?? []).flatMap((page) => (Array.isArray(page) ? page : [page]));
}

export function findMilestoneProblems(milestones) {
  const list = flattenPages(milestones).map((milestone) => ({
    number: milestone.number,
    title: milestone.title,
    state: milestone.state,
    open: milestone.open_issues ?? 0,
    closed: milestone.closed_issues ?? 0,
  }));
  const byNumber = (a, b) => a.number - b.number;
  return {
    emptyOpen: list.filter((m) => m.state === 'open' && m.open === 0).sort(byNumber),
    closedWithOpen: list.filter((m) => m.state === 'closed' && m.open > 0).sort(byNumber),
  };
}

const cell = (text) => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ');

function closureSection(rows, checked) {
  if (rows.length === 0) {
    return ['No issue closed as completed has an unchecked acceptance criterion.'];
  }
  return [
    `${rows.length} issue${rows.length === 1 ? '' : 's'} closed as completed still ` +
      'show an unchecked box. This report only lists them; it reopens and edits nothing.',
    '',
    '| Issue | Title | Closed | Unchecked |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => `| #${row.number} | ${cell(row.title)} | ${row.closedAt} | ${row.unchecked} |`),
    '',
    'What to do with a row:',
    '',
    '- Criterion delivered: record evidence (diff, test, CI run, doc) in one comment and tick the box.',
    '- Criterion not delivered: reopen the issue and record why.',
    '- Criterion superseded or not applicable: record the scope decision on the issue, then add the ' +
      `\`${REVIEWED_LABEL}\` label so the row stops appearing. Never tick a box for work that was not delivered.`,
  ];
}

function milestoneSection({ unassigned, emptyOpen, closedWithOpen }) {
  if (unassigned.length + emptyOpen.length + closedWithOpen.length === 0) {
    return ['Every open issue has a milestone, and no milestone is empty or closed with open issues.'];
  }
  const lines = [];
  if (unassigned.length > 0) {
    lines.push(
      `### Open issues without a milestone (${unassigned.length})`,
      '',
      ...unassigned.map((issue) => `- #${issue.number} ${cell(issue.title)}`),
      '',
      'Give each one a milestone, or record why it has none. Issues written by a bot are not listed.',
      '',
    );
  }
  if (emptyOpen.length > 0) {
    lines.push(
      `### Open milestones with no open issues (${emptyOpen.length})`,
      '',
      ...emptyOpen.map((m) => `- ${cell(m.title)} (${m.closed} closed)`),
      '',
      'Close the milestone if its goal shipped, or move the work that belongs to it into it.',
      '',
    );
  }
  if (closedWithOpen.length > 0) {
    lines.push(
      `### Closed milestones that still have open issues (${closedWithOpen.length})`,
      '',
      ...closedWithOpen.map((m) => `- ${cell(m.title)} (${m.open} open)`),
      '',
      'Reopen the milestone, or move its open issues to a milestone that is still open.',
      '',
    );
  }
  return lines.slice(0, -1);
}

export function renderReport(rows, { date, checked, milestones } = {}) {
  const lines = [
    '<!-- Rewritten by .github/workflows/closure-audit.yml; edits are overwritten. -->',
    `# ${REPORT_TITLE}`,
    '',
    `Last run: ${date}. Checked ${checked} issues closed as completed` +
      (milestones ? `, ${milestones.openCount} open issues, and ${milestones.milestoneCount} milestones.` : '.'),
    '',
    '## Closure: completed issues with unchecked criteria',
    '',
    ...closureSection(rows, checked),
  ];
  if (milestones) {
    lines.push('', '## Milestones and open issues', '', ...milestoneSection(milestones));
  }
  lines.push(
    '',
    'See `github-hygiene` ("Acceptance criteria are closure gates") and `docs/MAINTAINING.md` ("Closure audit").',
  );
  return `${lines.join('\n')}\n`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8') || '[]');
}

function parseArgs(argv) {
  const options = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      options[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    } else {
      positional.push(argv[i]);
    }
  }
  return { options, positional };
}

function main() {
  const { options, positional } = parseArgs(process.argv.slice(2));
  if (!options.closed) throw new Error('Pass --closed <file> (and optionally --open and --milestones).');
  if (Boolean(options.open) !== Boolean(options.milestones)) {
    throw new Error('Pass --open and --milestones together.');
  }
  const closed = readJson(options.closed);
  const date = positional[0] ?? new Date().toISOString().slice(0, 10);
  const completed = closed.filter((issue) => issue.stateReason === 'COMPLETED').length;
  let milestones;
  if (options.open) {
    const openIssues = readJson(options.open);
    const all = readJson(options.milestones);
    milestones = {
      unassigned: findUnassigned(openIssues),
      ...findMilestoneProblems(all),
      openCount: openIssues.length,
      milestoneCount: flattenPages(all).length,
    };
  }
  process.stdout.write(renderReport(findRows(closed), { date, checked: completed, milestones }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
