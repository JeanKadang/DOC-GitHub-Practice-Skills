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

Review the source, target, eight skills, overwrite decisions, and backup paths.
Then install:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Claude
```

Use an explicit home for isolated testing:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 `
  -Target Claude -ClaudeHome C:\path\to\claude-home -DryRun
```

Restart Claude or trigger its available skill rediscovery after installation if
the new skills do not appear immediately. Treat installed directories as
deployment outputs and submit policy changes to this repository.
