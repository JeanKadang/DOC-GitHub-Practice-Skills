# Maintaining the skill set

**Applies to:** v0.1.0

**Reviewed:** 2026-08-09

## Cross-skill invariant review

When a shared rule changes, inspect all eight `skills/*/SKILL.md` files, the
standalone repository-review prompt, the guide, workflow, platform guides, issue
forms, PR template, and release automation. Human review must confirm that:

- issue-first work retains ownership, priority, category, milestone, and scope;
- `Refs #N` remains until criterion evidence passes the closure gate;
- security-sensitive findings never enter a public issue or branch;
- approval, merge, release, and destructive operations remain explicit gates;
- a Projects board remains optional and mirrors issue metadata; and
- Claude and OpenAI Codex consume the same canonical `SKILL.md` content.

Automation validates structure. It cannot establish semantic consistency.

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
Ubuntu and macOS `pwsh` also run the installer test suite and a live dry run
in CI, but as an advisory (non-required) check, not yet promoted to a required
branch-protection check. Ubuntu passes cleanly. **macOS currently fails**
(`continue-on-error: true`, not a silent skip): its `/var` is itself a symlink
to `/private/var`, which `Assert-NoReparseInExistingAncestry` treats as an
attack signal on any path under the OS temp directory, unrelated to any
symlink the tests actually create. See issue #23 — needs a real fix that
distinguishes OS-baseline symlinks from attacker-planted ones, not a quick
patch.

## Manifest and version consistency

`package.json` and `contracts/skill-inventory.json` must carry the same package
version. The inventory must list every canonical `github-*` directory and each
required companion file. Before release, verify all eight frontmatter names and
OpenAI metadata, and ensure the tag without its leading `v` equals both version
fields.

The canonical eight-skill roster (names and required files) is independently
hardcoded in three places: `contracts/skill-inventory.json`,
`scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
`scripts/install-skills.ps1`'s `$canonicalRequiredFiles`. This duplication is
intentional defense-in-depth — the installer refuses to trust the inventory
JSON blindly — but it means adding, renaming, or changing a skill's required
files means editing all three by hand. `tests/roster-consistency.test.mjs`
fails automatically if the three ever diverge, so drift is caught as a test
failure rather than discovered separately by two independent installer checks
disagreeing.

## Release hygiene

Use a release issue and dedicated branch. Update the changelog, validate from a
clean checkout, review generated notes, and merge only with explicit approval
and green checks. Tag updated `main`, verify the published release and tag
commit, close the milestone, confirm issue and epic closure, and prune merged
branches. Never publish installed local copies or arbitrary branch state.

## Public-content review

Before every release, scan tracked content for secrets, private endpoints,
workplace names, internal fields, screenshots, and policy. Generic ADO mapping
belongs here; organization-specific material belongs in a future private
companion pinned to a public-core release.
