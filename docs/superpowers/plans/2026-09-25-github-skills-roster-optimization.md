# GitHub Skills Roster Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the canonical skill roster from 8 to 10 by splitting `github-hygiene` into a trimmed `github-hygiene` plus a new `github-releases`, and adding a new `github-contributing` skill for the outside-contributor workflow — closing a coverage gap and an overload signal found in an audit of the existing set.

**Architecture:** Each new/changed skill is a self-contained `SKILL.md` + `agents/openai.yaml` pair under `skills/<name>/`. The roster is registered in three independently-hardcoded places (`contracts/skill-inventory.json`, `scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, `scripts/install-skills.ps1`'s `$canonicalRequiredFiles`) plus two literal skill-count assumptions inside `install-skills.ps1` itself; `tests/roster-consistency.test.mjs` cross-checks the first three automatically, so every task that touches the roster keeps them in lockstep. Content migrates by relocation (rulesets/release-notes/release-recipe/milestones move verbatim from `github-hygiene` into `github-releases`; "Responding to review on your own PR" moves verbatim from `github-pr-review` into `github-contributing`) plus new-ground content for the fork/sync workflow.

**Tech Stack:** Markdown (`SKILL.md`, docs), YAML (`agents/openai.yaml`, GitHub issue forms), PowerShell (`install-skills.ps1`), Node.js `node --test` (validation suite), `markdownlint-cli2`.

**Spec:** `docs/superpowers/specs/2026-09-25-github-skills-roster-optimization-design.md`

## Global Constraints

- Target version: `0.2.0` (`package.json` and `contracts/skill-inventory.json` `packageVersion` must match — enforced by `validate-skills.mjs`).
- The `Refs #N` closure-gate paragraph's wording must not change, and must not be added to `github-releases` or `github-contributing` (per spec Decision §3 and `tests/workflow-policy.test.mjs`'s fixed `policyFiles` list — do not add either new skill to that list).
- Every skill directory needs exactly `SKILL.md` + `agents/openai.yaml` (no `review-prompt.md`-style extra files for the two new skills).
- `agents/openai.yaml` requires non-empty `interface.display_name`, `interface.short_description`, `interface.default_prompt` (enforced by `validate-skills.mjs`).
- `SKILL.md` frontmatter `name:` must equal its directory name (enforced by `validate-skills.mjs`).
- `npm run check` (validate + test + lint:markdown) must pass after every task that touches `skills/`, `contracts/`, `scripts/`, or `tests/`.
- This repo's own `github-issue-first` workflow applies to this work: file the issue and create the linked branch before any commit (Task 1), `Refs #N` in every commit message until Task 12's closure gate, milestone `v0.2.0`.
- Follow existing file conventions: skill prose style (imperative, dense, tables for mistakes/decisions), no code comments beyond what the SKILL.md content itself needs.

## Review Focus

- **A partially-completed roster edit (new skill dir added, manifests not yet updated) breaks `npm run validate` with "Unregistered skill directory."** Every task that adds a skill directory registers it in all three manifest locations in the same task, never split across tasks.
- **`install-skills.ps1`'s hardcoded `-ne 8` check silently blocks a correct 10-skill inventory** even after the JSON/JS manifests are updated, producing a confusing "Source inventory does not contain the canonical eight-skill inventory" error that doesn't mention the real (now-10) count. Task 5 fixes this before any task that relies on installer dry-runs.
- **A cross-reference left pointing at the old skill after content moves** (e.g., `github-issue-first` still saying "milestone conventions live in `github-hygiene`" after milestones move to `github-releases`) — silently wrong, not caught by any automated check. Each content-migration task updates every inbound cross-reference in the same task, not as a follow-up.
- **The `Refs #N` paragraph accidentally copied into a new skill** (e.g., if `github-releases` picks it up because milestone-closure language brushes against it) would desync from `tests/workflow-policy.test.mjs`'s fixed `policyFiles` list without failing any test (the test only requires the paragraph in *listed* files, it doesn't forbid it elsewhere) — a silent drift the test suite can't catch. Task 3's content-migration step explicitly excludes that paragraph from what moves.
- **A skill's frontmatter `description` drifting from what its content actually covers** after the hygiene split (e.g., `github-hygiene`'s description still mentioning "cutting a release" after the release recipe moves out) — not caught by `validate-skills.mjs` (it only checks the `name` field), so Task 3 and Task 4 each end with a manual description/content match check as their last step.

---

## Task 1: File the tracking issue and create the branch

**Files:** None (GitHub state only).

**Interfaces:** None — this task produces the issue number `N` that every later commit message references as `Refs #N`.

- [ ] **Step 1: Check whether the `v0.2.0` milestone already exists**

Run: `gh api "repos/JeanKadang/DOC-GitHub-Practice-Skills/milestones?state=all" --jq '.[].title'`
Expected: a list of milestone titles. If `v0.2.0` is not among them, continue to Step 2. If it already exists, skip to Step 3.

- [ ] **Step 2: Create the `v0.2.0` milestone**

Run:
```bash
gh api -X POST repos/JeanKadang/DOC-GitHub-Practice-Skills/milestones \
  -f title='v0.2.0' \
  -f description='Roster optimization: split github-hygiene into hygiene + releases, add github-contributing.'
```
Expected: JSON response with `"number"` and `"title": "v0.2.0"`.

- [ ] **Step 3: File the issue**

Run:
```bash
gh issue create \
  --title "Split github-hygiene into hygiene+releases and add github-contributing" \
  --body "$(cat <<'EOF'
Splits the overloaded github-hygiene skill (328 lines, 5 distinct triggers)
into a trimmed github-hygiene (PR flow, closure gate, cleanup) and a new
github-releases (rulesets, release notes, release recipe, milestones). Adds
a new github-contributing skill for the outside-contributor workflow
(fork/sync/submit a PR to a repo you don't maintain), absorbing
github-pr-review's "Responding to review on your own PR" section.

See docs/superpowers/specs/2026-09-25-github-skills-roster-optimization-design.md
for the full design and file-by-file blast radius.

## Acceptance criteria

- [ ] github-releases skill exists with rulesets/release-notes/release-recipe/milestones content relocated from github-hygiene
- [ ] github-contributing skill exists with fork/sync/submit content plus the relocated "Responding to review on your own PR" section
- [ ] github-hygiene trimmed to PR flow/closure gate/CI-red/sub-issues/cleanup; description narrowed
- [ ] Cross-references in github-issue-first, github-repo-bootstrap, github-projects, github-for-ado-users, github-pr-review repointed to the new skills
- [ ] contracts/skill-inventory.json, scripts/validate-skills.mjs, scripts/install-skills.ps1 all register both new skills; roster-consistency test passes
- [ ] install-skills.ps1's hardcoded skill-count literals (8) replaced with a dynamic count
- [ ] tests/install-skills.test.mjs and tests/validate-skills.test.mjs updated for a 10-skill roster; full suite passes
- [ ] docs/GUIDE.md, docs/MAINTAINING.md, docs/claude.md, docs/openai-codex.md, docs/copilot.md, README.md, CONTRIBUTING.md updated
- [ ] .github/ISSUE_TEMPLATE/bug.yml and improvement.yml dropdowns include both new skills
- [ ] docs/adr/0002 records the split/addition decision; docs/adr/README.md indexes it
- [ ] package.json and contracts/skill-inventory.json both at 0.2.0
- [ ] npm run check passes; a live -DryRun install for -Target Both and -Target Codex shows 10 skills with correct plans
EOF
)" \
  --assignee "@me" \
  --label "enhancement" \
  --label "tooling"
```
Expected: output ending in the new issue's URL, e.g. `https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/<N>`. Record `<N>` — every later commit's `Refs #N` uses it.

- [ ] **Step 4: Attach the milestone**

Run: `gh issue edit <N> --milestone "v0.2.0"`
Expected: no error.

- [ ] **Step 5: Create the linked branch**

Run: `gh issue develop <N> --name "feat/skills-roster-optimization" --base main --checkout`
Expected: local branch `feat/skills-roster-optimization` checked out, linked to issue `<N>` (confirm with `git branch --show-current`).

---

## Task 2: Add the `github-releases` skill and register it in the roster

**Files:**
- Create: `skills/github-releases/SKILL.md`
- Create: `skills/github-releases/agents/openai.yaml`
- Modify: `contracts/skill-inventory.json`
- Modify: `package.json`
- Modify: `scripts/validate-skills.mjs`
- Modify: `scripts/install-skills.ps1:18-27` (`$canonicalRequiredFiles`)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: the skill name `github-releases`, consumed by Task 3 (hygiene trim + cross-references), Task 5 (installer count fix, same file), Task 6 (repo-bootstrap/projects/ado-users cross-references), and every doc task.

- [ ] **Step 1: Create `skills/github-releases/SKILL.md`**

This relocates the Rulesets, Release notes configuration, and Release recipe sections verbatim from the current `skills/github-hygiene/SKILL.md`, plus a new Milestones section adapted from that file's existing Milestones bullets (currently under "Milestones" in `github-hygiene/SKILL.md`), and the matching rows from `github-hygiene`'s "Common mistakes" table. Do **not** include the `Refs #N` closure-gate paragraph — that stays exclusive to `github-hygiene`.

```markdown
---
name: github-releases
description: Use when cutting a release, tagging a version, configuring branch protection or rulesets, or creating/closing milestones — before running git tag, gh api .../rulesets, or any release step.
---

# GitHub Releases

Conventions for milestones, branch protection, and cutting a release. Issue filing/triage is `github-issue-first`; PR flow and the acceptance-criteria closure gate are `github-hygiene` — file the issue and merge the PR there, then use this skill to ship it. Reviewing a PR before it reaches the merge decision is `github-pr-review`; multi-maintainer board setup is `github-projects`; a release that contains a security fix goes through `github-security-response` first.

## Milestones

- **Attach at filing time, not just at scoping.** Every `gh issue create` (from `github-issue-first`) should leave the issue with a milestone before moving on — an issue with no milestone is as incomplete as one with no priority label. Check what exists first (next bullet); if nothing fits yet, create one rather than leaving the issue unbucketed.
- **Check what exists before creating one**: `gh api "repos/{owner}/{repo}/milestones?state=all"`. The repo may have thematic milestones already (e.g. "v2.7 - quality & reliability"); attach to the existing bucket rather than minting a competing `vX.Y.Z` one. Two schemes in one repo is worse than either.
- Absent any existing scheme, group each planned release's issues under a milestone named `vX.Y.Z`. A batch of related findings that isn't yet tied to a specific release version can use a short thematic name instead (e.g. "Role Catalog Consistency") — rename or fold it into a `vX.Y.Z` milestone once a release actually scopes it.
- Attach with `gh issue edit <N> --milestone "<title>"` — including already-closed issues that ship in that release.
- Close the milestone right after the release publishes: `gh api -X PATCH repos/{owner}/{repo}/milestones/<id> -f state=closed`.

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
discipline (see `github-hygiene`'s PR flow) is the only control there is. That is
worth stating in a review, but as a constraint, not a defect.

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

## Release recipe (generic)

A release is its own PR, separate from feature PRs, then a tag. The shape is the same in every repo; only the version file and the verification command change.

1. **Pick the version**: patch = fixes only; minor = new behavior; major = breaking. Read the current value from the repo's version source (`*.psd1` `ModuleVersion`, `package.json` `version`, `pyproject.toml`, etc.), not from the last tag — they drift.
2. **Check the release trigger first**: `cat .github/workflows/release.yml` (or equivalent). Does it fire on tag push or on a published release? Does it extract a CHANGELOG section? Whatever it parses is load-bearing — a missing section means a hard fail after the tag is already public.
3. **Branch `release/x.y.z`**: bump the version file; add a `## [x.y.z] - YYYY-MM-DD` section at the top of `CHANGELOG.md` (Added/Changed/Fixed/Security, referencing issue numbers).
4. **Verify locally** before the PR: the repo's manifest/lint check plus its full test suite.
5. **PR titled `release: x.y.z`**; merge on green (with approval, per `github-hygiene`'s PR flow).
6. **Tag on updated main**: `git checkout main && git pull && git tag vx.y.z && git push origin vx.y.z`. Tagging a stale local main ships the wrong commit.
7. **Confirm and close out**: `gh release view vx.y.z` (and `gh run list --workflow release.yml` if it did not appear), then close the milestone.

**Worked example — `cve-reporting`:** version lives in `ModuleVersion` in `WinCVEReport.psd1`; `release.yml` extracts the CHANGELOG section on tag push and hard-fails if it is missing; verification is `Test-ModuleManifest ./WinCVEReport.psd1` plus a full Pester run.

## Common mistakes

| Mistake | Fix |
|---|---|
| Tagging before the CHANGELOG section exists | release.yml exits 1; add section in the release PR first |
| Forgetting the milestone | Create/attach at scoping time, close after release |
| `gh ruleset create` | Doesn't exist — `gh ruleset` is read-only; create via `gh api -X POST .../rulesets` |
| Recommending a ruleset on a free-plan private repo | 403 — branch protection needs a public repo or Pro/Team; check `gh api .../rulesets` first |
| Reading `gh ruleset list`'s empty output as "none configured" | It prints nothing and exits 0 when the plan blocks it — use the API call to tell *none* from *unavailable* |
| Requiring 1 approval on a solo repo | Locks you out; require status checks only until a second maintainer exists |
| Release notes all landing in "Other Changes" | Categories match **PR** labels — label the PR, not just the issue |
| A `release.yml` category keyed on a label that doesn't exist | Silently never matches; cross-check against `gh label list` |
| Tagging from a stale local main | `git checkout main && git pull` immediately before `git tag` |
| Reading the current version from the last tag | Read the repo's version file — tag and manifest drift apart |
| Using milestones as sprints | Milestones are release buckets; iterations belong on a Projects board |
```

- [ ] **Step 2: Create `skills/github-releases/agents/openai.yaml`**

```yaml
interface:
  display_name: "GitHub Releases"
  short_description: "Manage GitHub milestones, branch protection, and releases"
  default_prompt: "Use $github-releases to guide this GitHub release, tagging, ruleset, or milestone workflow."
```

- [ ] **Step 3: Register the skill in `contracts/skill-inventory.json`**

Add an entry (keep alphabetical order to match the existing list) and bump `packageVersion`:

```json
{ "name": "github-releases", "requiredFiles": ["SKILL.md", "agents/openai.yaml"] },
```

Insert it after the `github-projects` entry and before `github-repo-bootstrap` (alphabetical). Also change line 3, `"packageVersion": "0.1.1"` → `"packageVersion": "0.2.0"`.

**Also bump `package.json`'s `version` field in the same step** — `validate-skills.mjs` requires `inventory.packageVersion === packageData.version` exactly, so these two files move together or `npm run validate` fails with "packageVersion must match package.json version." In `package.json`, change line 3, `"version": "0.1.1"` → `"version": "0.2.0"`.

- [ ] **Step 4: Register the skill in `scripts/validate-skills.mjs`**

In the `CANONICAL_SKILLS` array (lines 7-19), insert after the `github-projects` entry:

```js
  { name: 'github-releases', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
```

- [ ] **Step 5: Register the skill in `scripts/install-skills.ps1`**

In `$canonicalRequiredFiles` (lines 18-27), insert after the `github-projects` line:

```powershell
    'github-releases' = @('SKILL.md', 'agents/openai.yaml')
```

- [ ] **Step 6: Run validation**

Run: `npm run validate`
Expected: `Validated 9 skills: 0 errors, 0 warnings.` (9, not yet 10 — `github-contributing` is Task 4).

- [ ] **Step 7: Run the roster-consistency and markdownlint checks**

Run: `npm test -- tests/roster-consistency.test.mjs && npm run lint:markdown`
Expected: both pass.

- [ ] **Step 8: Description/content match check**

Re-read `skills/github-releases/SKILL.md`'s frontmatter `description` against its body: confirm every clause (cutting a release, tagging, branch protection/rulesets, milestones) has a matching section, and no clause lacks one.

- [ ] **Step 9: Commit**

```bash
git add skills/github-releases contracts/skill-inventory.json package.json scripts/validate-skills.mjs scripts/install-skills.ps1
git commit -m "feat: add github-releases skill

Refs #<N>"
```

---

## Task 3: Trim `github-hygiene` and remove the relocated content

**Files:**
- Modify: `skills/github-hygiene/SKILL.md`
- Modify: `skills/github-hygiene/agents/openai.yaml`

**Interfaces:**
- Consumes: nothing (this task only removes content already relocated in Task 2).
- Produces: the trimmed `github-hygiene` description and section set, consumed by every doc/README task's cross-reference to "what hygiene covers now."

- [ ] **Step 1: Remove the relocated sections from `skills/github-hygiene/SKILL.md`**

Delete these sections in full (content now lives in `skills/github-releases/SKILL.md` from Task 2): "Milestones", "Rulesets (protecting main)" (including its "Check the plan first — this is gated" subsection), "Release notes configuration", "Release recipe (generic)".

In the remaining "Common mistakes" table, delete these rows (now covered by `github-releases`'s own table): "Tagging before the CHANGELOG section exists", "Forgetting the milestone", "`gh ruleset create`", "Recommending a ruleset on a free-plan private repo", "Reading `gh ruleset list`'s empty output as 'none configured'", "Requiring 1 approval on a solo repo", "Release notes all landing in 'Other Changes'", "A `release.yml` category keyed on a label that doesn't exist", "Tagging from a stale local main", "Reading the current version from the last tag", "Using milestones as sprints".

Keep every other row and section (traceability chain, acceptance-criteria closure gate, PR flow, "When CI goes red", "Solo vs multi-contributor tracking", "Sub-issues for any large-scope issue", cleanup checklist, and the remaining "Common mistakes" rows about PR/closure/branches).

- [ ] **Step 2: Update the "Solo vs multi-contributor tracking" section's ruleset bullet**

Find the bullet:
```markdown
  - A **ruleset** on main: require the CI status checks and at least one PR review; contributors never push to main. See below.
```
Replace `See below.` with `See \`github-releases\`.` (the ruleset detail no longer lives "below" in this file).

- [ ] **Step 3: Update the frontmatter `description`**

Change:
```yaml
description: Use when merging PRs, closing issues, reconciling acceptance criteria, cutting a release, tagging a version, creating or closing milestones, decomposing large work into sub-issues, or cleaning up branches at the end of a session — before running gh pr merge, gh issue close, git tag, or any release step.
```
to:
```yaml
description: Use when merging PRs, closing issues, reconciling acceptance criteria, or decomposing large work into sub-issues, or cleaning up branches at the end of a session — before running gh pr merge, gh issue close, or any merge step.
```

- [ ] **Step 4: Update the intro paragraph's companion-skill line**

Find:
```markdown
Conventions for PR flow, releases, milestones, and cleanup. Issue filing/triage is covered by the separate `github-issue-first` skill — file the issue first, then start work here. Reviewing a PR before it reaches the merge decision is `github-pr-review`; multi-maintainer board setup is `github-projects`; a release that contains a security fix goes through `github-security-response` first.
```
Replace with:
```markdown
Conventions for PR flow, closure, and cleanup. Issue filing/triage is covered by the separate `github-issue-first` skill — file the issue first, then start work here. Cutting a release, tagging, branch protection, and milestones are `github-releases` — merge here, then ship there. Reviewing a PR before it reaches the merge decision is `github-pr-review`; multi-maintainer board setup is `github-projects`; a release that contains a security fix goes through `github-security-response` first.
```

- [ ] **Step 5: Update `skills/github-hygiene/agents/openai.yaml`**

Change:
```yaml
  short_description: "Manage GitHub issue, PR, and release hygiene"
  default_prompt: "Use $github-hygiene to guide this GitHub issue closure, merge, or release workflow."
```
to:
```yaml
  short_description: "Manage GitHub PR flow, issue closure, and repo hygiene"
  default_prompt: "Use $github-hygiene to guide this GitHub PR merge, issue closure, or cleanup workflow."
```

- [ ] **Step 6: Run validation and markdownlint**

Run: `npm run validate && npm run lint:markdown`
Expected: both pass, still `Validated 9 skills: 0 errors, 0 warnings.`

- [ ] **Step 7: Run the workflow-policy test**

Run: `npm test -- tests/workflow-policy.test.mjs`
Expected: pass — confirms the `Refs #N` closure-gate paragraph is still intact and unchanged in `skills/github-hygiene/SKILL.md`.

- [ ] **Step 8: Description/content match check**

Re-read `skills/github-hygiene/SKILL.md`'s frontmatter `description` against its remaining body: confirm no clause (release, tagging, milestone) remains in the description without matching content, and every remaining section (PR flow, closure gate, CI-red, sub-issues, cleanup) is named or implied by the description.

- [ ] **Step 9: Commit**

```bash
git add skills/github-hygiene
git commit -m "refactor: trim github-hygiene to PR flow and closure gate

Rulesets, release notes, release recipe, and milestones moved to
github-releases.

Refs #<N>"
```

---

## Task 4: Add the `github-contributing` skill and register it in the roster

**Files:**
- Create: `skills/github-contributing/SKILL.md`
- Create: `skills/github-contributing/agents/openai.yaml`
- Modify: `skills/github-pr-review/SKILL.md`
- Modify: `contracts/skill-inventory.json`
- Modify: `scripts/validate-skills.mjs`
- Modify: `scripts/install-skills.ps1:18-27` (now includes the `github-releases` line from Task 2)

**Interfaces:**
- Consumes: `github-pr-review`'s existing "Fork PRs" section content (read-only reference, not moved) and its "Responding to review on your own PR" section (moved verbatim).
- Produces: the skill name `github-contributing`, consumed by Task 6 (bootstrap handoffs) and every doc task.

- [ ] **Step 1: Remove "Responding to review on your own PR" from `skills/github-pr-review/SKILL.md`**

Delete this section in full:
```markdown
## Responding to review on your own PR

Covered in depth by `superpowers:receiving-code-review` — the short version:
verify each point technically before implementing it, push back with evidence when
a suggestion is wrong, and never make a change you can't explain. Reply to each
thread and resolve it only once the change is pushed.
```

- [ ] **Step 2: Add a cross-reference in `skills/github-pr-review/SKILL.md`'s "Fork PRs" section**

At the end of the "Fork PRs" section (after the "Ask for a rebase, don't rebase for them" bullet), add:
```markdown

Submitting a PR from a fork, syncing it with upstream, or responding to review on your own PR is `github-contributing`; this section covers reviewing someone else's fork PR, not submitting your own.
```

- [ ] **Step 3: Create `skills/github-contributing/SKILL.md`**

```markdown
---
name: github-contributing
description: Use when submitting a pull request to a repository you don't maintain — forking, syncing a fork with upstream, creating a PR as an outside contributor, or responding to review feedback on your own PR in someone else's repo — before running gh repo fork, git push to a fork, or gh pr create against an upstream repository.
---

# Contributing to someone else's repository

Every other skill in this set assumes maintainer authority — merge, tag, release.
This one is the other side: you're proposing a change to a repo you don't own.
The target repo's own `CONTRIBUTING.md`, issue templates, and conventions govern,
not this repository's. Read them before opening anything.

## Forking and staying in sync

```bash
gh repo fork <owner>/<repo> --clone --remote      # creates your fork, clones it,
                                                    # and wires up both remotes
cd <repo>
git remote -v                                      # origin = your fork, upstream = the source
```

If `gh repo fork` wasn't used to clone, wire the remotes by hand:

```bash
git remote add upstream https://github.com/<owner>/<repo>.git
```

Before starting new work, sync your fork's default branch with upstream — don't
build on a stale base:

```bash
git fetch upstream
git checkout main
git merge upstream/main       # or: git rebase upstream/main, if you haven't pushed main
git push origin main
```

**Sync before every new branch, not just once.** A fork that drifts weeks behind
upstream turns an easy PR into a painful rebase later.

## Branching and submitting

Branch from your synced fork main, same conventions as working in your own repo
(see `github-hygiene`'s PR flow for the general shape) — but the commit and PR
body conventions are the **target repo's**, not this one's. Don't impose `Refs #N`
/ `Closes #N` discipline on a repo that doesn't use it; check its `CONTRIBUTING.md`
and existing merged PRs first.

```bash
git checkout -b fix/<short-description>
# ... make the change, commit ...
git push -u origin fix/<short-description>
gh pr create --repo <owner>/<repo> --title "..." --body "..."
```

`gh pr create` without `--repo` targets the fork itself if run from inside it and
`origin` is the fork — pass `--repo <owner>/<repo>` explicitly, or `--base` and
let `gh` infer the upstream base, to avoid accidentally opening the PR against
your own fork's main instead of upstream.

**Draft PRs** (`gh pr create --draft`) signal work-in-progress or "review the
approach before I finish" — use one when you want early feedback rather than a
merge-ready review. Mark it ready with `gh pr ready <N>` when done.

## What you don't control

You have no merge authority and usually no repo secrets. Concretely:

- **Your fork PR's `GITHUB_TOKEN` is read-only** in the target repo's workflows,
  and secrets are not available to them — a CI job that needs a secret will skip
  or fail on your PR, and that's expected, not something to "fix" by asking a
  maintainer to change the workflow. See `github-pr-review`'s "Fork PRs" section
  for the maintainer's-side view of the same mechanic.
- **You can't merge your own PR** into a repo you don't have write access to, and
  shouldn't ask to be added as a maintainer just to self-merge — that defeats the
  review the process exists for.
- **A maintainer may push to your PR branch** if you left "Allow edits by
  maintainers" checked (the default) — expect commits from them on your branch,
  and `git pull` before pushing again to avoid a diverging history.

## Responding to review on your own PR

Covered in depth by `superpowers:receiving-code-review` — the short version:
verify each point technically before implementing it, push back with evidence when
a suggestion is wrong, and never make a change you can't explain. Reply to each
thread and resolve it only once the change is pushed.

Push additional commits to the same branch rather than force-pushing over review
history, unless the maintainer's conventions ask for a clean/squashed history
before merge — check their `CONTRIBUTING.md` or ask.

## Common mistakes

| Mistake | Fix |
|---|---|
| Building new work on a stale fork main | `git fetch upstream && git merge upstream/main` before every new branch |
| `gh pr create` opens against your own fork instead of upstream | Pass `--repo <owner>/<repo>` explicitly |
| Asking a maintainer to "fix" a fork PR's failing secret-dependent job | Fork PRs get no secrets and a read-only token by design — expected, not a bug |
| Imposing this repo's `Refs #N`/`Closes #N` convention on the target repo | Follow the target repo's own `CONTRIBUTING.md` and observed PR conventions |
| Force-pushing over a maintainer's review comments or their pushed commits | Push additional commits; `git pull` first if they pushed to your branch |
| Asking for maintainer access to self-merge | Let the maintainer merge — review authority isn't yours to grant yourself |
```

- [ ] **Step 4: Create `skills/github-contributing/agents/openai.yaml`**

```yaml
interface:
  display_name: "GitHub Contributing"
  short_description: "Submit and manage a pull request to a repo you don't maintain"
  default_prompt: "Use $github-contributing to guide forking, syncing, or submitting a PR to an upstream repository."
```

- [ ] **Step 5: Register the skill in `contracts/skill-inventory.json`**

Insert after the `github-for-ado-users` entry (line 5) — wait, keep alphabetical: `github-contributing` sorts before `github-for-ado-users`. Insert as the **first** entry in the `skills` array, before `github-for-ado-users`:

```json
{ "name": "github-contributing", "requiredFiles": ["SKILL.md", "agents/openai.yaml"] },
```

- [ ] **Step 6: Register the skill in `scripts/validate-skills.mjs`**

In `CANONICAL_SKILLS`, insert as the first entry, before `github-for-ado-users`:

```js
  { name: 'github-contributing', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
```

- [ ] **Step 7: Register the skill in `scripts/install-skills.ps1`**

In `$canonicalRequiredFiles`, insert as the first entry, before `'github-for-ado-users'`:

```powershell
    'github-contributing' = @('SKILL.md', 'agents/openai.yaml')
```

- [ ] **Step 8: Run validation**

Run: `npm run validate`
Expected: `Validated 10 skills: 0 errors, 0 warnings.`

- [ ] **Step 9: Run roster-consistency, workflow-policy, and markdownlint**

Run: `npm test -- tests/roster-consistency.test.mjs tests/workflow-policy.test.mjs && npm run lint:markdown`
Expected: all pass. (`workflow-policy.test.mjs` confirms `github-pr-review/SKILL.md` doesn't need the `Refs #N` paragraph — it was never in `policyFiles` — and that the paragraph is untouched in the files that do require it.)

- [ ] **Step 10: Description/content match check**

Re-read `skills/github-contributing/SKILL.md`'s frontmatter `description` against its body: confirm forking, syncing, submitting, and responding-to-review are each covered, and `skills/github-pr-review/SKILL.md`'s description still matches its now-smaller body (no leftover mention of "responding to review on your own PR" as something that skill owns).

- [ ] **Step 11: Commit**

```bash
git add skills/github-contributing skills/github-pr-review contracts/skill-inventory.json scripts/validate-skills.mjs scripts/install-skills.ps1
git commit -m "feat: add github-contributing skill

Absorbs github-pr-review's \"Responding to review on your own PR\" section.

Refs #<N>"
```

---

## Task 5: Fix `install-skills.ps1`'s hardcoded skill-count literals

**Files:**
- Modify: `scripts/install-skills.ps1:220`, `:375`, `:459`

**Interfaces:**
- Consumes: `$expectedSkillNames` (already computed at line 28 as `@($canonicalRequiredFiles.Keys)`, now 10 entries after Tasks 2 and 4).
- Produces: an installer that validates and reports the actual roster size instead of a stale literal, consumed by Task 12's live dry-run verification.

- [ ] **Step 1: Replace the hardcoded count check**

At line 220, find:
```powershell
    $inventoryNames.Count -ne 8 -or
```
Replace with:
```powershell
    $inventoryNames.Count -ne $expectedSkillNames.Count -or
```

- [ ] **Step 2: Replace the dry-run output literal**

At line 375, find:
```powershell
    Write-Output "Skills (8): $($inventoryNames -join ', ')"
```
Replace with:
```powershell
    Write-Output "Skills ($($inventoryNames.Count)): $($inventoryNames -join ', ')"
```

- [ ] **Step 3: Replace the install-complete output literal**

At line 459, find:
```powershell
Write-Output "Installed 8 skills to: $($targetSpecs.Name -join ', ')"
```
Replace with:
```powershell
Write-Output "Installed $($inventory.skills.Count) skills to: $($targetSpecs.Name -join ', ')"
```

- [ ] **Step 4: Fix the stale error message text**

At line 222, find:
```powershell
    throw 'Source inventory does not contain the canonical eight-skill inventory.'
```
Replace with:
```powershell
    throw "Source inventory does not contain the canonical $($expectedSkillNames.Count)-skill inventory."
```

- [ ] **Step 5: Run a manual dry-run to confirm the fix**

Run: `pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Codex -ClaudeHome "$env:TEMP\pwsh-check-unused" -CodexHome "$env:TEMP\dryrun-check-codex" -DryRun`
Expected: output includes `Skills (10): github-contributing, github-for-ado-users, github-hygiene, github-issue-first, github-pr-review, github-projects, github-releases, github-repo-bootstrap, github-repo-review, github-security-response` (exact order follows the inventory JSON's array order, not necessarily alphabetical — confirm it lists all 10 names, order aside).

- [ ] **Step 6: Commit**

```bash
git add scripts/install-skills.ps1
git commit -m "fix: derive install-skills.ps1's skill-count checks and messages from the roster instead of a hardcoded 8

Refs #<N>"
```

---

## Task 6: Repoint cross-references in the other five skills

**Files:**
- Modify: `skills/github-issue-first/SKILL.md`
- Modify: `skills/github-repo-bootstrap/SKILL.md`
- Modify: `skills/github-projects/SKILL.md`
- Modify: `skills/github-for-ado-users/SKILL.md`

**Interfaces:**
- Consumes: `github-releases` and `github-contributing` (skill names, from Tasks 2 and 4).
- Produces: none (leaf task — no later task depends on these edits).

- [ ] **Step 1: Repoint `skills/github-issue-first/SKILL.md`'s milestone cross-reference**

Find (in the "### Milestone" section):
```markdown
Every filed issue also gets a milestone before you move on — not just labels
and an assignee. `gh issue create` has no `--milestone` flag, so attach it as
a follow-up: `gh issue edit <N> --milestone "<title>"`. Full milestone
conventions (what to name it, when to reuse vs. create, when to close it) live
in `github-hygiene` — check there rather than improvising a naming scheme.
```
Replace `live in \`github-hygiene\`` with `live in \`github-releases\``.

- [ ] **Step 2: Repoint `skills/github-repo-bootstrap/SKILL.md`'s ruleset cross-reference and handoffs**

In section "## 11. Handoffs to companion skills", find:
```markdown
Use `github-issue-first` for ordinary work after the bootstrap boundary,
`github-pr-review` for pull-request review, `github-security-response` for a
security event, `github-projects` only when shared board governance is warranted,
`github-hygiene` for releases and cleanup, and `github-repo-review` for a broad
repository audit. Use `github-for-ado-users` for general ADO migration guidance;
keep workplace-specific material private.
```
Replace with:
```markdown
Use `github-issue-first` for ordinary work after the bootstrap boundary,
`github-pr-review` for pull-request review, `github-security-response` for a
security event, `github-projects` only when shared board governance is warranted,
`github-hygiene` for PR merges and cleanup, `github-releases` for the first
release and its rulesets, and `github-repo-review` for a broad repository audit.
Use `github-for-ado-users` for general ADO migration guidance and
`github-contributing` if the bootstrap work is itself a fork PR to a template
repo; keep workplace-specific material private.
```

- [ ] **Step 3: Repoint `skills/github-projects/SKILL.md`'s companion-skills line**

Find:
```markdown
Companion skills: `github-issue-first` (filing, labels, assignment, dependencies)
and `github-hygiene` (branch/PR/release conventions). Anything you create here
still follows those.
```
Replace with:
```markdown
Companion skills: `github-issue-first` (filing, labels, assignment, dependencies),
`github-hygiene` (branch/PR conventions), and `github-releases` (milestones —
this skill's iteration-field guidance is the Projects-board complement to
`github-releases`'s milestone conventions). Anything you create here still
follows those.
```

- [ ] **Step 4: Repoint `skills/github-for-ado-users/SKILL.md`'s "Setting up a repo" checklist**

Find (in "## Setting up a repo the way you had it in ADO"):
```markdown
1. Labels (priority + category) — `github-issue-first`
2. Issue types, if you are in an org — `github-issue-first`
3. Milestones for releases, **not** sprints — `github-hygiene`
4. Ruleset on `main` (required checks + review) — `github-hygiene`
5. CODEOWNERS, CONTRIBUTING.md, issue forms, PR template — `github-repo-review`
6. `.github/release.yml` for categorised release notes — `github-hygiene`
7. Projects board **only if more than one maintainer** — `github-projects`
8. Discussions enabled, with categories
```
Replace with:
```markdown
1. Labels (priority + category) — `github-issue-first`
2. Issue types, if you are in an org — `github-issue-first`
3. Milestones for releases, **not** sprints — `github-releases`
4. Ruleset on `main` (required checks + review) — `github-releases`
5. CODEOWNERS, CONTRIBUTING.md, issue forms, PR template — `github-repo-review`
6. `.github/release.yml` for categorised release notes — `github-releases`
7. Projects board **only if more than one maintainer** — `github-projects`
8. Discussions enabled, with categories
```

Also find, in the "Common mistakes" table:
```markdown
| Milestones used as sprints | Milestones = releases; iterations = Projects iteration field |
```
This row doesn't name a skill, leave it unchanged.

- [ ] **Step 5: Run validation, workflow-policy, and markdownlint**

Run: `npm run validate && npm test -- tests/workflow-policy.test.mjs && npm run lint:markdown`
Expected: `Validated 10 skills: 0 errors, 0 warnings.`; workflow-policy passes (none of these four files are in its `policyFiles` list, so this is a no-op confirmation their unrelated content didn't regress anything already covered); markdownlint passes.

- [ ] **Step 6: Commit**

```bash
git add skills/github-issue-first skills/github-repo-bootstrap skills/github-projects skills/github-for-ado-users
git commit -m "docs: repoint hygiene cross-references to github-releases/github-contributing

Refs #<N>"
```

---

## Task 7: Update the two GitHub issue form templates

**Files:**
- Modify: `.github/ISSUE_TEMPLATE/bug.yml`
- Modify: `.github/ISSUE_TEMPLATE/improvement.yml`

**Interfaces:** None (leaf task).

- [ ] **Step 1: Update `bug.yml`'s `Affected skills` dropdown**

Find the `options:` list under `id: skills`:
```yaml
      options:
        - github-issue-first
        - github-hygiene
        - github-pr-review
        - github-repo-review
        - github-repo-bootstrap
        - github-security-response
        - github-projects
        - github-for-ado-users
        - Installer, validation, or documentation only
```
Replace with:
```yaml
      options:
        - github-issue-first
        - github-hygiene
        - github-releases
        - github-contributing
        - github-pr-review
        - github-repo-review
        - github-repo-bootstrap
        - github-security-response
        - github-projects
        - github-for-ado-users
        - Installer, validation, or documentation only
```

- [ ] **Step 2: Make the identical change in `improvement.yml`**

Same `options:` list, same replacement.

- [ ] **Step 3: Run markdownlint and validate (YAML syntax sanity via `npm run check`'s validate step doesn't touch these files, so just confirm valid YAML)**

Run: `node -e "const {parse}=require('yaml'); const fs=require('fs'); ['.github/ISSUE_TEMPLATE/bug.yml','.github/ISSUE_TEMPLATE/improvement.yml'].forEach(f=>{parse(fs.readFileSync(f,'utf8')); console.log(f, 'OK')})"`
Expected: both print `OK`.

- [ ] **Step 4: Commit**

```bash
git add .github/ISSUE_TEMPLATE/bug.yml .github/ISSUE_TEMPLATE/improvement.yml
git commit -m "docs: add github-releases and github-contributing to issue template dropdowns

Refs #<N>"
```

---

## Task 8: Update `tests/install-skills.test.mjs` and `tests/validate-skills.test.mjs` for the 10-skill roster

**Files:**
- Modify: `tests/install-skills.test.mjs:153`, `:166`, `:253`, `:273`
- Modify: `tests/validate-skills.test.mjs:36`

**Interfaces:**
- Consumes: the now-10-entry `contracts/skill-inventory.json` (both test files already derive `expectedNames`/counts from it dynamically except at the lines below).
- Produces: a passing test suite, consumed by Task 12's final verification.

- [ ] **Step 1: Fix the dry-run output assertion**

In `tests/install-skills.test.mjs` at line 153, find:
```js
  assert.match(result.stdout, /Skills \(8\)/i);
```
Replace with:
```js
  assert.match(result.stdout, /Skills \(10\)/i);
```

- [ ] **Step 2: Fix the Copilot test name**

At line 166, find:
```js
test('Copilot target installs all eight skills under CopilotHome/skills', async () => {
```
Replace with:
```js
test('Copilot target installs all ten skills under CopilotHome/skills', async () => {
```

- [ ] **Step 3: Fix the stale comment**

At line 253, find:
```js
  // Shared across variants: only the inventory's requiredFiles differ per
  // case, and the installer must fail before any destination is created, so
  // one source copy can be reused instead of a fresh 8-skill tree per variant.
```
Replace with:
```js
  // Shared across variants: only the inventory's requiredFiles differ per
  // case, and the installer must fail before any destination is created, so
  // one source copy can be reused instead of a fresh 10-skill tree per variant.
```

- [ ] **Step 4: Fix the "Both installs" test name**

At line 273, find:
```js
test('Both installs exactly eight skills per target with matching SKILL.md hashes', async () => {
```
Replace with:
```js
test('Both installs exactly ten skills per target with matching SKILL.md hashes', async () => {
```

- [ ] **Step 5: Fix `tests/validate-skills.test.mjs`'s skill-count assertion**

At line 36, find:
```js
test('accepts the canonical eight-skill checkout', async () => {
  const result = await validateRepository(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.equal(result.skills.length, 8);
});
```
Replace with:
```js
test('accepts the canonical ten-skill checkout', async () => {
  const result = await validateRepository(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.equal(result.skills.length, 10);
});
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including every test in `tests/install-skills.test.mjs` (this exercises the real installer against the real, now-10-skill repo — Task 5's fix is what makes this pass rather than failing on the stale `-ne 8` check).

- [ ] **Step 7: Commit**

```bash
git add tests/install-skills.test.mjs tests/validate-skills.test.mjs
git commit -m "test: update hardcoded eight-skill assertions for the 10-skill roster

Refs #<N>"
```

---

## Task 9: Write ADR 0002 and index it

**Files:**
- Create: `docs/adr/0002-split-hygiene-add-contributing-and-releases.md`
- Modify: `docs/adr/README.md`

**Interfaces:** None (leaf task — records the decision already made in Tasks 1-8).

- [ ] **Step 1: Create the ADR**

```markdown
# ADR 0002: Split `github-hygiene` and add `github-contributing`

## Status

Accepted (2026-09-25).

## Context

An audit of the eight-skill roster against four criteria — coverage gaps,
redundancy/overlap, boundary/handoff friction, and general quality — found:

1. `github-hygiene` was 328 lines (2nd largest of eight) and its own
   frontmatter `description` listed five distinct triggers: merging PRs,
   closing issues, reconciling acceptance criteria, cutting a release,
   tagging a version, creating/closing milestones, decomposing large work,
   and cleaning up branches. It structurally bundled three separable
   lifecycles: PR/merge flow plus the acceptance-criteria closure gate,
   branch protection/rulesets (~75 self-contained lines), and release
   mechanics (release-notes config, release recipe, milestones).
2. No skill owned the outside-contributor workflow. All eight skills
   assumed maintainer authority. `github-pr-review` covered reviewing a
   fork PR and had one short section on responding to review on your own
   PR — contributor-side content living in the reviewer-side skill.
3. The `Refs #N` closure-gate paragraph is deliberately repeated verbatim
   across several skill files and enforced by
   `tests/workflow-policy.test.mjs` (see ADR 0001) — this is correct design,
   not redundancy, since only the triggered skill loads into an agent's
   context at a time. The only real fixable issue was a handful of skills
   cross-referencing `github-hygiene` by name for milestone/ruleset content
   that needed to move with the split.

Full findings and file-by-file blast radius:
`docs/superpowers/specs/2026-09-25-github-skills-roster-optimization-design.md`.

## Decision

- Split `github-hygiene` into a trimmed `github-hygiene` (PR flow, the
  closure gate, CI-red triage, sub-issues, cleanup) and a new
  `github-releases` (rulesets, release-notes config, release recipe,
  milestones).
- Add `github-contributing`: forking, syncing a fork with upstream,
  submitting a PR to a repo you don't maintain, responding to review as the
  PR author. Absorbs `github-pr-review`'s former "Responding to review on
  your own PR" section.
- The `Refs #N` closure-gate paragraph does not move to either new skill —
  it stays exclusive to the skills already in
  `tests/workflow-policy.test.mjs`'s `policyFiles` list.
- Cross-references in `github-issue-first`, `github-repo-bootstrap`,
  `github-projects`, `github-for-ado-users`, and `github-pr-review` are
  repointed to the new skills rather than left stale or duplicated.

This is now stated identically in `docs/GUIDE.md`'s per-skill sections and
`README.md`'s skill list — see `docs/MAINTAINING.md`'s cross-skill invariant
review for the full list to check when this wording changes.

## Consequences

- The canonical roster is 10 skills, not 8. `contracts/skill-inventory.json`,
  `scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
  `scripts/install-skills.ps1`'s `$canonicalRequiredFiles` all needed a
  matching entry added in two places (`github-contributing`,
  `github-releases`); `tests/roster-consistency.test.mjs` continues to catch
  any future drift between the three automatically.
- `install-skills.ps1` also had three hardcoded literal-`8` spots (a count
  guard and two output strings) not covered by the "three hardcoded places"
  description in `docs/MAINTAINING.md` at the time — these were found during
  this change and converted to read the roster's actual size dynamically, so
  a future roster change won't reintroduce the same class of bug.
- `tests/install-skills.test.mjs` and `tests/validate-skills.test.mjs` had
  their own hardcoded "eight"/`8` literals (an output-format regex, two test
  names, a comment, and a length assertion) that needed updating alongside
  the roster change — these don't self-correct the way
  `roster-consistency.test.mjs` does, since they assert against the real
  repository's installed/validated state rather than cross-checking the
  three manifest sources against each other.
- Evidence: issue #<N>.
```

(The PR number isn't known yet at this point in the plan — Task 12 opens the PR. Task 12 adds a step to append the PR number to this Evidence line once it exists, matching ADR 0001's style of citing both.)

- [ ] **Step 2: Index it in `docs/adr/README.md`**

Find:
```markdown
## Index

- [0001](0001-refs-closes-connected-branch-closure.md) — `Refs`/`Closes`
  closure semantics must account for GitHub's connected-branch auto-closure.
```
Replace with:
```markdown
## Index

- [0001](0001-refs-closes-connected-branch-closure.md) — `Refs`/`Closes`
  closure semantics must account for GitHub's connected-branch auto-closure.
- [0002](0002-split-hygiene-add-contributing-and-releases.md) — Split
  `github-hygiene` into hygiene + releases and added `github-contributing`.
```

- [ ] **Step 3: Run markdownlint**

Run: `npm run lint:markdown`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0002-split-hygiene-add-contributing-and-releases.md docs/adr/README.md
git commit -m "docs: add ADR 0002 for the hygiene split and github-contributing addition

Refs #<N>"
```

---

## Task 10: Update `docs/GUIDE.md` and `docs/MAINTAINING.md`

**Files:**
- Modify: `docs/GUIDE.md`
- Modify: `docs/MAINTAINING.md`

**Interfaces:** None (leaf task).

- [ ] **Step 1: Bump `docs/GUIDE.md`'s version header**

Find:
```markdown
**Policy version:** v0.1.0

**Reviewed:** 2026-08-09
```
Replace with:
```markdown
**Policy version:** v0.2.0

**Reviewed:** 2026-09-25
```
Also find `## Current v0.1.0 policy` and replace with `## Current v0.2.0 policy`.

- [ ] **Step 2: Trim the `### github-hygiene` section**

Find:
```markdown
### `github-hygiene`

- **Trigger:** Work branches, closure, merge, milestones, releases, or cleanup
  are involved.
- **Responsibilities and outputs:** Maintain the issue-linked traceability
  chain, evaluate criteria, record evidence, and perform approved release and
  cleanup steps.
- **Boundary and handoff:** Individual PR review belongs to
  `github-pr-review`; merging and releasing still require explicit approval.
```
Replace with:
```markdown
### `github-hygiene`

- **Trigger:** Work branches, closure, merge, or cleanup are involved.
- **Responsibilities and outputs:** Maintain the issue-linked traceability
  chain, evaluate criteria, record evidence, and perform approved merge and
  cleanup steps.
- **Boundary and handoff:** Individual PR review belongs to
  `github-pr-review`; releasing and tagging hand off to `github-releases`.
```

- [ ] **Step 3: Add a `### github-releases` section**

Insert immediately after the `github-hygiene` section:
```markdown
### `github-releases`

- **Trigger:** Cutting a release, tagging a version, configuring branch
  protection/rulesets, or creating/closing milestones.
- **Responsibilities and outputs:** Maintain milestone conventions, configure
  and audit rulesets, run the release recipe, and keep release-note
  automation accurate.
- **Boundary and handoff:** PR merge and the closure gate belong to
  `github-hygiene`; a release containing a security fix goes through
  `github-security-response` first.
```

- [ ] **Step 4: Add a `### github-contributing` section**

Insert after the `### github-for-ado-users` section (keeping the existing section order, adding this as the new last entry):
```markdown
### `github-contributing`

- **Trigger:** Submitting a pull request to a repository you don't maintain.
- **Responsibilities and outputs:** Fork and sync with upstream, submit a PR
  following the target repository's own conventions, and respond to review
  as the PR's author.
- **Boundary and handoff:** Does not impose this repository's `Refs`/`Closes`
  conventions on a foreign repo; reviewing someone else's fork PR is
  `github-pr-review`, not this skill.
```

- [ ] **Step 5: Update the "Trigger and handoff model" section**

Find:
```markdown
Start with `github-issue-first` for ordinary committed work. Once the issue and
linked branch exist, `github-hygiene` owns traceability and closure. Use
`github-pr-review` for the review decision and return to `github-hygiene` for an
approved merge. A broad audit starts with `github-repo-review`, but each public
finding it creates follows issue-first mechanics.
```
Replace with:
```markdown
Start with `github-issue-first` for ordinary committed work. Once the issue and
linked branch exist, `github-hygiene` owns traceability and closure. Use
`github-pr-review` for the review decision and return to `github-hygiene` for an
approved merge, then `github-releases` to ship it. A broad audit starts with
`github-repo-review`, but each public finding it creates follows issue-first
mechanics. Contributing to a repository you don't maintain starts with
`github-contributing` instead of `github-hygiene`/`github-releases` — you have
neither merge nor tag authority there.
```

Also find, in the same section:
```markdown
Security is a private branch in the flow: `github-security-response` replaces
the public issue and PR path until coordinated disclosure is safe. Repository
creation begins with `github-repo-bootstrap`. `github-projects` adds a view only
when shared ownership justifies the maintenance. `github-for-ado-users` explains
the mapping but does not mutate a repository by itself.
```
Replace with:
```markdown
Security is a private branch in the flow: `github-security-response` replaces
the public issue and PR path until coordinated disclosure is safe. Repository
creation begins with `github-repo-bootstrap`. `github-projects` adds a view only
when shared ownership justifies the maintenance. `github-for-ado-users` explains
the mapping but does not mutate a repository by itself.
```
(No change to this specific paragraph — it doesn't reference hygiene's split content. Confirmed by re-reading during this step; move to Step 6.)

- [ ] **Step 6: Update the "### Release" example**

Find:
```markdown
### Release

Create a separate `release/x.y.z` issue-linked branch and PR, update the version
source and changelog, and run the complete validation. After explicit approval
and green CI, merge, update local `main`, tag that exact commit, verify the
release workflow, close the milestone, and prune merged branches.
```
Replace with:
```markdown
### Release

Using `github-releases`: create a separate `release/x.y.z` issue-linked branch
and PR, update the version source and changelog, and run the complete
validation. After explicit approval and green CI, merge (per `github-hygiene`'s
PR flow), update local `main`, tag that exact commit, verify the release
workflow, close the milestone, and prune merged branches.
```

- [ ] **Step 7: Bump `docs/MAINTAINING.md`'s version header and roster count**

Find:
```markdown
**Applies to:** v0.1.0

**Reviewed:** 2026-08-09
```
Replace with:
```markdown
**Applies to:** v0.2.0

**Reviewed:** 2026-09-25
```

Find:
```markdown
- Claude, OpenAI Codex, and GitHub Copilot consume the same canonical
  `SKILL.md` content.
```
Leave unchanged (no roster count here).

Find:
```markdown
The canonical eight-skill roster (names and required files) is independently
hardcoded in three places: `contracts/skill-inventory.json`,
`scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
`scripts/install-skills.ps1`'s `$canonicalRequiredFiles`. This duplication is
intentional defense-in-depth — the installer refuses to trust the inventory
JSON blindly — but it means adding, renaming, or changing a skill's required
files means editing all three by hand. `tests/roster-consistency.test.mjs`
fails automatically if the three ever diverge, so drift is caught as a test
failure rather than discovered separately by two independent installer checks
disagreeing.
```
Replace with:
```markdown
The canonical ten-skill roster (names and required files) is independently
hardcoded in three places: `contracts/skill-inventory.json`,
`scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
`scripts/install-skills.ps1`'s `$canonicalRequiredFiles`. This duplication is
intentional defense-in-depth — the installer refuses to trust the inventory
JSON blindly — but it means adding, renaming, or changing a skill's required
files means editing all three by hand. `tests/roster-consistency.test.mjs`
fails automatically if the three ever diverge, so drift is caught as a test
failure rather than discovered separately by two independent installer checks
disagreeing. `scripts/install-skills.ps1` also derives its internal count
guard and its dry-run/completion messages from the roster size rather than a
hardcoded number (see ADR 0002) — no fourth place to edit by hand.
```

Find, in "## Cross-skill invariant review":
```markdown
When a shared rule changes, inspect all eight `skills/*/SKILL.md` files, the
standalone repository-review prompt, the guide, workflow, platform guides,
issue forms, PR template, release automation, and `docs/adr/` for any decision
record the change would supersede.
```
Replace with:
```markdown
When a shared rule changes, inspect all ten `skills/*/SKILL.md` files, the
standalone repository-review prompt, the guide, workflow, platform guides,
issue forms, PR template, release automation, and `docs/adr/` for any decision
record the change would supersede.
```

- [ ] **Step 8: Update the "Proposed improvements, not current policy" section's context**

This section in `docs/GUIDE.md` (triaged 2026-08-11, issue #10) references the v0.1.0 roster's shape indirectly (issues #19/#21/#23 are unaffected by this change and still apply to `v0.1.2`). Leave this section unchanged — it's about installer/doc fixes unrelated to the roster split.

- [ ] **Step 9: Run markdownlint and the workflow-policy test**

Run: `npm run lint:markdown && npm test -- tests/workflow-policy.test.mjs`
Expected: both pass (workflow-policy confirms the `Refs #N` paragraph in `docs/GUIDE.md` and `docs/MAINTAINING.md` is untouched by these edits).

- [ ] **Step 10: Commit**

```bash
git add docs/GUIDE.md docs/MAINTAINING.md
git commit -m "docs: update GUIDE.md and MAINTAINING.md for the 10-skill roster

Refs #<N>"
```

---

## Task 11: Update `README.md`, `CONTRIBUTING.md`, and the three platform install docs

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `docs/claude.md`
- Modify: `docs/openai-codex.md`
- Modify: `docs/copilot.md`

**Interfaces:** None (leaf task).

- [ ] **Step 1: Update `README.md`'s `## Skills` list**

Find:
```markdown
## Skills

- `github-issue-first` records actionable work before implementation.
- `github-hygiene` governs branches, pull requests, closure, releases, and
  cleanup.
- `github-pr-review` reviews pull requests and their linked acceptance criteria.
- `github-repo-review` performs evidence-based, full-repository audits.
- `github-repo-bootstrap` creates and verifies a new repository safely.
- `github-security-response` keeps exploitable findings and credentials private.
- `github-projects` adds a maintained shared board when multiple maintainers
  need one.
- `github-for-ado-users` maps Azure DevOps concepts to GitHub without importing
  organization-specific policy.
```
Replace with:
```markdown
## Skills

- `github-issue-first` records actionable work before implementation.
- `github-hygiene` governs branches, pull requests, closure, and cleanup.
- `github-releases` governs milestones, branch protection, and cutting a
  release.
- `github-contributing` covers forking, syncing, and submitting a pull
  request to a repository you don't maintain.
- `github-pr-review` reviews pull requests and their linked acceptance criteria.
- `github-repo-review` performs evidence-based, full-repository audits.
- `github-repo-bootstrap` creates and verifies a new repository safely.
- `github-security-response` keeps exploitable findings and credentials private.
- `github-projects` adds a maintained shared board when multiple maintainers
  need one.
- `github-for-ado-users` maps Azure DevOps concepts to GitHub without importing
  organization-specific policy.
```

- [ ] **Step 2: Update the release-status blurb**

Find:
```markdown
> **Release status:** [v0.1.0](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/releases/tag/v0.1.0)
> is published. The repository contains the v0.1.0 package contract and a
> matching GitHub release.
```
Replace with:
```markdown
> **Release status:** [v0.1.0](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/releases/tag/v0.1.0)
> is published. This checkout targets the upcoming v0.2.0 package contract
> (ten skills); tag and publish the matching GitHub release per
> `github-releases` before updating this line.
```

- [ ] **Step 3: Update `CONTRIBUTING.md`'s "all eight skills" line**

Find:
```markdown
Policy changes to a canonical `SKILL.md` must consider all eight skills and all
three consuming platforms (OpenAI Codex, Claude, GitHub Copilot). Installed
copies are deployment outputs; propose changes in this repository.
```
Replace with:
```markdown
Policy changes to a canonical `SKILL.md` must consider all ten skills and all
three consuming platforms (OpenAI Codex, Claude, GitHub Copilot). Installed
copies are deployment outputs; propose changes in this repository.
```

- [ ] **Step 4: Update `docs/claude.md`'s "eight skills" line**

Find:
```markdown
Review the source, target, eight skills, overwrite decisions, and backup paths.
```
Replace with:
```markdown
Review the source, target, ten skills, overwrite decisions, and backup paths.
```

- [ ] **Step 5: Make the identical change in `docs/openai-codex.md`**

Same find/replace as Step 4.

- [ ] **Step 6: Make the identical change in `docs/copilot.md`**

Same find/replace as Step 4.

- [ ] **Step 7: Run markdownlint**

Run: `npm run lint:markdown`
Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add README.md CONTRIBUTING.md docs/claude.md docs/openai-codex.md docs/copilot.md
git commit -m "docs: update README, CONTRIBUTING, and platform guides for the 10-skill roster

Refs #<N>"
```

---

## Task 12: Final full-suite verification and closure evidence

**Files:** Modify: `docs/adr/0002-split-hygiene-add-contributing-and-releases.md` (Step 8 only; otherwise verification only).

**Interfaces:** None — this task confirms every prior task's deliverable together and produces the closure-gate evidence for the issue.

- [ ] **Step 1: Run the complete check**

Run: `npm run check`
Expected: `Validated 10 skills: 0 errors, 0 warnings.`, all `node --test` tests pass, `markdownlint-cli2` reports no errors.

- [ ] **Step 2: Live dry-run install, `-Target Both`**

Run: `pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Both -DryRun`
Expected: `Skills (10): ...` line lists all 10 names; both `Target: Codex` and `Target: Claude` sections list all 10 skills with `install; backup: none` (assuming no prior local install) or correct overwrite/backup plans for previously-installed skills.

- [ ] **Step 3: Live dry-run install, `-Target Codex` against a scratch home, then a real (non-dry-run) install and verification**

Run:
```bash
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Codex -CodexHome "$env:TEMP\ghskills-verify-codex" -DryRun
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Codex -CodexHome "$env:TEMP\ghskills-verify-codex"
Get-ChildItem "$env:TEMP\ghskills-verify-codex\skills" -Directory | Select-Object -ExpandProperty Name | Sort-Object
Remove-Item "$env:TEMP\ghskills-verify-codex" -Recurse -Force
```
Expected: the directory listing shows exactly the 10 canonical names; cleanup removes the scratch install.

- [ ] **Step 4: Grep for stale cross-references and accidental closure-gate leakage**

Run:
```bash
grep -n "github-hygiene" skills/github-issue-first/SKILL.md skills/github-repo-bootstrap/SKILL.md skills/github-projects/SKILL.md skills/github-for-ado-users/SKILL.md
```
Expected: every remaining hit refers to PR merging/closure/cleanup (`github-hygiene`'s actual remaining scope), not to milestones, rulesets, or releases — if any hit mentions those, Task 6 missed it; fix it now.

Run:
```bash
grep -l "does not guarantee\|connected development branch" skills/github-releases/SKILL.md skills/github-contributing/SKILL.md
```
Expected: no output (neither new skill contains the `Refs #N` closure-gate paragraph). If either file matches, remove the leaked paragraph before proceeding — it would desync from `tests/workflow-policy.test.mjs`'s fixed `policyFiles` list without that test catching it.

- [ ] **Step 5: Evaluate every acceptance criterion from the issue**

Re-read issue `<N>`'s acceptance criteria (Task 1, Step 3). For each, identify the concrete evidence from Tasks 2-11 (commit, test output, or file). Post a completion comment:

```bash
gh issue comment <N> --body "$(cat <<'EOF'
All acceptance criteria evaluated against this branch:

- github-releases skill: skills/github-releases/SKILL.md (Task 2)
- github-contributing skill: skills/github-contributing/SKILL.md (Task 4)
- github-hygiene trimmed: skills/github-hygiene/SKILL.md (Task 3)
- Cross-references repointed: Task 6 (5 files)
- Roster registered in all three manifests, roster-consistency passes: Tasks 2/4, tests/roster-consistency.test.mjs green
- install-skills.ps1 hardcoded-8 literals removed: Task 5
- install-skills.test.mjs / validate-skills.test.mjs updated, full suite green: Task 8, npm run check output above
- Docs updated (GUIDE/MAINTAINING/claude/openai-codex/copilot/README/CONTRIBUTING): Tasks 10-11
- Issue template dropdowns updated: Task 7
- ADR 0002 + index: Task 9
- package.json / skill-inventory.json at 0.2.0: Task 2 Step 3, and confirm package.json below
- npm run check and live -DryRun verified: Task 12 Steps 1-3

Every criterion Met.
EOF
)"
```

- [ ] **Step 6: Update checkboxes on the issue**

Write the completion body with every acceptance-criteria checkbox checked to a local file, then:
```bash
gh issue edit <N> --body-file <checked-body-file>
```
(Use a newline-preserving file, not an inline multiline string — per this repo's own `github-hygiene` convention.)

- [ ] **Step 7: Push the branch and open the PR**

```bash
git push -u origin feat/skills-roster-optimization
gh pr create \
  --title "Split github-hygiene into hygiene+releases; add github-contributing" \
  --body "Refs #<N>

Implements docs/superpowers/specs/2026-09-25-github-skills-roster-optimization-design.md.
See the issue for full acceptance-criteria evidence." \
  --base main
```
Record the printed PR number as `<PR-number>`.

- [ ] **Step 8: Backfill the PR number into ADR 0002's evidence line**

In `docs/adr/0002-split-hygiene-add-contributing-and-releases.md`, find:
```markdown
- Evidence: issue #<N>.
```
Replace with:
```markdown
- Evidence: issue #<N>, PR #<PR-number>.
```
Commit directly to the same branch (this PR's own diff, not a new issue — matches ADR 0001's precedent of citing its own PR):
```bash
git add docs/adr/0002-split-hygiene-add-contributing-and-releases.md
git commit -m "docs: record PR number as ADR 0002 evidence

Refs #<N>"
git push
```

- [ ] **Step 9: Wait for CI green on every leg, then request the maintainer's merge approval**

Run: `gh pr checks <PR-number> --watch`
Expected: all legs (Windows required check; Ubuntu, macOS advisory — macOS may still show its known pre-existing failure from issue #23, unrelated to this change) report their expected state. Ask the maintainer once: "merge this when green?" per this repo's own `github-hygiene` PR-flow convention — do not self-merge.
