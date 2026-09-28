# Design: Education Program v2 — self-training format, exercises, feedback loop

**Date:** 2026-09-28
**Issue:** #65
**Status:** Approved (brainstormed section-by-section with the maintainer)

## Problem

The colleague training program (`education/`) has real depth but two gaps
a professional training design would flag:

1. **Sessions 2 and 3 have zero hands-on practice.** Session 1 is a real
   click-through exercise; Sessions 2/3 are narrative-only, however
   well-scripted (#37).
2. **No feedback loop exists**, despite #37's own scope note flagging this
   content as "best informed by feedback from actually running it live."

A third, deeper issue surfaced during design: the whole program assumes a
live facilitator throughout ("the facilitator narrates," fixed 1-2 hour
timing budgets, "suggested activity: as a group..."). The maintainer
expects most colleagues will actually do this **self-paced and solo**, and
a self-paced learner won't reliably block out a 1-2 hour session — they'll
want to fit it into spare 15-20 minute windows.

## Decisions

**1. Self-paced is the primary mode; facilitator-led is supported, not
dropped.** Content is rewritten as direct second-person self-paced
instruction ("Do this now," not "the facilitator narrates"). Facilitator-
only content (group activities, pacing cues) becomes clearly-marked
callout blocks a solo reader naturally skips and a facilitator watches
for. One file per unit serves both audiences — not two files, which would
drift out of sync the same way ADR 0002 avoided by not forking
hygiene/releases into parallel content.

**2. Sessions 2 and 3 split into topic-sized modules**, since self-paced
learners want bite-sized units and each existing section already has its
own 15-25 minute timing budget — this is mostly file-splitting of content
that already exists in section-sized units, not new writing from scratch:

- Session 1: unchanged, one piece (~60 min, already right-sized, already
  has a real hands-on exercise).
- Session 2 → two modules, since its four topics are sequential/build on
  each other:
  - **2a: Issue-first & the closure gate** (~40 min)
  - **2b: PR review & branch/milestone conventions** (~35 min)
- Session 3 → four modules, since its four topics are genuinely
  independent (someone might care about releases but not security):
  - **3a: Branch protection and rulesets** (~25 min)
  - **3b: Projects boards** (~20 min)
  - **3c: Releases** (~25 min)
  - **3d: Security response basics** (~15 min)

New file layout (replaces the current two monolithic files):

```
education/
  beginners/session-1-getting-started.md                          (unchanged)
  intermediate/module-2a-issue-first-and-closure-gate.md           (new, replaces session-2)
  intermediate/module-2b-pr-review-and-branch-conventions.md       (new, replaces session-2)
  advanced/module-3a-branch-protection-and-rulesets.md             (new, replaces session-3)
  advanced/module-3b-projects-boards.md                            (new, replaces session-3)
  advanced/module-3c-releases.md                                   (new, replaces session-3)
  advanced/module-3d-security-response.md                          (new, replaces session-3)
  README.md, facilitator-guide.md, cheat-sheet.md, CHANGELOG.md    (updated, not replaced)
```

`education/intermediate/session-2-our-workflow.md` and
`education/advanced/session-3-advanced-github.md` are deleted — their
content is redistributed into the six module files above, not duplicated
alongside them.

**3. Session 3's exercises are read-only/dry-run against the shared
sandbox — never state-changing.** Its content (rulesets, releases,
security settings) is admin-level; a shared sandbox can't safely have
multiple self-paced learners each creating rulesets or tagging releases
simultaneously. Read-only inspection teaches the same concepts with zero
conflict risk, matching how Session 1 already teaches by doing without
needing per-learner isolation.

**4. Feedback loop reuses existing infrastructure — no new mechanism.**
This repo already has GitHub Discussions enabled, and `github-issue-first`
already documents exactly the right pattern: Discussion = exploring,
Issue = committed, with a defined conversion step once feedback becomes
concrete. Each module ends with a short prompt pointing at Discussions;
no new tracking system, template repo, or survey tool.

**5. A lightweight self-check closes each module** — 3-5 "can you explain
X" questions, self-graded, no scoring infrastructure. Self-paced learners
have no facilitator to gauge whether the material landed; this is the
minimum viable substitute.

## Per-module exercise design

Each exercise is concrete enough to implement directly — no "add an
exercise" placeholders for the plan to invent later.

**2a — Issue-first & closure gate:** Live-trigger the `Refs`/`Closes`
connected-branch gotcha, the module's single most important lesson.
File an issue → `gh issue develop` (or "Create a branch" from the issue,
as in Session 1) → small edit → PR with `Refs #N` → merge → check the
issue. It auto-closes because of the connected branch, exactly as ADR
0001 describes. Practice the habit: reopen it with a comment explaining
why, even though in this toy exercise every "criterion" was trivially
met — the point is rehearsing the mechanical reopen-and-record habit
under real conditions, not simulating a real unmet criterion.

**2b — PR review & branch/milestone conventions:** File an issue with a
milestone attached at filing time (not as an afterthought — the module's
own stated discipline), branch with a proper `type/description` name,
open a PR. The full paired review roleplay (Request Changes → fix →
re-approve → separate merge decision) is marked as a **facilitator-led
extension**, not a solo-required step — asking a solo learner to
role-play both reviewer and author undermines the same module's "never
approve your own PR" rule. Solo learners get the concrete, mechanical
part (branch naming, milestone-at-filing) as their hands-on component.

**3a — Branch protection and rulesets:** `gh ruleset list`,
`gh ruleset view <id>`, `gh ruleset check main` against the sandbox repo
(or, if the sandbox has none configured, against this repo's own public
ruleset as a live external example — this repo already has one:
"Protect main"). Entirely read-only.

**3b — Projects boards:** If the sandbox has a Projects board (facilitator
sets one up ahead of time per the guide), browse it and spot-check that
one item's board Priority field matches its issue's priority label —
directly exercises the module's "board mirrors the issue, label is
authoritative" point. Read-only.

**3c — Releases:** `gh api repos/{owner}/{repo}/releases/generate-notes`
preview against the sandbox or this repo, plus locate and read the
current version file. Read-only.

**3d — Security response basics:** Roleplay the *reporting* flow only,
no real secret involved: navigate to a repo's Security tab and locate
Private Vulnerability Reporting (UI navigation, submit nothing), then a
short writing exercise — describe where a fake secret was found in one
sentence without including a value, practicing "reference where, not
what."

## Self-check question design (one set per module, pattern to replicate)

Example for 2a (the pattern every module follows — 3-5 questions, phrased
as "can you explain/do X," no scoring):

- Can you explain why `Refs #N` doesn't guarantee an issue stays open?
- What's the very first thing you check after any merge?
- What's the difference between a milestone and a sprint/iteration in
  this team's usage?

If a learner can't answer confidently, the self-check names which section
to re-read — not a pass/fail gate, a pointer back to the material.

## Feedback prompt (identical pattern, once per module)

A short closing block, consistent across all six modules:

> Something unclear, wrong, or worth improving in this module? Open a
> Discussion in this repo (**Ideas** category). Concrete, actionable
> feedback gets converted into a tracked issue, per this repo's own
> issue-first convention — see `skills/github-issue-first/SKILL.md`'s
> Discussions section.

## Supporting file updates

- **`education/README.md`**: the onboarding routing flowchart and table
  currently point at "Session 2"/"Session 3" as single destinations —
  needs updating to route into the module sequence (2a → 2b, then
  3a/3b/3c/3d in any order, framed as independently browsable). The
  "What's covered" mindmap needs the same six-module structure.
- **`education/facilitator-guide.md`**: "Tracking completion" stays
  coarse-grained (Session 1 / Intermediate modules / Advanced modules) —
  per-module checkboxes would be more overhead than this guide's own
  stated "don't build more than this needs" principle allows. The
  "Extract your org's real settings before Session 2/3" section's
  references become "before the advanced modules." Add one new short
  section: how a facilitator recognizes and uses the callout-block
  facilitator content within an otherwise self-paced module.
- **`education/cheat-sheet.md`**: no structural changes expected — it's
  already session-agnostic, referencing skills directly rather than
  session numbers. Confirm during implementation rather than assume.
- **`education/CHANGELOG.md`**: a new entry recording the restructure,
  following the existing Keep a Changelog format (this file's own
  `## [Unreleased]` section is currently empty).
- **Mermaid diagrams**: each of the four existing diagrams (Session 2's
  state diagram and sequence diagram; Session 3's decision-tree flowchart
  and timeline) moves into its matching new module file (2a, 2b, 3a, 3c
  respectively) unchanged — no diagram content needs to change, only its
  file location.
- **Root-repo cross-references**: `README.md`, `CLAUDE.md`,
  `docs/GUIDE.md`, or any other root doc that names `session-2`/`session-3`
  by path needs updating to the new module paths — grep for
  `session-2-our-workflow` and `session-3-advanced-github` across the
  whole repo (not just `education/`) before considering this done, the
  same discipline #41's sweep already established for this repo.

## Non-goals

- Not building a real scoring/certification system — the self-check is
  self-graded prose, not a quiz engine.
- Not giving each self-paced learner their own fork/practice repo for the
  advanced modules — read-only/dry-run against the shared sandbox covers
  the same learning goals without that setup cost (decision 3 above).
- Not inventing a new feedback tool — Discussions already exists and is
  already documented as the right home for this (decision 4 above).
- Not changing Session 1 — it's already self-paced-compatible and
  already has a real exercise.
