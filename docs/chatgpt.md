# ChatGPT (Custom GPT) installation

ChatGPT — the web app, Custom GPTs, and the Assistants/API surface — is a
different kind of consumer than Claude Code, OpenAI Codex CLI, or GitHub
Copilot CLI. Those three discover skills by reading a known local directory
(`~/.claude/skills`, `~/.codex`, `~/.copilot`) every session. ChatGPT has no
such mechanism: there is no local filesystem it reads from, so there is no
"home directory" this installer can install into. See ADR 0006 for the full
reasoning behind the shape below, and why an Actions schema or
documentation-only coverage were rejected.

## What "installing" means here

The closest ChatGPT equivalent to a persistent local skill directory is a
**Custom GPT**: a saved, reusable, shareable assistant configuration with its
own **Instructions** field and up to 20 **Knowledge** files. Once created, it
behaves the way the other three targets do — the skill content is available
every time you use that Custom GPT, without re-pasting anything.

## 1. Export the skill files

From a trusted checkout, always preview first:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target ChatGPT -DryRun
```

Review the reported file list, then export for real:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target ChatGPT
```

This writes **17 files** into `~/chatgpt-skills-export` by default (override
with `-ChatGPTExportPath`) — one per skill, plus extras for the two skills
that carry companion files (`github-repo-review`'s `review-prompt.md`;
`github-repo-configure`'s four bundled templates). Each file is named
`<skill-name>-<relative-path>`, e.g. `github-repo-configure-templates-bug.yml`,
so all 17 sit flat in one folder with no name collisions.
`agents/openai.yaml` sidecars are deliberately excluded — that file is Codex
CLI-specific metadata, not policy content a ChatGPT assistant needs.

17 files is comfortably under ChatGPT's 20-file Knowledge limit today. If a
future skill addition pushes the export past 20, that ceiling needs revisiting
before this stops working — check the exported file count against it.

Re-running the export overwrites the same 17 filenames; add `-Force` if the
export folder already has unrelated content in it (the export never deletes
files it doesn't own — see the script's own behavior for details).

## 2. Create the Custom GPT

In ChatGPT: **Explore GPTs → Create**. Give it a name (e.g. "GitHub Workflow
Skills") and paste this into **Instructions**:

```text
You have access to a set of GitHub workflow skills as uploaded Knowledge
files. Each skill has a narrow trigger — read the matching file(s) before
acting when a request matches its trigger, the same way you'd consult a
policy document before following it:

- github-issue-first: filing a GitHub issue for a bug, gap, or improvement
  before acting on it; prioritizing or triaging an existing backlog.
- github-hygiene: merging a PR, closing an issue, reconciling acceptance
  criteria, or cleaning up branches.
- github-releases: cutting a release, tagging a version, branch protection,
  or milestones.
- github-pr-review: reviewing someone else's pull request.
- github-repo-review: a full repository quality audit or backlog overhaul.
- github-repo-bootstrap: creating a brand-new GitHub repository.
- github-repo-configure: configuring an already-existing repository's
  optional settings (Wiki, Discussions, Projects, labels).
- github-security-response: a committed secret, vulnerability, or security
  alert.
- github-projects: setting up or auditing a GitHub Projects board.
- github-for-ado-users: mapping an Azure DevOps/TFS/Jira concept to GitHub.
- github-for-gitlab-users: mapping a GitLab concept to GitHub.
- github-contributing: submitting a PR to a repository you don't maintain.

When a request doesn't clearly match one trigger, say which skill(s) you
consulted, or ask which situation applies before improvising policy that
isn't in any of the files.
```

## 3. Upload the Knowledge files

In the same Custom GPT editor, under **Knowledge**, upload all 17 files from
the export folder. ChatGPT's own retrieval picks the relevant file(s) when
a conversation matches a skill's trigger — you don't need to reference them
by name.

## 4. Re-export after any skill content change

There's no "reload" step the way Claude/Codex/Copilot CLI have — a Custom
GPT's Knowledge files are static uploads. After pulling a repo update, re-run
the export and re-upload any changed files (ChatGPT lets you replace an
existing Knowledge file without recreating the whole GPT).

## If you don't have Custom GPT access

Custom GPTs need a paid ChatGPT plan. Without one, paste the relevant
`skills/<name>/SKILL.md` content directly into a conversation before asking
about that topic — the content is the same, it just isn't persistent across
conversations. `docs/GUIDE.md` lists what each skill covers so you can find
the right one to paste.
