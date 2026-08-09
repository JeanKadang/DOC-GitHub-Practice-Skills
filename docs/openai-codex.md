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

Review the source, target, eight skills, overwrite decisions, and backup paths.
Then install:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Codex
```

Use an explicit home when testing or when discovery is not appropriate:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 `
  -Target Codex -CodexHome C:\path\to\codex-home -DryRun
```

Restart Codex or trigger its available skill rediscovery after installation if
the new skills do not appear immediately. Validate the repository with `npm run
check` before packaging or installing a release.
