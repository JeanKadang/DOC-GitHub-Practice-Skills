# Planning artifacts (historical)

These ten files are the plans and design specs written while the repository's
skills and training material were first built, in September 2026. They are kept
because the decision records cite them. They are **historical**: the code,
skills, and documents that shipped are the source of truth, and where a plan and
the shipped result differ, the shipped result wins. Do not follow a plan as if it
were current policy, and do not edit one to match later changes.

Two things in them can mislead a reader:

- Each plan opens with an instruction to an agent (a "REQUIRED SUB-SKILL" line).
  That was guidance for the session that built the feature, not an instruction
  for this repository.
- The directory name comes from the authoring tool used at the time. It stays,
  because ADR 0002 and ADR 0004 and `education/CHANGELOG.md` cite these files by
  path, and decision records are not edited after they are accepted.

For current policy read `AGENTS.md`, `docs/GUIDE.md`, `docs/WORKFLOW.md`,
`docs/MAINTAINING.md`, and the skills. For why a decision landed where it did,
read `docs/adr/`.

## Index

| Feature | Spec | Plan | What came of it |
| --- | --- | --- | --- |
| Roster from 8 to 10 skills | [spec](specs/2026-09-25-github-skills-roster-optimization-design.md) | [plan](plans/2026-09-25-github-skills-roster-optimization.md) | Split `github-hygiene` and added `github-contributing` and `github-releases`; see [ADR 0002](../adr/0002-split-hygiene-add-contributing-and-releases.md). |
| Colleague training program | [spec](specs/2026-09-26-colleague-training-program-design.md) | [plan](plans/2026-09-26-colleague-training-program.md) | The `education/` folder; see `education/CHANGELOG.md`. |
| Split release versioning | [spec](specs/2026-09-26-split-release-versioning-design.md) | [plan](plans/2026-09-26-split-release-versioning.md) | The separate `education-vX.Y.Z` release track; see "Two release tracks" in [docs/MAINTAINING.md](../MAINTAINING.md). |
| `github-repo-configure` | [spec](specs/2026-09-27-github-repo-configure-design.md) | [plan](plans/2026-09-27-github-repo-configure.md) | The eleventh skill; see [ADR 0004](../adr/0004-add-github-repo-configure.md). |
| Education v2 self-training | [spec](specs/2026-09-28-education-v2-self-training-design.md) | [plan](plans/2026-09-28-education-v2-self-training.md) | The self-paced education material; see `education/CHANGELOG.md`. |

## Checks

The plans and specs are left out of the Markdown lint, the link and snippet
checks, and the closure-wording scan, because they are long point-in-time
documents that quote earlier states (the roster plan, for one, still shows the
ten-skill roster). This index is linted, and `tests/superpowers-index.test.mjs`
fails if a file in `plans/` or `specs/` is missing from the table or a link in it
does not resolve. The public-content scan still covers every file here.
