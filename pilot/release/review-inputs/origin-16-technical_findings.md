{
  "task": "independent-policy-procedure-amendment-verification",
  "reviewed_checkout": "/private/tmp/policy-procedure-site-20261107",
  "baseline_commit": "0c5e9e55bc02e28977edad9cec45054f9090ea66",
  "status": "complete_no_open_technical_findings",
  "open_source_findings": [],
  "findings": [
    {
      "id": "V001",
      "severity": "high",
      "title": "Rewriting earlier content broke pinned source hashes during response import",
      "locations": [
        "pilot/build.mjs",
        "pilot/src/resume.mjs",
        "pilot/release/content.json"
      ],
      "observed": "The build inserted release metadata and serialized earlier content.json files while workflow.resume_sources retained SHA-256 pins to the original bytes. The default importer therefore rejected an otherwise valid earlier source.",
      "correction": "Publish byte-identical original-content.json files and point the canonical import specifications at those immutable files. Retain display content.json release metadata and cached-app checks.",
      "status": "fixed_actual_built_bytes_independently_verified",
      "verification": [
        "Actual generated original-content.json bytes match both pinned SHA-256 hashes",
        "Actual rendered public/coding release, app embedded rendered ID and cache-busting hashes agree with current source"
      ]
    },
    {
      "id": "V002",
      "severity": "high",
      "title": "Import rebased old direct judgments and comparisons across a semantic revision",
      "locations": [
        "pilot/src/resume.mjs"
      ],
      "observed": "A synthetic earlier C03 answer and its dependent S1582_UNN_oppose_01 answer imported as current direct Yes after a new C03 semantic revision. Comparison/summary rebasing could also retain an earlier winner when independent Yes answers kept Both.",
      "correction": "Compare own and ancestor semantic revisions during import. Preserve stale judgment/completion bases and invalidate comparison/summary bases for affected values.",
      "status": "fixed_independently_verified",
      "verification": [
        "legacy-session import retains semantic staleness even when other arguments keep Both",
        "a claim scope revision stales only that claim and descendants, preserving votes, order and history"
      ]
    },
    {
      "id": "V003",
      "severity": "medium",
      "title": "A future prerequisite edit could reorder an imported earlier session",
      "locations": [
        "pilot/src/core.mjs",
        "pilot/src/resume.mjs"
      ],
      "observed": "With a synthetic later C0-to-U prerequisite, an earlier seed-1 order changed from C0,U,C1 to U,C0,C1 on import, also changing later argument draws. The current approved graph has no edits.",
      "correction": "Retain explicit historical order policies, preserve the verified source policy as sourceOrderPaths, and validate it against current or registered historical paths.",
      "status": "fixed_independently_verified",
      "verification": [
        "a later prerequisite correction preserves the verified earlier within-bill order on import",
        "approved source preserves every baseline dependency and literal generic question stem"
      ]
    },
    {
      "id": "V004",
      "severity": "high",
      "title": "Import dropped human mapping dispositions",
      "locations": [
        "pilot/src/resume.mjs"
      ],
      "observed": "The copied-state field list omitted mappingDispositions. A synthetic earlier unresolved argument with a rejected prerequisite consequently changed from pending to derived No after import.",
      "correction": "Copy optional mappingDispositions with overlap checks while preserving the source state.",
      "status": "fixed_independently_verified",
      "verification": [
        "earlier-session import preserves unresolved and continued human mapping dispositions"
      ]
    },
    {
      "id": "V005",
      "severity": "test_failure",
      "title": "Claim-label normalization made the parity mutation test a no-op",
      "locations": [
        "pilot/test/release.test.mjs"
      ],
      "observed": "Replacing raw a.pro_html no longer changed rendered text after claim-link normalization; the expected parity rejection was therefore absent. The updated suite initially failed 1 of 43 tests.",
      "correction": "Mutate the actual represented support body and assert that the mutation changed the rendered text before checking rejection.",
      "status": "fixed_independently_verified",
      "verification": [
        "Latest complete existing Node suite: 44 tests passed, 0 failed",
        "Independent synthetic parity mutations rejected changed support, response, shared evidence, statement, comparison and reference text"
      ]
    },
    {
      "id": "V006",
      "severity": "medium",
      "title": "Stale standalone claims exposed a button whose target details did not exist",
      "locations": [
        "pilot/src/app.jsx:181"
      ],
      "observed": "Own-node scope revisions can stale standalone claims. The reassessment banner invoked openEarlierClaims even though its ref is only rendered for deps.length > 0. Eight retained claims have no dependencies: C11, C19, S2_C04, S2_C05, S2_C06, S2_C09, S2_C36, S2_C37.",
      "correction": "Render the earlier-claims button only when deps.length > 0. Preserve the reassessment message and earlier answer.",
      "status": "fixed_source_conditional_verified",
      "verification": [
        "Inspected the explicit deps.length > 0 condition in the updated reassessment banner",
        "No live browser or account interaction performed"
      ]
    }
  ],
  "confirmed_invariants": {
    "arguments": 503,
    "values": 48,
    "catalog_ids": 567,
    "shared_claims": 152,
    "new_dependency_edges": 0,
    "new_merges": 0,
    "graph_and_path_objects_match_baseline": true,
    "active_and_historical_id_lists_match_baseline": true,
    "premise_acceptance_never_automatically_accepts_argument": true,
    "unresolved_and_continued_dispositions_do_not_force_final_no": true,
    "human_dispositions_do_not_overwrite_stored_votes": true,
    "edited_mapping_note_requires_new_review": true,
    "retained_judgment_claims": 24,
    "literal_shared_claim_argument_and_comparison_prompts_match_baseline": true,
    "approved_statement_clarity_change_ids": [
      "C11",
      "HR5408_C07",
      "HR1834_C15"
    ],
    "semantic_revisions": {
      "claim_revisions": 21,
      "argument_revisions": 1,
      "affected_direct_argument_answers": 53,
      "unaffected_direct_argument_answers": 450,
      "only_expected_nodes_stale": true,
      "original_synthetic_state_order_and_history_unchanged": true
    }
  },
  "checks": {
    "existing_suite": {
      "tests": 44,
      "passed": 44,
      "failed": 0,
      "command": "npm test --prefix /private/tmp/policy-procedure-site-20261107/pilot",
      "log": "output/existing-suite.tap"
    },
    "independent_source_suite": {
      "tests": 11,
      "passed": 11,
      "failed": 0,
      "skipped_build_checks": 0,
      "command": "VERIFY_BUILT_IMPORTS=1 node --test --test-reporter=tap synthetic.test.mjs",
      "log": "output/synthetic-tests.tap"
    },
    "coordinator_note_review": {
      "passed": true,
      "evidence": "output/note-review-check.json"
    },
    "actual_built_artifacts": {
      "status": "passed",
      "public_pages": 48,
      "arguments": 503,
      "immutable_import_sources": [
        {
          "url": "./s1582-pilot/original-content.json",
          "sha256": "ac8ecb1de171946125807261b2682378b1f2c282525e4b43a63c1a6bb1858362",
          "version": "s1582-pilot-20261106-8f9bb0aef314"
        },
        {
          "url": "./other-bills/original-content.json",
          "sha256": "60f3b93e3e09c42a23be3cffdc3b610bf40ad1c67025e0e0eee136f51e849a8c",
          "version": "other-bills-20261107-fbdcb77ade6f"
        }
      ],
      "compiled_app_rendered_id_matches": true,
      "app_and_style_cache_hashes_match": true,
      "evidence": "output/artifact-summary.json"
    },
    "actual_canonical_selective_staleness": {
      "status": "passed",
      "claim_revisions": 21,
      "argument_revisions": 1,
      "stale_claims": 21,
      "stale_arguments": 53,
      "unchanged_arguments": 450,
      "evidence": "output/artifact-summary.json"
    },
    "final_mobile_style_and_rendered_hash_followup": {
      "status": "passed",
      "source_commit": "c989b309fe5b4a308c8cfded32357d3dd14a8d1b",
      "changed_files": [
        "pilot/release/parity.json",
        "pilot/rendered-release.mjs",
        "quartz/styles/custom.scss"
      ],
      "previous_rendered_id": "rendered-da7d0f02c5cb6c6cf215",
      "manually_recomputed_rendered_id": "rendered-3f12b711f7191840ebcb",
      "source_parity_public_release_and_built_coding_content_match": true,
      "added_hash_inputs": [
        "public-view.mjs",
        "../quartz/styles/custom.scss"
      ],
      "in_memory_input_sensitivity": {
        "public-view.mjs": "rendered-0633cee81b43661df3eb",
        "../quartz/styles/custom.scss": "rendered-07501d0fca8c686c472b"
      },
      "css_exact_append_verified": true,
      "compiled_css": "index-8e3db7b6.css",
      "compiled_media_max_width_px": 800,
      "compiled_selector": ".explorer.collapsed .explorer-content",
      "compiled_declaration": "display:none",
      "content_and_app_semantics_storage_graph_fingerprints_unchanged": true,
      "source_tree_clean": true,
      "test_rerun": {
        "existing_suite_passed": 44,
        "independent_suite_passed": 11,
        "failures": 0,
        "skipped": 0
      },
      "evidence": "output/artifact-summary.json"
    }
  },
  "limitations": [
    "No website checkout mutation by this verifier; root owns implementation, builds and final integration.",
    "No Firebase configuration, credentials, account data, private QA, research records, invitations or Qualtrics accessed.",
    "State tests used synthetic fixtures; no server or emulator persistence test was run by this verifier.",
    "No live browser interaction or production deployment verification was performed by this verifier.",
    "Final prose/source-binding review is assigned separately to a fresh verifier; this report does not claim complete factual revalidation of the corpus."
  ],
  "reviewed_release": {
    "content_id": "approved-20261107-7a74fc8060c9a7d72b0d",
    "procedure_id": "procedure-20261107-0efe33af2525304b",
    "mapping_id": "mapping-fb251640bf69056b",
    "rendered_id": "rendered-3f12b711f7191840ebcb"
  },
  "reviewed_record_version": "eight-bills-20261107-4fcde0b566e0",
  "reviewed_source_sha256": "d55ed84937d1d777d30a74e4167f1a0051b841e4fbbec8358be0b488912bfc93",
  "source_fingerprints": "output/artifact-summary.json",
  "interpretation_correction": {
    "initial_invariant": "Every original retained claim.statement must remain byte-identical",
    "correction": "Approved clarity scope includes claim statements; exact-stem preservation governs the generic Yes/No prompts and comparison question. The final test compares the literal legend templates to baseline.",
    "authority": "Parent clarification after full approved-scope review",
    "separate_prose_audit": "Parent reports a separate fresh Sol verifier inspected all 2421 changed leaves including every changed statement/scope field; two drift fixes were returned to Opus and rechecked. This technical verifier does not independently claim that prose audit."
  },
  "reviewed_source_commit": "c989b309fe5b4a308c8cfded32357d3dd14a8d1b"
}
