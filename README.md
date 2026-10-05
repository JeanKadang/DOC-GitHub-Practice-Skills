# DOC-GitHub-Practice-Skills

[![Validate](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/actions/workflows/validate.yml/badge.svg)](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/actions/workflows/validate.yml)

Versioned GitHub workflow skills for OpenAI Codex, Claude, GitHub Copilot CLI,
and people moving from Azure DevOps or GitLab to GitHub.

> **Release status:** [v0.3.0](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/releases/tag/v0.3.0)
> is published (twelve skills). Tag and publish the matching GitHub release
> per `github-releases` before updating this line for the next version.
>
> The `education/` program is versioned independently — see
> `education/CHANGELOG.md` and `docs/MAINTAINING.md`'s release-hygiene
> section for the `education-vX.Y.Z` tag convention. The first tag is
> `education-v1.0.0`.

## Skills

- `github-issue-first` records actionable work before implementation.
- `github-hygiene` governs branches, pull requests, closure, and cleanup.
- `github-releases` governs milestones, branch protection, and cutting a
  release.
- `github-contributing` covers forking, syncing, and submitting a pull
  request to a repository you don't maintain.
- `github-pr-review` reviews pull requests and their linked acceptance criteria.
- `github-repo-review` performs evidence-based, full-repository audits.
- `github-repo-bootstrap` creates and verifies a new repository safely.
- `github-repo-configure` elicits org-optional settings and issue/PR
  templates for an already-existing repository.
- `github-security-response` keeps exploitable findings and credentials private.
- `github-projects` adds a maintained shared board when multiple maintainers
  need one.
- `github-for-ado-users` maps Azure DevOps concepts to GitHub without importing
  organization-specific policy.
- `github-for-gitlab-users` maps GitLab concepts to GitHub, including the
  `.gitlab-ci.yml` → Actions rewrite.

## Safe quick install

The installer is PowerShell-only. Windows with PowerShell 7 (`pwsh`) is the
primary verified platform; Ubuntu and macOS `pwsh` also run it in CI as
advisory checks. From a trusted checkout, inspect the plan before allowing writes:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Both -DryRun
```

If the reported sources, destinations, overwrite decisions, and backup paths
are correct, repeat without `-DryRun`:

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Both
```

The installer validates the source, refuses unapproved overwrites, and can use
`-Force` to back up a modified tracked installation before replacement. See the
[OpenAI Codex guide](docs/openai-codex.md), [Claude guide](docs/claude.md), and
[Copilot CLI guide](docs/copilot.md) for discovery details — or the
[VS Code guide](docs/vscode.md) if you're not comfortable with PowerShell.
`-Target Both` installs Codex and Claude only; install Copilot separately with
`-Target Copilot`. ChatGPT has no local skill directory to install into —
`-Target ChatGPT` exports the skill files instead, for uploading to a Custom
GPT, which OpenAI has announced it will retire on 2026-12-11; see the
[ChatGPT guide](docs/chatgpt.md), "Availability", before exporting.

## Documentation

- [Layered skill guide](docs/GUIDE.md)
- [Workflow and closure gates](docs/WORKFLOW.md)
- [Maintainer guide](docs/MAINTAINING.md)
- [Skill behavior scenarios (a manual rubric)](docs/skill-scenarios.md)
- [Platform compatibility record (what has been checked, and what has not)](docs/compatibility.md)
- [Azure DevOps migration mapping](docs/azure-devops-migration.md)
- [Installing from VS Code (no PowerShell experience needed)](docs/vscode.md)
- [Installing for ChatGPT (Custom GPT until its announced retirement, then paste)](docs/chatgpt.md)
- [Colleague training program](education/README.md)
- [Repo settings snapshot (read-only audit reference)](docs/repo-settings-snapshot.md)

## Compatibility

All three CLI platforms (Codex, Claude, Copilot) consume the canonical
packages under `skills/` the same way — a known local directory read every
session. OpenAI Codex also reads `agents/openai.yaml`; Claude and Copilot
both ignore that metadata and read the same `SKILL.md` — GitHub's Agent
Skills format is an open standard shared with Anthropic's, so no content
translation is needed for Copilot. ChatGPT is a fourth, structurally
different target with no local directory to read — see
[docs/chatgpt.md](docs/chatgpt.md) for what "installing" means there.

Node.js 22 or 24 (the supported LTS lines; `package.json` requires 22.22.2 or
newer on 22, 24.15 or newer on 24, or 26 and later, the floor of the `jsdom` test
dependency)
validates the repository. Windows is the primary
verified installer environment (a required CI check, and the only one that
exercises junction/reparse-point rejection). Ubuntu and macOS `pwsh` also
each run the installer suite in CI as advisory checks. macOS was dropped
once for a persistent false-positive (issue #23) and restored once the
underlying guard was fixed (issue #45). See
[docs/MAINTAINING.md](docs/MAINTAINING.md#compatibility-records) for what that
does and doesn't cover.

## Contributing, security, and licence

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Report
security vulnerabilities through GitHub private vulnerability reporting as
described in [SECURITY.md](SECURITY.md), never through a public issue.
Everyone taking part is expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

This project is available under the [MIT License](LICENSE).
