# Split release/versioning: skillset vs. education — design

**Date:** 2026-09-26
**Status:** Proposed
**Tracks:** Issue #40 (milestone: Release Process Improvements)

## Problem

The skillset and the `education/` program currently share one implicit
version identity — the repo's `package.json`/`contracts/skill-inventory.json`
version and its `vX.Y.Z` git tags — even though the two have fundamentally
different consumption models. The skillset is an **installed package**
(`install-skills.ps1` copies it into `~/.claude`, `~/.codex`, `~/.copilot`,
gated by a version-matching guard). `education/` is **just read on GitHub** —
nothing installs it, nothing depends on its version number matching anything.
Bundling them means a doc-only change to `education/` has no independent
reference point ("this is what we used for the Q1 onboarding cohort")
without it riding inside the skillset's version history, where it doesn't
belong.

## Decision

Give `education/` its own lightweight, independent release track, additive
to the skillset's existing one — nothing about the skillset's versioning
changes.

### Tag convention

- **Skillset:** unchanged — bare `vX.Y.Z` tags (e.g. `v0.2.0`), driven by
  `package.json`/`contracts/skill-inventory.json`, full `.github/workflows/
  release.yml` pipeline, GitHub Release page with generated notes.
- **Education:** new `education-vX.Y.Z` tags (SemVer: major for a
  restructure — e.g. audience tiers or session count changing — minor for
  new content, patch for fixes/typos). No collision with the skillset's
  tags (different prefix).

### What an education release actually is

**A git tag only — no GitHub Release object, no artifacts.** There is
nothing to download or install, so a full Release page would be ceremony
with no content. The tag exists purely so a facilitator can say "this is
exactly what was used for this cohort" and link to that exact commit.

### CI

One new workflow, `.github/workflows/education-tag-check.yml`, triggered on
`push: tags: ['education-v*']`, running `npm run lint:markdown:education`
only. No release step, no `gh release create`, no artifacts. Purely a
sanity gate confirming the tagged commit's content is valid before anyone
cites it — matching this repo's existing evidence-based habits without
inventing new ceremony for a track that's deliberately lightweight.

### Changelog

**Separate `education/CHANGELOG.md`**, Keep-a-Changelog format matching the
root file's conventions, fully independent of `CHANGELOG.md`. Someone
reviewing skill changes never wades through session-content edits and vice
versa. First entry: `## [1.0.0]` documenting everything shipped across
issue #36 / PR #38 / PR #39 (the initial `education/` scaffolding plus the
final-review fixes that were stranded and landed separately).

### Documentation updates

- `docs/MAINTAINING.md` — new content under "Release hygiene" (or its own
  heading) documenting the two-track convention: which tags mean what,
  which changelog to update for which kind of change, and that they're cut
  independently with no coordination required between them.
- `README.md` — the "Release status" blurb currently only mentions the
  skillset (`v0.1.0 is published...`); add a parallel line noting the
  education track and its first tag once cut.

### First tag

Cut `education-v1.0.0` for the content already in `main` as the last step
of implementing this — by that point PR #39 (the stranded final-review
fixes, including the real Session 2 diagram bug fix) must already be
merged, since `education-v1.0.0` should represent working, review-clean
content, not the version with the known diagram bug still in it.

## Non-goals

- No change to the skillset's own version, tag scheme, `CHANGELOG.md`, or
  `.github/workflows/release.yml` — this is purely additive.
- No GitHub Release page, release notes generation, or downloadable
  artifact for education tags.
- No automated cross-linking between the two changelogs — they're
  independent by design; a reader who needs both reads both.
- No versioning scheme for individual session files below the whole-folder
  `education/` tag — a tag marks the state of the entire `education/`
  folder at that commit, not per-file versions.

## Dependency

This work depends on PR #39 (the final-review fixes stranded when PR #38
merged early, including the real Session 2 state-diagram bug) being merged
before `education-v1.0.0` is cut — `education/CHANGELOG.md`'s `[1.0.0]`
entry should describe the corrected, review-clean state of the content,
not the state with a known logic bug still present.

## Testing / validation

`npm run check` must pass throughout. The new
`education-tag-check.yml` workflow's actual trigger behavior should be
verified with a real test tag push during implementation (create a tag,
confirm the workflow fires and passes, so the mechanism is proven before
relying on it for the real `education-v1.0.0` tag).

## Process note

This repository's own `github-issue-first` workflow applies: issue #40 and
its linked branch `process/split-release-versioning` already exist. Refs
#40 in every commit until the closure gate passes.
