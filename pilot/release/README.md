# Publication and rollback

This file describes the planned publication. It does not record that publication has happened, and it reports no test results.

## Content and build

- `pilot/release/content.json` will be the single content source for the release.
- `public-view.mjs` will generate the public views from that source.
- The public views and the coding app will be built together from the same source.
- Publication will go ahead only if the two match on the checked content. They will change together, or neither will change.
- The public artifacts will contain no private content.

## Saved answers

- Existing votes, assigned order and revision history will stay untouched.
- Scope text will become visible on 21 judged claims. This change will be classified `judgment_relevant_presentation`.
- Three judged S.1582 claims (C03, C11 and C19) have no scope text. The label will be hidden on those pages, and no new text will be added.
- The edited audit note on C11 will be preserved. Neither view displays it, so it will not be newly displayed and will not trigger reassessment.
- The argument `S2_SES_oppose_01` will get its own node revision for its `factual_context_correction`.
- The reassessment set will be the 21 claims with newly displayed scope text, the argument `S2_SES_oppose_01`, and every argument that depends on those claims, directly or through another claim.
- Erased research records will not be restored.
- Qualtrics surveys will not change.

## Coordinator tool

`coordinator.mjs` will be a private command-line tool.

- It will require a human disposition for each ordinary mapping note: "No mapping change", "Mapping revised" or "Unresolved". It will not choose one automatically.
- It will export a new private file.
- It will make no remote changes and will not override any answer.

## Rollback

The prior release is `0c5e9e55`.

1. Before rolling back, check that the prior release can load revisions saved under this release.
2. Restore the prior release's code and content together, so the public views and the coding app still match.
3. Redeploy, then compare the live artifacts with the build of the prior release.
4. Keep all saved answers and revisions. Rollback will not delete or change them. Revisions saved under this release will keep the release identity they recorded.
