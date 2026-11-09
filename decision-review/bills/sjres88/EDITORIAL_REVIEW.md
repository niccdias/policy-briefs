# S.J.Res.88 guided review: editorial review

Built only from the frozen `input/source.json` (sha256 `55f8a9923ff6937837d6e8d3f646b338e3330dc9d73b4a2564de7d8b7551db3e`). No outside source was read and no fact was checked anew. This is a migration of the reviewed corpus, not a fresh inventory.

## Shape

- 5 contexts (not asked): what the bill ends (bill description, C01, C02); how Congress can end an emergency (C03); the order's power to raise these taxes (C04); the October 2025 trade deals (C08); tariff talks and the Thailand–Cambodia ceasefire (C10).
- 46 causal claims and 30 value claims covering all 69 original arguments, all 17 responses (all retained) and all 74 qualification obligations.
- 192 blocks, all used. Most copy single source paragraphs with only the old labels removed. Notes repeated across arguments with only their citation numbers changed are shown once (the 2026 Trade Policy Agenda note, the Malaysia ratification note, the earlier-tariff studies, the Black Book survey and the February 2026 China note). Claim and value-claim text is new.
- `[NAME]` substitutions keep each profile's scope: a response sentence on just treatment now reads “Concern for the just treatment of people”; the Tradition doll response names “a Christian parent” and “the Christian tradition the argument seeks to keep”; the marriage paragraph names “the Southern Baptist tradition”, whose faith statement it quotes.

## Which claims are questions

Ending the emergency and its taxes is the bill's text and is context (C01, C02). Root causal claims:

| Causal claim | Source | Children |
|---|---|---|
| Less cost pressure on households (C05) | C05 support and scope, with the price-stickiness notes merged | medicine, financial stress, church giving; also routes for the Concern families and Societal Security economy claims |
| Less uncertain future tariff rates (C11) | C11 support and scope; one consolidated replacement-authority challenge (Navarro, Lutnick, Bessent, the Section 122 bridge to Section 232 and its legal conditions) | hiring and safety work, investment (each keeps only its own part of its response); cleanup tools (second route) |
| One source of trade conflict removed | UNC_support_04, C04 scope | export sales, Brazilian habitats, resentment toward Asian Americans |
| China more likely to lower its retaliatory charge (C12) | C12 support, response and scope | export sales, Brazilian habitats |
| Less leverage for carrying out the signed deals (C09) | C09 and C08 scope; shared deal notes, including Greer's statement that deals would stick regardless of litigation | Nature, Concern, Tolerance and Societal Security deal claims |
| Less pressure on Thailand and Cambodia to keep the peace (C10 as context) | | Concern and Tolerance peace claims |
| Less price protection for U.S. factory work | TR_oppose_01 response with the earlier-tariff studies | marriage and provider roles, local congregations |
| Sector cost claims, each a root resting on the bill's text (C02) and its own forecast: clean power, cleanup tools, water systems (C06), recycling, clothing, small firms, hospital devices (C07), research, diet, alarms, helmets, safety gear, military suppliers, supply options outside China, cultural groceries, instruments, Christmas goods, teaching dolls, gift-box toys | | patient bills and hospital staff (under hospital devices); value claims |
| Medical-glove backup production; tariff shocks to financial markets (C04 as context); job insecurity and workers' health; military batteries; defense partners; EU climate rules; shipped gas; demand for goods from poor countries | | value claims only |

These routes follow the frozen paths. Only the five arguments that rely on household costs (C05) sit under the household claim. The sector claims, the glove claim, the markets claim and the worker-health claim each survive a No on the household, factory, uncertainty or small-firm claims; targeted traversals confirm it.

## Consolidations

| Value claim | Arguments | Routes kept |
|---|---|---|
| Nature: cheaper clean power, cleanup, water reuse or recycling | UNN_support_01–04 | four equipment routes |
| Nature: no tariff pressure against climate protection | UNN_support_06, 07 | EU rules; shipped gas |
| Nature, Concern, Tolerance: weaker pressure for the deals' promises | UNN_oppose_01–05; UNC_oppose_02–06; UNT_oppose_01–05, 07 | one leverage step, which each group's own note says the reasons share |
| Concern: livelihoods | UNC_support_02–04 | small firms; hiring; exports |
| Personal Security: medical care; everyday health; safety products | SEP_support_01–04, 07; 05, 06, 08, 10; 09, 11, 12 | each mechanism separately |
| Societal Security: defense; services; economy | SES_support_01–03; 04, 05; 06–08 | each mechanism separately |
| Societal Security: weaker defense supply and security cooperation | SES_oppose_01–05 | batteries; deal leverage |
| Tradition: worship music, Christmas customs and giving | TR_support_01, 02, 05 | instruments; Christmas goods; giving; toys |

Value claims with several routes are worded as alternatives (“each of these consequences you accepted… any one of them”). Where a parent claim is a reduced cost or a tool, the value claim judges that, not a realized improvement. Multi-route value claims carry only general facts or a premise shared by all routes, not a paragraph that asserts one route's consequence.

## Placement choices

- The earlier-tariff studies appear in the TR_oppose_01 response at the factory claim and in the SEP_oppose_01 response at the glove claim, because the two claims are independent.
- The C12 response sits at the China claim. The Brazil claim shows the soy-specific parts of the UNN_support_05 response; its Geneva and Section 301 points are part of the China challenge, which is always answered first. The Brazil value claim carries only the habitat premise, so it does not repeat the China forecast on the conflict-only route.
- The parents' duty to pass on the faith sits with the marriage claim, and the regular-giving premise sits with the congregation claim, so neither depends on an unrelated supporting branch.
- Notes that a response repeats word for word (glove maker, congregations, shipped-gas pledge, emergency-law standard) are shown once.

## Coverage and quotation checks

- Every argument maps to at least one value claim; argument IDs on nodes and in `coverage.json` agree.
- Every responses/qualifications ledger ID appears exactly once, with argument IDs and source references copied from the ledger. Each is shown verbatim or declared consolidated: 29 consolidated and 62 verbatim, as the rationales say. Rows credit every block that shows a full sentence of the obligation.
- Quotation survival check: every quoted passage of 20 or more characters in the frozen arguments, notes and responses appears in the placed text, except 6 that survive as shorter partial quotations of the same passage.
- 402 source references, each an exact plain-text substring of its named field; 461 citation links copy frozen href/title pairs. The runtime validator accepts the package. `auditBill`, run read-only, passes native, oracle and combined-No checks (44 cross-route pairs) with 0 quotation candidates.
- Paths (others Yes): all Yes answers 82 judgments, about 27,350 presented words, and the largest decision is 1,329 words. Answering every causal claim No leaves 37 decisions answered and 39 set aside. 19 short sentences are shared between different questions; most are the same bill or official quotation, plus the earlier-tariff studies at the two independent factory and glove claims.

## Limits

Which claims became questions and where limits sit are editorial judgments for independent verification. The checks do not show that any inference is valid or any prediction true. Reading time and workload are untested.
