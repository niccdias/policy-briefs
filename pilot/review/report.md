# S.1582 shared-premise pilot: mapping report

## Outcome

The mapping covers all 79 active arguments, with 25 shared claims and 109 direct argument-to-claim dependencies across 130 paths. The 6 retired IDs stay retired and are used nowhere. `output/final_mapping/checks.json` reports `all_pass: true`.

**The pilot does not reduce total words.** Argument copy falls -15.8%, but the claim pages add more than that saves:

| Measure (PRO and CON only; argument notes and main effects excluded) | Words | Against original |
| --- | --- | --- |
| Original arguments | 24,052 | |
| Pilot arguments | 20,245 | -15.8% |
| Pilot arguments + claim pages without notes | 26,099 | +8.5% |
| Pilot arguments + claim pages with notes | 28,484 | +18.4% |

The saving is in repeated judgments: 113 repeated uses become 25 questions, and 7 copies of the mining objection become one. Added novice background and repeated notes are the main reasons the total rises. Whether this is a net gain for coders is untested.

## Final mapping correction

This package is in `output/final_mapping/`. `output/` and `output/correction/` are unchanged, and `prior_deliveries_hashes.json` records their hashes. It makes only these changes on top of the first correction below:

1. **C23 split into C23 and C28.** C23 is network failure interrupting payments despite safe reserves, with no statement about attack incentives. C28 is Ethereum attack incentives under assumed growth, and keeps the source's statement that likelihood may remain low under normal conditions. SEP_oppose_02 and SES_oppose_03 each have two alternative paths: C02 and C23, or C02 and C28. Rejecting one mechanism does not block the other. Their local bridge gaps are kept. SES_oppose_03's CON headline still names the attack scenario, because I did not rewrite its merits; its step about dependence applies to both paths.
2. **UNC_oppose_03 split into alternatives.** One path is C02 and C25, for the missing required process. The other is C02 only, for the existing local omissions on unauthorized transfers and refunds, statements and customer service, and enforcement. These omissions share one local path, with their passages listed in `additional_original_excerpts`. Their merits are unchanged. The Section 6(c) quote now stays in the CON, because the local path does not require C25.
3. **Factual context corrections.** UNC_oppose_01 (PRO) and SES_support_02 (CON) now give the Brookings qualification that the risks apply unless reduced by capital, liquidity and risk management standards. Each keeps its side. The source itself has a typo at “aremitigated”, so the copy quotes around that word and paraphrases “unless these risks” as "unless those risks are reduced by".
4. **Substantive scope correction.** UNC_oppose_11 now gives the bill's committee finding on affiliate tying for covered public companies, and says the criticism applies mainly outside that route. A gap records the step outside it. This is not a new rebuttal, and the argument stays without a point-specific CON.

No removed CON or retired argument was revived. Other claims and arguments were not reopened.

## First correction

This correction changed the following, on top of the first delivery:

1. **C17 split into C17 and C27.** C17 is now the written identity and customer checks. C27 is the written suspicious-transaction monitoring and reporting duty. A reviewer can now reject one without blocking the other. No new substantive inference was added.
2. **C17 members:** UNT_oppose_01, UNT_oppose_02, UNT_oppose_03 and TR_oppose_02.
3. **C27 use:** the reporting paths in UNC_support_08, SEP_support_01, SEP_support_05 and SES_support_01. C18's detection inference needs the written duty, so C18 now requires C27 and these paths list C18 alone. Each path records C27 under `via_prerequisite` with an exact passage. C27 therefore has no direct argument dependency; its four uses all run through C18. This is the one exception to the rule that members equal direct dependencies, and `checks.json` tests it separately.
4. **Quotes kept local because of the split.** SES_support_01 keeps its identity quotes, since C17 is not required there. TR_oppose_02 keeps its reporting quote, since C27 is not required there. Section 9 stays in C19.
5. **Factual context corrections.** Both are recorded as `factual_context_correction`, not as clarity edits. SES_oppose_01 now attributes the USDT passage to a Bloomberg opinion piece instead of "Bloomberg reports", and restores “(The company denies wrongdoing.)”. UNC_support_08 quotes the same passage, so it gets the same attribution and denial. You named only SES_oppose_01 for attribution, so please check that UNC_support_08 extension.

The runtime check was rerun at the start and end of each correction, with no delegation. `package_hashes.json` lists the hashes of this package.

## Decisions to review

1. **Removed after your audit: C15, C16, C26.** Past freezes, broad crime examples and care affordability were evidence or background, not necessary conditions. Their passages stay local. The other IDs were kept, so the numbering has gaps.
2. **Narrowed in my own audit: C09 and C17.** Each joined propositions that not every member needs. C09 now needs only the run-to-bank direction. C17 lost its "more detailed than before" comparison, which went back to UNT_oppose_01 and UNT_oppose_02, and was later split (see First correction above). Both statements differ from the version you first read.
3. **C18 is limited to an issuer's own account holders.** A Yes does not show reach into the secondary market. UNC_support_08, SEP_support_01, SEP_support_05 and SES_support_01 each carry a gap for whether their crime's payments fall in that group. FinCEN's April 2026 proposal is described as a non-final proposal, separate from the bill and from Section 9.
4. **C03-P2 is deliberately open with no shared requirement.** DeRoche's forecast concerns crypto generally, so it does not pass through C01. Its only support is that forecast, which joins "legitimized" to "used". Requiring C01 there is a reasonable alternative.
5. **Dependencies rejected as artificial.** UNC_oppose_12 does not need C20, because it treats the limit as weak. UNC_oppose_07 does not need C12, because it uses only the ban's text. SES_support_03 does not need C08. UNC_support_11 and SES_support_08 do not need C01.

## Substantive changes

**Contextual evidence additions.** These six quotations are not in the accepted bank. They come from the staged sources and were text-matched only. Each is classified `contextual_evidence_addition` in `mapping.json`, on the claim and in a top-level list. None is in argument copy.

| Claim | Citation | Added quotation | Rationale |
| --- | --- | --- | --- |
| C06 | UNC 3 | “to the extent compliance with section 4 of the GENIUS Act would have required additional reserves” | Gives the bill's exact limit on the shortfall priority. The bank states this limit only in paraphrase (note S1582_UNC-10). |
| C08 | UNC 38 | “It would normally follow then that the automatic stay would not apply to assets not included in the bankruptcy estate” | Qualifies the existing response that the pause is not shown to be new. The same lawyers suggest a pause on reserves may not simply repeat ordinary law; that response does not discuss this passage. |
| C10 | UNC 6 | “such as the collapse of a major stablecoin issuer, crypto lending platform, or crypto exchange” | Shows the source's warning covers a wider class than stablecoin issuers, so the claim's scope is not overstated. |
| C11 | UNC 32 | “Bank A loses a deposit, Bank B gains one” | Shows the redeposit response concerns total deposits and leaves open which bank loses them. |
| C11 | UNC 32 | “the regulatory treatment of the deposit in Bank B may be less (or more) favorable” | The source's own qualifier on the redeposit response, which is relevant to whether funding stays usable for lending. |
| C28 | SEP 23 | “Even if the likelihood of these attacks remains low under normal conditions, the economic incentive gradient steepens with stablecoin adoption.” | Shows the source describes incentives and does not state a likelihood of attack, so the claim is not read as a forecast. |

**Argument edits.** Of the 79 arguments, 65 are `clarity_only`, 8 are `unchanged` and 6 are `both`.

- **SES_oppose_01, UNC_support_08, UNC_oppose_01 and SES_support_02 (`both`):** factual context corrections, described above.
- **UNC_oppose_11 (`both`):** substantive scope correction, described above.
- **UNC_oppose_13 (`both`):** the copy now says "legal experts say", matching the source's attribution of the ethics statement.
- **SEP_oppose_04 (`clarity_only`, please review):** it relied on the reader remembering Point 3, so the depression source is now cited there.
- **SEP_oppose_02 (`clarity_only`):** "point 1" is replaced by that point's quote and citation.
- **Claim pages:** all are new text. They include editorial background and bridging sentences, and each has an `edits` field.

**Corrected during integration:** C02 had quoted editorial note wording with a source citation, as if Waller had said it. It is now unquoted and attributed to the note as editorial wording. A cited quote not found in its source now fails `all_pass`.

## Reading limits

- I read all 85 catalog points, the bound source context for the shared claims' key quotations, and the bill sections involved. I did not read every source in full.
- Source support is normalized text matching against staged files (129 cited claim quotes matched). I did not verify the sources independently or open live URLs.
- Argument copy was checked to contain only quotes already in the bank. Quotes kept from the bank were not all re-read in source context.
- A missing CON establishes nothing: 35 arguments have no point-specific CON, and that status is preserved.
- Claim questions and paths have not been tried with coders, so ESL readability is my judgment.
- `mapping.json` adds fields beyond the schema: path `label`, `dependency_evidence`, `via_prerequisite` and `additional_original_excerpts`; member `via`; argument `note_ids` and `no_point_specific_con`; claim `edits`; top-level `rejected_candidates`, `contextual_evidence_additions`, `factual_context_corrections` and `substantive_scope_corrections`; `metrics.path_count` and `metrics.via_prerequisite_edges`.

## Merges

| Claim | Uses | Title | Why merged; limits kept |
| --- | --- | --- | --- |
| C01 | 14 | The bill would increase stablecoin use overall | Same proposition (the bill adds some use) across 14 arguments. Scope kept low: no size, speed or user group. CFR's sentence on bank-issued coins is flagged as narrower. Alternative rejected: requiring C01 for UNC_support_11 and SES_support_08, whose conclusions do not need overall growth. |
| C02 | 9 | Added use would reach households' everyday money | Household reach is split from C01 because many arguments need added use but not household use. Notes on limited retail use stay attached as limits, not rebuttals. |
| C03 | 7 | The bill would lead to more Bitcoin mining | All seven mining arguments depend on the same step and repeated the same long objection. Two OR routes are retained. Pollutant, water, equipment and noise harms stay local. |
| C04 | 6 | Permitted issuers must hold full backing | Same Section 4 duty in six arguments. Limited to the legal duty. Reuse limits stay local because not every member uses them. Availability in stress is left to later steps. |
| C05 | 6 | Holders come first on required reserves if an issuer fails | Same Section 11(a) priority in six arguments. Timing is split into C08, the shortfall rule into C06. |
| C06 | 3 | Holders also come first for missing required reserves | Same statutory rule used for holders and against wage claimants. Answered only as a rule; the valence stays in each argument. |
| C07 | 3 | Firms holding stablecoin assets must keep them for customers | Same Section 10 duty in three arguments. The cash and omnibus exceptions are kept. |
| C08 | 3 | A failed issuer's holders can face a pause before repayment | Same pause in three opposing arguments. SES_support_03 mentions the 14-day target as a benefit and is not a member, since it does not need the pause. Whether the pause is new stays as an objection, with a flagged source passage. |
| C09 | 3 | Runs on stablecoins can pull money out of banks | Same run-to-bank mechanism in three arguments. Narrowed after audit: UNC_oppose_10 uses only that direction, so the reverse direction is background. Fire-sale and Treasury-market routes stay local because they are different mechanisms, and they stay open if C09 is No. |
| C10 | 3 | Serious financial shocks can reach people who never used stablecoins | Same reach proposition in three arguments, on both sides. It does not assert size. The rescue route stays local because it reaches taxpayers. |
| C11 | 3 | Stablecoin growth would reduce deposit funding for local lending | Same deposit-to-lending step in three arguments. Lender type stays local (rural, farms, ministry). Not merged with C12: a hypothetical interest incentive differs from growth under the bill. |
| C12 | 2 | The ban on issuer interest removes one pull on bank deposits | Both members depend on the ban and its effect on deposits. UNC_oppose_07 uses the ban text only, so it is not a member. Scope is issuer-paid interest. |
| C13 | 9 | Legal power over known payments: permitted issuers | Legal power only. Identification (C18, C19), actual use and later effects are kept out. Split from C14 because scope and legal test differ. |
| C14 | 9 | Legal power over known payments: foreign issuers on U.S. services | Legal power over foreign coins on U.S. services only. An OR alternative to C13, since examples using USDT may reach the bill only by this route unless the issuer becomes permitted. |
| C17 | 4 | Written customer identity checks | Written identity and customer checks in Section 4(a)(5)(A)(v), used by UNT_oppose_01, UNT_oppose_02, UNT_oppose_03 and TR_oppose_02. Split from monitoring and reporting because a reviewer can reject one while accepting the other. The comparison with prior rules stays in UNT_oppose_01 and UNT_oppose_02. |
| C27 | 4 | Written suspicious-transaction monitoring and reporting | Written monitoring and reporting duty in Section 4(a)(5)(A)(iii), needed on the four reporting paths. Those paths reach it through C18, which requires it, so it is not listed twice. Reach into the secondary market is not stated in Section 4's text; FinCEN's proposal is kept distinct from the bill, and Section 9 stays in C19. |
| C18 | 4 | Reporting duties would help identify illegal payments | Identification through Section 4 reporting. Requires C27. Scoped to payments involving an issuer's own account holders, so a Yes cannot be used to show reach into the secondary market. Each argument keeps its own step for whether its crime's payments fall in that group. |
| C19 | 5 | Section 9 would lead to monitoring beyond issuers' own dealings | Same Section 9 step used for finding crime and for fearing exposure. Later consequences stay local. The outcome is left open and does not require a specific final rule. |
| C20 | 2 | Consent limits on commercial use of payment data | Same consent limit is the core premise of two arguments. UNC_oppose_12 is excluded because its argument does not need the limit to exist. |
| C21 | 3 | The bill leaves commercial companies a more usable route | Same route premise in three arguments. It does not claim the bill created commercial issuance. |
| C22 | 3 | Commercial platforms could make their payment systems hard to leave | Same risk premise used in three arguments on both sides. Consequences (seller pressure, national stability) stay local. |
| C23 | 2 | Network failure can interrupt payments despite safe reserves | Network failure interrupting payments despite safe reserves, used by SEP_oppose_02 and SES_oppose_03. Split from C28 so that rejecting one mechanism does not block the other. Household and essential-payment dependence is a separate step (C02 and local). |
| C28 | 2 | Ethereum activity raises the incentive to attack | Ethereum attack incentives under assumed growth, used by the same two arguments as an alternative path to C23. The source's statement that likelihood may remain low under normal conditions is kept. |
| C24 | 2 | Wider use would benefit the President's family business, and ethics rules do not stop that | Same benefit and ethics premise is the core of two arguments. Foreign-counterparty and favor-seeking steps stay local. |
| C25 | 2 | The bill adds no required process for customer complaints | The two arguments differ in breadth, so the claim uses only their common narrower proposition. UNC_oppose_03's other omissions stay local. |

**Prerequisites between claims:** C02 requires C01; C03-P1 requires C01; C18 requires C27; C24 requires C01.

## Candidates not merged

| Candidate | Decision | Reason |
| --- | --- | --- |
| C15 past freezes | removed as dependency | Past freezes are evidence for an ordinary legal-tool-to-effect inference, not a necessary condition. UNN_support_01, SEP_support_01 and SEP_support_05 make the same inference without them. Passages stay local in each argument. |
| C16 broad crime examples | removed as dependency | Its list of crimes could stand in for a needed specific connection, such as fraud victims in UNC_support_08. A narrower security-threat version would have only two uncontested uses, so the passages stay local. |
| C26 care affordability | removed as dependency | The survey is background to a health inference. The arguments can hold without it. The quote is restated in SEP_oppose_02, which had relied on a cross-reference. |
| Tying ban (UNC_support_09, SES_support_06) | local | One short uncontested quote; the dispute in SES_support_06 is a local inference. |
| IT risk standards (UNC_support_05, SES_support_04) | local | One short quote; the response concerns only shared networks in one argument. |
| Licensing appeal text (UNC_support_12, UNT_support_01) | local | Text is uncontested and the disputes are different local inferences. |
| Manager screening (UNC_support_06, SES_support_01) | local | Reuse saves little and the deemed-approval response reaches one argument. |
| State-license preemption (UNC_support_11, UNC_oppose_05) | local | One short quote, used with opposite value conclusions. |
| Open-network denial rule (UNT_support_02, SES_oppose_03, UNC_support_11) | local | One short quote; in UNC_support_11 it is helpful background, so a dependency would be artificial. |
| Fee disclosure (UNC_support_02, UNT_support_03) | local | One short quote and the disputes differ. |
| Not federally insured (UNC_oppose_01, SEP_oppose_01) | local | Short uncontested fact. |
| Secondary-market access (UNC_oppose_06, SEP_oppose_01) | local | Different sources and different consequences; split scopes. |
| Uninsured-deposit reserve risk (UNC_oppose_01, SES_oppose_04) | local | One short quote with different consequences. |
| Public rescue pressure (UNC_oppose_10, SES_oppose_04) | local | One short quote, and a separate OR route in both arguments. |
| Examination and diversification text (UNC_support_07, SES_support_02) | local | Reuse saves little; SES_support_02 has several other routes. |
| Reserve report text (UNC_support_03, SES_support_02) | local | Reuse saves little. |
| Blockchain tracing (UNT_oppose_03, TR_oppose_02) | local | One short uncontested quote. |
| Financial strain and depression (SEP_oppose_03, SEP_oppose_04) | local | One short quote; restated with its citation in SEP_oppose_04. |
| Segpay payment route (TR_oppose_03, TR_oppose_04) | local | The gambling response reaches one sector only, so a merged claim would collapse scope. |
| UNHCR USDC aid (UNC_support_01, UNT_support_03) | local | Short uncontested example, with different quotes. |

## Alternative paths

30 arguments have more than one route (OR). Requirements within a route are AND. Empty brackets mean a local route that stays open whichever way the shared claims are answered.

| Argument | Routes |
| --- | --- |
| UNN_support_01 | Permitted-issuer freezing [C13]; Foreign-issuer access condition [C14] |
| UNN_support_02 | Full backing [C04]; Holder priority [C05]; Reserves kept out of the bankruptcy estate [] |
| UNC_support_02 | Limits on discretionary cash-out limits []; Advance notice of fee changes [] |
| UNC_support_03 | Checked reserve reports []; Ban on false claims of government backing [] |
| UNC_support_04 | Customer property at firms holding assets [C07]; Priority on required reserves [C05]; Priority for missing required reserves [C06]; Regulator heard in court [] |
| UNC_support_06 | Conviction bar []; Licensing review of managers []; Correction and enforcement powers [] |
| UNC_support_08 | Freezing by permitted issuers [C13]; Foreign-issuer condition [C14]; Detecting criminal transfers [C18] |
| UNC_oppose_01 | Reserves in uninsured deposits can lose value [C02]; Lender seizes pledged Treasury securities [C02] |
| UNC_oppose_03 | Missing required complaints process [C02, C25]; Local refund, account-tool and enforcement omissions [C02] |
| UNC_oppose_10 | Run drains banks [C01, C09, C10]; Forced asset sales spread stress [C01, C10]; Pressure for a public rescue [C01] |
| UNC_oppose_15 | U.S. Treasury loses income [C01]; Foreign governments lose income [C01] |
| UNT_support_02 | Reserve protection on this route [C04]; Repayment priority on this route [C05] |
| UNT_support_03 | Reserve protection [C04]; Repayment priority [C05]; Clear issuer fees [] |
| UNT_oppose_04 | Permitted-issuer freezing [C13]; Foreign-issuer condition [C14] |
| SEP_support_01 | Blocking by permitted issuers [C13]; Foreign-issuer condition [C14]; Reporting identifies purchases [C18] |
| SEP_support_02 | Freezing by permitted issuers [C13]; Foreign-issuer condition [C14]; Tracing standards find profits [C19] |
| SEP_support_03 | Foreign-issuer condition [C14]; Duty on permitted issuers [C13] |
| SEP_support_04 | Blocking by permitted issuers [C13]; Foreign-issuer condition [C14]; Tracing standards find networks [C19] |
| SEP_support_05 | Freezing by permitted issuers [C13]; Foreign-issuer condition [C14]; Tracing standards find blackmailers [C19]; Suspicious-activity reports [C18] |
| SEP_oppose_01 | Loss of value [C02]; Freeze in failure [C02, C08] |
| SEP_oppose_02 | Network failure blocks care money [C02, C23]; Attack incentives threaten care money [C02, C28] |
| SEP_oppose_04 | Risk to money for care [C01, C09, C10]; Financial strain linked to depression [C01, C09, C10] |
| SES_support_01 | Freezing by permitted issuers [C13]; Foreign-issuer condition [C14]; Reporting identifies threat funds [C18]; Better detection rules [C19]; Licensing and registration screens [] |
| SES_support_02 | Full backing [C04]; Limits on reserve risks and use []; Enforceable oversight [] |
| SES_support_03 | Customer property at firms holding assets [C07]; Priority on required reserves [C05]; Priority for missing reserves [C06]; Court route to prompt distribution [] |
| SES_support_05 | Committee safety gate []; Limits on issuer activities [] |
| SES_support_06 | Ban on tying [C22]; Compatibility standards power [C22] |
| SES_oppose_03 | Outages on shared networks [C02, C23]; Attack incentives on Ethereum [C02, C28] |
| SES_oppose_04 | Runs drain banks [C01, C09]; Pressure on federal borrowing [C01]; Frozen payment funds disrupt commerce [C02, C08]; Pressure for emergency support [C01] |
| TR_support_02 | Full backing [C04]; Priority on required reserves [C05]; Asset holders protect customer property [C07] |

**Arguments using no shared claim (18):** UNC_support_02, UNC_support_03, UNC_support_05, UNC_support_06, UNC_support_09, UNC_support_11, UNC_support_12, UNC_oppose_04, UNC_oppose_05, UNC_oppose_07, UNC_oppose_16, UNT_support_01, SES_support_04, SES_support_05, SES_support_08, SES_oppose_06, TR_oppose_03, TR_oppose_04.

## Gaps flagged, not repaired (29)

These are unsupported bridges in the existing text. A flag is not a verdict that the argument fails.

| Argument | Step | Explanation |
| --- | --- | --- |
| UNN_support_01 | Wildlife branch | The wildlife-trade source discusses cryptocurrencies generally and does not name stablecoins, so this branch has no stated link to stablecoin payments. The gold branch does not have this gap. |
| UNN_support_03 | Freed money reaches renewable projects | Innovo says freed money can go 'elsewhere' without naming a destination, and the evidence notes do not map renewable-credit demand one-to-one onto new generation. The text supplies no direct link from freed money to more renewable power. |
| UNC_support_08 | Do the reported transfers involve the issuer's own customers? | C18 is limited to payments involving an issuer's own account holders. The text does not show that criminal transfers fall in that group once coins have moved away; the CON raises this. |
| UNC_support_10 | Consent as fair control | The PRO does not explain why agreement gives fair control when the paragraph does not require service to remain available to a person who refuses; the CON raises this. |
| UNC_support_12 | Comparison with prior law | The PRO does not establish less arbitrary treatment than under the law in force on July 17, 2025; the CON raises this. |
| UNC_oppose_03 | Rights under other law | The PRO lists omissions from this statute. It does not establish the refund gap under the laws and contracts that govern these accounts; the CON raises this. |
| UNC_oppose_07 | Why the restriction is unjust | The PRO does not explain why funding a payment service from reserve income is unjust unless customers can also bargain for interest; the CON raises this. |
| UNC_oppose_11 | Affiliate tying outside the covered public-company route | The committee finding covers affiliate tying for covered public companies. The quoted criticism does not separate that route from others, and the text does not show how this pressure arises outside it. |
| UNC_oppose_12 | From payment data to higher prices | The FTC finding concerns search and purchase activity, not stablecoin data, so the step to stablecoin payment data is an inference. |
| UNT_support_01 | Tolerance link | The text asserts that listening to people who contest a licensing decision puts tolerance into practice. It gives no support that this process concerns differences in people, backgrounds or beliefs; the CON raises this. |
| UNT_support_02 | Tolerance link | The text does not show that protecting funds against issuer failure supports accepting unpopular voices. Issuer failure is a different risk from refusing a user's speech or ties; the CON raises this. |
| UNT_support_03 | Tolerance link | The text supplies no reason why making a useful service safer expresses acceptance of cross-border family ties or different lives; the CON raises this. |
| UNT_oppose_04 | Tolerance link | The text needs a premise that cutting off ordinary payments for this exercise of court power rejects the judges for their differences. It describes the work as disputed but does not support that premise; the CON raises this. |
| SEP_support_01 | Do the purchases involve the issuer's own customers? | C18 is limited to payments involving an issuer's own account holders. The text does not show that ingredient purchases fall in that group; the CON raises this. |
| SEP_support_03 | From frozen funds to safety in the United States | The source says homegrown attackers' activities tend to be funded through legal means. The text relies on wider ISIS funding and promotion and does not show that the frozen funds pay for U.S. attacks or the propaganda; the CON raises this. |
| SEP_support_04 | FBI warnings | The FBI warning evidence describes outreach to victims, which is not an issuer duty under the bill. The text does not connect the bill to those warnings. |
| SEP_support_05 | Do the marketplace payments involve the issuer's own customers? | C18 is limited to payments involving an issuer's own account holders. The CON says payments between marketplace users would ordinarily be secondary-market transactions. |
| SEP_oppose_02 | Dependence on an affected network | The text does not show that the added activity would make households depend on an affected network for money needed for treatment; the CON raises this. |
| SEP_oppose_03 | From issuer approval to scam losses | The cited scam relies on fake apps. The text does not connect lawful issuer approval to increased belief in those apps or to higher fraud losses; the CON raises this. |
| SES_support_01 | Do threat-linked transfers involve the issuer's own customers? | C18 is limited to payments involving an issuer's own account holders. The text does not show that threat-linked transfers after issuance fall in that group; the CON raises this. |
| SES_support_08 | Framework keeps expertise in the United States | The text cites a brain-drain risk and says the rules should encourage growth, but it gives no direct evidence that the bill keeps firms or expertise from moving abroad. |
| SES_support_09 | From dollar use to U.S. reach | The text does not show that growth in regulated dollar tokens replaces rival channels with transactions the United States can newly detect and stop; the CON raises this. |
| SES_support_10 | From lower rates to more public resources | The text does not net out other demand for Treasury bills or lost public earnings; the CON raises this. |
| SES_oppose_03 | Dependence of essential payments | The text joins a general growth forecast to one network's attack incentives. It does not show that essential U.S. payments would depend on such networks; the CON raises this. |
| TR_support_02 | How long gifts stay in coins | The PRO states that the sources do not report how long churches hold gifts as coins, so the time these protections apply is unknown. |
| TR_oppose_02 | From wider use to church gifts | The text does not show that the bill moves church gifts from cash onto a traceable record; the CON raises this. |
| TR_oppose_03 | Reach where gambling rules apply | Licensing a coin issuer does not approve a betting business or oblige a bank to serve it; the CON raises this, and leaves open the route for lawful operators. |
| TR_oppose_04 | Inherited continuity | The quote gives present Southern Baptist teaching. It does not itself describe the history of this teaching, though the PRO calls it what [NAME]'s tradition teaches. Flagged for main-agent review under the Tradition standard. |
| TR_oppose_07 | Link to ministry lenders | The sources do not connect the source of stablecoin demand to the funding of lenders serving churches; the CON raises this. |

## Workload counts

| Item | Count |
| --- | --- |
| Shared claim questions | 25 |
| Active arguments | 79 |
| Paths | 130 |
| Local paths with no shared requirement | 30 |
| Direct argument-to-claim dependencies | 109 |
| Dependencies reached through a prerequisite (C27 through C18) | 4 |
| Quotes kept in arguments | 376 |
| Quotes moved to a required claim | 178 |
| Candidates removed or left local | 20 |

Scripts used to build and check the mapping are in `output/final_mapping/work/`. Original notes are verbatim on every argument.
