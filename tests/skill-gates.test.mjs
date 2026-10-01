import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// github-issue-first detects work automatically, but filing an issue is an
// outward-facing, possibly public action, so it is gated (#120): write or
// triage permission first, hand off to github-contributing otherwise, and one
// confirmation per repo per session.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

async function skill(name) {
  return readFile(join(repoRoot, 'skills', name, 'SKILL.md'), 'utf8');
}

function section(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  assert.notEqual(start, -1, `missing section "## ${heading}"`);
  const rest = lines.slice(start + 1);
  const next = rest.findIndex((line) => /^## /.test(line));
  return (next === -1 ? rest : rest.slice(0, next)).join('\n');
}

test('github-issue-first has a Preconditions section with the permission check and the hand-off (#120)', async () => {
  const preconditions = section(await skill('github-issue-first'), 'Preconditions');
  assert.match(preconditions, /viewerPermission/);
  assert.match(preconditions, /\bREAD\b/);
  assert.match(preconditions, /do not file/i);
  assert.match(preconditions, /github-contributing/);
});

test('github-issue-first says a public repo issue is public and needs one confirmation per repo per session (#120)', async () => {
  const preconditions = section(await skill('github-issue-first'), 'Preconditions');
  assert.match(preconditions, /public/i);
  assert.match(preconditions, /once\s+per\s+repo\s+per\s+session/i);
  assert.match(preconditions, /the\s+user\s+asked\s+you\s+to\s+file/i);
});

test('github-issue-first no longer promises to file without being asked (#120)', async () => {
  const text = await skill('github-issue-first');
  const description = text.match(/^description: (.*)$/m)[1];
  assert.doesNotMatch(description, /without being asked/i);
  assert.match(description, /write or triage permission/i);
  assert.match(description, /github-contributing/);
});

test('github-issue-first documents the foreign-repo scenario: read-only access means no issue (#120)', async () => {
  const preconditions = section(await skill('github-issue-first'), 'Preconditions');
  assert.match(preconditions, /only cloned|outside contributor|someone else's/i);
  const row = preconditions.split(/\r?\n/).find((line) => /READ/.test(line) && /\|/.test(line));
  assert.ok(row, 'the scenario table must have a READ row');
  assert.match(row, /do not file/i);
});

test('github-contributing routes findings in a repo you only read to that repo\'s channels, not issue-first (#120)', async () => {
  const text = await skill('github-contributing');
  assert.match(text, /github-issue-first/);
  assert.match(text, /read access/i);
});

// Auto-merge (#184): enabling it is the merge approval, so the rule about who
// may enable it and when must stay in the policy and in the lessons.
async function text(path) {
  return readFile(join(repoRoot, path), 'utf8');
}

test('github-hygiene says auto-merge is the maintainer\'s switch and never pairs with an unmet Closes (#184)', async () => {
  const hygiene = await skill('github-hygiene');
  const line = hygiene.split(/\r?\n/).find((l) => /auto-merge/i.test(l));
  assert.ok(line, 'github-hygiene must mention auto-merge');
  const flat = hygiene.replace(/\s+/g, ' ');
  assert.match(flat, /Auto-merge is the maintainer's switch/i);
  assert.match(flat, /enabling it is the merge approval/i);
  assert.match(flat, /never[^.]{0,80}Closes #N[^.]{0,120}every in-scope criterion/i);
  assert.match(flat, /gh pr merge <N> --auto/);
});

test('WORKFLOW and Modules 2.2 and 2.4 state the auto-merge rule too (#184)', async () => {
  for (const path of [
    'docs/WORKFLOW.md',
    'education/2_intermediate/module-2-2-pr-review-and-branch-conventions.md',
    'education/2_intermediate/module-2-4-writing-a-reviewable-pr.md',
  ]) {
    const flat = (await text(path)).replace(/\s+/g, ' ');
    assert.match(flat, /auto-merge/i, `${path} must mention auto-merge`);
    assert.match(flat, /merge approval|merge decision/i, `${path} must tie auto-merge to the merge approval`);
  }
});

// Default branch (#119): a recipe that hardcodes `main` in a git or gh command
// is wrong on a repository whose default branch is named differently, so any
// skill that does so must also say that `main` stands for the default branch.
test('a skill whose commands name main also says main means the default branch (#119)', async () => {
  const { readdir } = await import('node:fs/promises');
  const skillsRoot = join(repoRoot, 'skills');
  const offenders = [];
  for (const entry of await readdir(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const body = await skill(entry.name).catch(() => null);
    if (body === null) continue;
    const namesMainInACommand = body
      .split(/\r?\n/)
      .some((line) => /\b(?:git|gh)\b[^\n]*(?:\bmain\b|origin\/main|upstream\/main)/.test(line));
    if (namesMainInACommand && !/default branch/i.test(body)) {
      offenders.push(entry.name);
    }
  }
  assert.deepEqual(offenders, [], `skills with a hardcoded main and no default-branch note: ${offenders.join(', ')}`);
});

test('github-contributing, github-releases, and github-pr-review do not assume main (#119)', async () => {
  const contributing = (await skill('github-contributing')).replace(/\s+/g, ' ');
  assert.match(contributing, /`main` stands for the default branch/);
  assert.match(contributing, /defaultBranchRef/);
  const releases = (await skill('github-releases')).replace(/\s+/g, ' ');
  assert.match(releases, /`main` means the repository's default branch/);
  const review = await skill('github-pr-review');
  assert.doesNotMatch(review, /^git checkout main\b/m);
});

// Cross-skill handoffs (#124): template work routes to the skill that ships
// templates, companion lists cover every sibling, and the ADO Wiki stance
// agrees with the GitLab one (conditional, not a blanket ban).
test('mapping skills route issue forms and PR template to github-repo-configure (#124)', async () => {
  for (const name of ['github-for-ado-users', 'github-for-gitlab-users']) {
    const body = (await skill(name)).replace(/\s+/g, ' ');
    assert.match(body, /Issue forms and PR template — `github-repo-configure`/, name);
    assert.doesNotMatch(body, /issue forms, PR template — `github-repo-review`/, name);
  }
});

test('github-repo-review lists every sibling skill as a companion (#124)', async () => {
  const inventory = JSON.parse(
    await readFile(join(repoRoot, 'contracts', 'skill-inventory.json'), 'utf8'),
  );
  const names = inventory.skills.map((entry) => entry.name);
  const body = await skill('github-repo-review');
  const companions = body.split(/\r?\n/).find((line) => line.startsWith('**Companion skills:**'));
  assert.ok(companions, 'github-repo-review must have a Companion skills line');
  const missing = names.filter((name) => name !== 'github-repo-review' && !companions.includes(`\`${name}\``));
  assert.deepEqual(missing, [], `missing from the companion list: ${missing.join(', ')}`);
});

test('github-repo-bootstrap hands off to both mapping skills (#124)', async () => {
  const body = await skill('github-repo-bootstrap');
  assert.match(body, /`github-for-ado-users`/);
  assert.match(body, /`github-for-gitlab-users`/);
});

test('the ADO Wiki stance is conditional and the GitLab skill does not deny ADO has a Wiki (#124)', async () => {
  const ado = (await skill('github-for-ado-users')).replace(/\s+/g, ' ');
  assert.match(ado, /established,\s+actively-used Wiki/);
  assert.doesNotMatch(ado, /### 3\. The Wiki is a trap\b/);
  const gitlab = (await skill('github-for-gitlab-users')).replace(/\s+/g, ' ');
  assert.doesNotMatch(gitlab, /no wiki-equivalent gap/i);
  assert.match(gitlab, /Azure DevOps[^.]{0,40}also has a Git-backed project Wiki/);
});

// CI guidance (#213): lessons from changing this repository's own CI. Removing
// either piece would reintroduce a blocked-PR trap or a silent unsupported
// runtime in an audit.
test('github-releases warns that renaming a job orphans a required check and gives the order (#213)', async () => {
  const body = (await skill('github-releases')).replace(/\s+/g, ' ');
  assert.match(body, /Renaming a job, or changing a CI matrix, changes the check names/);
  assert.match(body, /never reports, so it blocks every pull request/);
  assert.match(body, /add a new name only after a pull request has shown that check passing/);
  assert.match(body, /remove an old name only when its job is gone/);
  assert.match(body, /repository-settings change/);
});

test('github-repo-review audits supported runtimes, declared minimums, and required check names (#213)', async () => {
  const prompt = (await readFile(join(repoRoot, 'skills', 'github-repo-review', 'review-prompt.md'), 'utf8')).replace(
    /\s+/g,
    ' ',
  );
  assert.match(prompt, /runtime versions CI tests are still supported/);
  assert.match(prompt, /declared minimum.*?agrees with what CI tests/);
  assert.match(prompt, /required check name in the ruleset still matches a job that runs/);
});
