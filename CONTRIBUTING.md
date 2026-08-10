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

Policy changes to a canonical `SKILL.md` must consider all eight skills and both
consuming platforms. Installed copies are deployment outputs; propose changes in
this repository.
