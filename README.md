# DOC-GitHub-Practice-Skills

Versioned GitHub workflow skills for OpenAI Codex, Claude, GitHub Copilot CLI,
and people moving from Azure DevOps to GitHub.

> **Release status:** v0.1.0 is a pre-release target. The repository contains
> the v0.1.0 package contract, but this branch does not claim that a GitHub
> release already exists.

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
Copilot. Node.js 20 or 22 validates the repository. Windows PowerShell is the
only installer environment verified for v0.1.0.

## Contributing, security, and licence

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Report
security vulnerabilities through GitHub private vulnerability reporting as
described in [SECURITY.md](SECURITY.md), never through a public issue.

This project is available under the [MIT License](LICENSE).
