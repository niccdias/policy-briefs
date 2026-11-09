# Guided decision reviews (November 9, 2026)

This folder holds the guided decision reviews for eight bills and the runtime that validates and builds them. Each review reorganizes one bill's frozen, previously reviewed corpus into a root-first decision tree: context that is not asked, causal claims, and value claims, with AND/OR routes that set aside later decisions after a No. Reviewers' procedure is in [PROCEDURE.md](PROCEDURE.md).

This is a frozen-corpus migration. No evidence was gathered or checked anew. It is not the fresh-inventory pipeline in `../harness/prompts/bill_wide/`, whose validator and build adapter are not implemented. Because this migration reads and publishes all eight corpora, none of these bills can serve as an unseen bill for that pipeline's held-out benchmark.

## Layout

- `input-manifest.json`: the eight bills, their frozen source hashes and counts, and the upstream website commit they were staged from.
- `bills/<slug>/`: one package per bill. `input/source.json` is frozen and never edited. The authored files are `decisions.json`, `coverage.json`, `copy.json` and `EDITORIAL_REVIEW.md` (H.R.5408 has `conversion.json` instead of an editorial review, because it was converted losslessly from its approved pilot). `private/` is ignored by Git and holds working files only.
- `runtime/`: the shared model, validators, rendering, local storage, path measurement, build and tests. `runtime/copy.json` holds the common interface text; `site-copy.json` holds public-copy overrides.
- `stage-inputs.mjs`: stages each bill's `input/source.json` from an approved website checkout. It imports the canonical project's `../bill_reasoning_pilot_20261108/hr5408/logic.mjs`, so it runs only in the canonical project; a website copy is kept for provenance.
- `convert-hr5408.mjs`: converts the approved H.R.5408 pilot package into this format. It reads the frozen pilot files in `../bill_reasoning_pilot_20261108/hr5408/`, so it runs only in the canonical project; a website copy is kept for provenance.
- `audit-content.mjs`: read-only content audit of announced packages. It runs native validation, an independent AND/OR route oracle, every single causal No, combined Nos across alternative routes and a screen of reader-facing quotation marks, and writes `content-audit-findings.json`. Its H.R.5408 conversion comparison reads the frozen pilot files in the canonical project, so rerunning that comparison belongs there; the website copy keeps the code and its report for provenance.
- `browser-qa.mjs`: browser checks on a built public directory; writes `browser-verification.json`.
- `build-site.mjs`, `publication-gate.mjs`: site build and publication gate (below).
- `legacy-build-candidate.json`: the legacy per-value release binding. Its content, procedure and mapping are unchanged; only its rendered binding was renewed, for the deploy-workflow change.

## Build and publication

Run from this folder:

1. `node --test runtime/*.test.mjs`
2. `node publication-gate.mjs`: requires `release-approval.json` to bind the current hashes of every package, the runtime, the procedure, `site-copy.json`, `content-verification.json` and `browser-verification.json`, with no open findings.
3. `node build-site.mjs --out <public-directory>`: validates and builds all eight reviews and the catalog. One bill: `node runtime/build.mjs bills/<slug> --out <directory>`.

In the website workflow these steps run after the unchanged legacy build and before the Pages upload. Validation blocks the build on structural, route, coverage, source-reference quotation and citation-pair errors. It does not check every quotation in reader-facing text; that fidelity is an independent audit obligation (see PROCEDURE.md).

## Saving

Answers are saved only in the reviewer's browser, in a namespace specific to each bill's release, with JSON backup export and import. Nothing is sent to a server. There is no cloud saving or sign-in.

## Limits

Which claims became questions, how equivalent arguments were consolidated and where limits sit are editorial judgments, recorded in each bill's `EDITORIAL_REVIEW.md` for independent verification. Passing validation and audit does not show that any inference is valid or any prediction true. Reading time, comprehension and workload are untested; measured path counts describe structure only.
