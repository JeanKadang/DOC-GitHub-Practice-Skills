# Claude adapter

Claude uses the canonical `SKILL.md` files in [`skills/`](../../skills) and
ignores OpenAI metadata. Installation, discovery, restart, and update guidance
is authoritative in [`docs/claude.md`](../../docs/claude.md).

## At a glance

- **Installer target:** `-Target Claude`.
- **Installs to:** `~/.claude/skills`. The `-ClaudeHome` option or the
  `CLAUDE_HOME` variable changes the home.
- **What it reads:** each skill's `SKILL.md`. The `agents/openai.yaml` sidecar
  is ignored.
- **Preview first:** the dry run reports the source, destination, overwrite
  decisions, and backup paths before anything is written.
- **After installing:** start a new session, or trigger skill rediscovery, if
  the skills do not appear.
- **Not covered by the installer:** project skills in a repository's
  `.claude/skills` and cloud sessions. The installer writes only your home
  directory.
- **How well it has been checked:** read the dated status in
  [`docs/compatibility.md`](../../docs/compatibility.md), not a version number
  copied here.

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Claude -DryRun
```
