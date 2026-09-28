# Module 3b: Projects boards

**Audience:** Anyone who's completed Module 2b, or is already comfortable
with this team's basic workflow and wants to go deeper. Optional, and
independent of Modules 3a, 3c, 3d — read in any order.
**Format:** Self-paced — read and do each step yourself. Facilitator-note
callouts mark optional group activities.
**Timing:** ~20 min.

## Learning objectives

- Understand how a Projects board relates to issues (and when a team
  actually needs one).

## Projects boards

**Source:** `skills/github-projects/SKILL.md`

The one sentence worth repeating any time a Projects board comes up: **a
Projects board is a view over issues, never the source of truth.**
Everything that actually matters — labels, milestones, assignees — lives
on the issue itself; the board is a way of looking at that same
information, not a second place where facts live. If a fact only ever gets
recorded on the board and nowhere else, it's effectively invisible to
anyone reading the repo through the API or through `gh` — which, on this
team, is a real way people work.

When a board is and isn't worth creating — this is where teams most often
over-invest: don't create a board for a solo maintainer. It becomes
unmaintained overhead with genuinely nothing to show for the upkeep it
needs. The right moment to create one is when a second person actually
joins the work, or when work already spans multiple repositories — and in
that multi-repo case, the answer is one shared org-level board, not a
separate board per repository.

A specific failure mode worth naming directly: draft items — board entries
created only on the board, with no linked issue behind them — silently
violate issue-first. They look like real tracked work from the board's own
view, but they're invisible everywhere else in the repo. Every item that
lives on a board should be a real issue or PR first, added to the board
second.

## Exercise: inspect a real board (read-only)

This exercise assumes the sandbox repo has a Projects board already set
up by a facilitator, per `education/facilitator-guide.md`. If it doesn't,
substitute any Projects board you have read access to (including one on
this repo's own org, if it has one) — the inspection questions below don't
require write access.

1. Open the board and find one item on it that also has a visible issue
   number.
2. Open that item's linked issue directly (not through the board).
3. Compare: does the board's Priority field for that item match the
   issue's priority label? Does the board's status column match the
   issue's actual open/closed state?
4. Look for any items on the board with no linked issue number at all —
   these are draft items. If you find one, that's the failure mode named
   above, live.

> **Facilitator note (optional group activity):** if you're running this
> with a group and the sandbox board has none, deliberately create one
> throwaway draft item before the session so participants can find it
> during step 4 — seeing the failure mode rather than just reading about it
> lands harder.

## Self-check

- In one sentence, what is a Projects board, and what is it *not*?
- What are the two conditions under which creating a board is actually
  worth it?
- What's wrong with a "draft item" that has no linked issue?

Not confident on any of these? Re-read "Projects boards" above.

## Feedback

Something unclear, wrong, or worth improving in this module? Open a
Discussion in this repo (**Ideas** category). Concrete, actionable
feedback gets converted into a tracked issue, per this repo's own
issue-first convention — see `skills/github-issue-first/SKILL.md`'s
Discussions section.

---

Next: [Module 3c: Releases](module-3c-releases.md)
