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

Upgrading over an unmodified earlier install of this package needs no
`-Force` and makes no backup: the installer recognizes its own marker and
replaces the skill in place. Reinstalling the same release changes nothing.
`-Force` is for a skill you changed locally (or an untracked directory): it
backs the whole directory up first. Add `-KeepBackups N` to keep only the
newest N backup sets under `skill-backups`.

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

## Where Codex looks for skills

OpenAI's documentation (checked 2026-10-01) lists `.agents/skills` in the
repository and `~/.agents/skills` for personal skills, and does not mention
`~/.codex/skills`, which is where this installer puts skills by default.

That default still works. On 2026-10-01, with Codex CLI 0.159.3 on Windows, a
test skill in `~/.codex/skills` and another in `~/.agents/skills` were both
listed in the skills Codex gives the model; `codex debug prompt-input "hello"`
prints that list without calling the model. Two cautions follow:

- The `~/.codex/skills` path is not in OpenAI's current documentation, so a later
  Codex version could stop reading it. If installed skills stop appearing, check
  this first, and install with `-CodexHome` pointing at a home whose `skills`
  folder Codex reads.
- If the same skill is installed in both places, Codex lists it twice (seen with
  `github-hygiene`). Keep one copy of each.

To re-check after a Codex update, create a skill with a unique name in each
folder, run the `debug prompt-input` command above, search its output for those
names, and delete the test skills afterwards.

Restart Codex or trigger its available skill rediscovery after installation if
the new skills do not appear immediately. Validate the repository with `npm run
check` before packaging or installing a release.
