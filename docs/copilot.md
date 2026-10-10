# GitHub Copilot CLI installation

GitHub Copilot's Agent Skills mechanism is an open standard shared with
Anthropic's `SKILL.md` format. GitHub's documentation says Copilot CLI, VS Code
and JetBrains agent mode, Copilot cloud agent, and Copilot code review all
discover skills the same way Claude does. Only the Copilot CLI has been checked
here, on 2026-10-10; the other surfaces are unverified (see the
[compatibility record](compatibility.md)). This repository's canonical
`skills/<name>/SKILL.md` files need no translation: Copilot reads the same file
Claude reads, and ignores `agents/openai.yaml` exactly as Claude does.

Copilot looks for **personal** (user-level) skills under `~/.copilot/skills`
(and `~/.agents/skills`, which Codex also reads; a skill installed in both
places can be listed twice) and **project** (repository-level) skills under
`.github/skills`,
`.claude/skills`, or `.agents/skills` in a given repo. This installer only
manages the personal, user-level location — the same "install into your AI
tool's home directory" model already used for Codex and Claude. It does not
write project-level skills into any other repository; that is a separate,
per-repository decision outside this tool's scope.

The installer uses `-CopilotHome` when supplied. Otherwise it discovers the
home from `COPILOT_HOME`, then defaults to the current user's `.copilot`
directory. Skill packages are installed beneath that home's `skills`
directory.

From a trusted checkout, always preview first:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 `
  -Target Copilot -DryRun
```

Review the source, target, twelve skills, overwrite decisions, and backup paths.
Then install:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Copilot
```

Upgrading over an unmodified earlier install of this package needs no
`-Force` and makes no backup: the installer recognizes its own marker and
replaces the skill in place. Reinstalling the same release changes nothing.
`-Force` is for a skill you changed locally (or an untracked directory): it
backs the whole directory up first. Add `-KeepBackups N` to keep only the
newest N backup sets under `skill-backups`. It is also what you need when you
install from an unreleased `main` over an install of the same version: the
installer then reports that the installed copy matches its own marker but
differs from the source, and it cannot tell that from an edited marker.

Installed skill directories belong to the installer, which tracks them with a
marker file. A file you add inside `skills/<name>/` counts as a local
modification: the installer refuses to reinstall that skill without `-Force`,
and with `-Force` the whole directory, including your file, is backed up
first. Keep personal notes outside the installed skill directories.

Use an explicit home for isolated testing:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 `
  -Target Copilot -CopilotHome C:\path\to\copilot-home -DryRun
```

`-Target Both` still means Codex and Claude only, for backward compatibility;
installing all three currently means running the installer twice (`-Target
Both` and `-Target Copilot`). Inside an active Copilot CLI session, run
`/skills reload` to pick up newly installed skills without restarting.
