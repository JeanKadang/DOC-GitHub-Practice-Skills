# ADR 0007: Split the colleague training program into two tracks

## Status

Accepted (2026-09-30).

## Context

Issue #86 recorded a scope question raised by an impromptu live training
session: colleagues asked for material this program has never covered at
all — local dev environment setup (installing Git and VS Code, connecting
to GitHub Enterprise, useful extensions), and LLM-assisted workflow inside
VS Code (Copilot/Claude Code, custom personas, when to reach for an agent
versus a skill). `CLAUDE.md` had scoped `education/` as GitHub-workflow-only
human-facing material — genuinely covering the new material meant deciding
whether that scope itself should change, not just adding another module.

The same session also surfaced a second, separate finding worth naming here
even though it doesn't belong in this ADR's decision: this repo's own
skills (`github-issue-first`, `github-hygiene`) currently assume one
ceremony level — issue-first, a PR for everything — for every repo, and
that assumption broke down live against a flat, low-stakes team-description
repo with no branch protection. That is a skills-behavior gap, not an
education-scope question, and is tracked as its own follow-up issue rather
than folded into this decision.

## Decision

- `education/` becomes two parallel tracks: **GitHub** (existing content)
  and **LLM/VS Code tooling** (net new). Both use the same five-tier scheme:
  **Pre-requisite → Basics → Intermediate → Advanced → Extra.**
- The GitHub track's existing content maps onto the tiers as-is — Session 0
  is Pre-requisite, Sessions 1–2 are Basics, Modules 2a–2b are Intermediate,
  Modules 3a–3d are Advanced. An Extra tier is new for this track too (local
  dev environment setup — Git/VS Code/GitHub Enterprise install, relevant
  extensions — is its first candidate; content and structure to be filed as
  its own issue, not built in this ADR's PR).
- The LLM track starts as a skeleton only: this ADR establishes that it
  exists and what its tiers mean, not its content. Content per tier
  (prompting basics, using Copilot/Claude Code in VS Code, custom personas,
  agents vs. skills) is decomposed into individual issues and filed
  separately, per this repo's own issue-quality bar — a scope decision is
  not a content plan.
- `skills/*/SKILL.md` is **not** in scope for this decision. The 12-skill
  agent-facing roster stays GitHub-workflow-only; the LLM track is
  human-facing training on *how a colleague uses* LLM tooling day to day,
  a different thing from the policy an AI agent itself follows.
- `CLAUDE.md`'s definition of `education/` is updated in the same PR as
  this ADR, since the two are one change in practice: the scope statement
  and the record of why it changed shouldn't drift apart even briefly.

## Consequences

- `education/README.md` needs a real restructure (two-track routing,
  updated flowchart/mindmap/materials list) — tracked as a follow-up issue,
  not done here, since it depends on knowing what LLM-track files will
  actually exist.
- A new milestone is warranted for the LLM track's content work, separate
  from `Education Program v3` (which is GitHub-track-only follow-ups from
  the 2026-09-30 repo review) — to be created when the first LLM-track
  content issue is filed, not preemptively here.
- `education/CHANGELOG.md` gets an entry once real content lands, not for
  this scope-only PR — matches how ADR 0006 treated ChatGPT's own follow-on
  work.
- The skills-assume-too-much-rigor finding (see Context) stays tracked
  independently — it changes `github-issue-first`/`github-hygiene` behavior
  for low-stakes repos, not `education/`'s scope, so bundling it here would
  conflate two different kinds of decision.
- Evidence: issue #86, live training session 2026-09-30, branch
  `docs/86-two-track-education-adr`.
