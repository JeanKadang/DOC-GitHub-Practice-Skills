---
name: github-for-ado-users
description: Use when someone coming from Azure DevOps, TFS, Jira, or another tracker asks how a concept maps to GitHub — "what's the GitHub equivalent of a sprint / epic / work item type / area path / component / fix version / query (WIQL or JQL)", "where do sprints go", why milestones don't behave like iterations, how Jira or Azure Boards (AB#) and GitHub link, how to plan a migration from Azure DevOps, Bitbucket or Jenkins (readiness tiers, sequence, GHE.com and managed-user differences), where a wiki or test plan should go, or how to set up GitHub tracking the way they had it in ADO or Jira.
---

# GitHub for Azure DevOps migrants

GitHub and ADO cover the same ground with a much smaller feature set. The danger
is not the concepts that are missing — those are obvious. It is the ones that map
*almost*, where a familiar word means something different and the process quietly
breaks weeks later.

**If your team's Azure DevOps or TFS project uses TFVC rather than Git
repos, everything below is the wrong layer to start at.** This mapping
table is GitHub-vs-ADO *process* vocabulary — work items, boards, pipelines.
TFVC vs Git is a different, more fundamental jump: TFVC checks files out
from one central server one at a time, and only one person can hold the
lock on a file at once; Git gives every clone the entire history, and
every commit happens locally, before anyone pushes anywhere — there's no
central lock to wait for. No amount of relabeling nouns bridges that gap;
it has to be learned as its own concept before the table below is useful.
If this repository's colleague-training program is available, its
`education/0_prerequisites/module-0-1-what-is-version-control.md` (this repository only) covers the
concept in plain terms — but the two sentences above are enough to name
the jump even without it.

**The single most expensive mistake (once you're on Git): treating
milestones as sprints.** See below.

## Mapping table

| Azure DevOps | GitHub | Notes |
|---|---|---|
| Work Item | Issue | Straight mapping |
| **Work Item Type** (Bug/Task/Feature) | **Issue Types** | Real first-class field, but **org-only** — personal accounts get labels instead |
| **Iteration / Sprint** | **Projects iteration field** | **Not milestones.** See below |
| Area Path | Labels | Flat, not hierarchical — encode area as `area:auth` if you need the prefix |
| Epic → Feature → Story | Epic issue + native **sub-issues** | One practical nesting level; don't rebuild three tiers |
| Boards | Projects v2 | A *view* over issues, never the source of truth |
| Backlog | Issue list, ordered by priority label | No ranked backlog with drag-order outside a board |
| Queries (WIQL) | `gh issue list --search`, Projects saved views | Far weaker; no cross-repo query language |
| Wiki | `docs/` in the repo | GitHub's Wiki exists, but don't start a new one; see below |
| Pipelines | Actions | YAML in `.github/workflows/` |
| Branch policies | **Rulesets** | Supersede branch protection; `gh ruleset` is view-only |
| Pull Request | Pull Request | Straight mapping |
| Release pipeline | Releases + a tag-triggered workflow | |
| **Test Plans** | **No equivalent** | Genuine hole — plan for it |
| Dashboards | Projects charts (weak), or nothing | Insights are thin by ADO standards |
| Service hooks | Webhooks / Actions | |
| Delivery Plans | No equivalent | |

## The three traps

### 1. Milestones are not sprints

A milestone is a **delivery bucket** — a release, or a phase. It closes when the
thing ships. It has a due date, which makes it *look* like an iteration, and that
is the trap.

Time-boxed iterations belong in a **Projects iteration field**. Using milestones
as sprints leaves a graveyard of stale, half-empty `Sprint 14` milestones that
nobody closes, and destroys the one thing milestones are good at: answering "what
is in the next release?"

If you want both — you probably do — run milestones for releases and an iteration
field on the board for cadence. They are different axes, like priority and
milestone. Note that the iteration field **cannot be created from the CLI**
(`gh project field-create` supports only TEXT, SINGLE_SELECT, DATE, NUMBER);
use the web UI or a GraphQL mutation. See `github-projects`.

### 2. Issue types are org-only

`gh issue create --type Bug` sets a first-class type, separate from labels — the
closest thing to a Work Item Type. But issue types are defined **at the
organization level**. On a personal account the API returns 404 and the flag has
nothing to select:

```bash
gh api "orgs/<org>/issue-types" --jq '.[].name'    # 404 on a personal account
```

On a personal repo, encode the type as a category label and move on. If you are
setting up an org, define issue types early — retrofitting them across an existing
backlog is manual. Keep them coarse (Bug, Feature, Task, Epic); the priority and
area axes stay on labels.

### 3. A new Wiki is a trap; an established one is not

GitHub's Wiki is a separate git repo with no pull requests, no review, no CI, and
no coupling to the branch that changed the behaviour it documents. For a repository
with no Wiki in use, docs that matter go in `docs/` in the repo, where they are
versioned with the code, reviewed in the same PR, and greppable. Don't enable a
Wiki to hold them.

That is a rule about *starting* one, not about an existing one. Azure DevOps also
has a Git-backed project Wiki, so a team arriving with an established,
actively-used Wiki (here or there) may keep it: leave it alone and treat its
content as the source of truth for what it covers, as `github-repo-bootstrap`
does. If they are migrating because the wiki
sprawled unreviewed, that is the moment to suggest `docs/`, but it is a call
about their wiki, not about wikis in general.

Use Discussions for the conversational content that would have been a wiki page in
ADO (how-do-I, RFCs, announcements).

## What GitHub has that ADO does not

**Discussions** is the one to actually learn. ADO has no equivalent, so migrants
tend to keep putting exploratory work into issues, where it rots as a stale
never-closeable ticket.

- Discussion = exploring. Threaded, votable, answer-markable, no assignee, no
  "when will this be done."
- Issue = committed to doing. Assignee, priority, milestone.
- **Converting a discussion to an issue is the moment exploration became
  commitment** — that boundary is the whole value.

Categories worth having: `Ideas`, `Q&A`, `RFC`, `Announcements`.

Caveat: `gh discussion` is **in preview and subject to change**. Script against
the GraphQL API if you need stability; the web UI is fine for humans.

Also new relative to ADO: **CODEOWNERS** (automatic review routing by path),
**Dependabot** (dependency PRs raised for you), **auto-generated release notes**,
and **native sub-issues**.

## The traceability chain

The consistency that ADO gave you through work-item links, GitHub gives through
one chain. Every change follows it, and each link is enforced by the tool rather
than by discipline:

```
issue (#N, priority + category labels, milestone)
  → gh issue develop <N>        # branch created AND linked to the issue
  → PR with "Refs #N"           # links partial or in-progress delivery
  → criteria + evidence reviewed # acceptance contract must pass
  → change "Refs" to "Closes"   # completed issue may now auto-close
  → milestone                   # groups the release
  → auto-generated release notes # built from merged PRs
```

Break any link and traceability is back to human memory. `gh issue develop` is the
one most often skipped and the one that does the most work — it is the equivalent
of creating a branch from a work item in ADO.

GitHub does not enforce acceptance criteria the way a configured ADO process can.
`Closes #N` merely changes state when the PR merges; it does not evaluate a
checkbox. Treat each criterion as part of the work: map it to concrete evidence,
check it only when satisfied, and keep `Refs #N` plus an open issue while any
in-scope criterion is unmet or unevaluated. Scope changes require a recorded
decision, not a checkbox that falsely implies delivery. The exact merge and
closure gate lives in `github-hygiene`.

## Keeping Azure Boards next to GitHub

Many teams move the code first and keep Azure Boards for planning. The two link
through the **`AB#` mention**, which needs the Azure Boards project to be
connected to the GitHub repository first (the Azure Boards app for GitHub, with
Contributor access to both). Without the connection a mention links nothing.

- **Where it works:** put `AB#125` in a **commit message, a pull request
  description or an issue description**, push or save, and the work item shows
  the link in its Development section.
- **Where it does not:** Microsoft's documentation says an `AB#` in a
  **comment** or in a **pull request title** does not create the link. A
  user who put it in the title and sees nothing has not found a bug.
- **State words move work items.** A word such as `fix`, `fixes`, `fixed` or
  a state name before the mention (`Fixes AB#125`, `Closed AB#125`) also
  transitions the work item, but only when the pull request merges into the
  default branch. With several mentions, only the first is transitioned unless
  each one has its own word.

**Do not combine the two closures.** `Fixes AB#125` moves the Azure Boards work
item on merge in the same way `Closes #N` closes a GitHub issue: neither checks
the acceptance criteria. Treat it like `Closes`. Use the bare `AB#125` (link
only) while any criterion lacks evidence, and add a state word only once the
evidence is recorded and the maintainer has approved the closure. The closure
gate lives in `github-hygiene`.

Keep one source of truth for each piece of work: planning and status in Azure
Boards, code and review in GitHub, the `AB#` mention in the description. Copying
every work item into a GitHub issue gives two records that drift. Connecting
the same repository to projects in more than one Azure DevOps organization
can produce unexpected links, so connect it to one. Azure DevOps Server (on
premises) supports GitHub Enterprise Server only; this section does not cover
that setup.

Source, read 2026-10-11: Microsoft Learn, [Link GitHub commits, PRs, branches,
and issues to work
items](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github)
(page dated 2026-07-16). Re-check it before relying on a claim for a decision
that is hard to undo.

## Coming from Jira

Jira is not Azure DevOps, so the table above is the wrong starting point for a
Jira user. Atlassian's current documentation says *work item* where this
section says Jira issue, and *space* where it says Jira project; people still
use both words, so accept either. The mapping below was checked against the
vendor pages listed at the end on 2026-10-10. Re-check a claim before relying on
it for a decision that is hard to undo; both vendors change these features.

| Jira | GitHub | Where it differs |
|---|---|---|
| Space key plus number (`PROJ-123`) | Issue number (`#123`), unique per repository | There is no project prefix. Across repositories write `owner/repo#123`. |
| Epic, Story, Task, Bug | **Issue types** (org-only; defaults are task, bug and feature, up to 25) | GitHub has no built-in "epic" level. Use an issue type or label plus sub-issues. |
| Sub-task | **Sub-issue** | Up to eight levels and 100 per parent, and a sub-issue can sit in another repository. Jira's default is three fixed levels; do not rebuild more than you need. |
| Scrum board and sprint | Projects board plus an **iteration field** | An iteration has a length in days or weeks, a start date and optional breaks, like a sprint. It is **not** a milestone; see trap 1. |
| Workflow status (To Do, In Progress, Done) | A **single select field** on the Projects board, such as Status | The issue itself is only open or closed. Check which Jira workflow rules the team relies on; none carry over by themselves. |
| Resolution (Done, Won't do, Duplicate) | The close reason on an issue (completed, not planned, duplicate) | Set when closing, and searchable with `reason:`. |
| Priority | A priority label | Priority is not a built-in field on an issue. |
| Component | Label such as `area:auth` | Flat, like Area Path. |
| Fix version | **Milestone** | A release bucket that closes when it ships. |
| Affects version | A field in the issue form, or a label | There is no built-in field. |
| JQL | Issue search qualifiers, and Projects saved views | Search combines qualifiers with `AND`, `OR` and parentheses (`label:`, `no:`, `reason:`, `type:`, `milestone:`) and can be limited to an owner. It is not a query language with functions. |

**Linking the two products.** The GitHub for Atlassian app connects a GitHub
Cloud organization to a Jira Cloud site: a Jira site administrator and a GitHub
organization owner must both approve it. Once connected, a Jira key in a branch
name, a commit message or a pull request title links that work to the Jira item,
and its development panel then shows the branches, commits and pull requests
(workflows and deployments can be linked too). Smart commits can also comment
on an item, log time or move its status from a commit message; new repositories
in a linked account have them enabled by default, and Atlassian warns that a
commit can be attributed to someone other than the person who pushed it, so
some organizations switch them off.

**What not to promise.** Atlassian's documentation describes development
information flowing *into* Jira. It does not describe syncing GitHub issues with
Jira items or carrying statuses between them, so never tell a user the two stay
in step. If the team plans in Jira, keep one source of truth for each piece of
work: planning and status in Jira, code and review in GitHub, with the key in
the branch name and the pull request title. Mirroring every Jira item as a
GitHub issue creates two records that drift. GitHub Enterprise Server connects
through a separate process that this section does not cover.

The closure gate does not change: a criterion is met when its evidence is
recorded, wherever the criteria live. This repository's own conventions
(`Refs #N`, `gh issue develop`) assume GitHub issues; for work tracked in Jira,
put the key where the tooling looks for it and the evidence in the pull
request.

Sources, read 2026-10-10: Atlassian Support pages on [work item
keys](https://support.atlassian.com/jira-software-cloud/docs/what-is-an-issue/),
the [work type
hierarchy](https://support.atlassian.com/jira-cloud-administration/docs/configure-the-issue-type-hierarchy/),
[statuses, priority and
resolution](https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-statuses-priorities-and-resolutions/),
[sprints](https://support.atlassian.com/jira-software-cloud/docs/what-is-a-sprint/),
[versions](https://support.atlassian.com/jira-cloud-administration/docs/manage-versions/),
[JQL](https://support.atlassian.com/jira-software-cloud/docs/use-advanced-search-with-jira-query-language-jql/),
[connecting
GitHub](https://support.atlassian.com/jira-cloud-administration/docs/integrate-with-github/),
[linking development
work](https://support.atlassian.com/jira-software-cloud/docs/reference-issues-in-your-development-work/)
and [smart
commits](https://support.atlassian.com/jira-cloud-administration/docs/enable-smart-commits/);
GitHub Docs pages on [iteration
fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-iteration-fields),
[sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues),
[issue
types](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-types-in-an-organization)
and [issue
search](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/filtering-and-searching-issues-and-pull-requests).

## Planning a migration to GitHub

This skill explains; it does not move anything. Use this section when the
question is "how do we move our whole estate" rather than "what is the
equivalent". It applies to Azure DevOps, Bitbucket, Jenkins and TFS sources.

### 1. Classify before you move

Put every repository and every pipeline in one of three tiers: **easy to
migrate**, **needs some work**, **not migratable as it is**. Use objective,
tool-reported signals so the answer is the same for every source system.

| Signal | What it decides |
|---|---|
| Repository size | GitHub recommends repositories under 1 GB, strongly under 5 GB; over that it needs splitting or history work |
| Largest tracked file | GitHub warns at 50 MiB and blocks above 100 MiB; Git LFS or removal is needed before the push |
| Version control | TFVC must become Git first; that is a separate conversion, not a copy |
| Pipeline conversion | Convertible with no unsupported steps is easy; converted with unsupported or unknown steps needs rework; unsupported is rebuilt as Actions |

The cut-offs are your own choice inside GitHub's fixed limits; one assessment
used 2 GB and 5 GB. Whether a repository is empty or dormant is a separate
retention decision (archive or delete), not a complexity score. For Jenkins,
GitHub Actions Importer has `audit` (analyze the footprint), `forecast`,
`dry-run` (convert one pipeline and print the workflow) and `migrate` (convert
and open a pull request). GitHub's page says mandatory build tools, scripted
pipelines, secrets, self-hosted runners and unknown plugins are migrated
manually, so expect most of a large Jenkins estate to land in "needs some work".

### 2. Standardization is a separate screen

A repository that converts cleanly can still be unfit to move: no owner, no
branch rules, hardcoded credentials, copied pipelines, committed binaries.
Check each one against the baseline in `github-repo-configure` ("The minimum
baseline"). Fix what fails, or record a dated exception with an approver, before
it counts as migrated. Moving it unchanged only relocates the problem.

### 3. Tools and sources

GitHub Enterprise Importer migrates repositories from Azure DevOps Cloud,
Bitbucket Server and Data Center (5.14 and later), GitLab, GitHub Enterprise
Server and GitHub.com. Bitbucket Cloud is not in that list, and the classic
"Import repository" importer is not available on GHE.com. Pipelines are a
separate job (Actions Importer above, or a rewrite). Migrate a submodule before
the repository that contains it and rewrite its URL, because the parent will not
build otherwise.

### 4. Sequence and who does the work

Stand up the governed platform first: identity, repository creation rules, the
security baseline and audit-log streaming, before any workload moves. This phase
is easy to underestimate; do not compress it to shorten the schedule. Then move
the most similar source first (existing GitHub organizations), then the next
source, and the hardest last (very large repositories, automation that must be
rebuilt). The platform team owns the platform and its guardrails; each team
migrates its own repositories and pipelines with runbooks, templates and a
support channel. Run representative pilots, and measure them, before you retire
any existing scanner or change any licence.

### 5. GitHub Enterprise Cloud with data residency (GHE.com)

GHE.com uses Enterprise Managed Users (EMU): the identity provider provisions
every account. Checked on 2026-10-22 against GitHub Docs:

- **Not available, by design:** public repositories and gists, and the classic
  importer. Use internal repositories for sharing inside the enterprise.
- **Not available yet (may change):** macOS GitHub-hosted runners, Maven and
  Gradle in GitHub Packages, the GitHub Marketplace for browsing or installing,
  dependency insights, and audit-log streaming to Amazon S3 with OIDC.
- **Works differently:** the API, container registry, raw-content, SSH clone,
  OIDC issuer and SCIM URLs move to your enterprise subdomain, so every script,
  workflow or integration that hard-codes `github.com`, `ghcr.io` or
  `githubusercontent.com` needs updating. Every API request must be
  authenticated, and `GITHUB_TOKEN` does not reach resources on GitHub.com.
  Actions that call `api.github.com` may fail unless the author supports it.
  A managed user account cannot create public content or collaborate outside the
  enterprise.

### 6. The change is in how people work

Git and GitHub branching, pull requests, review and CI differ materially from
Bitbucket, Azure DevOps and Jenkins. Plan and resource training and support as
part of the programme; teams that treat it as a tooling swap carry old habits
onto the new platform.

Sources: GitHub Docs pages on GitHub Enterprise Importer, Actions Importer for
Jenkins, large files, and GHE.com features and Enterprise Managed Users, read
2026-10-22. They carry no update date, so recheck a limit before you rely on it.
Not checked: which pipeline sources Actions Importer supports other than
Jenkins, TFVC conversion tools, and Copilot plans on managed accounts.

## Setting up a repo the way you had it in ADO

Rough order, with the skill that covers each:

1. Labels (priority + category) — `github-issue-first`
2. Issue types, if you are in an org — `github-issue-first`
3. Milestones for releases, **not** sprints — `github-releases`
4. Ruleset on the default branch (required checks + review) — `github-releases`
5. Issue forms and PR template — `github-repo-configure`; CODEOWNERS and
   CONTRIBUTING.md — `github-repo-bootstrap` for a new repository,
   `github-repo-review` to audit an existing one
6. `.github/release.yml` for categorised release notes — `github-releases`
7. Projects board **only if more than one maintainer** — `github-projects`
8. Discussions enabled, with categories

## Common mistakes

| Mistake | Fix |
|---|---|
| Milestones used as sprints | Milestones = releases; iterations = Projects iteration field |
| Rebuilding Epic→Feature→Story as three issue levels | Epic + sub-issues, one level |
| Expecting `gh issue create --type` to work on a personal repo | Issue types are org-only; use labels |
| Starting a new GitHub Wiki for docs | `docs/` in the repo — versioned, reviewable, greppable (an established, actively-used Wiki can stay) |
| Exploratory ideas filed as issues | Discussions; convert when it becomes actionable |
| Looking for Test Plans | No equivalent — decide where test cases live before you need them |
| Expecting WIQL-grade queries | `gh issue list --search` + Projects views; plan for less |
| A board as the source of truth | The board mirrors issues; labels and milestones are authoritative |
| Assuming a merged PR means its issue met acceptance criteria | Review every criterion with evidence; use `Refs #N` until the completion contract passes |
| Telling a Jira user that GitHub issues and Jira items stay in sync | The connection carries development information into Jira only; keep one source of truth per piece of work |
| Writing `Fixes AB#125` in a PR description before the evidence is recorded | It moves the work item on merge and checks no criterion; use bare `AB#125` until the closure gate passes |
| Putting `AB#125` in a PR title or a comment and expecting a link | It links only from a commit message, PR description or issue description, and only once the project is connected to the repository |
| Moving a repository because it converts cleanly | Check it against the baseline too; easy to convert is not fit to move |
| Moving workloads before identity, repository rules and the security baseline exist | Foundation first; it is the one hard dependency |
| Using a Jira user's mapping from the Azure DevOps table | Use "Coming from Jira": fix versions are milestones, components are labels, sprints are iterations |
