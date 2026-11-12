---
name: github-security-response
description: Use when a security problem is found in a GitHub repo — a credential or key committed to history, a confidential or private document (an assessment, customer or personal data, internal policy) pushed to a public repo or pull request, a Dependabot or code-scanning alert to triage, a vulnerability reported by a user, or a repo that needs a private reporting channel and SECURITY.md. Also use before publishing a fix for a vulnerability, since the ordinary public issue-and-PR flow leaks it.
---

# Security response

**Repository conventions win over this skill's defaults** — labels, branch names, commit style, milestones, assignment, and closing-keyword spelling follow what the repository documents or already does (see `github-issue-first`, "Read the repository's conventions first"). These hold in every repository: no merge, release, or destructive step without the maintainer's approval; no issue closed as completed without recorded evidence for each criterion; the after-merge issue audit; and no secret, confidential content, or security-sensitive finding in public text, which takes the private path in `github-security-response`.

The normal flow — file a public issue, open a PR, discuss in the open — is wrong
for vulnerabilities. A public issue for an unpatched bug is a disclosure. This
skill covers what to do instead. `github-issue-first` still governs everything
that is *not* security-sensitive.

**Triage rule:** if exploiting the finding requires only information already in
the public repo, treat it as private until a fix ships.

## A secret was committed

Order matters and the intuitive order is wrong. **Rotate first.** The credential
is compromised from the moment it was pushed; history rewriting is cleanup, not
containment.

1. **Rotate/revoke the credential** at its source — the cloud provider, the
   registry, the API vendor. Assume it is already scraped: public repos are
   scanned by bots within seconds.
2. **Confirm the blast radius**: what did the credential access, and do those
   logs show unexpected use? Record the finding before touching history.
3. **Remove it from the working tree** and land that fix normally.
4. **Then decide about history.** Rewriting (`git filter-repo`, or GitHub's
   support for large purges) breaks every clone and fork, and does not remove the
   blob from forks or from anyone's local copy. For a rotated credential it is
   often not worth it. For personal data or a customer's key, it usually is.
   **Rewriting history is a destructive, coordinated operation — get the
   maintainer's explicit go-ahead, never do it unprompted.**
5. **Prevent recurrence**: enable push protection and secret scanning
   (`Settings → Code security`), and add the file pattern to `.gitignore`.

```bash
# Is scanning even on? (needs admin)
gh api repos/{owner}/{repo} --jq '.security_and_analysis'
```

Never paste the secret, or any part of it, into an issue, a PR body, a commit
message, or chat while reporting it: not the value, not a prefix or fragment, and
not its identifier (an access key ID, a username, a token's visible prefix). That
holds even when it looks like a documentation example or a placeholder; say you
think it is one, and why, without repeating it. Reference where it was (file and
line), not what it was.

## A confidential document was pushed

Not every leak is a secret. An assessment, a customer document, personal data, or
internal policy pushed to a public repository has nothing to rotate, and secret
scanning does not detect it. If the document *contains* a credential, do the
secret steps above first; then continue here. The order still matters: stop the
spread before cleaning up.

1. **Stop the spread.** Do not link, quote, or name the file, its contents, the
   commit, or the pull request in any public issue, comment, commit message, or
   pull request body. A comment that closes the pull request says it was
   superseded, nothing more.
2. **Contain it on GitHub.** Find every branch and commit that carries it, close
   any open pull request that includes it, delete those branches, and list forks:

   ```bash
   git fetch origin --prune
   git log --all --oneline -- <path>               # every commit that touches it
   git branch -r --contains <commit-sha>           # every branch that carries it
   gh api repos/{owner}/{repo}/forks --jq '.[].full_name'
   ```

   Closing a pull request and deleting a branch are reversible, but deleting a
   branch is still a destructive step: confirm with the maintainer first. Neither
   removes the data: the pull request's `refs/pull/<N>/head` ref is read-only, and
   the commits stay reachable by their SHA and through any pull request that
   references them.
3. **Notify the data owner and record the incident privately**, in the owner's
   own incident process, not in this repository's issues: what was exposed, from
   when to when, on which branches and pull requests.
4. **Ask GitHub Support, through the support portal, to remove what you cannot.**
   Support can dereference or delete the affected pull requests, remove cached
   views, and run garbage collection. Give the repository, the pull request
   numbers, and the first commit SHAs there, privately. Support's cleanup applies
   only when no fork still references the data: a fork keeps it, and you must
   contact its owner yourself.
5. **Rewrite history only with the maintainer's explicit go-ahead**, and only if
   the document reached a branch that stays (for example the default branch).
   Use `git filter-repo --sensitive-data-removal`, then follow step 4 for what the
   rewrite leaves behind.
6. **Prevent recurrence**: the scope check before every push and pull request in
   `github-hygiene`, `.gitignore` rules for the folders such documents live in,
   and the baseline in `github-repo-configure` for push protection across
   repositories.

GitHub's behaviour above (read-only pull request refs, cached views, what Support
removes, forks) is from GitHub's "Removing sensitive data from a repository"
documentation, checked 2026-11-12.

## Private reporting and advisories

Public issues are the wrong channel. Enable **private vulnerability reporting**
(`Settings → Code security → Private vulnerability reporting`) so researchers have
somewhere to go, and add a `SECURITY.md` that says where to report, what is in
scope, and the expected response time.

**A boilerplate `SECURITY.md` with a fictitious supported-versions table is worse
than none** — it tells a reporter you don't read it. Fill it in or delete it.

Fix development happens in a **temporary private fork** off the advisory, not on a
branch of the public repo — a branch name like `fix/auth-bypass` plus a public CI
run is disclosure by inference.

```bash
gh api repos/{owner}/{repo}/security-advisories --jq '.[] | "\(.ghsa_id)\t\(.state)\t\(.summary)"'
```

Publish the advisory when the fix ships, with the affected version range and the
patched version — the advisory is what feeds downstream Dependabot alerts. Credit
the reporter unless they asked otherwise.

## Triaging Dependabot and code-scanning alerts

```bash
gh api repos/{owner}/{repo}/dependabot/alerts --jq \
  '.[] | select(.state=="open") | "\(.security_advisory.severity)\t\(.dependency.package.name)\t\(.security_advisory.summary)"'
gh api repos/{owner}/{repo}/code-scanning/alerts --jq \
  '.[] | select(.state=="open") | "\(.rule.security_severity_level)\t\(.rule.id)\t\(.most_recent_instance.location.path)"'
```

PowerShell:

```powershell
gh api repos/{owner}/{repo}/dependabot/alerts --jq `
  '.[] | select(.state=="open") | "\(.security_advisory.severity)\t\(.dependency.package.name)\t\(.security_advisory.summary)"'
gh api repos/{owner}/{repo}/code-scanning/alerts --jq `
  '.[] | select(.state=="open") | "\(.rule.security_severity_level)\t\(.rule.id)\t\(.most_recent_instance.location.path)"'
```

Severity is not priority. Judge each alert on **reachability**:

| Situation | Treatment |
|---|---|
| Vulnerable code path is actually called, in production | P0 — fix now |
| Vulnerable package present but the affected function is never reached | P1/P2 — upgrade on the normal cycle, note the reasoning on the issue |
| Dev-only dependency (test runner, build tool, linter) | P2 — real but not production-facing |
| Transitive dependency with no fixed version yet | Investigation issue; pin or note the exposure, don't leave it silently open |

**Dismissing an alert requires a reason recorded on the alert**, not silence — a
dismissed-without-comment alert is indistinguishable from one nobody looked at.
Never dismiss in bulk to clear a dashboard.

Alerts that are *not* sensitive to disclose (an outdated dev dependency, a
false positive to suppress) go through the ordinary public issue flow. Only
unpatched, exploitable findings stay private. The Dependabot *pull requests* that
fix alerts are handled like any other dependency update: see `github-hygiene`,
"Dependabot pull requests".

## Hardening the repo itself

Findings that belong in every audit (`github-repo-review` Phase 2 covers the
detection; this is the response):

- **Explicit least-privilege `permissions:`** in every workflow — an absent block
  inherits the repo default, often write-all.
- **`pull_request_target` + checkout of PR head is the exfiltration path.** If you
  find one, treat it as a P0.
- **Pin third-party actions to a commit SHA**, not a mutable tag.
- **Secrets never interpolated into `run:` strings** where they land in logs.
- **Branch protection on the default branch** with required checks and review.
  For a floor across many repositories (push protection, CodeQL, exceptions with
  an expiry), see the baseline in `github-repo-configure`.
- **Self-hosted runners on a public repo** let any fork PR run code on your
  machine — a finding in its own right.

## Common mistakes

| Mistake | Fix |
|---|---|
| Rewriting history before rotating the key | Rotate first — the key is burned the moment it is pushed |
| Filing a public issue for an unpatched vulnerability | Private advisory + temporary private fork |
| Quoting the secret in the issue or commit that reports it | Reference the location, never the value |
| Assuming a history rewrite makes the secret gone | Forks and clones keep it; rotation is what matters |
| Closing a leaked pull request with a comment that names the file | Say "superseded"; give details only to Support and the data owner, privately |
| Assuming a deleted branch removed a confidential document | The pull request ref, cached views, and SHAs remain; ask GitHub Support |
| Rewriting shared history without asking | Destructive and coordinated — maintainer decides |
| Treating CVSS severity as priority | Judge reachability; record the reasoning on the issue |
| Bulk-dismissing alerts | Dismiss individually, with a recorded reason |
| Leaving a boilerplate SECURITY.md in place | Fill it in or delete it |
| A branch named `fix/<vuln>` on the public repo | Discloses by inference before the fix ships |
