# Next-step modules: plan

**Status:** a plan, not built. Nothing here is required reading, and no module
below exists yet. Each entry is an outline that is ready to become an issue.

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

| Module | Working title | Builds on | Rough size |
| --- | --- | --- | --- |
| 4.1 | Reviewing changes an AI agent wrote | [LLM prerequisite](../0_prerequisites/prerequisite-what-is-an-llm-assistant.md), [Module 2.2](../2_intermediate/module-2-2-pr-review-and-branch-conventions.md), [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 30 min |
| 4.2 | Writing your own agent skill | [Module 2.1](../2_intermediate/module-2-1-issue-first-and-closure-gate.md) | 40 min |
| 4.3 | Authoring a GitHub Actions workflow | [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 40 min |
| 4.4 | Securing the supply chain | [Module 3.4](../3_advanced/module-3-4-security-response.md) | 35 min |
| 4.5 | Release engineering: changelog, versions, provenance | [Module 3.3](../3_advanced/module-3-3-releases.md) | 35 min |
| 4.6 | Debugging with Git: bisect, blame, stash, worktrees | [Module 1.2](../1_beginners/module-1-2-local-git-basics.md), [Module 3.6](../3_advanced/module-3-6-rebase-cherry-pick-and-reflog.md) | 30 min |
| 4.7 | Running a secret-leak drill | [Module 3.4](../3_advanced/module-3-4-security-response.md) | 45 min |
| 4.8 | Working across many repositories | [Module 3.1](../3_advanced/module-3-1-branch-protection-and-rulesets.md), [Module 3.2](../3_advanced/module-3-2-projects-boards.md) | 30 min |
| 4.9 | Using Copilot as a pull request reviewer | [Module 2.2](../2_intermediate/module-2-2-pr-review-and-branch-conventions.md), [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 30 min |
| 4.10 | Assigning issues to the Copilot coding agent | [Module 2.1](../2_intermediate/module-2-1-issue-first-and-closure-gate.md), [Module 3.5](../3_advanced/module-3-5-actions-runners-and-agents.md) | 40 min |

## Candidates

### Module 4.1: Reviewing changes an AI agent wrote

- **Audience:** anyone who accepts pull requests from an AI coding assistant or
  the Copilot coding agent.
- **Prerequisites:** the LLM prerequisite, Module 2.2, and Module 3.5.
- **Objectives:** read an agent's diff for scope creep and invented APIs; check
  the claimed verification against what ran; decide between approve, request
  changes, and comment with evidence.
- **Exercise idea:** review an intentionally flawed agent-style pull request in
  the sandbox that passes CI but hard-codes a value, edits an unrelated file,
  and claims a test it never added.
- **Candidate issue title:** "Education: add Module 4.1, reviewing changes an AI
  agent wrote".

### Module 4.2: Writing your own agent skill

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

- **Audience:** reviewers and authors who want a first-pass automated review
  before a person looks.
- **Prerequisites:** Module 2.2 and Module 3.5.
- **Objectives:** request a Copilot review on a pull request and read its
  comments critically; tell a useful finding from noise or a confident wrong
  answer; write repository custom instructions so the review follows the team's
  conventions; keep the rule that an automated review is input to the human
  verdict, never the verdict or the merge approval.
- **Exercise idea:** open a sandbox pull request with two real defects and one
  harmless style choice, request a Copilot review, and record which comments
  were right, wrong, or missing, then decide the verdict yourself.
- **Verify before building:** which plans and surfaces offer Copilot review, how
  custom instructions are scoped, and whether Copilot can review anything other
  than a pull request (it is a pull-request feature; reviewing a filed issue is
  not something to promise). State the plan and availability limits in the
  module, as Module 3.5 does.
- **Candidate issue title:** "Education: add Module 4.9, using Copilot as a pull
  request reviewer".

### Module 4.10: Assigning issues to the Copilot coding agent

- **Audience:** maintainers who want to hand a well-specified issue to an agent.
- **Prerequisites:** Module 2.1 and Module 3.5.
- **Objectives:** write an issue an agent can act on (observable acceptance
  criteria, scope, non-goals, how to verify); assign it and follow the draft
  pull request; review the result against the issue's criteria with evidence
  and reject scope creep; know what the agent can and cannot do with the
  repository's permissions and branch rules.
- **Exercise idea:** write two versions of the same sandbox issue, one vague and
  one with criteria, assign each, and compare the pull requests; then run the
  closure-gate check on the better one before merging.
- **Verify before building:** plan and organization availability, how the agent
  is assigned, and what it may access. Module 3.5 already covers the idea
  briefly, so this module should add the practice, not repeat the explanation.
- **Candidate issue title:** "Education: add Module 4.10, assigning issues to the
  Copilot coding agent".

## Also considered, not proposed

- A deeper Copilot or Claude in VS Code lesson belongs to the LLM track, not
  this folder, and is tracked with that track's later tiers.
- A GitHub Pages or documentation-site module would be useful only if the
  repository ever publishes a site.
