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
topics, default branch, expected maintainers, and release intent. Verify GitHub
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
| GitHub Wiki | Never; keep versioned documentation in the repository | Always |

## 6. Repository and Actions settings

Configure issues, discussions, merge methods, automatic branch deletion, topics,
and repository visibility deliberately from the recorded decisions. Keep Projects
and Wiki disabled unless an approved condition above changes; Wiki remains off.
Set Actions permissions to the least privilege that works and disable Actions
approval of pull-request reviews unless an approved design requires it.

## 7. Security settings

Enable private vulnerability reporting, secret scanning, push protection,
Dependabot, and other security controls when GitHub makes them available and the
approved design requires them. Verify each endpoint's actual result; record an
unavailable control rather than claiming it is enabled. Route security reports
through SECURITY.md, never an ordinary public issue form.

## 8. CI first, ruleset second

Add and run CI before creating required-status rules. Use the exact observed job
names and create a ruleset only when the visibility and account plan support it.
Protect deletion and non-fast-forward updates as approved. For a solo repository,
require zero approvals or a permitted maintainer path; never require impossible
self-approval. Explain why the first bootstrap pull request precedes the ruleset.

## 9. Initial pull request and release

Open the bootstrap pull request with `Refs #N`, criterion evidence, content-scan
results, and local validation. Inspect its scope and every CI leg; merge only with
explicit maintainer approval and all applicable checks green. If the repository
ships a versioned artifact, tag updated `main`, publish generated release notes,
and verify the release before closing the bootstrap issue.

## 10. Post-bootstrap API audit

Query GitHub after setup and compare actual state with the approved design:
visibility, default branch, merge methods, branch deletion, Issues, Projects,
Wiki, Actions permissions, security controls, rulesets, and release state. Fix or
record every difference before declaring bootstrap complete.

## 11. Handoffs to companion skills

Use `github-issue-first` for ordinary work after the bootstrap boundary,
`github-pr-review` for pull-request review, `github-security-response` for a
security event, `github-projects` only when shared board governance is warranted,
`github-hygiene` for releases and cleanup, and `github-repo-review` for a broad
repository audit. Use `github-for-ado-users` for general ADO migration guidance;
keep workplace-specific material private.

## 12. Common mistakes

| Mistake | Required response |
|---|---|
| "Setup is not real work, so no issue is needed" | End the exception after the shell; create the bootstrap issue and linked branch now. |
| "Enable Wiki or a board to look professional" | Keep Wiki off; create a board only for an owned multi-contributor workflow. |
| "Add CODEOWNERS and self-approval rules by default" | Require a real routing need and a merge path a solo maintainer can use. |
| "Copy local files now and review later" | Publish only preflighted, allowlisted content; never copy private history or workplace artifacts. |
| "Configure required checks before CI exists" | Run CI first and use its observed job names. |
| "The requested setting probably applied" | Audit the API result and record unavailable controls or differences. |
