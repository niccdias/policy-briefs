{
 "note": "Supplement to finding_ledger.json and supplements 1 and 2. Adds one implementation finding. No content change.",
 "new_findings": [
  {
   "finding_id": "CLT009",
   "origins": [
    {
     "source": "root message relaying the independent technical verifier",
     "locator": "CLT009"
    }
   ],
   "records": [
    "release"
   ],
   "class": "confirmed_defect",
   "status": "open",
   "disposition": "corrected",
   "rationale": "I agree. The independent technical verifier found that the new catalog patch branch accepted a retirement_reason patch on an active catalog entry as the only correction. Only retired entries show that field (public-view.mjs line 59), so the patch could close a finding without changing any displayed text. This is an implementation defect in the publication gate, not in page prose. The correction is the gate code bound to the hash below.",
   "source_locators": [
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs line 46: requireThat(record.retired===true, ...) for catalog patches",
    "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs sha256 0e60135d668d841b1976b246940a93dc738765a9d47f718daa5c99eadb65bdfb"
   ],
   "reading_limit": "I read the finding as root relayed it and line 46 of the corrected gate, and I confirmed the gate file hash. I did not read the rest of the gate code or run the tests. The verifier's 25th regression is reported as rerunning.",
   "patch_ids": [
    "IMPL-GATE"
   ],
   "implementation_patch": {
    "path": "/private/tmp/policy-procedure-closure-site-20261107/pilot/publication-gate.mjs",
    "sha256": "0e60135d668d841b1976b246940a93dc738765a9d47f718daa5c99eadb65bdfb"
   },
   "comparable_scope": "As reported by root: a regression test adds an active-entry case that must be rejected, and root's 15 gate tests pass. The supplement 2 patches CPS2-0001 and CPS2-0002 target retired entries only.",
   "author": "Opus 5.5 High",
   "verification": null
  }
 ]
}