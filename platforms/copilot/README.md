# GitHub Copilot adapter

Copilot uses the canonical `SKILL.md` files in [`skills/`](../../skills) and
ignores OpenAI metadata, the same as Claude. Installation, discovery, and
scope guidance is authoritative in [`docs/copilot.md`](../../docs/copilot.md).

## At a glance

- **Installer target:** `-Target Copilot`. `-Target Both` means Codex and
  Claude only, so installing all three takes two runs.
- **Installs to:** `~/.copilot/skills`. The `-CopilotHome` option or the
  `COPILOT_HOME` variable changes the home.
- **What it reads:** each skill's `SKILL.md`. The `agents/openai.yaml` sidecar
  is ignored.
- **Preview first:** the dry run reports the source, destination, overwrite
  decisions, and backup paths before anything is written.
- **After installing:** in an active Copilot CLI session, run `/skills reload`
  to pick up new skills without restarting.
- **Not covered by the installer:** project skills in a repository's
  `.github/skills`, `.claude/skills`, or `.agents/skills`, and the cloud agent
  or code review surfaces. The installer writes only your home directory.
- **How well it has been checked:** read the dated status in
  [`docs/compatibility.md`](../../docs/compatibility.md). Several Copilot
  surfaces are listed there as unverified; do not assume one install covers
  them all.

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Copilot -DryRun
```
