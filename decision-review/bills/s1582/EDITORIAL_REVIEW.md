# S.1582 guided review: editorial review

Built only from the frozen `input/source.json` (sha256 `c128e0f8664945adc151294d722836f26e8997df9f9a2a86c5ee63bb5b757e81`). No outside source was read and no fact was checked anew. This is a migration of the reviewed corpus, not a fresh inventory. Because this migration reads and publishes S.1582, it can no longer serve as an unseen bill for a future blind recall benchmark.

This version replaces the first S.1582 package, which kept the source's 25 old claims as the only questions. Here the reasoning is decomposed natively: provisions are context, and every material prediction in an argument is its own causal question.

## Shape

- 15 contexts (not asked): what the bill does; required backing; holders' rights in a failure (priority on reserves, priority for missing reserves, custody); the bankruptcy pause; blocking and lawful-order duties; identity checks; monitoring and reporting; consent limits on payment data; no complaints process in this bill; the issuer-interest ban; federal approval and state licenses; consumer rules for issuers; open networks and personal wallets; state supervision with national reach; permitted coins and commodity law.
- 70 causal claims and 55 value claims covering all 79 original arguments, all 69 responses (all retained) and all 141 qualification obligations.
- 323 blocks, all used; 691 source references and 641 citation links.

## Which claims are questions

**Provisions are context.** The eleven old claims that only stated what the bill requires, allows or omits (C04–C08, C13, C14, C17, C27, C20, C25) are now context shown beside the decisions that use them. Their responses, scope statements and notes are placed as challenges and limits at the decisions whose inference they dispute. For example, the C04 limits on uninsured-deposit reserves are at the backing claim, the repo-seizure and cash-exception responses at the recovery claim, and the not-new-pause response at the pause claim. Sentences that only confirmed that a provision exists are not repeated (coverage rationales say so).

**Kept causal claims.** Added use, household use, more mining, runs pulling money from banks, shocks reaching nonusers, local lending, the interest pull, identification, Section 9 monitoring, the commercial route, lock-in, network failure, attack incentives and the President's family business remain causal claims.

**New causal claims.** Each argument's own forecast is now a question, with its evidence, full response and limits beside it:

- what the protections achieve: backing makes repayment in full more likely; failure rules let holders recover more; failure rules get payment money back sooner; reserve and oversight rules make runs less likely; IT standards make issuers' systems safer; a nationwide license brings new providers; blocking duties stop some identified payments;
- seven separate mining harms (climate, air, water, cooling, land, electronic waste, noise), each requiring more mining;
- renewable settlement, then renewable power built, as two steps;
- household money losing value, frozen in a failure, without refund rights, costly to redeem, or drawn into scams;
- household payment money depending on networks that can fail, and separately on a network with rising attack rewards;
- forced sales, Treasury-market pressure and pressure for a rescue as runs' independent channels, beside runs on banks;
- poor and rural lending, local jobs and ministry lending, each narrower than local lending;
- crime-specific effects: payments for crimes against nature, fentanyl ingredients, ransomware, terrorist funds and then U.S. safety, scams, sexual blackmail, recovery of stolen money, and threat financing. Each has routes through the blocking claim, the identification claim or Section 9 monitoring, as its argument gives;
- threat channels beyond identity checks, hidden foreign control, rejection of Muslim and Arab customers as high risk, exclusion for documents, deterred association, church gifts moved onto traceable records, platforms pressuring sellers, platforms concentrating control, payment data used to steer customers, the tying ban lowering switching barriers, outside interests enriching the President, dollar reach, net borrowing costs, foreign instability, seigniorage, U.S. capacity, and clearer payment routes for betting and for pornography businesses.

A No on added use sets aside 46 decisions; on household use, 10; on more mining, 8.

## Consolidations and distinctions

Equivalent value connections are one judgment with OR routes. Value text says that each accepted consequence is enough on its own, and it does not assert a mechanism that a reviewer may have rejected.

| Value claim | Arguments | Routes |
|---|---|---|
| Nature: added harm from mining | UNN_oppose_01–07 | seven mining-harm claims |
| Concern: consumer safeguards | UNC_support_02, 03, 05, 06, 09 | bill's text; IT standards |
| Concern: essential money lost or out of reach | UNC_oppose_01, 02, 03 | loss of value; pause; no refund |
| Concern: weaker checks | UNC_oppose_04, 05 | bill's text |
| Tolerance: exclusion | UNT_oppose_01, 02 | group-based rejection; documents |
| Personal Security: fewer crime harms | SEP_support_01–05 | five crime claims |
| Personal Security: money for medical care | SEP_oppose_01, 02, 04 | loss; pause; network failure; attack; spillover to nonusers |
| Personal Security: financial strain linked to depression | SEP_oppose_03, 04 | fraud; spillover to nonusers |
| Societal Security: fewer routes to crisis | SES_support_02, 03, 05, 07 | fewer runs; faster access; interest pull; bill's text |
| Tradition: betting or pornography | TR_oppose_03, 04 | two payment-route claims |

Pairs kept apart, and why:

- **Personal Security, care money and strain.** One connection is losing money needed for treatment. The other is mental health through financial strain. SEP_oppose_04 states both, so it maps to both. The depression review quotation is at the strain judgment, which the nonuser spillover route reaches whether or not the fraud claim is accepted.
- **Concern, essential money and costly cash-out.** Essential money concerns people without a cushion losing money for necessities. Costly cash-out concerns unequal terms between small and large holders.
- **Concern, backing and failure.** Backing concerns repayment of small savings and aid money. Failure concerns just treatment through recovery rights and a regulator's voice in court, which also has a route through the bill's text alone.
- **Concern, opportunity and fair approval.** Opportunity depends on new providers reaching people. Fair approval is fair treatment of applicants by officials.
- Other value claims have one argument, or arguments whose value connections differ.

## Placement and repetition

- Each decision carries only the evidence, challenges and limits for its own inference. Background shared by several decisions is placed once at the first decision that every affected path passes through, or as one shared block, which the runtime shows in full once per path and collapses afterwards.
- Statutory background is in contexts. For example, the deemed-approval and state-preemption note appears only with the two value claims about approval and state supervision. It no longer appears at unrelated security values.
- Notes that repeat with only their citation numbers changed are shown once. Every copy is credited to that block as consolidated.
- Value panels hold only the facts that bear on the value connection. Crime, mining, network and run mechanisms are in their causal panels.

## References and wording

The source's internal claim IDs and claim-ref links are removed. Pointer sentences such as “See C13.” are dropped, and sentences that named another claim are rewritten to stand alone. No block refers to another decision by title or position. Where an inserted phrase replaces a pointer, the source reference quotes only the unchanged text. Claim text was reworded where needed; for example, the household claim no longer says “in C01”, and the attack-incentive claim no longer points to C23.

`[NAME]` substitutions keep each profile's scope, for example “gives a reason to resist penalties” and “the Southern Baptist tradition teaches”.

## Coverage and quotation checks

- Every argument maps to at least one value claim; argument IDs on nodes and in `coverage.json` agree.
- Every responses/qualifications ledger ID appears exactly once with argument IDs and source references copied from the ledger. Each row credits the blocks where its text is actually shown. Of the responses, 27 are shown verbatim and 31 consolidated; the other 11 are responses about provisions, which omit only sentences confirming that the provision exists. Of the qualifications, 97 are shown in full and 40 consolidated. Four claim-note fields say only that no claim-level note exists; each is credited to its own claim.
- Quotation survival check: every quoted passage of 20 or more characters in the frozen arguments, notes and responses appears in the placed text.
- The runtime validator accepts the package. `auditBill`, run read-only, passes native and independent route-oracle checks on all Yes, all No and every single causal No (72 paths), and on 77 combined-No pairs across alternative routes, with 0 quotation candidates. Targeted traversals confirm that each alternative route survives a No on its siblings. Examples: a No on attack incentives leaves the care-money and essential-payments judgments open through network failure; Nos on runs, Treasury markets and rescues leave the runs judgment open through the pause; a No on the blocking claim leaves each crime claim open through identification or Section 9.
- Paths (others Yes): all Yes answers 125 decisions plus 6 comparisons (131 judgments) and presents about 45,900 words; the largest decision is about 1,230 words. Answering every causal claim No leaves 38 judgments and sets aside 87 decisions.

## Limits

Which claims became questions, the consolidations and distinctions, and the placement of limits are editorial judgments for independent verification. The decomposition adds questions: the all-Yes path has 131 judgments, against 83 in the first version, with similar total words. The checks do not show that any inference is valid or any prediction true. Reading time and workload are untested.
