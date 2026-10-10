# Next-step modules: plan

**Status:** a plan. Nothing here is required reading. Modules 4.1, 4.9, 4.10, 4.12 and
4.13 are built; every other entry is an outline that is ready to become an issue.

The tiers before this one end at Module 3.6. This folder is for what comes
after: material for people who already work comfortably in the GitHub workflow
and want to go further. Modules built from this plan are named
`module-4-<n>-<name>.md` in this folder, following the same
`module-<tier>-<n>-<name>.md` scheme as the other tiers.

## How to use this plan

1. Pick a candidate whose audience and prerequisites match a real need. Do not
   build one because it is on the list.
2. File an issue from its outline, copying the objectives into observable
   acceptance criteria (see [Module 2.1](../2_intermediate/module-2-1-issue-first-and-closure-gate.md)
   for the habit).
3. Build the module with the usual parts: learning objectives, a short
   explanation, a hands-on exercise in the sandbox repo, a self-check, and a
   feedback prompt.
4. Replace the candidate's entry here with a link to the finished module.

## Overview

The candidates fall into three tracks. The numbers do not change and do not
follow the tracks: a number records when a module was planned or built, and the
track says what it is about. Each entry under [Candidates](#candidates) keeps
its audience, prerequisites, objectives and exercise idea.

### Track A: agents and AI

How a team works with an AI assistant and coding agent on a repository.

| Module | Working title | Builds on | Rough size |
| --- | --- | --- | --- |
| 4.1 | [Reviewing changes an AI agent wrote](module-4-1-reviewing-changes-an-ai-agent-wrote.md) (built) | [LLM prerequisite](../0_prerequisites/module-0-6-what-is-an-llm-assistant.md), [Module 2.2](../2_intermediate/module-2-2-pr-review-and-branch-conventions.md), [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 30 min |
| 4.2 | Writing your own agent skill | [Module 2.1](../2_intermediate/module-2-1-issue-first-and-closure-gate.md) | 40 min |
| 4.9 | [Using Copilot as a pull request reviewer](module-4-9-using-copilot-as-a-pull-request-reviewer.md) (built) | [Module 2.2](../2_intermediate/module-2-2-pr-review-and-branch-conventions.md), [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 30 min |
| 4.10 | [Assigning issues to the Copilot coding agent](module-4-10-assigning-issues-to-the-copilot-coding-agent.md) (built) | [Module 2.1](../2_intermediate/module-2-1-issue-first-and-closure-gate.md), [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 40 min |
| 4.13 | [Writing an instruction file for your repository](module-4-13-writing-an-instruction-file-for-your-repository.md) (built) | [Module 1.6](../1_beginners/module-1-6-skills-instructions-and-mcp.md), [Module 2.9](../2_intermediate/module-2-9-safety-with-skills-and-mcp-servers.md) | 35 min |

### Track B: automation and security

Workflows, pipelines and the supply chain around them.

| Module | Working title | Builds on | Rough size |
| --- | --- | --- | --- |
| 4.3 | Authoring a GitHub Actions workflow | [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 40 min |
| 4.12 | [Moving a GitLab pipeline to GitHub Actions](module-4-12-moving-a-gitlab-pipeline-to-actions.md) (built) | [Module 0.4](../0_prerequisites/module-0-4-coming-from-gitlab.md), [Module 1.1](../1_beginners/module-1-1-getting-started.md), [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 40 min |
| 4.4 | Securing the supply chain | [Module 3.4](../3_advanced/module-3-4-security-response.md) | 35 min |
| 4.7 | Running a secret-leak drill | [Module 3.4](../3_advanced/module-3-4-security-response.md) | 45 min |

### Track C: release and scale

Releases, history, and working across many repositories.

| Module | Working title | Builds on | Rough size |
| --- | --- | --- | --- |
| 4.5 | Release engineering: changelog, versions, provenance | [Module 3.3](../3_advanced/module-3-3-releases.md) | 35 min |
| 4.6 | Debugging with Git: bisect, blame, stash, worktrees | [Module 1.2](../1_beginners/module-1-2-local-git-basics.md), [Module 3.6](../3_advanced/module-3-6-rebase-cherry-pick-and-reflog.md) | 30 min |
| 4.8 | Working across many repositories | [Module 3.1](../3_advanced/module-3-1-branch-protection-and-rulesets.md), [Module 3.2](../3_advanced/module-3-2-projects-boards.md) | 30 min |
| 4.11 | Publishing and consuming packages (GitHub Packages) | [Module 3.3](../3_advanced/module-3-3-releases.md), [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 35 min |

## Build order

Eight of the thirteen candidates are not built. This order is a suggestion, and
the pilot ([#232](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/232))
can reorder it where learners' timing and questions show a different need. A
module still needs a real audience before it is built (see "How to use this
plan").

**Built so far, in the order they were built:**

1. Module 4.12, moving a GitLab pipeline to Actions, first because teams moving
   from GitLab had a pipeline to rewrite on day one.
2. Modules 4.10 and 4.9 ([#278](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/278),
   [#279](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/279)),
   the Copilot coding agent and Copilot review, because colleagues already had
   those tools.
3. Module 4.13 ([#280](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/280)),
   writing an instruction file, because it is the smaller step before a skill.
4. Module 4.1 ([#230](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/230)),
   reviewing changes an agent wrote.

**Suggested order for what remains:**

1. Module 4.2, writing your own agent skill: it is the step after 4.13 and
   finishes Track A.
2. Module 4.3, authoring a workflow: Modules 4.4 and 4.7 assume a learner can
   read and change a workflow, and 4.3 is the general lesson that 4.12 deliberately
   is not.
3. Module 4.4, securing the supply chain, then Module 4.7, the secret-leak
   drill: 4.7 is a rehearsal and is better after the controls of 4.4 exist.
4. Module 4.5, release engineering: useful to anyone who cuts releases, and
   independent of the tracks above.
5. Module 4.8, working across many repositories: only worth building when a
   learner maintains several related repositories.
6. Module 4.6, debugging with Git: independent of everything else, so it can move
   up when learners ask for it.
7. Module 4.11, GitHub Packages: parked. Its entry says demand is unconfirmed;
   build it only when a team starts to publish or consume versioned artifacts.

## Candidates

### Module 4.1: Reviewing changes an AI agent wrote

Built: [Module 4.1](module-4-1-reviewing-changes-an-ai-agent-wrote.md) ([#230](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/230)).

### Module 4.2: Writing your own agent skill

Do [Module 4.13](module-4-13-writing-an-instruction-file-for-your-repository.md)
first: an instruction file is the smaller step, and most conventions belong there
rather than in a skill.

- **Audience:** maintainers who want an assistant to follow a team convention.
- **Prerequisites:** Module 2.1.
- **Objectives:** decide when a rule belongs in a skill, in agent guidance, or
  in a hook; write a `SKILL.md` with a narrow trigger, preconditions, and a
  hand-off; check that the skill fires when it should and stays quiet when it
  should not.
- **Exercise idea:** turn one sandbox convention into a skill, then try three
  prompts that should and should not trigger it.
- **Candidate issue title:** "Education: add Module 4.2, writing your own agent
  skill".

### Module 4.3: Authoring a GitHub Actions workflow

- **Audience:** contributors who can read a workflow and now need to write one.
- **Prerequisites:** Module 3.5.
- **Objectives:** choose triggers and least-privilege `permissions:`; use a
  matrix and caching; pin third-party actions to a commit SHA; read a failed
  run's log before re-running it.
- **Exercise idea:** add a lint workflow to the sandbox, break it on purpose,
  and fix it from the log.
- **Candidate issue title:** "Education: add Module 4.3, authoring a GitHub
  Actions workflow".

### Module 4.4: Securing the supply chain

- **Audience:** maintainers of a repository with dependencies or workflows.
- **Prerequisites:** Module 3.4.
- **Objectives:** turn on and triage Dependabot, code scanning, and secret
  scanning; judge an alert by reachability, not severity alone; recognize a
  risky `pull_request_target` workflow.
- **Exercise idea:** triage three fake alerts of different reachability and
  write the reason on each.
- **Candidate issue title:** "Education: add Module 4.4, securing the supply
  chain".

### Module 4.5: Release engineering: changelog, versions, provenance

- **Audience:** anyone who cuts releases.
- **Prerequisites:** Module 3.3.
- **Objectives:** choose a version bump from the change set; keep a changelog
  that says what changed and why; verify a release against its tag and, where
  supported, its provenance attestation.
- **Exercise idea:** prepare a release for the sandbox, including a changelog
  section and a version check that fails on a mismatch.
- **Candidate issue title:** "Education: add Module 4.5, release engineering".

### Module 4.6: Debugging with Git: bisect, blame, stash, worktrees

- **Audience:** people comfortable with branches and undo who want to find
  regressions faster.
- **Prerequisites:** Module 1.2 and Module 3.6.
- **Objectives:** find the commit that introduced a bug with `git bisect`; read
  `git blame` without blaming a person; park work with `git stash`; keep two
  branches checked out with `git worktree`.
- **Exercise idea:** bisect a sandbox history seeded with one bad commit.
- **Candidate issue title:** "Education: add Module 4.6, debugging with Git".

### Module 4.7: Running a secret-leak drill

- **Audience:** teams that want to rehearse the response before they need it.
- **Prerequisites:** Module 3.4.
- **Objectives:** rotate first and clean history second; report privately
  without quoting the secret; write down what to do and who decides.
- **Exercise idea:** a facilitated tabletop using a clearly fake credential in
  a throwaway repo, ending with a short written incident note.
- **Candidate issue title:** "Education: add Module 4.7, running a secret-leak
  drill".

### Module 4.8: Working across many repositories

- **Audience:** maintainers of several related repositories.
- **Prerequisites:** Module 3.1 and Module 3.2.
- **Objectives:** run one organization-level board across repositories; apply
  the same ruleset and templates consistently; keep labels and milestones
  coherent across repositories.
- **Exercise idea:** compare the settings of two sandbox repositories with the
  read-only checks in `docs/repo-settings-snapshot.md` and list the drift.
- **Candidate issue title:** "Education: add Module 4.8, working across many
  repositories".

### Module 4.9: Using Copilot as a pull request reviewer

Built: [Module 4.9](module-4-9-using-copilot-as-a-pull-request-reviewer.md) ([#279](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/279)).

### Module 4.10: Assigning issues to the Copilot coding agent

Built: [Module 4.10](module-4-10-assigning-issues-to-the-copilot-coding-agent.md) ([#278](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/278)).

### Module 4.11: Publishing and consuming packages (GitHub Packages)

- **Status:** demand is unconfirmed. The maintainer said on 2026-10-01 that the
  team does not use GitHub Packages now and might later, so build this only when
  a team starts to publish or consume versioned artifacts. It is a standalone
  module, not a section in Module 3.3, because its exercise (publishing from a
  workflow with a restricted token) fits poorly in a releases module.
- **Audience:** anyone who publishes or consumes a versioned artifact (an npm
  package, a container image, a NuGet package) from a repository.
- **Prerequisites:** Module 3.3 and Module 3.5.
- **Objectives:** tell a package apart from a release and from a build
  artifact; publish a package from a workflow using a least-privilege token;
  explain who can read a package and how that access relates to the repository;
  consume a package with a token that can only read packages; explain why a
  published version is immutable in practice and how cleanup works; never
  publish a secret inside a package.
- **Exercise idea:** in the sandbox, publish a tiny package version from a
  workflow, read it back with a read-only token, and then say what you would do
  if the package had contained a credential (rotate first, per Module 3.4).
- **Verify before building:** which registries your plan supports,
  storage and retention limits, the current authentication rules, and whether
  package visibility can differ from the repository's. None of this has been
  checked.
- **Candidate issue title:** "Education: add Module 4.11, publishing and
  consuming packages".

### Module 4.12: Moving a GitLab pipeline to GitHub Actions

Built: [Module 4.12](module-4-12-moving-a-gitlab-pipeline-to-actions.md). It
stands on its own and is not part of Module 4.3: it starts from a GitLab pipeline
and teaches the rewrite, while Module 4.3 stays the general lesson on authoring a
workflow from scratch. The numbering is by order of building, not by reading order.

### Module 4.13: Writing an instruction file for your repository

Built: [Module 4.13](module-4-13-writing-an-instruction-file-for-your-repository.md) ([#280](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/issues/280)).
It sits before Module 4.2 in reading order and builds on Modules 1.6 and 2.9. The
number follows the order of building, not the reading order.

## Also considered, not proposed

- A deeper Copilot or Claude in VS Code lesson belongs to the LLM track, not
  this folder, and is tracked with that track's later tiers.
- A GitHub Pages or documentation-site module would be useful only if the
  repository ever publishes a site.
