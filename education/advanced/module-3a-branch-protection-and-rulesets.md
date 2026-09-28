# Module 3a: Branch protection and rulesets

**Audience:** Anyone who's completed Module 2b, or is already comfortable
with this team's basic workflow and wants to go deeper. Optional, and
independent of Modules 3b-3d — read in any order.
**Format:** Self-paced — read and do each step yourself. Facilitator-note
callouts mark optional group activities.
**Timing:** ~25 min.

## Learning objectives

- Understand what branch protection/rulesets do and don't guarantee, and
  when they're even available.

**Source:** `skills/github-releases/SKILL.md` (Rulesets section)

What this diagram shows: whether branch protection is even available
depends on plan and visibility before it depends on anything you
configure — a common surprise on private repos.

```mermaid
flowchart TD
    A[Want branch protection?] --> B{Public repo?}
    B -- Yes --> D[Rulesets available]
    B -- No --> C{Private, on GitHub Pro/Team/Enterprise?}
    C -- Yes --> D
    C -- No --> E["Not available - CI still runs,<br/>but nothing enforces green-before-merge"]
    D --> F{Solo maintainer?}
    F -- Yes --> G[Require status checks only]
    F -- No --> H[Require status checks + at least 1 review]
```

Walk the decision tree top to bottom before touching any settings, because
this is the surprise that catches people who've configured branch
protection somewhere else before: **availability depends on plan and
visibility first, and on your own choices second.** A ruleset (or classic
branch protection) can require CI to be green and require review before
merge — but only on repos where the feature is actually available in the
first place. A private repo on the free plan simply doesn't have this
option, no matter how it's configured; CI still runs and still reports
results, but nothing in GitHub itself enforces green-before-merge.

Once availability is confirmed, walk the second branch of the tree: solo
maintainer versus more than one. On a solo-maintained repo, requiring your
own review before you can merge your own PR locks you out of your own
repository — unless you add yourself as a bypass actor, which quietly
makes the review requirement advisory rather than real. The right call for
a solo maintainer is to require the status checks and skip the review
requirement entirely, adding it back only once a second maintainer
actually exists to do the reviewing.

A specific tooling gotcha worth knowing by name: `gh ruleset list` can
print nothing back both when nothing is configured *and* when the repo's
plan doesn't support rulesets at all — the empty output looks identical
either way. Always confirm via the API directly rather than trusting the
CLI listing's silence.

## Exercise: inspect real rulesets (read-only)

This exercise is deliberately read-only — rulesets are admin-level
settings, and a shared sandbox shouldn't have every self-paced learner
creating or editing them simultaneously.

1. Check whether the sandbox repo has any rulesets configured:

   ```bash
   gh ruleset list --repo <org>/<sandbox-repo>
   ```

   If that comes back empty, don't assume "none configured" — check the
   API directly to distinguish "none" from "unavailable on this plan":

   ```bash
   gh api repos/<org>/<sandbox-repo>/rulesets
   ```

2. If the sandbox has no rulesets (or you don't have admin access to it),
   use this repo's own public ruleset instead — it's called "Protect
   main" and is visible to anyone:

   ```bash
   gh ruleset list --repo <this-repo-org>/<this-repo-name>
   gh ruleset view <id> --repo <this-repo-org>/<this-repo-name>
   gh ruleset check main --repo <this-repo-org>/<this-repo-name>
   ```

3. Read the output of `gh ruleset view` and identify: is review required?
   Is a status check required? Is force-push blocked? Match what you see
   against the decision tree above — can you tell from the settings alone
   whether this repo is solo-maintained or not?

> **Facilitator note (optional group activity):** as a group, look at two
> or three different real repos' rulesets (this repo's own, plus any
> others people in the room maintain) and compare. It's a fast way to make
> "availability depends on plan" concrete instead of abstract.

## Self-check

- Why might `gh ruleset list` return nothing on a repo that actually wants
  branch protection?
- What's the difference in what you'd configure for a solo-maintained repo
  versus a multi-maintainer one?
- On a private, free-plan repo, what still happens to CI even though
  nothing enforces green-before-merge?

Not confident on any of these? Re-read the decision-tree walkthrough above.

## Feedback

Something unclear, wrong, or worth improving in this module? Open a
Discussion in this repo (**Ideas** category). Concrete, actionable
feedback gets converted into a tracked issue, per this repo's own
issue-first convention — see `skills/github-issue-first/SKILL.md`'s
Discussions section.

---

Next: [Module 3b: Projects boards](module-3b-projects-boards.md)
