# Education Program Changelog

<!-- markdownlint-disable MD024 -->

Independent of the skillset's [`CHANGELOG.md`](../CHANGELOG.md) — this file
tracks `education/` only. Tags use the `education-vX.Y.Z` prefix (see
`docs/MAINTAINING.md`'s release hygiene section for the full convention).

All notable changes to the colleague training program are documented here,
following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- **Breaking:** `education/intermediate/session-2-our-workflow.md` and
  `education/advanced/session-3-advanced-github.md` are removed. Their
  content is split across six new self-paced modules:
  `education/intermediate/module-2a-issue-first-and-closure-gate.md`,
  `education/intermediate/module-2b-pr-review-and-branch-conventions.md`,
  `education/advanced/module-3a-branch-protection-and-rulesets.md`,
  `education/advanced/module-3b-projects-boards.md`,
  `education/advanced/module-3c-releases.md`, and
  `education/advanced/module-3d-security-response.md`. Any external link
  or bookmark to the old two-session paths will 404 — see issue #65 and
  `docs/superpowers/specs/2026-09-28-education-v2-self-training-design.md`
  for the rationale.
- The program's primary delivery mode is now self-paced/solo, not
  facilitator-narrated; facilitator-led delivery is still supported via
  inline "Facilitator note" callouts in each module.
- `education/README.md`'s routing flowchart, table, and topic mindmap
  updated to route into the six modules.
- `education/facilitator-guide.md` updated for module-aware completion
  tracking and to explain the facilitator-note callout convention.

### Added

- Each of the six new modules includes a hands-on exercise (Module 2a's
  live `Refs`/`Closes` connected-branch gotcha trigger is the centerpiece),
  a self-graded self-check, and a feedback prompt pointing at this repo's
  Discussions (Ideas category).
- `education/beginners/session-0-what-is-version-control.md` — a
  reading-only primer positioned before Session 1: what version control
  is, plain-terms vocabulary (commit/branch/push/pull/PR/merge), how
  GitHub's workflow assembles them, and a short GitHub vs GitLab vs Azure
  DevOps terminology table that points to the full `github-for-ado-users`
  and `github-for-gitlab-users` skills for depth. See issue #72.
  `education/README.md`'s routing flowchart, table, mindmap, and
  materials list updated to route into it ahead of Session 1.
- `education/beginners/session-2-local-git-basics.md` — hands-on
  command-line git, positioned after Session 1 and before Module 2a:
  working tree vs staging vs commit, the clone/push/pull loop, causing
  and resolving a real merge conflict on purpose, and the difference
  between `git restore`, `git revert`, and `git reset` for undoing a
  mistake. Entirely optional — every later module still works through
  the web UI alone. See issue #68. `education/README.md`'s routing
  flowchart, table, mindmap, and materials list updated, and
  `education/facilitator-guide.md` updated with its sandbox
  requirements (git installed locally, clone access; no new repo
  scaffolding beyond what Session 1 already needs).
- `education/beginners/session-0-what-is-version-control.md` gained a
  "Protect your account before you need to" section: 2FA/authenticator
  setup (shared company authenticator over a personal-only device),
  durable recovery-code storage, re-registering 2FA before replacing a
  device, GitHub Mobile as a legitimate option, and the locked-out
  recovery path. Prompted by a colleague actually losing GitHub access
  after a device replacement with no recovery codes saved. See issue #90.
- `education/extra/setup-local-dev-environment.md` — new Extra-tier
  content (per ADR 0007's tier scheme): installing Git on Windows,
  installing VS Code, connecting VS Code to GitHub Enterprise, and a
  recommended-extensions list (Markdown, Mermaid preview, PowerShell,
  GitHub Pull Requests and Issues) with why each one earns its place.
  Optional, doesn't gate any other module — Session 2 already assumed
  Git was installed; this is where that assumption gets satisfied. See
  issue #93. `education/README.md`'s routing flowchart, table, mindmap,
  and materials list updated.
- `education/advanced/module-3e-actions-runners-and-agents.md` — what a
  GitHub Actions workflow is, GitHub-hosted vs. self-hosted runners (and
  the security caveat on self-hosted runners against a public repo), and
  GitHub's Copilot coding agent — with the key point that a PR it opens
  goes through the exact same review/merge gate as a human-authored one.
  Deliberately scoped to the GitHub platform feature, not ADR 0007's LLM
  track (personal AI-tool usage). See issue #96. `education/README.md`
  routing updated; Module 3d's "last module" pointer updated to hand off
  to 3e.
- `education/llm/prerequisite-what-is-an-llm-assistant.md` — the first
  content in ADR 0007's LLM track: core vocabulary (model, prompt, context
  window, chat vs. agent mode), the agentic file/commit-editing behavior
  surprise named directly, and the confidently-wrong (hallucination)
  caveat. Prompted by colleagues new to LLM tooling being surprised by
  exactly these things. See issue #98. `education/README.md` gained a
  "Two tracks" pointer section and a materials-list entry — full
  GitHub/LLM track routing stays deferred per ADR 0007's Consequences.
- `education/beginners/session-0-what-is-version-control.md` gained a
  caveat: this program's full issue-branch-PR-review ceremony isn't
  one-size-fits-all — it earns its keep on higher-stakes repos, a
  low-stakes repo may reasonably use a lighter subset, ask the
  maintainer rather than assuming either way. Cross-references
  `docs/repo-settings-snapshot.md` and `github-issue-first`'s "Scaling
  ceremony to repo risk" section (added in #92) rather than duplicating
  them. See issue #102.
- `education/examples/markdown-formatting-showcase.md` and
  `education/examples/mermaid-diagram-types-showcase.md` — lookup
  references, not lessons: every GitHub-Flavored-Markdown feature worth
  knowing with raw syntax + rendered output side by side, and one minimal
  example of each major Mermaid diagram type confirmed to render on
  GitHub.com. See issue #104. Linked from `education/README.md`'s
  materials list.
- `education/extra/setup-local-dev-environment.md`'s recommended-
  extensions table gained a **Markdown PDF** row (exports to PDF/HTML,
  renders Mermaid diagrams in the export) — offline reading and printing
  weren't covered. See issue #106.

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
