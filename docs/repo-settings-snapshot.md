# Repo settings snapshot

A checklist for auditing what an *existing* repository actually has configured —
branch protection, community health files, automation — before deciding what to
introduce (a skill, a stricter workflow, agent assistance). Run this before
recommending `github-issue-first`'s full ceremony, a ruleset, or anything else
on top of a repo you don't already know well. Nothing here writes anything.

Most commands need only read access to the target repository. Two do not, and
their headings say **needs admin or collaborator access**: classic branch
protection and the secrets list. Where you lack the access, a command either
fails or gives an answer that looks like "nothing there", so read "Reading the
answers" before you record a result.

## Before you start: the default branch

Do not assume the default branch is `main`. Ask the repository, and use the
result wherever a command below needs a branch.

```bash
BRANCH=$(gh repo view OWNER/REPO --json defaultBranchRef --jq .defaultBranchRef.name)
echo "$BRANCH"
```

PowerShell:

```powershell
$branch = gh repo view OWNER/REPO --json defaultBranchRef --jq .defaultBranchRef.name
$branch
```

## Reading the answers

The same silence can mean different things, so record which one you got.
Observed on 2026-10-09 with `gh`, as a user with no write access to a public
repository and as the admin of another repository; the wording of the messages
can change.

- **Output, status 200:** the setting or file exists; read it.
- **`404` with `Branch not protected`:** confirmed, there is no classic
  protection on that branch.
- **`404` with a plain `Not Found` on the classic protection command:** you
  cannot tell. It may be unprotected, or you may lack the access to see it.
- **`404` with a plain `Not Found` on a file:** the file is not at that path.
- **`403` with `Upgrade to GitHub Pro or make this repository public`:** a plan
  constraint, not evidence the repo lacks protection by choice.
- **`403` with `You must have repository read permissions or have the
  repository secrets fine-grained permission`, on the secrets list:** you lack
  the access, so the secrets are not shown to you. It is not "no secrets".
- **Empty output and exit code 0 (for example `gh ruleset list`):** ambiguous.
  Either none are configured or they are not visible to you; ask with `gh api`
  to see a status.
- **A `5xx` error or a timeout:** unavailable. Retry later and record no
  answer.

## Core settings (needs read access)

```bash
gh repo view OWNER/REPO --json visibility,defaultBranchRef,deleteBranchOnMerge,hasIssuesEnabled,hasProjectsEnabled,hasWikiEnabled
```

## Branch protection

Modern rulesets first; classic protection is a fallback most repos no longer use,
but still worth checking if rulesets comes back empty.

### Rulesets (needs read access)

```bash
gh api repos/OWNER/REPO/rulesets --jq '.[] | {name, target, enforcement}'
gh api repos/OWNER/REPO/rulesets/RULESET_ID   # full detail, once you have its id
```

A private repo on GitHub Free returns `403 Upgrade to GitHub Pro or make this
repository public` for rulesets and for classic protection — that's a plan
constraint, not evidence the repo lacks protection by choice. `gh ruleset list`
prints nothing and exits 0 in that situation too, which looks identical to "none
configured" — don't conflate the two.

### Classic protection (needs admin or collaborator access)

Only if the rulesets are empty. Use the default branch from the top of this page.

```bash
gh api "repos/OWNER/REPO/branches/$BRANCH/protection" --jq keys
```

PowerShell:

```powershell
gh api "repos/OWNER/REPO/branches/$branch/protection" --jq keys
```

The command lists which classic protections are configured; leave off `--jq keys`
for their full settings. Only the `Branch not protected` message is a confirmed
absence; a plain `Not Found` means you may not be allowed to see the answer (see
"Reading the answers").

## Community health files (needs read access)

```bash
gh api repos/OWNER/REPO/community/profile --jq '{health_percentage, files}'
```

Returns which of README/LICENSE/CODE_OF_CONDUCT/CONTRIBUTING/SECURITY/issue
templates/PR template exist. A present-but-boilerplate file (an unedited
SECURITY.md with a fictitious version table, for instance) still counts as
"present" here — this command tells you existence, not quality; read the
file if the percentage looks suspiciously high for how mature the repo
otherwise seems.

## CODEOWNERS (needs read access)

GitHub looks for a `CODEOWNERS` file in `.github/`, then the repository root,
then `docs/`, and uses the first one it finds. Probe all three: a repository can
keep the file in `.github/` and have none in the root, and a root-only check
would then report "no CODEOWNERS" wrongly.

```bash
for path in .github/CODEOWNERS CODEOWNERS docs/CODEOWNERS; do
  echo "== $path"
  gh api "repos/OWNER/REPO/contents/$path" --jq .path || true
done
```

PowerShell:

```powershell
foreach ($path in '.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS') {
  "== $path"
  gh api "repos/OWNER/REPO/contents/$path" --jq .path
}
```

A path that prints itself exists; a plain `Not Found` means the file is not
there. For code owners to receive review requests the file must be on the pull
request's base branch, so this reads the default branch, which is the right one
for most repos.

## Labels, milestones, and existing automation (needs read access)

```bash
gh label list --repo OWNER/REPO
gh api repos/OWNER/REPO/milestones?state=all --jq '.[] | {number, title, state}'
gh api repos/OWNER/REPO/actions/workflows --jq '.workflows[] | {name, path, state}'
```

## Secrets referenced vs. actually set (needs admin or collaborator access)

Only meaningful if you have the access: without it the secrets list returns `403`
rather than an empty list, so a `403` is not "no secrets".

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
