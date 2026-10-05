# Education Program Changelog

<!-- markdownlint-disable MD024 -->

Independent of the skillset's [`CHANGELOG.md`](../CHANGELOG.md) — this file
tracks `education/` only. Tags use the `education-vX.Y.Z` prefix (see
`docs/MAINTAINING.md`'s release hygiene section for the full convention).

All notable changes to the colleague training program are documented here,
following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- The Mermaid diagram showcase now covers the ten diagram types added in
  Mermaid 12 (use case, Venn, Ishikawa, Wardley, tree view, railroad, Cynefin,
  event modeling, agent flow, and swimlane), 33 types in all, each with a
  fictional example that parses under Mermaid 12.0.0 in CI. They are listed in a
  new section and in the chooser table, with a note that they need a Mermaid 12
  renderer (#239).

## [2.0.0] - 2026-10-05

### Added (since `education-v1.0.0`)

- Module 4.1, reviewing changes an AI agent wrote: how an agent's pull request
  differs (scope creep, invented APIs, claimed checks that did not happen,
  special cases that pass, weakened safety nets), a review order, and a paper
  exercise on an invented flawed pull request with a model answer. It is the
  first module in `4_next-step/` and is optional (#230).
- Beginner modules 1.3 (Markdown for issues and pull requests), 1.4 (finding
  your way around a repository), 1.5 (what never goes in a repository), and 1.6
  (skills, instruction files, and MCP servers).
- Intermediate modules 2.3 (writing a good issue), 2.4 (writing a reviewable
  pull request), 2.5 (triage and backlog hygiene), 2.6 (where does this thought
  belong?), 2.7 (contributing to someone else's repository), 2.8 (why the rules
  exist), and 2.9 (safety with skills and MCP servers).
- Module 3.2 now covers milestones on a board and which board and view to use.
- `examples/ai-tooling-taxonomy.md`, a reference page that classifies developer
  and AI tools and marks which ones the program covers.
- A tools policy: all Git activity in the program is done in VS Code or on the
  command line (GitHub Desktop is out of scope).
- The setup page's extensions section is now two tiers (recommended and
  suggested), with Marketplace links checked on 2026-10-01.

### Fixed

- The facilitator guide no longer says every module works entirely through the
  web UI: Modules 1.2, 1.5, and 3.6 need a terminal and Git. The README entry
  for Module 3.6 now says so before you pick it (#126).
- Module 3.6 and Module 1.2 example commands now work as written (staging
  before commits, returning to the scratch branch before the undo exercise),
  and the reflog expiry defaults are stated correctly.
- Modules 1.1 and 2.1 teach criterion, then evidence, then `Closes`, and the
  Module 2.1 exercise now has a genuinely pending criterion.
- Module 0.1's account-recovery advice now matches GitHub's documentation.
- `facilitator-guide.md` setup list and checklist cover every module that uses
  the sandbox, and the Advanced modules' "independent of" lists cover all of
  Modules 3.1 to 3.6.
- The setup page is no longer titled "Extra:", matching its role as a
  conditional prerequisite (ADR 0009).

### Changed

- The LLM prerequisite no longer presents chat versus agent as the only
  distinction. Its vocabulary now separates product, model, instructions,
  context, tools, and permission; the diagram shows that what an assistant can
  do depends on enabled and permitted tools; and a new paper exercise covers
  scoping a task, checking actual actions, sensitive input, untrusted
  instructions, and human decision gates, with answer criteria on the
  self-check. Timing is now about 25 minutes. A Module 4.1 on reviewing agent
  changes is tracked in #230 (#152).
- Every module with an exercise now states, as bold labels, the **Permissions**
  it needs, its **Starting state**, its **Success state**, its **Likely errors**
  with the cause and fix of each, and its **Cleanup**. Modules 1.1, 1.2, 2.1,
  2.2, 3.1, 3.3, 3.4, and 3.6 gained the whole block; the others gained
  Permissions and Likely errors. Modules 0.1 and 3.5 are reading only. A test
  now enforces this (#151).
- Exercises no longer have every learner push the same branch name. Module 1.2's
  `conflict-a` and `conflict-b`, Module 2.4's two `docs/` branches, and Module
  2.6's ADR branch now include your name (#151).
- Module 3.2 now tells issue, pull request, and draft items apart by icon and
  number. Before, it said any item without an issue number is a draft, which is
  wrong for a pull request item (#151).
- Examples that read as drawn from a real workplace were replaced with invented,
  neutral ones, and the setup page says "your organization" and "work tool"
  instead of "the company" (#122).
- **Breaking:** every numbered lesson is renamed to `module-<tier>-<n>-<name>.md`
  and referred to as "Module `<tier>.<n>`" (ADR 0011, issue #161). Links and
  bookmarks to the old file names will 404; there are no redirects. Content is
  unchanged apart from titles, numbers, and cross-references.

  | Old file | New file |
  | --- | --- |
  | `0_prerequisites/session-0-what-is-version-control.md` | `0_prerequisites/module-0-1-what-is-version-control.md` |
  | `1_beginners/session-1-getting-started.md` | `1_beginners/module-1-1-getting-started.md` |
  | `1_beginners/session-2-local-git-basics.md` | `1_beginners/module-1-2-local-git-basics.md` |
  | `2_intermediate/module-2a-issue-first-and-closure-gate.md` | `2_intermediate/module-2-1-issue-first-and-closure-gate.md` |
  | `2_intermediate/module-2b-pr-review-and-branch-conventions.md` | `2_intermediate/module-2-2-pr-review-and-branch-conventions.md` |
  | `3_advanced/module-3a-branch-protection-and-rulesets.md` | `3_advanced/module-3-1-branch-protection-and-rulesets.md` |
  | `3_advanced/module-3b-projects-boards.md` | `3_advanced/module-3-2-projects-boards.md` |
  | `3_advanced/module-3c-releases.md` | `3_advanced/module-3-3-releases.md` |
  | `3_advanced/module-3d-security-response.md` | `3_advanced/module-3-4-security-response.md` |
  | `3_advanced/module-3e-actions-runners-and-agents.md` | `3_advanced/module-3-5-actions-runners-and-agents.md` |
  | `3_advanced/module-3f-rebase-cherry-pick-and-reflog.md` | `3_advanced/module-3-6-rebase-cherry-pick-and-reflog.md` |

- The reserved `4_next-level/` tier is now `4_next-step/`, created with
  `module-plan.md`, a plan of candidate advanced modules (none built). The
  facilitator guide's completion line now lists modules 0.1 to 3.6.

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
- **Breaking:** `education/beginners/`, `education/intermediate/`,
  `education/advanced/`, `education/extra/`, and `education/llm/` are
  renamed/merged to `education/0_prerequisites/`, `education/1_beginners/`,
  `education/2_intermediate/`, and `education/3_advanced/` — numbered for
  reading order (ADR 0009, refining ADR 0007). `0_prerequisites/` holds
  Session 0, the (now required) LLM Pre-requisite page, and the
  (conditional) local-dev-setup page together. Any external link or
  bookmark to the old folder paths will 404 — see issue #109 and ADR 0009
  for the rationale. All content unchanged beyond internal cross-reference
  paths; files moved via `git mv` to preserve history.

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
  setup, durable recovery-code storage, re-registering 2FA before replacing a
  device, GitHub Mobile as a legitimate option, and the locked-out
  recovery path. Prompted by the common failure of losing access after a
  device replacement with no recovery codes saved. See issue #90. (The advice
  about a shared authenticator in this first version was removed in #143.)
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
- `education/advanced/module-3f-rebase-cherry-pick-and-reflog.md` —
  resolves issue #69 (decision: add the module, not scope out). Interactive
  rebase for cleaning up commit history, cherry-pick for moving one commit
  between branches, and `git reflog` for recovering from a `reset --hard`
  that looks unrecoverable — all three framed under the same
  don't-rewrite-pushed-history rule Session 2 established for `reset
  --hard`. Two Mermaid diagrams. `education/README.md` routing updated;
  Module 3e's ending now hands off to 3f.
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
- `education/examples/mermaid-diagram-types-showcase.md` expanded from
  12 to 23 diagram types, split into "Established" (added requirement,
  C4 context, Sankey, XY chart) and "Newer/extended" tiers (architecture,
  block, kanban, radar, packet, ZenUML, treemap) — the latter explicitly
  flagged as unconfirmed on GitHub.com rather than claimed working,
  since GitHub's own diagram-support announcement predates them. See
  issue #111.

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
