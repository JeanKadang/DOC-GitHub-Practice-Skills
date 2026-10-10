# Platform compatibility record

A dated record of what has actually been checked against each tool that is meant
to consume these skills, and what has not. It exists so a support claim never
rests on "the installer copies the files". Last updated 2026-10-10.

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
| GitHub Copilot CLI | 1.0.95 | **Verified** 2026-10-10 |
| GitHub Copilot in VS Code | not checked | **Unverified** |

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

### GitHub Copilot CLI

Checked 2026-10-10 with version 1.0.95 and the twelve skills from `main`.

- **Install path:** `~/.copilot/skills`. The check used `-CopilotHome` and the
  `COPILOT_HOME` variable with a throwaway folder, so the real home was not
  changed.
- **Discovery result:** with `COPILOT_HOME` set to that folder,
  `copilot skill list --json` listed all 12 `github-*` skills with source
  `personal-copilot` and the current wording. In the real home it listed the
  `github-*` skills from `~/.agents/skills`, an older v0.2.0 install, because
  `~/.copilot/skills` does not exist there.
- **Sample invocation:** not run. The account's monthly Copilot quota was used
  up and no other model was available, so no model call succeeded.
- **Update check:** `-Target Copilot -DryRun` over a v0.2.0 install reported an
  upgrade from v0.2.0 to v0.3.0 for 10 skills and a new install for 2, and over
  its own fresh install it reported "already current". Over a v0.3.0 install it
  fails with a false "modified: hash mismatch", tracked in #304, because `main`
  still carries the version string `0.3.0`.

### Copilot in VS Code

- **Copilot in VS Code:** the reload step in [vscode.md](vscode.md) is marked
  "needs verification" and has not been confirmed in a real session. It needs
  the VS Code interface, so it is still **Unverified**.

ChatGPT is not a supported platform; the Custom GPT export was removed (see
[ADR 0016](adr/0016-retire-the-chatgpt-route.md)).

The Claude Code and Codex personal-scope checks were made against an older
install of the skills than the current release. The update check is the evidence
that an upgrade is offered and safe, not that the new version has been loaded.
The Copilot CLI check used the current skills.

## Repository and cloud scope

A skill installed in a user's home is not seen by an agent running somewhere
else. These surfaces read skills from a repository, or run on a machine without
the user's home directory, so the rows above say nothing about them. This
installer does not write any of these locations.

| Surface | Status |
| --- | --- |
| Claude Code, project skills | **Verified** 2026-10-10 |
| Claude Code on the web (cloud sessions) | **Unverified** |
| OpenAI Codex, project skills | **Verified** 2026-10-10 |
| GitHub Copilot CLI, project skills | **Verified** 2026-10-10 |
| Copilot cloud agent and code review | **Unverified** |

Copilot reads repository skills from `.github/skills`, `.claude/skills`, or
`.agents/skills` ([Copilot](copilot.md)); a per-repository install is a
separate decision outside this tool's scope.

The three verified rows were checked on 2026-10-10 in a throwaway repository
that held the twelve skills from `main`:

- **Claude Code 2.1.292:** with `--setting-sources project`, the session's skill
  list showed all 12 from `.claude/skills`, and the scenario runs in
  [skill-scenarios.md](skill-scenarios.md) loaded them.
- **OpenAI Codex 0.161.0:** `codex debug prompt-input "hello"` listed a skill
  root for the repository's `.agents/skills` and all 12 skills from it with the
  current wording. It also listed older copies from `~/.codex/skills` and
  `~/.agents/skills`, so a skill could appear up to three times.
- **GitHub Copilot CLI 1.0.95:** `copilot skill list --json` listed all 12 from
  `.github/skills` with source `project`.

Nothing was checked for a coding agent or a code review that runs on GitHub.

## Re-running a check

Each check reads or lists; none changes an installed skill.

- **Claude Code:** start a session after installing, look for the skills in its
  skill list, then invoke one. Preview an upgrade with
  `pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Claude -DryRun`.
- **OpenAI Codex:** `codex debug prompt-input "hello"` prints the skills Codex
  would give the model, without calling it. Preview with `-Target Codex -DryRun`.
- **GitHub Copilot CLI:** `copilot skill list --json` lists every skill it found
  and the source of each. Set `COPILOT_HOME` to a throwaway folder to test an
  install without touching your own. In a running session, `/skills reload`
  picks up new skills ([Copilot](copilot.md)). Preview with `-Target Copilot
  -DryRun`.
- **Anything else:** add a row with the version, what the tool showed, one
  sample invocation, and the update check, and date it.

When a row is checked, change its status and date here in the same pull request
that records the evidence, and say which machine and operating system it was.
