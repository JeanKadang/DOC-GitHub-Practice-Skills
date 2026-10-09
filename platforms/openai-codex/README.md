# OpenAI Codex adapter

OpenAI Codex uses the canonical packages in [`skills/`](../../skills) and reads
their `agents/openai.yaml` metadata. Installation, discovery, restart, and
validation guidance is authoritative in
[`docs/openai-codex.md`](../../docs/openai-codex.md).

## At a glance

- **Installer target:** `-Target Codex`.
- **Installs to:** `~/.codex/skills`. The `-CodexHome` option or the
  `CODEX_HOME` variable changes the home.
- **What it reads:** each skill's `SKILL.md` and its `agents/openai.yaml`
  interface metadata. Codex is the only target that uses the sidecar.
- **Preview first:** the dry run reports the source, destination, overwrite
  decisions, and backup paths before anything is written.
- **A caution about the path:** OpenAI documents `~/.agents/skills` for
  personal skills and does not list `~/.codex/skills`, where this installer
  puts them by default. The guide says what was checked and what to do if the
  skills stop appearing.
- **Not covered by the installer:** project skills in a repository's
  `.agents/skills`. The installer writes only your home directory.
- **How well it has been checked:** read the dated status in
  [`docs/compatibility.md`](../../docs/compatibility.md), not a version number
  copied here.

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Codex -DryRun
```
