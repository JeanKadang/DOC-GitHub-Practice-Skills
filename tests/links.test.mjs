import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';

import { findMarkdownFiles, repoRoot, stripFences } from './helpers/markdown.mjs';

/** GitHub's heading anchor: lowercase, punctuation dropped, spaces to hyphens. */
export function slugify(heading) {
  return heading
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M} _-]/gu, '')
    .replace(/ /g, '-');
}

export function headingAnchors(source) {
  const counts = new Map();
  const anchors = new Set();
  for (const line of stripFences(source).split('\n')) {
    const match = /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const base = slugify(match[1]);
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    anchors.add(seen === 0 ? base : `${base}-${seen}`);
  }
  return anchors;
}

/** Relative link targets in Markdown prose, ignoring code and external URLs. */
export function extractRelativeLinks(source) {
  const links = [];
  stripFences(source)
    .split('\n')
    .forEach((rawLine, index) => {
      const line = rawLine.replace(/`[^`]*`/g, '');
      for (const match of line.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
        const target = match[1].replace(/^<|>$/g, '');
        if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) continue;
        if (/[{}<>]/.test(target)) continue;
        links.push({ line: index + 1, target });
      }
    });
  return links;
}

async function exists(path) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

/**
 * Returns problems for every relative link in `source` (a file at `file`),
 * given a way to read other files for their anchors.
 */
export async function findLinkProblems(file, source, readSource) {
  const problems = [];
  const ownAnchors = headingAnchors(source);
  for (const { line, target } of extractRelativeLinks(source)) {
    const [pathPart, fragment] = target.split('#');
    let anchors = ownAnchors;
    if (pathPart) {
      const resolved = resolve(dirname(file), decodeURIComponent(pathPart));
      const info = await exists(resolved);
      if (!info) {
        problems.push(`${line}: ${target} does not exist`);
        continue;
      }
      if (!fragment) continue;
      if (!info.isFile() || !resolved.endsWith('.md')) continue;
      anchors = headingAnchors(await readSource(resolved));
    } else if (!fragment) {
      continue;
    }
    if (fragment && !anchors.has(decodeURIComponent(fragment).toLowerCase())) {
      problems.push(`${line}: ${target} points at a heading that does not exist`);
    }
  }
  return problems;
}

test('slugify matches GitHub heading anchors', () => {
  assert.equal(slugify('Closing issues: the other half of the job'), 'closing-issues-the-other-half-of-the-job');
  assert.equal(slugify('The `Refs #N` / `Closes #N` gate'), 'the-refs-n--closes-n-gate');
  assert.equal(slugify('Self-check'), 'self-check');
  const anchors = headingAnchors('# A\n\n## Same\n\n## Same\n\n```text\n# not a heading\n```\n');
  assert.deepEqual([...anchors].sort(), ['a', 'same', 'same-1']);
});

test('findLinkProblems fails on a seeded missing file and a seeded missing anchor', async () => {
  const file = join(repoRoot, 'README.md');
  const source = [
    '# Title',
    '',
    '[ok file](docs/GUIDE.md) [ok anchor](#title)',
    '[missing file](docs/does-not-exist.md)',
    '[missing anchor](#no-such-heading)',
    '[other file missing anchor](docs/GUIDE.md#no-such-heading)',
    '`[in code](docs/nope.md)`',
    '[external](https://example.com/x)',
  ].join('\n');
  const problems = await findLinkProblems(file, source, (path) => readFile(path, 'utf8'));
  assert.equal(problems.length, 3, problems.join('\n'));
  assert.match(problems[0], /^4: docs\/does-not-exist\.md does not exist/);
  assert.match(problems[1], /^5: #no-such-heading points at a heading/);
  assert.match(problems[2], /^6: docs\/GUIDE\.md#no-such-heading points at a heading/);
});

// docs/review holds point-in-time audit reports written against an earlier
// commit. Their links named files that were later renamed, and the reports are
// kept as the record of what the reviewer saw, so they are not link-checked.
const POINT_IN_TIME_DIRECTORY = join(repoRoot, 'docs', 'review');

test('every relative link and anchor in published Markdown resolves', async () => {
  const failures = [];
  const cache = new Map();
  const readSource = async (path) => {
    if (!cache.has(path)) cache.set(path, await readFile(path, 'utf8'));
    return cache.get(path);
  };
  for (const file of await findMarkdownFiles()) {
    if (file.startsWith(POINT_IN_TIME_DIRECTORY)) continue;
    for (const problem of await findLinkProblems(file, await readSource(file), readSource)) {
      failures.push(`${relative(repoRoot, file)}:${problem}`);
    }
  }
  assert.deepEqual(failures, [], `broken links:\n${failures.join('\n')}`);
});
