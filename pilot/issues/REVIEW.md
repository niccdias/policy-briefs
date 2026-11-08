# S.1582 issue-review grouping audit

Prepared by Opus 5.5 High (effective High verified at the start and end of each working turn; see `runtime_start.json`, `runtime_end.json`, `runtime_wording_start.json` and `runtime_wording_end.json`). This audit covers `issue-map.json` and `ui-copy.json` in this folder; `interface-wording-review.json` covers the interface code's wording.

**No content was changed.** No argument, response, note, quotation, citation, path, gap, shared claim or reference profile in the canonical release was edited, added or removed; `pilot/release/content.json` matches base commit `901ff1cfd4cedff6371c36a6910fac19ade5e152`. The issue map adds only grouping, an issue title, a short neutral introduction and an internal rationale. No verdict on any argument, issue or value is supplied or implied.

## Grouping rule applied

Each issue gathers arguments within one value whose consequences share an endpoint or a direct trade-off, so the SUPPORT and OPPOSE cases on that endpoint are read together. A shared topic or shared provision alone was not enough. Distinct mechanisms, populations, endpoints, causal alternatives and the difference between a safeguard and an exposure are recorded in each rationale. One-sided issues were kept where no opposite-side argument reached the same endpoint; no pairing was forced for symmetry.

Source: `pilot/release/content.json`, content `approved-closure-20261107-d7b57ff714c5e55c3ecb`, SHA-256 `654ead3cedbe5332e78d2fbe092ee02fffe5366e487bb1b8b8ab156e76e6f022`.

## Coverage

- Arguments: 79 of 79 S.1582 arguments, each in exactly one issue within its own value. No cross-value grouping.
- Issues: 49 (UNN 6, UNC 17, UNT 5, SEP 7, SES 10, TR 4).
- Two-sided issues (SUPPORT and OPPOSE members): 22. One-sided issues: 27.
- Issue sizes: 1 member: 24, 2 members: 21, 3 members: 3, 4 members: 1.

### Potential question counts (not observed burden)

- Shared-claim judgments: 3 (C03, C11, C19), unchanged.
- Issue presence questions: 49, one per issue.
- Issue comparison questions: at most 22; asked only when the reviewer chooses Both on a two-sided issue.
- Value comparison questions: at most 6; asked only when both directions qualify for the value.
- Maximum possible: 80 questions.

These are counts of possible questions. They are not measurements of time, effort or reliability, and no human has used this design. Reading is not reduced: every argument, response, note and shared claim is still shown in full.

## Pilot assessment, release and rollback notes

- **Question structure compared with the argument-level design.** The earlier S.1582 design asked 79 argument judgments, 3 shared-claim judgments and up to 6 value comparisons: at most 88 questions. The issue design asks 49 issue presence questions in place of the 79 argument judgments, keeps the same 3 shared-claim judgments and up to 6 value comparisons, and adds up to 22 new issue comparison questions (only for two-sided issues answered Both). Its maximum is 80. Fewer possible questions is not evidence of less time or effort: every argument is still read, and the issue comparisons are new decisions.
- **No demonstrated benefit.** No human has used this design. Speed, comprehension, consistency and reliability are untested. Whether reviewers can explain all six overall value judgments from their issue answers can only be learned in a human trial.
- **What changed and what did not.** The issue run is a separate version (`s1582-issues-20261108-v1` in `assemble-issues.mjs`) that rejects responses from other runs and imports no earlier answers. It is built from the exact canonical release bytes (hash above), plus `issue-map.json` and `ui-copy.json`. The canonical corpus, the eight-bill workflow and its saved responses are not changed by these files.
- **Rollback.** Withdrawing the issue run means removing its version from reviewer assignments and reverting the issue-run commits; the canonical release needs no change. Main records the exact deployment and rollback targets in the publication receipt.

## Findings and risks

1. **Broadest issue: `S1582_SES_I02`.** Three safeguards (reserves and oversight; protection after a failure; commercial-issuer gate and activity limits) are grouped with one multi-route exposure (`SES_oppose_04`). All four bear on national financial stability, and `SES_oppose_04`'s routes address each safeguard's endpoint. The cost is that an issue answer of Both cannot show which safeguard the reviewer accepted. Independent scope review accepted it as broad but coherent: one run-and-failure transmission sequence, with each member's separate effects kept visible.
2. **Resolved: former `S1582_SES_I08` pairing.** Independent scope review found that domestic capacity for payment technology (`SES_support_08`) and hidden foreign control through the foreign-issuer route (`SES_oppose_02`) shared only an umbrella (control of payment infrastructure), not a concrete endpoint. Main accepted the split: `SES_I08` now holds `SES_support_08` alone, and new `SES_I10` holds `SES_oppose_02`. No other ID changed. The `UNC_I08` rationale was also corrected: `UNC_oppose_10`'s rescue route needs C01 only, not C10.
3. **Cross-issue relations left ungrouped by design** (each argument can sit in only one issue):
   - `SES_support_10` (lower Treasury borrowing costs) and route P2 of `SES_oppose_04` (outflows raise yields) share an endpoint; `SES_oppose_04` stays in `SES_I02`, where all four of its routes apply.
   - `SES_support_08` and `SES_oppose_02` were split after scope review (finding 2); neither now shares an issue.
   - `SES_oppose_06` (state supervision with national reach) and route P3 of `SES_support_02` (state certification and emergency federal action) overlap; `SES_support_02` stays in `SES_I02`.
   - `UNC_support_01` mentions dollar coins helping people facing unstable currencies; `UNC_oppose_14` argues the reverse for foreign economies. `UNC_support_01`'s main mechanism is backing, so it stays in `UNC_I01`.
   - Shared provision, different endpoint: `UNC_support_11` and `UNC_oppose_05` (state preemption: entry cost versus safety vetting); `UNC_support_13` and `UNC_oppose_07` (interest ban: community lending versus holders' fairness); `UNC_support_04` and `UNC_oppose_08` share C06 and are grouped, because the endpoint (who is paid when an issuer fails) is the same.
   - `TR_oppose_03` and `TR_oppose_04` share Segpay evidence but concern different moral rules, and the existing mapping already separates them because the gambling response does not reach the other sector.
4. **Mining arguments and C03.** All seven `UNN_oppose` arguments depend only on C03. They are split by endpoint (climate; land and wildlife; acid rain; water; equipment waste) rather than merged, so an answer can show which harms the reviewer accepted. If C03 is No, every OPPOSE side in `UNN_I01` to `UNN_I05` is blocked. Three of those issues are one-sided, which leaves Neither or Pending as the only choices. All texts remain readable.
5. **Crime-disruption singletons in Security – Personal.** `SEP_support_01`, `_02`, `_03` and `_05` share freezing and tracing tools but have distinct crimes, evidence and local gaps, so each is its own issue. Only `SEP_support_04` (scams) has an opposite-side counterpart on the same endpoint (`SEP_oppose_03`).
6. **Interface binding.** The earlier notes (issue-level guide, value-summary question, unresolved-path wording) are now reflected in `src/issue-ui.jsx`. The full wording review of the interface, with exact corrections and source hashes, is in `interface-wording-review.json`. D1 is resolved: main accepted the preferred option. An issue saved and completed as Pending no longer blocks its value; unanswered or stale issues still block. If the accepted issue answers already give a substantiated reason in both directions, the value outcome is Both even when another issue is Pending, and the reviewer compares (SUPPORT, OPPOSE or Pending) with that uncertainty in mind. Otherwise a Pending issue leaves the outcome Pending, and the value can still be completed. `ui-copy.json` states this rule in guide paragraphs 7 and 9, `allConsequencesGuide`, `presenceDescriptions.Pending` and the new `summaryDefaults.pending`, which the current lowercase lookup in `src/issue-ui.jsx` already selects.
7. **Copy constraints observed.** The option labels match the approved list exactly. The shared-claim question, the No note and the three shared-claim guide sentences reuse the existing wording verbatim. The bill-version sentence was changed from "each bill’s" to "the bill’s" for this one-bill pilot. `strengthLabels.Pending` is "Pending", as approved; the earlier app text "Pending — no justified comparison yet" survives only as the meaning in `strengthDescriptions`.

No human comprehension, workload or reliability testing was done. Nothing here claims reduced effort.

# Issues by value

## UNN · Universalism – Nature

### S1582_UNN_I01 · Climate pollution

- Members: `S1582_UNN_support_03` (SUPPORT); `S1582_UNN_oppose_01` (OPPOSE)
- Shared claims on member paths: C01, **C03** (judged)
- Why grouped and distinctions retained: Common endpoint: greenhouse-gas pollution and the climate harm it does to forests and ecosystems. SUPPORT_03 runs through C01 (added institutional use after Section 16 clarity) to faster settlement in renewable-energy markets; its own gap is the missing link from freed money to added renewable generation. OPPOSE_01 runs only through C03 (more mining) to fossil-heavy marginal electricity and displaced renewable supply. The mechanisms are independent: neither argument answers the other's reasoning, so they are compared as separate climate effects on the same endpoint, not as rebuttals.

### S1582_UNN_I02 · Damage to forests, land and wildlife

- Members: `S1582_UNN_support_01` (SUPPORT); `S1582_UNN_oppose_05` (OPPOSE); `S1582_UNN_oppose_07` (OPPOSE)
- Shared claims on member paths: **C03** (judged), C13, C14
- Why grouped and distinctions retained: Common endpoint: physical damage to land habitats and the wildlife living in them. SUPPORT_01 is a safeguard: legal freezing power over named payments (C13, C14 background) applied to crimes that clear forest, poison soil and remove wildlife; its wildlife branch has a recorded gap (sources do not name stablecoins). OPPOSE_05 (fuel extraction and combustion waste) and OPPOSE_07 (fan noise near rural habitats) are exposures that each depend only on C03. The two OPPOSE members keep distinct mechanisms (land degradation versus noise); they are grouped because both reach habitats and wildlife, not because both concern mining. Air, water and equipment-waste harms are kept as separate issues.

### S1582_UNN_I03 · Air pollution that harms forests and lakes

- Members: `S1582_UNN_oppose_02` (OPPOSE)
- Shared claims on member paths: **C03** (judged)
- Why grouped and distinctions retained: Single OPPOSE argument with a distinct pollutant and endpoint (nitrogen oxides, acid rain on lakes and forests). Kept apart from the climate issue because its harm pathway and evidence differ from greenhouse-gas effects. Depends only on C03. No SUPPORT argument addresses this endpoint.

### S1582_UNN_I04 · Freshwater and waterways

- Members: `S1582_UNN_oppose_03` (OPPOSE); `S1582_UNN_oppose_04` (OPPOSE)
- Shared claims on member paths: **C03** (judged)
- Why grouped and distinctions retained: Common endpoint: freshwater resources and aquatic life affected by mining's cooling and power supply. Distinctions kept: OPPOSE_03 concerns quantity (consumptive use in water-stressed areas); OPPOSE_04 concerns quality and wildlife (withdrawal and heated, chemical-bearing discharge from once-through cooling). Both depend only on C03, and each response notes a separate missing link (change in cooling or power use; added use of those plants). No SUPPORT argument addresses this endpoint.

### S1582_UNN_I05 · Discarded mining equipment

- Members: `S1582_UNN_oppose_06` (OPPOSE)
- Shared claims on member paths: **C03** (judged)
- Why grouped and distinctions retained: Single OPPOSE argument with a distinct endpoint: electronic waste from short-lived mining chips. Kept apart from fuel-supply waste (OPPOSE_05) because the source of waste and the pollution route differ. Depends only on C03. No SUPPORT argument addresses this endpoint.

### S1582_UNN_I06 · Donations for forest protection

- Members: `S1582_UNN_support_02` (SUPPORT)
- Shared claims on member paths: C04, C05
- Why grouped and distinctions retained: Single SUPPORT argument with a distinct mechanism: protecting conservation funding (C04, C05, and a local bankruptcy-estate route) during the short time gifts stay in stablecoins. Kept apart from SUPPORT_01 because it protects money for conservation rather than interrupting destructive crime. No OPPOSE argument addresses this endpoint.

## UNC · Universalism – Concern

### S1582_UNC_I01 · Safety of money held in stablecoins

- Members: `S1582_UNC_support_01` (SUPPORT); `S1582_UNC_oppose_01` (OPPOSE)
- Shared claims on member paths: C02, C04
- Why grouped and distinctions retained: Common endpoint: whether essential money held in stablecoins keeps its value. Safeguard versus exposure is preserved: SUPPORT_01 (C04 backing and reuse limits) protects people who already hold coins against under-backed issuance; OPPOSE_01 (C02 household substitution) concerns people who move money out of insured accounts, with two local loss routes (uninsured-deposit reserves; repo collateral seized by a lender). The populations overlap but are not identical, and a reviewer may accept both effects.

### S1582_UNC_I02 · When an issuer fails

- Members: `S1582_UNC_support_04` (SUPPORT); `S1582_UNC_oppose_02` (OPPOSE); `S1582_UNC_oppose_08` (OPPOSE)
- Shared claims on member paths: C02, C05, C06, C07, C08
- Why grouped and distinctions retained: Common event and endpoint: who is protected, and how quickly, when an issuer or custodian fails. SUPPORT_04 has four routes (C07 custody, C05 reserve priority, C06 shortfall priority, local regulator standing). OPPOSE_02 concerns timing for holders (C02 and C08 pause). OPPOSE_08 concerns a different population, workers with wage claims, harmed by the same C06 priority that SUPPORT_04 relies on. These are distinct effects of one set of failure rules; OPPOSE_08 is an independent cost to another group, not a rebuttal of the holder benefit.

### S1582_UNC_I03 · Cashing out and fees

- Members: `S1582_UNC_support_02` (SUPPORT); `S1582_UNC_oppose_06` (OPPOSE)
- Shared claims on member paths: C02
- Why grouped and distinctions retained: Common endpoint: ordinary holders' ability to turn coins into money promptly and affordably. SUPPORT_02 has two local routes (regulator-only discretionary limits; 7-day fee notice), and its response limits them to direct issuer redemption. OPPOSE_06 (C02) concerns small holders reached by wider use, with no fee cap, no equal-terms rule and intermediated access. Direct-issuer protection versus secondary-market exposure is recorded as a real distinction.

### S1582_UNC_I04 · Accurate information and fraud enforcement

- Members: `S1582_UNC_support_03` (SUPPORT); `S1582_UNC_oppose_04` (OPPOSE)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Common endpoint: protection of customers against misleading claims about reserves and safety. SUPPORT_03 has two local routes (audited monthly reports with executive certification; marketing ban). OPPOSE_04 is local: Section 17 removes permitted coins from the CFTC's commodity-fraud reach, with the Tether reserve case as precedent; its response cites the bill's replacement duties. Distinct mechanisms (new duties versus removed enforcement route) are kept, and the two do not answer each other directly.

### S1582_UNC_I05 · Official checks before issuers serve the public

- Members: `S1582_UNC_support_06` (SUPPORT); `S1582_UNC_oppose_05` (OPPOSE)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Common endpoint: official vetting of issuers before and while they serve the public. SUPPORT_06 has three local routes (conviction bar, licensing review of managers, correction and enforcement powers). OPPOSE_05 is local and joins deemed approval with state preemption. OPPOSE_05 bears directly on SUPPORT_06's licensing-review route but not on its conviction bar or enforcement powers; that partial overlap is recorded rather than treated as a full rebuttal.

### S1582_UNC_I06 · Theft, payment failures and remedies

- Members: `S1582_UNC_support_05` (SUPPORT); `S1582_UNC_oppose_03` (OPPOSE)
- Shared claims on member paths: C02, C25
- Why grouped and distinctions retained: Common endpoint: users' losses from theft, unauthorized transfers and payment errors. Safeguard versus exposure is preserved: SUPPORT_05 concerns prevention (local Section 4 IT standards); OPPOSE_03 concerns remedies after loss (C02 plus C25 or local omissions), with a response about rights under other law. Prevention and remedy are distinct mechanisms; a reviewer may accept both.

### S1582_UNC_I07 · Criminal funds and their victims

- Members: `S1582_UNC_support_08` (SUPPORT)
- Shared claims on member paths: C13, C14, C18
- Why grouped and distinctions retained: Single SUPPORT argument: victims' recovery and justice through freezing (C13, C14) and detection (C18). Its endpoint, recovery for crime victims, is not addressed by any OPPOSE argument for this value. Kept apart from the information and vetting issues because the beneficiaries are victims of third-party crime, not customers dealing with an issuer.

### S1582_UNC_I08 · Risks to people who never use stablecoins

- Members: `S1582_UNC_support_07` (SUPPORT); `S1582_UNC_oppose_10` (OPPOSE)
- Shared claims on member paths: C01, C09, C10
- Why grouped and distinctions retained: Common endpoint and population: spillover harm to non-users' pensions, savings, jobs, loans and taxes. SUPPORT_07 (C10 plus local examination and diversification rules) is a safeguard. OPPOSE_10 is an exposure from added scale with three routes, all needing C01: bank withdrawals (C09 and C10), forced asset sales (C10) and pressure for a public rescue (C01 only). SUPPORT_07 and OPPOSE_10's first two routes rely on C10's reach to non-users and differ on whether the bill reduces or enlarges that risk. The rescue route reaches taxpayers without C10, a population SUPPORT_07 does not address.

### S1582_UNC_I09 · Public income for shared needs

- Members: `S1582_UNC_oppose_15` (OPPOSE); `S1582_UNC_oppose_16` (OPPOSE)
- Shared claims on member paths: C01
- Why grouped and distinctions retained: Common endpoint: public resources available for shared needs. Distinct mechanisms kept: OPPOSE_15 is seigniorage shifting to issuers in the U.S. and abroad (needs C01); OPPOSE_16 is the CBO-estimated oversight cost borne by the Treasury (local, needs no added use), with a response that non-users also benefit from that oversight. No SUPPORT argument for this value claims a public-revenue gain.

### S1582_UNC_I10 · Lending in poor and rural communities

- Members: `S1582_UNC_support_13` (SUPPORT); `S1582_UNC_oppose_09` (OPPOSE)
- Shared claims on member paths: C01, **C11** (judged), C12
- Why grouped and distinctions retained: Common endpoint: deposit funding for loans in poor and rural communities. SUPPORT_13 uses C12 (removing one incentive); OPPOSE_09 uses C01 and the judged C11 (growth reduces local deposit funding). The arguments are not mirror images: one concerns a single incentive removed, the other a net outflow from growth. Evidence notes about exchange rewards and the size of deposit effects bear on both.

### S1582_UNC_I11 · Interest earnings for direct holders

- Members: `S1582_UNC_oppose_07` (OPPOSE)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Single OPPOSE argument. It uses the same interest-ban text as SUPPORT_13, but its endpoint is fairness between issuers and their direct customers, not community lending, and it does not depend on C12. Grouping it with the lending issue would join different endpoints only because they share a provision.

### S1582_UNC_I12 · Tied products and pressure from platforms

- Members: `S1582_UNC_support_09` (SUPPORT); `S1582_UNC_oppose_11` (OPPOSE)
- Shared claims on member paths: C21, C22
- Why grouped and distinctions retained: Common endpoint: unfair pressure through tied products and switching costs. SUPPORT_09 is the local tying ban protecting customers. OPPOSE_11 (C21, C22) concerns sellers and workers dependent on commercial platforms and argues the ban is narrower than bank tying rules and misses affiliates outside the covered public-company route. Populations differ (customers versus dependent sellers and workers), and OPPOSE_11 itself limits its scope.

### S1582_UNC_I13 · Commercial use of payment data

- Members: `S1582_UNC_support_10` (SUPPORT); `S1582_UNC_oppose_12` (OPPOSE)
- Shared claims on member paths: C20, C21
- Why grouped and distinctions retained: Common endpoint: commercial firms' use of customers' private payment data. SUPPORT_10 (C20) concerns covered public companies and a consent requirement; OPPOSE_12 (C21) concerns the wider commercial route and price steering, treating the consent exception as weak. The covered-company scope and the step from FTC search data to stablecoin data are recorded distinctions.

### S1582_UNC_I14 · Opportunity for new payment providers

- Members: `S1582_UNC_support_11` (SUPPORT)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Single SUPPORT argument about entry for new providers and the migrant families and small firms they serve. Kept apart from SUPPORT_12 because the mechanism (state preemption lowering entry cost) and the response position (no point-specific response) differ from procedural fairness. OPPOSE_05 uses the same preemption text but concerns safety vetting, so it sits with the vetting issue.

### S1582_UNC_I15 · Fair process for license applicants

- Members: `S1582_UNC_support_12` (SUPPORT)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Single SUPPORT argument about procedural fairness toward applicants. Its response and gap concern comparison with prior law (the bill creates the permission it then constrains). Kept apart from SUPPORT_11 because it is about how officials decide, not the cost of entry.

### S1582_UNC_I16 · The President's family stablecoin business

- Members: `S1582_UNC_oppose_13` (OPPOSE)
- Shared claims on member paths: C24
- Why grouped and distinctions retained: Single OPPOSE argument about just treatment and privileged access, via C24 (which itself requires C01). No other argument for this value concerns officials' financial conflicts.

### S1582_UNC_I17 · Financial stability abroad

- Members: `S1582_UNC_oppose_14` (OPPOSE)
- Shared claims on member paths: C01
- Why grouped and distinctions retained: Single OPPOSE argument about people in weaker foreign economies (C01). SUPPORT_01 mentions dollar coins helping people facing unstable currencies, but its mechanism is backing, so it stays with the money-safety issue; that relation is recorded in REVIEW.md.

## UNT · Universalism – Tolerance

### S1582_UNT_I01 · Payment exclusion of disfavored groups

- Members: `S1582_UNT_support_02` (SUPPORT); `S1582_UNT_oppose_01` (OPPOSE)
- Shared claims on member paths: C04, C05, C17
- Why grouped and distinctions retained: Common endpoint and overlapping population: people refused payment services because of their religion, ethnicity or views (SUPPORT_02's EFF examples include payments associated with Islam or Arab ethnicity; OPPOSE_01 concerns Muslim, Arab, Middle Eastern and South Asian Americans). SUPPORT_02 runs through C04 or C05 protecting funds on open networks, with a recorded tolerance-link gap; OPPOSE_01 runs through C17 and de-risking incentives. Opposite mechanisms acting on the same exclusion risk.

### S1582_UNT_I02 · Access for people whose lives or documents differ

- Members: `S1582_UNT_support_03` (SUPPORT); `S1582_UNT_oppose_02` (OPPOSE)
- Shared claims on member paths: C04, C05, C17
- Why grouped and distinctions retained: Common endpoint: access to payment services for people outside usual banking patterns. Populations overlap (refugees and displaced people) but OPPOSE_02 also names Indigenous ID holders, transgender and nonbinary people and people leaving prison. SUPPORT_03 runs through C04, C05 or local fee disclosure, with a recorded tolerance-link gap; OPPOSE_02 runs through C17 and is limited by its own text to issuers that do not adopt alternative verification.

### S1582_UNT_I03 · Exposure of beliefs and group ties

- Members: `S1582_UNT_support_04` (SUPPORT); `S1582_UNT_oppose_03` (OPPOSE)
- Shared claims on member paths: C17, **C19** (judged), C20
- Why grouped and distinctions retained: Common endpoint: exposure of beliefs and associations through payment records. Distinct mechanisms kept: SUPPORT_04 (C20) limits commercial advertising, sale and sharing by covered public companies; OPPOSE_03 (C17 and the judged C19) concerns compliance monitoring reaching beyond issuers' own dealings. Commercial exposure and monitoring exposure are different routes; SUPPORT_04's evidence note states it does not cover government access.

### S1582_UNT_I04 · Payment blocking and disputed judicial work

- Members: `S1582_UNT_oppose_04` (OPPOSE)
- Shared claims on member paths: C13, C14
- Why grouped and distinctions retained: Single OPPOSE argument about state sanctions enforcement (C13 or C14) against people over disputed judicial work. Kept apart from OPPOSE_01, whose exclusion comes from private de-risking of religious and ethnic communities rather than government orders, and with a recorded tolerance-link gap.

### S1582_UNT_I05 · Hearing applicants who challenge a refusal

- Members: `S1582_UNT_support_01` (SUPPORT)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Single SUPPORT argument about a hearing for refused applicants (local), with a recorded tolerance-link gap. No other argument for this value concerns licensing procedure.

## SEP · Security – Personal

### S1582_SEP_I01 · Scam losses and mental health

- Members: `S1582_SEP_support_04` (SUPPORT); `S1582_SEP_oppose_03` (OPPOSE)
- Shared claims on member paths: C02, C13, C14, **C19** (judged), C25
- Why grouped and distinctions retained: Common endpoint: mental-health harm from fraud losses. SUPPORT_04 runs through freezing (C13, C14) or the judged C19 tracing route; OPPOSE_03 runs through C02 and C25, with a recorded gap from issuer approval to belief in fake apps. Prevention of scams versus added exposure to them are opposite mechanisms acting on the same harm.

### S1582_SEP_I02 · Household money needed for medical care

- Members: `S1582_SEP_oppose_01` (OPPOSE); `S1582_SEP_oppose_02` (OPPOSE)
- Shared claims on member paths: C02, C08, C23, C28
- Why grouped and distinctions retained: Common endpoint and population: households that hold payment money in stablecoins and need it for care. Distinct mechanisms kept: OPPOSE_01 is issuer-side (secondary-market price, C08 pause), OPPOSE_02 is network-side (C23 outage, C28 attack incentive). Both require C02. No SUPPORT argument for this value addresses protection of held funds.

### S1582_SEP_I03 · Financial shocks and the health of people who never use crypto

- Members: `S1582_SEP_oppose_04` (OPPOSE)
- Shared claims on member paths: C01, C09, C10
- Why grouped and distinctions retained: Single OPPOSE argument (C01, C09, C10) about non-users. Kept apart from the household-money issue to preserve the different population (non-users reached through banks versus holders).

### S1582_SEP_I04 · Fentanyl poisoning

- Members: `S1582_SEP_support_01` (SUPPORT)
- Shared claims on member paths: C13, C14, C18
- Why grouped and distinctions retained: Single SUPPORT argument (C13, C14 freezing; C18 identification). The crime-disruption arguments for this value share freezing and tracing tools but have distinct crimes, evidence and endpoints (poisoning, hospital disruption, terrorist violence, coercion and suicide), and each has its own local gap; they are not merged.

### S1582_SEP_I05 · Ransomware and hospital care

- Members: `S1582_SEP_support_02` (SUPPORT)
- Shared claims on member paths: C13, C14, **C19** (judged)
- Why grouped and distinctions retained: Single SUPPORT argument (C13, C14 freezing; judged C19 tracing). Distinct endpoint: disruption of hospital and emergency services by ransomware. Not grouped with the household medical-money issue, which concerns access to personal funds rather than the operation of care services.

### S1582_SEP_I06 · Terrorist violence

- Members: `S1582_SEP_support_03` (SUPPORT)
- Shared claims on member paths: C13, C14
- Why grouped and distinctions retained: Single SUPPORT argument (C14 or C13). Its recorded gap concerns whether frozen overseas funds pay for attacks in the United States, a step specific to this endpoint.

### S1582_SEP_I07 · Sexual blackmail

- Members: `S1582_SEP_support_05` (SUPPORT)
- Shared claims on member paths: C13, C14, C18, **C19** (judged)
- Why grouped and distinctions retained: Single SUPPORT argument (C13, C14 freezing; judged C19 and C18 identification). Kept apart from the scam issue: the crime is coercion with intimate images and its endpoint includes suicide risk, and the investment-scam pair has its own OPPOSE counterpart that does not address blackmail.

## SES · Security – Societal

### S1582_SES_I01 · Funding for terrorists, cartels and sanctions evaders

- Members: `S1582_SES_support_01` (SUPPORT); `S1582_SES_support_09` (SUPPORT); `S1582_SES_oppose_01` (OPPOSE)
- Shared claims on member paths: C01, C13, C14, C18, **C19** (judged)
- Why grouped and distinctions retained: Common endpoint: the state's ability to detect and stop threat financing and enforce sanctions. SUPPORT_01 has five routes (C13, C14, C18, judged C19, local licensing screens). SUPPORT_09 (C01) argues that regulated dollar use keeps finance within U.S. reach. OPPOSE_01 (C01) argues that added use expands transfers beyond identity checks and overloads request-based freezing. SUPPORT_09's response makes OPPOSE_01's point, so the three are read together; the distinct mechanisms (tools, currency reach, channel growth) are retained.

### S1582_SES_I02 · Runs, failures and wider financial stress

- Members: `S1582_SES_support_02` (SUPPORT); `S1582_SES_support_03` (SUPPORT); `S1582_SES_support_05` (SUPPORT); `S1582_SES_oppose_04` (OPPOSE)
- Shared claims on member paths: C01, C02, C04, C05, C06, C07, C08, C09
- Why grouped and distinctions retained: Common endpoint: national financial stability, meaning whether stablecoin runs or failures become wider crisis and payment disruption. Distinct safeguards kept: SUPPORT_02 (C04 plus local reserve and oversight routes) targets run causes; SUPPORT_03 (C07, C05, C06, local court route) targets disruption after failure; SUPPORT_05 (local committee gate and activity limits) targets spread from commercial groups. OPPOSE_04 has four routes (C01 with C09; borrowing costs; C02 with C08 freeze; rescue pressure). This is the broadest issue in the map; it is kept together because OPPOSE_04's routes answer the same stability endpoint that each SUPPORT member addresses, and splitting it would leave OPPOSE_04 paired with only one safeguard.

### S1582_SES_I03 · State supervision with national reach

- Members: `S1582_SES_oppose_06` (OPPOSE)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Single OPPOSE argument (local) about the capacity of state supervision once it has national reach. SUPPORT_02's oversight route mentions state certification and emergency federal action, but SUPPORT_02 is placed with the broader stability issue where most of its routes apply; the overlap is recorded in REVIEW.md.

### S1582_SES_I04 · Technical failures and network attacks

- Members: `S1582_SES_support_04` (SUPPORT); `S1582_SES_oppose_03` (OPPOSE)
- Shared claims on member paths: C02, C23, C28
- Why grouped and distinctions retained: Common endpoint: interruption of payments by technical failure or attack. SUPPORT_04 (local IT standards) concerns issuer-level defenses; OPPOSE_03 (C02 with C23 or C28) concerns shared networks outside the issuer's control. SUPPORT_04's response limits it to issuer systems, which is the distinction between the two.

### S1582_SES_I05 · Concentrated private control of payments

- Members: `S1582_SES_support_06` (SUPPORT); `S1582_SES_oppose_08` (OPPOSE)
- Shared claims on member paths: C21, C22
- Why grouped and distinctions retained: Common endpoint: concentration of control over payments by private firms. Both rely on C22; SUPPORT_06 adds the tying ban and Section 12 standards power, OPPOSE_08 adds C21 (a more usable commercial route, including privately held firms).

### S1582_SES_I06 · Bank funding for lending

- Members: `S1582_SES_support_07` (SUPPORT); `S1582_SES_oppose_05` (OPPOSE)
- Shared claims on member paths: C01, **C11** (judged), C12
- Why grouped and distinctions retained: Common endpoint: bank deposit funding for lending, and through it economic stability. SUPPORT_07 uses C12; OPPOSE_05 uses C01 and the judged C11, and cites exchange rewards outside the ban. One concerns an incentive removed, the other a net outflow from growth.

### S1582_SES_I07 · Government borrowing costs

- Members: `S1582_SES_support_10` (SUPPORT)
- Shared claims on member paths: C01
- Why grouped and distinctions retained: Single SUPPORT argument (C01). OPPOSE_04's second route (outflows raising Treasury yields) touches the same endpoint, but OPPOSE_04 is placed with the stability issue, where all four of its routes apply; the relation is recorded in REVIEW.md.

### S1582_SES_I08 · Keeping payment-technology capacity at home

- Members: `S1582_SES_support_08` (SUPPORT)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Single SUPPORT argument (local route; recorded gap: no direct evidence that the bill keeps firms or expertise from moving abroad). Its endpoint is domestic capacity to build and oversee payment technology. An earlier draft paired it with OPPOSE_02; independent scope review found that 'control of payment infrastructure' was an umbrella, not a shared concrete endpoint, because retaining domestic expertise differs from screening foreign issuers for hidden adversarial ownership. The two are therefore separate one-sided issues (see S1582_SES_I10).

### S1582_SES_I09 · Foreign interests and the President's business

- Members: `S1582_SES_oppose_09` (OPPOSE)
- Shared claims on member paths: C24
- Why grouped and distinctions retained: Single OPPOSE argument (C24). Kept apart from OPPOSE_02 because the mechanism is a personal financial conflict at the top of government, not foreign control of issuers.

### S1582_SES_I10 · Hidden foreign control of foreign issuers

- Members: `S1582_SES_oppose_02` (OPPOSE)
- Shared claims on member paths: C01
- Why grouped and distinctions retained: Single OPPOSE argument (C01). Endpoint: adversary influence through unscreened ownership or control of foreign issuers. Kept apart from SUPPORT_08 (domestic capacity; see S1582_SES_I08) and from OPPOSE_09 (a personal financial conflict at the top of government). Numbered I10 so that no existing issue ID changes.

## TR · Tradition

### S1582_TR_I01 · Church giving through stablecoins

- Members: `S1582_TR_support_02` (SUPPORT); `S1582_TR_oppose_02` (OPPOSE)
- Shared claims on member paths: C01, C04, C05, C07, C17
- Why grouped and distinctions retained: Common endpoint: the inherited practice of church giving. Distinct mechanisms kept: SUPPORT_02 concerns the financial safety of gifts held in approved coins (C04, C05, C07; gap on holding time); OPPOSE_02 concerns privacy of giving (C01, C17), with a gap on whether the bill moves church gifts onto a traceable record. Safety and confidentiality are different effects on the same practice.

### S1582_TR_I02 · Payments to online betting businesses

- Members: `S1582_TR_oppose_03` (OPPOSE)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Single OPPOSE argument (local). It shares Segpay evidence with OPPOSE_04 but has a distinct moral rule and a response that reaches gambling only; the mapping already keeps the two apart for that reason.

### S1582_TR_I03 · Payments to pornography businesses

- Members: `S1582_TR_oppose_04` (OPPOSE)
- Shared claims on member paths: none (local paths only)
- Why grouped and distinctions retained: Single OPPOSE argument (local), with no point-specific response and a recorded gap on inherited continuity. Kept apart from OPPOSE_03 for the reasons given there.

### S1582_TR_I04 · Lending to churches and ministries

- Members: `S1582_TR_oppose_07` (OPPOSE)
- Shared claims on member paths: C01, **C11** (judged)
- Why grouped and distinctions retained: Single OPPOSE argument (C01 and the judged C11) about deposit-funded ministry lending. No SUPPORT argument for this value addresses church lending.
