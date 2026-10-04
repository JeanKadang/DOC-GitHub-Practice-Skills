// Report-only closure audit (#115): lists issues closed as completed that still
// carry an unchecked acceptance criterion. Reads `gh issue list --json
// number,title,body,stateReason,closedAt,labels` on stdin and writes a Markdown
// report on stdout. It changes nothing; a maintainer decides what each row needs.
import { pathToFileURL } from 'node:url';

// An issue with this label has had a scope decision recorded on it (a criterion
// superseded or not applicable), so its unchecked box is deliberate.
export const REVIEWED_LABEL = 'closure-audit-reviewed';

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

const cell = (text) => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ');

export function renderReport(rows, { date, checked }) {
  const lines = [
    '<!-- Rewritten by .github/workflows/closure-audit.yml; edits are overwritten. -->',
    '# Closure audit: completed issues with unchecked criteria',
    '',
    `Last run: ${date}. Checked ${checked} issues closed as completed.`,
    '',
  ];
  if (rows.length === 0) {
    lines.push('No issue closed as completed has an unchecked acceptance criterion.');
  } else {
    lines.push(
      `${rows.length} issue${rows.length === 1 ? '' : 's'} closed as completed still ` +
        'show an unchecked box. This report only lists them; it reopens and edits nothing.',
      '',
      '| Issue | Title | Closed | Unchecked |',
      '| --- | --- | --- | --- |',
      ...rows.map((row) => `| #${row.number} | ${cell(row.title)} | ${row.closedAt} | ${row.unchecked} |`),
      '',
      '## What to do with a row',
      '',
      '- Criterion delivered: record evidence (diff, test, CI run, doc) in one comment and tick the box.',
      '- Criterion not delivered: reopen the issue and record why.',
      '- Criterion superseded or not applicable: record the scope decision on the issue, then add the ' +
        `\`${REVIEWED_LABEL}\` label so the row stops appearing. Never tick a box for work that was not delivered.`,
      '',
      'See `github-hygiene` ("Acceptance criteria are closure gates") and `docs/MAINTAINING.md` ("Closure audit").',
    );
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const issues = JSON.parse(input || '[]');
  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  const completed = issues.filter((issue) => issue.stateReason === 'COMPLETED').length;
  process.stdout.write(renderReport(findRows(issues), { date, checked: completed }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
