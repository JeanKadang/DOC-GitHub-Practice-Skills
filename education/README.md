# Colleague GitHub Training Program

This is training material **for people** — colleagues learning how to use
GitHub and how this team specifically works. It's a different surface from
`skills/*/SKILL.md`, which teaches an AI coding agent the same workflow.
Where this program describes a policy the skills already state precisely
(the closure gate, issue-first, branch conventions), it points at the
relevant skill file by name rather than restating it, so the two can't
silently drift apart.

**Two tracks (per ADR 0007):** everything below this point is the
**GitHub track** (version control and this team's workflow). A second
**LLM track** (using AI coding assistants day to day) is starting to take
shape — its first page is
[LLM Track — Pre-requisite: What Is an LLM Assistant?](llm/prerequisite-what-is-an-llm-assistant.md).
More LLM-track content lands here as it's written; this section will grow
into full routing once there's enough of it to route between.

## Where do I start?

What this shows: how your existing background routes you to the right
starting point — nobody needs to sit through material for a background
they don't have.

```mermaid
flowchart TD
    Start[Your git/GitHub background?] --> Q1{Never used version control,<br/>or want the vocabulary lined up first?}
    Q1 -- Yes --> S0[Start at Session 0: What Is Version Control?]
    Q1 -- No --> Q2{Coming from GitLab or Azure DevOps, not GitHub?}
    Q2 -- Yes --> Pre[Read the mapping skill first:<br/>github-for-ado-users or<br/>github-for-gitlab-users]
    Q2 -- No --> M2a[Start at Module 2a: Issue-first and the closure gate]
    Pre --> M2a
    S0 --> S1[Session 1: Getting Started]
    S1 --> Q3{Want the command line,<br/>not just the web UI?}
    Q3 -- Yes --> Q4{Git and VS Code<br/>already installed?}
    Q3 -- No --> M2a
    Q4 -- No --> Extra[Extra: Setup Local Dev Environment]
    Q4 -- Yes --> S2[Session 2: Local Git Basics]
    Extra --> S2
    S2 --> M2a
    M2a --> M2b[Module 2b: PR review and branch conventions]
    M2b --> M3[Modules 3a-3e: pick any, in any order - all optional]
```

| Background | Start here |
| --- | --- |
| Never used version control | [Session 0: What Is Version Control?](beginners/session-0-what-is-version-control.md), then [Session 1: Getting Started](beginners/session-1-getting-started.md) |
| Comfortable in the GitHub web UI, ready for the command line, Git/VS Code already installed | [Session 2: Local Git Basics](beginners/session-2-local-git-basics.md) |
| Ready for the command line but no Git or VS Code installed yet | [Extra: Setting Up Your Local Dev Environment](extra/setup-local-dev-environment.md), then [Session 2](beginners/session-2-local-git-basics.md) |
| Some git knowledge, new to this team's process | [Module 2a: Issue-first and the closure gate](intermediate/module-2a-issue-first-and-closure-gate.md) |
| Already know GitLab or Azure DevOps, not GitHub | [Session 0](beginners/session-0-what-is-version-control.md)'s GitLab/ADO comparison table for a quick orientation, then `skills/github-for-ado-users/SKILL.md` (Azure DevOps) or `skills/github-for-gitlab-users/SKILL.md` (GitLab) for full depth, then [Module 2a](intermediate/module-2a-issue-first-and-closure-gate.md) |

Planning to work from the command line at all? Do [Session 2: Local Git
Basics](beginners/session-2-local-git-basics.md) before Module 2a — it
covers staging, conflicts, and undoing a mistake, none of which the web-UI
path in Session 1 touches.

Modules 2a and 2b build on each other — do 2a first. Modules 3a-3e are
each independent and optional; read any subset, in any order, based on
what's relevant to you. Each module is sized to fit a single sitting
(15-40 minutes) rather than blocking out a full session.

This program is primarily self-paced: work through it solo, at your own
pace, with the modules above as your only guide. A facilitator-led session
is still fully supported — modules mark optional group activities inline,
so either mode works from the same files. Session 2 and Modules 2a, 2b, 3a and 3b
include hands-on steps in a shared **sandbox practice repo** (a throwaway
repo set up for exactly this purpose, never a real project). Ask your
team's facilitator or onboarding buddy for access to it before you start
one of those modules — `education/facilitator-guide.md` has their setup
checklist if you're the one setting it up.

## What's covered

What this shows: the topic areas across all seven modules, at a glance, so
you can judge which Module 3 topics are relevant to you without reading
their full content.

```mermaid
mindmap
  root((Colleague Training))
    Session 0: What Is Version Control?
      Git vs GitHub
      Core vocabulary
      GitHub vs GitLab vs ADO
    Session 1: Getting Started
      What is a commit
      Branches
      Pull Requests
      Code review basics
    Session 2: Local Git Basics
      Working tree vs staging vs commit
      Clone, push, pull
      Resolving a merge conflict
      Undo: restore, revert, reset
    Module 2a: Issue-first and closure gate
      Issue-first
      Refs and Closes
      Acceptance criteria
    Module 2b: PR review and branch conventions
      PR review etiquette
      Branch conventions
      Milestones
    Module 3a: Branch protection and rulesets
    Module 3b: Projects boards
    Module 3c: Releases
    Module 3d: Security response basics
    Module 3e: Actions, runners, and the Copilot coding agent
      Workflows and .github/workflows
      Hosted vs self-hosted runners
      Copilot coding agent - same review gate
    Extra: Setup Local Dev Environment
      Install Git
      Install VS Code
      Connect to GitHub Enterprise
      Recommended extensions
```

## Materials

- [Session 0: What Is Version Control?](beginners/session-0-what-is-version-control.md) — ~15 min, reading only, plain-terms vocabulary plus a GitHub/GitLab/ADO comparison.
- [Session 1: Getting Started](beginners/session-1-getting-started.md) — ~60 min, hands-on, no prior experience needed.
- [Session 2: Local Git Basics](beginners/session-2-local-git-basics.md) — ~45 min, hands-on command-line git — staging, conflicts, and undoing a mistake.
- [Module 2a: Issue-first and the closure gate](intermediate/module-2a-issue-first-and-closure-gate.md) — ~40 min, this team's core workflow habit.
- [Module 2b: PR review and branch conventions](intermediate/module-2b-pr-review-and-branch-conventions.md) — ~35 min, review etiquette and branch/milestone conventions.
- [Module 3a: Branch protection and rulesets](advanced/module-3a-branch-protection-and-rulesets.md) — ~25 min, optional.
- [Module 3b: Projects boards](advanced/module-3b-projects-boards.md) — ~20 min, optional.
- [Module 3c: Releases](advanced/module-3c-releases.md) — ~25 min, optional.
- [Module 3d: Security response basics](advanced/module-3d-security-response.md) — ~15 min, optional.
- [Module 3e: Actions, runners, and the Copilot coding agent](advanced/module-3e-actions-runners-and-agents.md) — ~15-20 min, optional.
- [Extra: Setting Up Your Local Dev Environment](extra/setup-local-dev-environment.md) — ~30 min, mostly install time. Installing Git and VS Code, connecting to GitHub Enterprise, recommended extensions. Optional — only needed if you don't already have these.
- [LLM Track — Pre-requisite: What Is an LLM Assistant?](llm/prerequisite-what-is-an-llm-assistant.md) — ~15 min, reading only. Core vocabulary, the agentic-behavior surprise, and the confidently-wrong caveat. First page of the LLM track (ADR 0007); more to come.
- [Cheat sheet](cheat-sheet.md) — one page, take it with you.
- [Facilitator guide](facilitator-guide.md) — for the superuser running a session, not attendees.
