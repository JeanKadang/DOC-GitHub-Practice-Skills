---
name: github-repo-bootstrap
description: Use before creating a GitHub repository or completing the initial setup of a newly created repository. Governs public-content preflight, the minimum-shell issue-first exception, bootstrap issue and branch creation, conditional community files, repository and security settings, CI-aware rulesets, initial release readiness, and post-creation verification.
---

# GitHub repository bootstrap

Create the smallest safe repository shell, cross the issue-first boundary
immediately, and prove the resulting GitHub settings match the approved design.
Do not treat repository creation as permission to publish unreviewed local files.

## 1. Required decisions before external state

Record the owner, name availability, purpose, visibility, licence, description,
topics, default branch, expected maintainers, release intent, and the source
layout (stack, distributable folder name, see "Starting layout" below). Verify GitHub
authentication, the exact local source directory, and feature or plan availability.
Obtain the maintainer's approval before creating, merging, or releasing.

## 2. Public-content and history preflight

For a public repository, allowlist proposed files and scan them for credentials,
personal data, workplace material, private URLs, and private keys. Confirm that
no unrelated repository history, local settings, or unreviewed artifacts will be
copied. Treat unavailable paid security controls as constraints, not defects.

## 3. The minimum-shell exception

Before the first issue, create only the repository metadata, default branch,
README, and licence required to make issue tracking possible. This exception ends
as soon as the repository exists. Do not add community files, CI, Wiki, Projects,
CODEOWNERS, or governance rules to the default branch under this exception.

## 4. Bootstrap issue and linked branch

Immediately create and assign one bootstrap issue with labels, milestone, and
testable acceptance criteria. Create an issue-linked branch from the default
branch and put every further change through its pull request. Do not call setup
work an issue-first exception after the minimum shell exists.

## 5. Conditional scaffolding matrix

| Item | Add when | Do not add when |
|---|---|---|
| CONTRIBUTING, SECURITY, issue forms, PR template | The repository accepts contributions or needs a public intake route | They would assert an unsupported reporting or review process |
| CI, release configuration, changelog, documentation | The repository distributes or maintains versioned work | The check, release, or documentation has no owner |
| Dependabot | The repository has supported dependencies or Actions | No supported ecosystem is present |
| Projects board | Multiple contributors need a maintained board and an owner | It is cosmetic, unmaintained, or solo work can use issues, labels, and milestones |
| CODEOWNERS | Real review routing requires named owners | A solo maintainer has no routing need |
| GitHub Wiki | The repository already has one, established and actively used — leave it as-is and treat its content as source of truth for what it covers | It has no Wiki yet; never proactively enable one during bootstrap |

### Starting layout

Decide the source layout while the repository is small. Restructuring later is
cheap in a ten-file repository and disruptive once it has a backlog, open pull
requests, and consumers with hard-coded paths. Apply the principles below, then
use the stack row as a starting point. Judge each repository against "Use when"
rather than copying the whole tree, and say why for the parts you keep.

Principles:

1. **The distributable unit lives in a folder named after the package.** Some
   ecosystems require it (a PowerShell module folder must match the module name to
   be published or found on the module path); the rest benefit from it.
2. **Separate public surface from internals, and split by responsibility** once a
   source file holds more than a handful of units: one file per public command or
   class, shared helpers in their own place.
3. **Keep tests out of the distributable and mirror a unit/integration split** when
   both kinds exist.
4. **Put developer scripts (test runner, build, release helpers) in `build/` or
   `scripts/`**, not at the repository root.
5. **Keep only example configuration in the repository**, never real configuration;
   verify the ignore rules track the example and nothing real.
6. **Keep long-form documentation in `docs/`**; community and licence files stay at
   the root (`README`, `LICENSE`, `CHANGELOG`, `SECURITY`, `CONTRIBUTING`).

| Stack | Starting layout | Use when |
|---|---|---|
| PowerShell module | `<Module>/` (manifest, root `.psm1` that loads `Public/` and `Private/`), `tests/Unit`, `tests/Integration`, `build/`, `config/` | More than a couple of functions, or any plan to publish |
| Node / TypeScript package | `src/`, `test/`, `scripts/`, `docs/`, build output ignored | Always for a package; a single-file script can stay flat |
| Python package | `src/<package>/`, `tests/`, `docs/`, `pyproject.toml` | A package or library; a one-file script can stay flat |
| Single script or notes repository | Flat root with `README` and `LICENSE` | One file with no plan to grow; do not invent folders |

After creating the layout, check that blanket ignore rules (for example `*.yml` or
`*.json`) do not hide tracked files such as workflows or example configuration:
`git check-ignore -v <path>` for each new path. Record the layout decision in the
bootstrap issue's acceptance criteria.

## 6. Repository and Actions settings

Configure issues, discussions, merge methods, automatic branch deletion, topics,
and repository visibility deliberately from the recorded decisions. Keep Projects
disabled unless an approved condition above changes. Leave an already-established,
actively-used Wiki as it is; a repository with no Wiki yet gets one only if the
maintainer explicitly asks — never enable one by default during bootstrap.
Set Actions permissions to the least privilege that works and disable Actions
approval of pull-request reviews unless an approved design requires it.

Run these in a clone of the repository, where `gh` fills in `{owner}/{repo}`.
Read the current state first:

```bash
gh repo view --json visibility,defaultBranchRef,deleteBranchOnMerge,hasIssuesEnabled,hasProjectsEnabled,hasWikiEnabled,hasDiscussionsEnabled,mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed
gh api repos/{owner}/{repo}/actions/permissions/workflow
```

Then change only what the recorded decisions say. The flags below are an
example; do not pass `--enable-wiki` here, because the Wiki rule above governs it.

```bash
gh repo edit --delete-branch-on-merge --enable-projects=false --enable-merge-commit --enable-squash-merge=false --enable-rebase-merge=false
gh api -X PUT repos/{owner}/{repo}/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
```

## 7. Security settings

Enable private vulnerability reporting, secret scanning, push protection,
Dependabot, and other security controls when GitHub makes them available and the
approved design requires them. Verify each endpoint's actual result; record an
unavailable control rather than claiming it is enabled. Route security reports
through SECURITY.md, never an ordinary public issue form.

Read what the API reports before enabling anything. A 403 or 404 is a result to
record: some controls need admin access or a plan that includes them.

```bash
gh api repos/{owner}/{repo} --jq '.security_and_analysis'
gh api repos/{owner}/{repo}/private-vulnerability-reporting --jq .enabled
```

Enable what the approved design requires, then read it back with the commands
above.

```bash
gh api -X PUT repos/{owner}/{repo}/private-vulnerability-reporting
gh api -X PUT repos/{owner}/{repo}/vulnerability-alerts
gh api -X PATCH repos/{owner}/{repo} -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
```

## 8. CI first, ruleset second

Add and run CI before creating required-status rules. Use the exact observed job
names and create a ruleset only when the visibility and account plan support it.
Protect deletion and non-fast-forward updates as approved. For a solo repository,
require zero approvals or a permitted maintainer path; never require impossible
self-approval. Explain why the first bootstrap pull request precedes the ruleset.

Find the exact job names CI reports and use those as the required check names:

```bash
gh run list --limit 1 --json databaseId --jq '.[0].databaseId'
gh run view <run-id> --json jobs --jq '.jobs[].name'
```

Check the plan before scripting a ruleset: a 403 means the plan does not allow
one, which is not the same as having none. Then create it from a `ruleset.json`
written as in `github-releases`, which holds the example rules.

```bash
gh api repos/{owner}/{repo}/rulesets
gh api -X POST repos/{owner}/{repo}/rulesets --input ruleset.json
```

## 9. Initial pull request and release

Open the bootstrap pull request with `Refs #N`, criterion evidence, content-scan
results, and local validation. Inspect its scope and every CI leg; merge only with
explicit maintainer approval and all applicable checks green. If the repository
ships a versioned artifact, tag the updated default branch, publish generated release notes,
and verify the release before closing the bootstrap issue.

`Refs #N` avoids a PR-body closing keyword; it does not guarantee the issue
stays open when GitHub has a connected development branch. After every merge,
immediately audit the linked issue state and body. If it is closed while any
in-scope acceptance criterion is unchecked, unmet, or unevaluated, reopen it
immediately and record the reason. For bootstrap work that spans the PR merge,
either use this audit-and-reopen flow or track the PR-scoped work in a child
issue and leave the release-spanning parent unconnected. Every PR-scoped
criterion still needs evidence before merge.

## 10. Post-bootstrap API audit

Query GitHub after setup and compare actual state with the approved design:
visibility, default branch, merge methods, branch deletion, Issues, Projects,
Wiki, Actions permissions, security controls, rulesets, and release state. Fix or
record every difference before declaring bootstrap complete.

```bash
gh repo view --json visibility,defaultBranchRef,deleteBranchOnMerge,hasIssuesEnabled,hasProjectsEnabled,hasWikiEnabled,mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed
gh api repos/{owner}/{repo}/actions/permissions/workflow
gh api repos/{owner}/{repo} --jq '.security_and_analysis'
gh api repos/{owner}/{repo}/private-vulnerability-reporting --jq .enabled
gh api repos/{owner}/{repo}/rulesets --jq '.[] | {name, enforcement}'
gh release list --limit 3
```

## 11. Handoffs to companion skills

Use `github-issue-first` for ordinary work after the bootstrap boundary,
`github-pr-review` for pull-request review, `github-security-response` for a
security event, `github-projects` only when shared board governance is warranted,
`github-hygiene` for PR merges and cleanup, `github-releases` for the first
release and its rulesets, and `github-repo-review` for a broad repository audit.
Use `github-for-ado-users` for general ADO migration guidance,
`github-for-gitlab-users` for general GitLab migration guidance, and
`github-contributing` if the bootstrap work is itself a fork PR to a template
repo; keep workplace-specific material private. If the repository already
existed before this session — inherited, or handed to you already
non-empty — this skill's pre-issue exception never applied; use
`github-repo-configure` instead to elicit its org-optional settings.

## 12. Common mistakes

| Mistake | Required response |
|---|---|
| "Setup is not real work, so no issue is needed" | End the exception after the shell; create the bootstrap issue and linked branch now. |
| "Enable Wiki or a board to look professional" | Never enable a fresh Wiki; create a board only for an owned multi-contributor workflow. |
| "This repo already has a Wiki, migrate it into the repo or ignore it" | Leave an already-established, actively-used Wiki alone — treat its content as source of truth for what it covers. |
| "Add CODEOWNERS and self-approval rules by default" | Require a real routing need and a merge path a solo maintainer can use. |
| "Copy local files now and review later" | Publish only preflighted, allowlisted content; never copy private history or workplace artifacts. |
| "Everything in one root file or a flat root is fine for now" | Pick the starting layout during bootstrap; restructuring later costs history, open pull requests, and consumers' paths. A genuinely one-file repo stays flat. |
| "Configure required checks before CI exists" | Run CI first and use its observed job names. |
| "The requested setting probably applied" | Audit the API result and record unavailable controls or differences. |
