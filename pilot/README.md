# Eight-bill coding workflow

Current coding URL: https://niccdias.github.io/policy-briefs/coding/

The combined frozen version is `eight-bills-20261107-4fcde0b566e0`: 503 active arguments, 24 disputed shared questions, 128 unvoted background items, 48 value summaries and 567 historical IDs. It combines `content.json` with `expansion/content.json` without changing any argument, response, dependency or evidence wording. Regenerate deterministically with `node assemble-all-bills.mjs`, then run `npm test` and `npm run build` before publication. The combined bank is `expansion/all-bills.json`.

On first use, the app copies this reviewer's authorized earlier responses of the same kind into one combined response. It verifies both source-content hashes, preserves each bill's internal randomized order, samples the eight-bill order once, and retains current versus stale judgment and comparison status. Unsent drafts are included only when they agree with the current server revision; a conflict stops import. Original sessions and immutable revisions are never rewritten. This is a one-time transfer, not ongoing synchronization between old and combined runs. Source versions and snapshot revisions remain in the private migration audit. Subsequent saves, progress and exports cover all eight bills together.

The existing Firebase project and assignment are reused. The coordinator enables the combined version alongside the earlier versions; account identifiers and answers remain outside GitHub. QA remains separate through `?qa=1`. Tests cover combined content fidelity, response transfer, current and stale states, AND/OR paths, saving, conflicts and reviewer isolation. Earlier routes remain available for recovery and link to the combined workflow.

Rollback: revert the unification commits after `ace4d8a695a3d4ae7ba1a3ee764f037a6630d5a4` and redeploy. Preserve every Firebase session and revision. Removing only the combined version from assignments suspends it without deleting old or new records.

## Preserved S.1582 pilot record

The sections below document the original pilot and its earlier verification; their pilot-only counts are historical.

Pilot: https://niccdias.github.io/policy-briefs/coding/s1582-pilot/

Google sign-in is required. An active private Firebase assignment must authorize this frozen version and session kind. The normal URL opens research coding; `?qa=1` opens a separate, clearly labeled QA session. No invitations are sent.

## Frozen content and history

Frozen authority/mapping version: `s1582-pilot-20261106-8f9bb0aef314`. Current procedure: `uncontested-context-20261107-v1`.

- 79 active arguments, all 85 historical IDs, six retired Tradition arguments.
- 25 historical shared-claim IDs: three judgment questions, 10 verified statutory provisions and 12 adequately supported unchallenged shared claims supplied as context. The preserved network has 109 direct argument-to-claim dependencies and four additional reporting-duty uses through C18 → C27; 130 supporting paths. Thirty arguments have alternative paths.
- Original bill version: Senate-engrossed text, June 17, 2025. Comparison: July 17, 2025 law. Evidence cutoff: July 17, 2026.
- All 47 distinct evidence-note IDs on active arguments are preserved. Thirty-five arguments retain the no-point-specific-CON status; that status does not establish the argument.

The authority is the final reviewed S.1582 release plus the November 5 Tradition amendment, frozen in `review/authority.json`. Its parent argument bank SHA-256 is `58ee0a8afb315d3eed218025a44b939bf127748045555a81a4cebf7a16d0bfe5`. The website base is `b4e514cbce8c41b19c2d22ccfa46303955812ab3`; existing briefs are unchanged.

`review/history_audit.json` records current rules, superseded rules and their sources, including the earlier unapproved network pilot. `review/mapping.json` preserves exact original passages, necessity rationales, AND/OR paths, classifications, notes and source links. `review/main_review.json` records main-agent inspection of every claim merge, dependency, path and substantive change. Original arguments remain accessible in the app. `review/statutory_background.json` audits all 25 classifications against the frozen bill, records the 10 provisions with source passages and scope, and declares two exact response relocations. The C05 pledged-collateral and C06 bankruptcy-funding quotations now sit with the arguments they challenge. The original mapping and authority are unchanged. `review/uncontested_context.json` records the subsequent main-agent audit of all 15 remaining questions, the 12 context classifications and their source qualifications. Only C03 (added Bitcoin mining), C11 (funding at affected local lenders) and C19 (secondary-market monitoring) retain a shared vote. The absence of a CON alone is not a support finding. No manuscript keys or coder responses were provided to the worker.

Opus 5.5 ran through the existing Claude subscription at native High effort, verified at start and end, without further delegation. All 394 staged inputs remained unchanged. The final mapping SHA-256 is `f47f3b086fea8ba2ef5c259b3a892105e32b47346b4ed61437872df25a44adbc`.

## Evidence placement

The November 7 `evidence-placement-20261107-v1` overlay separates source qualifications from magnitude and editorial history. Argument and response text include the qualifications that bear on their evidence or inference. The binary coding page has no separate evidence-notes or gaps panel. When both directions qualify, the strength comparison offers size, timing and reach information for accepted arguments, including relevant shared context. Reused passages appear once there. It adds no questions or automatic verdicts.

`review/evidence_placement.json` accounts for all 133 note-paragraph occurrences (48 distinct passages) and 29 gap records. Mixed passages are split at recorded sentence boundaries; original wording, IDs and citations remain recoverable. Editorial routing and review history remain in that audit and the frozen mapping. The overlay does not add a CON to any argument whose reviewed response was removed. Limited grammatical and note-routing edits are declared separately. The original content fields, dependency graph, frozen version, procedure, saving and randomized order are unchanged. No answer or comparison is migrated or reset.

## Coding behavior

After the guide, a separate bill overview shows one neutral bill description and source links, then opens or resumes coding directly. The same description appears in the fitted fixed context panel; repayment and lawful blocking-order information is merged into it, with no separate Main effect section. A single Menu control holds the guide, bill overview, background, network and export/account tools. Background opens a library of 10 verified statutory provisions and 12 unchallenged shared statements without Yes/No questions or completion requirements. Relevant context, supporting sources, qualifications and evidence notes also appear beside each claim or argument using them. Both pages can be reopened from Menu. Background provisions also open from network and argument links without changing the saved position. Substantively disputed effects and interpretations remain separate judgments.

The visible guided order contains three shared-claim questions, all 79 argument pages and six value summaries (88 pages). The original 110-item randomized order and seed are retained byte-for-byte; navigation skips all 22 background items, preserving all IDs and RNG draws. Prerequisites precede their claims, equivalent positions are randomized once, then values → directions → arguments. Network links allow revisiting without resampling. Shared-claim coding pages omit usage lists; these relationships remain available in the optional Network. Back from the first coding page returns to the bill overview.

Shared claims ask: **Does the evidence support this shared claim?** Arguments ask: **Does this argument establish a reason to SUPPORT/OPPOSE S.1582?** The actual page substitutes one direction. Both offer Yes/No and optional notes. Argument pages do not repeat judgment criteria.

Sourced context has no reviewer answer and never count as an automatic Yes. Historical answers to the former questions remain in private records and exports, but do not affect derivation. A rejected necessary judged claim derives No only if every alternative path is blocked. Accepting shared claims never accepts an argument. Unknown claims, local alternative paths and disputed dependencies do not silently become No. Every argument page must still be completed. Earlier direct judgments remain available when changed premises require reassessment. The dependency-flag control and its guide/derived-outcome instructions are removed. Historical dependency flags remain in saved records and exports with their previous semantics; loading does not clear them. The procedure correction changes premise-basis signatures for affected judgments, so earlier direct answers, completion records and comparisons are retained but require reassessment where relevant. Loading or reading background does not mutate the saved record; the next user edit records the procedure revision. CSV distinguishes background from active questions and includes both evaluation and recorded procedure revisions; JSON exports identify the amendment.

Value summaries list every heading and judgment, highlight accepted arguments and expand complete arguments, responses and notes. Initial outcomes depend on the existence of a reason. Only Both opens strength comparison; Pending is available. Changed judgments invalidate old comparisons while retaining them. Before final No, evidence links and separate optional omitted-reason fields are shown.

## Private storage

Firebase project `policy-rationale-coding-pilot` uses Google Authentication and a Standard Firestore database in `eur3`, on the free Spark plan. No Analytics, billing upgrade or paid service was enabled. Public Firebase web configuration identifies the app; authorization is enforced by `backend/firestore.rules`.

Assignments and accounts live only in Firebase. Reviewers can read/write their own assigned sessions; only the coordinator can export authorized records across reviewers. Clients cannot grant assignments. Each save transaction requires the expected server revision and creates an immutable matching backup. Old revisions cannot be updated or deleted by the app.

The UI distinguishes unsent drafts, server-confirmed saves and conflicts. A conflict retains both full versions and asks which to use. An unsent browser draft survives closing and reopening; it is scoped to the account and session. JSON/CSV and revision exports are private, displayed for copying or saving. QA and research use distinct session IDs and kinds; exclude `qa` from research data.

Provision assignments in the Firebase Console as the project owner: `assignments/{Google UID}` with `active: true`, `role: reviewer` (or coordinator), `versions: [frozen-version]`, and authorized `kinds`. No account emails or UIDs belong in this repository. Nic's approved assignment and labeled QA records are provisioned; no research response was prefilled.

## Build and checks

From `pilot/`: `npm ci`, `npm test`, `npm run assemble`, `npm run build`. Assembly is deterministic; a different authority/mapping version requires a separate assignment and session, not silent migration. This explicit procedure overlay preserves that identity and stored randomization, with its own revision and source audit; it does not rewrite saved answers. The website workflow builds Quartz first and then this app under `public/coding/s1582-pilot/`.

`npm run test:rules` runs the security tests in the local emulator. With an emulator already listening on port 8089, use `FIRESTORE_EMULATOR_HOST=127.0.0.1:8089 node --test test/rules.test.mjs`. Tests use `demo-s1582-rules`, separate from UI fixtures. The localhost-only `?qa=1&emulator=1` mode uses dummy Google identities and demo data. It never connects these fixtures to production; its connection-interruption control simulates a save failure at the storage boundary.

`verification.json` records the initial 14 passing content/core tests, seven security tests, browser checks and their limits. The statutory-background amendment passed 16 content/core regression tests, including legacy record preservation, prior background No, reassessment, comparison invalidation, exact response relocations, and exhaustive final-path combinations; its amendment verification is recorded separately. The November 7 context/styling amendment passes 18 content/core tests and all seven authorization regressions, with compatibility checks against both production records and all 44 stored revisions. Layouts were checked at 1440px, 756px and 390px. Two independent browser-storage contexts tested shared state and conflicts; no physical second device was used. Production Google sign-in, saving, revision export and close/return were tested with labeled QA data.

## Workload and limits

The current procedure adds three shared decisions to 79 argument judgments, grouping 15 repeated argument uses. It removes 22 unnecessary separate decisions compared with the original mapping (12 compared with the previous published procedure). The original mapping added 25 decisions and grouped 113 direct/indirect dependency uses; those historical figures are superseded for decision counts. The word counts below describe that original mapping, before this procedure amendment. Seven repeated mining objections become one shared response. Local argument text falls from 24,052 to 20,245 words (15.8% less), but adding claim pages raises the total to 26,099 words without claim notes (8.5% more), or 28,484 with them (18.4% more). These counts exclude argument notes and fixed context.

In current software scenarios, accepting every judged shared claim derives no argument answers; rejecting all three derives No for 11 arguments, leaving 68 with an unblocked local or background-only route. These are behavior checks, not human results. All pages remain assigned.

The 29 evidence/inference gaps are accounted for in the placement audit. Inference qualifications now appear with their argument or response; the one duration-only gap appears at the strength comparison. Source reading used targeted context and quote matching, not a new comprehensive evidence review. ESL clarity and reduced effort have not been tested with coders. The app does not demonstrate reliability gains. Assess actual coding effort before expanding to another bill.

The November 7 amendment uses the briefs website’s Schibsted Grotesk/Source Sans Pro fonts, warm background, blue links, rust response panels and fine rules. `review/uncontested_context_verification.json` records its checks and limits. The three remaining claims keep 15 repeated argument uses; effort and reliability gains remain untested.

## Preservation and rollback

Existing brief URLs, source navigation, Qualtrics surveys, records and Nic's unfinished response were not edited. Firebase records are outside GitHub; every acknowledged save has a recoverable immutable revision, and private exports provide off-service copies.

To roll back only the uncontested-context/styling amendment, revert its commit and redeploy while retaining its procedure audit, private records and revisions. Prior records remain accepted without rewriting; only affected argument bases and comparisons require reassessment.

To roll back only the statutory-background amendment, revert its amendment commit and redeploy. Preserve the current procedure audit and all server revisions. An older client evaluates the original procedure, so exports must retain which procedure was used; no historical record should be rewritten.

To roll back only this pilot, revert the commit that adds `pilot/` and the two workflow build steps, then deploy. This removes the separate pilot URL without changing existing briefs or deleting Firebase records. Disable an assignment's `active` flag to suspend access without deleting data. Keep the frozen content and private exports when rolling back. Do not loosen rules or migrate an unfinished Qualtrics session.
