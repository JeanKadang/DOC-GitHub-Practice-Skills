# ADR 0008: Make `education/` portable by bundling, not duplicating

## Status

Accepted (2026-09-30).

## Context

Issue #100 raised a real gap: `education/` teaches this team's GitHub
workflow, but colleague training material is inherently something people
want to move between repos or hand to other teams, and today it can't
stand fully on its own. A grep found 34 references to
`skills/github-*/SKILL.md` across 15 of `education/`'s 16 files. Most are
"soft" — the module teaches the concept itself and names the skill file
only as the authoritative version if it ever drifts (Module 2a: "this
module is the taught version, not the source of truth"). A few are
"hard" — Session 0's ADO/GitLab comparison table and the cheat sheet
explicitly defer to `skills/X/SKILL.md` for full depth, genuinely
incomplete without that file physically present.

This coupling is not an oversight. `CLAUDE.md` and `education/README.md`
both document it as deliberate: pointing at the relevant skill file by
name rather than restating its content is what stops the two surfaces
(agent-facing policy and human-facing training) from silently drifting
apart, the same failure mode `CLAUDE.md`'s "precision and internal
consistency" framing exists to prevent generally. Solving portability by
inlining policy prose into `education/` would reintroduce exactly that
drift risk — now two places state the same rule, editable independently,
with nothing to catch them disagreeing.

## Decision

- **Bundle, don't duplicate.** A portable/distributed copy of
  `education/` ships together with copies of the specific `SKILL.md` files
  its content actually references — not a rewrite of that content into
  education prose.
- This reuses a mechanism this repo already has proven: ADR 0006's
  ChatGPT export target (`install-skills.ps1 -Target ChatGPT`) already
  solves the adjacent problem — "this consumer has no access to the
  `skills/` folder as a filesystem directory, but needs the policy content
  anyway" — by flattening skill files into a portable, non-installed file
  set. The same flattening idea applies here: a bundle contains
  `education/`'s files plus only the skill files actually referenced from
  within it (currently: `github-issue-first`, `github-hygiene`,
  `github-releases`, `github-pr-review`, `github-projects`,
  `github-security-response`, `github-repo-review`,
  `github-for-ado-users`, `github-for-gitlab-users` — a subset of the
  twelve, determined by what's actually linked, not a blanket copy).
- The canonical source of truth stays `skills/<name>/SKILL.md` in this
  repo. A bundle is a point-in-time export, the same way the ChatGPT
  export is — it goes stale if skill content changes after the bundle was
  made, and re-bundling (not hand-editing the export) is how it's kept
  current, mirroring `docs/chatgpt.md`'s "re-export after any skill
  content change" guidance.

## Consequences

- **Implementation is a separate follow-up**, not built as part of this
  ADR — likely a new `install-skills.ps1` export target or a standalone
  script, scoped in its own issue once someone picks it up. This ADR
  settles the *approach* (bundle vs. duplicate), not the mechanism's exact
  shape.
- Whatever is built needs to determine which skill files a given
  education file references (a grep-based scan of `skills/github-*` names
  mentioned in `education/**/*.md`, most likely) rather than hardcoding
  the list above — that list will drift as education content grows,
  exactly the kind of drift this repo's own tests
  (`tests/roster-consistency.test.mjs`) already guard against elsewhere.
- `education/README.md`'s existing "points at the relevant skill file by
  name" framing gets a short addendum noting that a *portable* copy
  bundles those files rather than requiring the full repo — done in this
  PR since it's a one-line clarification, not new mechanism.
- Evidence: issue #100, repo owner discussion 2026-09-30, branch
  `docs/100-education-portability-adr`.
