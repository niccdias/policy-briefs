# Finding-closure gate

This is the machine contract for the publication gate. The main agent implements and runs it. It runs before the atomic publish step and fails closed: any failed check stops publication of both the public site and the coding app. It does not change review questions, strength comparisons, saved answers, assigned order or history.

## Inputs

**Inventory sources (`finding_sources.json`).** A list of every record that can raise findings, each with its path and SHA-256: issue logs, reports, verification and fidelity reviews, retained-sample reviews, main-agent reviews, and any finding Nic reports. A source that holds no findings is still listed.

**Finding ledger (`finding_ledger.json`).** One entry per finding:

| Field | Requirement |
| --- | --- |
| `finding_id` | Unique and stable |
| `origins` | Source path and the finding's ID or locator in that source |
| `records` | Affected stable record IDs, or `release` for a declared limit |
| `class` | `confirmed_defect`, `genuine_uncertainty`, `human_coding_judgment`, `no_defect` or `declared_limit` |
| `status` | `closed` or `open` |
| `disposition` | `corrected`, `retired`, `qualified`, `branch_removed`, `left_for_human_coding`, `rejected_after_inspection`, `disclosed` or `merged` |
| `merged_into` | Required when the disposition is `merged`: the surviving `finding_id` |
| `rationale` | Why this class and disposition are right |
| `source_locators` | Path and passage for each source relied on |
| `reading_limit` | What was not read or could not be settled |
| `patch_ids` | The patch entries that carry out the correction, when the disposition changes content |
| `comparable_scope` | What was inspected for the same cause, and the result |
| `author` | The role that decided the disposition |
| `verification` | See below |

**Patches (`content_patch.json`).** Each entry has `patch_id`, stable record ID, field path, exact `before`, exact `after`, classification, reason and source locators. Retirements are listed separately with the historical ID, reason and any dependency change.

**Verification.** Each finding's `verification` object has `verifier`, `verdict` (`pass` or `fail`), `checked_at`, `content_id`, `procedure_id`, `mapping_id` and `record_sha256`, a hash of the current displayed fields of the affected records.

**Release approval (`release_approval.json`).** The final independent verification, tied to the release's `content_id`, `procedure_id`, `mapping_id` and the SHA-256 of the finding ledger.

## Checks

The gate fails if any of these is true:

1. **Sources:** a listed source is missing or its hash differs.
2. **Inventory:** a finding in a listed source has no ledger entry, or an entry's origin does not resolve. Sources without structured IDs need a recorded list of their findings, checked by the verifier.
3. **Completeness:** an entry lacks a required field, or any entry is `open`.
4. **Allowed pairs:** the class and disposition are not an allowed pair:
   - `confirmed_defect`: `corrected`, `retired` or `merged`
   - `genuine_uncertainty`: `qualified`, `branch_removed`, `retired`, `corrected` or `merged`
   - `human_coding_judgment`: `left_for_human_coding` or `merged`
   - `no_defect`: `rejected_after_inspection` or `merged`
   - `declared_limit`: `disclosed`
5. **Audit-only closure:** a `confirmed_defect` has no patch or retirement, or a `genuine_uncertainty` has neither a patch nor a retirement. A patch may be cited by more than one finding.
6. **Merges:** a merged entry points to a missing entry, to another merged entry, or to an entry that does not cover its records.
7. **Patches applied:** an `after` string is absent from its field, or a `before` string still appears in that field, unless the patch records that the `before` text remains as part of the `after` text.
8. **Mirrors:** a record's duplicate displayed copies disagree, including claim and background copies, titles and first PRO sentences, notes and evidence nodes, and gap wording and gap nodes. Audit fields (`note_routes`, `review_evidence`, `original`) are excluded.
9. **Retirements:** a retired ID is still active, is missing from the historical catalog, keeps a live dependency, or has no preserved original text. Expected active counts must match.
10. **Dependencies:** an active argument or route requires a retired claim or has no valid path after a change.
11. **Quotations and sources:** a quotation changed by a patch is not found in its bound source, or a citation binding changed without a recorded reason.
12. **Independence:** a verifier is the same role as the author, a verdict is not `pass`, or a `human_coding_judgment` or `no_defect` entry has no independent verification.
13. **Stale approvals:** a finding's `content_id`, `procedure_id` or `mapping_id` differs from the release while its `record_sha256` no longer matches. The release approval must match the release exactly, so any later change requires a new final verification.
14. **Banned coder wording:** a displayed field contains a listed editorial-verdict phrase. The main agent keeps the list. A phrase may stay only inside an exact source quotation.

## New findings

A finding raised after approval reopens the gate. It enters the ledger, and the release waits until it is closed. A correction changes the IDs and needs a new final verification. Only finding approvals whose `record_sha256` changed need repeating, unless the correction has a shared cause.

## What the gate does not establish

Passing shows that the recorded process is complete and consistent. It does not show that an argument is sound, that a source was read in full beyond the recorded locators, that the ledger's judgments are right, or that coders understand the text.
