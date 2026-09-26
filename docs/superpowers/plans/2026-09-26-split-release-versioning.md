# Split Release/Versioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the `education/` program its own lightweight, independent release track (`education-vX.Y.Z` git tags, its own changelog, a minimal CI sanity check) — additive to the skillset's existing `vX.Y.Z` tag/release pipeline, which is completely untouched.

**Architecture:** A new `education/CHANGELOG.md`, a new `.github/workflows/education-tag-check.yml` triggered on `education-v*` tag pushes, documentation of the two-track convention in `docs/MAINTAINING.md` and `README.md`, and the first `education-v1.0.0` tag cut once its prerequisite PR merges.

**Tech Stack:** Markdown (changelog, docs), GitHub Actions YAML (new workflow), git tags.

**Spec:** `docs/superpowers/specs/2026-09-26-split-release-versioning-design.md`

## Global Constraints

- No changes to the skillset's own version, tag scheme, `CHANGELOG.md`, or `.github/workflows/release.yml` — this work is purely additive.
- Education tags use the `education-vX.Y.Z` prefix (SemVer) — never a bare `vX.Y.Z`, which is reserved for the skillset.
- Education releases are git tags only — no GitHub Release object, no `gh release create`, no artifacts.
- The new `education-tag-check.yml` workflow runs `npm run lint:markdown:education` only — no other checks, no release step.
- `npm run check` must pass after every task.
- Every commit includes `Refs #40`.
- **`education-v1.0.0` may only be tagged once PR #39 (the stranded final-review fixes for the education program, including the real Session 2 diagram bug fix) has merged into `main`.** Do not tag a commit that still has the known diagram bug.

## Review Focus

- **The new workflow's trigger pattern doesn't actually match `education-v*` tags** (a YAML glob typo, or matching `v*` and accidentally catching the skillset's own tags too) — verify with a real test tag push during Task 2, not just by reading the YAML.
- **`education-v1.0.0` gets tagged against a commit that predates PR #39's merge** — Task 4 must positively confirm the merge before tagging, not assume it happened.
- **`education/CHANGELOG.md`'s `[1.0.0]` entry undersells or missells what actually shipped** (the corrected Session 2 diagram, the repo-wide links, all of PR #38's original content) — write it against the real final state of `education/`, not from memory of the original PR body alone.
- **The new workflow accidentally also triggers on the skillset's `v*` tags** because of an overly broad glob (`v*` instead of `education-v*`) — would run an irrelevant check against skillset releases and confuse anyone watching Actions history.
- **`docs/MAINTAINING.md`'s new section contradicts or duplicates its existing "Release hygiene" section** rather than clearly extending it — a reader must come away knowing exactly which of the two tracks a given change belongs to.

---

## Task 1: `education/CHANGELOG.md`

**Files:**
- Create: `education/CHANGELOG.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing another task depends on structurally, but Task 4's tag description should be consistent with this file's `[1.0.0]` entry.

- [ ] **Step 1: Create the file with the following content**

```markdown
# Education Program Changelog

Independent of the skillset's [`CHANGELOG.md`](../CHANGELOG.md) — this file
tracks `education/` only. Tags use the `education-vX.Y.Z` prefix (see
`docs/MAINTAINING.md`'s release hygiene section for the full convention).

All notable changes to the colleague training program are documented here,
following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.0] - 2026-09-26

### Added

- `education/README.md` — program overview with audience-tier routing
  (a flowchart routing background to entry point) and a topic-coverage
  mindmap.
- `education/beginners/session-1-getting-started.md` — full hands-on
  content for true beginners, entirely GitHub-web-UI-based (no command
  line): a `gitGraph` plus a click-through flowchart illustrating the
  issue → branch → commit → PR → review → merge → issue-closes loop.
- `education/intermediate/session-2-our-workflow.md` — outline and
  talking points on issue-first, the acceptance-criteria closure gate
  (with a state diagram and the `Refs`/`Closes` connected-branch gotcha
  from ADR 0001), PR review etiquette (a sequence diagram), and branch/
  milestone conventions.
- `education/advanced/session-3-advanced-github.md` — outline and talking
  points on branch protection/rulesets (a decision-tree flowchart),
  Projects boards, releases (a timeline diagram), and security-response
  basics.
- `education/cheat-sheet.md` — one-page leave-behind reference covering
  both the GitHub web UI and CLI equivalents, plus this team's specific
  conventions.
- `education/facilitator-guide.md` — sandbox repo requirements and reset
  procedure (a state diagram), a pre-session checklist, new-hire re-run
  guidance, completion tracking, and an appendix of `gh api` commands for
  extracting an organization's real settings (placeholder syntax only —
  no real values ever committed here, since this repository is public).
- `.markdownlint-education.jsonc` — a dedicated markdownlint config for
  `education/**`, disabling only `MD013` (line length), since that rule is
  incompatible with real table content and Mermaid diagram labels.

### Fixed

- Session 2's closure-gate state diagram originally only allowed a `Refs
  #N` PR to open after a criterion was already met, contradicting this
  team's actual, documented order (the PR opens first; evidence is
  gathered while it's open). Corrected before this tag.
- A diagram caption mismatch in Session 1 (said diagrams were side by
  side; they render stacked). Corrected before this tag.
- Cross-references from `README.md`, `CLAUDE.md`, and `CHANGELOG.md` into
  `education/` were initially missing entirely. Added before this tag.
```

- [ ] **Step 2: Run markdownlint**

Run: `npm run lint:markdown:education`
Expected: pass, 0 issues.

- [ ] **Step 3: Commit**

```bash
git add education/CHANGELOG.md
git commit -m "docs: add education/CHANGELOG.md as its own independent changelog

Refs #40"
```

---

## Task 2: `.github/workflows/education-tag-check.yml`

**Files:**
- Create: `.github/workflows/education-tag-check.yml`

**Interfaces:**
- Consumes: `npm run lint:markdown:education` (already exists, added in the education-program plan).
- Produces: nothing another task depends on, but Task 4's tag push is what this workflow exists to react to — verify the trigger works before Task 4 relies on it.

- [ ] **Step 1: Create the file with the following content**

```yaml
name: Education tag check

on:
  push:
    tags:
      - 'education-v*'

permissions:
  contents: read

jobs:
  lint-education:
    name: Lint education/ content
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
      - name: Set up Node.js
        uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Lint education/ markdown
        run: npm run lint:markdown:education
```

This mirrors the pinned-action-SHA and Node-setup pattern already used in `.github/workflows/validate.yml` — same `actions/checkout` and `actions/setup-node` pins, same Node 22, same `npm ci` step.

- [ ] **Step 2: Verify the YAML is valid**

Run: `node -e "const {parse}=require('yaml'); const fs=require('fs'); parse(fs.readFileSync('.github/workflows/education-tag-check.yml','utf8')); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/education-tag-check.yml
git commit -m "ci: add education-v* tag check workflow (lint only, no release)

Refs #40"
```

- [ ] **Step 4: Push and verify the trigger fires correctly with a real test tag**

This step needs a real tag push to origin, which is a shared-repo side effect — confirm with the controller/user before running it if you're an implementer subagent executing this plan; a real person should have already approved this step's inclusion in the plan.

```bash
git tag education-v0.0.0-test
git push origin education-v0.0.0-test
```

Then check the Actions run:
```bash
gh run list --workflow "education-tag-check.yml" --limit 1
```
Expected: a run appears, triggered by the `education-v0.0.0-test` tag, and it passes (lint clean).

- [ ] **Step 5: Delete the test tag, both locally and on the remote**

```bash
git tag -d education-v0.0.0-test
git push origin :refs/tags/education-v0.0.0-test
```

Expected: `git tag -l "education-v0.0.0-test"` (locally) and `gh api repos/{owner}/{repo}/git/refs/tags/education-v0.0.0-test` (remote, expect a 404) both confirm it's gone. This is a test artifact, not the real release — it must not linger.

---

## Task 3: Document the two-track convention

**Files:**
- Modify: `docs/MAINTAINING.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the tag/changelog convention established in Tasks 1-2.
- Produces: nothing another task depends on.

- [ ] **Step 1: Add a new subsection to `docs/MAINTAINING.md`'s "Release hygiene" section**

Find the existing "## Release hygiene" section (it currently ends with: "Never publish installed local copies or arbitrary branch state.") and add a new subsection immediately after it:

```markdown
### Two release tracks: skillset vs. education

The skillset and `education/` are versioned and tagged independently —
they have different consumption models (the skillset is installed via
`install-skills.ps1`; `education/` is just read on GitHub) and there is no
requirement to coordinate a release of one with a release of the other.

| | Skillset | `education/` |
|---|---|---|
| Tag prefix | `vX.Y.Z` (bare) | `education-vX.Y.Z` |
| Changelog | `CHANGELOG.md` | `education/CHANGELOG.md` |
| What a tag gets you | An installable package version, matched against `contracts/skill-inventory.json`'s `packageVersion` | A citable reference point — "this is what was used for this cohort" |
| GitHub Release page | Yes, with generated notes (`.github/workflows/release.yml`) | No — tag only, no Release object, no artifacts |
| CI on tag push | Full release pipeline | `education-tag-check.yml`: `lint:markdown:education` only |

When you make a change, update whichever changelog matches what you
touched — a change to `skills/*/SKILL.md` or the installer never touches
`education/CHANGELOG.md`, and vice versa. If a single PR touches both
(rare — they're deliberately decoupled), update both changelogs and it's
fine for only one of the two tags to move.
```

- [ ] **Step 2: Update `README.md`'s "Release status" blurb**

Find:
```markdown
> **Release status:** [v0.1.0](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/releases/tag/v0.1.0)
> is published. This checkout targets the upcoming v0.2.0 package contract
> (ten skills); tag and publish the matching GitHub release per
> `github-releases` before updating this line.
```

Add one sentence after it (same blockquote, new line):
```markdown
>
> The `education/` program is versioned independently — see
> `education/CHANGELOG.md` and `docs/MAINTAINING.md`'s release-hygiene
> section for the `education-vX.Y.Z` tag convention.
```

- [ ] **Step 3: Run the full check**

Run: `npm run check`
Expected: pass — this touches `docs/MAINTAINING.md` and `README.md`, neither of which carries the `Refs #N` closure-gate paragraph verbatim in a way these edits would disturb (confirm by checking `tests/workflow-policy.test.mjs`'s `policyFiles` list still passes; both files are on it, but this edit doesn't touch the closure-gate paragraph itself).

- [ ] **Step 4: Commit**

```bash
git add docs/MAINTAINING.md README.md
git commit -m "docs: document the two-track release/versioning convention

Refs #40"
```

---

## Task 4: Verify PR #39, cut and push `education-v1.0.0`, final check

**Files:** None (verification + a git tag).

**Interfaces:** None — this is the final step that depends on everything above plus an external prerequisite (PR #39).

- [ ] **Step 1: Confirm PR #39 has merged**

Run: `gh pr view 39 --json state,mergedAt --jq '{state,mergedAt}'`
Expected: `"state": "MERGED"` and a non-null `mergedAt`. **If it has not merged, STOP this task and report back — do not proceed to Step 2 until it has.** This is a hard external dependency, not something to work around.

- [ ] **Step 2: Pull `main` and confirm the Session 2 diagram fix is present**

```bash
git fetch origin
git log --oneline origin/main -5
```
Confirm the commit that fixed Session 2's state diagram (from PR #39) is an ancestor of `origin/main`. If unsure which commit that is, check: `git log origin/main -- education/intermediate/session-2-our-workflow.md` and read the most recent commit's message — it should reference fixing the closure-gate diagram.

- [ ] **Step 3: Run the full check on this branch merged with current main**

This branch (`process/split-release-versioning`) was created before PR #39 merged, so it doesn't yet have PR #39's fixes. Merge current `main` into this branch to pick them up before tagging:

```bash
git merge origin/main
npm run check
```
Expected: merge succeeds with no conflicts (Tasks 1-3 touched different files than PR #39 did, except possibly `README.md` and `docs/MAINTAINING.md` — if `README.md` conflicts, resolve by keeping both this branch's "Release status" addition and PR #39's education-folder link, they're different lines). Full check passes after merging.

- [ ] **Step 4: Cut and push the `education-v1.0.0` tag**

```bash
git tag education-v1.0.0
git push origin education-v1.0.0
```

- [ ] **Step 5: Verify the tag check workflow ran and passed**

```bash
gh run list --workflow "education-tag-check.yml" --limit 1
```
Expected: a run triggered by `education-v1.0.0`, passing.

- [ ] **Step 6: Push this branch and open the PR**

```bash
git push -u origin process/split-release-versioning
gh pr create \
  --title "Split release/versioning: independent education-vX.Y.Z tags" \
  --body "Refs #40

Implements docs/superpowers/specs/2026-09-26-split-release-versioning-design.md.

Adds education/CHANGELOG.md, a new education-tag-check.yml workflow (lint-only, no release), and documents the two-track convention in docs/MAINTAINING.md and README.md. The skillset's own version/tag/release scheme is completely untouched. education-v1.0.0 has been tagged and pushed, verified against PR #39's merged, corrected content." \
  --base main
```

- [ ] **Step 7: Wait for CI, then ask for merge approval**

Run: `gh pr checks <PR-number> --watch`
Expected: pass. Ask the maintainer once: "merge this when green?" — per this repo's own `github-hygiene` PR-flow convention, do not self-merge.
