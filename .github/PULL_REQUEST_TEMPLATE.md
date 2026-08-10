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

- [ ] `npm run check`
- [ ] Installer dry run for affected targets
- [ ] Public-content scan and manual review when content changes
- [ ] Cross-skill invariant review when shared policy changes

## Public-content confirmation

- [ ] This pull request contains no credentials, private endpoints, personal
  data, organization-specific fields or templates, screenshots of private
  systems, or copied workplace policy.
