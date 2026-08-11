# Architecture decision records

This directory records decisions whose reasoning is worth keeping once the
issue or pull request that produced them has scrolled out of view — the kind
that get re-litigated later because the "why" only ever lived in chat or issue
history. `docs/GUIDE.md`, `docs/WORKFLOW.md`, and `docs/MAINTAINING.md` state
*current* policy; an ADR records *why* a specific past decision landed where
it did, evidence included.

## When to add one

Add an ADR when a policy or design choice was genuinely contested, when a
prior approach turned out to be wrong and got corrected, or when a future
contributor is likely to ask "why not just do X instead?" and the honest
answer requires context that a policy document alone won't carry. Routine
documentation clarifications and typo-level fixes do not need one.

## Format

- File name: `NNNN-short-kebab-title.md`, numbered sequentially, never
  renumbered or reused even if a decision is later superseded.
- Sections: **Status** (Accepted / Superseded by ADR-NNNN), **Context** (the
  situation and evidence that forced the decision), **Decision** (what was
  decided, stated plainly), **Consequences** (what this makes easier or
  harder, and what it rules out).
- ADRs are immutable once accepted. A changed decision gets a new ADR that
  supersedes the old one; do not edit history in place.

## Index

- [0001](0001-refs-closes-connected-branch-closure.md) — `Refs`/`Closes`
  closure semantics must account for GitHub's connected-branch auto-closure.
