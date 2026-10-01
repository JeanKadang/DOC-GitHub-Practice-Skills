# Maintaining the skill set

**Applies to:** v0.3.0

**Reviewed:** 2026-09-28

## Cross-skill invariant review

When a shared rule changes, inspect all twelve `skills/*/SKILL.md` files, the
standalone repository-review prompt, the guide, workflow, platform guides,
`AGENTS.md` (the single source `CLAUDE.md` imports, ADR 0010), issue forms, PR
template, release automation, `education/`'s content, `CHANGELOG.md`'s
`[Unreleased]` section, and `docs/adr/` for any decision record the change would
supersede. A roster addition or removal is exactly this class of change — ADR
0002's own consequences list, this feature's design spec, and its implementation
plan each independently missed `CHANGELOG.md` before this line existed to catch
it. Human review must confirm that:

- issue-first work retains ownership, priority, category, milestone, and scope;
- `Refs #N` remains until criterion evidence passes the closure gate;
- security-sensitive findings never enter a public issue or branch;
- approval, merge, release, and destructive operations remain explicit gates;
- a Projects board remains optional and mirrors issue metadata; and
- Claude, OpenAI Codex, GitHub Copilot, and ChatGPT consume the same canonical
  `SKILL.md` content (ChatGPT as flattened Custom GPT Knowledge files, ADR 0006).

Automation validates structure. It cannot establish semantic consistency.

## What the automated checks guard

`npm run check` runs all of these, and CI runs the same command. Each fails on
a seeded violation in its own tests, so a rule that stops working is noticed.

- **Inventory, mandatory files, frontmatter name** (`scripts/validate-skills.mjs`):
  a missing, unregistered, or misnamed skill.
- **Description present and at most 1024 characters**
  (`scripts/validate-skills.mjs`): a description a platform truncates or rejects,
  which hides when to use the skill.
- **`default_prompt` names its skill** (`scripts/validate-skills.mjs`): a Codex
  prompt that invokes the wrong skill.
- **Cross-reference tokens name real skills** (`scripts/validate-skills.mjs`): a
  rename that leaves a `github-...` reference pointing at nothing.
- **No dangling paths, ADRs, or plugin references**
  (`scripts/validate-skills.mjs`): a skill that cites a file or plugin that is
  not installed with it.
- **Roster agrees in three files** (`tests/roster-consistency.test.mjs`):
  inventory, validator, and installer drifting apart.
- **Roster appears on every surface** (`tests/doc-consistency.test.mjs`): a skill
  missing from the README, AGENTS.md, GUIDE, ChatGPT instructions, or issue forms.
- **Version stamps** (`tests/doc-consistency.test.mjs`): a policy document naming
  an old version. SECURITY.md may lag the package version, never lead it.
- **Release-note labels** (`tests/doc-consistency.test.mjs`): a release category
  the label-copy workflow never applies.
- **ChatGPT export size** (`tests/doc-consistency.test.mjs`): an export over the
  20-file Knowledge limit.
- **Relative links and anchors** (`tests/links.test.mjs`): a link to a file or
  heading that no longer exists.
- **Shell snippet syntax** (`tests/snippets.test.mjs`): a bash or PowerShell
  example that does not parse.
- **Mermaid diagrams** (`tests/mermaid-diagrams.test.mjs`): a diagram that does
  not parse under the pinned Mermaid.
- **Policy wording** (`tests/workflow-policy.test.mjs`,
  `tests/skill-gates.test.mjs`, `tests/agent-guidance.test.mjs`): false
  closure-safety claims and lost gates.
- **Installer behaviour** (`tests/install-skills.test.mjs`): data loss, wrong
  backups, or a broken export.

The checks prove structure and syntax. They do not prove that a snippet does the
right thing, that a link points at the right page, or that two documents agree in
meaning, so human review stays as described above. The point-in-time reports in
`docs/review/` are not link- or snippet-checked, because they record what a
reviewer saw against an earlier commit.

## Closure reconciliation

Before marking a parent epic complete, query native sub-issues and compare them
with the parent's checklist. Verify that every child is closed for the supported
reason, its linked PR is recorded, and the parent's own criteria have evidence.
After merge, verify both issue state and milestone membership.

`Refs #N` avoids a PR-body closing keyword; it does not guarantee the issue
stays open when GitHub has a connected development branch. After every merge,
immediately audit the linked issue state and body. If it is closed while any
in-scope acceptance criterion is unchecked, unmet, or unevaluated, reopen it
immediately and record the reason. For work that spans the PR merge, either use
this audit-and-reopen flow or track the PR-scoped work in a child issue and leave
the release-spanning parent unconnected. Every PR-scoped criterion still needs
evidence before merge.

GitHub issue and PR numbers share a repository number sequence. Before editing
metadata or closing an object from a bare `#N`, query it and confirm whether it
is an issue or pull request. Never assume the object type from the number alone.

## Compatibility records

For changes that depend on GitHub CLI, API, Actions, Node.js, or PowerShell
behavior, record the tested versions, operating system, command, and outcome in
the issue or PR. Mark unverified platforms accurately. Windows is the primary
verified installer environment: its dry run is a required check, and its test
run is the only one that exercises junction/reparse-point rejection (three
`tests/install-skills.test.mjs` cases are Windows-only by design, since
reparse points are the concrete attack surface being guarded against there).
Ubuntu and macOS `pwsh` also each run the installer test suite and a live dry
run in CI, as advisory (non-required) checks, not promoted to a required
branch-protection check. macOS was dropped from CI once (see issue #23): its
`/var` is itself a symlink to `/private/var`, which
`Assert-NoReparseInExistingAncestry` treated as an attack signal on any path
under the OS temp directory, unrelated to any symlink the tests actually
create. #45 fixed this by bounding the ancestry walk at the nearest path this
script itself owns (a target's platform home, or the resolved source root)
instead of walking to the filesystem root — an ancestor above that boundary
is out of the guard's threat model regardless of OS, and the macOS leg was
restored on that basis. If a future change reintroduces a similar
false-positive, re-removing the leg (rather than weakening the guard to
paper over it) is the same tradeoff made in #23/#46.

## Skills must stand alone

A skill is installed or exported by itself, without this repository's `docs/`,
`education/`, or ADRs, and without any third-party plugin. `npm run validate`
therefore fails a `SKILL.md` (or companion Markdown file) that cites a
`plugin:skill-name` reference, an inline-code path to a file under `docs/`,
`education/`, or `platforms/`, or an `ADR NNNN` number. State the guidance
inline. A pointer that is deliberately specific to this repository carries the
marker `(this repository only)` on the same line, which the validator accepts.
Generic advice about a consumer's own `docs/` folder or `docs/adr/` directory
is fine because it names a directory, not a file shipped here.

## Bash and PowerShell examples in skills

Every `skills/*/SKILL.md` command example is Bash-flavored by default, since
that's the common denominator across platforms. When a command is a
**multi-line invocation** (uses `\` line continuation, a heredoc, or a
multi-flag `gh`/`jq` call spanning several lines), add a PowerShell-native
equivalent directly below the Bash fenced block, introduced by a plain
`PowerShell:` line, in its own ` ```powershell ` fence:

````markdown
```bash
gh issue list --state closed --limit 1000 --json number,title,body,stateReason \
  --jq '...'
```

PowerShell:

```powershell
gh issue list --state closed --limit 1000 --json number,title,body,stateReason `
  --jq '...'
```
````

A single-line command needs no PowerShell pair — bash and pwsh share
identical syntax for a plain `gh`/`git` invocation with no continuation,
heredoc, or shell-specific redirection; only the multi-line shape actually
differs between shells. Where a command has no PowerShell peer for a
different reason (a POSIX-only redirection like `2>/dev/null`, e.g.), use
pwsh's `2>$null` and the shared `||`/`&&` chain operators (PowerShell 7+
supports both directly; Windows PowerShell 5.1 does not, which is why these
docs and the installer require `pwsh`) rather than inventing a different
control-flow shape.

**Verify every PowerShell example actually runs**, not just that it looks
plausible — a single stray extra backslash inside a `--jq` string (an easy
mistake: jq needs `\\s`/`\\[`/`\\]` for a literal regex escape but a single
`\(...)`/`\t` for interpolation) can silently produce wrong output instead
of an error. Test jq-bearing commands by writing the exact program to a file
and running `gh ... --jq "$(Get-Content -Raw file)"` (or the Bash
equivalent) against a real repo, rather than trusting a visual read.

## Manifest and version consistency

`package.json` and `contracts/skill-inventory.json` must carry the same package
version. The inventory must list every canonical `github-*` directory and each
required companion file. Before release, verify all twelve frontmatter names and
OpenAI metadata, and ensure **the skillset's** git tag (without its leading
`v`) equals both version fields.

The canonical twelve-skill roster (names and required files) is independently
hardcoded in three places: `contracts/skill-inventory.json`,
`scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
`scripts/install-skills.ps1`'s `$canonicalRequiredFiles`. This duplication is
intentional defense-in-depth — the installer refuses to trust the inventory
JSON blindly — but it means adding, renaming, or changing a skill's required
files means editing all three by hand. `tests/roster-consistency.test.mjs`
fails automatically if the three ever diverge, so drift is caught as a test
failure rather than discovered separately by two independent installer checks
disagreeing. `scripts/install-skills.ps1` also derives its internal count
guard and its dry-run/completion messages from the roster size rather than a
hardcoded number (see ADR 0002) — no fourth place to edit by hand.

## Release hygiene

Use a release issue and dedicated branch. Update the changelog, validate from a
clean checkout, review generated notes, and merge only with explicit approval
and green checks. Tag updated `main`, verify the published release and tag
commit, close the milestone, confirm issue and epic closure, and prune merged
branches. Never publish installed local copies or arbitrary branch state.

### Two release tracks: skillset vs. education

The skillset and `education/` are versioned and tagged independently —
they have different consumption models (the skillset is installed via
`install-skills.ps1`; `education/` is just read on GitHub) and there is no
requirement to coordinate a release of one with a release of the other.

| | Skillset | `education/` |
| --- | --- | --- |
| Tag prefix | `vX.Y.Z` (bare) | `education-vX.Y.Z` |
| Changelog | `CHANGELOG.md` | `education/CHANGELOG.md` |
| Purpose | Package version in inventory | Cohort reference point |
| Release page | Yes, with generated notes | No — tag only |
| CI on tag push | Full release pipeline | `education-tag-check.yml` only |

The skillset's generated release notes list merged pull requests since the
previous `vX.Y.Z` tag, so a pull request that only changes `education/` must
carry the `education` label. `.github/release.yml` excludes that label, which
keeps education-only work out of the skillset's notes, and the label-copy
workflow copies it from the linked issue. Label the issue `education` when you
file it. A pull request that touches both products leaves the label off.

When you make a change, update whichever changelog matches what you
touched — a change to `skills/*/SKILL.md` or the installer never touches
`education/CHANGELOG.md`, and vice versa. If a single PR touches both
(rare — they're deliberately decoupled), update both changelogs and it's
fine for only one of the two tags to move.

## Public-content review

Before every release, scan tracked content for secrets, private endpoints,
workplace names, internal fields, screenshots, and policy. Generic ADO mapping
belongs here; organization-specific material belongs in a future private
companion pinned to a public-core release.
