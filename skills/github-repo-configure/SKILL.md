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
