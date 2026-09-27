# github-repo-configure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an 11th canonical skill, `github-repo-configure`, that elicits org-optional settings (Wiki, Discussions, Project attachment, label scheme) for an already-existing repo and ships generic, reusable issue/PR templates — closing issue #42.

**Architecture:** A new `skills/github-repo-configure/` directory (SKILL.md + agents/openai.yaml + four bundled template files, following `github-repo-review`'s precedent of a skill carrying companion files beyond the standard two) registered in all three manifest sources, plus roster mentions updated across README.md, docs/GUIDE.md, CLAUDE.md, and several smaller doc files that state the skill count in prose.

**Tech Stack:** Markdown (SKILL.md, docs), YAML (agents/openai.yaml, GitHub issue forms), PowerShell (installer manifest), JavaScript/Node test runner (`node --test`), markdownlint-cli2.

**Spec:** `docs/superpowers/specs/2026-09-27-github-repo-configure-design.md`

## Global Constraints

- Repo's package/skillset version is still `0.2.0` (`v0.2.1` is a pending milestone name, not yet tagged/released — verified directly against `package.json`, not assumed). Do not bump `package.json`/`contracts/skill-inventory.json`'s `packageVersion` as part of this feature — that's a release-time decision (`github-releases` skill), not this issue's scope.
- Every doc line touched must stay within markdownlint's line-length limits (`.markdownlint.jsonc`/`.markdownlint-skills.jsonc` — 80 chars for root docs, checked separately for `skills/`). Two earlier PRs this session hit `MD013` from a seemingly-small wording change — always run the matching lint command after any doc edit, don't assume it's fine.
- PR body starts with `Refs #42`; only becomes `Closes #42` once every acceptance criterion below has recorded evidence, per `github-hygiene`'s closure gate:
  - Design decision recorded (spec — already done; ADR added in Task 7).
  - Interactive elicitation covers Wiki, Discussions, Project attachment, label scheme.
  - Issue templates (Bug Report, Improvement) exist, structured for both human and AI-agent triage.
  - `npm run check` passes.
- Branch `feat/42-github-repo-configure` already exists and is checked out (created via `gh issue develop 42`); the design spec is already committed on it as commit `6c070eb`. Continue committing on this same branch — do not create a new one.

## Review Focus

- Someone reuses this repo's own self-referential `.github/ISSUE_TEMPLATE/*` (its own 10/11-skill dropdown, its own public-content checkbox) instead of the new skill's generic `templates/*` — no automated check distinguishes intent; only SKILL.md's own warning text guards this. Read SKILL.md's "Common mistakes" table entry for this in Task 1's self-review.
- `templates/config.yml`'s security-contact URL is a literal placeholder (`<repo-security-policy-url>`) — someone copies it into a real repo without filling it in. Advisory-only; no test can enforce this. Task 2's step calls this out explicitly in the file's own content, not just prose elsewhere.
- `docs/GUIDE.md`'s prose "Trigger and handoff model" paragraph (unlike CLAUDE.md's mechanical bullet list) is easy to forget when adding a roster member — Task 5 includes it explicitly as its own step, not folded silently into the section-add step.
- A "ten"→"eleven" bump lands on the wrong occurrence (e.g. `docs/GUIDE.md`'s unrelated "pause before creating more than ten issues" sentence, which is about a triage batch size, not the skill roster). Task 6's first step is a full-repo grep classifying every remaining "ten"/`\b10\b` occurrence before touching any of them, and its last step re-greps to confirm zero roster-related stragglers remain and the unrelated ones are untouched.
- The new skill's `agents/openai.yaml` prose (`display_name`, `short_description`, `default_prompt`) reads inconsistently with its ten siblings — `scripts/validate-skills.mjs` only checks the file's presence/shape, never prose quality. Task 1 models the wording directly on `github-projects`' and `github-repo-review`'s existing sidecars for tone consistency, and asks for a manual read-back, not just "file exists."

---

### Task 1: `github-repo-configure/SKILL.md` and `agents/openai.yaml`

**Files:**
- Create: `skills/github-repo-configure/SKILL.md`
- Create: `skills/github-repo-configure/agents/openai.yaml`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: the skill's frontmatter `name: github-repo-configure` — every later task (manifest registration, roster docs) must spell this identically.

- [ ] **Step 1: Write `skills/github-repo-configure/SKILL.md`**

```markdown
---
name: github-repo-configure
description: Use when handed an existing repository (already created, possibly already has commits) that needs its org-optional settings configured beyond whatever the company already mandates — not when creating a brand-new repo from scratch (that's github-repo-bootstrap). Covers eliciting decisions on Wiki, Discussions, Project attachment, and label scheme, plus providing dual human/AI-triage issue and PR templates for repos that don't have them yet.
---

# Configuring an already-existing repository

`github-repo-bootstrap` owns the moment a repository doesn't exist yet, or its
initial shell is still incomplete. This skill owns a different, more common
moment: someone handed you a repository that already exists — maybe empty,
maybe with a commit or two, maybe inherited mid-project — and you need to
configure its org-optional settings beyond whatever the company already
mandates. Issues, PRs, and milestones being in use is presumed already a
given; this skill never asks about those.

Configuring settings on an existing repo is real work, not repo creation —
file an issue for it first, the same way `github-issue-first` requires for
any other work, before making changes.

## The elicitation checklist

Ask these four, in order. Each is a yes/no plus a branch — this skill's job
is knowing what to ask and where the answer routes, not owning the mechanics
behind it.

1. **Wiki** — "Does this repo already have an established, actively-used
   Wiki?" If yes, leave it — treat its content as source of truth for what
   it covers. If no, don't enable one unless explicitly asked. See
   `github-repo-bootstrap`'s scaffolding matrix and ADR 0003 for the full
   reasoning behind this conditional stance.
2. **Discussions** — "Enable Discussions? If yes, which categories does this
   repo actually need?" See `github-issue-first`'s Discussions section for
   what each category (`Ideas`, `Q&A`, `RFC`, `Announcements`) is for — don't
   cargo-cult all four onto a repo that only needs one or two.
3. **Project board** — "Attach this repo to a board?" Defer entirely to
   `github-projects`'s "Decide whether a board is warranted" table: no board
   for a solo maintainer, yes once a second maintainer is joining, an
   org-level board (see that skill's "Multi-repo boards" section) if work
   already spans several repos.
4. **Label scheme** — "Does the org already have a label convention, or does
   this repo start fresh?" If the org has one, match it — two schemes in one
   repo is worse than either. Otherwise default to `github-issue-first`'s
   P0–P3 priority tiers plus its category-label set.

## Issue and PR templates

If the repo doesn't already have `.github/ISSUE_TEMPLATE/` forms or a pull
request template, offer to add them — recommend it, don't silently add it,
the same posture `github-issue-first` already takes for templates in
general. This skill's `templates/` directory ships four ready-to-copy,
repo-agnostic files:

- `templates/bug.yml` — a Bug Report issue form.
- `templates/improvement.yml` — an Improvement issue form.
- `templates/config.yml` — disables blank issues and points at private
  security reporting instead of a public issue.
- `templates/pull_request_template.md` — a PR body template following the
  `Refs #N`/`Closes #N` closure-gate shape.

Copy them into the target repo as `.github/ISSUE_TEMPLATE/bug.yml`,
`.github/ISSUE_TEMPLATE/improvement.yml`, `.github/ISSUE_TEMPLATE/config.yml`,
and `.github/pull_request_template.md` respectively. `config.yml`'s security
contact link is a literal placeholder (`<repo-security-policy-url>`) — fill
it in with the target repo's actual `SECURITY.md`/private-reporting URL
before relying on it (see `github-security-response` if that doesn't exist
yet).

Both issue forms are built for dual human/AI-agent use: every field renders
under its own heading in the issue body, so a human reads it like a normal
report and an AI agent doing triage can parse each section (reproduction
steps, environment, impact) without having to split one free-form paragraph
apart itself. Priority is deliberately left unset by the form — auto-labeling
the category (`bug`/`enhancement`) is safe and mechanical, but P0–P3 needs
judgment using the Impact field as input, not a form default.

These are a first pass, not a final or polished set — expect to refine the
exact fields as real repos actually use them.

## Common mistakes

| Mistake | Fix |
|---|---|
| Treating this the same as `github-repo-bootstrap` | Bootstrap owns brand-new repos before an issue exists; this skill's repo already exists and its work goes through normal issue-first |
| Asking about issues, PRs, or milestones | Presumed already in use; not part of this checklist |
| Re-explaining Wiki/Discussions/Projects mechanics here | Cross-reference `github-repo-bootstrap`, `github-issue-first`, `github-projects` — this skill only elicits the decision |
| Silently adding issue/PR templates | Recommend them, add only on explicit confirmation |
| Leaving `config.yml`'s security URL as the placeholder | Fill in the target repo's real reporting URL before use |
| Copying this repo's own `.github/ISSUE_TEMPLATE/*` instead of this skill's `templates/*` | This repo's own templates are self-referential (its own skill-name dropdown, its own public-content policy) — not portable |
```

- [ ] **Step 2: Write `skills/github-repo-configure/agents/openai.yaml`**

```yaml
interface:
  display_name: "GitHub Repo Configure"
  short_description: "Configure an existing repo's org-optional settings"
  default_prompt: "Use $github-repo-configure to configure this existing repository's org-optional settings."
```

- [ ] **Step 3: Verify frontmatter parses and matches the directory name**

Run: `node -e "const fs=require('fs');const {parse}=require('yaml');const m=fs.readFileSync('skills/github-repo-configure/SKILL.md','utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);const fm=parse(m[1]);console.log(fm.name, fm.name==='github-repo-configure')"`

Expected output: `github-repo-configure true`

- [ ] **Step 4: Verify the openai.yaml sidecar parses**

Run: `node -e "const fs=require('fs');const {parse}=require('yaml');console.log(parse(fs.readFileSync('skills/github-repo-configure/agents/openai.yaml','utf8')))"`

Expected: prints the parsed object with no error, `interface.display_name` present.

- [ ] **Step 4a: Manually compare tone against sibling sidecars**

Run: `cat skills/github-projects/agents/openai.yaml skills/github-repo-review/agents/openai.yaml skills/github-repo-configure/agents/openai.yaml`

No automated check validates `display_name`/`short_description`/`default_prompt` prose quality — `scripts/validate-skills.mjs` only checks the file's shape. Read all three side by side and confirm the new one reads as one of the family (same "$skill-name to do X" `default_prompt` pattern, same title-case `display_name`, similarly terse `short_description`) before moving on.

- [ ] **Step 5: Lint the new SKILL.md**

Run: `npx markdownlint-cli2 "skills/github-repo-configure/SKILL.md" --config .markdownlint-skills.jsonc`

Expected: `Summary: 0 issues in 0 files`. Fix any line-length or heading issues before continuing — do not defer lint fixes to a later task.

- [ ] **Step 6: Commit**

```bash
git add skills/github-repo-configure/SKILL.md skills/github-repo-configure/agents/openai.yaml
git commit -m "feat: add github-repo-configure skill content

Refs #42"
```

---

### Task 2: Bundled issue/PR templates

**Files:**
- Create: `skills/github-repo-configure/templates/bug.yml`
- Create: `skills/github-repo-configure/templates/improvement.yml`
- Create: `skills/github-repo-configure/templates/config.yml`
- Create: `skills/github-repo-configure/templates/pull_request_template.md`

**Interfaces:**
- Consumes: nothing.
- Produces: four file paths under `skills/github-repo-configure/templates/` — Task 3 lists these exact four (plus `SKILL.md` and `agents/openai.yaml`) in every manifest's `requiredFiles`. Spell them identically: `templates/bug.yml`, `templates/improvement.yml`, `templates/config.yml`, `templates/pull_request_template.md`.

- [ ] **Step 1: Write `skills/github-repo-configure/templates/bug.yml`**

```yaml
name: Bug report
description: Report a reproducible defect
title: "Bug: "
labels:
  - bug
body:
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
      description: Numbered steps that reliably reproduce the problem.
      placeholder: |
        1. ...
        2. ...
        3. ...
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
      description: What should have happened.
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: Actual behavior
      description: What actually happened instead.
    validations:
      required: true
  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: OS, and the relevant tool(s) and version(s) involved.
      placeholder: |
        OS:
        Tool/version:
    validations:
      required: true
  - type: dropdown
    id: impact
    attributes:
      label: Impact
      description: How much does this affect real work right now?
      options:
        - Blocks work
        - Degrades work
        - Cosmetic
    validations:
      required: true
  - type: textarea
    id: context
    attributes:
      label: Additional context
      description: Logs, screenshots, or anything else relevant. Optional.
    validations:
      required: false
```

- [ ] **Step 2: Write `skills/github-repo-configure/templates/improvement.yml`**

```yaml
name: Improvement
description: Propose a focused enhancement
title: "Improvement: "
labels:
  - enhancement
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What's limiting or missing today.
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: Proposed change
      description: What to do about it.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: Other approaches you weighed and why you didn't pick them. Optional.
    validations:
      required: false
  - type: textarea
    id: impact
    attributes:
      label: Impact if not done
      description: What stays broken or limited if this doesn't happen.
    validations:
      required: true
  - type: textarea
    id: context
    attributes:
      label: Additional context
      description: Anything else relevant. Optional.
    validations:
      required: false
```

- [ ] **Step 3: Write `skills/github-repo-configure/templates/config.yml`**

```yaml
blank_issues_enabled: false
contact_links:
  - name: Report a security vulnerability
    url: <repo-security-policy-url>
    about: Read the security policy and use GitHub private vulnerability reporting. Never file a vulnerability as a public issue.
```

- [ ] **Step 4: Write `skills/github-repo-configure/templates/pull_request_template.md`**

```markdown
Refs #N <!-- markdownlint-disable-line MD041 -->

## Summary

Describe the focused change and its boundaries.

## Acceptance-criterion evidence

- Criterion: replace with the exact criterion or identifier.
- Evidence: cite the diff, test, CI, document, or reproduction.
- Result: Met, Unmet, or Unevaluated.

Keep `Refs #N` while any in-scope criterion is unmet or unevaluated. Replace it
with a closing keyword only after the issue's complete evidence gate passes.

## Validation

- [ ] Tests/checks relevant to this change pass.
- [ ] Manually verified the change behaves as described above.
```

- [ ] **Step 5: Verify both issue forms are valid YAML**

Run: `node -e "const fs=require('fs');const {parse}=require('yaml');for(const f of ['bug','improvement','config']){parse(fs.readFileSync('skills/github-repo-configure/templates/'+f+'.yml','utf8'));console.log(f,'OK')}"`

Expected: `bug OK`, `improvement OK`, `config OK` — a real parse of every field, not just a presence check. A malformed form would throw here; nothing else in this repo's toolchain validates GitHub issue-form YAML.

- [ ] **Step 6: Lint the new markdown template**

Run: `npx markdownlint-cli2 "skills/github-repo-configure/templates/pull_request_template.md" --config .markdownlint-skills.jsonc`

Expected: `Summary: 0 issues in 0 files`.

- [ ] **Step 7: Commit**

```bash
git add skills/github-repo-configure/templates/
git commit -m "feat: add generic issue/PR templates for github-repo-configure

Refs #42"
```

---

### Task 3: Register the skill in all three manifest sources

**Files:**
- Modify: `contracts/skill-inventory.json`
- Modify: `scripts/validate-skills.mjs`
- Modify: `scripts/install-skills.ps1`

**Interfaces:**
- Consumes: the exact `requiredFiles` list from Tasks 1–2: `["SKILL.md", "agents/openai.yaml", "templates/bug.yml", "templates/improvement.yml", "templates/config.yml", "templates/pull_request_template.md"]`.
- Produces: `tests/roster-consistency.test.mjs` (unmodified — it's the cross-check) goes from passing-at-10 to passing-at-11 once all three files agree.

- [ ] **Step 1: Confirm the roster-consistency test currently passes at 10**

Run: `node --test tests/roster-consistency.test.mjs`

Expected: `pass 1`, `fail 0` (baseline before this task's edits).

- [ ] **Step 2: Add the entry to `contracts/skill-inventory.json`**

Insert alphabetically between the `github-repo-bootstrap` and `github-repo-review` entries:

```diff
     { "name": "github-repo-bootstrap", "requiredFiles": ["SKILL.md", "agents/openai.yaml"] },
+    { "name": "github-repo-configure", "requiredFiles": ["SKILL.md", "agents/openai.yaml", "templates/bug.yml", "templates/improvement.yml", "templates/config.yml", "templates/pull_request_template.md"] },
     { "name": "github-repo-review", "requiredFiles": ["SKILL.md", "agents/openai.yaml", "review-prompt.md"] },
```

- [ ] **Step 3: Run the roster-consistency test — expect it to now FAIL**

Run: `node --test tests/roster-consistency.test.mjs`

Expected: FAIL — inventory now has 11 names, `CANONICAL_SKILLS` (not yet updated) still has 10; the assertion diffing `sortedNames(inventory.skills)` against `sortedNames(CANONICAL_SKILLS)` reports the mismatch. This confirms the test actually detects a real roster divergence, not just a name-shape check.

- [ ] **Step 4: Add the entry to `scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`**

Insert between the `github-repo-bootstrap` and `github-repo-review` entries, using the same multi-line object shape `github-repo-review` already uses (its `requiredFiles` array is long enough to warrant it, and so is this one):

```diff
   { name: 'github-repo-bootstrap', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
+  {
+    name: 'github-repo-configure',
+    requiredFiles: [
+      'SKILL.md',
+      'agents/openai.yaml',
+      'templates/bug.yml',
+      'templates/improvement.yml',
+      'templates/config.yml',
+      'templates/pull_request_template.md',
+    ],
+  },
   {
     name: 'github-repo-review',
     requiredFiles: ['SKILL.md', 'agents/openai.yaml', 'review-prompt.md'],
   },
```

- [ ] **Step 5: Run the roster-consistency test — still expect FAIL, different message**

Run: `node --test tests/roster-consistency.test.mjs`

Expected: FAIL — now `CANONICAL_SKILLS` and `contracts/skill-inventory.json` agree on names, but `install-skills.ps1`'s `$canonicalRequiredFiles` (not yet updated) still has 10, so the installer-vs-canonical name comparison fails instead.

- [ ] **Step 6: Add the entry to `scripts/install-skills.ps1`'s `$canonicalRequiredFiles`**

Insert between the `github-repo-bootstrap` and `github-repo-review` lines:

```diff
     'github-repo-bootstrap' = @('SKILL.md', 'agents/openai.yaml')
+    'github-repo-configure' = @('SKILL.md', 'agents/openai.yaml', 'templates/bug.yml', 'templates/improvement.yml', 'templates/config.yml', 'templates/pull_request_template.md')
     'github-repo-review' = @('SKILL.md', 'agents/openai.yaml', 'review-prompt.md')
```

- [ ] **Step 7: Run the roster-consistency test — expect PASS**

Run: `node --test tests/roster-consistency.test.mjs`

Expected: `pass 1`, `fail 0`. All three sources now agree on 11 skills.

- [ ] **Step 8: Run the full validate + install-skills suites to catch anything else roster-size-dependent**

Run: `npm run validate && node --test tests/install-skills.test.mjs tests/validate-skills.test.mjs`

Expected: `npm run validate` passes (it validates the on-disk `skills/github-repo-configure/` tree against the inventory now that both exist). The two test files are expected to FAIL at this point — their hardcoded `10`/`ten` literals haven't been updated yet (Task 4). Read the failure output and confirm the failures are exactly the count-literal assertions (`/Skills \(10\)/`, `result.skills.length, 10`, etc.), not something unrelated — an unrelated failure here means Task 1 or 2's new files have a real problem, not just a stale literal.

- [ ] **Step 9: Commit**

```bash
git add contracts/skill-inventory.json scripts/validate-skills.mjs scripts/install-skills.ps1
git commit -m "feat: register github-repo-configure in the canonical roster

Refs #42"
```

---

### Task 4: Bump hardcoded skill-count literals in the test suite

**Files:**
- Modify: `tests/install-skills.test.mjs`
- Modify: `tests/validate-skills.test.mjs`

**Interfaces:**
- Consumes: nothing new — these are pre-existing tests whose literal expectations must track the roster size Task 3 just changed from 10 to 11.
- Produces: nothing new; makes the existing test suite green again.

- [ ] **Step 1: Update `tests/install-skills.test.mjs`'s dry-run count assertion**

```diff
   assert.match(result.stdout, /Target:\s+Codex/i);
   assert.match(result.stdout, /Target:\s+Claude/i);
-  assert.match(result.stdout, /Skills \(10\)/i);
+  assert.match(result.stdout, /Skills \(11\)/i);
   assert.match(result.stdout, /backup/i);
```

- [ ] **Step 2: Update the two test names using "ten"**

```diff
-test('Copilot target installs all ten skills under CopilotHome/skills', async () => {
+test('Copilot target installs all eleven skills under CopilotHome/skills', async () => {
```

```diff
-test('Both installs exactly ten skills per target with matching SKILL.md hashes', async () => {
+test('Both installs exactly eleven skills per target with matching SKILL.md hashes', async () => {
```

- [ ] **Step 3: Update `tests/validate-skills.test.mjs`'s test name and count assertion**

```diff
-test('accepts the canonical ten-skill checkout', async () => {
+test('accepts the canonical eleven-skill checkout', async () => {
   const result = await validateRepository(repoRoot);
   assert.deepEqual(result.errors, []);
-  assert.equal(result.skills.length, 10);
+  assert.equal(result.skills.length, 11);
 });
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: all tests pass, including the four just touched and `tests/roster-consistency.test.mjs`.

- [ ] **Step 5: Commit**

```bash
git add tests/install-skills.test.mjs tests/validate-skills.test.mjs
git commit -m "test: bump hardcoded skill-count literals to eleven

Refs #42"
```

---

### Task 5: Core roster documentation (README.md, docs/GUIDE.md, CLAUDE.md)

**Files:**
- Modify: `README.md`
- Modify: `docs/GUIDE.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: the skill name `github-repo-configure` and its one-line summary from the spec.
- Produces: nothing consumed by later tasks — this is a leaf/documentation task.

- [ ] **Step 1: Add the skill to `README.md`'s `## Skills` list**

Insert after the `github-repo-bootstrap` bullet:

```diff
 - `github-repo-bootstrap` creates and verifies a new repository safely.
+- `github-repo-configure` elicits org-optional settings and issue/PR
+  templates for an already-existing repository.
 - `github-security-response` keeps exploitable findings and credentials private.
```

- [ ] **Step 2: Add the skill's section to `docs/GUIDE.md`**

Insert after the `### \`github-repo-bootstrap\`` section, before `### \`github-security-response\``:

```markdown
### `github-repo-configure`

- **Trigger:** Handed an already-existing repository (not brand-new) that
  needs its org-optional settings configured.
- **Responsibilities and outputs:** Elicit Wiki, Discussions, Project
  attachment, and label-scheme decisions; offer generic, dual human/AI-triage
  issue and PR templates for repos that don't have them yet.
- **Boundary and handoff:** Never re-documents Wiki/Discussions/Projects
  mechanics — defers to `github-repo-bootstrap`, `github-issue-first`, and
  `github-projects` for those. Configuring settings is real work, so it goes
  through `github-issue-first` like anything else.
```

- [ ] **Step 3: Add the skill to `docs/GUIDE.md`'s "Trigger and handoff model" prose**

This paragraph is prose, not a mechanical list — easy to forget. Insert a sentence right after the existing bootstrap mention:

```diff
 Security is a private branch in the flow: `github-security-response` replaces
 the public issue and PR path until coordinated disclosure is safe. Repository
-creation begins with `github-repo-bootstrap`. `github-projects` adds a view only
+creation begins with `github-repo-bootstrap`; configuring an already-existing
+repository's org-optional settings uses `github-repo-configure` instead.
+`github-projects` adds a view only
 when shared ownership justifies the maintenance. `github-for-ado-users` explains
 the mapping but does not mutate a repository by itself.
```

- [ ] **Step 4: Update `CLAUDE.md`'s roster heading and enumeration**

```diff
-### The ten canonical skills and their handoffs
+### The eleven canonical skills and their handoffs
```

Insert after the `github-repo-bootstrap` bullet, before the `github-security-response` bullet:

```diff
 - `github-repo-bootstrap` — the only skill allowed to create repo content
   *before* an issue exists (the initial shell); everything after that shell
   goes through the normal issue-first flow.
+- `github-repo-configure` — elicits org-optional settings (Wiki,
+  Discussions, Project attachment, label scheme) for an already-existing
+  repo, and ships generic issue/PR templates. Distinct from
+  `github-repo-bootstrap`: this skill's repo already exists, so its work
+  goes through normal issue-first, not the pre-issue exception.
 - `github-security-response` — replaces the public issue/PR path until
```

- [ ] **Step 5: Lint all three files**

Run: `npm run lint:markdown:docs`

(This runs `markdownlint-cli2 "**/*.md" "#node_modules/**" "#skills/**" "#docs/superpowers/**" "#.superpowers/**" "#education/**"` — no separate config file, verified directly against `package.json` rather than assumed.)

Expected: `Summary: 0 issues in 0 files`. Watch specifically for `MD013` line-length — every doc edit this session that skipped this check needed a follow-up fix.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/GUIDE.md CLAUDE.md
git commit -m "docs: add github-repo-configure to the core roster docs

Refs #42"
```

---

### Task 6: Remaining "ten"→"eleven" mentions and issue-template dropdowns

**Files:**
- Modify: `CONTRIBUTING.md`
- Modify: `docs/MAINTAINING.md`
- Modify: `docs/claude.md`
- Modify: `docs/copilot.md`
- Modify: `docs/openai-codex.md`
- Modify: `docs/vscode.md`
- Modify: `.github/ISSUE_TEMPLATE/bug.yml`
- Modify: `.github/ISSUE_TEMPLATE/improvement.yml`

**Interfaces:**
- Consumes: the skill name `github-repo-configure`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Full-repo grep to classify every remaining "ten"/`10` occurrence before editing anything**

Run: `grep -rn "\bten\b\|\b10\b" --include="*.md" --include="*.yml" . 2>/dev/null | grep -vE "node_modules|docs/superpowers|\.git/"`

Classify each hit as roster-related (edit it) or unrelated (leave it — e.g. `docs/GUIDE.md`'s "pause before creating more than ten issues" is about a triage batch size, already confirmed unrelated and already left alone in Task 5). Do not edit anything this step didn't classify as roster-related.

- [ ] **Step 2: `CONTRIBUTING.md`**

```diff
-Policy changes to a canonical `SKILL.md` must consider all ten skills and all
+Policy changes to a canonical `SKILL.md` must consider all eleven skills and all
 three consuming platforms (OpenAI Codex, Claude, GitHub Copilot). Installed
```

- [ ] **Step 3: `docs/MAINTAINING.md` (three spots)**

```diff
-When a shared rule changes, inspect all ten `skills/*/SKILL.md` files, the
+When a shared rule changes, inspect all eleven `skills/*/SKILL.md` files, the
 standalone repository-review prompt, the guide, workflow, platform guides,
```

```diff
-required companion file. Before release, verify all ten frontmatter names and
+required companion file. Before release, verify all eleven frontmatter names and
 OpenAI metadata, and ensure **the skillset's** git tag (without its leading
```

```diff
-The canonical ten-skill roster (names and required files) is independently
+The canonical eleven-skill roster (names and required files) is independently
 hardcoded in three places: `contracts/skill-inventory.json`,
```

- [ ] **Step 4: `docs/claude.md`, `docs/copilot.md`, `docs/openai-codex.md` (same sentence in each)**

```diff
-Review the source, target, ten skills, overwrite decisions, and backup paths.
+Review the source, target, eleven skills, overwrite decisions, and backup paths.
```

- [ ] **Step 5: `docs/vscode.md`**

```diff
 - [docs/GUIDE.md](GUIDE.md) — the full trigger/handoff model across all ten
-  skills.
+  eleven skills.
```

(Re-read the actual line wrap before applying — `sed -n '95,97p' docs/vscode.md` — and adjust wrapping if `eleven` pushes a line over the 80-char limit; reflow rather than leave a long line.)

- [ ] **Step 6: Add `github-repo-configure` to this repo's own issue-template dropdowns**

In both `.github/ISSUE_TEMPLATE/bug.yml` and `.github/ISSUE_TEMPLATE/improvement.yml`, the `skills` dropdown's `options` list — insert alphabetically between `github-projects` and `github-releases` (matching the existing list's order, which is not the same alphabetical order as the manifests — read the actual list before assuming position; it currently reads `github-issue-first, github-hygiene, github-releases, github-contributing, github-pr-review, github-repo-review, github-repo-bootstrap, github-security-response, github-projects, github-for-ado-users, Installer...` — insert `github-repo-configure` right after `github-repo-bootstrap`, matching that existing entry's adjacency):

```diff
         - github-repo-bootstrap
+        - github-repo-configure
         - github-security-response
```

Apply the identical change to both files (they currently carry the same list).

- [ ] **Step 7: Lint everything touched in this task**

Run: `npm run lint:markdown:docs`

Expected: `0 issues in 0 files`. (The `.yml` files aren't markdown-linted; Step 8 covers their validity instead.)

- [ ] **Step 8: Verify both edited issue-template YAML files still parse**

Run: `node -e "const fs=require('fs');const {parse}=require('yaml');for(const f of ['bug','improvement']){parse(fs.readFileSync('.github/ISSUE_TEMPLATE/'+f+'.yml','utf8'));console.log(f,'OK')}"`

Expected: `bug OK`, `improvement OK`.

- [ ] **Step 9: Re-grep to confirm no roster-related "ten"/`10` remains and nothing unrelated was touched**

Run: `grep -rn "\bten\b\|\b10\b" --include="*.md" --include="*.yml" . 2>/dev/null | grep -vE "node_modules|docs/superpowers|\.git/"`

Expected: only the previously-classified *unrelated* hits remain (e.g. `docs/GUIDE.md`'s "ten issues" triage-batch-size sentence, and any hits inside `docs/adr/*` describing past decisions, which are historical record and must not be edited).

- [ ] **Step 10: Commit**

```bash
git add CONTRIBUTING.md docs/MAINTAINING.md docs/claude.md docs/copilot.md docs/openai-codex.md docs/vscode.md .github/ISSUE_TEMPLATE/bug.yml .github/ISSUE_TEMPLATE/improvement.yml
git commit -m "docs: bump remaining skill-count mentions to eleven

Refs #42"
```

---

### Task 7: ADR 0004

**Files:**
- Create: `docs/adr/0004-add-github-repo-configure.md`
- Modify: `docs/adr/README.md`

**Interfaces:**
- Consumes: the design decision already recorded in the spec (new-skill-vs-enhancement, and why).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `docs/adr/0004-add-github-repo-configure.md`**, following ADR 0002's format (Status / Context / Decision / Consequences):

```markdown
# ADR 0004: Add `github-repo-configure` as an 11th skill

## Status

Accepted (2026-09-28).

## Context

Issue #42 identified a real, common trigger moment with no owner in the
existing roster: someone is handed a repository that already exists
(possibly with commits already), not one being created from scratch, and
needs its org-optional settings (Wiki, Discussions, Project attachment,
label scheme) configured. `github-repo-bootstrap` is explicitly scoped to
"the only skill allowed to create repo content before an issue exists" —
stretching it to also cover an already-existing repo would blur that stated
architectural invariant. `github-issue-first` was considered as the host
instead, but bolting a repo-settings/scaffolding topic onto a skill about
filing workflow would dilute its focused trigger, the same bloat problem
ADR 0002 fixed by splitting `github-hygiene`.

Full design reasoning, the elicitation checklist, and the template field
design: `docs/superpowers/specs/2026-09-27-github-repo-configure-design.md`.

## Decision

- Add `github-repo-configure`: a new skill triggered by "handed an existing
  repo, need to configure org-optional settings" — distinct from
  `github-repo-bootstrap`'s pre-issue-exists scope.
- It elicits four decisions (Wiki, Discussions, Project attachment, label
  scheme) and cross-references — never duplicates — the skills that already
  own each decision's mechanics (`github-repo-bootstrap`, `github-issue-first`,
  `github-projects`).
- It bundles four generic, portable issue/PR template files
  (`templates/bug.yml`, `templates/improvement.yml`, `templates/config.yml`,
  `templates/pull_request_template.md`) as companion files, precedented by
  `github-repo-review` already bundling `review-prompt.md` beyond the
  standard `SKILL.md` + `agents/openai.yaml`.

## Consequences

- The canonical roster is 11 skills, not 10. `contracts/skill-inventory.json`,
  `scripts/validate-skills.mjs`'s `CANONICAL_SKILLS`, and
  `scripts/install-skills.ps1`'s `$canonicalRequiredFiles` each needed the new
  entry; `tests/roster-consistency.test.mjs` continues to catch any future
  drift between the three automatically.
- `tests/install-skills.test.mjs` and `tests/validate-skills.test.mjs` had
  their own hardcoded "ten"/`10` literals (an output-format regex, three test
  names, a length assertion) needing updating — the same class of gap ADR
  0002 flagged for the prior 8→10 change; these don't self-correct.
- Several prose mentions of the skill count across `CONTRIBUTING.md`,
  `docs/MAINTAINING.md`, `docs/claude.md`, `docs/copilot.md`,
  `docs/openai-codex.md`, and `docs/vscode.md` needed the same bump — a
  broader set than ADR 0002's own consequences list named, found by a
  full-repo grep rather than assumed from precedent.
- This repo's own `.github/ISSUE_TEMPLATE/bug.yml` and `improvement.yml`
  "Affected skills" dropdowns needed the new skill added — self-referential,
  since this repo now has 11 skills a bug could be filed against.
- The templates bundled with this skill are a first pass, expected to be
  refined before a near-final release, per the maintainer during design.
- Evidence: issue #42, PR (this branch).
```

- [ ] **Step 2: Add the entry to `docs/adr/README.md`'s index**

```diff
 - [0003](0003-wiki-discussions-multirepo-projects.md) — Conditional Wiki
   stance, substantive Discussions guidance, multi-repo Projects how-to.
+- [0004](0004-add-github-repo-configure.md) — Added `github-repo-configure`
+  as an 11th skill for configuring an already-existing repository.
```

- [ ] **Step 3: Lint**

Run: `npm run lint:markdown:docs`

Expected: `0 issues in 0 files`.

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0004-add-github-repo-configure.md docs/adr/README.md
git commit -m "docs: add ADR 0004 for github-repo-configure

Refs #42"
```

---

### Task 8: Full verification and PR

**Files:** none new — verification only.

- [ ] **Step 1: Run the complete repository check**

Run: `npm run check`

Expected: all tests pass (roster-consistency, install-skills, validate-skills, workflow-policy), all three markdown lint configs report `0 issues in 0 files`.

- [ ] **Step 2: Push the branch**

Run: `git push -u origin feat/42-github-repo-configure`

- [ ] **Step 3: Open the PR**

```bash
gh pr create --repo JeanKadang/DOC-GitHub-Practice-Skills \
  --title "feat: add github-repo-configure skill (issue #42)" \
  --base main --head feat/42-github-repo-configure \
  --body "Refs #42 — see docs/superpowers/specs/2026-09-27-github-repo-configure-design.md for the design and docs/adr/0004-add-github-repo-configure.md for the decision record. Fill in verification section with actual npm run check output before opening."
```

Replace the placeholder body with the real PR body once Step 1's actual output is in hand — do not paste a template placeholder into a real PR (violates this plan's own "No Placeholders" rule as much as it would violate the repo's).

- [ ] **Step 4: Watch CI**

Run: `gh pr checks <PR-number> --repo JeanKadang/DOC-GitHub-Practice-Skills --watch`

Expected: every leg (Windows, Ubuntu, macOS installer dry runs; Node 20/22 validate; markdown lint; the label-copy workflow from #49) passes.

- [ ] **Step 5: Evaluate every acceptance criterion against real evidence, then decide Refs vs. Closes**

Re-read issue #42's four acceptance criteria against what actually shipped (design decision recorded — yes, ADR 0004 + spec; elicitation covers all four settings — yes, Task 1; templates exist for both audiences — yes, Task 2; `npm run check` passes — yes, Step 1). If all four hold, edit the issue body to check them with evidence (same pattern used for #21/#45/#33 earlier this session: `gh issue edit 42 --body-file <file>`), then update the PR body to `Closes #42`. If any criterion doesn't hold, keep `Refs #42` and say why.

- [ ] **Step 6: After merge, audit issue #42's state**

Run: `gh issue view 42 --repo JeanKadang/DOC-GitHub-Practice-Skills --json state,stateReason`

Per the connected-branch lesson from #49 and #45 earlier this session: if it auto-closed via the linked branch despite `Refs` still being in place at merge time, reopen it immediately with a comment explaining why (same as done for #49).
