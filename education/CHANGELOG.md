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
