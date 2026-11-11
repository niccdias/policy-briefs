# H.R.4405 guided review: editorial review

Built only from the frozen `input/source.json` (sha256 `0714a8f78512cca2b34a00adafc7b739c0550b8e9c792fe32c162700482d202b`). No outside source was read and no fact was checked anew. This is a migration of the reviewed corpus, not a fresh inventory.

## Shape

- 5 contexts (not asked): the release duty (bill description); reputation cannot justify withholding (C01); the listed exceptions (C02); deals and charging messages are covered (C15); the Comet Ping Pong attack (C10).
- 33 causal claims and 30 value claims covering all 44 original arguments, all 12 responses (all retained) and all 62 qualification obligations.
- 113 blocks, all used. Where several arguments, notes or responses made the same point, they are consolidated into one self-contained block (36 such blocks) that keeps every distinct fact, quotation and citation once, with exact frozen anchors; other blocks copy single source paragraphs with only the old labels removed. Claim and value-claim text is new. Two response sentences addressed to “[NAME]” were rewritten to name the average American of the Personal Security profile, preserving that profile's scope.

## Which claims are questions

Publication itself is the bill's requirement and is context. Each use or risk of the released records is a causal claim. Most are roots, so there is no single dominant root; the claims about records for checking claims about people (FACTCHECK) and about unfair suspicion from mentions (SUSPICION) each set aside 5 decisions on a No.

| Causal claim | Requires | Note |
|---|---|---|
| Evidence for investigators outside the federal government | — | Shared by Concern and Personal Security |
| Stopping offenders who could still harm people | Outside | Narrower step; the response (Epstein was dead) sits here |
| Checks on charging decisions; jail records; police lessons; bank checks | — | Separate roots, each with its source scope |
| Records for checking claims about people | — | Shared by Concern, Tolerance, and both security values |
| Corrections weakening a false reason for attacks | Factcheck | Belief-change step; the conversation-study response sits here |
| A checkable basis for public trust | — | Mixed experimental evidence shown |
| Secrecy of some non-victim confidential sources at legal risk (C03) | — | One consolidated legal challenge (C03, UNC_oppose_03, SEP_oppose_01 and SES_oppose_01 responses and the Phang notes) |
| Fewer tips from future sources (C04) | Sources | Behavioral step |
| Fewer tips about environmental crime | Chill | Narrower sector; the source's gap shown |
| Less open grand-jury testimony | — | Independent of C03; the Maxwell grand-jury passage of the SES_oppose_01 response sits here |
| Risk of exposing survivors through missed details (C08) | — | The SES_oppose_01 response point that victim redaction has no active-case limit sits here |
| Victims less willing to report crime | Expose | Behavioral step |
| Secret methods; non-public priorities; undercover cover; future or state cases | — | Separate roots |
| Unfair suspicion from mentions and unconfirmed claims (C09) | — | |
| Threats and violence fed by published accusations | Suspicion | Change from reputational harm to physical danger |
| Lawyers taken from other enforcement work (C07) | — | |
| Less time for pollution and wildlife cases | Staff | Narrower sector |
| Donor controversies; material for blaming Jews; explicit material | — | |

## Splits and consolidations

- UNC_oppose_03 is split: the injustice to existing helpers needs only the legal-risk claim; the harm to future victims also needs the claim about fewer tips and is consolidated with UNC_oppose_04 (methods).

| Value claim | Arguments | Routes kept |
|---|---|---|
| Nature: weaker environmental enforcement | UNN_oppose_01, 02 | staff time; tips |
| Concern: harder detection of abuse | UNC_oppose_03 (part), 04 | tips; methods |
| Personal Security: stronger protection against sexual abuse | SEP_support_01–04 | stopping offenders; banks; charging review; police lessons |
| Personal Security: weaker crime prevention | SEP_oppose_01–03, 05 | tips; victim reporting; undercover; methods; staff |
| Societal Security: stronger defenses against trafficking | SES_support_01–04 | police; banks; charging; jail |
| Societal Security: weaker law enforcement | SES_oppose_01–04, 06 | tips; grand jury; undercover; methods; priorities; future cases; staff |

Each mechanism remains a separate causal claim, so a No on one leaves the others open.

## Deduplication

Repeated material was consolidated after review found near-identical paragraphs across arguments. Each cluster now has one evidence block and, where needed, one challenge and one limits block at the question it affects: confidential sources, future tips, grand juries, survivor exposure, methods, undercover officers, bank checks, charging decisions, jail records, police lessons, fact checks, corrections, suspicion, violence, staff diversion, outside investigators and public trust. Placement corrections:

- The legal objections to C03 (Privacy Act, co-existence of two laws, DOJ's instruction on names, law-enforcement privilege) form one challenge; what stays open (names versus information, citizens and permanent residents only, no source applying the privilege under the Act, the Phang v. Blanche concession without decision, and the excluded September 2026 opinion) is stated once.
- The TerraMar response and both gaps sit at the Nature value claim: the response does not deny that people can check spending; it disputes the step to conservation results.
- The JTA-intensity and Kimmel-caveat note (UNT_support_03) is shown at the fact-checking claim and at the antisemitism claim.
- The Phang note no longer appears at the victim-reporting claim.
- Value claims that repeated a block already shown on their causal claim now carry a different paragraph from the same argument.
- Value claims with several routes are worded as alternatives (“each consequence you accepted”), never as all of them together. Where the causal claims establish tools (records to study, check or press for change), the value claims judge those tools and do not presuppose that improvements were carried out (Concern protection, Personal Security abuse, Societal Security trafficking).
- A route-specific paragraph no longer sits at a value claim with several routes: the staff-time paragraph moved to the staff-time claim, and the Nature enforcement claim carries a premise both routes share.
- Coverage rows credit every location of consolidated material (for example, the UNC_support_03 note at the charging and jail claims, and the SES_oppose_07 note at the suspicion and violence claims).

Effect on the all-Yes path: 24,442 presented words before, 19,887 after; the largest decision fell from 2,197 to 958 words; distinct duplicate sentence pairs fell from 132 to 15, the rest being short shared quotations of the bill's text used at different questions.

## Sensitive choices

- Many support claims are capability claims (“would give … material to check …”). Their wording keeps “help” and “check” rather than asserting results; size limits and earlier public availability are shown from the notes.
- The professor's threats (SEP_oppose_04) are kept inside the violence claim; the response that they do not show danger to bystanders is placed at the Personal Security value claim, where reach to an ordinary person is judged.
- The Tolerance reputation claim keeps its response, which disputes the connection to accepting people across differences.
- The explicit-material claim relies on the bill's exceptions (child sexual abuse material only) and the department's own description; DOJ's redaction and age-gate notes are shown.

## Coverage and quotation checks

- Every argument maps to at least one value claim; argument IDs on nodes and in `coverage.json` agree.
- Every responses/qualifications ledger ID appears exactly once with ledger argument IDs and source references copied exactly. Each is either shown verbatim or declared as consolidated; `coverage.json` rationales say which (47 consolidated, 27 verbatim).
- Quotation survival check: every quoted passage of 20 or more characters in the frozen arguments, notes and responses appears in the placed text, except 11: eight survive as shorter partial quotations of the same passage, the bill's redaction-reason rule (two arguments) is stated in the bill context rather than quoted again, and the DOJ statement about the Comet Ping Pong gunman is quoted in the attack context with “the attacker” for his name.
- 225 source references, each an exact plain-text substring of its named field; 280 citation links copy frozen href/title pairs. The runtime validator accepts the package; `node --test runtime/*.test.mjs` passes 34 of 34.
- Paths (others Yes): all Yes answers 63 decisions; answering every causal claim No leaves 26 decisions answered and 37 set aside.

## Definitions

On November 9, 2026, definitions were moved out of the reading text and into the glossary, which shows them on hover, focus or tap. 35 edits in 28 fields (2 contexts and 26 blocks) removed definitions of unclassified records, redaction, grand juries, confidential sources, jetties, Cerberus, guarantors, Know Your Client, remediation, fodder, “predicate”, reprisal, chilling effect, count slips and round sheets, the Herald and the Charity Commission, appositives for FinCEN, the OECD, the BOP, Mechanical Turk and Baal, and parenthetical glosses such as preliminary relief, discovery records, red-flag indicators and “Jane Doe” statements. The paragraph defining “redact” was removed; the same bill-text link remains with the quoted provision in that context. 32 glossary entries were added. The deliberative-process, work-product and attorney-client privileges are marked with a specific key, so the earlier “work release privileges” is not given a legal-privilege definition. Baal is marked only where the text itself names the god, so the quoted typo “baal” stays unmarked. The displayed short description drops the definitions of unclassified and redaction and the gloss on politically exposed persons; the frozen description is retained in `input/source.json`. Kept: the identities of Epstein and Maxwell, the Attorney General's role, and the meaning of segregable portions and of the case-ending agreements, which set the bill's scope.

## Amendment of November 10, 2026

The independent audit of November 10, 2026 found that the evidence for the suspicion claim attributed another case's holding to the Epstein-files ruling. In the evidence for `HR4405_K_SUSPICION` (`HR4405_B_SUSPICION_EVIDENCE`), one sentence joined two quotations as if one court had accepted both in the Epstein files. The first, on “third parties mentioned as part of the FBI’s investigative efforts or who provided information”, is from Clemente v. FBI (D.D.C. 2022), about Epstein records. The second, that release could subject them “to possible harassment or criticism and focus derogatory inferences and suspicion” on them, is from Brown v. FBI (D.C. Cir. 2025), as its citation already showed. The sentence now ends after the Clemente quotation. A new sentence, following the frozen argument `HR4405_UNC_oppose_02`, attributes the second quotation to its own case: in a separate 2025 appeal, a court accepted the FBI's explanation that release could subject third parties who were merely mentioned to that harm. Both quotations, their citations and the block's source references are unchanged.

The rest of that block was checked against the frozen corpus: the public-records quotations are attributed to CRS and to DOJ's Exemption 7(C) guide, and the Khardori, House-record and JTA passages to their own sources. Every other sentence in the package that cites Brown v. FBI (in the confidential-source and chilled-tips evidence) describes it as an appeals decision without tying it to the Epstein records, and no other block repeats the conflated sentence. No other text, route, block or coverage row changed.

## Limits

Which claims became questions and where limits sit are editorial judgments for independent verification. The checks do not show that any inference is valid or any prediction true. Reading time and workload are untested.
