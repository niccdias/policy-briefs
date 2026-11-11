# Guided decision reviews (November 9, 2026)

This folder holds the guided decision reviews for eight bills and the runtime that validates and builds them. Each review reorganizes one bill's frozen, previously reviewed corpus into a root-first decision tree: context that is not asked, causal claims, and value claims, with AND/OR routes that set aside later decisions after a No. Reviewers' procedure is in [PROCEDURE.md](PROCEDURE.md).

This is a frozen-corpus migration. No evidence was gathered or checked anew. It is not the fresh-inventory pipeline in `../harness/prompts/bill_wide/`, whose validator and build adapter are not implemented. Because this migration reads and publishes all eight corpora, none of these bills can serve as an unseen bill for that pipeline's held-out benchmark.

## Layout

- `input-manifest.json`: the eight bills, their frozen source hashes and counts, and the upstream website commit they were staged from.
- `bills/<slug>/`: one package per bill. `input/source.json` is frozen and never edited. The authored files are `decisions.json`, `coverage.json`, `copy.json` and `EDITORIAL_REVIEW.md` (H.R.5408 has `conversion.json` instead of an editorial review: it was first converted losslessly from its approved pilot, and that file also records its later definition-only amendments). Definitions live in each package's glossary rather than in the reading text (see [PROCEDURE.md](PROCEDURE.md#reading-at-each-decision)); `copy.json` can set `bill_description` when the displayed short description needed definitions removed. `private/` is ignored by Git and holds working files only.
- `runtime/`: the shared model, validators, rendering, local and cloud storage (`firebase.mjs`), path measurement, build and tests. `runtime/copy.json` holds the common interface text; `site-copy.json` holds public-copy overrides.
- `package.json`, `package-lock.json`: pinned Firebase client, bundler and emulator test tools.
- `firebase-config.json`: the public web configuration of the existing Firebase project. It is not a secret; access is controlled by Google sign-in and the security rules.
- `firebase.json`, `backend/firestore.rules`: emulator settings and the Firestore security rules (see Saving).
- `stage-inputs.mjs`: stages each bill's `input/source.json` from an approved website checkout. It imports the canonical project's `../bill_reasoning_pilot_20261108/hr5408/logic.mjs`, so it runs only in the canonical project; a website copy is kept for provenance.
- `convert-hr5408.mjs`: converts the approved H.R.5408 pilot package into this format. It reads the frozen pilot files in `../bill_reasoning_pilot_20261108/hr5408/`, so it runs only in the canonical project; a website copy is kept for provenance.
- `audit-content.mjs`: read-only content audit of announced packages. It runs native validation, an independent AND/OR route oracle, every single causal No, combined Nos across alternative routes and a screen of reader-facing quotation marks, and writes `content-audit-findings.json`. Its H.R.5408 conversion comparison reads the frozen pilot files in the canonical project, so rerunning that comparison belongs there; the website copy keeps the code and its report for provenance.
- `browser-qa.mjs`: browser checks on a built public directory; writes `browser-verification.json`.
- `build-site.mjs`, `publication-gate.mjs`: site build and publication gate (below).
- `legacy-build-candidate.json`: the legacy per-value release binding. Its content, procedure and mapping are unchanged; only its rendered binding was renewed, for the deploy-workflow change.

## Build and publication

Run from this folder:

1. `npm ci`: installs the pinned dependencies from `package-lock.json`.
2. `npm test` (`node --test runtime/*.test.mjs`), then `npm run test:rules`: the second runs the cloud-saving and security-rules tests against the local Auth and Firestore emulators under a demo project. It never contacts the production project.
3. `node publication-gate.mjs`: requires `release-approval.json` to bind the current hashes of every package, the runtime, the procedure, `site-copy.json`, `content-verification.json` and `browser-verification.json`, with no open findings.
4. `node build-site.mjs --out <public-directory>`: validates and builds all eight reviews and the catalog. One bill: `node runtime/build.mjs bills/<slug> --out <directory>`.

In the website workflow these steps run after the unchanged legacy build and before the Pages upload. The build bundles the pinned Firebase client and embeds the public configuration. Production deployment has two parts: publish `backend/firestore.rules` to the existing project, then upload the Pages build. The rules are additive. They keep the earlier coding app's `assignments` and `responses` rules unchanged and add only `decisionReviews`. Validation blocks the build on structural, route, coverage, source-reference quotation and citation-pair errors. It does not check every quotation in reader-facing text; that fidelity is an independent audit obligation (see PROCEDURE.md).

## Saving

Anyone can read a review without signing in. To record answers, a reviewer signs in with Google. The account must have an active assignment in the existing project's `assignments` collection; assignments are provisioned by the project owner, never by the page. The session type starts as research if the assignment allows it, otherwise quality check. If both are allowed, the reviewer can switch, and the last choice is remembered in that browser for that account. The session list shows only the account's sessions for that bill, release and session type.

- **Where answers go.** Each change is kept first in this browser, under a namespace for that account, session type and release. It is then written to Firestore at `decisionReviews/<uid>/sessions/<session>`, with an immutable copy of every revision. A write succeeds only if the server's revision is the one the browser last saw. Answers count as saved only after the server confirms the write. Until then the page says the change is saved in this browser only, including when offline, and offers Retry.
- **Conflicts.** If the server copy has changed on another device or in another tab, editing stops. The reviewer either uses the server version, discarding this browser's unsent changes to that session, or keeps this browser's version as a new session. Neither choice changes the server copy.
- **What is not done.** The rules allow no client to delete a session or revision. Answers saved in a browser before sign-in was added are not uploaded automatically; only a JSON backup imported by hand becomes a new session. Records of the earlier coding app are neither migrated nor deleted. Accounts whose assignment has the coordinator role can read every reviewer's sessions.
- **Corrected releases.** Saved sessions from releases recorded in `session-history.json` are carried into the current release as new sessions; changed decisions and anything resting on them are marked for another look (see PROCEDURE.md#changes). `record-session-history.mjs` records an outgoing release.
- **Copies.** JSON backup and CSV export remain available. CSV cells hold only counted values and record session type, account and carried origin. Coordinators can export every reviewer's sessions for a bill.

## Limits

Which claims became questions, how equivalent arguments were consolidated and where limits sit are editorial judgments, recorded in each bill's `EDITORIAL_REVIEW.md` for independent verification. Passing validation and audit does not show that any inference is valid or any prediction true. Reading time, comprehension and workload are untested; measured path counts describe structure only.
