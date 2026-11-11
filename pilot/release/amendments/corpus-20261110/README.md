# Corpus amendment: Record labels and dead primary-text links

November 10, 2026

This amendment fixes two defects found by the independent audit (`../independent_audit_20261110/REPORT.md`, findings B1 and B10) in the published corpus, `pilot/release/content.json` in `niccdias/policy-briefs` at deployed commit `dddc6ff`, and in the guided-review files that copy its citations. No existing file was changed. Nothing was committed, and no new archive captures were made.

## Files

- `record-attributions.json`: every Congressional Record citation in the corpus (485), with its bill, record id, field, position, quoted words, current label, correct label, matched document and maker, status and basis.
- `link-replacements.json`: the two dead links, their replacements, the HTTP checks and the quotation checks.
- `apply-amendment.mjs`: exports `amendHtml(html, bill)`. `node apply-amendment.mjs --check <file.json>...` reports what would change and writes nothing.
- `build-amendment.mjs`: rebuilds the two JSON files: `node build-amendment.mjs --corpus <content.json> --cache <folder> [--no-links]`.

## B1: Record labels

On a shared Record page, every document gets the same link, and the hover label names whichever document came first. Each citation is now checked on its own.

1. The quoted words before each citation are matched against GovInfo's text of the cited page and against the bill's saved Record documents in `../evidence/*/manifest.tsv`. A label is attributed only when every piece of a quotation, split at ellipses and bracketed insertions, appears on the page and in one maker's documents. An inserted letter wins over the speech that contains it.
2. Quotations that are not on the Record page are left to the other links in a run of several citations, such as a "Sources:" list.
3. Paraphrases in evidence notes have no quotation. They are matched to the released evidence note behind them (`../quality_pass/**/evidence_notes.json`), whose sources name document ids. Each named document's locating quotation is checked against the saved text and the page. This route confirmed 83 labels and changed none.
4. Two paraphrases were attributed by hand. Each rule in `build-amendment.mjs` names its document and a passage that must be in it.
5. The correct label is the one the site builder makes for the document (`../harness/make_site_pages.py`), for example "Bonamici, floor speech, Congressional Record, January 14, 2025". All 40 corrected labels already exist elsewhere in the corpus.

| Bill | ok | corrected | unresolved |
|---|---:|---:|---:|
| H.R.28 | 137 | 30 | 0 |
| H.R.131 | 137 | 3 | 0 |
| H.R.1834 | 28 | 0 | 0 |
| H.R.4405 | 25 | 0 | 0 |
| H.R.5408 | 68 | 4 | 0 |
| S.2 | 28 | 3 | 0 |
| S.1582 | 5 | 0 | 0 |
| S.J.Res.88 | 17 | 0 | 0 |
| **Total** | **445** | **40** | **0** |

By basis, 381 are attributed by quotation (38 corrected), 83 by evidence note, 5 by hand (2 corrected) and 16 by page label. The 485 count every copy in the corpus JSON: arguments, their `original` fields, catalog and retirement mappings, evidence placement and procedure background. The audit counted 98 quotations on the brief pages. All 32 it found mislabelled are among the corrections, and its 5 "not found" quotations are verified here.

No quotation matched documents by more than one maker, and none matched no document.

## B10: dead primary-text links

The congress.gov copies have no Wayback capture (checked with the CDX API). The replacements are existing Wayback captures of GovInfo's permanent HTML of the same document versions. Both return HTTP 200. Each replacement's text matches GovInfo's live copy exactly and holds all of the saved text.

| Document | Replacement | Corpus links | Quotations cited to it | In replacement |
|---|---|---:|---:|---:|
| H.R.4405 bill text (Engrossed in House) | `https://web.archive.org/web/20261018204517/https://www.govinfo.gov/content/pkg/BILLS-119hr4405eh/html/BILLS-119hr4405eh.htm` | 205 | 40 | 40 |
| H. Rept. 119-187 (report and its print of existing law) | `https://web.archive.org/web/20260727153025/https://www.govinfo.gov/content/pkg/CRPT-119hrpt187/html/CRPT-119hrpt187.htm` | 64 | 18 | 18 |

A further 5 quotations per document sit in shared "Sources:" lists. They are absent from both the replacement and the saved text, so they belong to the other sources in those lists.

## Check-mode results

| File | Record citations | Label changes | Link changes | Not attributed |
|---|---:|---:|---:|---:|
| corpus `content.json` | 485 | 40 | 269 | 0 |
| hr28 `input/source.json` / `decisions.json` | 150 / 18 | 49 / 12 | 0 / 0 | 0 / 0 |
| hr131 | 95 / 16 | 6 / 3 | 51 / 8 | 0 / 0 |
| hr1834 | 29 / 6 | 0 / 0 | 0 / 0 | 0 / 0 |
| hr4405 | 27 / 4 | 0 / 0 | 183 / 35 | 0 / 0 |
| hr5408 | 73 / 11 | 8 / 2 | 0 / 0 | 0 / 0 |
| s2 | 32 / 9 | 6 / 3 | 0 / 0 | 0 / 0 |
| s1582 | 7 / 2 | 0 / 0 | 0 / 0 | 0 / 0 |
| sjres88 | 16 / 5 | 0 / 0 | 0 / 0 | 0 / 0 |
| H.R.5408 pilot `input/source.json` | 73 | 8 | 0 | 0 |

Applied to the corpus, the amendment reproduces every label in `record-attributions.json`. It changes no text outside link attributes, and a second pass changes nothing. A separate check matched each guided-file citation directly against the saved Record documents and agreed with the amended label in every case where its quotations name one document.

## Points for a decision

- **Shared numbers remain.** Labels are now right, but different documents on one Record page still share one citation number. For example, `HR28_C11` shows [1] for both the women's groups' letter and Walberg's speech. Separate numbers need a site-builder change.
- **Page-level label for H.R.5408.** Sixteen citations of `CREC-2026-06-15-pt1-PgE573-3` (an arguer-saved source, not in the manifests) keep the label "“Faster Labor Contracts Act; Congressional Record, June 15, 2026, pages E573–E576”…". The label names the page, not a speaker, so it does not misattribute. The page is Walberg's insertion of "letters from Alex McDonald and Roger King" (the corpus spells it "MacDonald").
- **Two rules made by hand.** In `HR28_C11` and the matching procedure background, "The groups’ letter names no specific ban…" now names the National Women's Law Center and Women's Sports Foundation letter instead of Walberg. In `HR5408_TR_oppose_03`, `_04` and `_06`, the clause "and it represents some private-sector workers this bill covers" keeps its AFT letter label.
- **Inherited source lists.** Fragments of split evidence notes carry the whole note's "Sources:" list. Labels on those fragments are right, but some fragments cite a speech that does not support them; for example, "H.R.131 provides no construction money" cites Bennet's speech.
- **Counts that differ from the audit.** The audit reported 16 mislabelled H.R.28 blocks and 1 in S.2. The current `decisions.json` files have 12 wrong labels in 11 H.R.28 blocks and 3 in 2 S.2 blocks. The direct check agrees with these counts.
