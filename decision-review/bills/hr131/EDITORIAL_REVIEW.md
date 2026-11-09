# H.R.131 guided review: editorial review

Built only from the frozen `input/source.json` (sha256 `b58fb3a4d382c1a50aff9e7a038ac706403aed0af4de9ac78c145f72f781b7e2`). No outside source was read and no fact was checked anew. This is a migration of the reviewed corpus, not a fresh inventory.

## Shape

- 2 contexts (not asked): the repayment terms the bill changes and their effect on the yearly burden if hardship is shown (C01, C02); incomes and the local economy in the service area (C11).
- 26 causal claims and 22 value claims covering all 32 original arguments, all 4 responses (all retained) and all 61 qualification obligations.
- 82 blocks, all used. Where several arguments or notes made the same point, they are consolidated into one self-contained block that keeps every distinct fact, quotation and citation once, with exact frozen anchors; other blocks copy single source paragraphs with only the old Point/Because/So and “Evidence note” labels removed. Claim and value-claim text is new.

## Which claims are questions

Root: easier repayment helps the later parts of the conduit get built (C03). The source called it uncontested context; it is asked because it is a prediction about what the bill would cause, and almost every consequence depends on it (a No sets aside 36 of 48 decisions). C02 (lower yearly burden if hardship is shown) stays context because it follows from the terms; its conditional wording is kept.

Every consequence a value claim needs is its own causal claim:

| Causal claim | Requires | Note |
|---|---|---|
| Cleaner water where the conduit reaches (C04) | Build | Now attributed to the bill through completion |
| Lower drinking-water health risks | Clean | Health effect; C05 facts and EPA statements shown |
| Less treatment waste in the river (C07) | Clean | Las Animas/La Junta limits and the eventual discharge end shown |
| Less need for bottled water (C08) | Clean | |
| Fewer bottles, less environmental burden | Bottled | National life-cycle study; separate effect |
| Less mineral damage to pipes and equipment (C06) | Clean | |
| Steadier supply incl. schools and hospitals (C09, C10) | Build | |
| Plants, weeds, wildlife, flows, salt, soil, spills, dust | Build | One claim each; modal “risk” wording kept |
| Dust irritating people nearby | Dust | Health effect split from the release of dust |
| Work-zone traffic hazards; noise hiding warnings | Build | |
| Risk to ancestral places and graves | Build | Survey coverage and second-half limits shown |
| Work and business during construction | Build | Who gets the jobs is unknown |
| Water barrier to local business removed | Clean | |
| Easier budgets for providers; less pressure on household bills | — | Each conditional on hardship; whether savings reach providers or bills is unsourced |
| Easier to keep living in valley towns | Bills, or Bottled | Two routes kept from the source |
| Less money for the federal government (C13) | — | C13 response shown |

## Routes kept

- Concern, safe water: lower health risk, less bottled water, or a steadier supply; any one is enough.
- Staying in valley towns (for the Tradition claim): household bills or bottled water.
- Concern relief and one-project limits rest on the provision itself (no causal claim).

## Consolidations

| Value claim | Arguments | What stays distinct |
|---|---|---|
| Nature: construction harms to land, wildlife, water and air | UNN_oppose_01–03, 06–08 | Six harms remain separate causal routes |
| Nature: lower flows and more salt in the river | UNN_oppose_04, 05 | Lasting operating effects, kept apart from temporary construction harms |
| Personal Security: construction dust, traffic and noise | SEP_oppose_01–03 | Three hazard routes |
| Societal Security: essential water service | SES_support_02–04 | Supply, provider budgets and equipment wear routes |

## Deduplication

Review found near-identical evidence and limits paragraphs repeated across arguments. Each repeated cluster is now one evidence block and, where needed, one limits or challenge block at the question it affects: the repayment and build step, cleaner water, health, river waste, bottled water, minerals, supply, dust, costs, incomes, and the Concern and Societal Security cost claims. Value claims with several routes are worded as alternatives, never as all of them together (Nature construction and river harms, Concern safe water, Personal Security hazards, Societal Security service).

Effect on the all-Yes path: 19,977 presented words before, 17,543 after; the largest decision is 1,211 words. Two short shared sentences remain between different questions.

## Sensitive choices

- The step from local outcomes to “a secure and stable United States” (river waste, viable towns) is treated as the value claim itself, with the source's own gap shown beside it, not as a further causal prediction.
- The cost claims rely on fungibility: public money used here cannot meet other needs. No source traces the cost to a water program, defense or emergencies; the gaps and responses say so beside each value claim.
- The household health effects of lower water bills (keeping water, food and medical care, less stress) are shown as value-local evidence on the Personal Security bills claim; whether savings reach bills at all is the causal claim.
- The Tradition claim keeps the source's explicit point that the custom, not water quality, connects it to Tradition, with both support gaps.

## Coverage and quotation checks

- Every argument maps to a value claim; argument IDs on nodes and in `coverage.json` agree.
- Every responses/qualifications ledger ID appears exactly once, with argument IDs and source references copied from the ledger. Each is either shown verbatim or declared as consolidated; `coverage.json` rationales say which (38 consolidated, 27 verbatim).
- Quotation survival check: every quoted passage of 20 or more characters in the frozen arguments, notes and responses appears in the placed text, except 4: three survive as shorter partial quotations of the same passage, and EPA's “toxic effects to the kidney” is carried by the EPA statement on “damage to the kidneys from exposure to the uranium itself” from the C05 field.
- 189 source references; each quotation is an exact plain-text substring of its named field. All 216 citation links copy a frozen href/title pair. The runtime validator accepts the package; `node --test runtime/*.test.mjs` passes 34 of 34.
- Paths (others Yes): all Yes answers 48 decisions; root No sets aside 36; Clean No sets aside 13; answering every causal claim No leaves 6 decisions answered (4 root causal claims and the 2 provision-based Concern claims) and 42 set aside.

## Limits

Which claims became questions and where limits sit are editorial judgments for independent verification. The checks above do not show that any inference is valid or any prediction true. Reading time and workload are untested.
