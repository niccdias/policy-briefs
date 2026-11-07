# Bounded integration follow-up: POLICY_CLARITY_20261107_EXEC

`final/edited.json` and `final/changes.json` are cumulative against `input/content.json`. Details and exact strings are in `issues.json`; validator results are in `checks.json`.

Automated checks cover fidelity only. They do not establish that ESL coders understand the text.

## Done

- **Q1-Q5:** resolved from the source passages, with glosses added outside unchanged quotations.
- **Q6:** resolved with no new wording. See "Decisions for root".
- **Judged claims:** derived as C03, C11, C19, HR1834_C15 and HR28_C07. The last two have scope text and were edited for clarity.
- **Mirrors:** the 10 stale HR1834 `claims.scope_html` mirrors are synced. All 35 claim scopes with a background record now equal it.
- **V1 and V2:** internal wording is gone from visible prose, apart from `span.note-id` labels.
- **Omission strings:** the two strings for `displayBackground()` are byte-identical in input and final, so root needs no update. They are in C11 and C19 `background_html`.
- **Sources:** `added-sources` holds 35 unique files, and all 138 bindings match by hash.

## Fidelity corrections

- **F2 (medium):** the first pass made Brookings' conditional unconditional. All 9 mirrors now say "if holders are not paid interest", as in `july_fb1fbdfdfb66.txt`.
- **F3 (low):** the AML/CFT glosses omitted the financing of terrorism. All 29 leaves (30 occurrences) now name both parts, and quotations are unchanged.

Both came from root's independent review, not from this agent's checks.

## Root's decisions, recorded

- Absent scopes on C03, C11 and C19 are hidden, with no new keys.
- The S1582_TR_oppose_04 sentence is accepted as a clarification of the exact TR value.
- C11 is reopened for its changed visible limit.
- The omission strings are unchanged.

## Still for root

1. **C19** is a judged claim, and F3 changed its visible note text. The change completes a definition only, but root's presentation classification should include it.
2. **Q6:** the source says savings are uninsured "up to the insurance limit". The input's "lose federal insurance" omits this. Tightening it would be a meaning change, so it was left.
3. **Markup:** `data-flag="main-agent-review"` and `class="pilot-explanation"` remain on the C08 and C11 divs, and 41 `span.note-id` labels remain.
4. **Direction wording:** C06, C10, C17 and C22 now say "supporting" or "opposing" in words where the removed IDs held that direction in code form.
5. **H1:** four HR28 gap explanations dropped process clauses in the first pass, such as "not a repair". Each stated evidence limit stays.

## Validator exceptions reviewed

- `numbers_lost` (18): the 3 bill descriptions, which earlier dropped numbers that remain in metadata, and 15 removed internal ID digits.
- `hedge_decreases` (22): re-read after F2, because this agent had wrongly called the Brookings "without" entries benign. Those entries are now corrected and still count because "without" became "if ... not". The rest are in H1, C12 and the HR1834_C08 mirror pair.
- `fragment_divergence` (7): as reviewed earlier.
- `claim_vs_bg_statement` (11): pre-existing, issue D1.

## Limits

- Scripts and caches were in `/tmp/pc_scripts`, outside `output/`, and are not delivered.
- The change log records the original V1 and V2 wording as the audit trail.
- `output/` from commit 57df409 is untouched.
