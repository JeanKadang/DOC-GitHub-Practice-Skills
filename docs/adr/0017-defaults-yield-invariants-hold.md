# ADR 0017: Skill defaults yield to a repository's conventions; invariants do not

## Status

Accepted (2026-11-12).

## Context

Issue #352. The skills are meant to be used on many repositories, not only this
one, but several of their defaults were written as if every repository worked
like this one, and no skill said whether a repository's own conventions or the
skill should win:

- `github-hygiene` prescribed `fix/…`, `feat/…` branch names, although the
  `gh issue develop` command the same skill prefers names branches
  `<N>-<title>`, and it prescribed conventional commits.
- `github-issue-first` always assigned `@me` and required a milestone on every
  issue, and it showed how to create P0 to P3 labels before saying to match an
  existing scheme.
- `github-releases` asked for a milestone to be created when none fitted.
- `Refs #N` then `Closes #N` was required in every repository the user
  maintains; only `github-contributing` deferred to a foreign repository's
  convention.

The pattern already existed for labels ("match what's already there"), but it
was not stated as a rule, so an agent in an unfamiliar repository could impose
this repository's habits on it.

The maintainer decided on 2026-11-12 (recorded on #352) that the spelling of
the closing keyword is a default, not an invariant: a repository whose own
convention is to put `Closes #N` in pull requests directly may keep it, while
the evidence requirement behind the closure gate stays an invariant.

## Decision

Every skill carries one precedence rule, in the same words: **a repository's
documented or observed conventions win over this skill's defaults; the
invariants below hold in every repository.** Conventions are read from
`CONTRIBUTING.md`, agent instruction files (`AGENTS.md`, `CLAUDE.md`,
`.github/copilot-instructions.md`), the pull request template and issue forms,
existing labels and milestones, and recent merged pull requests.

**Defaults (yield to the repository):**

- label scheme (priority and category labels, and whether to create any);
- branch names;
- commit message style;
- whether issues get milestones, and the milestone naming scheme;
- assignment (`@me` or the repository's own owner rule);
- the closing-keyword spelling in a pull request body (`Refs #N` first, then
  `Closes #N`, or the repository's own habit);
- pull request body layout beyond the evidence it must carry;
- merge method (already "use the repository's configured method").

**Invariants (hold everywhere):**

- no merge, release, tag, or destructive operation without the maintainer's
  explicit approval;
- an issue is closed as completed only when every in-scope acceptance
  criterion has recorded evidence; in a repository whose pull requests carry
  a closing keyword, that evidence is recorded **before** the merge;
- after every merge, audit the linked issue's state and body and reopen it if
  it closed with a criterion unmet (ADR 0001), whatever keyword was used;
- a security-sensitive finding never goes into a public issue, branch, or pull
  request (`github-security-response`);
- no secret or confidential content in public text;
- issue-first: a finding is recorded before it is acted on, in a repository
  where the user may file.

`github-issue-first` and `github-hygiene` read the repository's conventions
with a short probe before the first issue or branch in a repository, and
milestone attachment and `@me` assignment apply only when the repository uses
them.

## Consequences

- An agent can use the skills on a repository with different labels, branch
  names, milestones, or keyword habits without rewriting them, and still keeps
  the safety and evidence gates.
- This repository is unchanged: its own `CONTRIBUTING.md`, `docs/WORKFLOW.md`,
  `docs/GUIDE.md`, and `docs/MAINTAINING.md` keep `Refs #N` then `Closes #N`,
  P0 to P3 labels, and release-named milestones, because those are its
  conventions. ADR 0012 (this repository's milestone scheme) is not
  superseded.
- ADR 0001 is not superseded: its connected-branch audit-and-reopen decision
  is an invariant here. Only its `Refs`-first spelling becomes a default
  outside this repository.
- A repository with no conventions at all still gets the skills' defaults, so
  nothing becomes optional by omission.
- The cost is a probe before the first issue or branch in a repository, and a
  judgment call when observed conventions are inconsistent. When they are,
  the skill follows the documented one and says so.
