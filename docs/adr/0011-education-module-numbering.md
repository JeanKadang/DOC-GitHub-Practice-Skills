# ADR 0011: `module-X-Y` numbering for education lessons, and `4_next-step`

## Status

Accepted (2026-09-30). Supersedes the `4_next-level/` folder name reserved in
ADR 0009. ADR 0007 and ADR 0009 otherwise stand.

## Context

Issue #161. After ADR 0009 numbered the education folders, the files inside
them still used three naming schemes: `session-N-...` in `0_prerequisites` and
`1_beginners`, `module-2a-...` in `2_intermediate`, and `module-3a-...` to
`module-3f-...` in `3_advanced`. A learner could not tell from a file name
which tier a lesson belonged to or where it sat in the order, and letters
versus numbers made the tiers look unrelated.

## Decision

- Every numbered lesson is named `module-<tier>-<n>-<name>.md`, where `<tier>`
  is the folder number and `<n>` counts lessons within it from 1. In prose the
  same lesson is "Module `<tier>.<n>`". So Session 0 is Module 0.1, Sessions 1
  and 2 are Modules 1.1 and 1.2, Modules 2a and 2b are Modules 2.1 and 2.2, and
  Modules 3a to 3f are Modules 3.1 to 3.6.
- In `0_prerequisites`, only the former Session 0 is renamed, to
  `module-0-1-what-is-version-control.md`. The LLM prerequisite and the local
  setup page are not numbered lessons and keep their names.
- The reserved tier is named `4_next-step/`, not `4_next-level/`. It is created
  now, with only `module-plan.md`, a plan of candidate modules written as
  issue-ready outlines. The plan states that nothing in it is built.
- No redirect stubs are left at the old paths. The rename is recorded as a
  breaking change in `education/CHANGELOG.md` with an old-to-new table, and it
  joins the planned `education-v2.0.0`.

## Consequences

- Bookmarks and external links to the old file names stop working. The
  changelog table is the migration guide.
- Files were moved with `git mv`, so history follows them. Every link in
  `education/` was updated, and a relative link and anchor scan reports none
  broken. Historical records (ADRs, changelog entries, planning documents)
  keep the names that were true when they were written.
- Open issues that cite the old names are still correct in substance; comments
  on them give the new names.
- New lessons slot in by number without renaming existing ones, because a tier
  simply gains the next `<n>`.
- Evidence: issue #161.
