# ADR 0015: `0_prerequisites/` is eight numbered modules

## Status

Accepted (2026-10-09). Supersedes the part of ADR 0009 that lists what
`0_prerequisites/` holds, and its rule that the AI tooling taxonomy stays outside
the numbered sequence. The rest of ADR 0009 (numbered folders, the LLM page
being required reading) stands, and ADR 0009 itself is not edited.

## Context

ADR 0009 put three pages in `0_prerequisites/`: Module 0.1 (version control),
the LLM prerequisite, and one setup page. ADR 0011 gave numbered lessons
`module-X-Y` names but renamed only Module 0.1 in this folder, so the other two
pages had no number and the reading order was not visible in a listing. Module
0.1 had also grown to cover version control, Git, GitHub, account protection and
a GitLab and Azure DevOps table in one page. The AI tooling taxonomy had been
written on the side as a lookup page and was only linked from a footer. Other
teams use GitLab today and are supposed to move to GitHub, which the
prerequisites did not address beyond one table (issue #272).

## Decision

- Every page in `0_prerequisites/` is a numbered module:
  - **0.1** What Is Version Control?
  - **0.2** What Is Git?
  - **0.3** What Is GitHub? (with the account-protection checklist)
  - **0.4** Coming from GitLab (conditional: for teams moving to GitHub)
  - **0.5** What kinds of tools are these? (IDEs, assistants, coding assistants,
    agents; a short rewrite of the taxonomy)
  - **0.6** What Is an LLM Assistant? (the former LLM prerequisite, still required)
  - **0.7** Set up VS Code (conditional)
  - **0.8** Connect VS Code to Git, GitHub and an AI assistant (conditional)
- Modules 0.1 to 0.3, 0.5 and 0.6 are required reading. Modules 0.4, 0.7 and 0.8
  are conditional, and the education README routing says who skips what.
- The detailed product tables, the classification matrix, the dated naming notes
  and the "where does a new product belong" guide stay in
  `education/examples/ai-tooling-taxonomy.md`, a lookup reference outside the
  numbered sequence, because product names change quickly. Module 0.5 teaches
  the kinds and links to it.
- The GitLab page orients readers and points to `skills/github-for-gitlab-users/SKILL.md`
  for the mapping and its traps. It does not restate the skill, and it does not
  cover repository or pipeline migration.
- Each module in this folder has an explainer graphic (issue #270), and hands-on
  modules state permissions, starting and success state, likely errors and
  cleanup (issue #151).

## Consequences

- File names changed: `prerequisite-what-is-an-llm-assistant.md` became
  `module-0-6-what-is-an-llm-assistant.md`, and `setup-local-dev-environment.md`
  was split into Modules 0.7 and 0.8. Every in-repository reference was updated.
  Links from outside the repository to the old names will break.
- Nothing was dropped: account protection, the vocabulary and comparison tables,
  Git install and identity, VS Code install, the GitHub Enterprise connection, the
  GitHub CLI step and the extensions all moved to the page they belong on.
- Module 0.3 is about 15 minutes because it carries the account checklist. The
  other concept pages are about 5 to 10 minutes.
- A reader on a GitLab team has a route through the prerequisites (0.3, then 0.4)
  and a pointer to the full mapping skill.
