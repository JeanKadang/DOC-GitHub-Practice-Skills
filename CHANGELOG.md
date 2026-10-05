# Changelog

<!-- markdownlint-disable MD024 -->

## [Unreleased]

### Added

- The weekly audit (`scripts/closure-audit.mjs`) now also reports open issues with
  no milestone, open milestones with no open issues, and closed milestones that
  still have open issues, still report-only. Bot-written issues are exempt. The
  tracking issue is now titled "Repository audit: closure evidence and milestone
  consistency", and `docs/MAINTAINING.md` describes each row and its action (#243).
- `developer-experience` and `testing` now group under "Tooling & CI" in
  `.github/release.yml` and are copied by the label workflow, and a test fails
  when the workflow copies a label `release.yml` neither groups nor excludes.
  `decision-needed` stays out of the categories on purpose: it marks a pending
  decision, not a kind of change (#134).
- A public-content scan (`scripts/scan-public-content.mjs`, `npm run scan:public`,
  covered by `tests/public-content-scan.test.mjs`, so it runs in `npm run check`
  and CI). It fails on token-shaped strings, private IP addresses, internal-looking
  hostnames, and email addresses outside a documented allowlist, and the
  repository passes it. `docs/MAINTAINING.md` lists what it guards and what it
  cannot catch (#209).
- `scripts/package-education.mjs` builds a portable copy of `education/`: it
  derives the files the pages link to and the skills they name, keeps relative
  paths so links resolve, and writes `BUNDLE.json` with versions, licence, source
  commit, and file hashes. ADR 0013 records the choice of a Node script;
  `docs/MAINTAINING.md` describes its use (#146).
- A test that every education module's Audience line names only modules that
  exist, and that the education README Materials list names every module file.
  It fails on a seeded nonexistent prerequisite and on a module missing from the
  list (#210).
- A weekly, report-only closure audit (`.github/workflows/closure-audit.yml`,
  `scripts/closure-audit.mjs`): it lists issues closed as completed that still
  have an unchecked criterion in one tracking issue, and changes no other issue.
  `docs/MAINTAINING.md` documents the owner, the actions for each row, and the
  `closure-audit-reviewed` label (#115).
- New checks in `npm run check`: the validator now rejects a skill description
  over 1024 characters, a `default_prompt` that does not name its skill, and a
  `github-...` cross-reference that is not a skill. New tests check every
  relative link and heading anchor, parse every bash and PowerShell snippet,
  require every skill on each surface that lists the roster, keep version stamps
  and release-note labels consistent, and cap the ChatGPT export at 20 files.
  `docs/MAINTAINING.md` lists what each check guards (#129).
- The validator warns (without failing) when a `SKILL.md` is over 400 lines, and
  the check for false `Refs` open-state promises now covers every published
  Markdown file, not seven (#129).
- ADRs 0007 to 0011: the two-track education program, education portability by
  bundling, numbered education folders, the single agent-guidance file, and
  education module numbering. `docs/repo-settings-snapshot.md` is a read-only
  reference of a repository's settings to check before acting.
- Two repository audit reviews under `docs/review/` (a Claude review and a
  ChatGPT review), each finding tracked as its own issue (#113).
- The `education` label. `.github/release.yml` excludes it and the label-copy
  workflow copies it, so education-only pull requests stay out of the skillset's
  release notes; `docs/MAINTAINING.md` says to apply it (#147).
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

- The portable improvement form (`skills/github-repo-configure/templates/`) now
  has a required Expected outcome field, and both portable forms say a maintainer
  turns it into acceptance criteria when triaging. `github-repo-configure` and
  `github-issue-first` make that triage step explicit, so no issue reaches
  implementation without an observable completion contract. The form tests now
  check field types, unique ids, dropdown options, and the contract field (#145).
- The Mermaid parse check now runs under Mermaid 12.0.0 (was 11.17.2) with jsdom
  30.1.1 (was 26.1.0), both test-only dependencies. Every published diagram still
  parses. `package.json` `engines` now matches `jsdom` 30's floor (22.22.2 or
  newer on 22, 24.15 or newer on 24, or 26 and later; Mermaid 12 needs 22.12),
  and the diagram showcase names the new version and Mermaid 12's changed layout
  and look defaults.
- `docs/chatgpt.md`, `platforms/chatgpt/README.md`, and `README.md` now say that
  OpenAI has announced Custom GPTs retire on 2026-12-11, with the dates
  attributed to secondary reporting, dated, and qualified, and a table of which
  route to use. The Custom GPT export and walkthrough stay, and the paste route
  is the route after retirement. A plugin-based route is tracked in #227 (#144).
- `docs/MAINTAINING.md` records that GitHub's AI code-scanning check
  (`github-advanced-security`) was turned off on 2026-10-04 after repeated
  failures, with its history, and says what a reappearing check means (#225).
- Actions hardening (#132): the repository now requires full-SHA pinning and
  allows only GitHub-owned actions (all workflows already complied), every
  checkout sets `persist-credentials: false`, the education tag check no longer
  uses an npm cache, and a new advisory `Lint workflows` job runs actionlint and
  zizmor on workflow changes. A test keeps workflows within the pinning and
  ownership rules. `.github/zizmor.yml` records the one deliberate exception
  (the `pull_request_target` label workflow, which never checks out code).
- The release workflow is split into a read-only `check` job and a `publish` job
  that alone has `contents: write`. `check` checks out without stored
  credentials, installs with `npm ci --ignore-scripts`, and runs
  `scripts/verify-release.mjs`, which also requires the tag to be on `main` and
  to have a CHANGELOG section. A manual run of the workflow tests the guards
  without publishing. `github-releases` says to keep dependency code away from a
  write token (#128).
- The worked and example text in `github-releases`, `github-issue-first`, and
  `github-repo-configure` is now invented and neutral (a generic PowerShell module
  release example, "Reliability Hardening", "Naming Consistency", and a status
  badge title), and "the company" became "your organization" (#122).
- ADR 0012 records the milestone scheme: release-named (`vX.Y.Z`) for the
  skillset, "Education Program vN" for `education/`, and a thematic skillset
  milestone only until a release scopes it. `docs/WORKFLOW.md` says the same.
  The eight open issues in the two stale thematic milestones moved to `v0.4.0`
  and those milestones were closed (#123).
- `docs/MAINTAINING.md` lists the advisory checks and known failures: which
  checks are advisory, the GitHub-managed "Code scanning AI findings" run that
  failed with `The requested model is not supported` from 2026-09-30 to
  2026-10-01 and has passed since, and what to do about a red advisory check
  (#131).
- The repository's Wiki and Projects settings are now off (there were no Wiki
  pages and no boards), matching `github-repo-bootstrap`'s defaults.
  `docs/MAINTAINING.md` records the settings this repository expects, with a
  command to check them (#135).
- `docs/openai-codex.md` records where Codex looks for skills: OpenAI documents
  `~/.agents/skills`, the installer's `~/.codex/skills` still works on Codex CLI
  0.159.3 (tested 2026-10-01), and a skill installed in both places is listed
  twice. It also shows how to re-check after an update (#200).
- `github-releases` warns that renaming a CI job or changing a matrix orphans a
  required check (it never reports, so every PR is blocked) and gives the order
  for changing the ruleset in the same change. `github-repo-review`'s CI/CD audit
  now also checks that the runtimes CI tests are still supported, that the
  declared minimum agrees with CI and the lockfile, and that required check
  names still match running jobs (#213).
- CI tests Node.js 22 and 24 and `package.json` requires `>=22` (Node 20 is end
  of life, and the locked `markdownlint` already needs 22). The installer jobs
  are one OS matrix, the installer suite runs only on the OS legs
  (`npm run test:installer`) and everything else once per Node version
  (`npm run test:unit`), the dry run covers every target, and the workflow has
  `concurrency` and `timeout-minutes`. `docs/MAINTAINING.md` lists the required
  check names, and a test keeps the workflow, `engines`, and README in step
  (#130).
- `education/` has its own changelog (`education/CHANGELOG.md`) and tags, so
  the many education modules added since v0.3.0 are listed there, not here.
- `github-issue-first` and `github-hygiene` now scale ceremony to repository
  risk: on a repository with no CI, protection, or tests they ask the
  maintainer once, up front, whether to use the full issue, branch, and pull
  request routine or a lighter one. Both skills remind you to leave a
  closure-evidence comment at the point of action.
- `github-for-ado-users` names the TFVC-to-Git conceptual gap, and
  `github-repo-review`'s scaffolding baseline includes `CODE_OF_CONDUCT.md`.
  A stale claim that `gh issue create` has no `--milestone` flag is corrected.
- The ADO and GitLab mapping skills send issue forms and the PR template to
  `github-repo-configure`, `github-repo-review` lists every sibling skill, and
  the ADO Wiki section is conditional like ADR 0003 (#124).
- `github-hygiene`'s sub-issue section edits the parent checklist through a
  body file, with Bash and PowerShell forms, as its own closure step already
  required (#121).
- `README.md` and `docs/` no longer cite v0.1.0 or v0.2.0 as current, drop
  issue-history narrative from `docs/GUIDE.md`, and `docs/MAINTAINING.md` names
  all four consuming platforms (#125).
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
