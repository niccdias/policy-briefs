# S.1582 shared-premise coding pilot

Pilot: https://niccdias.github.io/policy-briefs/coding/s1582-pilot/

Google sign-in is required. An active private Firebase assignment must authorize this frozen version and session kind. The normal URL opens research coding; `?qa=1` opens a separate, clearly labeled QA session. No invitations are sent.

## Frozen content and history

Version: `s1582-pilot-20261106-8f9bb0aef314`.

- 79 active arguments, all 85 historical IDs, six retired Tradition arguments.
- 25 shared claims; 109 direct argument-to-claim dependencies and four additional reporting-duty uses through C18 → C27; 130 supporting paths. Thirty arguments have alternative paths.
- Original bill version: Senate-engrossed text, June 17, 2025. Comparison: July 17, 2025 law. Evidence cutoff: July 17, 2026.
- All 47 distinct evidence-note IDs on active arguments are preserved. Thirty-five arguments retain the no-point-specific-CON status; that status does not establish the argument.

The authority is the final reviewed S.1582 release plus the November 5 Tradition amendment, frozen in `review/authority.json`. Its parent argument bank SHA-256 is `58ee0a8afb315d3eed218025a44b939bf127748045555a81a4cebf7a16d0bfe5`. The website base is `b4e514cbce8c41b19c2d22ccfa46303955812ab3`; existing briefs are unchanged.

`review/history_audit.json` records current rules, superseded rules and their sources, including the earlier unapproved network pilot. `review/mapping.json` preserves exact original passages, necessity rationales, AND/OR paths, classifications, notes and source links. `review/main_review.json` records main-agent inspection of every claim merge, dependency, path and substantive change. Original arguments remain accessible in the app. No manuscript keys or coder responses were provided to the worker.

Opus 5.5 ran through the existing Claude subscription at native High effort, verified at start and end, without further delegation. All 394 staged inputs remained unchanged. The final mapping SHA-256 is `f47f3b086fea8ba2ef5c259b3a892105e32b47346b4ed61437872df25a44adbc`.

## Coding behavior

The guided order contains 25 shared-claim pages, all 79 argument pages and six value summaries. It is sampled once from a saved seed: prerequisite claims first, randomized ties, then randomized values → directions → arguments. Network links allow revisiting without resampling.

Shared claims ask: **Does the evidence support this shared claim?** Arguments ask: **Does this argument establish a reason to SUPPORT/OPPOSE S.1582?** The actual page substitutes one direction. Both offer Yes/No and optional notes. Argument pages do not repeat judgment criteria.

A rejected necessary claim derives No only if every alternative path is blocked. Accepting shared claims never accepts an argument. Unknown claims, local alternative paths and disputed dependencies do not silently become No. Every argument page must still be completed. Earlier direct judgments remain available when changed premises require reassessment. Dependency flags suspend derivation at the flagged item.

Value summaries list every heading and judgment, highlight accepted arguments and expand complete arguments, responses and notes. Initial outcomes depend on the existence of a reason. Only Both opens strength comparison; Pending is available. Changed judgments invalidate old comparisons while retaining them. Before final No, evidence links and separate optional omitted-reason fields are shown.

## Private storage

Firebase project `policy-rationale-coding-pilot` uses Google Authentication and a Standard Firestore database in `eur3`, on the free Spark plan. No Analytics, billing upgrade or paid service was enabled. Public Firebase web configuration identifies the app; authorization is enforced by `backend/firestore.rules`.

Assignments and accounts live only in Firebase. Reviewers can read/write their own assigned sessions; only the coordinator can export authorized records across reviewers. Clients cannot grant assignments. Each save transaction requires the expected server revision and creates an immutable matching backup. Old revisions cannot be updated or deleted by the app.

The UI distinguishes unsent drafts, server-confirmed saves and conflicts. A conflict retains both full versions and asks which to use. An unsent browser draft survives closing and reopening; it is scoped to the account and session. JSON/CSV and revision exports are private, displayed for copying or saving. QA and research use distinct session IDs and kinds; exclude `qa` from research data.

Provision assignments in the Firebase Console as the project owner: `assignments/{Google UID}` with `active: true`, `role: reviewer` (or coordinator), `versions: [frozen-version]`, and authorized `kinds`. No account emails or UIDs belong in this repository. Nic's approved assignment and labeled QA records are provisioned; no research response was prefilled.

## Build and checks

From `pilot/`: `npm ci`, `npm test`, `npm run assemble`, `npm run build`. Assembly is deterministic; a different content version requires a separate assignment and session, not silent migration. The website workflow builds Quartz first and then this app under `public/coding/s1582-pilot/`.

`npm run test:rules` runs the security tests in the local emulator. With an emulator already listening on port 8089, use `FIRESTORE_EMULATOR_HOST=127.0.0.1:8089 node --test test/rules.test.mjs`. Tests use `demo-s1582-rules`, separate from UI fixtures. The localhost-only `?qa=1&emulator=1` mode uses dummy Google identities and demo data. It never connects these fixtures to production; its connection-interruption control simulates a save failure at the storage boundary.

`verification.json` records 14 passing content/core tests, seven security tests, browser checks and their limits. Layouts were checked at 1440px, 756px and 390px. Two independent browser-storage contexts tested shared state and conflicts; no physical second device was used. Production Google sign-in, saving, revision export and close/return were tested with labeled QA data.

## Workload and limits

This adds 25 shared decisions to the 79 argument judgments. The mapping groups 113 repeated uses into those 25 questions, including the four indirect reporting-duty uses. Seven repeated mining objections become one shared response. Local argument text falls from 24,052 to 20,245 words (15.8% less), but adding claim pages raises the total to 26,099 words without claim notes (8.5% more), or 28,484 with them (18.4% more). These counts exclude argument notes and fixed context.

In software scenarios, accepting every shared claim derives no argument answers; rejecting every shared claim derives No for 55 arguments, leaving 24 with an unblocked local route. These are behavior checks, not human results. All pages remain assigned.

Twenty-nine evidence/inference gaps remain visible. Source reading used targeted context and quote matching, not a new comprehensive evidence review. ESL clarity and reduced effort have not been tested with coders. The app does not demonstrate reliability gains. Assess actual coding effort before expanding to another bill.

## Preservation and rollback

Existing brief URLs, source navigation, Qualtrics surveys, records and Nic's unfinished response were not edited. Firebase records are outside GitHub; every acknowledged save has a recoverable immutable revision, and private exports provide off-service copies.

To roll back only this pilot, revert the commit that adds `pilot/` and the two workflow build steps, then deploy. This removes the separate pilot URL without changing existing briefs or deleting Firebase records. Disable an assignment's `active` flag to suspend access without deleting data. Keep the frozen content and private exports when rolling back. Do not loosen rules or migrate an unfinished Qualtrics session.
