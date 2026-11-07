# Bounded clarity pass: S.2 and H.R.131

Author: Opus 5.5 High on the first-party Max subscription, with no delegation. `runtime_start.json` and `runtime.json` both verify the model, effort and subscription auth.

## Delivered

| File | Content |
| --- | --- |
| `edited.json` | Same schema, records and order as `input/content.json`; only permitted prose leaves differ |
| `changes.json` | 657 leaf replacements: 653 `clarity_only`, 4 `factual_context_correction` |
| `coverage.json` | 397 records: 2 descriptions, 131 arguments, 49 claims, 35 background items, 180 evidence nodes |
| `issues.json` | 12 items, including 3 proposed substantive changes that stay unresolved audit flags |
| `procedure/`, `ui-copy.json` | Priority A documents, delivered earlier |
| `tools/` | The scripts that produced and checked these files |

The changes touch 223 of the 397 records. By bill and collection:

| | Arguments | Evidence nodes | Claims | Background | Description |
| --- | ---:| ---:| ---:| ---:| ---:|
| S.2 | 208 | 131 | 30 | 0 | 1 |
| H.R.131 | 83 | 195 | 6 | 2 | 1 |

## What changed

- **Headings and first lines:** "It" became the bill's name where a randomized page gave it no antecedent.
- **Notes and gap wording:** fragments can appear apart from the sentence that named their subject, so each now names its actor. Abbreviations are spelled out (EIS, ROD, EA, CRS, GAO, DWSRF and others). Compressed phrases such as "Size unresolved" and "limits reach" became sentences.
- **Your S.2 request (C06, C36, C37):**
  - The pages now say which tactics reportedly changed: more targeted arrests and fewer large, visible sweeps.
  - They say who could still be arrested. From CBS, Homan said agents would keep arresting people found during operations if they are in the country illegally, including people with no criminal history who were not the original targets. "Not off the table" is glossed outside the quotation.
  - "They" in the Krikorian quotation is the Trump administration (AP).
  - "The package" is S.2. HRW's sentence is about congressional approval, and its "reforms" are identified from the same article.
  - "Chicago volunteers" is corrected to one named leader as reported by WBEZ (issue I4, classified `factual_context_correction`).
- **Other source-checked referents:**
  - S.2: "the money dispute" and "the strategy" (Brennan), "the package" (American Action Forum), "the lock" (a water meter, GPB), and "it" and "the last one" (floor speech).
  - H.R.131: "we" and "stop" (Colorado Sun), "in perpetuity" and "we" (Colorado Sun, 2025), and "it" and "they" (Bennet).
- **Bill descriptions:** they lead with the concrete change, are plain text in short sentences, and keep the agency roles. **Both descriptions no longer state the version or comparison date, so the visible comparison label must render beside them.** Metadata is unchanged.

## Checks run

Each of these passed on the final build:

- All input file hashes are unchanged (305 files).
- A deep comparison found 657 differing leaves, exactly the set logged, all in permitted fields, including the two authorized mirror syncs and the 11 approved scope edits. Keys and order are unchanged.
- In every changed leaf, each anchor (`href`, `title`, text) is unchanged and in order, and non-anchor tags are unchanged. Every quotation from before the edit is still present and exact.
- Argument titles match their first PRO sentence.
- Evidence fragments match `notes_html`, and gap nodes match `gaps[].explanation`.
- Background and claim statements match.
- Values, reference profiles and bill metadata are unchanged, and descriptions contain no HTML.

## What I did not do or could not establish

- **Comprehension:** these checks do not establish that ESL coders understand the text.
- **App rendering:** nothing was rendered in the app, and I ran no app or acceptance tests.
- **Quotations against sources:** I checked that quotations were preserved. I did not re-match every quotation against its source; root verifies that separately.
- **Source reading:**
  - I read all visible prose once.
  - I read targeted source passages only where a referent or meaning was in doubt. These cover 18 logged source files and 122 changes.
  - The other 535 changes are wording changes checked against the existing text, with an empty `source_context`.
  - `reviewed_in_full` in `coverage.json` means the visible prose was read, not the sources.
- **Glosses not taken from the packet:** these rest on general meaning. Please review them:
  - H.R.131: acre-foot, cubic feet per second, "trust land (land held for tribes)", "irrigators, people who water crops", "borings", "isolates", "principal forgiveness", "contracts for spare capacity" for excess capacity contracts, and "towns and industry".
  - S.2: "GOP", "minority party" staff, "American Action Forum, a policy group", "wound down (gradually ended)", and the label "2025 budget law" for P.L. 119-21 (CRS calls it the FY2025 reconciliation law).
- **Remaining plain-language limits:** this was one bounded pass, so some long or abstract sentences remain, especially in responses. Cosmetic edits were avoided.
- **Boundary note:** my first scripts and hash list were written to `/tmp/policy-clarity-a-tools` before I moved them to `output/tools` and removed that folder. Nothing else was written outside `output/`.

## Notes for integration

- **Your quotation checker:** nine short quoted word mentions are new and are not source quotations: “Alternatives”, “Cover”, “Fry-Ark”, “In perpetuity”, “it”, “stop”, “the package”, “they”, “we”. They gloss a word in a nearby quotation, and the checker should allow them.
- **Display strings outside the permitted fields, left unedited:**
  - `claims[].scope_html` duplicates `background[].scope_html`. Root authorized syncing the two stale mirrors, HR131_C03 and HR131_C09, and all mirrors now match.
  - `gaps[].step`, `claims[].objections[].description`, `paths[].original_excerpt`, `members[].original_excerpt`, `display_replacements`, `note_routes` and `original` are unchanged lineage or audit fields.
  - `display_replacements` still records the old "These sources does not" grammar source. The visible node text is corrected.
- **Overrides:** a nested re-scan found no `pro_html`, `con_html`, `support_html` or `objection_html` under `evidence_nodes` in this input.
- **`current_contract.md`:** its links to `quality_README.md` need your filename adjustment at integration.

## Follow-up for bounded integration

- `procedure/evidence_date_findings.md` is the Markdown to append to the evidence README, after `procedure/evidence_dates.md`. Its facts come only from `date_provenance.json`. `retrieval.json` adds only the retrieval URLs and statuses, and the appendix does not rely on it. The XML and HTML files were not opened, so the machine-checked matches are reported, not re-run.
- `ui-copy.json` adds `publicViewLabels` with the approved `public-view.mjs` labels.
- Issue I5's wording stays as delivered. I took "unchanged" to mean no further edit, not a return to the pre-pass text.
- `scope_html_proposal.json` records the 11 scope edits for judged claims. Root approved them, and they are applied and logged in `changes.json` (issue I11). The other 10 judged scopes are outside this workspace and were not read here. `ui-copy.json` adds `claimScopeLabel`.
- S2_SES_oppose_01 `pro_html` is classified `factual_context_correction` (issue I9).
- Fidelity finding F1 on HR131_SES_support_05 is closed with no defect after context inspection (issue I12). The delivered text keeps "the security of the country".
