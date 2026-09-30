# GitHub Cheat Sheet

One page. Keep this open in a tab while you work.

## The loop, every time

**Issue → branch → commit → PR → review → merge → issue closes.**

## Doing it in the web UI (no command line needed)

| Action | Where |
| --- | --- |
| File an issue | Repo → **Issues** tab → **New issue** |
| Create a branch from an issue | On the issue page → **Create a branch** |
| Edit a file on your branch | Navigate to the file → pencil icon → make sure your branch is selected before committing |
| Open a PR | After committing to a branch, GitHub offers **Compare & pull request** |
| Review a PR | PR page → **Files changed** tab → leave a comment, or **Review changes** → Approve/Request changes/Comment |
| Merge a PR | PR page → **Merge pull request** (only after it's approved and CI is green) |

## Doing it from the command line (once you're comfortable)

| Action | Command |
| --- | --- |
| Clone a repo | `git clone <url>` |
| Create a branch **linked to an issue** (preferred) | `gh issue develop <N> --name <branch-name> --base main --checkout` |
| Create and switch to a branch (no issue link — add `Refs #N` to the PR body yourself) | `git checkout -b <branch-name>` |
| See what's changed | `git status` |
| Stage and commit | `git add <file>` then `git commit -m "message"` |
| Push a new branch | `git push -u origin <branch-name>` |
| File an issue | `gh issue create --title "..." --body "..." --assignee "@me"` |
| Open a PR | `gh pr create --title "..." --body "Refs #N"` |
| Check PR CI status | `gh pr checks <N>` |

## This team's conventions

- **Work starts with an issue.** Even small things. If it's not filed, it's not tracked.
- **`Refs #N`** in a PR body = "progress on N, not necessarily done." **`Closes #N`** = "merging this closes N." Only switch to `Closes` once every acceptance criterion is met.
- **After every merge, check the linked issue.** GitHub can auto-close it early via a connected branch even when the PR only said `Refs` — if that happened while a criterion was unmet, reopen it and say why.
- **One branch per issue.** Branch from an up-to-date `main`. Never commit directly to `main`.
- **A milestone is a release bucket**, not a sprint. It answers "what ships next," nothing else.
- **Approving a PR is not merging it.** They're separate decisions, even when the same person makes both.

## Where to go deeper

- `skills/github-issue-first/SKILL.md` — filing and triaging issues
- `skills/github-hygiene/SKILL.md` — PR flow and the closure gate
- `skills/github-pr-review/SKILL.md` — reviewing someone else's PR
- `skills/github-releases/SKILL.md` — milestones, rulesets, releases
- `skills/github-security-response/SKILL.md` — secrets and vulnerabilities
