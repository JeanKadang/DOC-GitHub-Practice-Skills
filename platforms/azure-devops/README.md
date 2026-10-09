# Azure DevOps migration adapter

This directory does not fork migration policy. The authoritative neutral mapping
and public/private boundary are in
[`docs/azure-devops-migration.md`](../../docs/azure-devops-migration.md).

## At a glance

- **What it is:** a pointer for people moving from Azure DevOps, TFS, or Jira to
  GitHub. It is not an installer target and installs nothing.
- **Where the concept mapping lives:** the neutral mapping (work items, boards,
  iterations, pipelines, test plans, wiki) is in
  [`docs/azure-devops-migration.md`](../../docs/azure-devops-migration.md). The
  `github-for-ado-users` skill explains the same ideas to an assistant.
- **What it does not do:** migrate any organization's process, repositories, or
  work items. It is a mapping, not a migration tool.
- **Public boundary:** organization-specific fields, templates, screenshots,
  URLs, process names, and policies do not belong in this public repository.
  They may live in a private companion repository.
- **Coming from GitLab instead:** see the `github-for-gitlab-users` skill and
  [Module 0.4](../../education/0_prerequisites/module-0-4-coming-from-gitlab.md).
