# Issue types, templates and forms

Companion to `github-issue-first` (SKILL.md). Read it before setting an issue type, or before filing in a repository that has issue templates or forms.

## Issue types (organization repos)

Separate from labels, GitHub has a first-class **issue type** field — the closest
equivalent to a work-item type in Azure DevOps or Jira. Set it at creation:

```bash
gh issue create --type Bug --title "..." --body "..." --assignee "@me" --label P1
gh issue edit <N> --type Feature      # or --remove-type
```

**Issue types are defined at the organization level.** On a personal account the
endpoint 404s and the flag has nothing to select:

```bash
gh api "orgs/<org>/issue-types" --jq '.[].name'
```

So: on an org repo, use the type field for *what kind of work this is* and keep
labels for priority and area. On a personal repo, encode the kind as a category
label — don't invent a parallel scheme. The axes are:

| Axis | Where | Example |
|---|---|---|
| Kind of work | Issue type (org) or category label | Bug, Feature, Task, Epic |
| Urgency/importance | Priority label | P0–P3 |
| Area/domain | Category label | `tooling`, `documentation`, `visualization` |

Keep types coarse. A dozen types is a taxonomy nobody applies consistently.

## Issue templates and forms

Check `.github/ISSUE_TEMPLATE/` before filing. If the repo has templates, **fill
out the fields they define** rather than free-forming a body — a repo that asks
for reproduction steps and version wants those on every issue, including yours.
Use `gh issue create --template <name>.yml` (non-interactive `--body` bypasses
the template entirely, so paste the template's sections into the body yourself).

If a repo has no templates and is about to take outside contributors, that is
worth recommending: issue *forms* (`.github/ISSUE_TEMPLATE/*.yml` with `body:`
fields) beat markdown templates because required fields are actually enforced and
`labels:`/`assignees:` are applied automatically. Add `config.yml` with
`blank_issues_enabled: false` plus contact links to route questions away from the
tracker. Recommend it, don't silently add it — templates change what every future
contributor sees. `github-repo-configure` ships ready-to-copy, generic
Bug Report/Improvement forms plus a matching `config.yml` — reuse those
rather than drafting new ones from scratch.
