# Azure DevOps to GitHub mapping

This is neutral concept mapping, not a migration of any organization's process.

## Concept mappings

- **Work item → Issue.** Apply ownership, labels, milestone, and criteria
  deliberately.
- **Work item type → Organization issue type.** On personal repositories, use a
  category label. Keep labels for priority and area.
- **Iteration or sprint → Projects iteration field.** Milestones are delivery or
  release buckets, not sprints.
- **Board → Projects v2.** A board is a view over issues and is warranted only
  with maintained shared ownership.
- **Repository and branch policy → Repository plus ruleset.** Availability
  depends on visibility and plan; required checks use observed CI job names.
- **Pipeline → GitHub Actions workflow.** Workflow YAML lives with the repository
  under `.github/workflows/`.
- **Test Plans → No direct equivalent.** Choose a reviewed test-case system and
  evidence model before migration.
- **Wiki → Versioned files under `docs/`.** GitHub Wiki is separate from PR
  review, CI, and release branches.

Use milestones for releases or delivery phases. Use a Projects iteration field
for cadence when a maintained multi-contributor board exists. Model large work
with a parent issue and native sub-issues rather than recreating a deep
Epic-Feature-Story hierarchy. Keep repositories and Actions workflows as the
versioned sources for code and pipelines.

Organization-specific fields, work-item templates, screenshots, URLs, process
names, policies, and examples do not belong in this public repository. They may
be added later in a private companion repository that declares the public-core
release it depends on.
