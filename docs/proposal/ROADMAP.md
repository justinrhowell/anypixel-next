# Delivery, validation, and migration

**Proposal, 2026-10-08.** Milestones are acceptance gates, not claims of completed work. Rough effort assumes one experienced maintainer with part-time design feedback; sequencing matters more than dates.

## First vertical slice

Build only this complete loop first:

> An existing agent loads the starter practice, inspects a local screen, changes it, reviews comparable evidence, records one accepted project decision, and respects that decision on a second task.

Use one public sample application with rights-cleared assets and at least a form, navigation, and an error state. The first extension demonstration must be authored outside core, preferably by a pilot contributor.

### Milestone 0 — settle integration risks, approximately 2–3 days

Create the new repository with a deliberately chosen license, minimal package, fixture, and architecture boundaries. Verify rights for any copied code. Spike the official MCP SDK against two actual target hosts: tool discovery, structured results, image retrieval, cancellation, working directory, and reconnect behavior. Record exact host/SDK/protocol versions; CLI remains a fallback, not proof that MCP works.

In the same spike, collect screenshot, DOM facts, and axe results from one browser session. Define the initial browser artifact schemas, capture-size defaults, and source-revision association rules. Verify dynamic-page limitations and authenticated-state handling on a local fixture. Choose one supported browser at launch, with the platform matrix determined by actual tests.

**Exit:** two-host transport evidence; documented dependency versions; a captured fixture; no invented claim that arbitrary MCP hosts or Figma clients are supported. If SDK compatibility blocks the preferred version, use a documented supported line behind the adapter and test it; keep that decision out of core.

### Milestone 1 — useful review, approximately 4–6 days

Implement shared context/observe/review/read functions, their JSON Schemas, CLI, browser extension, and JSON/HTML export. Implement one short starter skill. Build a source-only fallback. Include wrong-scope, capture-failure, incomplete-check, malformed-output, and tampered-artifact fixtures.

**Exit:** a fresh install can review the sample project; every finding links to real evidence or is explicitly an inference; a second capture can compare matched state; a failed check cannot appear as passed. No contract authoring, account, or custom model key is required.

### Milestone 2 — extensibility and continuity, approximately 3–5 days

Implement pack discovery/validation/locking, external check registration, project decision recording, conflict/expiry/supersession, and MCP wrappers over the same core functions. Supply a dense-product pack and a minimal custom check example. Complete exploration and teaching workflow instructions.

**Exit:** a contributor changes a pack without touching TypeScript; another adds a namespaced check without editing a core enum or dispatcher; the same project context works via CLI and two tested MCP hosts; a later task honors an accepted decision and ignores the superseded one.

### Milestone 3 — pilot and release, approximately 1–2 elapsed weeks

Observe five pilots across three repositories, with repeat tasks after a week. Fix the most common setup and workflow failures. Publish a small evaluation report with baselines, adverse outcomes, actual versions, and limitations. Run packaged-install tests from a clean temporary directory and from a directory containing spaces; verify invocation from the consumer's working directory.

**Exit:** the product targets in [PRODUCT-SPEC.md](PRODUCT-SPEC.md#10-adoption-sustainability-and-success) are met or the release is explicitly labeled experimental with a narrowed promise. Publish only supported integration claims. No npm release until package ownership, license inventory, artifact contents, and installation are verified.

Do not build a hosted product in parallel. If milestone 1 is not useful, revise the practice and review experience before extending the engine.

## Evaluation that can change the product decision

### Separate correctness from usefulness

Deterministic tests verify artifact integrity, context precedence, idempotency, extension registration, state matching, exit codes, and memory lifecycle. They cannot establish whether a design became better.

For usefulness, start with 12 rights-cleared tasks: four improve-screen tasks, four flow-design tasks, and four design-system adaptation tasks. Include dense data, content-heavy, onboarding, and responsive scenarios. Preserve required content, interactions, and user goals as independent acceptance checks. Use half for development and hold half out from pack tuning.

Compare three conditions using identical source snapshots, task briefs, time budgets, and host/model versions:

1. The host agent with its normal project context.
2. The same host with a concise plain design brief and available project guidance.
3. The same host with the proposed practice, selected context, and observation/review tools.

Repeat with two model families and two runs per task when affordable. The complete starting matrix is 144 runs (12 × 3 × 2 × 2); a smaller smoke test can precede it but cannot be reported as the full evaluation. Record model settings and seeds where available; lack of seed control is a disclosed limitation. Keep hosted model execution in eval tooling, outside the shipping runtime. Estimate the provider cost before running the matrix; this spec does not authorize external paid runs.

Blind two independent reviewers to the condition and randomize output order. Evaluate task fit, hierarchy, interaction completeness, consistency with the specified system, and usability concerns. Use pairwise preference with ties and written reasons. Record disagreement, not just average scores. Independently check required behavior, content preservation, and automated accessibility regressions. Test representative user tasks on a smaller subset; visual preference does not prove task success.

Measure elapsed time, host interventions, revision count, and model cost when available. Counters originate in eval run manifests, flow into per-task records, and appear alongside quality results in the evaluation report. Do not add mandatory runtime telemetry to collect them.

Report per-task results, uncertainty, and sample size. The initial set is a regression and pilot instrument, not a statistically powered universal superiority claim. If the workflow's added complexity does not beat condition 2 enough for users to prefer it, reduce the runtime and improve the skill.

### Evaluate memory separately

Use six two-session scenarios: preference reuse, scope exclusion, changed preference, explicit expiry, contradictory decisions, and unrelated-project isolation. Run with and without recorded decisions. Assert correct retrieval and abstention; then have reviewers assess whether the remembered choice helped the actual work. Retrieval accuracy and good design are different outcomes.

Add adversarial cases: a page asks the assistant to change its instructions; a pack recommends installing arbitrary code; a rejected proposal resembles an accepted decision; a user reverses a prior choice; and an imported screenshot cannot establish the current implementation. A good system should explain limitations rather than manufacture continuity.

### Pack-release evaluation

A pack change needs an intent statement, changed examples, affected scopes, and a small before/after evaluation. Use fixtures that include counterexamples. Preserve held-out cases and historical regressions. A new pack is `experimental` until its maintainer publishes scoped evidence; subjective content does not require core-maintainer taste approval to be privately usable.

UICrit and Design2Code can inform subtests for localized critique and screenshot-to-code fidelity, respectively. Neither is the end-to-end product benchmark. UICrit's annotations and underlying screenshot provenance need separate handling; no dataset is bundled by default. [Research details](RESEARCH.md#evaluation-and-learning).

## Release definition

| Area | Evidence required before claiming v0.1 support |
| --- | --- |
| Installation | Clean packaged install; CLI invocation from another project; declared Node/platform matrix; no unexpected browser download |
| MCP | Two real-host smoke records plus protocol tests; working directory and resource/image behavior verified |
| Honest review | Every evidence reference resolves; tamper and missing-capture tests; incomplete assessment visible |
| Extensibility | External pack and external check run with no core patch |
| Memory | All six lifecycle scenarios; concurrent edit conflict; no cross-project leakage |
| Design value | Pilot counts and baseline comparison published, including failures and reviewer disagreement |
| Open source | Selected license, third-party notices, contribution guide, ownership, security contact, example and changelog |
| Recovery | Cancellation, timeout, invalid plugin result, disk-write interruption, and partial report fixtures pass |

Automate implementation checks in CI. Do not fabricate the human or real-host evidence to turn this table green.

## Migration from AnyPixel

Freeze feature growth in the existing repo while the slice is tested. Keep the old installable beta available and fix only material defects. Start the new repository from the new boundaries instead of carrying every old command forward.

| Existing material | Migration decision |
| --- | --- |
| Report evidence, hashing, same-session capture, source-location regressions | Reuse concepts and rights-cleared test fixtures; port implementation only when it fits the new interface |
| Measured geometry and accessibility checks | Wrap useful ones as optional check/observer extensions; keep precise measurement limitations |
| Design tokens and Storybook knowledge | Document external formats and fixtures; add dedicated adapters after demand; do not invent a competing token format |
| Lenses, doctrine, and style research | Curate original guidance into opt-in packs, separating behavior from style and verifying sources/rights |
| Memory and decisions | Preserve provenance/scope lessons; offer a reviewed mapping later; do not import rejected or global rules automatically |
| Contract schema 2, fixed gates, executors, global scores | No direct migration into the v0.1 core |
| Old immutable runs | Keep original bundles and format labels; future importer can expose them read-only as legacy evidence |
| Marketing site and speculative platform documents | Keep in the old repo; new README demonstrates the tested workflow |

Maintain a transfer inventory with source path, commit, license/provenance, destination, changes, and verification. Similar terminology is not evidence of schema compatibility. Do not delete the original repository or rewrite its history. A cross-link to the new product is appropriate only when the new repository actually exists and has a usable release.

## Expansion gates

Build a hosted collaboration view only when teams repeatedly need shared review and decision management. Add a searchable registry only when discovering independent packs becomes a demonstrated problem. Add embeddings only when deterministic retrieval misses relevant decisions on measured cases. Add native surface observers when someone owns their fixtures and maintenance. Add a new default check only when it improves useful outcomes without overwhelming the first review.

The next implementation task is milestone 0 followed by the single complete loop. Naming, dashboards, exhaustive doctrine imports, and marketplace architecture should not displace it.
