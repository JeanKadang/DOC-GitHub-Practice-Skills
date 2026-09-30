# ADR 0009: Numbered education folders; LLM pre-req is required reading

## Status

Accepted (2026-09-30).

## Context

Issue #109 raised two problems with ADR 0007's tier scheme as actually
built. First, folder names (`beginners/`, `intermediate/`, `advanced/`,
`extra/`, `llm/`) didn't signal reading order, and `npm run check` doesn't
catch a wrong-order read the way it catches a broken link. Second, and
more substantively: `extra/` contained exactly one file —
`setup-local-dev-environment.md` — and "extra" (ADR 0007's last, most
optional tier) was the wrong label for it. That page is genuinely phase-0
prerequisite content, needed before Session 2's command-line work, not
supplementary material to skip. Separately, the LLM track's Pre-requisite
page (ADR 0007, #98) covers two specific surprises that had already caught
real colleagues off guard in a live session — foundational enough that
framing it as an optional side-track undersold its importance.

## Decision

- New `0_prerequisites/` folder: `session-0-what-is-version-control.md`,
  `prerequisite-what-is-an-llm-assistant.md` (both **required** reading,
  regardless of git/GitHub background), and `setup-local-dev-environment.md`
  (**conditional** — only if Git/VS Code aren't already installed).
  Grouping by folder location signals "this is foundational," not that
  every file in it is mandatory — the required/optional distinction is
  still made explicit in prose and in `education/README.md`'s routing.
- `beginners/` → `1_beginners/`, `intermediate/` → `2_intermediate/`,
  `advanced/` → `3_advanced/` — numbers make reading order visible in a
  directory listing, not just in prose a reader might skip.
- The LLM Pre-requisite page is promoted from "first page of an optional
  track" to required reading for everyone, converged into from both
  branches of `education/README.md`'s routing flowchart regardless of
  git/GitHub background. The rest of the LLM track (Basics, Intermediate,
  Advanced, Extra) stays optional as it's written — only the
  already-proven-necessary Pre-requisite page changes status.
- A `4_next-level/` tier is reserved in naming but **not created empty**
  in this ADR — its content is undefined and a separate decision, tracked
  as a follow-up once there's something to put there. An empty directory
  with no real content would be worse than no placeholder at all.
- `education/examples/`, `cheat-sheet.md`, and `facilitator-guide.md` stay
  outside the numbered sequence — they're lookup references and
  facilitator tooling, not steps in the learning path, so numbering them
  would misrepresent what they are.
- This supersedes ADR 0007's *folder-naming* specifics (`beginners/
  intermediate/advanced/extra` tier names) while leaving its actual
  decision — two tracks, GitHub and LLM, both eventually five-tiered —
  intact. ADR 0007 itself is not edited; it remains the accurate record of
  what was decided and why on 2026-09-30, earlier the same day.

## Consequences

- All content-bearing files moved via `git mv` to preserve history; no
  file content changed beyond internal cross-reference paths.
- Every cross-folder link repo-wide needed updating (same-folder links,
  as bare filenames, stayed valid automatically since files that
  reference each other moved together) — found via a repo-wide grep
  before editing, the same discipline ADR 0005's Consequences section
  established after a prior miss.
- `skills/github-for-ado-users/SKILL.md` had one path reference to
  `education/beginners/session-0-what-is-version-control.md`, now
  `education/0_prerequisites/session-0-what-is-version-control.md`.
- `education/README.md`'s routing flowchart, background table, topic
  mindmap, and materials list were substantially rewritten, not just
  path-patched, since the LLM pre-req's promotion to required changes the
  actual routing logic (both background branches now converge into it),
  not only which file lives where.
- `CLAUDE.md`'s ADR-0007-derived tier description ("Pre-requisite, Basics,
  Intermediate, Advanced, Extra") needed updating to match — done in the
  same PR as this ADR.
- Evidence: issue #109, repo owner discussion 2026-09-30, branch
  `docs/109-education-numbered-restructure`.
