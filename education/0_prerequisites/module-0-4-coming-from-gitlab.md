# Module 0.4: Coming from GitLab

**Audience:** Anyone on a team that uses GitLab today and is moving to GitHub,
or who works with such a team. Read [Module 0.3](module-0-3-what-is-github.md)
first. Conditional: skip it if you are not coming from GitLab.

**Format:** Reading only. No account needed, nothing to click.

**Timing budget:** ~10 minutes.

![Four GitLab terms mapped to GitHub: merge request to pull request, epic to issue with sub-issues, issue board to Projects, and the GitLab CI file to Actions workflows, which is a rewrite and not a rename.](../graphics/module-0-4-coming-from-gitlab.svg)

## Why this exists

Other teams use GitLab and are supposed to move to GitHub. The good news is
that Git does not change, so your commits, branches and habits carry over.
What changes is the vocabulary, and a few places where GitLab has a real
feature GitHub does not, or where a familiar word means something slightly
different. This page orients you. The full mapping, with the reasoning, is in
the `github-for-gitlab-users` skill (`skills/github-for-gitlab-users/SKILL.md`),
and this page does not repeat it. It also does not cover how to migrate
repositories or rewrite pipelines.

## What stays the same

Commits, branches, merging after review, and the idea that a change is
proposed, reviewed and then merged. A GitLab merge request is a GitHub pull
request; a GitLab issue is a GitHub issue.

## Quick orientation

The core mechanism from Modules 0.1 to 0.3 (commit, branch, push, pull, review,
merge) is the same everywhere — Git itself doesn't change. What changes is the vocabulary
and a few structural features. Quick orientation:

| Concept | GitHub | GitLab | Azure DevOps |
| --- | --- | --- | --- |
| Review request | Pull Request | Merge Request | Pull Request |
| Tracked work item | Issue | Issue | Work Item |
| Release bucket | Milestone | Milestone | Iteration (different meaning — see below) |
| CI/CD config | `.github/workflows/*.yml` | `.gitlab-ci.yml` | Pipelines (YAML or classic editor) |
| Kanban-style view | Projects (v2) | Issue Board | Boards |

Two traps worth knowing before you hit them: GitHub milestones are a
**release bucket only** — GitLab and Azure DevOps both use "milestone" or
"iteration" language that can also mean a time-boxed sprint, which GitHub
milestones don't do. And `.gitlab-ci.yml` is not something you rename into
a GitHub Actions file — it's a different system with a different trigger
model.

This table is deliberately short — just enough to stop a familiar word from
meaning the wrong thing. For the full mapping (work item types, boards,
wikis, pipelines, and the traps specific to each tool), see
`skills/github-for-ado-users/SKILL.md` (Azure DevOps / TFS) or
`skills/github-for-gitlab-users/SKILL.md` (GitLab) before you start relying
on GitHub day to day.

## Three differences that cost the most

Each is covered in full in the skill; here is the one-line version.

- **`.gitlab-ci.yml` is not a file you rename.** GitLab CI is one file with
  stages. GitHub Actions is a different system: several workflow files, a
  different trigger model, and no converter. Plan a pipeline rewrite, not a
  find-and-replace.
- **Milestones may need to split in two.** If your milestones doubled as
  release buckets and time-boxed iterations, GitHub milestones only do the
  first. Cadence belongs in a Projects iteration field.
- **Groups and subgroups become flat organizations.** GitHub has no nested
  subgroup hierarchy, so plan for it. Scoped labels (`key::value`) also become
  flat labels, and approval rules are less granular.

A GitLab wiki is not automatically a problem: leave an established,
actively used one alone, and read the skill before deciding what to do with it.

## What GitHub adds

Discussions for open exploration (so questions and proposals do not sit in the
issue list as tickets that can never close), native sub-issues for one level of
nesting, and release notes generated from merged pull requests. [Module 2.6](../2_intermediate/module-2-6-where-does-this-thought-belong.md)
covers where a thought belongs.

## Where to go next

- The `github-for-gitlab-users` skill, for any specific concept you are mapping.
- [Module 1.1: Getting Started](../1_beginners/module-1-1-getting-started.md), the
  hands-on part, once you have read the
  [Module 0.6: What Is an LLM Assistant?](module-0-6-what-is-an-llm-assistant.md).
- If you come from Azure DevOps instead, use `skills/github-for-ado-users/SKILL.md`
  alongside the table above.

## Self-check

- What is the GitHub name for a GitLab merge request?
- Why can you not just rename `.gitlab-ci.yml` to move your pipeline?
- If your GitLab milestones doubled as sprints, where does that cadence go on GitHub?

Not confident on any of these? Re-read the section above, or the skill.

## Feedback

Something unclear, wrong, or worth improving on this page? Open a
Discussion in this repo (**Ideas** category). Concrete, actionable
feedback gets converted into a tracked issue, per this repo's own
issue-first convention — see `skills/github-issue-first/SKILL.md`'s
Discussions section.

---

Next: the [Module 0.6: What Is an LLM Assistant?](module-0-6-what-is-an-llm-assistant.md),
then [Module 1.1: Getting Started](../1_beginners/module-1-1-getting-started.md).
