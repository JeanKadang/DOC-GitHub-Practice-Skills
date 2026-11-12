# Decisions, brainstorming, and what does not belong in an issue

Companion to `github-issue-first` (SKILL.md). Read it before recording a decision, starting or converting a Discussion, or triaging a repository's Discussions.

Not every durable thought is an issue. Three different things get confused, and
putting them all in the tracker is what turns a backlog into noise.

| Thing | Home | Why |
|---|---|---|
| Committed work | **Issue** | Has an assignee, a priority, an end state |
| Open exploration | **Discussion** | Threaded, votable, no "when is this done" |
| A decision that was made | **ADR file in `docs/adr/`** | Immutable record, versioned with the code it constrains |
| A decision that must be made | **Issue labeled `decision-needed`** | It *is* actionable work: someone must decide |

## Architecture Decision Records

A single growing `decisions.md` is the anti-pattern — append-only, unreadable,
and edits silently rewrite a record that was supposed to be permanent. Use one
immutable file per decision:

```
docs/adr/0001-use-postgres-over-mongo.md
docs/adr/0014-move-session-store-to-redis.md
```

Each file: **Context / Decision / Consequences / Status** (`Proposed`, `Accepted`,
`Superseded by 0014`). **Never edit a decided ADR to reverse it** — write a new
one that supersedes it, and set the old one's status. The history of what you
believed and when is the point.

The GitHub lifecycle maps onto this cleanly:

1. Question arises → issue labeled `decision-needed` (it needs a human, not code)
2. Options explored → Discussion, or a draft ADR PR with `Status: Proposed`
3. **The PR that adds the ADR is the deliberation record** — review comments are
   the debate, preserved and linked, without any extra ceremony
4. Merged with `Status: Accepted`, PR body carries `Closes #<decision-needed>`
5. Reversed later → new ADR supersedes it; the old file is never touched

Why `docs/adr/` and not the GitHub Wiki: the Wiki is a separate repo with no PRs,
no review, and no coupling to the branch that changed the behaviour. An ADR in the
repo branches with the change that motivated it.

## Discussions (brainstorming and open-ended questions)

`brainstorm.md` in a repo has no threading, no voting, no answer-marking, and
every edit costs a PR. Use **Discussions** instead — enable it under
**Settings → General → Features** if the repo doesn't have it yet.

**Categories** (create the ones a repo actually needs, don't cargo-cult all of
them):

| Category | For | Typical shape |
|---|---|---|
| `Ideas` | An unshaped proposal, "what if we..." | Open-ended, may never converge — that's fine |
| `Q&A` | A question with one right answer | Gets an accepted answer, then closes itself |
| `RFC` | A proposal specific enough to have real trade-offs | Converges to a decision — accept, reject, or convert to a `decision-needed` issue |
| `Announcements` (maintainer-only posting) | Release notes, deprecations, policy changes | One-way; use sparingly, don't duplicate `CHANGELOG.md` |

**Triage cadence:** when you touch a repo's Discussions (same moment as an
issue triage pass, not a separate ritual), check for: a `Q&A` post with a
correct answer buried in replies that was never marked accepted (mark it —
that's what makes it findable later), an `RFC` that's converged but nobody
converted it, and an `Ideas` post that's been actionable for a while without
anyone noticing.

**Convert a discussion to an issue at the moment it becomes actionable** — that
conversion is the boundary between exploring and committing, and it is the whole
reason to keep them separate. Exploration that never converges stays a discussion
instead of rotting as a stale issue nobody can close. `gh discussion` is
preview/GraphQL-only with no built-in convert command, so do it explicitly:

1. File the issue normally (title, body, labels, assignee, milestone — the
   same as any other issue in this skill), with a line in the body linking
   back: `Converted from discussion #<N>.`
2. Comment on the discussion linking forward to the new issue (`Converted to
   #<N>.`) so anyone landing on the discussion later finds the live work.
3. Mark the discussion's status: an `RFC` that converged gets its accepted
   answer noted (or is closed, if the category supports it); don't just
   abandon it mid-thread once the issue exists.

Never let a discussion silently duplicate an issue that already tracks the
same work — link them together the moment you notice, the same way you'd
record a dependency between two issues (see below).

Coming from Azure DevOps or Jira, see `github-for-ado-users` for how these map to
what you had.
