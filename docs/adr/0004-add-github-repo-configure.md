# ADR 0004: Add `github-repo-configure` as an 11th skill

## Status

Accepted (2026-09-28).

## Context

Issue #42 identified a real, common trigger moment with no owner in the
existing roster: someone is handed a repository that already exists
(possibly with commits already), not one being created from scratch, and
needs its org-optional settings (Wiki, Discussions, Project attachment,
label scheme) configured. `github-repo-bootstrap` is explicitly scoped to
"the only skill allowed to create repo content before an issue exists" —
stretching it to also cover an already-existing repo would blur that stated
architectural invariant. `github-issue-first` was considered as the host
instead, but bolting a repo-settings/scaffolding topic onto a skill about
filing workflow would dilute its focused trigger, the same bloat problem
ADR 0002 fixed by splitting `github-hygiene`.

Full design reasoning, the elicitation checklist, and the template field
design: `docs/superpowers/specs/2026-09-27-github-repo-configure-design.md`.

## Decision

- Add `github-repo-configure`: a new skill triggered by "handed an existing
  repo, need to configure org-optional settings" — distinct from
  `github-repo-bootstrap`'s pre-issue-exists scope.
- It elicits four decisions (Wiki, Discussions, Project attachment, label
  scheme) and cross-references — never duplicates — the skills that already
  own each decision's mechanics (`github-repo-bootstrap`, `github-issue-first`,
  `github-projects`).
- It bundles four generic, portable issue/PR template files
  (`templates/bug.yml`, `templates/improvement.yml`, `templates/config.yml`,
  `templates/pull_request_template.md`) as companion files, precedented by
  `github-repo-review` already bundling `review-prompt.md` beyond the
  standard `SKILL.md` + `agents/openai.yaml`.

## Consequences

- The canonical roster is 11 skills, not 10. `contracts/skill-inventory.json`,
  `scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
  `scripts/install-skills.ps1`'s `$canonicalRequiredFiles` each needed the new
  entry; `tests/roster-consistency.test.mjs` continues to catch any future
  drift between the three automatically.
- `tests/install-skills.test.mjs` and `tests/validate-skills.test.mjs` had
  their own hardcoded "ten"/`10` literals (an output-format regex, three test
  names, a length assertion) needing updating — the same class of gap ADR
  0002 flagged for the prior 8→10 change; these don't self-correct.
- Several prose mentions of the skill count across `CLAUDE.md`,
  `CONTRIBUTING.md`, `docs/MAINTAINING.md`, `docs/claude.md`, `docs/copilot.md`,
  and `docs/openai-codex.md`/`docs/vscode.md` needed the same bump — a
  broader set than ADR 0002's own consequences list named, and even broader
  than this feature's own design spec first catalogued: a fresh full-repo
  grep during implementation caught two extra `CLAUDE.md` mentions the
  planning pass had missed.
- This repo's own `.github/ISSUE_TEMPLATE/bug.yml` and `improvement.yml`
  "Affected skills" dropdowns needed the new skill added — self-referential,
  since this repo now has 11 skills a bug could be filed against.
- The templates bundled with this skill are a first pass, expected to be
  refined before a near-final release, per the maintainer during design.
- Evidence: issue #42, branch `feat/42-github-repo-configure`.
