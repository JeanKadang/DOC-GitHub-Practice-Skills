# ADR 0012: Milestones are release-named for the skillset and programs for `education/`

## Status

Accepted (2026-10-01).

## Context

Issue #123. `docs/WORKFLOW.md` says this repository's milestones are
release-based, "not thematic buckets", and `skills/github-releases/SKILL.md`
says two schemes in one repository is worse than either. The live milestones
mixed both. Release-named: `v0.1.0`, `v0.1.1`, `v0.2.0`, `v0.3.0`. Thematic:
Skill Coverage Expansion, Colleague Training Program, Release Process
Improvements, Documentation & Hygiene, Education Program v2, and Education
Program v3. There was also no milestone for the next skillset release, even
though work for it was already merged.

The two kinds of milestone were doing different jobs. The release-named ones
track what ships in a tagged skillset release. The "Education Program" ones
tracked a body of lessons that is versioned and tagged separately
(`education-vX.Y.Z`, see `docs/MAINTAINING.md`) and has no release page, so a
release-named bucket does not fit it. The remaining thematic milestones
(Skill Coverage Expansion, Documentation & Hygiene) were buckets for skillset
work that had no release attached, and they collected open issues that never
moved into a release.

## Decision

- **Skillset work uses release-named milestones**, `vX.Y.Z`, matching the tag
  the work ships in. Every skillset issue gets one when it is filed.
- **A thematic milestone is allowed for skillset work only until a release
  scopes it.** A related batch that is not yet tied to a version may use a short
  thematic name (this is what `github-releases` already allows), and its open
  issues move to the `vX.Y.Z` milestone as soon as a release is planned. The
  thematic milestone is then closed. It is never a long-lived second scheme.
- **`education/` uses program milestones**, "Education Program vN", because that
  track is versioned and tagged on its own. A program milestone closes when the
  program's modules have shipped and the matching `education-vX.Y.Z` tag exists
  (or the program is superseded by the next one).
- Closed milestones are not renamed or deleted. They are history.

Applied on 2026-10-01: the eight open issues in "Skill Coverage Expansion" (one)
and "Documentation & Hygiene" (seven) were moved to `v0.4.0`, and both
milestones were closed. "Education Program v3" stays open as the current
education program. `v0.4.0` already existed for the next skillset release.

## Consequences

- A person filing an issue picks one of two schemes by what the issue touches,
  and the choice is always the same for the same kind of work.
- A reader can ask "what is in the next release?" and get the answer from one
  milestone, `gh issue list --milestone vX.Y.Z`.
- `docs/WORKFLOW.md` states the rule and points here. `skills/github-releases`
  already matches: release-named by default, a thematic name only until a
  release scopes the work, and it is generic, so it does not name this
  repository's education program.
- The release notes configuration excludes education-only pull requests (see
  `docs/MAINTAINING.md`), so the two tracks do not mix there either.
- Open milestones are expected to conform. A quick check is
  `gh api "repos/{owner}/{repo}/milestones?state=open" --jq '.[].title'`: every
  title is `vX.Y.Z` or `Education Program vN`.
