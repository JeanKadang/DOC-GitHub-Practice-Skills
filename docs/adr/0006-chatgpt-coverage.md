# ADR 0006: ChatGPT coverage via Custom GPT export, not an installer target

## Status

Accepted (2026-09-28).

## Context

Issue #52 identified a real gap: `platforms/` covers three AI coding CLIs
that discover skills via a local filesystem directory (Claude, Codex,
Copilot), but someone using plain ChatGPT (the web app, Custom GPTs, or the
Assistants/API surface — distinct from the already-covered Codex CLI) had no
on-ramp. ChatGPT has no local skill-directory discovery mechanism at all, so
it structurally can't be a drop-in fourth adapter the installer targets the
way the other three are — the issue explicitly asked what "ChatGPT coverage"
should even mean before any implementation.

## Decision

- **Custom GPT + Knowledge files**, not an Actions schema and not
  documentation-only. A Custom GPT is the genuine ChatGPT equivalent of a
  persistent local skill directory: saved, reusable, shareable, and its
  Knowledge files are available every time without re-pasting — the same
  property `~/.claude/skills` etc. give the other three targets. An Actions
  schema was rejected: that mechanism is for wiring up live API calls, not
  loading prose policy content, and this repo's skills are policy documents,
  not API wrappers. Documentation-only (manual copy-paste every time) was
  rejected as the *primary* path — it's kept as the fallback for accounts
  without Custom GPT access, which needs a paid plan.
- `install-skills.ps1` gained a new `-Target ChatGPT`, deliberately
  **not** a drop-in fifth copy of the existing per-skill-directory
  mechanism. It flattens every skill's `requiredFiles` (skipping
  `agents/openai.yaml`, Codex-CLI-specific sidecar metadata irrelevant to
  ChatGPT) into one directory of individually-named files —
  `<skill-name>-<relative-path>` — ready for a human to upload as Custom GPT
  Knowledge. It skips the marker/backup/staging machinery the other three
  targets use: an export folder isn't a persistent, driftable install a
  human might hand-edit, it's a one-shot staging area regenerated before
  each upload.
- Individual per-skill `SKILL.md` files, not one concatenated bundle — a
  folder of 17 separate files mirrors the copy-based mechanism the other
  three targets already use, and ChatGPT's own Knowledge retrieval already
  handles picking the relevant file per conversation; concatenation would
  add complexity solving a problem that doesn't exist.
- New `platforms/chatgpt/README.md` adapter (matching the existing pattern)
  and `docs/chatgpt.md` (the full walkthrough: export, create the Custom
  GPT, paste the provided Instructions text naming all twelve skills'
  triggers, upload the 17 files, the manual-paste fallback).

## Consequences

- `platforms/` now has five entries: four real skill-consumer adapters
  (`claude`, `openai-codex`, `copilot`, `chatgpt`) plus the one
  non-consumer migration-source pointer (`azure-devops`).
- `CLAUDE.md` and `CONTRIBUTING.md`'s "policy changes must be considered
  against all consuming platforms" language bumped from three to four —
  ChatGPT genuinely consumes the raw `SKILL.md` content verbatim (no
  translation, same as Claude/Copilot), so a wording change needs to read
  sensibly there too.
- 17 files across 12 skills sit comfortably under ChatGPT's 20-file
  Knowledge limit today. That ceiling is explicitly documented in
  `docs/chatgpt.md` as something to watch as the roster grows — a future
  13th skill contributing 4+ files, or several skills each gaining
  companion files, could exceed it.
- 4 new tests in `tests/install-skills.test.mjs`, TDD'd against the actual
  `ValidateSet` rejection before the target existed: dry-run reports the
  plan without writing; a real run produces exactly the expected flattened
  file set (derived from `contracts/skill-inventory.json`, not hardcoded)
  with byte-identical content; refuses a non-empty destination without
  `-Force`; `-Force` writes alongside, never over, unrelated existing
  files — the same "never destroy what you don't own" posture
  `Assert-NoReparseInExistingAncestry` (#45) already established for this
  script.
- Evidence: issue #52, branch `feat/52-chatgpt-export`.
