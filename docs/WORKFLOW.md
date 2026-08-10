# Workflow and closure gates

**Applies to:** v0.1.0

**Reviewed:** 2026-08-09

## Lifecycle

1. Confirm the repository and existing conventions.
2. File or select an assigned issue with one priority, relevant categories, a
   milestone, explicit scope, and observable acceptance criteria.
3. Create the branch with `gh issue develop` so GitHub records the link.
4. Make a focused change and conventional commits on that branch.
5. Open a pull request beginning with `Refs #N` and state the validation run.
6. Review the PR and evaluate each criterion against concrete evidence.
7. Keep `Refs #N` while any criterion is unmet or unevaluated.
8. After every in-scope criterion is met, record the evidence, update checkboxes
   with a newline-preserving body file, and change the PR to `Closes #N`.
9. Merge only after explicit maintainer approval and every applicable check is
   green. Verify the issue state after merge.
10. Reconcile the parent epic or native sub-issue relationship and the milestone.
11. Release from updated `main`, then close the milestone and clean branches.

`Refs #N` avoids a PR-body closing keyword; it does not guarantee the issue
stays open when GitHub has a connected development branch. After every merge,
immediately audit the linked issue state and body. If it is closed while any
in-scope acceptance criterion is unchecked, unmet, or unevaluated, reopen it
immediately and record the reason. For work that spans the PR merge, either use
this audit-and-reopen flow or track the PR-scoped work in a child issue and leave
the release-spanning parent unconnected. Every PR-scoped criterion still needs
evidence before merge.

## The real closure gate

For each criterion, record its exact text or identifier, the supporting diff,
test, CI run, document, screenshot, or reproduction, and a result of `Met`,
`Unmet`, or `Unevaluated`. Green CI proves only what those jobs exercised. A
merged PR, deadline, or completed implementation effort is not substitute
evidence.

If a criterion is removed or superseded, record the dated scope decision and
rationale on the issue. Do not check it as delivered. Create a linked follow-up
for deferred work. If GitHub closes an issue that still has an unmet or
unevaluated in-scope criterion, reopen it and restore `Refs` semantics.

## Large work

Split work that spans multiple PRs or sessions into independently closeable
sub-issues. Link them natively and keep a parent checklist with child and PR
numbers. Each child follows the same evidence gate. The parent stays open until
all children and its own completion contract pass.

## Special paths

- Security-sensitive work uses a private advisory and temporary private fix
  fork until coordinated disclosure is safe.
- A new repository may create only its minimum shell before its first issue.
- A Projects board is optional shared visualization, never workflow authority.
- A partial but useful PR may merge with `Refs #N`; the post-merge issue audit
  still applies.
