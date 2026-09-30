# OpenAI Codex installation

OpenAI Codex consumes each canonical `skills/<name>/SKILL.md` and its adjacent
`agents/openai.yaml` interface metadata. There is no Codex-specific policy copy.

The installer uses `-CodexHome` when supplied. Otherwise it discovers the home
from `CODEX_HOME`, then defaults to the current user's `.codex` directory. Skill
packages are installed beneath that home's `skills` directory.

From a trusted checkout, always preview first:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 `
  -Target Codex -DryRun
```

Review the source, target, twelve skills, overwrite decisions, and backup paths.
Then install:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Codex
```

Upgrading over a previous install of this package needs `-Force`, which
writes a timestamped backup first.

Installed skill directories belong to the installer, which tracks them with a
marker file. A file you add inside `skills/<name>/` counts as a local
modification: the installer refuses to reinstall that skill without `-Force`,
and with `-Force` the whole directory, including your file, is backed up
first. Keep personal notes outside the installed skill directories.

Use an explicit home when testing or when discovery is not appropriate:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 `
  -Target Codex -CodexHome C:\path\to\codex-home -DryRun
```

Restart Codex or trigger its available skill rediscovery after installation if
the new skills do not appear immediately. Validate the repository with `npm run
check` before packaging or installing a release.
