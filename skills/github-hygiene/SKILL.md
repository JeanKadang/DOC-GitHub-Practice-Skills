---
name: github-hygiene
description: Use when merging PRs, closing issues, reconciling acceptance criteria, cutting a release, tagging a version, creating or closing milestones, decomposing large work into sub-issues, or cleaning up branches at the end of a session — before running gh pr merge, gh issue close, git tag, or any release step.
---

# GitHub Hygiene

Conventions for PR flow, releases, milestones, and cleanup. Follow this instead of re-deriving from git history. Issue filing/triage is covered by the separate `github-issue-first` skill — file the issue first, then start work here. Reviewing a PR before it reaches the merge decision is `github-pr-review`; multi-maintainer board setup is `github-projects`; a release that contains a security fix goes through `github-security-response` first.

## The traceability chain

Every change follows one path, and each link is enforced by the tool rather than by memory:

```
issue (#N, priority + category labels, milestone)
  → gh issue develop <N>         # branch created AND linked to the issue
  → PR with "Refs #N"            # links work without promising completion
  → acceptance criteria verified # each criterion has concrete evidence
  → change "Refs" to "Closes"    # only now may merge close the issue
  → milestone                    # groups the release
  → auto-generated release notes # built from the merged PRs
```

Skipping a link doesn't fail loudly — it just quietly returns traceability to human memory. `gh issue develop` is the one most often skipped and the one that buys the most.

## Acceptance criteria are closure gates

Acceptance criteria belong to the issue's implementation work. A completed issue
means every in-scope criterion was evaluated, supported by concrete evidence, and
checked before closure. A green PR, merged code, elapsed time, sunk effort, or a
release deadline does not substitute for that evaluation.

Before approving a merge that would close an issue:

1. Read every closing issue body and identify its acceptance criteria.
2. Map each criterion to evidence in the diff, tests, CI, documentation, or a
   reproducible verification result.
3. Record a concise completion comment linking that evidence.
4. Update satisfied checkboxes with a newline-preserving body file:
   `gh issue edit <N> --body-file <file>`. Do not round-trip multiline Markdown
   through a PowerShell string array; it can flatten the issue body.
5. If any in-scope criterion is unmet or unevaluated, keep it unchecked and use
   `Refs #N` in the PR. The PR may merge, but the issue stays open.
6. Only when every in-scope criterion passes, change `Refs #N` to `Closes #N`
   and proceed with the ordinary merge gate.

If a criterion is no longer required, record the scope decision and rationale on
the issue before merge. Mark it explicitly as removed or superseded; never check
it as though it was delivered. Deferred work gets a linked follow-up issue and
the original issue remains open unless its recorded scope is formally changed.

After merge, verify the issue state and body. If GitHub auto-closed an issue with
unchecked in-scope criteria, reopen it immediately and reconcile the evidence.
Closing as duplicate, invalid, or not planned is different from completed: use
the appropriate state reason and a human-readable explanation; do not check
criteria that were not delivered.

Audit for completed closures with unchecked task boxes:

```bash
gh issue list --state closed --limit 1000 --json number,title,body,stateReason \
  --jq '.[] | select(.stateReason=="COMPLETED") | select(.body | test("(?m)^\\s*- \\[ \\]")) | "#\\(.number)\\t\\(.title)"'
```

## PR flow

- One branch per issue: `fix/…`, `feat/…`, `ci/…`, `test/…`, `docs/…`, `release/x.y.z`. Branch from a fresh `git pull`ed main — never commit on main.
- Prefer `gh issue develop <N> --name <branch> --base main --checkout` to start work: it creates the branch and links it to the issue. Start the PR body with `Refs #N`; replace it with `Closes #N` only after the acceptance gate passes. When falling back to `git checkout -b`, add the same `Refs #N` link manually.
- Commit style: conventional (`fix:`, `feat:`, `ci:`, `test:`, `release:`), subject ≤ 50 chars, body says why. PR body states what changed and how it was verified.
- Wait for CI green on **every** matrix leg (e.g. windows + ubuntu) before merge — `gh pr checks <N> --watch`. Never merge on a red or pending check, and never bypass required checks with an admin merge.
- **Merging needs the maintainer's explicit approval — ask once per batch** ("merge these N when green?"). The maintainer sometimes merges from the GitHub UI mid-session: before acting on a PR, `git pull` and re-check `gh pr view <N>` state rather than assuming.
- **A closing keyword needs acceptance approval too.** Do not merge a PR carrying
  `Closes #N` until the closure-gate procedure above passes for issue #N.
- Merge with `gh pr merge <N> --merge` (repo history is merge commits, not squash). The repo setting *delete_branch_on_merge* is ON — remote branches clean themselves up.

### When CI goes red

Never re-run a red job hoping it turns green. Read the failure first:

```bash
gh run list --branch <branch> --limit 5
gh run view <run-id> --log-failed          # only the failing steps
```

- **Genuine failure** (test, lint, build): fix it on the same branch with its own commit; the fix rides the existing PR, no new issue needed — it is the same unit of work.
- **Flake** (network blip, runner timeout, race): `gh run rerun <run-id> --failed`. If the same job flakes twice, that is a real defect in the test suite — file it (`github-issue-first`) rather than re-running a third time.
- **Infrastructure/config break** (missing secret, expired token, action removed): file it as its own issue; it will hit every future PR, not just this one.

## Milestones

- **Attach at filing time, not just at scoping.** Every `gh issue create` (from `github-issue-first`) should leave the issue with a milestone before moving on — an issue with no milestone is as incomplete as one with no priority label. Check what exists first (next bullet); if nothing fits yet, create one rather than leaving the issue unbucketed.
- **Check what exists before creating one**: `gh api "repos/{owner}/{repo}/milestones?state=all"`. The repo may have thematic milestones already (e.g. "v2.7 - quality & reliability"); attach to the existing bucket rather than minting a competing `vX.Y.Z` one. Two schemes in one repo is worse than either.
- Absent any existing scheme, group each planned release's issues under a milestone named `vX.Y.Z`. A batch of related findings that isn't yet tied to a specific release version can use a short thematic name instead (e.g. "Role Catalog Consistency") — rename or fold it into a `vX.Y.Z` milestone once a release actually scopes it.
- Attach with `gh issue edit <N> --milestone "<title>"` — including already-closed issues that ship in that release.
- Close the milestone right after the release publishes: `gh api -X PATCH repos/{owner}/{repo}/milestones/<id> -f state=closed`.

## Solo vs multi-contributor tracking

- **Solo repo (default)**: no Projects boards — milestones + labels are the whole tracking system; a board is unmaintained overhead.
- **When the repo gains (or expects) additional contributors**, upgrade the scaffolding — board setup, fields, automation and the rest of the multi-maintainer checklist live in the `github-projects` skill; use it rather than improvising a board here. The parts that belong to this skill either way:
  - A **ruleset** on main: require the CI status checks and at least one PR review; contributors never push to main. See below.
  - Native blocked-by/blocks relations plus `Depends on: #N` body lines, so pick-up order is visible.
  - CODEOWNERS for review routing; CONTRIBUTING.md pointing at the conventions in this skill.
  - Assign every issue at triage — unassigned means unowned.

## Rulesets (protecting main)

**Rulesets supersede classic branch protection.** They stack (several can apply to
one branch), support bypass actors, and can be scoped by name pattern. Prefer them
for anything new; a repo already on classic branch protection works fine, just
don't run both schemes against the same branch.

### Check the plan first — this is gated

**Branch protection of any kind requires a public repo, or GitHub Pro/Team/Enterprise
on a private one.** On a free-plan private repo both endpoints refuse:

```
403  Upgrade to GitHub Pro or make this repository public to enable this feature.
```

That applies to rulesets *and* classic branch protection alike. Verify before
recommending or scripting either:

```bash
gh api repos/{owner}/{repo}/rulesets    # 403 = unavailable on this repo's plan
```

If it 403s, say so plainly rather than filing an issue the maintainer cannot act
on without paying. On a free private repo, required checks are advisory: CI still
runs and still reports, but nothing *enforces* green-before-merge, so merge
discipline (see PR flow above) is the only control there is. That is worth stating
in a review, but as a constraint, not a defect.

**`gh ruleset` is read-only** — it can inspect, not create:

```bash
gh ruleset list
gh ruleset view <id>
gh ruleset check main          # which rules would apply to this branch
```

**Don't trust `gh ruleset list` for "are any configured?"** — on a plan-gated repo
it prints nothing and exits 0, which reads identically to "none configured." The
API call above is the one that distinguishes *none* from *unavailable*.

Creating one goes through the API:

```bash
gh api -X POST repos/{owner}/{repo}/rulesets --input ruleset.json
```

A minimal `ruleset.json` for main — PR required, one approval, CI green, no force
push:

```json
{
  "name": "main protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      } },
    { "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [{ "context": "build (ubuntu-latest)" }]
      } }
  ]
}
```

**On a solo repo, requiring one approval locks you out of your own repo** unless
you add yourself as a bypass actor — which makes the rule advisory. For a solo
maintainer, require the status checks and skip the review requirement; add the
review rule when a second maintainer arrives.

`~DEFAULT_BRANCH` and `~ALL` are the two special ref names. Status-check contexts
must match the **job name** as it appears in `gh pr checks`, not the workflow name.

## Release notes configuration

GitHub generates release notes from merged PRs for free — but unconfigured, it is
a flat list. `.github/release.yml` turns it into a real changelog by mapping labels
to sections:

```yaml
changelog:
  exclude:
    labels: [ignore-for-release]
  categories:
    - title: Breaking Changes
      labels: [breaking]        # not in the default label bootstrap — create it
    - title: Security
      labels: [security]
    - title: Features
      labels: [enhancement]
    - title: Fixes
      labels: [bug]
    - title: Documentation
      labels: [documentation]
    - title: Other Changes
      labels: ["*"]
```

Categories are matched in order and `"*"` catches the rest, so it must be last.
Labels here are the **PR's** labels, not the issue's — label PRs at open time or
the categorisation silently falls through to Other.

**Every label named here must exist on the repo and actually be applied**, or the
category silently never matches — a category keyed on a label nobody creates is
indistinguishable from a working one until a release ships without it. Cross-check
the config against `gh label list` before trusting it.

Preview what it would produce before tagging:

```bash
gh api repos/{owner}/{repo}/releases/generate-notes -f tag_name=v1.2.0 --jq .body
```

This does not replace a hand-written `CHANGELOG.md` — generated notes list *what
merged*, a changelog says *what changed and why*. Keep both; they serve different
readers.

## Sub-issues for any large-scope issue, solo repo included

Use native GitHub sub-issues whenever a single issue's work will span
multiple PRs or sessions — not only when contributors need to pick up
children independently. In a solo repo, the reason isn't parallelization,
it's **resumability and blast-radius control**: if a session ends mid-work,
the next one reads the parent issue's sub-issue list and knows exactly
which units are done, in-flight, or untouched, instead of re-deriving state
from chat history or a half-finished diff. If a bad batch ships, it's
isolated to one sub-issue and one PR, not tangled into a giant one-shot
change.

Trigger: a mechanical or repetitive task decomposes naturally into batches
(one per chapter, module, service, file group, etc.) and doing it all in one
PR would be unreviewable or too risky to revert as a unit.

**Mechanics:**

```bash
# 1. File one issue per batch (same title/label/assignee conventions as
#    github-issue-first), then link each as a native sub-issue of the parent:
id=$(gh api repos/{owner}/{repo}/issues/<child-number> --jq .id)
gh api -X POST repos/{owner}/{repo}/issues/<parent-number>/sub_issues -F sub_issue_id="$id"

# 2. Verify the link:
gh api repos/{owner}/{repo}/issues/<parent-number>/sub_issues --jq '.[].number'
```

**Gotcha:** the endpoint wants the child's internal `id` (a large opaque
number), not its `number` (the small one everyone reads/types) — fetch it
first. And it must be sent as a *typed* field with `-F` (capital), not `-f`
(lowercase, which sends it as a string and gets rejected with `Invalid
property /sub_issue_id: "..." is not of type integer`).

Keep a **checklist in the parent issue's body** alongside the native links —
`- [x] #84 -- batch name (16 files) -- done, PR #90` — since the native
sub-issue UI shows open/closed state but not which PR closed it; the
checklist is what a human skimming the issue actually reads. Update it each
time a batch merges (`gh issue edit <parent> --body "..."`).

Close each child issue individually as its PR merges (`Closes #<child>` in
the PR body does this automatically); leave the parent open until every
child is closed.

## Release recipe (generic)

A release is its own PR, separate from feature PRs, then a tag. The shape is the same in every repo; only the version file and the verification command change.

1. **Pick the version**: patch = fixes only; minor = new behavior; major = breaking. Read the current value from the repo's version source (`*.psd1` `ModuleVersion`, `package.json` `version`, `pyproject.toml`, etc.), not from the last tag — they drift.
2. **Check the release trigger first**: `cat .github/workflows/release.yml` (or equivalent). Does it fire on tag push or on a published release? Does it extract a CHANGELOG section? Whatever it parses is load-bearing — a missing section means a hard fail after the tag is already public.
3. **Branch `release/x.y.z`**: bump the version file; add a `## [x.y.z] - YYYY-MM-DD` section at the top of `CHANGELOG.md` (Added/Changed/Fixed/Security, referencing issue numbers).
4. **Verify locally** before the PR: the repo's manifest/lint check plus its full test suite.
5. **PR titled `release: x.y.z`**; merge on green (with approval).
6. **Tag on updated main**: `git checkout main && git pull && git tag vx.y.z && git push origin vx.y.z`. Tagging a stale local main ships the wrong commit.
7. **Confirm and close out**: `gh release view vx.y.z` (and `gh run list --workflow release.yml` if it did not appear), then close the milestone.

**Worked example — `cve-reporting`:** version lives in `ModuleVersion` in `WinCVEReport.psd1`; `release.yml` extracts the CHANGELOG section on tag push and hard-fails if it is missing; verification is `Test-ModuleManifest ./WinCVEReport.psd1` plus a full Pester run.

## Cleanup checklist (end of session / after release)

- `git checkout main && git pull && git fetch --prune` — local branch listings lie until pruned; verify remote state with `gh api repos/{owner}/{repo}/branches` before reporting leftover branches.
- Delete merged local branches: `git branch --merged main | grep -v main | xargs -r git branch -d`.
- Working tree clean, everything pushed, no open PRs left unmentioned.

## Common mistakes

| Mistake | Fix |
|---|---|
| Tagging before the CHANGELOG section exists | release.yml exits 1; add section in the release PR first |
| Trusting `git branch -r` for remote state | `git fetch --prune` first, or query the API |
| Merging own PR without asking | Ask once per batch; check whether the maintainer already merged it |
| Treating merged PR or green CI as proof every criterion passed | Evaluate each criterion, record evidence, and keep the issue open until all in-scope criteria pass |
| Checking a removed or deferred criterion as delivered | Record the scope decision; link follow-up work; never falsify completion |
| Letting `Closes #N` auto-close an unevaluated issue | Use `Refs #N` until the acceptance gate passes; reopen immediately if it closes early |
| Forgetting the milestone | Create/attach at scoping time, close after release |
| Committing on main before branching | Branch first; if it happens: branch from the commit, then `git reset --hard origin/main` on main |
| `gh api -f sub_issue_id=<id>` rejected with "not of type integer" | Use `-F` (capital), not `-f` — sub_issue_id must be sent as a typed integer, not a string |
| Linking a sub-issue by its `number` instead of its `id` | The sub-issues endpoint wants the internal `id` — `gh api repos/{owner}/{repo}/issues/<number> --jq .id` first |
| Re-running a red CI job without reading the log | `gh run view <id> --log-failed` first; rerun only a diagnosed flake |
| Tagging from a stale local main | `git checkout main && git pull` immediately before `git tag` |
| Reading the current version from the last tag | Read the repo's version file — tag and manifest drift apart |
| `gh ruleset create` | Doesn't exist — `gh ruleset` is read-only; create via `gh api -X POST .../rulesets` |
| Recommending a ruleset on a free-plan private repo | 403 — branch protection needs a public repo or Pro/Team; check `gh api .../rulesets` first |
| Reading `gh ruleset list`'s empty output as "none configured" | It prints nothing and exits 0 when the plan blocks it — use the API call to tell *none* from *unavailable* |
| Requiring 1 approval on a solo repo | Locks you out; require status checks only until a second maintainer exists |
| Release notes all landing in "Other Changes" | Categories match **PR** labels — label the PR, not just the issue |
| A `release.yml` category keyed on a label that doesn't exist | Silently never matches; cross-check against `gh label list` |
| Using milestones as sprints | Milestones are release buckets; iterations belong on a Projects board |
