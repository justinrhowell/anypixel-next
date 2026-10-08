# AnyPixel Next — critical specification review

## Round status

**Round 1 — Baseline, 2026-10-08.** No prior companion review exists for this proposal. This is a self-review of the product, technical, research, roadmap, and example-pack documents against AnyPixel commit `a72d884165f56efb07d4f4f04a4bf7b22c0e0029`; it is not independent user validation. Document classes: product strategy, implementation architecture, extension contract, and memory design.

## Executive summary

The proposal is specific enough to start a new-repository vertical slice. Its public extension API should remain provisional until complete artifact schemas and real-host integration evidence exist. The largest remaining uncertainty is whether the workflow adds enough design value over an ordinary agent with a good brief to justify its runtime.

## Rollups

| Measure | Score | Delta |
| --- | ---: | --- |
| Overall readiness | **87/100** | Baseline |
| Quality | **91/100** | Baseline |
| Completeness | **80/100** | Baseline |

These score the proposal's implementation readiness, not a working product's release readiness. The new runtime and new repository do not yet exist. Quality is `(15 + 20 + 12 + 12) / 65`; completeness is `(16 + 12 + 12) / 50`, rounded to whole percentages.

## Core scorecard

| Dimension | Score | Weight | Points | Delta |
| --- | ---: | ---: | ---: | --- |
| Scope clarity and decision usefulness | 5/5 | 15 | 15 | Baseline |
| Completeness of behavior, flows, and edge cases | 4/5 | 20 | 16 | Baseline |
| Contract and schema specificity | 4/5 | 15 | 12 | Baseline |
| Repo alignment and current-state accuracy | 5/5 | 20 | 20 | Baseline |
| Technical feasibility and dependency realism | 4/5 | 15 | 12 | Baseline |
| Sequencing, verification, and operational readiness | 4/5 | 15 | 12 | Baseline |

## Gap tracker

| ID | Priority | Status | Remaining gap | Points recoverable |
| --- | --- | --- | --- | ---: |
| G01 | P1 before public API beta | Open | Artifact/request schemas and browser payload contract are not executable specifications yet | 7: contracts 3, behavior 4 |
| G02 | P1 before claiming integrations | Open | Preferred SDK/browser design lacks an actual two-host compatibility spike and tested dependency pins | 3: feasibility |
| G03 | P2 before usefulness claims | Open | Evaluation plan lacks completed task fixtures, calibrated reviewer examples, and pilot observations | 2: sequencing |
| G04 | P2 before public publication | Open | Package/name ownership and per-file transfer/licensing inventory remain launch work | 1: sequencing |

There is no P0 finding. “Open” means evidence or implementation-design work remains, not that the document falsely claims completion. These gaps block later gates, not the authorized creation of this design specification or the start of milestone 0.

## Detailed findings

### G01 — finish the wire contract before inviting plugin compatibility commitments

The [technical specification](TECHNICAL-SPEC.md#L158) explicitly describes most envelopes in a field table and defers browser-specific payload details. The [pack schema](pack.schema.json#L1) is concrete, but operation requests, project configuration, decisions, captures, and check results are not machine-validated yet. The SDK pseudotypes intentionally use placeholder interfaces.

This matters because independently authored observers and checks must agree on more than artifact-kind names: source coordinate systems, screenshot scaling, unsupported state, scope matching, and partial-result semantics must be testable. Define the minimal schemas against one captured fixture; derive SDK types and reject malformed plugin results through the same validator. Include a fake observer and check that run without the browser. Do not add fields for hypothetical integrations.

The [failure table](TECHNICAL-SPEC.md#L196) covers the major outcomes, but fixture-level evidence is needed for cancellation during artifact publication and for a conflicting concurrent decision write. That accounts for the remaining behavior points as well as schema points.

### G02 — protocol availability does not prove target-host support

The [SDK choice](TECHNICAL-SPEC.md#L26) is based on current official documentation. The proposal correctly treats compatibility as a [milestone 0 gate](ROADMAP.md#L13). It has not demonstrated the selected SDK line's tool/image behavior, cancellation, or project-root handling in two real hosts.

The old [handwritten MCP dispatcher](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/tools/anypixel-mcp/server.js#L543) is evidence for changing the boundary, not a compatibility test for the replacement. Record exact versions and fixtures before publishing support claims. Do the same for the optional browser package's installation footprint and capture consistency. A source-only fallback should not be counted as successful browser integration.

### G03 — useful expertise remains a hypothesis

The [product targets](PRODUCT-SPEC.md#L141) and [evaluation design](ROADMAP.md#L41) are explicit and appropriately distinguish preferences, task success, and memory retrieval. However, neither the held-out briefs nor anchored examples of good and poor critique have been executed or calibrated with reviewers.

The old [Study B limitations](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/docs/study/study-b/FINDINGS.md#L85) prevent using its measurements as proof of the new promise. Before claiming expert assistance or improved quality, run the simpler-agent baseline, publish disagreements and failures, and observe a second task with real users. If a skill and brief suffice, the plan's simplification branch should be taken seriously.

### G04 — a new open-source release requires actual release assets

The [licensing proposal](PRODUCT-SPEC.md#L131) is honest about its status. Existing [package metadata](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/package.json#L5) is private and UNLICENSED; the [example manifest](examples/dense-product-ui/pack.json#L9) intentionally retains that status. A design-spec recommendation does not create distribution rights for every asset in the old tree.

Complete the [transfer inventory](ROADMAP.md#L90), choose an available package/repository identity, and add actual license and notice files in the new repository before publication. These are finite launch prerequisites, not reasons to make the local runtime depend on a company service.

## Focus checks

### 1. Internal consistency and command operability

The five CLI/MCP operations agree across the architecture and sample skill. Administrative commands are separated from runtime tools. All are labeled proposed; none is claimed to run in the current beta. The example manifest validates against the supplied schema and its declared files exist. The 144-run evaluation arithmetic is correct. No current application code was changed for this proposal.

Remaining operability limitation: SDK methods and most request schemas require implementation, tracked in G01. The example demonstrates editable content and a manifest contract; it does not demonstrate a working extension runtime.

### 2. Producer → carrier → consumer

| Value | Producer | Carrier | Consumer | Assessment |
| --- | --- | --- | --- | --- |
| Evidence hash and artifact ID | Observer publication | Capture inventory, then review references | Reader verification and exported report | Defined in prose; executable envelopes needed under G01 |
| Coverage/check status | Dispatcher and check result | Review check results and coverage | HTML/JSON plus CLI exit semantics | Explicit missing/error distinction; fixture proof pending |
| Decision key and acceptance | User-supported record operation or direct file edit | Markdown frontmatter and context snapshot | Scoped context selection and host explanation | Explicit declared-conflict behavior; no claimed semantic oracle |
| Pack/extension version | Manifest and module registration | Lock inventory, context, capture, review | Doctor output, report provenance, eval reproducibility | Defined; package integration evidence pending |
| Evaluation time/cost/interventions | Evaluation runner and observed sessions | Per-run eval manifests | Published comparison report | Kept outside mandatory runtime telemetry |

### 3. Extension and memory boundaries

First-party and external observers/checks share the proposed interface. Data-only packs do not execute code; native plugins are trusted code, and subprocess isolation is explicitly not a sandbox. Decision acceptance is labeled an attestation, not cryptographic proof of human approval. Scope, expiry, supersession, conflicting keys, and project isolation are specified. Arbitrary semantic contradictions remain host/human work.

### 4. Current versus proposed status

The local [audit](RESEARCH.md#L13) distinguishes existing adapters, memory, and evidence handling from proposed replacement boundaries. No hosted app, registry, public API, pilot success, compatibility result, or new release is represented as completed. Source comparisons are identified as documentation reviews, not product benchmarks. Optional integrations are not prerequisites hidden inside the initial scope.

## Prioritized issues and path to 100

1. **G01:** Complete the minimal request/artifact schemas from one browser fixture; derive SDK types; validate malformed output, partial publication, cancellation, and concurrent decision fixtures. Recover up to 7 points.
2. **G02:** Run the two-host/browser spike and commit exact dependency versions, compatibility records, and setup footprints. Recover up to 3 points.
3. **G03:** Author the held-out task set and reviewer anchors; run a small baseline comparison and the repeated-user pilot before stronger usefulness claims. Recover up to 2 points.
4. **G04:** Finalize package ownership, contributor-facing release assets, and the transfer/notice inventory. Recover up to 1 point.

These are the four recommended next actions. Later reviews should retain these IDs and award points only when the corresponding artifacts or evidence change. A 100-point specification score would still not replace implementation tests and release validation.

## Verification performed for this specification

Validated the manifest against JSON Schema Draft 2020-12; accepted the sample pack and three valid semantic-version variants; rejected unsupported-version, malformed-ID, unknown-field, two invalid semantic-version, and four unsafe-path variants. Checked manifest file existence, unique entry IDs, the sample skill's name/directory agreement and self-contained references, local Markdown links, and file/line targets. No runtime integration, paid model evaluation, or user research was run. No existing release tests were claimed as validation of the unimplemented new product.
