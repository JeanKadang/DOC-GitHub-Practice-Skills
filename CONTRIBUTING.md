# Contributing

Thank you for improving the GitHub practice skills. Keep every contribution
public, reviewable, and traceable.

## Workflow

1. File or identify an issue before starting work. Give it an owner, priority,
   category, milestone, scope, and observable acceptance criteria.
2. Create an issue-linked branch with `gh issue develop`. Do not work directly
   on `main`.
3. Use conventional commits such as `docs:`, `fix:`, `feat:`, `test:`, or `ci:`.
4. Keep the pull request focused on one issue or independently reviewable unit.
5. Start the pull request body with `Refs #N`. Keep `Refs` while any in-scope
   acceptance criterion is unmet or unevaluated.
6. Record criterion-level evidence from the diff, tests, CI, documentation, or
   reproducible checks. Use `Closes #N` only after every closure gate passes.

`Refs #N` avoids a PR-body closing keyword; it does not guarantee the issue
stays open when GitHub has a connected development branch. After every merge,
immediately audit the linked issue state and body. If it is closed while any
in-scope acceptance criterion is unchecked, unmet, or unevaluated, reopen it
immediately and record the reason. For work that spans the PR merge, either use
this audit-and-reopen flow or track the PR-scoped work in a child issue and leave
the release-spanning parent unconnected. Every PR-scoped criterion still needs
evidence before merge.

## Validation

Run the complete local check before requesting review:

```powershell
npm ci
npm run check
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Both -DryRun
```

Describe the commands and results in the pull request. Review workflow,
installer, and dependency changes as executable supply-chain changes.

## Public-content boundary

Only generic workflow policy, neutral examples, and reusable implementation
belong here. Do not include company or customer names, private endpoints,
organization-specific fields or templates, credentials, screenshots of private
systems, internal policies, or copied workplace material. Sanitize and review
every example before committing it.

Policy changes to a canonical `SKILL.md` must consider all eight skills and all
three consuming platforms (OpenAI Codex, Claude, GitHub Copilot). Installed
copies are deployment outputs; propose changes in this repository.
