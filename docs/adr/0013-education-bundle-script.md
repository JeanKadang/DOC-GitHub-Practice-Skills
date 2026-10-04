# ADR 0013: The education bundle is built by a Node script

## Status

Accepted (2026-10-04). Implements ADR 0008, which decided to bundle, not
duplicate, and left the mechanism open.

## Context

ADR 0008 named two candidates: a new `install-skills.ps1` export target, or a
standalone script. Issue #146 listed a third, a documented full checkout. The
education pages link to files outside `education/` and name skill files by path,
so a copy of `education/` alone breaks (a moved copy's links point at nothing).

## Decision

- A standalone Node script, `scripts/package-education.mjs`, builds the bundle.
  It is not an installer target: an education bundle is read, not installed into
  a platform directory, and a Node script can be tested in `npm test` on every
  platform without PowerShell.
- Dependencies are derived, never listed by hand: every file under `education/`;
  every relative link in those pages that resolves outside `education/`, and the
  files those files link to; every skill named by a `skills/<name>/` path, with
  the files its entry in `contracts/skill-inventory.json` lists; and the
  repository LICENSE. A link to a missing file, or a mention of a skill that is
  not in the inventory, stops the build.
- Files keep their relative positions, so links resolve without rewriting any
  page and without copying policy text into education prose (ADR 0008).
- The bundle carries `BUNDLE.json` with the skillset version, the latest released
  education version and whether unreleased changes exist, the licence file and
  its first line, the source commit and whether the tree was dirty, the skills
  referenced, and a SHA-256 for every file. After writing, the script checks that
  every relative link in the bundle resolves to a bundled file.
- It writes only into an empty folder or one that holds a previous bundle's
  `BUNDLE.json`; a rebuild removes only files that manifest lists, and never
  outside the folder.

## Consequences

- A bundle is a point-in-time export. Rebuild it after any change; do not edit
  it. The education tag convention (`education-vX.Y.Z`) is unchanged, and the
  manifest records which version a bundle was cut from.
- References that are only written in prose (for example "see
  `docs/MAINTAINING.md`" in backticks) are not followed. Only links and
  `skills/<name>/` paths are, so a prose-only reference to another file will not
  travel. Make it a link if it must.
- The closure through links pulls in the supporting documents the pages point
  at (for example the platform guides and the root README), so a bundle is
  larger than `education/` plus nine skills.
- `tests/package-education.test.mjs` covers derivation, seeded faults, rebuilds,
  and the real repository.
- Evidence: issue #146.
