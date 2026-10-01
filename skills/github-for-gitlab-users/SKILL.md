---
name: github-for-gitlab-users
description: Use when someone coming from GitLab asks how a concept maps to GitHub — "what's the GitHub equivalent of a Merge Request / Epic / Issue Board / group", why .gitlab-ci.yml doesn't just become a workflow file, whether the Wiki is still a good idea, or how to set up GitHub tracking the way they had it in GitLab.
---

# GitHub for GitLab migrants

GitLab and GitHub cover mostly the same ground, and much of the terminology
maps one-for-one. The danger isn't the renamed nouns — it's the handful of
places where GitLab has a real structural feature GitHub simply doesn't, or
where a familiar word (Milestone, Wiki) means something subtly different.

**The single most expensive mistake: assuming `.gitlab-ci.yml` becomes a
GitHub Actions workflow with a file rename.** See below.

## Mapping table

| GitLab | GitHub | Notes |
|---|---|---|
| Merge Request | Pull Request | Straight mapping, different noun |
| Issue | Issue | Straight mapping |
| Epic | Epic issue + native **sub-issues** | One practical nesting level; don't rebuild GitLab's multi-level epic tree |
| **Milestone** | **Milestone**, sometimes | GitLab milestones can double as both release buckets *and* iterations; GitHub's are release-only. See below |
| Issue Board | Projects v2 | A *view* over issues, never the source of truth |
| **Scoped labels** (`key::value`) | Labels | Flat, not scoped — encode the key manually (`priority::high` → `priority-high`) if you need the grouping |
| Approval Rules (required approvers, code owner approval) | CODEOWNERS + **Rulesets** required-review count | Less granular — no per-group approver counts, no security-approval-specific rule |
| `.gitlab-ci.yml` | Actions (`.github/workflows/*.yml`) | Different trigger model and syntax entirely — see below |
| CI/CD variables (group/project/environment scoped) | Actions secrets/variables (repo/org/environment scoped) | Similar idea, different scoping boundaries — recheck what's visible where |
| Protected branches | **Rulesets** (supersede branch protection) | `gh ruleset` is view-only |
| Wiki | GitHub Wiki, conditionally | GitLab's Wiki is genuinely first-class — see below, this isn't a blanket "never" |
| Snippets | Gists | Straight mapping |
| **Groups** (nested subgroups) | Organizations (flat) | **Genuine hole** — no subgroup hierarchy, plan for it |
| Environments/Deployments | Actions Environments | Reasonably direct |
| Release | Release + a tag-triggered workflow | |

## The three traps

### 1. `.gitlab-ci.yml` is not a file you rename

GitLab CI/CD is one file with `stages:`/`jobs:` and a specific execution
model (default sequential stages, `needs:` for DAG-style overrides). GitHub
Actions is a *different* system: multiple workflow files, an entirely
different trigger vocabulary (`on:` events instead of pipeline rules), and no
built-in concept of GitLab's implicit stage ordering. There is no reliable
one-to-one syntax converter. Budget this as a genuine pipeline rewrite, not a
find-and-replace — teams that treat it as a rename discover the gap only
when a deploy job runs at the wrong time or not at all.

### 2. Milestones may need to split into two things

If a team only ever used GitLab Milestones (never adopted GitLab's separate
**Iterations** feature), their milestones have been doing double duty: both
"what ships in the next release" and "what's in this two-week cycle." GitHub
milestones only do the first — they are a **delivery bucket**, not a
time-boxed iteration.

Time-boxed cadence belongs in a **Projects iteration field** instead (note:
it **cannot be created from the CLI** — `gh project field-create` supports
only TEXT, SINGLE_SELECT, DATE, NUMBER; use the web UI or a GraphQL
mutation). Run milestones for releases and an iteration field on the board
for cadence — same split `github-for-ado-users` documents for ADO migrants,
who hit an equivalent trap from a different starting point. See
`github-projects`.

If the team already used GitLab's real Iterations feature and kept it
separate from Milestones, this trap doesn't apply — they already had the
split right.

### 3. The Wiki isn't automatically off-limits

Like Azure DevOps (which also has a Git-backed project Wiki), GitLab's Wiki is
a genuinely first-class, actively-relied-on feature for many teams — a separate git repo, but one plenty of GitLab shops use well. Don't
apply a blanket "never" here. `github-repo-bootstrap`'s conditional stance
is the actual policy: leave an already-established, actively-used
wiki alone and treat its content as source of truth for what it covers; don't
proactively enable a fresh GitHub Wiki on a repo that doesn't already have
one in active use. If the team is migrating *because* their GitLab wiki
sprawled unreviewed, that's the moment to suggest `docs/` in the repo
instead — but that's a call about this specific team's wiki, not a rule
about wikis in general.

## What GitHub has that GitLab does not

**Discussions** works differently from GitLab's issue-comments-as-everything
model. GitLab migrants tend to keep filing exploratory questions and RFCs as
issues, where they rot as never-closeable tickets.

- Discussion = exploring. Threaded, votable, answer-markable, no assignee,
  no "when will this be done."
- Issue = committed to doing. Assignee, priority, milestone.
- **Converting a discussion to an issue is the moment exploration became
  commitment** — that boundary is the whole value.

Categories worth having: `Ideas`, `Q&A`, `RFC`, `Announcements`.

Caveat: `gh discussion` is **in preview and subject to change**. Script
against the GraphQL API if you need stability; the web UI is fine for
humans.

Also new relative to GitLab: **native sub-issues** (GitLab's Epic hierarchy
goes deeper; this is the one-level GitHub equivalent), and
**auto-generated release notes** from merged PR labels.

## The traceability chain

The consistency GitLab gave you through Merge Request-closes-Issue linking,
GitHub gives through one chain. Every change follows it, and each link is
enforced by the tool rather than by discipline:

```
issue (#N, priority + category labels, milestone)
  → gh issue develop <N>        # branch created AND linked to the issue
  → PR with "Refs #N"           # links partial or in-progress delivery
  → criteria + evidence reviewed # acceptance contract must pass
  → change "Refs" to "Closes"   # completed issue may now auto-close
  → milestone                   # groups the release
  → auto-generated release notes # built from merged PRs
```

Break any link and traceability is back to human memory. `gh issue develop`
is the one most often skipped and the one that does the most work.

GitHub does not enforce acceptance criteria the way a configured GitLab
workflow with required approvals can. `Closes #N` merely changes state when
the PR merges; it does not evaluate a checkbox. Treat each criterion as part
of the work: map it to concrete evidence, check it only when satisfied, and
keep `Refs #N` plus an open issue while any in-scope criterion is unmet or
unevaluated. The exact merge and closure gate lives in `github-hygiene`.

## Setting up a repo the way you had it in GitLab

Rough order, with the skill that covers each:

1. Labels (priority + category — flatten any scoped labels) —
   `github-issue-first`
2. Milestones for releases, **not** iterations — `github-releases`
3. Ruleset on the default branch (required checks + review, replacing Approval Rules) —
   `github-releases`
4. Issue forms and PR template — `github-repo-configure`; CODEOWNERS and
   CONTRIBUTING.md — `github-repo-bootstrap` for a new repository,
   `github-repo-review` to audit an existing one
5. Rewrite `.gitlab-ci.yml` as Actions workflows — budget real time, don't
   port syntax line-by-line
6. `.github/release.yml` for categorised release notes — `github-releases`
7. Projects board (replacing Issue Boards) **only if more than one
   maintainer** — `github-projects`
8. Discussions enabled, with categories
9. Decide the Wiki's fate deliberately (see trap 3) rather than defaulting
   either way — `github-repo-bootstrap`

## Common mistakes

| Mistake | Fix |
|---|---|
| Treating `.gitlab-ci.yml` as a rename target | Real pipeline rewrite — different trigger model and syntax |
| Milestones used for both releases and sprints | Milestones = releases; iterations = Projects iteration field |
| Rebuilding GitLab's multi-level Epic hierarchy as issue levels | Epic + sub-issues, one level |
| Assuming scoped labels (`key::value`) carry over | Labels are flat — encode the key manually if grouping matters |
| Assuming Groups/subgroups have a GitHub equivalent | Genuine hole — GitHub orgs are flat, plan for it |
| Defaulting the Wiki to "off" because that's the usual policy | GitLab's Wiki is often genuinely first-class — decide per repo |
| Exploratory ideas filed as issues | Discussions; convert when it becomes actionable |
| Expecting Approval Rules' granularity from Rulesets | Less granular — CODEOWNERS + a required-review count, no per-group approver counts |
| A board as the source of truth | The board mirrors issues; labels and milestones are authoritative |
| Assuming a merged PR means its issue met acceptance criteria | Review every criterion with evidence; use `Refs #N` until the completion contract passes |
