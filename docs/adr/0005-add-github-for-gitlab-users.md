# ADR 0005: Add `github-for-gitlab-users` as a 12th skill

## Status

Accepted (2026-09-28).

## Context

Issue #35 identified a gap: `github-for-ado-users` maps Azure DevOps/TFS/Jira
concepts to GitHub for migrants from those tools, but GitLab migrants have
no equivalent — and GitLab's vocabulary and feature set differ from both
plain GitHub and from the ADO mapping already documented (Merge Requests,
Epics, Issue Boards, `.gitlab-ci.yml`, first-class Wikis, dual-purpose
Milestones, nested Groups).

## Decision

- Add `github-for-gitlab-users`, mirroring `github-for-ado-users`'s shape
  exactly: a mapping table, the traps specific to GitLab migrants, and a
  setup checklist pointing at the relevant companion skills.
- The single most expensive mistake it leads with: assuming `.gitlab-ci.yml`
  ports to a GitHub Actions workflow with a file rename, rather than the
  real pipeline rewrite it actually requires.
- Wiki guidance cross-references ADR 0003's conditional stance rather than
  restating a blanket rule — GitLab's Wiki is genuinely first-class for many
  teams, unlike ADO having no comparable feature at all, so the same
  conditional policy applies with more force here, not less.
- Groups/subgroups are documented as a genuine structural hole (no GitHub
  equivalent), the same treatment ADO's "Test Plans" gap already got.

## Consequences

- The canonical roster is 12 skills, not 11. `contracts/skill-inventory.json`,
  `scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
  `scripts/install-skills.ps1`'s `$canonicalRequiredFiles` each needed the
  new entry; `tests/roster-consistency.test.mjs` continues to catch any
  drift between the three automatically.
- `tests/install-skills.test.mjs` and `tests/validate-skills.test.mjs` had
  their own hardcoded "eleven"/`11` literals needing updating to
  "twelve"/`12` — the same recurring gap ADR 0002 and ADR 0004 both flagged.
  One stale comment (`tests/install-skills.test.mjs`) was made roster-size-
  agnostic instead of re-hardcoding a new number, so it won't go stale again.
- Prose mentions of the skill count across `CLAUDE.md`, `CONTRIBUTING.md`,
  `docs/MAINTAINING.md`, `docs/claude.md`, `docs/copilot.md`,
  `docs/openai-codex.md`, `docs/vscode.md`, and `README.md` needed the same
  bump — found via a fresh full-repo grep done *before* editing this time,
  per the lesson from ADR 0004's final review (a plan that only catalogs
  what it remembers misses stragglers; a grep catches what actually exists).
- This repo's own `.github/ISSUE_TEMPLATE/bug.yml` and `improvement.yml`
  "Affected skills" dropdowns needed the new skill added.
- `CHANGELOG.md`'s `[Unreleased]` section got an entry from the start this
  time, per `docs/MAINTAINING.md`'s invariant-review checklist (which now
  names `CHANGELOG.md` explicitly, added during ADR 0004's fix pass
  specifically to prevent this recurring).
- Evidence: issue #35, branch `feat/35-github-for-gitlab-users`.
