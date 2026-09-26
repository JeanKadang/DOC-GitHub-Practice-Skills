# Colleague training program — design

**Date:** 2026-09-26
**Status:** Proposed
**Tracks:** Issue #36 (milestone: Colleague Training Program)

## Problem

This repository teaches an AI agent GitHub workflow (`skills/*/SKILL.md`),
but there is no equivalent onboarding material for humans. Colleagues
arrive at three different skill levels — never used version control,
some git knowledge, or prior GitHub/GitLab/Azure DevOps experience — and
nothing currently exists to bring any of them up to speed on how this
team actually works.

## Decision

Add a new top-level `education/` folder: human-facing training material,
deliberately separate from the agent-facing `skills/*/SKILL.md` files it
draws on. Sessions cross-reference specific skill sections by name rather
than restating their content, so the two surfaces cannot silently drift
apart — the same self-containment discipline
`skills/github-repo-review/review-prompt.md` already uses.

### Audience tiers and entry points

| Background | Entry point |
|---|---|
| Never used version control | Session 1 (beginners) |
| Some git knowledge (branches/commits, unfamiliar with this org's process) | Session 2 directly |
| GitHub/GitLab/Azure DevOps experience | `github-for-ado-users` (or the future GitLab-mapping skill, issue #35) as pre-reading, then Session 2 |

No hard prerequisite gate blocks anyone from starting at Session 2 or 3 —
routing is by self-assessed experience, not a certification step. This
avoids ceremony that would contradict the whole point of letting
experienced people skip fundamentals, while a lightweight completion
checkbox (see Facilitator guide, below) still lets a manager confirm a
new hire went through it.

### Format

Facilitator-run doc + hands-on sandbox repo, no slides. Each session file
is a run-sheet a superuser can project or print and run the session from
directly: learning objectives, a per-section timing budget, and a
walkthrough where attendees actively commit/branch/PR into a shared
sandbox repo rather than watching a demo.

### Content depth for this pass

- `education/README.md` — full content (short, it's an index).
- `education/beginners/session-1-getting-started.md` — **full content**,
  ready to run as-is. Proves the format before the other sessions commit
  to it.
- `education/intermediate/session-2-our-workflow.md` and
  `education/advanced/session-3-advanced-github.md` — **detailed outline
  and talking points**, not a full script. Fleshing these out fully is
  follow-up work, tracked as a new issue this plan files at the end.
- `education/cheat-sheet.md` and `education/facilitator-guide.md` — full
  content.

### Cadence: built for repeat use

Designed for both an initial one-time push to current colleagues and
ongoing use as a new-hire onboarding module:

- The sandbox repo's reset procedure is a checklist step in the
  facilitator guide (must be repeatable on demand, not tribal knowledge).
- Session 1 works standalone for a single new hire or a batched group.
- Completion tracking is a checkbox on whatever onboarding issue/checklist
  already exists for new hires — no new tracking system.

### Sandbox repo

Does not exist yet; this program specifies what it needs to be rather
than provisioning it in this pass. `facilitator-guide.md` covers:
private visibility (never public — this is internal practice material),
one shared repo per cohort (not per-attendee forks, to keep Session 1's
walkthrough steps concrete and identical for everyone), a reset
procedure (recreate from a template rather than manually undoing
commits), and minimal seed content (a README plus one open practice
issue with acceptance criteria, matching this repo's own issue
conventions).

### Visual aids (Mermaid diagrams)

GitHub renders Mermaid natively in markdown (` ```mermaid ` fences), so
diagrams live directly in the session files with no build step or
external tool. Added wherever a picture genuinely clarifies a flow for a
mixed-experience room — not decoratively, and not duplicating what prose
already says clearly. Different concepts get the diagram type built for
them, not a flowchart for everything:

- `education/README.md`:
  - **Flowchart** routing background → entry point (the audience-tier
    table, visualized).
  - **Mindmap** giving a bird's-eye view of what the three sessions cover,
    so someone deciding whether to attend Session 3 can see its topics
    without reading the full outline.
- `education/beginners/session-1-getting-started.md`:
  - **`gitGraph`** showing the actual git-internals view of what they're
    about to do: `main`, a feature branch forked off it, commits landing
    on that branch, then merging back — Mermaid supports git graphs
    natively and this is the literal shape of a branch, which prose
    alone doesn't convey well to someone who has never seen one.
  - **Flowchart** of the GitHub-UI-level walkthrough: clone → edit →
    commit → push branch → open PR → review → merge → linked issue
    closes. This pair is deliberate — the `gitGraph` shows what happens
    to the *repository*, the flowchart shows what the *person clicks*;
    together they're the single highest-value visual content in the
    whole program, since it's the mental model true beginners are
    missing on both axes.
- `education/intermediate/session-2-our-workflow.md`:
  - **State diagram** for the closure-gate lifecycle (`Unmet`/
    `Unevaluated` → `Met` → `Refs #N` → `Closes #N` → `Closed`, with the
    "reopen" transition from ADR 0001's connected-branch gotcha as an
    explicit edge) — a gate with named states and guarded transitions is
    exactly what a state diagram is for, and it's a genuinely different
    rendering from the ASCII sequence-flow already in
    `skills/github-hygiene/SKILL.md` and
    `skills/github-for-ado-users/SKILL.md` (deliberately duplicated there
    — see ADR 0001), not a fourth independent source of truth: it must
    describe the identical states and transitions those files already
    state in prose.
  - **Sequence diagram** for PR review etiquette — Author, Reviewer, and
    Maintainer as three lanes, showing the back-and-forth (open PR →
    review comment → push fix → approve → merge) that a flowchart
    flattens but a sequence diagram naturally shows as interaction
    over time.
- `education/advanced/session-3-advanced-github.md`:
  - **Flowchart** for the ruleset/branch-protection decision tree (public
    repo, or private on Pro/Team? → rulesets available → required checks
    configured?) — branching logic on real preconditions fits a decision
    flowchart.
  - **Timeline** for the release recipe's chronological steps (version
    picked → branch cut → CHANGELOG updated → PR merged → tag pushed →
    release published → milestone closed) — a chronological sequence of
    one-time steps is exactly what a timeline communicates that a
    flowchart's branching implies (misleadingly) isn't there.
- `education/facilitator-guide.md`:
  - **State diagram** for the sandbox repo's reset cycle (`Ready` →
    `In use` → `Reset triggered` → `Recreating` → `Ready`) if the
    procedure has more than a couple of steps; optional, only if it earns
    its place over a numbered list.

Every diagram gets a one-line "what this shows" caption above it — never
a diagram with no surrounding prose context, per the general documentation
principle that a picture supplements the explanation, it doesn't replace it.
That gives the program eight firm diagrams (nine counting the optional
facilitator-guide one) across six Mermaid types (flowchart, mindmap,
`gitGraph`, state diagram, sequence diagram, timeline) — chosen per
concept, not for variety's own sake; Session 3's second diagram (the
timeline above) is the leading choice but confirmed during
implementation once that outline is drafted.

### Extracting real org settings (public-repo boundary)

This repository is public, and its own `CONTRIBUTING.md` already states
the rule that applies here: "organization-specific material belongs in a
future private companion." Session 2/3's talking points (branch
protection, required approvals, Actions permissions) will vary by
employer, so `facilitator-guide.md` gets an appendix of `gh`/REST
commands a facilitator can run **in their own environment** to pull
their org's actual settings (org policy, Actions permissions, org-level
rulesets, per-repo security settings) — clearly labeled as something to
run locally and adapt talking points from, never to commit into this
public repo verbatim. No real extracted values appear anywhere in
`education/`.

## Non-goals

- No LMS, quiz platform, or certification tracking — a checklist item on
  an existing onboarding issue is the entire tracking mechanism.
- No slide deck format.
- Sessions 2 and 3 are not fully scripted in this pass (see Content
  depth above) — a follow-up issue tracks that.
- No changes to `skills/*/SKILL.md` content — `education/` references it,
  it doesn't modify it.
- Sandbox repo provisioning itself (creating the actual GitHub repo) is
  not part of this pass — the facilitator guide specifies requirements;
  running them is a setup step for whoever delivers the first session.

## File-by-file breakdown

- `education/README.md` — program overview, the audience-tier table
  above (plus its Mermaid routing flowchart), links to every other file.
- `education/beginners/session-1-getting-started.md` — full content.
  Learning objectives; ~60 min timing budget broken into sections; setup
  (sandbox repo link, prerequisites: a GitHub account, nothing else);
  walkthrough (clone → edit a file → commit → push a branch → open a PR
  → get it reviewed → merge → watch the linked issue close), all via the
  GitHub web UI, no CLI, illustrated with the workflow flowchart from
  Visual aids above; wrap-up pointing at Session 2.
- `education/intermediate/session-2-our-workflow.md` — outline + talking
  points. Sections: issue-first (why, `gh issue create` conventions),
  the closure gate (`Refs`/`Closes`, acceptance criteria, the connected-
  branch auto-close gotcha from ADR 0001 as a concrete cautionary
  example), branch-per-issue, PR review etiquette, milestones — the
  closure-gate lifecycle diagram from Visual aids sits with the
  `Refs`/`Closes` section. Each section names the `skills/*/SKILL.md`
  file it draws from.
- `education/advanced/session-3-advanced-github.md` — outline + talking
  points. Sections: rulesets/branch protection, Projects boards
  (referencing `github-projects`'s multi-repo pattern), releases
  (`github-releases`), a short security-response walkthrough
  (`github-security-response`).
- `education/cheat-sheet.md` — full content, one page: core git/GitHub
  actions (web UI first, CLI equivalents second) plus this program's own
  conventions (issue-first, `Refs`/`Closes`), meant as a leave-behind.
- `education/facilitator-guide.md` — full content: sandbox repo
  requirements and reset procedure; pre-session checklist; new-hire
  re-run guidance and the completion-checkbox convention; the "extract
  your org's real settings" appendix described above; a short FAQ
  (common beginner confusions anticipated from the Session 1 content).

## Testing / validation

No automated test suite applies to training content. Validation is:
`npm run lint:markdown:docs` must pass (this repo's existing markdown
lint covers `education/**` — it is not excluded the way
`docs/superpowers/**` is, since this is durable published content, not
ephemeral planning material). Beyond lint, the real validation is a dry
run: the first live delivery of Session 1 is the actual test of the
format, and the facilitator guide should get a "what to fix based on the
first run" note added afterward — tracked as follow-up, not blocking
this pass.

## Process note

This repository's own `github-issue-first`/`CONTRIBUTING.md` workflow
applies: branch `docs/education-scaffolding` is already created and
linked in spirit to issue #36 (`Refs #36` in commits). At the end of the
implementation plan, file a new follow-up issue for fully scripting
Sessions 2 and 3, per the Content depth decision above — that work is
explicitly out of scope for this plan.
