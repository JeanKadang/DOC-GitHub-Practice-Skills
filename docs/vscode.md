# Installing from VS Code (no PowerShell experience needed)

You don't need to know PowerShell to do this — you're pasting one command
into a terminal window VS Code already gives you, not writing a script.

This covers the two ways this repository's skills reach VS Code: the
**Claude VS Code extension** and **GitHub Copilot**'s built-in agent mode.
(OpenAI Codex doesn't have a VS Code integration — see
[docs/openai-codex.md](openai-codex.md) if you use Codex outside VS Code.)

## 1. Open the integrated terminal

In VS Code: **View → Terminal**, or press `` Ctrl+` `` (backtick). A terminal
panel opens at the bottom of the window — this is a real PowerShell prompt
running on your machine, the same as opening one separately.

## 2. Get a copy of this repository

If you haven't already, clone it (in the integrated terminal):

```powershell
git clone https://github.com/JeanKadang/DOC-GitHub-Practice-Skills.git
cd DOC-GitHub-Practice-Skills
```

## 3. Preview, then install

Always preview first — this shows you exactly what would happen without
changing anything:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Both -DryRun
```

Read the output: source, target, the skill list, and whether anything would
be overwritten. If it looks right, run it for real:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Both
```

`-Target Both` installs for Claude and Codex. If you use GitHub Copilot
(agent mode, Copilot Chat) in VS Code, also run:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Copilot
```

Upgrading over a previous install needs `-Force`, which writes a timestamped
backup first — see [docs/claude.md](claude.md) or
[docs/copilot.md](copilot.md) for that flag's full behavior.

## 4. Make VS Code notice the new skills

> **Needs verification** — the steps below are the standard VS Code
> mechanism for picking up state that changed outside the editor, but
> haven't been confirmed against a real Claude-extension-in-VS-Code and
> Copilot-agent-mode-in-VS-Code session. If you hit something different,
> please correct this section.

- **Claude extension:** open the Command Palette (`Ctrl+Shift+P` /
  `Cmd+Shift+P`) and run **Developer: Reload Window**. This restarts VS
  Code's extension host, which re-reads `~/.claude/skills`.
- **GitHub Copilot (agent mode):** same command — **Developer: Reload
  Window** — or fully closing and reopening VS Code if that doesn't pick up
  the change.

If skills still don't appear after a reload, closing VS Code entirely and
reopening it is the fallback that should always work.

## Where to go from here

- [README.md](../README.md)'s `## Skills` list — what each skill covers.
- [docs/GUIDE.md](GUIDE.md) — the full trigger/handoff model across all ten
  skills.
- [docs/claude.md](claude.md) / [docs/copilot.md](copilot.md) — the
  CLI-oriented versions of this same install process, with more detail on
  flags like `-ClaudeHome`/`-CopilotHome` and `-Force`.
