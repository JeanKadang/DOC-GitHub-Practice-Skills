---
name: github-repo-configure
description: Use when handed an existing repository (already created, possibly already has commits) that needs its org-optional settings configured beyond whatever your organization already mandates — not when creating a brand-new repo from scratch (that's github-repo-bootstrap). Covers eliciting decisions on Wiki, Discussions, Project attachment, and label scheme, plus providing dual human/AI-triage issue and PR templates for repos that don't have them yet, and checking a repo against a minimum organization baseline (identity, branch rules, CI, secrets, security scanning, exceptions).
---

# Configuring an already-existing repository

`github-repo-bootstrap` owns the moment a repository doesn't exist yet, or its
initial shell is still incomplete. This skill owns a different, more common
moment: someone handed you a repository that already exists — maybe empty,
maybe with a commit or two, maybe inherited mid-project — and you need to
configure its org-optional settings beyond whatever your organization already
mandates. Issues, PRs, and milestones being in use is presumed already a
given; this skill never asks about those.

Configuring settings on an existing repo is real work, not repo creation —
file an issue for it first, the same way `github-issue-first` requires for
any other work, before making changes.

## The elicitation checklist

Ask these four, in order. Each is a yes/no plus a branch — this skill's job
is knowing what to ask and where the answer routes, not owning the mechanics
behind it.

1. **Wiki** — "Does this repo already have an established, actively-used
   Wiki?" If yes, leave it — treat its content as source of truth for what
   it covers. If no, don't enable one unless explicitly asked. See
   `github-repo-bootstrap`'s scaffolding matrix for the full
   reasoning behind this conditional stance.
2. **Discussions** — "Enable Discussions? If yes, which categories does this
   repo actually need?" See `github-issue-first`'s Discussions section for
   what each category (`Ideas`, `Q&A`, `RFC`, `Announcements`) is for — don't
   cargo-cult all four onto a repo that only needs one or two.
3. **Project board** — "Attach this repo to a board?" Defer entirely to
   `github-projects`'s "Decide whether a board is warranted" table: no board
   for a solo maintainer, yes once a second maintainer is joining, an
   org-level board (see that skill's "Multi-repo boards" section) if work
   already spans several repos.
4. **Label scheme** — "Does the org already have a label convention, or does
   this repo start fresh?" If the org has one, match it — two schemes in one
   repo is worse than either. Otherwise default to `github-issue-first`'s
   P0–P3 priority tiers plus its category-label set.

## Issue and PR templates

If the repo doesn't already have `.github/ISSUE_TEMPLATE/` forms or a pull
request template, offer to add them — recommend it, don't silently add it,
the same posture `github-issue-first` already takes for templates in
general. This skill's `templates/` directory ships four ready-to-copy,
repo-agnostic files:

- `templates/bug.yml` — a Bug Report issue form.
- `templates/improvement.yml` — an Improvement issue form.
- `templates/config.yml` — disables blank issues and points at private
  security reporting instead of a public issue.
- `templates/pull_request_template.md` — a PR body template following the
  `Refs #N`/`Closes #N` closure-gate shape.

Copy them into the target repo as `.github/ISSUE_TEMPLATE/bug.yml`,
`.github/ISSUE_TEMPLATE/improvement.yml`, `.github/ISSUE_TEMPLATE/config.yml`,
and `.github/pull_request_template.md` respectively. `config.yml`'s security
contact link is a literal placeholder
(`https://github.com/<owner>/<repo>/security/policy`) — fill
it in with the target repo's actual `SECURITY.md`/private-reporting URL
before relying on it (see `github-security-response` if that doesn't exist
yet). Both forms' `labels:` line (`bug`, `enhancement`) reconciles with the
label-scheme decision from step 4 above, not the other way around: if the
target repo uses a different scheme, rewrite `labels:` to match it, and
create those labels first if they don't already exist (see
`github-issue-first`'s label section) — an auto-label pointing at a label
that doesn't exist silently does nothing.

Both issue forms are built for dual human/AI-agent use: every field renders
under its own heading in the issue body, so a human reads it like a normal
report and an AI agent doing triage can parse each section (reproduction
steps, environment, impact) without having to split one free-form paragraph
apart itself. Priority is deliberately left unset by the form — auto-labeling
the category (`bug`/`enhancement`) is safe and mechanical, but P0–P3 needs
judgment using the Impact field as input, not a form default.

The forms collect an **expected outcome** in plain language (the bug form's
Expected behavior, the improvement form's Expected outcome), not acceptance
criteria: a reporter should not have to design a test just to report a problem.
Turning that outcome into observable acceptance criteria is a triage step. The
maintainer who triages the issue writes them into the issue body before
implementation starts, and an issue without them is not ready to implement
(`github-issue-first`). Forms that collect criteria directly, like this
package's own, are fine where reporters are maintainers.

These are a first pass, not a final or polished set — expect to refine the
exact fields as real repos actually use them.

## The minimum baseline

When an organization wants every repository held to the same floor, check each
one against this baseline. It is for repositories with more than one maintainer
or shared infrastructure; a solo repository keeps `github-repo-bootstrap`'s
rule of zero required approvals or a permitted maintainer path, never impossible
self-approval. Applying it is configuration work, so file an issue first, read
back what the API reports, and record a control that is unavailable instead of
claiming it is enabled.

### Identity and access

- Single sign-on and multi-factor authentication through the identity provider,
  enforced for the organization or enterprise.
- Repository creation restricted to owners, with a request path (an issue
  form) for everyone else: **Settings, Member privileges, Repository creation**.
  It does not stop members changing the visibility of existing repositories, and
  allowing only private repositories needs GitHub Enterprise Cloud.
- A named, accountable owner for every repository, recorded where the team can
  find it (for example `CODEOWNERS` and the repository description). No unowned
  repositories.
- CI and integration credentials are scoped service accounts or OIDC, never a
  person's token or a shared login.

### Repository governance

- A ruleset on the default branch that requires pull request review and passing
  status checks and blocks force-pushes and deletion (check the plan first, as in
  `github-repo-bootstrap` section 8).
- No tracked file over GitHub's limit: it warns at 50 MiB and blocks above
  100 MiB, and it recommends repositories under 1 GB and strongly under 5 GB. Use
  Git LFS or remove the file before migrating or pushing.
- Empty or dormant repositories are archived, not carried forward unowned.
- A description and a visibility classification are set.

### CI/CD

- Workflows are code in the repository, with least-privilege `permissions:`
  (see `github-security-response`, "Hardening the repo itself").
- No credentials in workflows. OIDC replaces long-lived cloud secrets with
  short-lived tokens; the cloud side must trust conditions on the token's claims,
  and for repositories created after 2026-07-15 the default subject format
  includes the owner and repository IDs, so recheck existing trust conditions.
  Otherwise use environment secrets.
- Production deployments go through a protected environment with required
  reviewers (up to six, one of whom must approve; `Prevent self-review` is
  optional). A Free plan can configure environments only for public
  repositories; private repositories need Team or above.
- Required checks pass before merge. Runners are GitHub-hosted or managed
  self-hosted runners, not unmanaged static agents. Shared build and test
  patterns are reusable workflows, not copies in each repository.

### Security

- Secret scanning and push protection on every repository. Repository-level push
  protection needs GitHub Secret Protection. By default anyone with write access
  can bypass it by giving a reason; a bypass creates an alert, an audit-log event
  and an email, and delegated bypass makes bypass need approval.
- Code scanning (CodeQL) as a required check for the languages it supports.
- Dependabot alerts, the dependency graph and dependency review. The dependency
  review action fails on vulnerable packages by default and can fail on a severity
  threshold or a license allow or deny list; private repositories need GitHub Code
  Security or Advanced Security.
- Audit-log streaming to the central logging destination. Supported
  destinations are Amazon S3, Azure Blob Storage, Azure Event Hubs, Datadog,
  Google Cloud Storage and Splunk; S3 with OIDC is unavailable on GHE.com.

**Exceptions.** Every exception has a named approver, a written justification, a
compensating control and an expiry or review date, recorded on the issue. Past
the date it is a finding again, not a permanent waiver. A repository that is
easy to migrate but fails the baseline is fixed or given a dated exception
before it counts as done.

**Sources and dates.** Checked on 2026-10-22 against docs.github.com: about
rulesets, push protection, OpenID Connect in Actions, deployment environments,
restricting repository creation, streaming the audit log, dependency review, and
large files, and the list of available ruleset rules (require a pull request,
require status checks, block force pushes, restrict deletions, require code
scanning results, among others). Not checked: how required workflows vary by
plan, plan prices, and how managed users change repository creation. The pages are undated, so recheck before you
rely on a limit or a plan requirement.

## Common mistakes

| Mistake | Fix |
|---|---|
| Treating this the same as `github-repo-bootstrap` | Bootstrap owns brand-new repos before an issue exists; this skill's repo already exists and its work goes through normal issue-first |
| Asking about issues, PRs, or milestones | Presumed already in use; not part of this checklist |
| Re-explaining Wiki/Discussions/Projects mechanics here | Cross-reference `github-repo-bootstrap`, `github-issue-first`, `github-projects` — this skill only elicits the decision |
| Silently adding issue/PR templates | Recommend them, add only on explicit confirmation |
| Leaving `config.yml`'s security URL as the placeholder | Fill in the target repo's real reporting URL before use |
| Holding a repository to the baseline without recording what the API actually reported | Record each control as enabled, unavailable on this plan, or an exception with an expiry; never assume |
| Moving a repository that fails the baseline because it converts cleanly | Fix it or record a dated exception first; migrating is not the same as meeting the baseline |
| Copying this repo's own `.github/ISSUE_TEMPLATE/*` instead of this skill's `templates/*` | This repo's own templates are self-referential (its own skill-name dropdown, its own public-content policy) — not portable |
