# ADR 0002: Split `github-hygiene` and add `github-contributing`

## Status

Accepted (2026-09-25).

## Context

An audit of the eight-skill roster against four criteria — coverage gaps,
redundancy/overlap, boundary/handoff friction, and general quality — found:

1. `github-hygiene` was 328 lines (2nd largest of eight) and its own
   frontmatter `description` listed five distinct triggers: merging PRs,
   closing issues, reconciling acceptance criteria, cutting a release,
   tagging a version, creating/closing milestones, decomposing large work,
   and cleaning up branches. It structurally bundled three separable
   lifecycles: PR/merge flow plus the acceptance-criteria closure gate,
   branch protection/rulesets (~75 self-contained lines), and release
   mechanics (release-notes config, release recipe, milestones).
2. No skill owned the outside-contributor workflow. All eight skills
   assumed maintainer authority. `github-pr-review` covered reviewing a
   fork PR and had one short section on responding to review on your own
   PR — contributor-side content living in the reviewer-side skill.
3. The `Refs #N` closure-gate paragraph is deliberately repeated verbatim
   across several skill files and enforced by
   `tests/workflow-policy.test.mjs` (see ADR 0001) — this is correct design,
   not redundancy, since only the triggered skill loads into an agent's
   context at a time. The only real fixable issue was a handful of skills
   cross-referencing `github-hygiene` by name for milestone/ruleset content
   that needed to move with the split.

Full findings and file-by-file blast radius:
`docs/superpowers/specs/2026-09-25-github-skills-roster-optimization-design.md`.

## Decision

- Split `github-hygiene` into a trimmed `github-hygiene` (PR flow, the
  closure gate, CI-red triage, sub-issues, cleanup) and a new
  `github-releases` (rulesets, release-notes config, release recipe,
  milestones).
- Add `github-contributing`: forking, syncing a fork with upstream,
  submitting a PR to a repo you don't maintain, responding to review as the
  PR author. Absorbs `github-pr-review`'s former "Responding to review on
  your own PR" section.
- The `Refs #N` closure-gate paragraph does not move to either new skill —
  it stays exclusive to the skills already in
  `tests/workflow-policy.test.mjs`'s `policyFiles` list.
- Cross-references in `github-issue-first`, `github-repo-bootstrap`,
  `github-projects`, `github-for-ado-users`, and `github-pr-review` are
  repointed to the new skills rather than left stale or duplicated.

This is now stated identically in `docs/GUIDE.md`'s per-skill sections,
`README.md`'s skill list, and `CLAUDE.md`'s roster enumeration — see
`docs/MAINTAINING.md`'s cross-skill invariant review for the full list to
check when this wording changes.

## Consequences

- The canonical roster is 10 skills, not 8. `contracts/skill-inventory.json`,
  `scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
  `scripts/install-skills.ps1`'s `$canonicalRequiredFiles` all needed a
  matching entry added in two places (`github-contributing`,
  `github-releases`); `tests/roster-consistency.test.mjs` continues to catch
  any future drift between the three automatically.
- `install-skills.ps1` also had four hardcoded literal-`8` spots (the count
  guard, the `'canonical eight-skill inventory'` error message, the
  `"Skills (8)"` dry-run string, and the `"Installed 8 skills"` completion
  string) not covered by the "three hardcoded places" description in
  `docs/MAINTAINING.md` at the time — these were found during this change and
  converted to read the roster's actual size dynamically, so a future roster
  change won't reintroduce the same class of bug.
- `tests/install-skills.test.mjs` and `tests/validate-skills.test.mjs` had
  their own hardcoded "eight"/`8` literals (an output-format regex, two test
  names, a comment, and a length assertion) that needed updating alongside
  the roster change — these don't self-correct the way
  `roster-consistency.test.mjs` does, since they assert against the real
  repository's installed/validated state rather than cross-checking the
  three manifest sources against each other.
- Evidence: issue #30, PR #31.
