{
  "status": "reproduced_gate_findings_corrected_and_independently_regression_verified",
  "scope": "Independent gate review; retirement implementation is separately reviewed by root",
  "website_checkout": "/private/tmp/policy-procedure-closure-site-20261107",
  "findings": [
    {
      "id": "CLT001",
      "classification": "confirmed_defect",
      "status": "closed",
      "issue": "A confirmed defect can merge into a noncorrective human-coding or disclosed-limit disposition, bypassing patch/retirement requirements.",
      "evidence": "Two synthetic rejection probes are accepted by validatePublication.",
      "required_result": "A merged finding terminates at a corrective disposition allowed for the original class and covering every affected record.",
      "disposition": "corrected",
      "verification": {
        "pass": true,
        "verifier": "Sol 6.1 Max independent technical verification",
        "gate_sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
        "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640",
        "regressions": "output/closure/gate.test.mjs",
        "result": "22/22 independent regressions pass; the original invalid candidate is now rejected."
      }
    },
    {
      "id": "CLT002",
      "classification": "confirmed_defect",
      "status": "closed",
      "issue": "A no-op patch whose before and after are equal can close a confirmed defect.",
      "evidence": "The unchanged-patch synthetic rejection probe is accepted by validatePublication.",
      "required_result": "Content-changing dispositions require an actual applied change.",
      "disposition": "corrected",
      "verification": {
        "pass": true,
        "verifier": "Sol 6.1 Max independent technical verification",
        "gate_sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
        "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640",
        "regressions": "output/closure/gate.test.mjs",
        "result": "22/22 independent regressions pass; the original invalid candidate is now rejected."
      }
    },
    {
      "id": "CLT003",
      "classification": "confirmed_defect",
      "status": "closed",
      "issue": "A confirmed defect can cite a patch of an unrelated record without changing its affected record.",
      "evidence": "The unrelated-record synthetic rejection probe is accepted by validatePublication.",
      "required_result": "Patch scope and affected record coverage must agree; a verified cross-record mirror repair is explicitly linked.",
      "disposition": "corrected",
      "verification": {
        "pass": true,
        "verifier": "Sol 6.1 Max independent technical verification",
        "gate_sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
        "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640",
        "regressions": "output/closure/gate.test.mjs",
        "result": "22/22 independent regressions pass; the original invalid candidate is now rejected."
      }
    },
    {
      "id": "CLT004",
      "classification": "confirmed_defect",
      "status": "closed",
      "issue": "Mandatory argument inspection may be an arbitrary empty set despite a substantive correction.",
      "evidence": "The omitted-mandatory-inspection synthetic rejection probe is accepted by validatePublication.",
      "required_result": "Mandatory inspection scope includes every current removal, substantive revision, merge and dependency affected by the closure work.",
      "disposition": "corrected",
      "verification": {
        "pass": true,
        "verifier": "Sol 6.1 Max independent technical verification",
        "gate_sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
        "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640",
        "regressions": "output/closure/gate.test.mjs",
        "result": "22/22 independent regressions pass; the original invalid candidate is now rejected."
      }
    },
    {
      "id": "CLT005",
      "classification": "confirmed_defect",
      "status": "closed",
      "issue": "Every curly-quoted passage is exempted from editorial-verdict scanning without proving it is a bound-source quotation.",
      "evidence": "The fake-curly-quote synthetic rejection probe is accepted by validatePublication.",
      "required_result": "Only verified exact source quotations are exempt, or no blanket quotation exemption is used.",
      "disposition": "corrected",
      "verification": {
        "pass": true,
        "verifier": "Sol 6.1 Max independent technical verification",
        "gate_sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
        "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640",
        "regressions": "output/closure/gate.test.mjs",
        "result": "22/22 independent regressions pass; the original invalid candidate is now rejected."
      }
    },
    {
      "id": "CLT006",
      "classification": "confirmed_defect",
      "status": "closed",
      "issue": "The editorial-verdict scan omits displayed bill context and separate background copies.",
      "evidence": "The bill-context rejection probe covers a displayed single-bill description outside claims/arguments.",
      "required_result": "The scan covers all displayed fields, retaining explicit source-quotation handling.",
      "disposition": "corrected",
      "verification": {
        "pass": true,
        "verifier": "Sol 6.1 Max independent technical verification",
        "gate_sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
        "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640",
        "regressions": "output/closure/gate.test.mjs",
        "result": "22/22 independent regressions pass; the original invalid candidate is now rejected."
      },
      "additional_regressions": [
        "Retired-ID explanations are scanned.",
        "Rendered inline formatting and whitespace cannot conceal an editorial verdict.",
        "Bill context, interface copy and separate background copies are scanned."
      ]
    },
    {
      "id": "CLT007",
      "classification": "confirmed_defect",
      "status": "closed",
      "issue": "The normalized gate does not require several audit semantics mandated by the Opus machine contract: source locators, reading limits, comparable-scope result, author/verifier attribution and dated verification.",
      "evidence": "The positive candidate fixture lacks these fields and passes; finding_closure_gate.md completeness check requires them.",
      "required_result": "Validate the required original ledger fields or an explicitly approved normalized equivalent. Global whole-release binding can supply stricter freshness than per-record reuse.",
      "disposition": "corrected",
      "verification": {
        "pass": true,
        "verifier": "Sol 6.1 Max independent technical verification",
        "gate_sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
        "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640",
        "regressions": "output/closure/gate.test.mjs",
        "result": "22/22 independent regressions pass; the original invalid candidate is now rejected."
      }
    },
    {
      "id": "CLT008",
      "classification": "confirmed_defect",
      "status": "closed",
      "issue": "Changing only argument audit metadata can be cited as a corrective patch while displayed content stays unchanged.",
      "evidence": "A patch of arguments[A].edits alone was accepted as the sole correction for confirmed defect A.",
      "required_result": "Content patches must use an approved functional or display field; audit-only metadata cannot stand in for the correction.",
      "disposition": "corrected",
      "verification": {
        "pass": true,
        "verifier": "Sol 6.1 Max independent technical verification",
        "gate_sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
        "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640",
        "regressions": "output/closure/gate.test.mjs",
        "result": "22/22 independent regressions pass; the original invalid candidate is now rejected."
      }
    }
  ],
  "regression_source": "output/closure/gate.test.mjs",
  "limits": [
    "These structural checks do not establish the factual truth of any content disposition.",
    "No website gate code was changed by this verifier.",
    "The actual release inventory, final Opus dispositions and final publication receipts still require independent inspection.",
    "Final built parity, actual import-source bytes, anchors and public-output exclusion checks await root final artifacts."
  ],
  "test_results": {
    "independent_gate": "22/22 pass",
    "root_publication_suite": "12/12 pass",
    "filesystem_checks": [
      "Changed or newly added issue reports expire approval.",
      "Absent required sources and changed independent receipts block publication.",
      "Ledger origins must resolve through the verified source index.",
      "Changed on-disk content invalidates approval.",
      "Newly bound interface copy is scanned."
    ],
    "merged_targets": [
      "A covering corrective merge passes.",
      "Human-coding and disclosed-limit waiver targets reject.",
      "Missing affected coverage, self-target and merge-chain targets reject.",
      "The resolved correction must cite a patch related to the original finding."
    ],
    "implementation_patch": "The actual bound current file hash passes; an invented after hash rejects."
  }
}
