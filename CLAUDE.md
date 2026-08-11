# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What this repository is

This is **not** an application — it's a versioned package of GitHub workflow
skills (`skills/github-*/SKILL.md`) consumed by three AI coding platforms:
OpenAI Codex, Claude Code, and GitHub Copilot CLI (GitHub's Agent Skills
format is an explicit open standard shared with Anthropic's, so no content
translation is needed for Copilot). The repo's product is policy text plus a
validated manifest and an installer that copies that policy into a consumer's
home directory (`~/.codex`, `~/.claude`, and/or `~/.copilot`).

Because the "code" here is largely prescriptive documentation that other AI
agents will read and act on, precision and internal consistency across files
matter more than usual — a wording change in one skill can contradict another.

## Commands

```powershell
npm ci                 # install devDependencies (markdownlint-cli2, yaml)
npm run validate       # scripts/validate-skills.mjs — manifest/skill checks
npm test               # node --test (runs tests/*.test.mjs)
npm run lint:markdown  # lint:markdown:docs + lint:markdown:skills
npm run check          # validate + test + lint:markdown, run before every PR
```

Run a single test file directly with the Node test runner:

```powershell
node --test tests/validate-skills.test.mjs
node --test tests/workflow-policy.test.mjs
node --test tests/install-skills.test.mjs
```

Installer dry runs (always preview before a real install):

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Both -DryRun
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Claude -DryRun
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Codex -DryRun
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target Copilot -DryRun
```

`-Target Both` means Codex + Claude only, for backward compatibility;
installing all three needs two invocations. The installer is PowerShell-only.
Windows is the primary verified environment (required CI check); Ubuntu and
macOS `pwsh` also run it in CI as an advisory check — Ubuntu passes, macOS
currently fails on a known reparse-point false-positive (`/var` is a symlink
on macOS; see issue #23). `.github/workflows/validate.yml` runs `npm run
check` plus the installer suite in CI; `.github/workflows/release.yml`
handles releases.

## Architecture

### Canonical source vs. deployment output

`skills/<name>/` is the single canonical source. The installer
(`scripts/install-skills.ps1`) copies these directories into a consumer's
`.codex/skills`, `.claude/skills`, and/or `.copilot/skills`. **Installed
copies are deployment outputs — never edit them; always edit the canonical
`skills/` tree and let the installer redeploy.** All three platforms read the
same `SKILL.md`; only Codex also reads the `agents/openai.yaml` sidecar
(Claude and Copilot both ignore it).

### The eight canonical skills and their handoffs

Each skill has a narrow trigger and a boundary/handoff to the next skill. This
chain is the core domain model of the repo (see `docs/GUIDE.md` for full
detail):

- `github-issue-first` — file an issue before acting on any finding. Hands
  security-sensitive findings to `github-security-response`; hands
  implementation to `github-hygiene`.
- `github-hygiene` — owns branches, PR traceability, closure evidence,
  milestones, releases, cleanup. Individual PR review belongs to
  `github-pr-review`; merge/release still require explicit human approval.
- `github-pr-review` — reviews someone else's PR/fork PR against linked
  acceptance criteria. Approval is not merge approval.
- `github-repo-review` — full-repository, evidence-based audit; findings
  labeled `CONFIRMED` (safely reproduced) or `PLAUSIBLE`. Exploitable findings
  go to `github-security-response`, not a public issue.
- `github-repo-bootstrap` — the only skill allowed to create repo content
  *before* an issue exists (the initial shell); everything after that shell
  goes through the normal issue-first flow.
- `github-security-response` — replaces the public issue/PR path until
  coordinated disclosure is safe: rotate credentials first, use private
  advisories, never file an unpatched exploitable finding publicly.
- `github-projects` — adds a Projects v2 board only when multiple maintainers
  need shared visualization; never workflow authority, never created by
  default for a solo maintainer.
- `github-for-ado-users` — explains Azure DevOps/TFS/Jira → GitHub concept
  mappings; does not mutate a repository itself.

### The `Refs #N` / `Closes #N` closure gate

This is the load-bearing policy invariant repeated verbatim across
`CONTRIBUTING.md`, `docs/GUIDE.md`, `docs/WORKFLOW.md`, and
`docs/MAINTAINING.md`, and is itself under automated test
(`tests/workflow-policy.test.mjs` scans policy files for a regex of *false*
closure-safety claims):

- PRs start with `Refs #N`, not `Closes #N`.
- `Refs #N` does **not** guarantee GitHub keeps the linked issue open — GitHub
  can still auto-close it via a connected development branch even without a
  closing keyword.
- After every merge, audit the linked issue; if it closed while an in-scope
  acceptance criterion is unmet/unevaluated, reopen it and record why.
- Switch to `Closes #N` only once every criterion has recorded evidence
  (diff, test, CI run, doc, screenshot, reproduction) — "merged" or "green CI"
  alone is not evidence.

If you edit this invariant's wording in any one file, update it in all four
(see `docs/MAINTAINING.md`'s "Cross-skill invariant review" for the full
list, which also includes every `skills/*/SKILL.md`, the PR template, issue
forms, and release automation).

### Validation and manifest consistency

The canonical eight-skill roster (names + required files) is independently
hardcoded three times, deliberately — `contracts/skill-inventory.json`, the
`CANONICAL_SKILLS` constant in `scripts/validate-skills.mjs`, and
`$canonicalRequiredFiles` in `scripts/install-skills.ps1` — as defense in
depth, so the installer never blindly trusts the JSON inventory it's
installing from. `tests/roster-consistency.test.mjs` fails automatically if
the three diverge, so edit all three when adding/renaming a skill, but drift
is now caught by a named test rather than only inferred indirectly.
`npm run validate` separately checks: inventory schema, `packageVersion`
matches `package.json`, no unregistered `skills/github-*` directories, every
mandatory file exists on disk, and each `SKILL.md` frontmatter `name` matches
its directory name. Before a release, `package.json` version, the inventory's
`packageVersion`, and the git tag (without leading `v`) must all agree.

### Installer safety model

`scripts/install-skills.ps1` is defensive by design: it validates the source
tree, refuses to overwrite a modified tracked installation without `-Force`
(and backs it up when it does), rejects reparse points/path overlap in the
install ancestry, and writes a `.doc-github-practice-skills.json` marker so it
can distinguish "install output" from user files on future runs. Always run
with `-DryRun` first and read the reported source/destination/overwrite/backup
plan before running for real — this matches the guidance in
`CONTRIBUTING.md` and `docs/claude.md`/`docs/openai-codex.md`/`docs/copilot.md`.

### Architecture decision records

`docs/adr/` holds immutable records of *why* a specific past decision landed
where it did — for policy that gets re-litigated, not routine changes. ADR
0001 covers the Refs/Closes connected-branch closure decision above. Check
`docs/MAINTAINING.md`'s cross-skill invariant review list, which includes
`docs/adr/`, before assuming a shared-policy change is unprecedented.

## Content rules specific to this repo

- **Public-content boundary** (`CONTRIBUTING.md`): only generic, sanitized
  workflow policy belongs here. No company/customer names, private endpoints,
  credentials, internal policy, or screenshots of private systems.
- Policy changes to any canonical `SKILL.md` must be considered against all
  eight skills and all three consuming platforms, not just the one file
  touched.
- Follow the issue-first workflow described above for changes to this repo
  itself, per `CONTRIBUTING.md` — issue with acceptance criteria → issue-linked
  branch via `gh issue develop` → conventional commits → PR starting `Refs #N`
  → evidence per criterion → `Closes #N` only when every gate passes.
