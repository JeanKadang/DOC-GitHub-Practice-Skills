# ChatGPT (Custom GPT) installation

ChatGPT — the web app, Custom GPTs, and the Assistants/API surface — is a
different kind of consumer than Claude Code, OpenAI Codex CLI, or GitHub
Copilot CLI. Those three discover skills by reading a known local directory
(`~/.claude/skills`, `~/.codex`, `~/.copilot`) every session. ChatGPT has no
such mechanism: there is no local filesystem it reads from, so there is no
"home directory" this installer can install into. See ADR 0006 for the full
reasoning behind the shape below, and why an Actions schema or
documentation-only coverage were rejected.

## Availability: read this first

Custom GPTs are being retired, so check which route you can use before you
export anything.

- **You can create or edit a Custom GPT today:** sections 1 to 4 below work
  until the retirement date. Plan to migrate.
- **Your workspace no longer allows new Custom GPTs, or you have no access:**
  paste the relevant `SKILL.md` content into a conversation (see the last
  section). It works on any account and does not depend on Custom GPTs.
- **Custom GPTs have retired:** use the paste route. If you migrated your GPT
  to a plugin, re-export (section 1) and re-upload the changed files to its
  reference files. That route is untested.

**What has been announced.** OpenAI's help center article
[Custom GPT retirement and migration FAQ](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq)
gives **2026-12-11** as the date Custom GPTs retire, and **2027-02-11** for
affected Enterprise workspaces with an approved deferral. It describes the
replacement as plugins: a GPT's instructions become a skill, its Knowledge files
are copied into the plugin's reference files, and Custom Actions do not
transfer. Where migration is available for an account, it starts from **My GPTs**
with **Migrate to plugin**, and the new plugin starts private. Earlier secondary
reporting also gave a schedule for affected Enterprise workspaces (new creation
reported to end around 2026-10-26); that date was not in the excerpt of OpenAI's
page that was read, so treat it as reported only.

**How far to trust this.** Checked on 2026-10-07. OpenAI's help center refuses
automated fetches (HTTP 403), so the dates above come from an excerpt of the
article returned by a web search, not from reading the page, and the earlier
secondary reports ([Virtualization Review](https://virtualizationreview.com/articles/2026/09/28/openai-to-retire-custom-gpts-replace-them-with-plugins.aspx)
and [ADTmag](https://adtmag.com/articles/2026/09/28/openai-custom-gpt-retirement-puts-integrations-on-the-migration-checklist.aspx))
agree with them. Open the FAQ in a browser to confirm the current dates and
your own account's or workspace's options before relying on them. Which plans
can create a Custom GPT or a plugin today is not stated in anything checked
here, and the community reports mixed access for personal accounts.

**What has not been tested.** This walkthrough has not been re-run in ChatGPT
since the retirement was announced, and no skill from this repository has been
loaded as a ChatGPT skill. Treat both as unverified.

## The plugin and skills route

OpenAI's developer documentation
([Build skills](https://developers.openai.com/plugins/build/skills), checked
2026-10-07) says a ChatGPT skill is a folder with a `SKILL.md` at its root, with
`name` and `description` in its frontmatter, and optional `references/`,
`assets/` and `scripts/` folders. A plugin points at its skills with
`"skills": "./skills/"`, and skills reach ChatGPT by upload when a plugin is
submitted, or by an MCP import. The same page does not state which plans or
workspaces can do this, or any file-size or file-count limits.

That is the same shape as this repository's `skills/<name>/` directories, so
the likely replacement for the flattened Custom GPT export is to upload those
folders as they are. This is **a reading of the documentation, not a result**:
nobody has loaded these skills in ChatGPT, whether `agents/openai.yaml` is
ignored there is unknown, and eligibility is unknown. Until that is tested, the
Custom GPT route (while it exists) and the paste route stay the documented ones,
and ADR 0006 stands.

To test it, someone with an eligible workspace can try the smallest case:

1. Take one skill folder, for example `skills/github-issue-first/`, as it is in
   a trusted checkout.
2. Add it to a plugin as a skill, using the route their workspace offers.
3. Start a chat that should trigger it ("I found a bug in my repo, what do I
   do first?") and note whether the skill is used, which files were uploaded,
   what worked and what did not.
4. Record the result, with the date, on issue #227. A working result is the
   evidence for a superseding ADR for ADR 0006.

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
The export also writes `LICENSE` (the licence text, for attribution) and
`manifest.json`: the package version, the source commit when available, and
for every file its original path and SHA-256. The manifest is the
original-to-exported name map. For example, `review-prompt.md` inside
`github-repo-review` is exported as `github-repo-review-review-prompt.md`,
even though the skill text still calls it `review-prompt.md`. Upload the 17
skill files. `LICENSE` and `manifest.json` are for provenance; if you upload
them too the total is 19.

`agents/openai.yaml` sidecars are deliberately excluded — that file is Codex
CLI-specific metadata, not policy content a ChatGPT assistant needs.

17 files is comfortably under ChatGPT's 20-file Knowledge limit today. If a
future skill addition pushes the export past 20, that ceiling needs revisiting
before this stops working — check the exported file count against it.

Re-running the export needs no `-Force`. The script reads the previous
`manifest.json` to learn which files it owns: it overwrites those, removes
any it listed before that the source no longer has, and prints what
changed, for example `changed: github-issue-first-SKILL.md` or
`removed: <file>`, plus a count of unchanged files. A folder with files the
export does not own (including an export made before manifests existed)
is refused without `-Force`; with `-Force` those files are left alone and
never deleted. `-DryRun` shows the same comparison without writing.

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
the export and re-upload only the files it reports as `added` or `changed`,
and delete the ones it reports as `removed` from the GPT's Knowledge
(ChatGPT lets you replace an existing Knowledge file without recreating the
whole GPT).

## If you don't have Custom GPT access

Creating a Custom GPT has required a paid plan or an eligible workspace, and
Custom GPTs are retiring (see "Availability" above). If you cannot create one,
or after they retire, paste the relevant `skills/<name>/SKILL.md` content
directly into a conversation before asking about that topic. The content is the
same; it just is not persistent across conversations. `docs/GUIDE.md` lists what
each skill covers so you can find the right one to paste.
