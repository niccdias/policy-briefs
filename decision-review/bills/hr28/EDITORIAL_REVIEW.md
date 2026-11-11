# H.R.28 guided-decision package: editorial review

Author: Opus editorial author. Built only from the frozen `input/source.json`; no outside source was read and no fact was checked anew. `author.py` (with `author_lib.py`) is the maintained generator: it copies every citation link byte-for-byte from the frozen source, locates every quotation in a frozen field, and writes `decisions.json`, `coverage.json` and `copy.json`.

## Shape

- 5 contexts, not asked: the competition rule and definition (C01), the practice exception (C02), team-conditioned activities (C03), the law on January 14, 2025 (C04), and the B.P.J. ruling in force on that date (C14). Court holdings are dated context; the June 30, 2026 reversal is shown as later context, not as a change to the comparison.
- 22 causal claims, 36 value links, 85 blocks. All 33 arguments, 14 responses (all retained) and 49 qualifications are placed in `coverage.json`.

## Which claims are questions

The corpus labelled most shared claims “uncontested context”. Each that predicts what the bill would do in covered schools is asked: kept places and scholarships (C17), lower collision risk in contact sports (C05), stigma (C10), girls with intersex variations (C11), students leaving sport (C13), appearance-based accusations (C09) and intrusive inquiries (C16 as evidence). Invasive bodily checks (C07) remains the disputed root. The C12 health association stays a qualification, because it is an association, not a prediction.

| Causal claim | Requires | Note |
|---|---|---|
| Limited places and scholarships kept for girls | — | Scanlan/Starling limits; NCAA count |
| Sport-linked environmental activity kept | places | UNN_support_01–03: three mechanisms, any one enough |
| Team environmental activity lost by excluded students | — | UNN_oppose_01–02: competition or leadership post |
| Retained strength advantage | — | Trained-athlete challenge and 2026 review beside it |
| Lower collision risk in contact sports | — | Independent of the strength claim: different evidence and conclusion |
| Girls with intersex variations pushed out or deterred | — | Attributed warning; no worked example |
| Exclusion isolates and stigmatizes | — | Advocacy statement |
| Stigma harms mental health beyond athletes | stigma | |
| Excluded students leave sport | — | |
| Fear deters eligible girls | — | Independent of the bodily-check claim (C07 scope excludes fear) |
| Health lost by students who stop playing | leaving sport, OR fear | |
| Girls keep exercise and its health benefits | places | Starling challenge; no-other-team case open; UNC_support_02 mental-health finding shown here |
| Kept places give practice in acceptance | places | Study-measurement challenge |
| Less unwanted shared undressing | — | Coverage reading OR exclusion; challenge answers only the first |
| Intrusive inquiries without bodily exams | — | Florida case |
| Pressure for invasive bodily checks | — | C07, with four responses judged once |
| More appearance-based accusations | — | |
| Accusations intimidate wider communities | accusations | Change of scale; hate-crime analogy limit |
| Less protection against youth drug use and violence | leaving sport, OR intersex, OR stigma | Change of scale |
| Federal money for other students put at risk | — | Enforcement limits |
| Larger, stronger and faster opponents for girls moved to boys’ teams | — | Factual only; “unfair” is judged at the value link |
| Added physical danger in some sports | opponents | B.P.J. sport-scope limit |

Provision-based value links (no causal question, because they rest on the rule itself or on dated law): TR_support_01, TR_support_02, TR_oppose_02, UNT_support_01, UNC_oppose_02 (B.P.J.), the team-loss part of UNC_oppose_01, the law-in-force and team-activity parts of UNT_oppose_01, and the forfeit part of UNC_support_03.

## Consolidation and splitting

- Consolidated: UNN_support_01–03 (one claim, one Nature link; three evidence blocks); UNN_oppose_01–02 (same). Health loss from leaving sport (SEP_oppose_03) and from fear (SEP_oppose_01’s second route) share one claim with two routes and one link.
- Split because one part needed a claim the other did not: UNC_support_03 (collision vs. forfeits), UNC_oppose_01 (team loss vs. intersex), UNC_oppose_06 (harassment vs. deterrence), UNT_oppose_01 (law-in-force/team activities vs. stigma), SEP_oppose_01 (bodily checks vs. fear-to-health).
- Split after audit: UNC_support_02 (education and leadership need only kept places; the mental-health benefit needs the separately judged health claim, so it has its own Concern link and the fairness challenge sits at both links); UNC_oppose_04 (the unfair-contest link needs only the factual opponents claim; the danger link needs the some-sports danger claim). Neither pair is merged as OR routes: in each, the second claim requires the first, so a merged link could not assert the second benefit or harm, and the two links judge different things (opportunity versus health; a fair contest versus physical safety).
- HR28-AUDIT-03: the local-authority evidence now states that Illinois’s individual reviews already considered fairness in competition and risk of injury (CRS [6], from TR_oppose_02’s support reading), so the safety and fairness criteria the argument relies on stay beside the local-authority judgment and its challenge.
- Kept as OR routes inside one link: UNC_oppose_05 and TR_oppose_03 (inquiries or bodily checks).

## Sensitive choices

- UNC_support_02’s response says the reason depends on the fairness claim. The route stays the source route (places only); the response is shown beside the value link as an unresolved dispute, and is not attached to the places claim because it does not dispute that places are kept.
- The strength and collision claims are independent: a No on retained strength in speed and power events does not decide collision risk, which rests on World Rugby’s size and force evidence.
- “Some” claims keep the corpus’s modality (risk, some students, some girls). Frequency is left to the final size comparison; the NCAA count (about 10 of roughly 510,000 athletes) is shown at the places and environmental claims.

## Checks run

- Runtime builder (`runtime/build.mjs` `buildBill`) built the package without error, including its HTML, citation, quotation, coverage, parity and path checks. Path counts: all Yes 58 decisions (63 judgments); all causal No 22 decisions with 36 set aside; places No sets aside 8; opponents No sets aside 3.
- Generator self-checks: unique prefixed IDs, no cycles, every block used, routes require only causal nodes, argument reciprocity, every retained response and qualification bound to a decision that shows its block.
- Every quotation is an exact substring of the cited frozen field; every citation link and title is copied from the frozen field named in the generator.

## Definitions

On November 9, 2026, definitions were moved out of the reading text and into the glossary, which shows them on hover, focus or tap. Thirteen edits in 12 blocks removed definitions of forfeit, chilled, modesty, collectivistic, intersex variations, podium spots, immutable, stigma and gynecological exams, and the identifying appositives for World Rugby, the CDC, FERPA and Snopes. Thirteen glossary entries were added. The collectivism challenge keeps its point: being more collectivistic is different from accepting people with different beliefs. Kept in the text: the Title IX definition in the description and the reading of “conditional upon participation”, which decide coverage; the caution that an association does not prove cause; and the introductions of the Family Research Council and the Ethics & Religious Liberty Commission, whose roles bear on the inference.

## Amendment of November 10, 2026

The independent audit of November 10, 2026 found that the contact-sport claim (`HR28_K_CONTACT`) kept the limits on World Rugby's conclusion, that it was for “the international level of the game” and left national unions flexibility, while the conclusion itself was not shown. The evidence block (`HR28_B_CONTACT_EV`) now adds World Rugby's conclusion from the frozen argument `HR28_SEP_support_01`: “safety and fairness cannot presently be assured for women competing against transwomen in contact rugby.” It is cited to the frozen World Rugby announcement of October 9, 2020, and has its own source reference. In the limits block (`HR28_B_CONTACT_LIM`), “Its conclusion was for” now reads “Its conclusion on safety and fairness was for”, so the limit names the conclusion it qualifies. The limits block is shown again at both value links that need the contact claim.

A script then counted the quotations in the frozen arguments, responses, notes and shared claims that are shown nowhere in the package, either in full or as a shorter quotation. Before the amendment, 13 of 81 support-side quotations were missing, with 6 more shown only in shorter form; on the oppose side, 13 of 131 were missing and 15 shortened; for the shared claims, 3 of 54 were missing. After the amendment, 12 of 81 support-side quotations are missing, and the other counts are unchanged. Each remaining missing quotation was read against the decisions that carry its argument. None is the subject of a shown limit or challenge. They are passages of the bill or dated facts that the package states in other words (the practice exception, the covered recipients, the vacated 2024 rules, the review's comparable fitness); further details of cases whose point is shown (the environmental projects, the Vermont school's objection, the Florida and Utah investigations, Riley Gaines's account); two further World Rugby passages on size and force, a point the shown World Rugby quotations make; or response quotations whose point the shown challenge makes. No other evidence was restored.

No route, block ID or coverage row changed. Congressional Record citation titles were left as they are, for the separate corpus-wide correction.

## Limits

Which claims became questions, and where limits sit, are editorial judgments for main and the independent verifier. Structural and quotation checks do not establish that any inference is valid or any prediction true. Human comprehension, reading time and workload are untested.
