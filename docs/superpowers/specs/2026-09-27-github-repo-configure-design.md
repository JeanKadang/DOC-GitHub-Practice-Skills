# Design: `github-repo-configure` — new skill for configuring an already-existing repo

**Date:** 2026-09-27
**Issue:** #42
**Status:** Approved (brainstormed section-by-section with the maintainer)

## Problem

The common real-world starting point isn't "I'm creating a new repo"
(`github-repo-bootstrap`'s scope) — it's "a colleague with repo-creation
access just handed me an already-existing, mostly-empty repo, and I need to
configure it beyond whatever the company already mandates." Nothing today
walks through eliciting the org-optional decisions for that scenario: Wiki,
Discussions, Project attachment, label scheme. Also needed: issue/PR
templates (Bug Report, Improvement) structured for both human readability
and AI-agent auto-triage — this repo doesn't yet ship anything a *consumer*
repo could reuse (its own `.github/ISSUE_TEMPLATE/*.yml` and PR template are
self-referential to this meta-repo, not portable).

## Decision: new skill, not an enhancement

Three options were considered:

1. **New skill `github-repo-configure`** (chosen) — this is a genuinely
   distinct trigger moment from `github-repo-bootstrap`'s "before an issue
   exists" carve-out (CLAUDE.md: "the only skill allowed to create repo
   content before an issue exists"). An already-existing repo being
   configured should go through normal issue-first flow like everything
   else, which a bootstrap-scoped skill structurally can't claim to do
   without blurring that stated invariant.
2. Enhance `github-repo-bootstrap` — rejected: would blur the "before an
   issue exists" boundary CLAUDE.md relies on as an architectural
   invariant.
3. Enhance `github-issue-first` — rejected: bolts a repo-settings/scaffolding
   topic onto a skill about filing workflow, diluting its focused trigger —
   the same bloat problem ADR 0002 fixed by splitting `github-hygiene`.

This repo's own precedent for "should this be a new skill" is ADR 0002
(added `github-releases` + `github-contributing`), which went through this
same brainstorming → spec → plan pipeline rather than a quick in-chat
design — followed here for consistency.

## Skill identity

- **Name:** `github-repo-configure`
- **Trigger:** use when handed an existing repository (already created,
  possibly already has commits) that needs its org-optional settings
  configured beyond whatever the company already mandates — not when
  creating a brand-new repo from scratch (that's `github-repo-bootstrap`).
- **CLAUDE.md roster one-liner:** elicits org-optional settings (Wiki,
  Discussions, Project attachment, label scheme) for an already-existing
  repo, and provides dual human/AI-triage issue and PR templates.
- **Boundary/handoff:** hands the actual settings changes to whichever
  skill owns them once decided — `github-projects` for board attachment,
  `github-issue-first` for label scheme and Discussions triage — and
  cross-references (never duplicates) `github-repo-bootstrap`'s
  scaffolding-matrix table for the Wiki/Discussions/Projects "should we"
  decision itself. This skill's own unique content is the elicitation
  checklist and the template files. Configuring settings on an existing
  repo is real work, not repo creation, so it still goes through normal
  issue-first: file an issue before making changes, like every other skill.

## Elicitation checklist

Four yes/no-plus-branch questions, in order — the skill's value is knowing
what to ask and where the answer routes, not owning the content:

1. **Wiki** — "Does this repo already have an established, actively-used
   Wiki?" → if yes, leave it (per `github-repo-bootstrap`'s conditional
   table, ADR 0003); if no, don't enable one unless explicitly asked.
2. **Discussions** — "Enable Discussions? If yes, which categories does
   this repo actually need?" → point to `github-issue-first`'s Discussions
   section (Ideas/Q&A/RFC/Announcements); don't cargo-cult all four.
3. **Project board** — "Attach this repo to a board?" → defer entirely to
   `github-projects`'s "Decide whether a board is warranted" table (solo →
   no board; second maintainer joining → yes; multi-repo → org-level board,
   cross-reference its multi-repo subsection).
4. **Label scheme** — "Does the org already have a label convention, or
   does this repo start fresh?" → if the org has one, match it; else
   default to `github-issue-first`'s P0–P3 + category scheme.

Issues/PRs/milestones being in use is presumed already a given — this
checklist never asks about them.

## Issue/PR templates

**First-pass field design** (explicitly OK to refine before whatever
release ships this, per the maintainer — not a final/polished set):

GitHub **issue forms** (`.github/ISSUE_TEMPLATE/*.yml`), not markdown
templates — matches `github-issue-first`'s existing preference (required
fields are enforced, and each field renders under its own heading, which is
what makes a form machine-parseable by an AI reading the body).

- **`bug.yml`** (auto-labels `bug`): Steps to reproduce (ordered, required —
  the field an AI can literally attempt to replay); Expected behavior /
  Actual behavior (two separate required fields, never merged); Environment
  (structured textarea: OS, relevant tool + version); Impact (dropdown:
  blocks work / degrades work / cosmetic — feeds P0–P3 triage); Additional
  context/logs (optional).
- **`improvement.yml`** (auto-labels `enhancement`): Problem (what's
  limiting today); Proposed change; Alternatives considered (optional);
  Impact if not done (same triage-feed purpose); Additional context
  (optional).
- Both leave **priority unset** — auto-labeling the category is safe and
  mechanical, but P0–P3 needs judgment using the Impact field as input, not
  a form default.
- **`config.yml`**: `blank_issues_enabled: false` + a contact link pointing
  at private security reporting — this repo's own file
  (`.github/ISSUE_TEMPLATE/config.yml`) is the exact right pattern, reused
  generically (no repo-specific URL hardcoded — the skill's copy uses a
  placeholder the agent fills in for the target repo).
- **`pull_request_template.md`**: this repo's own `Refs #N` / Summary /
  Acceptance-criterion evidence / Validation shape, genericized — drop the
  "public-content confirmation" checkbox (specific to this meta-repo's own
  public-content policy), keep everything else.

These four files are **not** copies of this repo's own
`.github/ISSUE_TEMPLATE/*` — this repo's versions are self-referential (an
"Affected skills" dropdown listing its own 10-to-11 skills, a public-content
checkbox specific to its own policy). The new skill's templates are
generic/portable, for whatever repo the skill's user is configuring.

## Roster cascade

Bundles the four template files as companion files alongside the standard
two — precedented by `github-repo-review`, which already bundles a third
file (`review-prompt.md`) beyond `SKILL.md` + `agents/openai.yaml`.

- `skills/github-repo-configure/SKILL.md` (new)
- `skills/github-repo-configure/agents/openai.yaml` (new)
- `skills/github-repo-configure/templates/bug.yml` (new)
- `skills/github-repo-configure/templates/improvement.yml` (new)
- `skills/github-repo-configure/templates/config.yml` (new)
- `skills/github-repo-configure/templates/pull_request_template.md` (new)
- `contracts/skill-inventory.json` — new entry, all 6 required files listed
- `scripts/validate-skills.mjs` — `CANONICAL_SKILLS` constant, new entry
- `scripts/install-skills.ps1` — `$canonicalRequiredFiles` ordered
  hashtable, new entry. Verified: the script itself has no hardcoded
  skill-count literal left (ADR 0002 already converted the four spots that
  existed then to derive from roster size dynamically) — nothing to touch
  here beyond the hashtable entry itself.
- `README.md` skill list, `docs/GUIDE.md` per-skill section, `CLAUDE.md`
  roster enumeration (ten → eleven)
- This repo's own `.github/ISSUE_TEMPLATE/bug.yml` and `improvement.yml`
  "Affected skills" dropdowns get `github-repo-configure` added — this repo
  now has 11 skills a bug could be filed against
- `tests/roster-consistency.test.mjs` needs no edit — it cross-checks the
  three manifest sources automatically and is the safety net for anything
  missed above
- **Verified still needing updates** (checked directly, not assumed from
  ADR 0002's list, since that list was specific to the prior 8→10 change):
  `tests/install-skills.test.mjs` has hardcoded `10`/`ten` literals at
  lines ~163 (`/Skills \(10\)/i` regex), ~176 and ~375 (test names saying
  "ten skills"); `tests/validate-skills.test.mjs` line ~33 (test name "the
  canonical ten-skill checkout") and ~36 (`result.skills.length, 10`
  assertion). All need bumping to 11/eleven.
- Issue #42's own acceptance criteria require `npm run check` to pass —
  the roster-consistency test and the two files above are exactly what
  makes that meaningful rather than accidentally green.

## Non-goals

- Not designing a literal interactive wizard UI — "interactive elicitation"
  means a checklist of questions an AI agent asks a human in conversation,
  the same shape every other skill in this roster already uses.
- Not re-documenting Wiki/Discussions/Projects mechanics — those live in
  `github-repo-bootstrap`, `github-issue-first`, `github-projects`
  respectively and are only cross-referenced here.
- Not polishing the template field set to final form — explicitly a
  first pass, refinable before a near-final release.
