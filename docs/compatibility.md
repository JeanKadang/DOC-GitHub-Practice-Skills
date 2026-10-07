# Platform compatibility record

A dated record of what has actually been checked against each tool that is meant
to consume these skills, and what has not. It exists so a support claim never
rests on "the installer copies the files". Last updated 2026-10-05.

Two kinds of evidence are kept apart:

- **File-byte evidence.** The installer tests (run in CI) show the right files
  land in the right directory. They say nothing about whether a tool finds them.
- **Consumer-recognition evidence.** The tool itself lists or loads the skill.
  Only this shows a skill works for a user, so a row is "Verified" only with it.

A row is **Verified** with a date, **Verified earlier** when it was checked on an
older version and not repeated, or **Unverified** when nobody has checked it.
Unverified is not "broken": it means the claim in the docs is not backed by a
test yet. Re-check a row after a major tool upgrade.

## Personal scope

Skills installed in the user's home by `install-skills.ps1`. Checked on
Windows 11 (10.0.22631) with Node 26.10 and PowerShell 7.6.

| Tool | Version | Status |
| --- | --- | --- |
| Claude Code (CLI) | 2.1.286 | **Verified** 2026-10-05 |
| OpenAI Codex (CLI) | 0.160.0 | **Verified** 2026-10-05 |
| GitHub Copilot CLI | not installed | **Unverified** |
| GitHub Copilot in VS Code | not checked | **Unverified** |
| ChatGPT (Custom GPT, or plugin skills) | not applicable | **Unverified** |

### Claude Code

- **Install path:** `~/.claude/skills`.
- **Discovery result:** the session's skill list showed the 10 `github-*` skills
  installed there (an older v0.2.0 install).
- **Sample invocation:** the Skill tool loaded `github-for-ado-users` from
  `~/.claude/skills/github-for-ado-users`.
- **Update check:** `-Target Claude -DryRun` reported an upgrade from v0.2.0 to
  v0.3.0 for 10 skills and a new install for 2, with no `-Force` and no backup.

### OpenAI Codex

- **Install path:** `~/.codex/skills` (the installer's default) and
  `~/.agents/skills` (the path OpenAI documents). See
  [OpenAI Codex](openai-codex.md) for the 0.159.3 check of both paths.
- **Discovery result:** `codex debug prompt-input "hello"` listed the 10
  installed `github-*` skills. Eight appeared twice because they are installed
  in both places, as the Codex guide warns.
- **Sample invocation:** the entries in that output name the `SKILL.md` Codex
  will read. No skill was run against a model.
- **Update check:** `-Target Codex -DryRun` reported an upgrade from v0.1.0 to
  v0.3.0 for the 8 skills in `~/.codex/skills` and a new install for 4.

### GitHub Copilot CLI, Copilot in VS Code, ChatGPT

- **Copilot CLI:** installs to `~/.copilot/skills`. Not installed on the
  checking machine, so nothing was checked.
- **Copilot in VS Code:** the reload step in [vscode.md](vscode.md) is marked
  "needs verification" and has not been confirmed in a real session.
- **ChatGPT:** there is no install; `-Target ChatGPT` exports files. Nothing was
  tried in a real workspace (see [ChatGPT](chatgpt.md)).

The Claude Code and Codex checks were made against an older install of the
skills than the current release. The update check is the evidence that an
upgrade is offered and safe, not that the new version has been loaded.

## Repository and cloud scope

A skill installed in a user's home is not seen by an agent running somewhere
else. These surfaces read skills from a repository, or run on a machine without
the user's home directory, so the rows above say nothing about them. This
installer does not write any of these locations.

| Surface | Status |
| --- | --- |
| Claude Code, project skills (`.claude/skills`) | **Unverified** |
| Claude Code on the web (cloud sessions) | **Unverified** |
| OpenAI Codex, project skills (`.agents/skills`) | **Unverified** |
| Copilot cloud agent and code review | **Unverified** |

Copilot reads repository skills from `.github/skills`, `.claude/skills`, or
`.agents/skills` ([Copilot](copilot.md)); a per-repository install is a
separate decision outside this tool's scope.

## Re-running a check

Each check reads or lists; none changes an installed skill.

- **Claude Code:** start a session after installing, look for the skills in its
  skill list, then invoke one. Preview an upgrade with
  `pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Claude -DryRun`.
- **OpenAI Codex:** `codex debug prompt-input "hello"` prints the skills Codex
  would give the model, without calling it. Preview with `-Target Codex -DryRun`.
- **GitHub Copilot CLI:** install with `-Target Copilot`, then use
  `/skills reload` in the session and check the skills appear
  ([Copilot](copilot.md)). Record the version and the result here.
- **Anything else:** add a row with the version, what the tool showed, one
  sample invocation, and the update check, and date it.

When a row is checked, change its status and date here in the same pull request
that records the evidence, and say which machine and operating system it was.
