import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';

import { repoRoot } from './helpers/markdown.mjs';
import { collectAdvisories, evaluate } from '../scripts/dependency-audit.mjs';

const advisory = (id, severity, name = 'pkg') => ({
  source: 1,
  name,
  title: `Problem in ${name}`,
  url: `https://github.com/advisories/${id}`,
  severity,
});

const audit = (vulnerabilities) => ({ vulnerabilities });

const braces = advisory('GHSA-aaaa-bbbb-cccc', 'high', 'braces');
const accepted = [{ id: 'GHSA-aaaa-bbbb-cccc', reason: 'no patch', reviewBy: '2026-11-06' }];

test('collectAdvisories reads root advisories once and ignores inherited parents', () => {
  const found = collectAdvisories(
    audit({
      braces: { via: [braces] },
      micromatch: { via: ['braces'] },
      other: { via: [braces] },
    }),
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].id, 'GHSA-AAAA-BBBB-CCCC');
});

test('an unaccepted moderate-or-higher advisory fails', () => {
  const { problems } = evaluate(audit({ braces: { via: [braces] } }), [], '2026-10-07');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /New advisory not accepted: GHSA-AAAA-BBBB-CCCC \(high, braces\)/);
});

test('an accepted advisory within its review date passes', () => {
  const { problems, stale } = evaluate(audit({ braces: { via: [braces] } }), accepted, '2026-10-07');
  assert.deepEqual(problems, []);
  assert.deepEqual(stale, []);
});

test('an accepted advisory past its review date fails', () => {
  const { problems } = evaluate(audit({ braces: { via: [braces] } }), accepted, '2026-11-07');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Acceptance expired 2026-11-06/);
});

test('a low severity advisory does not fail the gate', () => {
  const low = advisory('GHSA-dddd-eeee-ffff', 'low', 'katex');
  assert.deepEqual(evaluate(audit({ katex: { via: [low] } }), [], '2026-10-07').problems, []);
});

test('an accepted advisory that is no longer reported is listed as stale', () => {
  const { problems, stale } = evaluate(audit({}), accepted, '2026-10-07');
  assert.deepEqual(problems, []);
  assert.deepEqual(stale, ['GHSA-aaaa-bbbb-cccc']);
});

test('the allowlist file is well formed and every entry has a reason and a date (#262)', async () => {
  const entries = JSON.parse(await readFile(join(repoRoot, '.github', 'audit-accepted.json'), 'utf8'));
  assert.ok(Array.isArray(entries));
  for (const entry of entries) {
    assert.match(entry.id, /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/);
    assert.ok(entry.reason.length > 20, `${entry.id} needs a real reason`);
    assert.match(entry.reviewBy, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('the dependency audit workflow is scheduled, read-only, and not a pull request check (#262)', async () => {
  const workflow = parse(await readFile(join(repoRoot, '.github', 'workflows', 'dependency-audit.yml'), 'utf8'));
  assert.ok(workflow.on.schedule.length > 0);
  assert.ok('workflow_dispatch' in workflow.on);
  assert.equal(workflow.on.pull_request, undefined);
  assert.deepEqual(workflow.permissions, { contents: 'read' });
});
