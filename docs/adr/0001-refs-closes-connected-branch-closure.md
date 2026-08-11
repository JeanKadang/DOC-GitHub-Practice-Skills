# ADR 0001: `Refs`/`Closes` semantics must account for connected-branch closure

## Status

Accepted (2026-08-10).

## Context

The original workflow policy treated avoiding a PR-body closing keyword
(`Closes #N`) as sufficient to keep an issue open until every acceptance
criterion was met — a PR that used `Refs #N` instead was assumed safe.

That assumption broke in practice. Bootstrap issue #1's timeline recorded a
`connected` event at 2026-08-09T20:32:51Z (from `gh issue develop`) and an
automatic closure at 2026-08-10T15:11:14Z, the moment PR #2 merged — even
though PR #2's body used only `Refs #1` and the issue's `v0.1.0` release
criterion was still unchecked. GitHub's connected-development-branch
relationship closes the linked issue on merge independent of the PR body's
closing-keyword text. Avoiding `Closes #N` does not prevent this.

Issue #4 recorded this as a defect: the workflow guidance was silently wrong
about what kept an issue open, and nothing caught the gap until a real issue
closed early with an unmet criterion.

## Decision

- `Refs #N` avoids a PR-body closing keyword; it does not, by itself,
  guarantee the linked issue stays open when GitHub has a connected
  development branch.
- After every merge, immediately audit the linked issue's state and body. If
  it closed while an in-scope acceptance criterion is unchecked, unmet, or
  unevaluated, reopen it immediately and record the reason.
- For work that spans the PR merge (a release-scoped criterion still
  pending, for example), either use this audit-and-reopen flow, or track the
  PR-scoped work in a child issue and leave the release-spanning parent
  unconnected to any single branch.
- Every PR-scoped criterion still needs evidence before merge regardless of
  which of the above applies.

This is now stated identically in `skills/github-hygiene/SKILL.md`,
`skills/github-issue-first/SKILL.md`, `skills/github-repo-bootstrap/SKILL.md`,
`docs/GUIDE.md`, `docs/WORKFLOW.md`, and `docs/MAINTAINING.md` — see
`docs/MAINTAINING.md`'s cross-skill invariant review for the full list to
check when this wording changes.

## Consequences

- Closure can no longer be treated as self-evidently correct just because
  the PR body avoided a closing keyword; a post-merge audit step is now
  mandatory, not optional.
- Contributors doing release-spanning work must explicitly choose between
  the audit-and-reopen flow and the child-issue pattern, rather than
  assuming `Refs #N` alone is a safe default.
- `tests/workflow-policy.test.mjs` guards the corrected wording: it fails if
  any policy file reintroduces language claiming `Refs #N` guarantees an
  issue stays open.
- Evidence: issue #4, PR #5 (`fix: guard connected issue closure`).
