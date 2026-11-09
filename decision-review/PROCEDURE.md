# Policy Stake Briefs guided review: procedure

This is the review procedure for the guided decision reviews of all eight bills: S.1582, S.J.Res.88, H.R.5408, H.R.131, H.R.4405, H.R.1834, H.R.28 and S.2. Each bill has its own package in `bills/<slug>/`, built by the shared runtime in `runtime/`. The reviews reorganize each bill's frozen, previously reviewed corpus (see `input-manifest.json`); no fact was checked anew for this release.

The earlier H.R.5408 pilot procedure (`../bill_reasoning_pilot_20261108/hr5408/decision-tree/PROCEDURE.md`) stays frozen. The per-value briefs and coding app remain available, with their content, procedure and mapping unchanged. Only their rendered binding was renewed, because the website deploy workflow changed to build these reviews too; nothing else in their implementation changed (`legacy-build-candidate.json`). Neither is this procedure.

## What reviewers do

Reviewers walk through one bill one decision at a time. Each decision shows its claim, the evidence, challenges and limits that bear on that exact claim, and one Yes/No question beside it. Bill provisions and sourced background facts are shown as context beside the decisions that use them; they are never asked as questions.

There are two kinds of decision.

**Causal claims.** A claim about what the bill would cause. The claim is shown at the top in a shaded box labeled CAUSAL CLAIM and again beside the question: “Does the evidence support this claim?” Yes means only that the evidence supports that exact claim, including its stated limits, probability wording and comparison date. It does not accept any later claim or value link. No means insufficient support, not proof that the claim is false.

**Value claims.** After a consequence is accepted, reviewers judge, one value at a time, whether it gives a reason to support or to oppose the bill for that value. The page begins with the paragraph that connects the consequence to the value, in a shaded box labeled VALUE CLAIM. A short statement of the consequence appears beside the question. The question is “Does this consequence help with any of these goals?” for a reason to support, or “Does this consequence work against any of these goals?” for a reason to oppose. Three concrete goals for the value are listed below the question. Where a value has a reference profile (an average American for Personal Security, the United States for Societal Security, a Christian traditionalist in the United States for Tradition), it is shown beside the decision. The exact value statements are shown with the final comparisons. No means the support for this reason is insufficient; it is never a reason in the other direction.

A value claim asks only about the link from an accepted consequence to the value. Every material prediction it needs is a causal claim first, including a narrower population, sector or kind of term than an accepted broader claim, a behavioral, economic or health effect, and a change of scale.

Optional notes are entered below the Yes/No buttons.

## How the review prunes

- A decision is open when at least one of its routes is open. Within a route, every required causal claim must be Yes. Any one route is enough.
- A No sets aside every decision whose every route needs that claim. Set-aside decisions are not asked and their evidence is not required reading; they can still be opened and read.
- Alternative routes survive a No. Each bill's `EDITORIAL_REVIEW.md` lists its alternative routes.
- A causal claim is judged once for the whole bill. Its answer applies wherever the reasoning needs it.
- Leaving a decision blank is not a No. A blank decision is unresolved and blocks nothing.

## Order

The next causal claim is the open one whose No would set aside the most remaining decisions; ties follow the authored order. Right after a causal Yes, the value claims that this Yes opens are asked, one at a time. A decision with an unresolved alternative route waits until that route is settled. Other ready value claims, including those that rest only on bill provisions or sourced context, come after the open causal claims.

## Reading at each decision

Each decision shows the explanation, evidence, challenges and limits for its own inference. Background that applies to several decisions is shown in full the first time it is needed on a path and linked afterwards; local limits are shown in full at every decision they apply to. Accepted earlier claims that a decision needs are listed as plain statements with numbered links, using one number sequence with the source citations on that panel. Background already shown with a directly accepted earlier claim is not repeated. Glossary terms have a dotted underline and show their definition on hover, focus or tap.

## Results

Each value's result is derived from the reviewer's current Yes answers to that value's claims:

- Support or Oppose: Yes answers in one direction only.
- Both: Yes answers in both directions. The reviewer compares the accepted reasons and chooses the stronger direction, SUPPORT or OPPOSE, or Pending, meaning no justified comparison yet. Pending is used only for this comparison.
- Neither: every value claim for that value is answered No or set aside.

The results page shows the accepted reasons and the exact value statements. It does not ask reviewers to judge each value again. No count of reasons decides a result. The comparison guide is unchanged: consider all of the consequences, including their size, timing and reach; count a consequence once; good evidence for an effect does not make the effect large; there is no formula and no winner by number of reasons.

## Changes

If a reviewer reopens an answer, later answers are kept. Any later answer or comparison whose basis changed is marked for another look and does not count until the reviewer answers it again. Nothing is deleted automatically.

## Saving

The default is the whole bill for each reviewer, across as many sittings as needed. Both entry pages for a bill open the same guided review. Anyone can read a review. To record answers, the reviewer signs in with Google, using an account with an active assignment in the existing project. The session type starts as research if the assignment allows it, otherwise quality check; a reviewer allowed both can switch, and the last choice is remembered in that browser. Each change is kept first in the browser for that account and then sent to the reviewer's account on the server. An answer counts as saved only after the server confirms it; until then the page says it is saved in this browser only and offers Retry. If the same session has changed on another device or in another tab, editing stops until the reviewer either uses the server version or keeps this browser's version as a new session. Every saved revision is kept, and none can be deleted from the page. JSON backup and CSV export remain available, and a JSON backup from the same release can be imported as a new session. Answers saved in a browser before sign-in was added are not uploaded automatically. Records from the earlier coding app are neither migrated nor deleted. Storage paths, rules and boundaries are in [README.md](README.md#saving).

## Originals

Every original argument, response, evidence note, strength note and earlier-wording notice remains available, unchanged, in “Original arguments and shared claims”. Reading them is optional and needs no answers.

## Package contract

Each bill folder contains the frozen `input/source.json` and four authored files:

- `decisions.json`: contexts, blocks and causal/value nodes with AND/OR routes, a glossary and the short consequence phrase shown beside each value question. Routes require causal claims only. Every source reference's locator quotation is an exact substring of its named frozen source field, and every citation copies a frozen link and title.
- `coverage.json`: where every original argument, retained response and qualification obligation in the source's requirements ledger is carried, with rationales for consolidations, splits and response dispositions.
- `copy.json`: per-bill interface overrides, if any. Common interface text is `runtime/copy.json`, with public-copy overrides from `site-copy.json`.
- `EDITORIAL_REVIEW.md`: which claims became questions, consolidations and splits, alternative routes, sensitive choices and limits.

H.R.5408 was converted losslessly from its approved pilot package; its approved node, route, context and block text is unchanged (`bills/hr5408/conversion.json`). The conversion comparison in `audit-content.mjs` reads the frozen pilot files in the canonical project. The website copy keeps that code and its report for provenance; rerunning the comparison belongs in the canonical project, where those inputs exist.

## Build and publication

Run from this folder:

1. `npm ci` — installs the pinned dependencies.
2. `npm test` (`node --test runtime/*.test.mjs`) — runtime model, build and storage tests; then `npm run test:rules` — cloud-saving and security-rules tests on the local Auth and Firestore emulators under a demo project, never the production project.
3. `node publication-gate.mjs` — checks that `release-approval.json` binds the current hashes of every package, the runtime, this procedure, `site-copy.json`, `content-verification.json` and `browser-verification.json`, with all findings closed.
4. `node build-site.mjs --out <public-directory>` — validates and builds all eight guided reviews under `/arguments/<slug>/` and the catalog at the site root and `/arguments/`. A single bill can be built with `node runtime/build.mjs bills/<slug> --out <directory>`.

In the website workflow these steps run after the unchanged legacy build and before the Pages upload. The build embeds the public Firebase configuration (`firebase-config.json`) and the bundled client. Production deployment publishes the additive Firestore rules (`backend/firestore.rules`), which leave the earlier coding app's rules unchanged, and then uploads the Pages build. Building fails if any package fails validation: an unknown or cyclic route, a route requiring a value claim, an unused block or context, a source-reference quotation that is not in its named frozen field, a citation link and title that differ from the frozen source, mixed value/direction arguments in one value claim, or a requirement in the ledger that is not carried. The build does not check every quotation in the reader-facing text. Fidelity of those quotations is a separate audit obligation: `audit-content.mjs` screens reader-facing quotation marks against the frozen corpus, and an independent reviewer reads every full source field and its placement.

## Limits

The packages reorganize frozen corpora; no evidence was gathered or checked anew. Which claims became questions, how equivalent arguments were consolidated and where limits sit are editorial judgments, recorded per bill. Structural and quotation checks do not establish that any inference is valid or any prediction true. Every judgment remains human. Human comprehension, reading time and workload are untested, and measured path counts describe the structure only; they do not show that reviewers would save time.
