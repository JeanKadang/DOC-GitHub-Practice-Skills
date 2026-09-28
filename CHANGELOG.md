# Changelog

<!-- markdownlint-disable MD024 -->

## [Unreleased]

## [0.3.0] - 2026-09-28

### Added

- `github-repo-configure` skill — elicits Wiki, Discussions, Project
  attachment, and label-scheme decisions for an already-existing repo, and
  ships four generic issue/PR template files.
- `github-for-gitlab-users` skill — maps GitLab concepts to GitHub, covering
  the `.gitlab-ci.yml` → Actions rewrite, milestones-vs-iterations, and the
  Groups/subgroups gap.
- Substantive Discussions guidance in `github-issue-first`, a conditional
  Wiki stance in `github-repo-bootstrap` (leave an established one alone,
  never proactively enable a fresh one), and a multi-repo Projects how-to
  in `github-projects` — see ADR 0003.
- `CLAUDE_HOME`/`CODEX_HOME`/`COPILOT_HOME` environment-variable discovery
  in `install-skills.ps1`, matching what the platform docs already claimed.
- PowerShell-native examples alongside the existing Bash ones across every
  `skills/*/SKILL.md` with a multi-line command.
- A workflow that copies a linked issue's category labels onto its PR, so
  generated release notes categorize correctly instead of defaulting to
  "Other."
- Session 2 and Session 3 of the colleague training program are now full
  facilitator scripts, at the same depth as Session 1.
- `tests/issue-form-templates.test.mjs` — validates every bundled GitHub
  issue-form template's shape.

### Changed

- Bounded `Assert-NoReparseInExistingAncestry`'s ancestry walk to the
  nearest path the installer itself owns, instead of walking to the
  filesystem root — fixes the recurring macOS `/var` false positive
  without weakening the guard's real protection. The macOS CI leg is
  restored (advisory).

### Fixed

- `education/README.md`'s onboarding flowchart no longer mis-routes GitLab
  (or GitHub-native) readers to the Azure DevOps mapping skill.
- `github-hygiene`'s closed-issue audit command's jq interpolation was
  double-backslashed and silently printed a placeholder string instead of
  real issue numbers/titles.

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
