# ADR 0010: One canonical agent-guidance file, `AGENTS.md`

## Status

Accepted (2026-09-30).

## Context

Issue #116 found an untracked `AGENTS.md` that was a blind find-and-replace of
`CLAUDE.md`: it named platforms twice ("Codex, Codex"), cited a path that does
not exist (`docs/AGENTS.md`), said three platforms where the repository
supports four, and lacked text that `CLAUDE.md` had since gained. Keeping two
hand-maintained copies of the same guidance invites exactly that drift, and
this repository already tests hard against drift between files that must
agree.

OpenAI Codex and GitHub Copilot read `AGENTS.md`. Claude Code reads
`CLAUDE.md`, and its documentation describes importing `AGENTS.md` from a
`CLAUDE.md` with an `@AGENTS.md` line as the supported way to share one file
across tools. When both files exist Claude Code reads `CLAUDE.md`, so the
import matters.

## Decision

- **Option B from #116.** `AGENTS.md` is the single source of the guidance.
  `CLAUDE.md` holds only the line `@AGENTS.md` plus a short Claude Code
  section, so every agent reads the same text.
- Not a symlink: a committed symlink is checked out as a plain text file on
  Windows clones without `core.symlinks`, and the Claude Code Edit tool
  refuses to write through one.
- Not deletion (option A): Codex and Copilot would lose the guidance.
- Not generation (option C): it would add a script to keep two copies equal
  when an import already makes them one file.
- `tests/agent-guidance.test.mjs` enforces the arrangement: `CLAUDE.md`'s first
  line is the import and the file stays short; `AGENTS.md` exists, names all
  twelve canonical skills and all four platforms, never names a platform twice
  in a row, and cites only repository paths that exist.

## Consequences

- Edit `AGENTS.md` for any change to agent guidance. A change to `CLAUDE.md`
  is only for instructions that apply to Claude Code alone.
- The content of `AGENTS.md` is the former `CLAUDE.md` text, so nothing the
  guidance said was lost. The corrupted untracked draft is replaced.
- Earlier ADRs and the education changelog that say "`CLAUDE.md`" stay as
  written, because they record what was true then.
- Sessions on a Claude Code version that cannot read `AGENTS.md` directly are
  unaffected, because the import in `CLAUDE.md` loads it.
- Evidence: issue #116; review finding F02 in `docs/review/audit-review-claude.md`.
