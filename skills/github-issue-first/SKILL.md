---
name: github-issue-first
description: Use in a git repository with a GitHub remote when you notice a bug, gap, stale doc, missing test, CI failure, or other improvement worth doing, file it as a GitHub issue (gh issue create) before fixing it or discussing it at length. Trigger proactively, but file only where you have write or triage permission, and confirm once per repo per session before the first filing. In someone else's repo, use github-contributing instead. Also use when the user asks to prioritize, triage, reprioritize, or map dependencies between existing issues.
---

# GitHub issue-first workflow

**Repository conventions win over this skill's defaults** — labels, branch names, commit style, milestones, assignment, and closing-keyword spelling follow what the repository documents or already does (see `github-issue-first`, "Read the repository's conventions first"). These hold in every repository: no merge, release, or destructive step without the maintainer's approval; no issue closed as completed without recorded evidence for each criterion; the after-merge issue audit; and no secret, confidential content, or security-sensitive finding in public text, which takes the private path in `github-security-response`.

When you're working in a repo and you notice something worth fixing that isn't
the exact thing you were asked to do right now — a bug, a stale doc, a missing
test, a CI failure, a backlog item, anything — the default move is: **file the
issue before you do anything else with it.** Not after you fix it, not only
when the user remembers to ask. The issue tracker is the source of truth for
"things we know about," and if a finding only ever lived in chat, it's gone
the moment the conversation scrolls past. Spotting it is automatic; filing it is gated by the
Preconditions below (permission first, then one confirmation per repo per session).

**When the user asks for the change.** The same gate applies when the change is
the thing you were asked to do ("fix the typo in `team.md`"). Before the first
edit, run the read-only checks in "Scaling ceremony to repo risk" below and
follow the result: a repo with CI, tests, or branch protection gets the full
flow (file the issue under the Preconditions, then branch and pull request); a
clearly low-stakes repo gets one question, asked once, about the full flow or a
lighter touch. A request to fix something is not itself a request to skip the
ceremony; only an explicit "just fix it" is (next paragraph).

The one exception: if the user has explicitly said "just fix it" / "don't
bother filing an issue for this" / equivalent, for this specific thing, skip
the ceremony and just do the work. Read that as scoped to what they said, not
a blanket opt-out for the rest of the session.

## Preconditions

Filing an issue is an outward-facing record, and on a public repo it is public.
Check all three before the first `gh issue create` in a repo:

1. **A GitHub-backed repo.** `git remote -v` shows a `github.com` remote, or
   `gh repo view` succeeds. If there's no GitHub remote (no repo, or a
   non-GitHub host), this workflow doesn't apply; don't invent an issue tracker
   that isn't there. If `gh auth status` isn't logged in, say so and ask before
   proceeding rather than silently skipping.
2. **Permission to file here.** Look at what the viewer can do:

   ```bash
   gh repo view --json viewerPermission,visibility,isFork
   ```

   `viewerPermission` is `ADMIN`, `MAINTAIN`, `WRITE`, `TRIAGE`, or `READ`. File
   only with `TRIAGE` or higher, in a repo the user maintains or belongs to.
   With `READ`, or when the problem is in someone else's upstream repo (including
   a fork you are contributing from), **do not file**. You are an outside
   contributor there: hand off to `github-contributing` and follow that repo's own
   `CONTRIBUTING.md` for how to report it.
3. **Confirm once per repo per session.** The first time in a session you
   would file in a given repo, say where (repo and visibility) and what (the
   title), and get a yes. After that, further issues in that repo this session
   need no new confirmation unless the user says otherwise. Three things already
   count as the confirmation and need no extra question: the user asked you to
   file this issue; the maintainer approved an issue-creation plan
   (`github-repo-review`); or it is the bootstrap issue under
   `github-repo-bootstrap`.

If a precondition fails, put the finding in your reply instead (what, where,
why it matters) and do not file it.

A routine bot dependency pull request (Dependabot, Renovate) needs no issue; one
that needs human work does. `github-hygiene`, "Dependabot pull requests", has the
rule.

| Situation | Permission | What you do |
|---|---|---|
| The user's own repo; you notice a stale doc | `ADMIN` | Confirm once (repo, visibility, title), then file |
| A teammate's private repo where you have triage | `TRIAGE` | Same: confirm once, then file |
| An open-source repo you only cloned; you hit a bug | `READ` | Do not file. Report it the way that repo asks, via `github-contributing` |
| Your fork of someone else's repo; the bug is upstream's | fork (`isFork`) | Do not file. Same hand-off |
| The user says "file an issue for this" | `TRIAGE` or higher | File it; the request is the confirmation |

## Scaling ceremony to repo risk

Not every repo warrants full issue-first ceremony by default. A repo with
no CI, no branch protection, and no code that gets built, deployed, or
tested — a static team-description page, a wiki-style content repo — is
lower-stakes than one with real branch protection and required checks.
These read-only checks show which category a repo falls into, so you don't
assume either way:

```bash
gh repo view --json visibility,defaultBranchRef,deleteBranchOnMerge
gh api repos/{owner}/{repo}/rulesets      # a 403 means plan-gated, not "none"
gh api repos/{owner}/{repo}/actions/workflows --jq '.workflows[].name'
```

No rulesets (and no 403), no workflows, and no tests points to low-stakes.

For a repo that's clearly low-stakes by that check, **ask the maintainer
once, up front**, whether they want the full issue → branch → PR ceremony
or a lighter touch (e.g. direct edits with a clear commit message) — don't
unilaterally decide to skip it, and don't ask again once they've told you
for that repo. Any repo with CI, tests, deployment, or existing branch
protection keeps the default full ceremony without asking; that signal
alone is enough to know it's warranted.

## Read the repository's conventions first

Before the first issue or branch in a repository this session, read how it
already works. Its conventions win over this skill's defaults; the invariants
in the precedence line at the top do not yield.

```bash
git ls-files CONTRIBUTING.md AGENTS.md CLAUDE.md .github/      # documented rules, templates, forms
gh label list --limit 100                                       # its label scheme
gh api "repos/{owner}/{repo}/milestones?state=open" --jq '.[].title'
gh issue list --state all --limit 20 --json number,assignees,milestone --jq '.[] | "#\(.number)\t\(.assignees | length) assignee(s)\t\(.milestone.title // "-")"'
gh pr list --state merged --limit 10 --json headRefName,title,body --jq '.[] | "\(.headRefName)\t\(.title)\t\(.body | split("\n")[0])"'
```

The same lines run unchanged in PowerShell.

Read the documented files first. From the rest, note the label scheme, whether
issues carry milestones and assignees, and the branch names, commit titles and
closing keyword in merged pull requests. Where documented and observed
practice disagree, follow the documented one and say so. A repository with no
conventions gets this skill's defaults.

## Filing a single issue

```bash
gh issue create --title "<short, specific, states the problem not the fix>" --body "<what is wrong, where (file:line), how you found it, what fixing it involves>" --assignee "@me" --label "<priority-label>" --label "<category-label(s)>"
```

The same line runs in PowerShell (keep `"@me"` quoted there).

**Title** states the defect or gap, not the task of fixing it — "Status badge
falls through to the default color" not "Fix badge bug." **Body** gives enough
for someone (including future-you) to act without re-deriving the finding:
what's broken, concrete location, how it was found, rough scope of the fix.

Every actionable issue also carries testable **acceptance criteria**. These are
the issue's completion contract, not an optional checklist. Phrase each criterion
as an observable outcome that can later be supported by a test, CI run, diff,
document, screenshot, or reproducible verification. Investigation and
decision-needed issues use explicit exit criteria for the evidence or decision
they must produce. An issue that arrives through an intake form collecting only
an expected outcome (the `github-repo-configure` forms) gets its criteria at
triage: write them into the issue body before implementation starts.

### Labels

Use the repository's label scheme when it has one (the conventions probe shows
it). In this skill's default scheme, for a repository with none, every issue
carries exactly one priority label and at least one category label; create
only the labels you use, before using them:

```bash
gh label list   # check what already exists first
gh label create P0 --color B60205 --description "Critical bug, security risk, data loss risk, broken build, or production-blocking issue"
gh label create P1 --color D93F0B --description "Important quality, reliability, maintainability, or user-facing improvement"
gh label create P2 --color FBCA04 --description "Valuable enhancement, cleanup, documentation, testing, or developer-experience improvement"
gh label create P3 --color C2E0C6 --description "Nice-to-have polish, future idea, or low-impact improvement"
```

`gh label create` **fails if the label already exists**, which aborts a batch
half-done and makes the bootstrap unsafe to re-run. Use the create-or-update form
when you can't be sure of the starting state:

```bash
gh label create P0 --color B60205 --description "..." 2>/dev/null \
  || gh label edit  P0 --color B60205 --description "..."
```

PowerShell:

```powershell
gh label create P0 --color B60205 --description "..." 2>$null `
  || gh label edit  P0 --color B60205 --description "..."
```

Only overwrite colour/description this way for labels you are bootstrapping. Don't
"correct" the description of a label the repo already curated.

### Milestone

In a repository that uses milestones (the conventions probe shows open
milestones that recent issues are attached to, or its docs say so), every
filed issue also gets a milestone before you move on — not just labels and an
assignee. A repository that does not use milestones is not given one.
`gh issue create` supports `--milestone "<title>"` directly
when you already know which existing milestone the issue belongs to; when
you don't (or the right milestone doesn't exist yet), attach it as a
follow-up instead: `gh issue edit <N> --milestone "<title>"`. Full milestone
conventions (what to name it, when to reuse vs. create, when to close it) live
in `github-releases` — check there rather than improvising a naming scheme.

Priority tiers:
- **P0** — critical bug, security risk, data loss risk, broken build, or production-blocking issue.
- **P1** — important quality, reliability, maintainability, or user-facing improvement.
- **P2** — valuable enhancement, cleanup, documentation, testing, or developer-experience improvement.
- **P3** — nice-to-have polish, future idea, or low-impact improvement.

If a repo already has a different priority label scheme in place when you
start working in it (e.g. an existing `priority-high`/`medium`/`low` set, or
someone else's convention), match what's already there rather than
introducing a second competing scheme — consistency within a repo matters
more than which specific scheme is used. Only switch a repo to P0–P3 if the
user asks for it explicitly.

Category labels depend on the repo, but default to GitHub's common set plus
whatever fits the project's domain: `bug`, `documentation`, `enhancement`,
`testing`, `tooling` (CI/scripts/build), `process` (needs a human owner,
not code), and any project-specific categories you notice recurring (e.g. a
content-heavy repo might want a `backfill` or `content` label, a UI-heavy repo
might want `visualization` or `accessibility`). Reuse an existing label if a
close match already exists rather than creating near-duplicates — check
`gh label list` first.

### Issue types, templates and forms

On an organization repository, set the issue **type** as well as labels. If the
repository has `.github/ISSUE_TEMPLATE/`, fill the fields its templates define
instead of free-forming a body (a non-interactive `--body` bypasses the template).
Read [issue-types-and-templates.md](issue-types-and-templates.md) before setting a
type, or before filing in a repository with templates or forms.

### Assignment

Default to `--assignee "@me"` (it needs `TRIAGE` or higher, which the Preconditions already
require; if `gh` still refuses the assignment, file without it and say so). Follow the
repository's practice instead when it has one — issues left unassigned for a triage
rotation, or an owner rule such as "assign backend issues to X" — and any assignee
convention the user gives you. In a repository that assigns its issues, don't leave
one unassigned — an unassigned finding is easy to lose track of.

## Filing a batch (backlog docs, review passes, multi-finding sessions)

When a single pass turns up many issues at once — converting a TODO list or
backlog doc, running a code review, auditing test coverage — file one issue
per distinct actionable item rather than one giant issue. Granular issues are
individually closeable and trackable; a mega-issue just becomes a second copy
of the doc you started from. Use your judgment on granularity: a doc section
with five tightly-coupled sub-bullets that will obviously be fixed together in
one PR is one issue, not five.

For each issue, reference where it came from in the body (source doc, file
path, or "found during review of X") so the trail back to the original
finding isn't lost.

## Dependencies between issues

Real dependencies come in two flavors, and both are worth surfacing — but
only when they're real, not speculative. Don't invent a dependency to seem
thorough.

1. **Hard blocks** — issue B literally cannot be implemented until issue A
   lands (A adds a library B needs, A defines a schema B consumes, A must be
   merged before B's code even compiles).
2. **Soft/efficiency dependencies** — A and B touch the same files, or B's
   quality depends on A's content being current (a chart built from a doc
   should wait until that doc is updated, or you're just visualizing stale
   data). These aren't blocking in the strict sense but doing them in the
   wrong order means redoing work or shipping something built on the old data.

When you notice either kind (at issue-filing time, or later when the user
asks you to prioritize/organize a backlog), record it **on the issues
themselves**, not only in chat — GitHub issue comments outlive the
conversation and are what future-you (or a teammate) will actually see:

```bash
gh issue comment <B> --body "**Blocked by #<A>.** <why — one sentence>"
gh issue comment <A> --body "**Sequencing note:** do before #<B> — <why>."
```

Cross-reference by issue number so GitHub auto-links them.

### Let dependencies inform priority, not just order

If a low- or medium-priority issue is a hard blocker for several other
issues, its priority should reflect that — bump it up a tier even if its own
content looks minor in isolation, so it doesn't sit at the bottom of the
queue while everything downstream waits on it. A rule of thumb: an issue that
blocks N ≥ 2 other issues is a reasonable candidate for a one-tier bump. When
you bump a priority for this reason, say so in a comment on that issue (see
above) so the reasoning is visible, not just the label change.

Conversely, don't bump an issue's priority tier purely because it's early in
a sequence — sequencing (do A before B) and priority (how urgent/important)
are different axes. Only bump for real blocking fan-out.

## Windows / Git Bash gotcha

In Git Bash on Windows (MSYS), a title or body that *starts* with an absolute-looking
path (`/api/export is broken`) is silently rewritten to a Windows path
(`C:/Program Files/Git/api/...`). Don't start with a bare `/segment` (write
`The /api/export endpoint ...`), or set `MSYS_NO_PATHCONV=1` for that command.

## Sanity check before moving on

After filing a batch, list the open issues back with their labels and
assignee to confirm nothing slipped through unlabeled, or unassigned in a
repository that assigns its issues:

```bash
gh issue list --state open --json number,title,labels,assignees \
  -q 'sort_by(.number) | .[] | "\(.number)\t\(.assignees[0].login)\t\([.labels[].name]|join(","))"'
```

PowerShell:

```powershell
gh issue list --state open --json number,title,labels,assignees `
  -q 'sort_by(.number) | .[] | "\(.number)\t\(.assignees[0].login)\t\([.labels[].name]|join(","))"'
```

If anything comes back without a label the repository's scheme requires (in
the default scheme, a priority and a category label), or without an assignee
where the repository assigns issues, fix it before considering the batch done.

If the repo has a Projects board, the batch is not done until the new issues are
on it — see the `github-projects` skill. Branch/PR conventions for acting on
these issues live in `github-hygiene`, release conventions live in
`github-releases`, and reviewing a PR is `github-pr-review`.

**Security findings are the exception to filing publicly.** An unpatched
vulnerability, an exploitable defect, a committed credential, or a confidential
document pushed to a public repository must not go into a public issue — that is
disclosure. Use `github-security-response` instead.

## Decisions, brainstorming, and what does *not* belong in an issue

Not every durable thought is an issue:

| Thing | Home | Why |
|---|---|---|
| Committed work | **Issue** | Has an assignee, a priority, an end state |
| Open exploration | **Discussion** | Threaded, votable, no "when is this done" |
| A decision that was made | **ADR file in `docs/adr/`** | Immutable record, versioned with the code it constrains |
| A decision that must be made | **Issue labeled `decision-needed`** | It *is* actionable work: someone must decide |

Read [decisions-and-discussions.md](decisions-and-discussions.md) before recording
a decision (an ADR), starting or converting a Discussion, or triaging Discussions.

## Closing issues: the other half of the job

A backlog that only ever grows stops being a source of truth and becomes a
graveyard nobody reads. Filing well is half the discipline; pruning is the other
half. When you touch a repo's issue list — during triage, a review pass, or a
release — check the open issues for these and act:

- **Already fixed.** The code changed and nobody closed the issue. Close it with
  the commit or PR that fixed it: `gh issue close <N> -c "Fixed by #<PR>."`
  First evaluate every acceptance criterion against concrete evidence. Record
  that evidence in a completion comment, then check every satisfied criterion
  using a newline-preserving body file and
  `gh issue edit <N> --body-file <file>`. Close as completed only when every
  in-scope criterion is satisfied and checked. If even one is unmet or
  unevaluated, keep the issue open. A merged PR, green CI, release deadline, or
  tidy-backlog goal is not evidence for criteria it did not evaluate.
- **Scope changed.** Record the decision, rationale, and date on the issue before
  closure. Mark a removed or superseded criterion explicitly; never check it as
  though it was delivered. Deferred work gets a linked follow-up issue and does
  not silently disappear from the original scope.
- **No longer relevant.** The feature was removed, the dependency dropped, the
  approach abandoned. Close with the reason, not silently.
- **Duplicate.** Close the newer one pointing at the older
  (`gh issue close <N> -c "Duplicate of #<M>."`), and move any unique detail into
  the survivor first.
- **Unactionable as written.** Vague or missing context — ask the author for what
  is needed rather than closing outright; close only if nothing comes back and the
  issue can't be acted on by anyone.
- **Stale but still valid.** Don't close it for age. Age is not a reason; an issue
  that is still true stays open. If nothing has happened in a year and it is
  P3, that's a signal the priority was wrong, not that it should vanish.

Never bulk-close to shrink a number, and don't add a stale-bot that closes on a
timer — it destroys real reports and trains contributors that filing is pointless.
Every close carries a reason a human can read.

GitHub closing keywords do not evaluate the issue. Before allowing `Closes #N`
to merge, use `github-hygiene` to perform its acceptance-criteria closure gate.
Use `Refs #N` while any criterion remains unmet or unevaluated; in a repository
whose convention puts a closing keyword in the pull request from the start, keep
it, but do not let that pull request merge until the gate passes.

`Refs #N` avoids a PR-body closing keyword; it does not guarantee the issue
stays open when GitHub has a connected development branch. After every merge,
immediately audit the linked issue state and body. If it is closed while any
in-scope acceptance criterion is unchecked, unmet, or unevaluated, reopen it
immediately and record the reason. For work that spans the PR merge, either use
this audit-and-reopen flow or track the PR-scoped work in a child issue and leave
the release-spanning parent unconnected. Every PR-scoped criterion still needs
evidence before merge.
