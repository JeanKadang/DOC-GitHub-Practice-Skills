import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';

import { repoRoot } from './helpers/markdown.mjs';

// The repository requires full-SHA pinning for actions and allows only
// GitHub-owned ones (#132). These tests keep the workflow files within those
// settings, so a change that would break CI under them fails here first.
const FULL_SHA = /^[0-9a-f]{40}$/;
const GITHUB_OWNED = /^(?:actions|github)\//;

export function usesProblems(workflow) {
  const problems = [];
  for (const [jobName, job] of Object.entries(workflow.jobs ?? {})) {
    for (const step of job.steps ?? []) {
      if (!step.uses || step.uses.startsWith('./')) continue;
      const [action, ref] = step.uses.split('@');
      if (!FULL_SHA.test(ref ?? '')) {
        problems.push(`${jobName}: ${step.uses} is not pinned to a full commit SHA`);
      }
      if (!GITHUB_OWNED.test(action)) {
        problems.push(`${jobName}: ${action} is not a GitHub-owned action`);
      }
    }
  }
  return problems;
}

test('usesProblems flags an unpinned and a third-party action', () => {
  const workflow = {
    jobs: {
      a: {
        steps: [
          { uses: 'actions/checkout@v4' },
          { uses: 'someone/else@3d3c42e5aac5ba805825da76410c181273ba90b1' },
          { uses: 'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020' },
          { run: 'echo hi' },
        ],
      },
    },
  };
  const problems = usesProblems(workflow);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /actions\/checkout@v4 is not pinned/);
  assert.match(problems[1], /someone\/else is not a GitHub-owned action/);
});

test('every workflow action is pinned to a full SHA and GitHub-owned (#132)', async () => {
  const dir = join(repoRoot, '.github', 'workflows');
  const failures = [];
  for (const file of (await readdir(dir)).filter((name) => /\.ya?ml$/.test(name))) {
    const workflow = parse(await readFile(join(dir, file), 'utf8'));
    for (const problem of usesProblems(workflow)) failures.push(`${file}: ${problem}`);
  }
  assert.deepEqual(failures, []);
});

test('the workflow linter runs actionlint and zizmor with pinned versions, and only on workflow changes (#132)', async () => {
  const text = await readFile(join(repoRoot, '.github', 'workflows', 'lint-workflows.yml'), 'utf8');
  const workflow = parse(text);
  assert.ok(workflow.on.pull_request.paths.includes('.github/workflows/**'));
  assert.match(text, /ACTIONLINT_SHA256: "[0-9a-f]{64}"/);
  assert.match(text, /sha256sum --check --strict/);
  assert.match(text, /zizmor==\d+\.\d+\.\d+/);
  const checkout = workflow.jobs.lint.steps.find((step) => step.uses?.startsWith('actions/checkout@'));
  assert.equal(checkout.with['persist-credentials'], false);
});

test('checkouts store no credentials and tag-triggered workflows use no dependency cache (#132)', async () => {
  const dir = join(repoRoot, '.github', 'workflows');
  const failures = [];
  for (const file of (await readdir(dir)).filter((name) => /\.ya?ml$/.test(name))) {
    // The label workflow never checks out code, so it has no checkout to check.
    const workflow = parse(await readFile(join(dir, file), 'utf8'));
    const tagTriggered = Boolean(workflow.on?.push?.tags);
    for (const [jobName, job] of Object.entries(workflow.jobs ?? {})) {
      for (const step of job.steps ?? []) {
        if (step.uses?.startsWith('actions/checkout@') && step.with?.['persist-credentials'] !== false) {
          failures.push(`${file} ${jobName}: checkout must set persist-credentials: false`);
        }
        if (tagTriggered && step.uses?.startsWith('actions/setup-node@')) {
          const cached = step.with?.cache || step.with?.['package-manager-cache'] !== false;
          if (cached) failures.push(`${file} ${jobName}: a tag-triggered setup-node must not use a cache`);
        }
      }
    }
  }
  assert.deepEqual(failures, []);
});
