# ADR 0003: Conditional Wiki, Discussions, and multi-repo Projects

## Status

Accepted (2026-09-27).

## Context

Issue #33 identified three related gaps in how the skill set treats
non-issue-tracker GitHub surfaces:

1. `github-repo-bootstrap`'s scaffolding matrix treated GitHub Wiki as
   categorically unwanted ("Never; keep versioned documentation in the
   repository"), with no distinction between a repo that has no Wiki (the
   common case this rule was written for) and a repo where a Wiki already
   exists and is actively used. The blanket rule made an AI agent following
   it liable to ignore or fight a team's existing, working documentation
   surface.
2. GitHub Discussions was covered only as a brief sub-topic inside
   `github-issue-first` (the "Brainstorming" aside) and `github-for-ado-users`,
   with no categories, triage cadence, or concrete conversion-to-issue steps
   — despite `github-issue-first` already stating the *principle* that
   exploration belongs in Discussions and committed work belongs in issues.
3. `github-projects` documented the multi-repo case as a single decision-table
   row ("One org-level board linked to each repo, not one board per repo")
   with no how-to: how to actually link more than one repository to an
   org-level board, or how to keep items from different repos disambiguated
   once they're all on one board.

## Decision

**Wiki:** conditioned, not reversed. `github-repo-bootstrap`'s scaffolding
matrix row changes from a blanket "Never" to: leave an already-established,
actively-used Wiki alone and treat its content as source of truth for what
it covers; never proactively enable a Wiki on a repo that doesn't already
have one in active use. The risk the original rule guarded against — an AI
agent enabling a second, unversioned, unreviewed documentation surface
nobody asked for — is unaffected for the common case (no existing Wiki,
still never enabled). It only stops applying where there was never a risk
to begin with: a Wiki that already exists and is already how a team works.

**Discussions:** expand in place, in `github-issue-first`, rather than a new
dedicated skill. The content is a natural extension of that skill's existing
"what does not belong in an issue" principle, not a separate workflow with
its own trigger. A new skill would add an 11th roster entry and its full
mechanical cascade (`contracts/skill-inventory.json`,
`scripts/validate-skills.mjs`, `scripts/install-skills.ps1`, `README.md`,
`docs/GUIDE.md`, `CLAUDE.md`'s roster enumeration, issue template dropdowns —
the same shape #35 already tracks for `github-for-gitlab-users`) for content
that has no independent trigger of its own; it only ever comes up in the
context of "is this issue-shaped or not," which is exactly what
`github-issue-first` already answers.

**Multi-repo Projects:** no policy change — the existing "one org-level
board" pattern is sufficient — but it needed the how-to it never had. Added
to `github-projects`: linking more than one repository to the same
org-level board (repeating the existing `gh project link` primitive once
per repo, which the skill already showed but never demonstrated for >1
repo), and a note that a cross-repo board needs its built-in `Repository`
field kept visible, since nothing else on a shared board disambiguates
which repo an item belongs to.

## Consequences

- `skills/github-repo-bootstrap/SKILL.md`: scaffolding-matrix Wiki row
  conditioned; one line added to the mistakes table distinguishing "leave
  an existing Wiki" from "still never enable a fresh one."
- `skills/github-issue-first/SKILL.md`: the "Brainstorming" subsection grows
  into substantive Discussions guidance (categories, triage, the
  conversion-to-issue workflow spelled out as concrete steps — `gh
  discussion` being GraphQL-only/preview, per the skill's existing caveat,
  means conversion is a manual create-issue-and-link-back, not a `gh`
  one-liner).
- `skills/github-projects/SKILL.md`: a new subsection under "Creating and
  wiring up a board" for the multi-repo case; no change to the decision
  table's existing recommendation.
- No roster change, no new skill, no manifest/inventory cascade — this ADR
  is documentation-only within three existing skill files.
- Evidence: issue #33.
