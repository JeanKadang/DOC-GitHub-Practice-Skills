# Changelog

<!-- markdownlint-disable MD024 -->

## [Unreleased]

### Added

- `-Target ChatGPT` in `install-skills.ps1` — exports every skill's content
  as flattened, individually-named files for uploading to a Custom GPT's
  Knowledge, since ChatGPT has no local skill-directory discovery
  mechanism. See `docs/chatgpt.md` and ADR 0006.
- `tests/mermaid-diagrams.test.mjs` parses every published Mermaid fence under
  a pinned Mermaid (11.17.2, with jsdom) on every pull request, so a diagram that
  stops parsing fails CI. ZenUML is skipped because it needs a renderer
  integration. The diagram showcase now states the checked version and the dated
  GitHub rendering result (#148).

### Changed

- The ADO and GitLab mapping skills now send issue forms and the PR template to
  `github-repo-configure` (which ships them) instead of `github-repo-review`
  (which only audits). `github-repo-review` lists every sibling skill as a
  companion and `github-repo-bootstrap` mentions the GitLab skill. The GitLab skill
  no longer says Azure DevOps has no wiki, and the ADO skill's Wiki section is
  conditional like ADR 0003 and the GitLab skill: don't start a new Wiki, but an
  established one may stay (#124).
- Skills no longer assume the default branch is `main`. `github-contributing`,
  `github-releases`, and `github-hygiene` say `main` stands for the repository's
  default branch and show how to look it up, `github-pr-review` uses
  `<default-branch>`, and the mapping, projects, security, and bootstrap skills
  say "default branch" in prose. A test fails if a skill names `main` in a
  command without saying so (#119).
- `github-hygiene` now says auto-merge is the maintainer's switch: enabling
  it is the merge approval, it needs recorded evidence for every criterion
  first, and it is never combined with `Closes #N` unless every in-scope
  criterion is met, because an auto-merged `Closes` closes the issue before
  the closure gate can run. `docs/WORKFLOW.md` and education Modules 2.2 and
  2.4 say the same, and a test keeps the rule in place (#184).
- `github-issue-first` no longer files issues "without being asked" in any repo
  it touches. Noticing work is still automatic, but filing now needs a
  Preconditions check: `gh repo view --json viewerPermission` must show triage
  or higher (otherwise hand off to `github-contributing`), and the first filing
  in a repo each session is confirmed once, because an issue on a public repo is
  public. An explicit request, an approved `github-repo-review` plan, or the
  bootstrap issue already counts as the confirmation. `github-contributing` now
  says findings in a repo you only read go through that repo's own channels
  (#120).
- `AGENTS.md` is now the single agent-guidance file and `CLAUDE.md` only
  imports it (`@AGENTS.md`), so Codex, Copilot, and Claude Code read the same
  text. `tests/agent-guidance.test.mjs` fails if the import is lost or the file
  cites a missing path, names a platform twice, or omits a skill. See ADR 0010
  (#116).
- `install-skills.ps1` upgrades an unmodified install from an earlier release
  in place, with no `-Force` and no backup, by checking installed files
  against the hashes in their own marker. Reinstalling the current release is
  a no-op. `-Force` remains the path for locally modified or untracked skills.
  New `-KeepBackups N` keeps only the newest N sets under `skill-backups` (#118).

### Fixed

- Installed skills no longer point at files that are not installed with them.
  `github-issue-first` inlines its repo-risk checks instead of citing
  `docs/repo-settings-snapshot.md`; the ADR 0003 citations and the
  `superpowers:receiving-code-review` reference are gone; `github-hygiene`
  no longer hardcodes this repository's merge method and branch-deletion
  setting and tells the agent to check the repo's own; `github-projects` no
  longer suggests repurposing milestones as iterations; and the repo-review
  prompt now says "up to 10" so exactly ten issues has a defined path.
  `npm run validate` now fails a skill that adds such a reference (#119).
- The installer test helper's per-invocation timeout is now 60 s (override with
  `INSTALLER_TEST_TIMEOUT_MS`), a timeout is reported as a timeout with the
  signal, command, stdout, and stderr, and CI warms up PowerShell before the
  installer tests. A cold first `pwsh` start had exceeded the old 20 s limit and
  failed a required check on `main` (#117).
- `-Target ChatGPT` re-exports no longer need `-Force`. The export now
  writes `manifest.json` (package version, source commit, original path and
  SHA-256 per file) and a `LICENSE` copy; a re-export overwrites only the
  files the previous manifest lists, removes listed files the source no
  longer has, prints what was added, changed, and removed, and never touches
  unrelated files. `docs/chatgpt.md` now describes this accurately (#127).
- `install-skills.ps1` no longer deletes user-added files inside a tracked
  skill directory on an ordinary reinstall. An added file now counts as a
  local modification: the installer refuses without `-Force`, and `-Force`
  backs up the whole directory. The dry-run preview now reports
  `backup: none` when no backup will be made (#140).

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
