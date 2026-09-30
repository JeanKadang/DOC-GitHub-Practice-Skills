# Installing from VS Code (no PowerShell experience needed)

You don't need to know PowerShell to do this — you're pasting one command
into a terminal window VS Code already gives you, not writing a script.

This covers the two ways this repository's skills reach VS Code: the
**Claude VS Code extension** and **GitHub Copilot**'s built-in agent mode.
If you use OpenAI Codex, see [docs/openai-codex.md](openai-codex.md) instead
— this guide's commands only cover the Claude and Copilot targets.

## 0. Before you start

- **PowerShell 7 (`pwsh`)** — Windows ships an older `powershell.exe` by
  default, not `pwsh`. If the command in Step 3 says something like
  `pwsh: term not recognized`, install PowerShell 7 from
  [aka.ms/powershell](https://aka.ms/powershell) (or ask a colleague to run
  the install for you) before continuing.
- **git** — Step 2 assumes `git` is already available. If `git clone` isn't
  recognized, install [Git for Windows](https://git-scm.com/downloads) first.

## 1. Open the integrated terminal

In VS Code: **View → Terminal**, or press `` Ctrl+` `` (backtick). A terminal
panel opens at the bottom of the window. VS Code's default terminal is
usually PowerShell, but if yours opens something else (Command Prompt, Git
Bash), the commands below still work the same way — they're not
PowerShell-specific syntax, just plain commands run through `pwsh`.

## 2. Get a copy of this repository

If you haven't already, clone it (in the integrated terminal):

```powershell
git clone https://github.com/JeanKadang/DOC-GitHub-Practice-Skills.git
cd DOC-GitHub-Practice-Skills
```

## 3. Preview, then install

Always preview first — this shows you exactly what would happen without
changing anything:

If you use the **Claude extension** in VS Code:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Claude -DryRun
```

Read the output: source, target, the skill list, and whether anything would
be overwritten. If it looks right, run it for real:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Claude
```

If you use **GitHub Copilot** (agent mode, Copilot Chat) in VS Code, run the
same preview-then-install pair with `-Target Copilot` instead:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Copilot -DryRun
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Copilot
```

Using both extensions? Run both pairs — each `-Target` only touches its own
tool's skill directory, so running one doesn't affect the other. (`-Target
Both` also exists and installs for Claude *and* Codex together — skip it
here unless you specifically also use Codex outside VS Code; it won't do
anything for Copilot.)

Upgrading over an unmodified earlier install needs no `-Force` and makes no
backup. `-Force` is only for a skill you changed locally — see
[docs/claude.md](claude.md) or [docs/copilot.md](copilot.md) for the full
behavior, including `-KeepBackups`.

## 4. Make VS Code notice the new skills

- **Claude extension:** open the Command Palette (`Ctrl+Shift+P` /
  `Cmd+Shift+P`) and run **Developer: Reload Window**. This restarts VS
  Code's extension host, which re-reads `~/.claude/skills`. Confirmed
  against a real Claude-extension-in-VS-Code session — including
  `-Force`-upgrading over an older tracked install — the new/updated
  skills appeared after reload with no other steps needed.
- **GitHub Copilot (agent mode):** same command — **Developer: Reload
  Window** — or fully closing and reopening VS Code if that doesn't pick up
  the change. (If you're instead using Copilot through its CLI in a regular
  terminal, not VS Code's agent mode, `/skills reload` inside that session
  is the documented way — see [docs/copilot.md](copilot.md).)
  **Needs verification** — this Copilot-agent-mode step hasn't been
  confirmed against a real session yet. If you hit something different,
  please correct this note.
- If reloading the window doesn't work, closing VS Code entirely and
  reopening it is the usual fallback.

## Where to go from here

- [README.md](../README.md)'s `## Skills` list — what each skill covers.
- [docs/GUIDE.md](GUIDE.md) — the full trigger/handoff model across all
  twelve skills.
- [docs/claude.md](claude.md) / [docs/copilot.md](copilot.md) — the
  CLI-oriented versions of this same install process, with more detail on
  flags like `-ClaudeHome`/`-CopilotHome` and `-Force`.
