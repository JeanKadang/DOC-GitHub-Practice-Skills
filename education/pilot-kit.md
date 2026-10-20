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
  private shared practice repository with `CONTRIBUTORS.md`, and for the
  migrant route the labels and milestone that Module 2.1 needs. Check each
  learner can reach it before the clock starts.
- **Accounts and installs.** A GitHub account for each learner. Whether they
  already have Git and VS Code decides if Modules 0.7 and 0.8 belong on their
  route (see below); ask first and write the answer down.
- **A copy of the sheets below** for each learner, and a clock you both can see.

## The two routes

The module lists are explicit, because "Modules 0.1 to 1.1" predates the
conditional pages. Times are the stated ones from each module's header.

### Route A: new to version control

Modules 0.5 and 0.6 are required for everyone before Module 1.1, so they are on
the route.

| Order | Module | Stated time |
| --- | --- | --- |
| 1 | 0.1 What Is Version Control? | 5 min |
| 2 | 0.2 What Is Git? | 5 min |
| 3 | 0.3 What Is GitHub? | 15 min |
| 4 | 0.5 What kinds of tools are these? | 8 min |
| 5 | 0.6 What Is an LLM Assistant? | 25 min |
| 6 | 1.1 Getting Started | 60 min |

Optional, only if the learner wants the command line: Modules 0.7 and 0.8 (15
and 25 min) when Git or VS Code is missing, then Module 1.2 (45 min). Time them
the same way and mark them "optional" on the sheet.

### Route B: experienced migrant

Choose the conditional page that matches the learner's background: Module 0.4
(GitLab), 0.9 (Azure DevOps) or 0.10 (Jira). Follow the README's "Where do I
start?" order.

| Order | Module | Stated time |
| --- | --- | --- |
| 1 | 0.3 What Is GitHub? | 15 min |
| 2 | One of 0.4 Coming from GitLab (10), 0.9 Coming from Azure DevOps (12), 0.10 Coming from Jira (12) | 10 or 12 min |
| 3 | The mapping skill: `skills/github-for-gitlab-users/SKILL.md` or `skills/github-for-ado-users/SKILL.md` | no stated time (record it) |
| 4 | 0.5 What kinds of tools are these? | 8 min |
| 5 | 0.6 What Is an LLM Assistant? | 25 min |
| 6 | 1.1 Getting Started | 60 min |

**Where the route stops:** the README does not say. The kit stops after Module
1.1, the point where the flow chart sends every route. Module 2.1 (50 min) is
optional for a learner who still has energy; mark it "optional" on the sheet.
Jira has no mapping skill, so a Jira learner skips step 3 and you note that.

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
breaks. Write reading and exercise time separately when the module has both.

The bounds are the stated time plus and minus 25 percent. An actual time **outside
the bounds** is off by more than a quarter and, after the pilot, counts toward a
correction (see "After the pilot").

| Module | Stated | Within bounds if between | Start | Stop | Paused | Actual | Unaided? | Blocker or note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.1 | 5 | 3.75 and 6.25 | | | | | | |
| 0.2 | 5 | 3.75 and 6.25 | | | | | | |
| 0.3 | 15 | 11.25 and 18.75 | | | | | | |
| 0.4 | 10 | 7.5 and 12.5 | | | | | | |
| 0.9 | 12 | 9 and 15 | | | | | | |
| 0.10 | 12 | 9 and 15 | | | | | | |
| 0.5 | 8 | 6 and 10 | | | | | | |
| 0.6 | 25 | 18.75 and 31.25 | | | | | | |
| 0.7 (optional) | 15 | 11.25 and 18.75 | | | | | | |
| 0.8 (optional) | 25 | 18.75 and 31.25 | | | | | | |
| 1.1 | 60 | 45 and 75 | | | | | | |
| 1.2 (optional) | 45 | 33.75 and 56.25 | | | | | | |
| 2.1 (optional) | 50 | 37.5 and 62.5 | | | | | | |
| Mapping skill | none | none | | | | | | |

Delete the rows that are not on that learner's route. Write the real time in
whole minutes; the bounds are only a guide to which ones to look at.

After each module ask the learner two questions and write the answers
down in their words: **"Was anything unclear?"** and **"Did you know what to do
next?"** Do not argue with the answers.

## Recording results

Record by role, in one comment on #232 per learner, using this shape:

```markdown
**Learner role:** new to version control | migrant from GitLab | migrant from Azure DevOps | migrant from Jira
**Route:** A | B, with optional modules done
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

1. For each module, compare actual with stated. **Correct the stated time only
   where the actual is outside the bounds**, and say in the change how many
   learners it is based on. A time from one learner is a weak basis; if two
   learners disagree in direction, record both and correct only when more data
   agrees.
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
