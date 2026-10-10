# Claude installation

Claude consumes the same canonical `skills/<name>/SKILL.md` files as OpenAI
Codex. It ignores `agents/openai.yaml`; no Claude-specific policy fork exists.

The installer uses `-ClaudeHome` when supplied. Otherwise it discovers the home
from `CLAUDE_HOME`, then defaults to the current user's `.claude` directory.
Skill packages are installed beneath that home's `skills` directory.

From a trusted checkout, always preview first:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 `
  -Target Claude -DryRun
```

Review the source, target, twelve skills, overwrite decisions, and backup paths.
Then install:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Claude
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
  -Target Claude -ClaudeHome C:\path\to\claude-home -DryRun
```

Restart Claude or trigger its available skill rediscovery after installation if
the new skills do not appear immediately. Treat installed directories as
deployment outputs and submit policy changes to this repository.
