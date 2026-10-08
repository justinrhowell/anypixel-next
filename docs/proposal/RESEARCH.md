# Research and repository evidence

**Research date:** 2026-10-08. **Method:** inspection of the current repository, primary product/protocol documentation, original research, and maintainers' published guidance. Product comparisons are documentation reviews, not hands-on benchmarks. Sources may change after this date. Proposed architecture and success thresholds are our decisions, not findings claimed by those sources.

## Main conclusions

1. A portable workflow is a plausible product surface. Open skill formats and MCP reduce the need for a proprietary agent host. They do not guarantee identical behavior or compatibility across clients.
2. Editable expertise and executable tooling need separate boundaries. A designer should change an example without entering the native-plugin trust model.
3. Evidence is a valuable differentiator only when it improves decisions. More findings and better internal scores do not establish better design.
4. Useful memory requires scope, change handling, and abstention. Storing more conversation is not an improvement strategy by itself.
5. Open source needs usable licenses, ownership, contribution paths, and examples. A public repository alone does not establish an extensible ecosystem.

## Local evidence

Baseline commit: `a72d884165f56efb07d4f4f04a4bf7b22c0e0029`. Links below are pinned to that revision so later changes do not erase the audit basis.

| Evidence | What it establishes | Design consequence |
| --- | --- | --- |
| [Package metadata](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/package.json#L2) | Installable CLI is marked private and UNLICENSED; its description centers contracts and evaluation | Choose licensing and contributor ownership deliberately before new publication |
| [Law loader](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/tools/lib/load.js#L11) | Foundation and doctrine directories are tied to the installation; the loader imposes foundation status | Put design guidance in externally resolvable packs; retain evidence honesty as an engine invariant |
| [Contract validation tables](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/tools/anypixel-contract/lib/referential.js#L29) | Mandatory gating channels, closed check mappings, and machine-channel set encode policy in implementation | Separate user-selected policy from an open extension registry |
| [Executor mapping](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/tools/anypixel-run/lib/policy.js#L26) | Several channels resolve to fixed executors, while others have no executor | Extension authors must register behavior without modifying a central channel map |
| [Report implementation](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/tools/anypixel-lint/lib/report.js#L63) | New-directory exports include structured results and SHA-256 artifact inventory | Preserve immutable evidence, provenance, and partial-coverage honesty |
| [MCP implementation](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/tools/anypixel-mcp/server.js#L543) | Handwritten JSON-RPC dispatch and protocol-version response | Use the official SDK behind a thin adapter and verify actual host interoperability |
| [Existing memory](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/tools/anypixel-memory/index.js#L239) | Scoped recall, expiry, and authority handling already exist | Preserve these lessons while reducing the initial user-facing model to decisions |
| [Study B results](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/docs/study/study-b/FINDINGS.md#L30) and [limitations](https://github.com/justinrhowell/anypixel/blob/a72d884165f56efb07d4f4f04a4bf7b22c0e0029/docs/study/study-b/FINDINGS.md#L85) | Behavioral constraints affected measured structure in a small, self-scored experiment; human preference was not evaluated | Keep concrete constraints as optional guidance; test usefulness independently |

This is an architectural audit, not a claim that the old system has no modularity or useful capabilities. In particular, memory, adapters, and provenance are already present. The proposal changes their boundaries and the default experience.

## Workflow and integration landscape

| Primary source | Observed capability or pattern | Implication and limit |
| --- | --- | --- |
| [Design OS repository](https://github.com/buildermethods/design-os) | A guided path from product planning through design system and section design to implementation handoff; MIT-licensed repository | Borrow explicit intent and reusable artifacts. Our proposed wedge is continuity while improving an existing product, rather than requiring a complete planning sequence |
| [Superdesign repository](https://github.com/superdesigndev/superdesign) | The original open-source IDE extension is described as no longer actively maintained; README directs users to the web product and a skill | Variant exploration is useful. Do not mistake an old public extension for the current product's maintained open runtime |
| [Figma MCP documentation](https://developers.figma.com/docs/figma-mcp-server/) | Design context, Code Connect, and native canvas writing are documented; clients must be in Figma's catalog | Integrate through an already supported host or explicit artifact import. A custom direct client is an access dependency, not a guaranteed MVP feature |
| [Pencil: design as code](https://docs.pencil.dev/core-concepts/design-as-code) | Text-based `.pen` artifacts fit Git workflows | Preserve user-owned, diffable artifacts. This source does not establish that the entire Pencil product is open source or that its format should become our internal format |
| [Agent Skills specification](https://agentskills.io/specification) | A skill is a directory centered on SKILL.md, with metadata and optional references/assets/scripts; progressive loading is recommended | Use the existing instruction format. Our data-only packs intentionally omit executable scripts; native tools have a separate trust boundary |
| [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28) and [official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | Protocol separates tools/resources/prompts; SDK documents a current v2 line and optional transports/features | Reuse protocol implementation; test client compatibility. Do not assume newer optional extensions are available in every host |

**Positioning inference:** the opportunity is a portable, evidence-informed practice that a team can teach and modify. The documentation review does not establish an uncontested market or demand for a new framework. Pilots and baseline comparisons must decide whether this product earns its complexity.

## Extension and evidence patterns

| Primary source | Relevant observation | Applied decision |
| --- | --- | --- |
| [ESLint plugin documentation](https://eslint.org/docs/latest/extend/plugins) | Plugins expose ordinary objects containing metadata, configurations, rules, and processors | Prefer namespaced registration and a small public interface over a centrally edited domain enum |
| [shadcn registry documentation](https://ui.shadcn.com/docs/registry/getting-started) | A documented schema supports distributing project-owned components and other code; registries need not be tied to one framework | Favor inspectable, independently distributed packs. Do not build a mandatory central marketplace |
| [DTCG technical reports](https://www.designtokens.org/technical-reports/) | The standards index lists 2025.10 as stable, published 2025-10-28 | Reuse the token standard in a later dedicated importer; do not freeze an old editor's draft or invent another token ontology |
| [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer) | Traces connect actions with DOM snapshots, screenshots, source, and diagnostics | Use a maintained browser tool and keep evidence tied to an observation session. This does not guarantee atomic snapshots of a changing app |
| [Storybook accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing) | Axe-based results distinguish violations, passes, and incomplete checks | Preserve incomplete assessment; consume existing tool output where possible rather than rewriting its checks |
| [W3C evaluation-tool guidance](https://www.w3.org/WAI/test-evaluate/tools/selecting/) | Automated tools assist evaluation but cannot determine all accessibility aspects | Report tested scope and human-review needs; never label an interface universally accessible because a tool found no violations |

## Design expertise and community knowledge

| Primary source | Relevant observation | Applied decision |
| --- | --- | --- |
| [NN/g: design critiques](https://www.nngroup.com/articles/design-critiques/) | Critique needs scope and agreed objectives, and works as a conversation about improvement | Tie recommendations to task goals, explain tradeoffs, and preserve disagreement rather than issuing aesthetic commands |
| [GOV.UK contribution criteria](https://design-system.service.gov.uk/community/contribution-criteria/) | Components need evidence of usefulness, usability, consistency, and versatility; tested contexts are made explicit | Require examples, counterexamples, scope, and evidence before calling community guidance tested |
| [Anthropic: effective agents](https://www.anthropic.com/engineering/building-effective-agents) | Composable patterns can suffice; frameworks may obscure behavior and encourage unnecessary complexity | Let the existing host run the agent loop. A new orchestrator needs its own demonstrated use case |
| [Anthropic: context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Focused tools, selective context, and just-in-time retrieval are emphasized over stuffing all guidance into a prompt | Load relevant practice entries and decisions, expose provenance and omissions, and measure the context budget |
| [Open Source Guides: governance](https://opensource.guide/leadership-and-governance/) | Maintainer roles can include documentation and community expertise; responsibilities should be visible | Give design contributors ownership paths and keep core RFCs separate from ordinary content edits |
| [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) | Defines reuse conditions, attribution/notice requirements, and patent licensing | Recommend it for new original work, with provenance and separate handling of third-party material; this document does not relicense existing files |

## Evaluation and learning

| Primary source | What it supports | What it does not establish |
| --- | --- | --- |
| [Anthropic: agent evaluations](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | Combine deterministic, model-based, and human assessment; calibrate judgments and track outcomes | A model-generated rubric score alone is not proof of design quality |
| [UICrit dataset](https://github.com/google-research-datasets/uicrit) | Localized critiques and ratings for 1,000 mobile UIs; current CSV identifies human/model/both comment sources and links a CC BY 4.0 license | Repository is archived. Underlying RICO screenshots require their own provenance review; the corpus is not a complete web-product workflow benchmark |
| [Design2Code paper](https://arxiv.org/abs/2403.03163) | Evaluates screenshot-to-code reconstruction on 484 webpages with automatic and human evaluation | Reconstruction fidelity is not original design quality, interaction success, or project-memory usefulness |
| [LongMemEval-V2 paper](https://arxiv.org/abs/2605.12493) | A May 2026 work-in-progress benchmark examines accumulated environment experience, changing state, and workflow knowledge, with accuracy/latency tradeoffs | Results concern agent memory in its benchmark, not better design. They motivate lifecycle and abstention tests rather than a mandatory memory architecture |

No external source proves that AnyPixel Next will be useful or commercially successful. The [evaluation plan](ROADMAP.md#evaluation-that-can-change-the-product-decision) is designed to test the new proposal, including the possibility that a simpler skill-only product is better.

## Decisions considered and rejected for v0.1

| Alternative | Why defer it | Evidence that would reopen it |
| --- | --- | --- |
| Rewrite the existing ontology with more plugin flags | Keeps onboarding centered on inherited categories and contracts | A pilot demonstrates that contract authoring itself is the sought-after value |
| Build a standalone design-agent app | Duplicates host reasoning, permissions, integrations, and interface | Users cannot complete essential workflows in existing hosts |
| Ship only a prompt bundle | Excellent baseline, but cannot itself normalize capture provenance, check coverage, or decision artifacts | Baseline trial shows the runtime adds insufficient value; then choose this simpler option |
| Make all design guidance executable rules | Subjective and contextual advice becomes false certainty | A specific rule gains reliable measurement and scoped validation |
| Learn globally from every user interaction | Confuses acceptance with correctness and mixes scopes | Explicitly opted-in, rights-cleared data and evaluations justify a specific shared improvement |
| Build a pack marketplace first | Creates infrastructure before a contributor ecosystem exists | Independent packs exist and users repeatedly struggle to discover them |

## Research limits and next evidence

No new usability sessions, model experiments, MCP compatibility spikes, or paid service trials were run for this document. External products were not installed. Repository evidence is stronger than inferred product comparisons. Current access restrictions and SDK status should be rechecked at implementation time.

The most valuable next evidence is one end-to-end task with a target user, one independently authored extension, and one real two-session memory scenario. Those can falsify the central design before a large rewrite.
