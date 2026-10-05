# Repo settings snapshot

A read-only checklist for auditing what an *existing* repository actually
has configured — branch protection, community health files, automation —
before deciding what to introduce (a skill, a stricter workflow, agent
assistance). Run this before recommending `github-issue-first`'s full
ceremony, a ruleset, or anything else on top of a repo you don't already
know well. Needs only read access to the target repo; nothing here writes
anything.

## Core settings

```bash
gh repo view OWNER/REPO --json visibility,defaultBranchRef,deleteBranchOnMerge,hasIssuesEnabled,hasProjectsEnabled,hasWikiEnabled
```

## Branch protection

Modern rulesets first; classic protection is a fallback most repos no
longer use, but still worth checking if rulesets comes back empty.

```bash
gh api repos/OWNER/REPO/rulesets --jq '.[] | {name, target, enforcement}'
gh api repos/OWNER/REPO/rulesets/RULESET_ID   # full detail, once you have its id

# Classic protection, only if the above is empty
gh api repos/OWNER/REPO/branches/main/protection --jq keys
```

The last command lists which classic protections are configured; leave off
`--jq keys` for their full settings. A `404 Branch not protected` means there
is no classic protection.

A private repo on GitHub Free returns `403 Upgrade to GitHub Pro or make
this repository public` for both of the above — that's a plan constraint,
not evidence the repo lacks protection by choice. `gh ruleset list` prints
nothing and exits 0 in that situation too, which looks identical to "none
configured" — don't conflate the two.

## Community health files

```bash
gh api repos/OWNER/REPO/community/profile --jq '{health_percentage, files}'
```

Returns which of README/LICENSE/CODE_OF_CONDUCT/CONTRIBUTING/SECURITY/issue
templates/PR template exist. A present-but-boilerplate file (an unedited
SECURITY.md with a fictitious version table, for instance) still counts as
"present" here — this command tells you existence, not quality; read the
file if the percentage looks suspiciously high for how mature the repo
otherwise seems.

## CODEOWNERS

```bash
gh api repos/OWNER/REPO/contents/CODEOWNERS --jq .path
```

## Labels, milestones, and existing automation

```bash
gh label list --repo OWNER/REPO
gh api repos/OWNER/REPO/milestones?state=all --jq '.[] | {number, title, state}'
gh api repos/OWNER/REPO/actions/workflows --jq '.workflows[] | {name, path, state}'
```

## Secrets referenced vs. actually set

Only meaningful if you have admin access to the repo (read access alone
won't show secrets).

```bash
gh secret list --repo OWNER/REPO
grep -rn "secrets\." OWNER-REPO-LOCAL-CHECKOUT/.github/workflows/ 2>/dev/null
```

PowerShell:

```powershell
gh secret list --repo OWNER/REPO
Select-String -Path OWNER-REPO-LOCAL-CHECKOUT/.github/workflows/* -Pattern 'secrets\.'
```

Cross-check the two by hand: a secret set but never referenced, and a
secret referenced but never set, are both defects — the second only fails
at the point a workflow actually runs and needs it.

## Reading the result

None of the above tells you what a repo *should* have — that depends on
its actual risk level (a flat team-description repo needs very little; a
repo with production code needs real protection). It tells you what it
*has*, so you're not guessing or over-recommending. A repo with nothing
configured isn't automatically a defect — see `skills/github-repo-review`'s
scaffolding baseline table for the "warranted when" judgment call per item,
and don't propose the whole table to a repo that doesn't need it.
