# DOC-GitHub-Practice-Skills

[![Validate](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/actions/workflows/validate.yml/badge.svg)](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/actions/workflows/validate.yml)

Versioned GitHub workflow skills for OpenAI Codex, Claude, GitHub Copilot CLI,
and people moving from Azure DevOps to GitHub.

> **Release status:** [v0.1.0](https://github.com/JeanKadang/DOC-GitHub-Practice-Skills/releases/tag/v0.1.0)
> is published. The repository contains the v0.1.0 package contract and a
> matching GitHub release.

## Skills

- `github-issue-first` records actionable work before implementation.
- `github-hygiene` governs branches, pull requests, closure, releases, and
  cleanup.
- `github-pr-review` reviews pull requests and their linked acceptance criteria.
- `github-repo-review` performs evidence-based, full-repository audits.
- `github-repo-bootstrap` creates and verifies a new repository safely.
- `github-security-response` keeps exploitable findings and credentials private.
- `github-projects` adds a maintained shared board when multiple maintainers
  need one.
- `github-for-ado-users` maps Azure DevOps concepts to GitHub without importing
  organization-specific policy.

## Safe quick install

The verified v0.1.0 installer platform is Windows PowerShell. From a trusted
checkout, inspect the plan before allowing writes:

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
[Copilot CLI guide](docs/copilot.md) for discovery details. `-Target Both`
installs Codex and Claude only; install Copilot separately with
`-Target Copilot`.

## Documentation

- [Layered skill guide](docs/GUIDE.md)
- [Workflow and closure gates](docs/WORKFLOW.md)
- [Maintainer guide](docs/MAINTAINING.md)
- [Azure DevOps migration mapping](docs/azure-devops-migration.md)

## Compatibility

All three platforms consume the canonical packages under `skills/`. OpenAI
Codex also reads `agents/openai.yaml`; Claude and Copilot both ignore that
metadata and read the same `SKILL.md` — GitHub's Agent Skills format is an
open standard shared with Anthropic's, so no content translation is needed for
Copilot. Node.js 20 or 22 validates the repository. Windows is the primary
verified installer environment (a required CI check, and the only one that
exercises junction/reparse-point rejection). Ubuntu and macOS `pwsh` also run
the installer suite in CI as an advisory check — Ubuntu passes, **macOS
currently fails** on a known issue (#23). See
[docs/MAINTAINING.md](docs/MAINTAINING.md#compatibility-records) for what that
does and doesn't cover.

## Contributing, security, and licence

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Report
security vulnerabilities through GitHub private vulnerability reporting as
described in [SECURITY.md](SECURITY.md), never through a public issue.

This project is available under the [MIT License](LICENSE).
