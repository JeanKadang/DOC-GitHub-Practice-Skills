# ADR 0016: Retire the ChatGPT route

## Status

Accepted (2026-10-10). Supersedes [ADR 0006](0006-chatgpt-coverage.md).

## Context

ADR 0006 gave ChatGPT users a way in: `install-skills.ps1 -Target ChatGPT`
flattened the skill files into a folder to upload as Custom GPT Knowledge,
with a copy-and-paste fallback. It shipped in v0.4.0 (issue #52 asked for it).
Two things changed by 2026-10-10 (issues #144 and #227):

- OpenAI's help center says Custom GPTs retire on 2026-12-11, and the
  replacement route (uploading skill folders as ChatGPT skills) was never
  tested here. Nothing in the repository had been checked in a real ChatGPT
  workspace.
- The maintainer decided the knowledge of creating a Custom GPT is not
  information users need, and that the repository's primary purpose is skills
  for the three coding tools that read a local skills directory.

## Decision

- Remove `-Target ChatGPT` and `-ChatGPTExportPath` from the installer, the
  tests that covered the export, and the CI dry run. The installer's targets
  are Codex, Claude, Copilot and Both.
- Delete `docs/chatgpt.md` and `platforms/chatgpt/README.md`, and remove the
  ChatGPT statements from the README, AGENTS.md, CONTRIBUTING.md,
  `docs/MAINTAINING.md` and `docs/compatibility.md`. The supported platforms
  are three: OpenAI Codex, Claude Code and GitHub Copilot CLI.
- Do not evaluate a ChatGPT plugin or skills route (#227 is closed as not
  planned). A future decision to support ChatGPT again would be a new ADR.
- This removes behaviour a released version shipped. The changelog says so, with
  a migration note, and the removal ships in a minor release.
- ADR 0006 is kept as history with its status changed. ADR 0007 and ADR 0008
  mention the ChatGPT export as precedent; they are left as written.

## Consequences

- Someone who exported the files with v0.4.0 keeps their folder and can still
  use it. Nothing new is produced for them, and the repository gives no
  guidance for it.
- The 20-file Knowledge-limit test is removed with the export it guarded, so a
  future skill or bundled file is no longer checked against that limit.
- The colleague training material is judged separately: a module that tells a
  learner to build a Custom GPT is removed, while a mention of ChatGPT as a
  product in a tool taxonomy can stay.
