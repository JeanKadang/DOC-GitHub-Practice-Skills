# Pilot Kit

This file is for whoever **runs** the learner pilot (issue #232), not for
learners. It sits next to the [facilitator guide](facilitator-guide.md) and,
like it, is outside the numbered reading order.

The pilot answers one question: can a real learner work through the self-paced
path alone, in about the time the modules say? It does not improve the modules.
Observe first, record, and file what you find; change nothing until the pilot is
over.

## What the pilot has to show

These are the acceptance criteria of #232, so each result you record maps to one:

1. A learner new to version control completes the beginner route unaided, and
   what blocked them, if anything, is recorded.
2. An experienced migrant completes the route the README gives them, unaided,
   and what blocked them, if anything, is recorded.
3. Each module's stated time is compared with the real time, and any estimate
   that is off by more than a quarter is corrected.
4. Every problem found is filed as its own issue.

## Before the pilot

- **Two learners, at least.** One who is new to version control, and one who
  already knows Git or another platform (GitLab, Azure DevOps or Jira). Record
  them by role only ("new to version control", "migrant from GitLab"). Never
  write a name, an email address or a company in the record, here or in an issue.
- **Tell them what this is.** You are testing the material, not them. They may
  stop at any time, and you will not help except as set out under "Unaided".
- **Sandbox ready.** Follow the [facilitator guide](facilitator-guide.md): a
  private shared practice repository with `CONTRIBUTORS.md`, plus the
  labels and milestone that Module 2.1 needs (it is on both routes). Do not
  rewrite `main` between Modules 1.1 and 1.4: Modules 1.3 and 1.4 use the issue
  and pull request each learner made in 1.1. Check each learner can reach the
  sandbox before the clock starts.
- **Ask which branch they take.** The README asks every learner, after Module
  1.4, whether they want the command line. Ask before the pilot and write the
  answer down; it decides whether the route goes straight to Module 2.1 (web UI)
  or through Modules 1.2 and 1.5 to 1.7 first (command line).
- **Accounts and installs.** A GitHub account for each learner. On the
  command-line branch, also ask whether they already have Git and VS Code, and
  whether their team uses IntelliJ IDEA; that decides whether Modules 0.7, 0.8
  or 0.11 belong on their route (see "Conditional setup pages"). Modules 1.6
  and 1.7 expect GitHub Copilot Chat; a learner without it follows the module's
  own fallback, and you note that.
- **Plan the sessions.** The full routes run from about three and a half to
  over six hours of stated time (see the totals under each route). Split them
  across sessions at a module boundary, and pause the clock between sessions.
- **A copy of the sheets below** for each learner, and a clock you both can see.

## The two routes

Both routes follow the README's "Where do I start?" flowchart module by module,
and both stop at Module 2.1. Times are the stated ones from each module's
header.

The flowchart forks once, after Module 1.4. A learner who wants only the web UI
goes straight to Module 2.1; a learner who wants the command line does Module
1.2 and Modules 1.5 to 1.7 first. Record which branch each learner took.

### Route A: new to version control

| Order | Module | Stated time | Branch |
| --- | --- | --- | --- |
| 1 | 0.1 What Is Version Control? | 5 min | both |
| 2 | 0.2 What Is Git? | 5 min | both |
| 3 | 0.3 What Is GitHub? | 15 min | both |
| 4 | 0.5 What kinds of tools are these? | 8 min | both |
| 5 | 0.6 What Is an LLM Assistant? | 25 min | both |
| 6 | 1.1 Getting Started | 60 min | both |
| 7 | 1.3 Markdown for issues and pull requests | 20 min | both |
| 8 | 1.4 Finding your way around a repository | 25 min | both |
| 9 | Conditional setup pages, if needed | see below | command line |
| 10 | 1.2 Local Git Basics | 45 min | command line |
| 11 | 1.5 What never goes in a repository | 20 min | command line |
| 12 | 1.6 Skills, instruction files, and MCP servers | 30 min | command line |
| 13 | 1.7 Working with an AI assistant day to day | 35 min | command line |
| 14 | 2.1 Issue-first and the closure gate | 50 min | both |

**Totals (stated):** 118 min to the end of Module 1.1; 213 min for the web-UI
branch through Module 2.1; 343 min for the command-line branch, plus 40 min if
Modules 0.7 and 0.8 are needed.

**Where #232 is met:** its criterion 1 names Modules 0.1 to 1.1, and 1.2 for a
learner who wants the command line. Record whether the learner reached the end
of Module 1.1 (and 1.2, on the command-line branch) unaided, even if the
session ends there. The rest of the route is the README path to Module 2.1, so
those modules' times get real data too.

### Route B: experienced migrant

Choose the conditional page that matches the learner's background: Module 0.4
(GitLab), 0.9 (Azure DevOps) or 0.10 (Jira). The mapping skill is
`skills/github-for-gitlab-users/SKILL.md` for GitLab, and
`skills/github-for-ado-users/SKILL.md` for Azure DevOps and for Jira (its
"Coming from Jira" section).

| Order | Module | Stated time | Branch |
| --- | --- | --- | --- |
| 1 | 0.3 What Is GitHub? | 15 min | both |
| 2 | One of 0.4 Coming from GitLab (10), 0.9 Coming from Azure DevOps (12), 0.10 Coming from Jira (12) | 10 or 12 min | both |
| 3 | The mapping skill for that background | no stated time (record it) | both |
| 4 | 0.5 What kinds of tools are these? | 8 min | both |
| 5 | 0.6 What Is an LLM Assistant? | 25 min | both |
| 6 | 1.1 Getting Started | 60 min | both |
| 7 | 1.3 Markdown for issues and pull requests | 20 min | both |
| 8 | 1.4 Finding your way around a repository | 25 min | both |
| 9 | Conditional setup pages, if needed | see below | command line |
| 10 | 1.2 Local Git Basics | 45 min | command line |
| 11 | 1.5 What never goes in a repository | 20 min | command line |
| 12 | 1.6 Skills, instruction files, and MCP servers | 30 min | command line |
| 13 | 1.7 Working with an AI assistant day to day | 35 min | command line |
| 14 | 2.1 Issue-first and the closure gate | 50 min | both |

**Totals (stated, without the mapping skill):** 118 or 120 min to the end of
Module 1.1; 213 or 215 min for the web-UI branch through Module 2.1; 343 or 345
min for the command-line branch, plus 40 min if Modules 0.7 and 0.8 are needed.

**Where the route stops:** Module 2.1, which is also the README's entry for
"some git knowledge, new to this team's process", so the migrant meets the
issue-first and closure-gate habits. #232 criterion 2 asks for the path the
README routes them to, so a route that stops early does not meet it: record
where the learner stopped and why.

### Conditional setup pages

On the command-line branch, Modules 0.7 (15 min) and 0.8 (25 min) come before
Module 1.2 only if Git or VS Code is missing, or Git has no name and email set.
A learner whose team works in IntelliJ IDEA does the Git steps of Module 0.8
and then Module 0.11 (20 min) instead, as the README says. The answers you
wrote down before the pilot decide which apply; record "not done" and why for
any the learner skips, and mark them "conditional" on the sheet.

## Unaided

A module is completed **unaided** when the learner finishes its success state
(the exercise's "Success state", or for reading-only modules, the self-check)
without help from you.

- Sit back. Do not explain, point, or finish a step for them. Answering "what
  do you see?" with a question is allowed.
- If they have been stuck for **5 minutes** with no progress, you may give one
  hint. If they are still stuck after the hint, tell them the answer and move
  on.
- Every time you step in, write it down as a **blocker** (see the sheet): the
  module and step, what they were trying to do, what was in the way, and
  whether you hinted or told them. A module where you stepped in is **assisted**,
  not unaided.
- Time spent on things outside the module (a company sign-in that is down, a
  password reset, a licence request) is recorded as a blocker and **paused**,
  not counted in the module's time.

## Time and observation sheet

One copy per learner. Start the clock when they begin reading or working, stop
it when they reach the module's success state or self-check, and pause for
breaks. When a module has both reading and an exercise, write the split in the
note column.

The bounds are the stated time plus and minus 25 percent, given as the whole
minutes that fall inside that range. Record the real time in whole minutes. An
actual time **outside the range shown** is off by more than a quarter and,
after the pilot, counts toward a correction (see "After the pilot"). Rows are
in route order.

| Module | Stated | Within bounds if between | Start | Stop | Paused | Actual | Unaided? | Blocker or note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.1 | 5 | 4 and 6 | | | | | | |
| 0.2 | 5 | 4 and 6 | | | | | | |
| 0.3 | 15 | 12 and 18 | | | | | | |
| 0.4 | 10 | 8 and 12 | | | | | | |
| 0.9 | 12 | 9 and 15 | | | | | | |
| 0.10 | 12 | 9 and 15 | | | | | | |
| Mapping skill | none | none | | | | | | |
| 0.5 | 8 | 6 and 10 | | | | | | |
| 0.6 | 25 | 19 and 31 | | | | | | |
| 1.1 | 60 | 45 and 75 | | | | | | |
| 1.3 | 20 | 15 and 25 | | | | | | |
| 1.4 | 25 | 19 and 31 | | | | | | |
| 0.7 (conditional) | 15 | 12 and 18 | | | | | | |
| 0.8 (conditional) | 25 | 19 and 31 | | | | | | |
| 0.11 (conditional) | 20 | 15 and 25 | | | | | | |
| 1.2 | 45 | 34 and 56 | | | | | | |
| 1.5 | 20 | 15 and 25 | | | | | | |
| 1.6 | 30 | 23 and 37 | | | | | | |
| 1.7 | 35 | 27 and 43 | | | | | | |
| 2.1 | 50 | 38 and 62 | | | | | | |

Delete the rows that are not on that learner's route.

After each module ask the learner two questions and write the answers
down in their words: **"Was anything unclear?"** and **"Did you know what to do
next?"** Do not argue with the answers.

## Recording results

Record by role, in one comment on #232 per learner, using this shape:

```markdown
**Learner role:** new to version control | migrant from GitLab | migrant from Azure DevOps | migrant from Jira
**Route:** A | B, web-UI or command-line branch, conditional modules done
**Date and total time:**

| Module | Stated | Actual | Unaided? | Blocker (module, step, what) |
| --- | --- | --- | --- | --- |

**Finished the route unaided?** yes | no, stopped at module X because Y
**Issues filed for problems found:** #...
```

Do not paste screenshots of anything private, names, emails or company details.
A sandbox screenshot is fine only if it shows nothing personal.

## Findings

Each concrete problem becomes **its own issue**, filed with the normal issue
template, labelled `documentation` and `education`, in the Education Program
milestone that fits. Say which module and step, what the learner did, and what
they expected. Link the issue from the #232 comment. Do not fold findings into
the pilot issue (#232) and do not edit modules during the pilot.

## After the pilot

1. For each module, take the median of the actual times from every learner who
   did it (with two learners, their average). **A stated time is off, and gets
   corrected, when that median is outside the bounds**; this is how #232
   criterion 3's "off by more than a quarter" is applied. Set the new stated
   time to the median, rounded to the nearest 5 minutes (nearest minute under
   10 minutes), and say in the change how many learners it is based on. A time
   from one learner is a weak basis: say so in the change rather than holding
   the correction back.
2. Tick the #232 criteria one by one and attach the evidence (the comments
   above). Close #232 only when every criterion has recorded evidence. A route
   that was not finished stays open: say which one.
3. Corrected timings go in a normal issue-first pull request that starts with
   `Refs #N`.

## Limits of this kit

A pilot with two learners shows what blocked those two. It does not show that
the material works for everyone, and the timings come from the first people to
try the modules.

## Feedback

Something unclear, wrong, or worth improving in this kit? Open a Discussion in
this repo (**Ideas** category). Concrete, actionable feedback gets converted
into a tracked issue, per this repo's own issue-first convention.
