# Current release contract

This contract states what the current combined release must do. It records requirements. It is not a record that any test has passed or that any change has been deployed. [quality_README.md](../quality_pass/README.md) gives the model responsibilities and the review procedure.

## Scope

- One shared content source feeds both the public briefs and the coding app. It covers every active argument and all 48 value pages across the eight bills. The release record states the exact counts.
- This contract does not change Qualtrics surveys, their question wording or their records.

## Publication

- Publishing is gated on parity: the public artifacts and the coding artifacts must be built from the same frozen source and must match on the checked content.
- Publishing is atomic: the two surfaces change together, or neither changes.
- Public artifacts contain no private content: no keys, coder responses, reviewer accounts or private records.

## Clarity changes

- Clarity edits are logged separately from substantive edits. Each logged edit records the before text, the after text and the reason.
- A clarity edit that names a referent ("this", "the package", "it") is checked against the source context of the passage. Later evidence does not supply the referent of an earlier statement or become the historical baseline.
- Exact quotations stay unchanged inside their quotation marks. An ambiguous quotation is explained outside the marks or replaced with a faithful sourced paraphrase.
- A clarity edit may not add a premise, strengthen or weaken a claim, or change a population, condition, time, causal strength, uncertainty or source binding. A needed change of meaning is flagged for bounded substantive integration.
- Bill descriptions lead with the concrete change the bill would make. They do not open with "is a bill" or a statement of method. They stay plain text in short sentences and keep the essential agency roles.
- The exact bill version, text date, comparison date and evidence cutoff stay in the metadata and in a short visible comparison label. There is no separate Main effect section.
- A model clarity pass does not establish that ESL coders understand the text.

## Release identity

Each saved revision records the identity of the material the reviewer actually loaded:

- the rendered-release ID;
- the content ID;
- the procedure ID;
- the mapping ID.

The rendered-release ID comes from the application that rendered the page. A client running a cached application records the ID of the cached release, not the newest release.

## Reopening judgments

- A new release reopens a judgment only when the change can affect that judgment. The release lists the affected pages.
- A cosmetic change reopens no judgment.
- A saved revision that predates release tracking is labeled `unknown_legacy`. No rendered-release ID is invented or backfilled for it.

## Preservation

- Earlier answers, assigned order and revision history are preserved through every release, mapping change and reopened judgment.
- Research records that Nic asked to erase stay erased. They are not restored from older recovery material, including for checks under this contract.

## Mapping

- The main agent independently checks every merge, dependency and alternative route for scope and necessity.
- A human coordinator disposes of each ordinary mapping note as "No mapping change", "Mapping revised" or "Unresolved".
- A mapping correction recomputes derived outcomes. An argument with a viable route needs a direct judgment. Only an argument with every route blocked derives No. A continued dispute stays Unresolved.
- Earlier answers are preserved. There is no dependency flag.

## Strength comparison

- The exact existing argument and comparison questions stay unchanged.
- The guide asks reviewers to compare the overall case from the distinct accepted consequences and to consider all the effects, not only the strongest. Reviewers do not count headings or count a consequence twice.
- Evidential support is distinct from magnitude.
- Reviewers choose Pending when no comparison is justified. There is no numerical formula.

## Source dates

Each date that bears on the evidence cutoff records one basis:

- `verified_publication`: a publication date confirmed from the source;
- `verified_version`: a version or revision date confirmed from the source;
- `search_listing`: a date taken from a search listing;
- `proxy`: a date inferred from something else, such as a bill's last recorded vote.

Whether a saved edition is available is recorded separately from the date basis. A saved edition may be available for a source whose date is still a proxy.

The targeted date check covers only the seven CRS summaries dated by a last recorded vote and the two linked PDFs dated from a search listing. It is not a new audit of the evidence base.

A source with materially uncertain timing may not be the sole support for a claim. Evidence dated after the comparison date may be used only with an explanation of why it bears on the fixed historical comparison. It does not replace the law in force on that date.

## Independent verification

**Mandatory inspection.** Independent verification inspects every removal, substantive revision, merge and dependency.

**Retained sample.** It also inspects one retained argument from each nonempty stratum of bill × value × direction. A stratum's candidates are its retained arguments outside the mandatory set. A stratum with no candidates is recorded as having none. Selection is reproducible:

1. Compute `SHA256(frozen_release_id + "|" + bill_id + "|" + value_id + "|" + direction)`.
2. Read the hash as an integer and take it modulo the number of candidates.
3. Use the result as the index into the candidates sorted by argument ID.

**Escalation.** A material defect triggers a bounded pass over genuinely comparable items. The pass crosses bills only when the defect has a shared cause. It is not a repeated full review until agreement. Unresolved issues stay visible. A disagreement is not converted into a model-generated coding key.

## Finding closure

Publication is gated on a complete finding inventory, as defined in [the procedure README](../quality_pass/README.md#finding-closure) and [finding_closure_gate.md](finding_closure_gate.md).

- Every finding from every issue log, review and verification record is in the inventory exactly once.
- A confirmed defect closes only through a correction or retirement in the release content, verified independently. An audit log alone never closes it.
- A genuine uncertainty closes only after investigation, with the text accurately qualified or the unsupported branch removed, and the rationale verified independently.
- A reasonable human coding judgment stays with human reviewers. No model answer is assigned.
- Each approval is tied to the content, procedure and mapping IDs it covers. A change to any of them makes the affected approval stale, and a stale approval blocks publication.
- This gate does not change the review questions or the strength comparison.

## Novice ESL pilot

A novice ESL pilot runs under its own separate protocol. This contract does not execute it.

- Comprehension and workload targets are declared before results are interpreted.
- No claim about reliability, reduced burden or other benefit is made before the pilot meets its declared targets.
- Exploratory analysis is allowed and is labeled exploratory.

## Acceptance tests

**Mapping logic**

- A premise is applied only at the scope used by the local argument.
- AND: a route is blocked when any required premise is No.
- OR: an argument is blocked only when every route is blocked.
- Unknown stays Unknown and derives neither Yes nor No.
- An accepted premise never derives Yes.
- A mapping correction recomputes derived outcomes and asks for a direct judgment on each newly viable route.

**Records and release**

- Earlier answers, assigned order and revision history survive a release and a mapping correction.
- Exports contain the answers, order, history and release identity, and legacy revisions export as `unknown_legacy`.
- A failed or partial publish leaves both surfaces unchanged.
- A client running a cached application saves the ID of the release it rendered.

**Finding closure**

- A finding with no class, disposition or independent verification blocks the build.
- A confirmed defect closed only by a log entry blocks the build.
- A required corrected text that is missing from the release content blocks the build. So does replaced text that still appears in a displayed field.
- A finding from a listed source that is missing from the inventory blocks the build.
- An approval tied to a different content, procedure or mapping ID blocks the build.
- A retired ID missing from the historical catalog, or still active, blocks the build.
