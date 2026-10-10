# Architecture decision records

This directory records decisions whose reasoning is worth keeping once the
issue or pull request that produced them has scrolled out of view — the kind
that get re-litigated later because the "why" only ever lived in chat or issue
history. `docs/GUIDE.md`, `docs/WORKFLOW.md`, and `docs/MAINTAINING.md` state
*current* policy; an ADR records *why* a specific past decision landed where
it did, evidence included.

## When to add one

Add an ADR when a policy or design choice was genuinely contested, when a
prior approach turned out to be wrong and got corrected, or when a future
contributor is likely to ask "why not just do X instead?" and the honest
answer requires context that a policy document alone won't carry. Routine
documentation clarifications and typo-level fixes do not need one.

## Format

- File name: `NNNN-short-kebab-title.md`, numbered sequentially, never
  renumbered or reused even if a decision is later superseded.
- Sections: **Status** (Accepted / Superseded by ADR-NNNN), **Context** (the
  situation and evidence that forced the decision), **Decision** (what was
  decided, stated plainly), **Consequences** (what this makes easier or
  harder, and what it rules out).
- ADRs are immutable once accepted. A changed decision gets a new ADR that
  supersedes the old one; do not edit history in place.

## Index

Every ADR below is Accepted unless its entry says more. When a later ADR
supersedes part of an earlier one, both entries say so and the earlier ADR's own
text is not edited.

- [0001](0001-refs-closes-connected-branch-closure.md) — `Refs`/`Closes`
  closure semantics must account for GitHub's connected-branch auto-closure.
- [0002](0002-split-hygiene-add-contributing-and-releases.md) — Split
  `github-hygiene` into hygiene + releases and added `github-contributing`.
- [0003](0003-wiki-discussions-multirepo-projects.md) — Conditional Wiki
  stance, substantive Discussions guidance, multi-repo Projects how-to.
- [0004](0004-add-github-repo-configure.md) — Added `github-repo-configure`
  as an 11th skill for configuring an already-existing repository.
- [0005](0005-add-github-for-gitlab-users.md) — Added
  `github-for-gitlab-users` as a 12th skill, mirroring
  `github-for-ado-users`'s shape.
- [0006](0006-chatgpt-coverage.md) — ChatGPT coverage via a Custom GPT
  export target, not an installer directory-copy or an Actions schema. Status:
  Superseded by ADR 0016.
- [0007](0007-two-track-education-program.md) — Split `education/` into a
  GitHub track and an LLM/VS Code tooling track, both staged across the
  same five tiers. Status: Accepted; its folder-naming specifics are
  superseded by ADR 0009.
- [0008](0008-education-portability-via-bundling.md) — Made `education/`
  portable by bundling the skill files it references, not duplicating
  their content, reusing ADR 0006's ChatGPT export precedent.
- [0009](0009-education-numbered-folders.md) — Numbered `education/`
  folders for reading order, refining ADR 0007; promoted the LLM track's
  Pre-requisite page to required reading. Status: Accepted; its reserved
  `4_next-level/` folder name is superseded by ADR 0011.
- [0010](0010-single-agent-guidance-file.md) — `AGENTS.md` is the one canonical
  agent-guidance file and `CLAUDE.md` imports it, enforced by a test.
- [0011](0011-education-module-numbering.md) — `module-X-Y` file names for every
  numbered education lesson, and `4_next-step/` replaces the reserved
  `4_next-level/`. Status: Accepted; supersedes that part of ADR 0009.
- [0012](0012-milestone-scheme.md) — Milestones are release-named for the
  skillset and "Education Program vN" for `education/`; a thematic skillset
  milestone lasts only until a release scopes it.
- [0013](0013-education-bundle-script.md) — The education bundle is built by a
  Node script with derived dependencies and a manifest, implementing ADR 0008.
- [0014](0014-repository-layout-guidance.md) — Repository layout guidance lives
  in `github-repo-bootstrap`, with a structure check in `github-repo-review` and
  an early restructure prompt in `github-hygiene`; no new skill.
- [0015](0015-education-prerequisites-restructure.md) — `0_prerequisites/` is
  eight numbered modules (version control, Git, GitHub, GitLab, tool kinds, LLM
  assistants, two setup pages). Status: Accepted; supersedes the part of ADR 0009
  that lists the folder's contents and keeps the taxonomy outside the sequence.
- [0016](0016-retire-the-chatgpt-route.md) — Retires the ChatGPT route: the
  Custom GPT export, its docs and tests are removed and the supported platforms
  are three. Status: Accepted; supersedes ADR 0006.
