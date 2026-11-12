# ADR 0018: How the skills are distributed beyond the PowerShell installer

## Status

Accepted (2026-11-12).

## Context

Issue #357. The skills are meant for many more repositories and machines, but
the only distribution path was `scripts/install-skills.ps1`, which writes
user-level copies (`~/.codex`, `~/.claude`, `~/.copilot`) from a local clone and
needs PowerShell 7. A team repository could not pin one version for everyone
who works in it, and a machine without `pwsh` could not install at all.

The facts the decision rests on, each checked on 2026-11-12:

- **Where each platform reads skills.**
  - Claude Code reads personal `~/.claude/skills`, project `.claude/skills`
    ("which you can commit so your team gets it too"), plugin skills, and
    enterprise-managed skills. With the same name in two places, "Enterprise
    over personal, and personal over project" (code.claude.com/docs/en/skills).
    The page does not mention `.agents/skills`.
  - Codex "reads skills from repository, user, admin, and system locations":
    `$CWD/.agents/skills` and each parent up to the repository root,
    `$HOME/.agents/skills`, `/etc/codex/skills`, and bundled system skills. Two
    skills with the same `name` both "can appear in skill selectors"
    (OpenAI's "Build skills" page, reached from developers.openai.com/codex/skills).
  - GitHub Copilot reads project skills from `.github/skills`, `.claude/skills`,
    or `.agents/skills`, and personal skills from `~/.copilot/skills` or
    `~/.agents/skills` (docs.github.com, "About agent skills" and "Adding agent
    skills for GitHub Copilot CLI").
- **Plugins.** A Claude Code plugin ships skills at `skills/<name>/SKILL.md`, is
  installed from a marketplace that a GitHub repository can host, and updates
  only when its version changes; auto-update is off by default for a
  third-party marketplace. Plugin skills are namespaced (`/<plugin>:<skill>`)
  (code.claude.com/docs/en/plugins, plugin-marketplaces, plugins/host-marketplace).
  Codex says to "prefer plugins" for reusable distribution. GitHub's Copilot
  skills pages mention plugins once, with no install documentation.
- **Installing from GitHub without this installer.** `gh skill install`
  (GitHub CLI 2.90 or later, in preview) installs for GitHub Copilot, Claude
  Code, Codex and other agents at `--scope user` or `--scope project`, with
  `--pin <tag>`; run against this repository with GitHub CLI 2.103.3 it listed
  all twelve skills at the latest release tag. Codex's bundled `$skill-installer`
  installs from `openai/skills` "or other repos". Neither writes this package's
  marker.

## Decision

1. **Per-repository install: adopt.** The package will support placing the
   skills in a team repository so it pins one version. Follow-up #366 compares
   `gh skill install --scope project --pin` with a new installer scope
   (`-Scope Repo -RepoPath`) and implements the installer option only if
   `gh skill` leaves a gap. Either way the docs must warn that Copilot reads
   both `.claude/skills` and `.agents/skills` (so covering every platform can
   list a skill twice), and that in Claude Code a personal copy takes precedence
   over the repository's copy.
2. **Plugin or marketplace distribution: defer.** A plugin would rename every
   skill under a namespace, bypass the installer's marker, backup, modified-copy
   and status protections, and has no documented Copilot equivalent. Revisit
   when GitHub documents Copilot plugins, or when a Claude Code or Codex plugin
   has been tested against the namespacing and update trade-offs above.
3. **Installing without PowerShell: adopt by documenting existing tools.** The
   route for a machine without `pwsh` is `gh skill install` (all three
   platforms) or Codex's `$skill-installer`, pinned to a release tag, with the
   caveat that those copies are not tracked by `install-skills.ps1`. No second
   installer (Node or POSIX) is written. Follow-up #367 documents and verifies
   the commands.

## Consequences

- `install-skills.ps1` stays the one path with protections (refusing to
  overwrite a modified copy, backups, `-Status`). Copies installed by
  `gh skill` or `$skill-installer` are the user's responsibility to update.
- `docs/compatibility.md` and `docs/copilot.md` no longer call a
  per-repository install out of scope; they point to #366.
- If `gh skill` leaves its preview with changed flags, #366 and #367 are the
  places to update; this ADR records only the decision.
- A plugin release would need a new ADR that supersedes item 2.
