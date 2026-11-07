{
 "note": "Supplement to finding_ledger.json at commit cf13f33. The original 54 entries are unchanged except for the C-NOTE fields listed in update.",
 "new_findings": [
  {
   "finding_id": "CLT001",
   "origins": [
    {
     "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
     "locator": "CLT001"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. A merge must end in a disposition that corrects the original class, or the closure rule can be bypassed. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json CLT001",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9"
   ],
   "reading_limit": "I read the finding and its receipt and confirmed the gate file hash. I did not read the gate code or run the tests.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
    "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640"
   },
   "comparable_scope": "The 22 regression tests in gate.test.mjs cover this and related bypasses, as reported by the verifier.",
   "author": "Opus 5.5 High",
   "verification": null,
   "independent_evidence": {
    "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
    "sha256": "b47fadd8f766b67b758cbe9a8adec3497c30c3af5e07bbf6c6c1d7b939cfa083",
    "finding": "CLT001",
    "verdict": "pass",
    "verifier": "Sol 6.1 Max independent technical verification",
    "note": "Root binds this receipt to the release IDs."
   }
  },
  {
   "finding_id": "CLT002",
   "origins": [
    {
     "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
     "locator": "CLT002"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. A patch that changes nothing cannot correct a defect. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json CLT002",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9"
   ],
   "reading_limit": "I read the finding and its receipt and confirmed the gate file hash. I did not read the gate code or run the tests.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
    "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640"
   },
   "comparable_scope": "The 22 regression tests in gate.test.mjs cover this and related bypasses, as reported by the verifier.",
   "author": "Opus 5.5 High",
   "verification": null,
   "independent_evidence": {
    "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
    "sha256": "b47fadd8f766b67b758cbe9a8adec3497c30c3af5e07bbf6c6c1d7b939cfa083",
    "finding": "CLT002",
    "verdict": "pass",
    "verifier": "Sol 6.1 Max independent technical verification",
    "note": "Root binds this receipt to the release IDs."
   }
  },
  {
   "finding_id": "CLT003",
   "origins": [
    {
     "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
     "locator": "CLT003"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. A correction has to change the records the finding concerns. A cross-record mirror repair counts only when linked explicitly. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json CLT003",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9"
   ],
   "reading_limit": "I read the finding and its receipt and confirmed the gate file hash. I did not read the gate code or run the tests.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
    "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640"
   },
   "comparable_scope": "The 22 regression tests in gate.test.mjs cover this and related bypasses, as reported by the verifier.",
   "author": "Opus 5.5 High",
   "verification": null,
   "independent_evidence": {
    "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
    "sha256": "b47fadd8f766b67b758cbe9a8adec3497c30c3af5e07bbf6c6c1d7b939cfa083",
    "finding": "CLT003",
    "verdict": "pass",
    "verifier": "Sol 6.1 Max independent technical verification",
    "note": "Root binds this receipt to the release IDs."
   }
  },
  {
   "finding_id": "CLT004",
   "origins": [
    {
     "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
     "locator": "CLT004"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. The contract requires inspection of every removal, substantive revision, merge and dependency, so an empty mandatory set cannot pass after substantive corrections. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json CLT004",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9"
   ],
   "reading_limit": "I read the finding and its receipt and confirmed the gate file hash. I did not read the gate code or run the tests.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
    "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640"
   },
   "comparable_scope": "The 22 regression tests in gate.test.mjs cover this and related bypasses, as reported by the verifier.",
   "author": "Opus 5.5 High",
   "verification": null,
   "independent_evidence": {
    "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
    "sha256": "b47fadd8f766b67b758cbe9a8adec3497c30c3af5e07bbf6c6c1d7b939cfa083",
    "finding": "CLT004",
    "verdict": "pass",
    "verifier": "Sol 6.1 Max independent technical verification",
    "note": "Root binds this receipt to the release IDs."
   }
  },
  {
   "finding_id": "CLT005",
   "origins": [
    {
     "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
     "locator": "CLT005"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. banned_phrases.json already says that only a phrase matching its bound source is exempt. A blanket exemption for curly quotes contradicts that. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json CLT005",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9"
   ],
   "reading_limit": "I read the finding and its receipt and confirmed the gate file hash. I did not read the gate code or run the tests.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
    "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640"
   },
   "comparable_scope": "The 22 regression tests in gate.test.mjs cover this and related bypasses, as reported by the verifier.",
   "author": "Opus 5.5 High",
   "verification": null,
   "independent_evidence": {
    "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
    "sha256": "b47fadd8f766b67b758cbe9a8adec3497c30c3af5e07bbf6c6c1d7b939cfa083",
    "finding": "CLT005",
    "verdict": "pass",
    "verifier": "Sol 6.1 Max independent technical verification",
    "note": "Root binds this receipt to the release IDs."
   }
  },
  {
   "finding_id": "CLT006",
   "origins": [
    {
     "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
     "locator": "CLT006"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. Bill context, interface copy, background copies and retired-ID explanations are displayed, so the scan must cover them. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json CLT006",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9"
   ],
   "reading_limit": "I read the finding and its receipt and confirmed the gate file hash. I did not read the gate code or run the tests.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
    "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640"
   },
   "comparable_scope": "The 22 regression tests in gate.test.mjs cover this and related bypasses, as reported by the verifier.",
   "author": "Opus 5.5 High",
   "verification": null,
   "independent_evidence": {
    "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
    "sha256": "b47fadd8f766b67b758cbe9a8adec3497c30c3af5e07bbf6c6c1d7b939cfa083",
    "finding": "CLT006",
    "verdict": "pass",
    "verifier": "Sol 6.1 Max independent technical verification",
    "note": "Root binds this receipt to the release IDs."
   }
  },
  {
   "finding_id": "CLT007",
   "origins": [
    {
     "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
     "locator": "CLT007"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. finding_closure_gate.md requires these fields, so the gate must check them or an approved equivalent. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json CLT007",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9"
   ],
   "reading_limit": "I read the finding and its receipt and confirmed the gate file hash. I did not read the gate code or run the tests.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
    "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640"
   },
   "comparable_scope": "The 22 regression tests in gate.test.mjs cover this and related bypasses, as reported by the verifier.",
   "author": "Opus 5.5 High",
   "verification": null,
   "independent_evidence": {
    "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
    "sha256": "b47fadd8f766b67b758cbe9a8adec3497c30c3af5e07bbf6c6c1d7b939cfa083",
    "finding": "CLT007",
    "verdict": "pass",
    "verifier": "Sol 6.1 Max independent technical verification",
    "note": "Root binds this receipt to the release IDs."
   }
  },
  {
   "finding_id": "CLT008",
   "origins": [
    {
     "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
     "locator": "CLT008"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. An audit-metadata edit leaves the displayed text unchanged, so it cannot correct a content defect. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json CLT008",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9"
   ],
   "reading_limit": "I read the finding and its receipt and confirmed the gate file hash. I did not read the gate code or run the tests.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "13a6c93956f17c9f571c512cae2cf896fbe26a7d18e9872ef487a54d452a5ba9",
    "source_commit": "da1bfd99e284ea05f496636b3c814c2c02ea2640"
   },
   "comparable_scope": "The 22 regression tests in gate.test.mjs cover this and related bypasses, as reported by the verifier.",
   "author": "Opus 5.5 High",
   "verification": null,
   "independent_evidence": {
    "source": "/private/tmp/policy-procedure-verifier-20261107/output/closure/technical-findings.json",
    "sha256": "b47fadd8f766b67b758cbe9a8adec3497c30c3af5e07bbf6c6c1d7b939cfa083",
    "finding": "CLT008",
    "verdict": "pass",
    "verifier": "Sol 6.1 Max independent technical verification",
    "note": "Root binds this receipt to the release IDs."
   }
  }
 ],
 "update": [
  {
   "finding_id": "C-NOTE",
   "replaces_fields": {
    "patch_ids": [
     "CP0004",
     "CP0307",
     "CPS1-0001"
    ],
    "rationale": "The shared note names this reason but was missing from its page. Its 19 percent cap, Section 301 and Nicaragua facts apply to Malaysia's promise, and C09 gives only a general version. The note text and both of its displayed evidence fragments are now exact copies of those on SJRes88_UNC_oppose_02 to 05: the cap in support and Section 301 in strength. The first patch missed the strength fragment because my builder copied support fragments only, and an independent check found the gap. The note intro is hidden on all five pages, as on 02 to 05. This adds visible information, so it is judgment-relevant.",
    "comparable_scope": "All five named reasons checked. Only 06 lacked the note. The 06 node now matches 02 in every destination for the shared-note fragments."
   }
  }
 ]
}