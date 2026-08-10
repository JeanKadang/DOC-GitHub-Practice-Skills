# GitHub practice skills guide

**Policy version:** v0.1.0

**Reviewed:** 2026-08-09

The common delivery path is:

```text
issue with ownership, labels, milestone, and acceptance criteria
  -> issue-linked branch
  -> pull request using Refs #N
  -> criterion-by-criterion evidence
  -> Closes #N only when every closure gate passes
  -> parent epic and milestone reconciliation
  -> release and cleanup
```

Acceptance criteria are evaluated evidence requirements, not clerical boxes.
[WORKFLOW.md](WORKFLOW.md) defines the closure gates in detail.

## Current v0.1.0 policy

The following sections describe the canonical skills as they exist in v0.1.0.

### `github-issue-first`

- **Trigger:** An actionable bug, gap, CI failure, or improvement appears in a
  GitHub repository.
- **Responsibilities and outputs:** Create or triage an assigned issue with
  priority, category, milestone, scope, evidence, and testable criteria.
- **Boundary and handoff:** Send security-sensitive findings to
  `github-security-response`; hand implementation to `github-hygiene`.

### `github-hygiene`

- **Trigger:** Work branches, closure, merge, milestones, releases, or cleanup
  are involved.
- **Responsibilities and outputs:** Maintain the issue-linked traceability
  chain, evaluate criteria, record evidence, and perform approved release and
  cleanup steps.
- **Boundary and handoff:** Individual PR review belongs to
  `github-pr-review`; merging and releasing still require explicit approval.

### `github-pr-review`

- **Trigger:** Reviewing another person's PR, a fork PR, or review feedback.
- **Responsibilities and outputs:** Read the PR, issue, diff, and checks; test
  trusted code after reviewing it; return a deliberate verdict with criterion
  evidence.
- **Boundary and handoff:** Approval is not merge approval; closure and merge
  hand off to `github-hygiene`.

### `github-repo-review`

- **Trigger:** A full repository audit, backlog overhaul, or quality review is
  requested.
- **Responsibilities and outputs:** Produce an evidence-based audit, verify
  suspected bugs when safe, triage issues, and propose a prioritized roadmap.
- **Boundary and handoff:** The workflow is analysis-first. Send exploitable
  findings privately to `github-security-response` and follow the confirmation
  gate before creating issues.

### `github-repo-bootstrap`

- **Trigger:** Before repository creation or while initial setup is incomplete.
- **Responsibilities and outputs:** Preflight public content, create only a
  minimum shell, then use an issue-linked bootstrap branch for conditional
  scaffolding, settings, CI, and the final API audit.
- **Boundary and handoff:** The pre-issue exception ends after the shell;
  ongoing work hands off to the companion skills.

### `github-security-response`

- **Trigger:** A secret, vulnerability, security alert, or private reporting
  need is found.
- **Responsibilities and outputs:** Rotate credentials first, contain
  disclosure, assess reachability, use private advisories, and harden controls.
- **Boundary and handoff:** Never file an unpatched exploitable finding
  publicly; return ordinary non-sensitive work to `github-issue-first`.

### `github-projects`

- **Trigger:** Multiple maintainers need a shared maintained view, or a
  maintainer explicitly requests one.
- **Responsibilities and outputs:** Create or audit a Projects v2 view whose
  fields mirror issue metadata and whose items are real issues or PRs.
- **Boundary and handoff:** Do not create a board for a solo maintainer by
  default; issues, labels, assignees, and milestones remain authoritative.

### `github-for-ado-users`

- **Trigger:** Someone asks how an ADO, TFS, Jira, or similar concept maps to
  GitHub.
- **Responsibilities and outputs:** Explain neutral mappings and the differences
  among issues, types, iterations, milestones, Projects, Actions, Test Plans,
  and repository docs.
- **Boundary and handoff:** Do not reproduce an organization's process;
  workflow execution hands off to the relevant GitHub skill.

## Trigger and handoff model

Start with `github-issue-first` for ordinary committed work. Once the issue and
linked branch exist, `github-hygiene` owns traceability and closure. Use
`github-pr-review` for the review decision and return to `github-hygiene` for an
approved merge. A broad audit starts with `github-repo-review`, but each public
finding it creates follows issue-first mechanics.

`Refs #N` avoids a PR-body closing keyword; it does not guarantee the issue
stays open when GitHub has a connected development branch. After every merge,
immediately audit the linked issue state and body. If it is closed while any
in-scope acceptance criterion is unchecked, unmet, or unevaluated, reopen it
immediately and record the reason. For work that spans the PR merge, either use
this audit-and-reopen flow or track the PR-scoped work in a child issue and leave
the release-spanning parent unconnected. Every PR-scoped criterion still needs
evidence before merge.

Security is a private branch in the flow: `github-security-response` replaces
the public issue and PR path until coordinated disclosure is safe. Repository
creation begins with `github-repo-bootstrap`. `github-projects` adds a view only
when shared ownership justifies the maintenance. `github-for-ado-users` explains
the mapping but does not mutate a repository by itself.

## Examples

### Ordinary change

A missing validation rule becomes an assigned issue with acceptance criteria and
a milestone. Create a linked `feat/...` branch, open a focused PR with
`Refs #N`, and attach test output to the relevant criterion. Replace `Refs` with
`Closes` only after every criterion is met. After merge, verify the issue and
parent epic, then include the PR in the release milestone.

### Repository review

Read the repository, workflows, package metadata, settings, and existing issues.
Label findings `CONFIRMED` only after a safe reproduction; otherwise label them
`PLAUSIBLE`. Present an issue-creation plan and pause before creating more than
ten issues. Keep an exploitable finding out of the public roadmap and hand it to
`github-security-response`.

### Pull-request review

Read the PR body, linked issue, diff, and all checks before running code. Map
each closing criterion to evidence. Request changes if `Closes #N` remains while
a criterion is unmet or unevaluated; a sound partial PR can proceed with
`Refs #N`. Review approval does not authorize merging.

### Private security response

If a credential appears in history, do not quote it or file a public issue.
Rotate it first, assess access logs and blast radius, remove it from the working
tree, and use a private advisory for fix coordination. History rewriting needs
explicit maintainer approval and does not replace rotation.

### Multi-maintainer tracking

When a second maintainer needs a shared view, confirm the board and its owner,
then create a Projects v2 board. Add real issues and PRs, mirror the repository's
priority labels, and enable closed-to-Done and archival automation in the web
interface. The issue remains the source of ownership and dependency truth.

### Release

Create a separate `release/x.y.z` issue-linked branch and PR, update the version
source and changelog, and run the complete validation. After explicit approval
and green CI, merge, update local `main`, tag that exact commit, verify the
release workflow, close the release milestone, and prune merged branches.

### New repository

Decide the owner, visibility, licence, maintainers, and release intent; scan the
allowlisted public content. Create only the metadata, README, licence, and
default branch. Immediately file the bootstrap issue and create its linked
branch. Add warranted community files and CI there, observe the CI job names,
then add a plan-supported ruleset that does not require solo self-approval.

## Proposed improvements, not current policy

These are candidates for separate issues after v0.1.0. They are not requirements
implemented by the current skills:

1. Make parent-epic reconciliation an explicit step in every closing skill.
2. Automate audits for completed issues with unchecked criteria and stale epic
   checkboxes.
3. Record whether milestones are release or thematic buckets before closure.
4. Add more PowerShell-native examples alongside Bash-oriented examples.
5. Verify issue-versus-PR object type automatically when numbers overlap.
6. Record tested GitHub CLI and API versions with compatibility-sensitive
   commands.

Maintainers must update the canonical skill contract and this policy section in
separate, reviewed changes before any proposal becomes current behavior.
