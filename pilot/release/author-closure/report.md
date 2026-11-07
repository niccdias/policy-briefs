# Finding closure: content corrections and dispositions

Author: Opus 5.5 High, with no delegation. `runtime_start.json` and `runtime.json` record the model, effort and subscription checks. Nothing here edits root, the site, answers or Qualtrics.

## Files

| File | Content |
| --- | --- |
| `procedure/` | Procedure documents and gate contract |
| `content_patch.json` | 318 exact changes against canonical `content.json` |
| `retired_ids.json` | One retirement: `S2_UNT_support_05` |
| `dependency_changes.json` | Edge and member changes |
| `ui_copy_additions.json` | Two new interface sentences |
| `finding_ledger.json` | 54 findings with class, disposition, rationale and limits |
| `finding_sources.json` | Source index with hashes |
| `banned_phrases.json` | Verdict wording for the gate scan |
| `author_approval.json` | Author approval of the exact prose, by hash |

Each patch replaces a whole field. It applies only if the current value equals `before`.

## Decisions

- **R1, retired.** The argument's reason is that people are worth protecting, and the source shows rescue practice. Neither shows listening, understanding or acceptance, and the procedure says general compassion alone is not enough. The rescue point stays under Universalism – Concern, at `S2_UNC_support_10`.
- **R2, qualified.** I confirmed no statutory error, but “faces a delay” said more than the page's evidence settled. The page now names the directive clause and says the text gives it no separate notice period. It invents no exception. Two later agency documents treat notice as applying. They are outside the July 17, 2026 cutoff, so they support verification only and are not cited on the page.
- **I1, corrected.** The Brennan Center's forecast now reads as being about the funding it describes, which includes S.2's money. I did not write "S.2's money alone", because the passage follows a discussion of combined funds, and Sol's package reading is slightly narrower. C08 now reports a forecast, and each argument keeps its own step and response.
- **I2, corrected.** C02 now states only past local reductions and displacement. `S2_UNN_support_02` loses its C02 edge because its route does not use that history. The other three keep it as background.
- **I5 and the same cause elsewhere, corrected.** Editorial verdicts are gone from gaps, notes and objections, and the factual limits stay. This reverses the earlier decision to leave the six H.R.131 notes as flags.
- **I3 and Q6, corrected.** H.R.131 now reads as easing repayment, and the insurance limit is restored.
- **I6, no patch.** The sentence is not in displayed evidence.
- **HR5408_C01, no patch.** “Route” is plain there.

## Comparable inspection

I read all 91 gap explanations and searched displayed text across all eight bills.

- **Verdict wording:** 36 more changes, in several bills, under `N-VERDICT`.
- **Internal terms:** PRO and CON appeared in displayed text with no definition for coders. 237 changes under `N-PROCON` replace them with argument and response. This is word-level wording, not new reasoning.
- **Later evidence:** 241 arguments cite a source dated after their comparison date, about 580 citations. I did not review each use. A site-wide sentence states the rule, and the ledger records this as a declared limit under `N-LATER`.

## For root

- **Judgment-relevant changes:** the corrections to C02, C08, C09, C12, the arguments that use them, `S1582_SES_oppose_06`, `HR131_UNN_oppose_02`, the `SJRes88_UNC_oppose_06` note and the removed verdicts all change text coders may rely on. Root assigns the reassessment set. I recommend treating `N-PROCON` as `clarity_only`.
- **Mapping ID:** the edge and member changes, and the `necessity_reason` and `equivalence_reason` text, are mapping changes. No claim or path ID changes.
- **Original view:** `pilot/src/app.jsx` line 140 shows original text, including wording now corrected. I added a notice sentence and left the originals alone. I did not check how often coders reach this view.
- **Label display:** V1 and V2 rest on source-code searches and one search of built public pages. Your rendered check has to confirm them, including in the coding app.
- **Gate contract:** check 5 now accepts a logged `prior_correction`, and check 8 allows the D1 statement pairs. `N-ORIGVIEW` closes through a UI string, so your gate should count `ui_patch_ids` as its correction. The earlier commit lacked these edits.

## Checks run

- Every `before` matched canonical content by SHA-256-pinned file, and the patch applied in full.
- No anchor changed, except the added bill citation in R2 and the copied note on `SJRes88_UNC_oppose_06`.
- No quotation was lost. The one new quotation, “Subject to subparagraph (C)”, is in the bill text.
- Titles still match the first argument sentence.
- C02, C08 and C09 statements match their background copies, and C02 and C08 scopes match too.
- No listed banned phrase remains in displayed fields.

I did not run the build, the app or `verify_procedure.py`. These checks show the patch is mechanically consistent. They do not show that each argument is sound or that coders understand it.

## Reading limits

I read targeted source passages for the priority items, not whole sources. For the two Federal Register notices I read only the passages on notice. Some items rely on Sol's excerpts or earlier reviews, and the ledger names them. Every ledger entry stays open until Sol verifies the exact candidate.
