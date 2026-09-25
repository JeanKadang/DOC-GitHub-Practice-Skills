# GitHub skills roster optimization — design

**Date:** 2026-09-25
**Status:** Proposed
**Target version:** v0.2.0 (new milestone, separate from the in-flight v0.1.2 patch milestone covering #19/#21/#23)

## Problem

The canonical eight-skill roster was audited against four criteria: coverage
gaps, redundancy/overlap, boundary/handoff friction, and general quality.
Findings:

1. **`github-hygiene` is overloaded.** 328 lines (2nd largest of eight), and
   its own frontmatter `description` lists five distinct triggers: merging
   PRs, closing issues, reconciling acceptance criteria, cutting a release,
   tagging a version, creating/closing milestones, decomposing large work,
   and cleaning up branches. Structurally it bundles three separable
   lifecycles: (a) PR/merge flow + the acceptance-criteria closure gate, (b)
   branch protection/rulesets (~75 self-contained lines), (c) release
   mechanics (release-notes config + release recipe + milestones).
2. **No skill owns the outside-contributor workflow.** All eight current
   skills assume maintainer authority (merge, tag, release). Forking,
   syncing a fork with upstream, and submitting a PR to a repo you don't
   maintain has no home. `github-pr-review` covers reviewing a fork PR and
   has one short section on responding to review on your own PR — that
   section is contributor-side content living in the reviewer-side skill.
3. **One stale-reference risk, not real duplication.** The `Refs #N`
   closure-gate paragraph is deliberately repeated verbatim across
   `github-hygiene/SKILL.md`, `github-issue-first/SKILL.md`,
   `github-repo-bootstrap/SKILL.md`, `CONTRIBUTING.md`, `docs/GUIDE.md`,
   `docs/WORKFLOW.md`, and `docs/MAINTAINING.md` — enforced verbatim by
   `tests/workflow-policy.test.mjs`'s `policyFiles` list and documented as
   intentional in `docs/adr/0001`. This is correct design (only the
   triggered skill loads into an agent's context at a time) and is **not**
   touched by this change. What *is* a real, fixable issue: a handful of
   skills cross-reference `github-hygiene` by name for milestone/ruleset
   guidance that is moving to a new skill under this proposal; those
   references need to be repointed, not deleted.
4. **General quality** — confirmed clean by a separate prompt-cruft audit
   (dated/pressure-language patterns, scaffolds, over-specification). No
   findings there; out of scope for this change.

## Decision

Grow the roster from 8 to 10 skills:

- **Split `github-hygiene`** into a trimmed `github-hygiene` (PR flow,
  closure gate, CI-red triage, sub-issues, cleanup) and a new
  **`github-releases`** (rulesets/branch protection, release-notes config,
  release recipe, milestones).
- **Add `github-contributing`** (new): forking, syncing a fork with
  upstream, submitting a PR as an outside contributor, following the target
  repo's own conventions instead of this project's. Absorbs
  `github-pr-review`'s "Responding to review on your own PR" section.

### Skill boundaries after the change

| Skill | Trigger (summary) | Owns |
|---|---|---|
| `github-hygiene` (trimmed) | Merging PRs, closing issues, reconciling acceptance criteria, decomposing large work, branch cleanup | Traceability chain, acceptance-criteria closure gate, PR flow, CI-red triage, solo-vs-multi tracking, sub-issues, end-of-session cleanup |
| `github-releases` (new) | Cutting a release, tagging a version, configuring branch protection/rulesets, creating/closing milestones | Rulesets, release-notes config, release recipe, milestones |
| `github-contributing` (new) | Submitting a PR to a repo you don't maintain | Fork setup/sync, `gh pr create` against upstream, responding to review as the PR author, foreign-repo convention awareness |
| Other 5 skills | Unchanged | Unchanged |

Cross-reference updates (repoint, not duplicate):
- `github-issue-first` → milestone conventions now point to `github-releases`
- `github-repo-bootstrap` → ruleset cross-reference now points to `github-releases`; §11 handoffs gain `github-releases` and (where relevant) `github-contributing`
- `github-projects` → gains `github-releases` as a companion skill (milestone/iteration overlap)
- `github-for-ado-users` → "Setting up a repo" checklist's ruleset/milestone rows now point to `github-releases`
- `github-pr-review` → "Fork PRs" section gets a one-line cross-reference to `github-contributing`; the "Responding to review on your own PR" section moves there entirely

## Full file blast radius

**New skill files**
- `skills/github-contributing/SKILL.md`, `skills/github-contributing/agents/openai.yaml`
- `skills/github-releases/SKILL.md`, `skills/github-releases/agents/openai.yaml`

**Edited skill files**
- `skills/github-hygiene/SKILL.md` — remove rulesets/release-notes/release-recipe/milestones sections and their "Common mistakes" rows; narrow frontmatter `description`
- `skills/github-hygiene/agents/openai.yaml` — narrow `short_description`/`default_prompt`
- `skills/github-pr-review/SKILL.md` — remove "Responding to review on your own PR" (moves out); add cross-ref to `github-contributing` in "Fork PRs"
- `skills/github-issue-first/SKILL.md` — repoint milestone cross-reference
- `skills/github-repo-bootstrap/SKILL.md` — repoint ruleset cross-reference; update §11 handoffs
- `skills/github-projects/SKILL.md` — add `github-releases` as a companion skill
- `skills/github-for-ado-users/SKILL.md` — repoint "Setting up a repo" checklist rows

**Contract/tooling**
- `contracts/skill-inventory.json` — add `github-contributing`, `github-releases` entries; `packageVersion: 0.2.0`
- `scripts/validate-skills.mjs` — add both entries to `CANONICAL_SKILLS` (array-length-driven; no hardcoded count elsewhere in this file)
- `scripts/install-skills.ps1` — add both entries to `$canonicalRequiredFiles`; replace the hardcoded `$inventoryNames.Count -ne 8` check and the two literal `"Skills (8)"` / `"Installed 8 skills"` output strings with `$expectedSkillNames.Count`, so a future roster change doesn't silently reintroduce this same bug
- `package.json` — `version: 0.2.0`

**Tests**
- `tests/install-skills.test.mjs` — update the hardcoded `/Skills \(8\)/i` regex, the two test names referencing "eight skills," and the one comment referencing an "8-skill tree"
- `tests/roster-consistency.test.mjs`, `tests/validate-skills.test.mjs` — no edits; both are roster-driven dynamically and will exercise the new entries automatically
- `tests/workflow-policy.test.mjs` — no edits; its `policyFiles` list stays correct (`github-releases` and `github-contributing` deliberately do not carry the `Refs #N` paragraph — see Decision above)

**Docs**
- `docs/GUIDE.md` — add `### github-releases` and `### github-contributing` sections in the existing per-skill format; trim the `github-hygiene` section; update "Trigger and handoff model" prose; bump the version header
- `docs/MAINTAINING.md` — "all eight `skills/*/SKILL.md` files" → "all ten"; bump version header
- `docs/claude.md`, `docs/openai-codex.md`, `docs/copilot.md` — each has one literal "eight skills" line in the `-DryRun` walkthrough → "ten skills"
- `README.md` — add two bullets under `## Skills`; trim the `github-hygiene` bullet (drop "releases")
- `CONTRIBUTING.md` — "all eight skills" → "all ten skills"
- `.github/ISSUE_TEMPLATE/bug.yml`, `.github/ISSUE_TEMPLATE/improvement.yml` — add `github-contributing` and `github-releases` to the `Affected skills` dropdown options
- `docs/adr/0002-split-hygiene-add-contributing-and-releases.md` (new) — Context (the four findings above)/Decision (the split + addition)/Consequences (cross-reference repoints, roster count changes in 4 mechanically-linked places plus the installer's 3 hardcoded-`8` spots, test updates); `docs/adr/README.md` index gains one line
- `docs/WORKFLOW.md`, `docs/azure-devops-migration.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `platforms/*/README.md` — checked, no skill-name or roster-count references, **no changes**

Roughly 22 files (20 edited/added content files + `docs/adr/README.md`'s index line + the version bump already counted in `package.json`/`skill-inventory.json`).

## Non-goals

- No change to the seven skills' existing behavior beyond the cross-reference repoints listed above.
- No change to the `Refs #N` closure-gate paragraph's wording or its enforcement in `tests/workflow-policy.test.mjs`.
- No change to `v0.1.2`'s scope (#19, #21, #23) — ships independently.
- Content for the two new skills is written fresh where it's new ground (fork/sync mechanics) and relocated verbatim where it already exists elsewhere (rulesets, release recipe, milestones, "responding to review").

## Testing / validation

`npm run check` (validate + test + lint:markdown) must pass, plus a live
`-DryRun` install for both `-Target Codex` and `-Target Claude` (per this
repo's own `CONTRIBUTING.md` validation checklist) showing 10 skills
installed with correct overwrite/backup plans for the 6 edited existing
skills and correct fresh-install plans for the 2 new ones.

## Process note

This repository's own `github-issue-first`/`CONTRIBUTING.md` workflow
applies to implementing this change: file an issue (or a small issue-per-
skill-file batch, per `github-issue-first`'s batch-filing guidance) with
acceptance criteria before branching, `Refs #N` until the closure gate
passes, milestone `v0.2.0`. The implementation plan (next step, via
`writing-plans`) should reflect this rather than proceeding straight to a
branch.
