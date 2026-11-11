# H.R.1834 guided-decision package: editorial review

Author: Opus editorial author. Built only from the frozen `input/source.json`; no outside source was read and no fact was checked anew. `author.py` (with `author_lib.py`) is the maintained generator. It copies every citation link from the frozen field it names, and every quotation is checked as an exact substring of that field.

## Shape

- 5 contexts, not asked: the larger credits restored through 2028 (C01, C03), help above four times the poverty line (C02, C13), abortion coverage rules (C20), objecting buyers in requiring states (C21) and health care sharing ministries (C22). Their scope limits are qualification blocks shown beside every decision that relies on the context, so that coverage can bind them to decisions.
- 55 causal claims, 53 value links, 160 blocks (158 before the November 10, 2026 amendment below). All 78 arguments, 19 responses (all retained) and 97 qualifications are placed in `coverage.json`.

## Causal claims

Each prediction about what the bill would do is asked. Roots are coverage (C04), enrollment (C05), job-based coverage (C06), lower treatment bills (C12), replacement coverage (C14), unauthorized enrollment (C15, disputed) and added debt (C16). The other roots are claims that arguments need and that no ledger claim supplied: farm survival, clean-energy businesses, lower cost of nature work, less hardship, less distress, household spending, state budgets, mothers at home and church strain.

| Causal claim | Requires |
|---|---|
| More people insured | — |
| Newly insured people use more care | More people insured |
| Added care adds energy, supply and waste demand | Newly insured people use more care |
| Added climate pollution | Added care adds energy, supply and waste demand |
| Added acid-forming pollution | Added care adds energy, supply and waste demand |
| Added smog-forming pollution | Added care adds energy, supply and waste demand |
| Added nutrient pollution | Added care adds energy, supply and waste demand |
| Added drug pollution | Added care adds energy, supply and waste demand |
| Added toxic chemical pollution | Added care adds energy, supply and waste demand |
| Added lasting plastic waste | Added care adds energy, supply and waste demand |
| Added water demand | Added care adds energy, supply and waste demand |
| Added mining demand | Added care adds energy, supply and waste demand |
| Added ozone-layer risk from nitrous oxide | Added care adds energy, supply and waste demand |
| Farm families helped to stay on the land | — |
| Conservation farming continues | Farm families helped to stay on the land |
| Clean-energy businesses kept going | — |
| Lower personal cost of nature work | — |
| Avoided pollution from kidney failure | More people insured |
| Avoided extra driving pollution | Less pressure to cut local health services |
| Less pressure to cut local health services | More people insured |
| Health-care jobs and local revenue protected | Less pressure to cut local health services |
| Net national gain from protected health-care jobs and revenue | Health-care jobs and local revenue protected |
| Easier replacement coverage after job loss | — |
| Plans with lower treatment bills chosen | — |
| Smaller racial gaps in coverage | More people insured |
| More Marketplace enrollment | — |
| Lower full insurance prices | More Marketplace enrollment |
| Less risk of lost plan choices | More Marketplace enrollment |
| Added risk of unauthorized enrollment | — |
| Fewer people with job-based coverage | — |
| Covered access to a doctor lost | Fewer people with job-based coverage |
| Added federal debt | — |
| Added pressure on emergency borrowing | Added federal debt |
| Less private investment | Added federal debt |
| Added fiscal-crisis risk | Added federal debt |
| Health-center language and cultural services sustained | Less pressure to cut local health services |
| Religiously exempt job plans lost | Fewer people with job-based coverage |
| Job coverage of religiously required care lost | Fewer people with job-based coverage |
| Job coverage of transition care lost | Fewer people with job-based coverage |
| Less hardship over food, heat and housing | — |
| Less financial distress | — |
| Higher treatment costs after leaving job plans | Fewer people with job-based coverage |
| Lost dental protection | Fewer people with job-based coverage |
| Stronger control of contagious disease | Newly insured people use more care |
| Hospital disaster capacity preserved | Less pressure to cut local health services |
| Stronger response to the opioid crisis | Newly insured people use more care |
| Workforce kept healthier | Newly insured people use more care |
| Household spending supports economic stability | — |
| Less pressure on state budgets | — |
| Health protection kept through downturns | Easier replacement coverage after job loss OR Lower full insurance prices |
| Weaker financial tools of U.S. influence | Added federal debt |
| Interest paid abroad | Added federal debt |
| Easier for one-wage families to keep a mother at home | — |
| Less strain on churches and church giving | — |
| Christian health ministries under less strain | Less pressure to cut local health services |
Narrower populations and changes of scale get their own claims. Examples: kidney-failure pollution from coverage, outbreak control from care, hospital disaster capacity from provider finances, and U.S. financial influence from debt.

Value links that rest on the provision itself (no causal question) cover these arguments: UNC_support_02, the pay-gap part of UNC_support_04, UNC_support_05, UNC_support_06, UNC_oppose_01, the repayment part of UNC_oppose_02, UNC_oppose_07, UNT_support_03, the buyer part of UNT_oppose_01, UNT_oppose_02, UNT_oppose_03, the cliff part of SEP_support_05, the money-at-stake part of SES_oppose_06, TR_support_04 and TR_oppose_01–04, 06–09. These are cases where the argument relies only on what the bill text does to prices, eligibility or payments.

## Consolidation and splitting

Under the consolidation rule, a value link is merged with OR routes when two arguments make the same, precisely scoped value connection in the same value and direction. Each route keeps its own causal claim, evidence, challenges and limits. Merged wording lists the alternatives and states that each needs its own claim, so the link does not assert a rejected alternative.

- Nature, oppose: the ten pollution routes (UNN_oppose_01–10) share one link, scoped as a marginal added effect.
- Nature, support: conservation farming, clean-energy businesses and habitat work or volunteering (UNN_support_01–04) share one link about nature-protecting work. The kidney-failure and driving routes (UNN_support_05–06) share one link about avoided pollution. These two links stay separate because one judges sustaining nature-protecting work and the other judges pollution avoided by care.
- Concern: care for people who would otherwise go without, through coverage or lower bills (UNC_support_01 care part, UNC_support_03), is one link. The three debt harms (UNC_oppose_04–06) are one link about people bearing debt costs. Lower prices or more insurers (UNC_support_07) form one link.
- Personal Security: care within reach through coverage or lower bills (SEP_support_01–02) is one link. So is financial strain, whether hardship over essentials or distress (SEP_support_03–04), and so is the market, whether prices or plan choices (SEP_support_06–07). Doctor, treatment-cost and dental loss after leaving job plans (SEP_oppose_02–04) share one link.
- Societal Security: disease, disaster and drug threats (SES_support_01–03) share one link. Workforce, jobs and revenue, household spending and downturn protection (SES_support_04–06, 08) share one economic-stability link. The five debt routes (SES_oppose_01–05) share one link, and organized and hidden fraud (SES_oppose_06 fraud part, SES_oppose_07) share one, because they rest on the same fraud claim.
- Kept distinct because the value connection differs: state fiscal capacity (SES_support_07) differs from economic stability; local services (UNC_support_08) differ from health-care jobs and revenue; fraud-interrupted care (SEP_oppose_01) is about victims of unauthorized changes, not people leaving job plans. A provision route (no causal question) may share a link with a causal route when the value connection is the same: the scheduler still asks each unresolved causal alternative, so nothing goes unjudged. Links were not split merely because one route is provision-based. Tradition and Tolerance links each rest on a distinct teaching or practice.
- Split because one part needed a claim the other did not: UNC_support_01 (care vs. protection from bills), UNC_support_04 (racial gaps vs. pay gap), UNC_support_08 (services vs. jobs and revenue), UNC_oppose_02 (broker abuse vs. repayment), UNT_oppose_01 (buyers vs. exempt job plans), SES_oppose_06 (fraud vs. money at stake).
- Shared claims: farm survival (UNN_support_01, TR_support_08); local health services (seven arguments); jobs and revenue (UNC_support_08, SES_support_05); debt children shared across Concern and Societal Security.

## Sensitive choices

- The disputed fraud claim (C15) is asked once, and the challenges from C15, UNC_oppose_02, SEP_oppose_01, SES_oppose_06 and SES_oppose_07 are combined into one challenge beside it. Each argument-specific point is kept: the paused income check, new applicants, the 2025 plan changes, free silver versus free bronze plans, and harder-to-notice enrollment. The complaint-period and money-at-stake points stay at the Societal Security links they dispute.
- Debt claims are scoped as a small added contribution to CBO's total-debt warnings, not separate forecasts. The CBO estimate, CRFB projection and crisis-probability limits sit at the debt claim.
- The pollution routes keep every local limit: average-per-dollar footprints, hospitals running continuously, the scope of the Oregon study, soil buffering, neutral or positive coastal nitrogen, and the nitrous-oxide purchase data. The toxic, plastic and water responses stay at their claims.
- SEP_support_04's distress study is challenged at its claim: the study does not separate the premium rules from the 2021 unemployment cost-sharing expansion.
- The Marketplace-condition note sits beside the Personal Security support links whose source notes include it.
- Legal and program facts are dated context as of January 8, 2026. No later updating was done.

## Audit corrections (HR1834-AUDIT-01 to 05)

- 01: SEP_support_05's job-loss and income-cliff routes now share one Personal Security link about keeping coverage through changes in work or income. The routes are the job-loss claim OR the provision; both limits are kept. The earlier blanket rule against mixing provision and causal routes was wrong and has been corrected above.
- 02: The fraud challenge now includes the separate safeguard from SEP_oppose_01's response: from 2028, existing law “requires people to actively affirm their eligibility to enroll in marketplace coverage and to claim the premium tax credit when they apply for that insurance.” The limits on which allegations the responses answer are unchanged.
- 03: The shared Concern note was split. The CBO timing and baseline note sits at the coverage and enrollment claims. The IRS mortality-study limit sits beside the mortality evidence at the Concern care link, and the California enrollment-trial result sits at the lower-treatment-bills claim. The note no longer repeats beside the cliff, tax-parity, pay-gap, basic-needs or bills questions.
- 04: Every qualification row now credits every block that keeps part of its field. Identical shared notes are credited together. The listed additions include the hospital forecast baseline, the 98% free-bronze point, network, job-coverage and deductible limits, the addiction-study limits, and the debt limits for C17 and C18.
- 05: The local jobs-and-revenue claim no longer carries the national dispute. A new claim, the net national gain from protected health-care jobs and revenue, follows from the local claim. It holds SES_support_05's response, which disputes national net gains and leaves provider payments open. UNC_support_08's local Concern route does not pass through it. The workforce claim now includes its national production step, as the spending and downturn claims already did. The Societal Security economy link carries only a route-neutral bridge; route limits stay at their claims.

## Checks run

- Runtime builder (`runtime/build.mjs` `buildBill`) built the package without error, including its HTML, citation, quotation, coverage, parity and path checks. Path counts: all Yes gives 108 decisions (114 judgments). All causal No gives 38 decisions, with 70 set aside. A No on coverage sets aside 33; a No on job-based coverage sets aside 11; a No on debt sets aside 7.
- Generator self-checks: unique prefixed IDs, no cycles, every block used, routes require only causal nodes, argument reciprocity, and every retained response and qualification bound to a decision that shows its block.
- Manual pass: every merged value link was checked so that its wording names the alternatives without asserting a rejected one, and value links were checked for factual content that a separate causal claim judges (one phrase in the Concern care link was reworded).

## Definitions

On November 9, 2026, definitions were moved out of the reading text and into the glossary, which shows them on hover, focus or tap. 15 edits in 14 fields (3 contexts, 10 blocks and 1 claim) removed definitions of PTC, ESI, KFF, GHG, PV, health care sharing ministries, Medicaid, provider networks, cost sharing, uncompensated care, deficit-financed policy, marginal effects, criteria air pollutants and stand-level damage. One claim changed wording: the smog claim now says “ground-level ozone” without “(smog)”. 18 glossary entries were added. The premium entry reads “the price of health insurance”, because the evidence gives both monthly and yearly premiums. The displayed short description says “monthly premium” and “Affordable Care Act (ACA) Marketplaces” without glossing them; the frozen description is retained in `input/source.json`. The sentence noting that sources call the larger credits “enhanced” is kept because it tells readers how the evidence names them.

## Amendment, November 10, 2026: evidence restored after consolidation

The independent audit of November 10, 2026 (finding B5) found that consolidation had dropped evidence: 60 of 340 argument quotations and 15 of 66 response quotations in the frozen corpus were shown nowhere in the review. At the opioid claim, both supporting studies were missing while its limits still discussed "the Baltimore study" and "the emergency-department study". No route, claim, context or value link changed. The restored text comes only from the frozen arguments and responses; no new source was read. `author.py` was amended and regenerates both files.

What changed:

- Restored at the claims they support: the Baltimore and emergency-department studies and the community-resilience statement (opioid crisis); the abstract's own finding on distress, which had been paraphrased; uncompensated care (local health services); the terrorism planning (hospital disaster capacity); the reimbursement rule (health-center services); the farm workers who rely on individual coverage; the solar owners' 2014 account; the warming step (climate pollution); the dumping passage (plastic waste); the HHS commission passage, the no-monthly-bill reporting, the three-way-call exemption, the $5-charge status and the paused income check (unauthorized enrollment); the 27% and 20%-versus-13% network findings (doctor access); the deductible study's design and finding (treatment costs); the 37% dental finding and its health consequence; the Kansas exchange ban and its definition of "elective", and the self-funding exemption (Jewish-required care); the CRFB debt projection (fiscal crisis); the debt-service passage (emergency borrowing); the 60-day enrollment rule (downturns); and the California and Colorado subsidy shift (state budgets).
- Restored at value links: the veterans' enrollment finding (medical bills); the reconciliation passage (income cliff); the medication loss (broker abuse); the finding that some women cannot obtain an abortion without coverage (unborn children); the complaint count and the conviction's harm to care (organized fraud); the cost pressure and Focus on the Family's support for mothers at home; the bishops' farm-inheritance passage; the clinic's expected demand and the Catholic mission statement; the bishops' extension-with-a-limit request; Washington's funding to keep the benefit offered; the bishops' description of IVF; the credit's insurance-only scope and the Galatians reference (mutual aid); and the joint-return rule and both premium-share tables (marriage).
- Restored on the challenge side: WHO on sound waste management (toxic waste); a sentence answering the restored dumping passage (plastic); the GAO test's closed low-income signup route, the August 25, 2025 closure, the state-marketplace authentication point, the three-way call requirement, "In Effect For Open Enrollment (OE) 2026" and the change-in-circumstances qualifier (unauthorized enrollment); the fund-separation rule (Tolerance taxpayer link); the credit's insurance-only scope (Tolerance sharing link); the largest firms' hormone-therapy finding (transition care); and the excepted-benefits rule and the survey's dental-coverage caveat (dental).
- Evenness: the marriage-cost links now both show their worked example with the IRS table quotations. Before, only the opposing link did.
- New blocks: `SEPSERVICES_EV` (the "all members of their community" passage, at the Personal Security services link) and `CHURCH_WORSHIP_EV` (the Baptist worship passage, at the Tradition church link). `DOCTOR_LIM` no longer restates the 27% figure, which is now quoted in `DOCTOR_EV`, and the UNC_oppose_03 qualification row credits `DOCTOR_EV`. The `TRTAX_LIM` wording was adjusted so it does not repeat the bishops' request now quoted in `TRTAX_EV`. New glossary entries: SEP, OE, DMI, buprenorphine, ED, terra firma.

Fourteen quotations stay out on purpose, because each duplicates text already shown or bears on no decision:

- "These coverage losses" (UNN_support_06): a fragment naming a referent. The sentence it opens is shown through the same source at the local-services claim.
- "a specific plan, called a benchmark" (UNC_support_05) and "the mid-level Marketplace plan used to determine how much help people get with premiums" (SEP_support_06): definitions only. A glossary entry was not added, because "benchmark plan" also names Washington's state benefit plan in this bill.
- "the House-passed bill would increase the deficit by more than $80 billion" (UNC_oppose_04, 05, 06): duplicates CBO's 80,582 figure shown at the debt claim.
- "Extension of Rules To Increase Premium Assistance Amounts" (responses to UNT_oppose_01, SEP_support_04, SES_oppose_06): a bill section heading. The context already states what the bill extends.
- "This means that state and local governments will have more difficulties balancing their budgets…" (SES_support_05): the same public-services step, from the same jobs study chain, is quoted at the local jobs-and-revenue claim.
- "at least $1 per enrollee per month" and "deposit these separate payments into segregated accounts" (TR_oppose_03): duplicate the $1 minimum and separate-collection rule in the abortion-rules context shown at that link.
- "drop any numbers after the decimal point." (TR_oppose_09): a rounding instruction for the worked example.
- "the framework for intimate companionship, the channel of sexual expression according to biblical standards" (TR_oppose_09): the second clause of a definition of marriage whose first clause is shown. It bears on no cost step.

Counts, from `private/quote_survival.py` (Git-ignored; it applies the audit's own rule: a quotation of 20+ characters is "gone" when neither it nor any 25-character window of it appears in any context, block or claim):

| Group | Before: gone / total | After: gone / total |
|---|---|---|
| Support arguments | 26 / 162 | 4 / 162 |
| Oppose arguments | 34 / 178 | 7 / 178 |
| Responses | 15 / 66 | 3 / 66 |

The remaining 14 are exactly the exclusions above. Every added quotation is located by the generator as an exact plain-text substring of a named frozen field, and every added citation copies a frozen link-and-title pair from the same argument's reading.

## Limits

Which claims became questions, where limits sit and which value links were merged are editorial judgments for main and the independent verifier. Structural and quotation checks do not establish that any inference is valid or any prediction true. Human comprehension, reading time and workload were not tested.
