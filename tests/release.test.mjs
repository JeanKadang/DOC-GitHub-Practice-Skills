import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';

import { changelogHasSection, isReachableFrom, releaseProblems } from '../scripts/verify-release.mjs';
import { repoRoot } from './helpers/markdown.mjs';

const good = {
  tag: 'v1.2.3',
  packageVersion: '1.2.3',
  inventoryVersion: '1.2.3',
  changelog: '# Changelog\n\n## [Unreleased]\n\n## [1.2.3] - 2026-10-01\n',
  onMain: true,
};

test('a correct release passes every guard', () => {
  assert.deepEqual(releaseProblems(good), []);
});

test('each guard fails on a seeded violation (#128)', () => {
  assert.match(releaseProblems({ ...good, onMain: false }).join('\n'), /not reachable from the main branch/);
  assert.match(releaseProblems({ ...good, changelog: '## [Unreleased]\n' }).join('\n'), /no "## \[1\.2\.3\]" section/);
  assert.match(releaseProblems({ ...good, packageVersion: '1.2.2' }).join('\n'), /package\.json version "1\.2\.2"/);
  assert.match(releaseProblems({ ...good, inventoryVersion: '1.2.2' }).join('\n'), /inventory packageVersion "1\.2\.2"/);
  assert.match(releaseProblems({ ...good, tag: 'v1.2' }).join('\n'), /not a plain version/);
  assert.match(releaseProblems({ ...good, tag: 'release-1.2.3' }).join('\n'), /not a plain version/);
});

test('changelogHasSection matches the exact version heading only', () => {
  assert.equal(changelogHasSection('## [1.2.3] - x\n', '1.2.3'), true);
  assert.equal(changelogHasSection('## [1.2.30] - x\n', '1.2.3'), false);
  assert.equal(changelogHasSection('## [1x2x3] - x\n', '1.2.3'), false);
  assert.equal(changelogHasSection('text ## [1.2.3]\n', '1.2.3'), false);
});

test('isReachableFrom is true on the main line and false on a side branch (#128)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'release-git-'));
  try {
    const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 't@example.test');
    git('config', 'user.name', 'T');
    await writeFile(join(dir, 'a.txt'), 'a');
    git('add', '.');
    git('commit', '-q', '-m', 'one');
    const onMain = git('rev-parse', 'HEAD');
    git('checkout', '-q', '-b', 'side');
    await writeFile(join(dir, 'b.txt'), 'b');
    git('add', '.');
    git('commit', '-q', '-m', 'two');
    const sideOnly = git('rev-parse', 'HEAD');
    assert.equal(isReachableFrom(onMain, 'main', dir), true);
    assert.equal(isReachableFrom(sideOnly, 'main', dir), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// The release workflow runs dependency code (npm ci, npm run check), so it must
// not hold a write token while it does (#128).
test('only the publish job has contents: write, and the check job runs with no stored credentials', async () => {
  const workflow = parse(await readFile(join(repoRoot, '.github', 'workflows', 'release.yml'), 'utf8'));
  assert.equal(workflow.permissions?.contents, 'read', 'the workflow default must be read-only');
  const writers = Object.entries(workflow.jobs)
    .filter(([, job]) => job.permissions?.contents === 'write')
    .map(([name]) => name);
  assert.deepEqual(writers, ['publish']);

  const check = workflow.jobs.check;
  const checkout = check.steps.find((step) => step.uses?.startsWith('actions/checkout@'));
  assert.equal(checkout.with['persist-credentials'], false);
  assert.equal(checkout.with['fetch-depth'], 0);
  assert.ok(
    check.steps.some((step) => /npm ci --ignore-scripts/.test(step.run ?? '')),
    'the check job must install with scripts disabled',
  );
  assert.ok(
    check.steps.some((step) => /node scripts\/verify-release\.mjs/.test(step.run ?? '')),
    'the check job must run the release guards',
  );
  assert.ok(
    check.steps.every((step) => !/gh release create/.test(step.run ?? '')),
    'the check job must not publish',
  );
});

test('publish needs the check job and does not run on a manual dry run', async () => {
  const workflow = parse(await readFile(join(repoRoot, '.github', 'workflows', 'release.yml'), 'utf8'));
  const publish = workflow.jobs.publish;
  assert.equal(publish.needs, 'check');
  assert.match(publish.if, /github\.event_name == 'push'/);
  assert.ok(publish.steps.some((step) => /gh release create/.test(step.run ?? '')));
  assert.ok(workflow.on.workflow_dispatch, 'a manual dry run must exist');
});
