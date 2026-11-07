# Bounded integration follow-up: report

**Task marker:** POLICY_CLARITY_20261107_EXEC, follow-ups from root. No new review was run. The first delivery is preserved at commit `c94a08a`, and its files in `output/` are unchanged. The previous follow-up is preserved at commit `d308b08`. The “What changed” section below describes that follow-up, and its counts are as of that commit; the last section covers the judged-claim scope item.

## What changed from the first delivery

21 leaves changed, in these three groups:

- **5 `claims.scope_html` leaves:** `HR4405_C05`, `HR4405_C10`, `HR5408_C08`, `HR5408_C13` and `SJRES88_C11`. The first four now match their background mirrors. `SJRES88_C11` has no mirror, and the phrase “frozen comparison” is gone.
- **9 `notes_html` leaves with the Points 1-5 or 2-6 note:** the note now names S.J.Res.88, the direction (against), the group and the five topics, with no Point numbers. It ends “This reason is one of them.” The word “five” stays because five such reasons are active.
- **7 `notes_html` leaves with “All eight reasons”:** the note now reads “The reasons against S.J.Res.88 about accepting people who are different share one tariff-pressure step (U.S. tariffs used to press other governments). This reason is one of them.” It has no number. The group wording follows the value statements for `SJRES88_UNT`.

Evidence nodes did not change in this follow-up, because these notes are not in any evidence fragment. Source anchors, source references and paths are unchanged.

## Files

`final/changes.json` is cumulative against `input/content.json`, so it logs all 857 changed leaves. `final/checks.json` holds the check results and lists the follow-up delta.

## Checks run

These are mechanical checks in `work/apply.py` and `work/finalize.py`:

| Check | Result |
|---|---|
| Changed leaves equal logged leaves, and before/after match | pass |
| IDs, order, values, non-description bill metadata, source references and paths unchanged | pass |
| Anchor sequence identical in every leaf (2,603 anchors, now counting the five scope leaves) | pass |
| Quotation spans lost | 0 |
| Claim and background statement and scope mirrors equal | pass |
| Rendered copy, with display replacements applied: internal words, Point-number references, “eight reasons” | 0 hits |
| `input/` and first-delivery files unchanged against their commits | pass |

## Limits

- These checks do not establish ESL comprehension, and no reader tested the text.
- I named the groups and topics from page titles and value statements. I did not re-read outside sources for these notes.
- The rendered-copy scan models the fields root described. It did not run the app itself.
- Items still flagged are in `final/issues.json`.

## Judged-claim scope item

Root is making `claims.scope_html` on judged claims visible under the label “What this claim covers and its limits”. I reviewed all five judged claims in this subset. These are the claims with no background record, and all five are classified as judgment.

| Claim | Outcome in this item |
|---|---|
| `SJRES88_C11` | changed; “this repeal” now names the action, and “direction, not amount” is now plain |
| `SJRES88_C12` | changed; “replacement U.S. tariffs”, and “one-sided repeal” is now explained |
| `HR5408_C07` | changed; the 10 to 15 percent estimate is named, and “the bill’s three-person panel” is stated |
| `HR5408_C09` | reviewed, unchanged |
| `HR4405_C03` | changed; “secrecy for victims”, and “grand jury” is defined |

No qualification, population, time or strength was removed. `final/judged_scope_review.json` holds the input text, final text and outcome for each claim. The label is root’s and is not stored in these fields. All other leaves are unchanged from commit `d308b08`, and `final/checks.json` lists this item’s delta.

The cumulative log now covers 860 changed leaves. Scope edits now cover eight claims: the four non-judged mirrors and the four judged claims changed above. `SJRES88_C11` was already edited in the previous follow-up and changed again here. The anchor count in `checks.json` is unchanged because these scopes contain no anchors.

These scope edits were written from the claim page and its own support and objection text. I did not re-read outside sources for them, and no reader tested them.
