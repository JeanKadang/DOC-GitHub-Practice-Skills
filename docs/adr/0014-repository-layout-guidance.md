# ADR 0014: Layout guidance lives in bootstrap, with review and hygiene hooks

## Status

Accepted (2026-10-09).

## Context

Issue #268. The skills governed repository settings, scaffolding files, CI, and
rulesets, but not the source layout. A new repository was created with a flat
root and every function in one source file, and was restructured only after it
was public and had a backlog. Restructuring is cheap while a repository is small
and costly once it has open pull requests, issues that reference paths, and
consumers with hard-coded paths. A blanket ignore rule (`*.yml`) also silently
hid a new workflow file during the same work.

## Decision

- **`github-repo-bootstrap` owns the canonical guidance.** A "Starting layout"
  subsection under the scaffolding matrix gives six stack-neutral principles and
  a short per-stack table, judged by a "Use when" column like the matrix. The
  layout is a bootstrap decision, so it is recorded in section 1 and in the
  bootstrap issue's acceptance criteria. It is created after the minimum shell,
  through the bootstrap pull request, not under the pre-issue exception.
- **`github-repo-review` checks it.** The self-contained `review-prompt.md`
  gets a "Repository structure" audit bullet and a "structure baseline" table. Findings
  are one grouped recommendation and stay analysis-only.
- **`github-hygiene` prompts for it early.** A "Structure drift" section says to
  suggest a restructure before the next feature, as a `decision-needed` issue and
  its own behaviour-preserving pull request, sequenced after line-ending and
  ignore-rule fixes and before the feature work that touches the same paths.
- **No new skill.** The guidance belongs inside the three skills that already own
  repository creation, audit, and ongoing hygiene. The roster stays at twelve.
- **Examples stay neutral.** The stack table names ecosystems, not projects.

## Consequences

- New repositories get a layout decision at bootstrap, with an explicit option to
  stay flat when the repository is one file.
- Audits report structure drift as a single recommendation instead of leaving it
  to be discovered during a feature.
- `review-prompt.md` restates the checks on purpose; it is the standalone version
  shared with people who do not run the skills.
- The layout table needs review when an ecosystem's conventions change. It is a
  starting point, not a mandated tree.
