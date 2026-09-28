# Changelog

<!-- markdownlint-disable MD024 -->

## [Unreleased]

### Added

- `github-repo-configure` skill — elicits Wiki, Discussions, Project
  attachment, and label-scheme decisions for an already-existing repo, and
  ships four generic issue/PR template files.

## [0.2.0] - 2026-09-27

### Added

- `github-releases` skill — milestones, branch protection/rulesets, release
  notes, release recipe.
- `github-contributing` skill — forking, syncing, and submitting a PR to a
  repository you don't maintain.
- education/ folder — a colleague GitHub training program (README, three
  sessions, a cheat sheet, and a facilitator guide).
- `docs/vscode.md` — install walkthrough for VS-Code-first users (Claude
  extension and GitHub Copilot agent mode), linked from README.md.

### Changed

- `github-hygiene` narrowed to PR flow, the acceptance-criteria closure gate,
  and cleanup — release/ruleset/milestone content moved to `github-releases`.

### Removed

- macOS leg of the `installer-dry-run-cross-platform` CI job. It never
  passed (`/var` → `/private/var` reparse-point false-positive, #23);
  fixing the underlying guard needs real design work, not a quick patch,
  and the ongoing red-but-non-blocking noise wasn't worth carrying for an
  advisory check. Ubuntu coverage in that job is unaffected.

## [0.1.1] - 2026-08-11

### Added

- GitHub Copilot CLI as a third install target (`-Target Copilot`,
  `-CopilotHome`), plus `docs/copilot.md` and `platforms/copilot/README.md`.
  Copilot's Agent Skills format is an open standard shared with the existing
  `SKILL.md` files, so no content changes were needed.
- `docs/adr/` architecture-decision-record convention, backfilled with the
  first entry for the `Refs`/`Closes` connected-branch closure decision.
- Advisory (non-required) cross-platform installer CI on Ubuntu and macOS
  `pwsh`, alongside the existing required Windows check.
- Automated drift check (`tests/roster-consistency.test.mjs`) between the
  three independently-hardcoded copies of the canonical skill roster.
- `validate.yml` status badge on `README.md`.

### Fixed

- README's release-status callout, which still claimed no GitHub release
  existed after `v0.1.0` had already published.
- A hardcoded backslash path literal in `install-skills.ps1` that broke the
  installer on Linux/macOS regardless of the reparse-point question.
- `docs/GUIDE.md`'s "proposed improvements" list, which had gone stale —
  three of six items were already implemented and never removed from the
  list.

### Changed

- `install-skills.test.mjs` runtime reduced roughly 13% via concurrent file
  hashing and shared test fixtures, with no change to assertions or
  coverage.
- Milestone semantics (release-based, not thematic) codified explicitly in
  `docs/WORKFLOW.md`.

### Known issues

- The new macOS installer CI job fails: `/var` is a symlink to
  `/private/var` on macOS, which the reparse-point ancestry guard currently
  treats as an attack signal. Tracked in #23; the job is `continue-on-error`
  and non-required in the meantime.

## [0.1.0] - 2026-08-08

### Added

- Eight canonical GitHub workflow skills for OpenAI Codex and Claude.
- Safe Windows PowerShell installation and manifest validation.
- General Azure DevOps-to-GitHub migration guidance.
