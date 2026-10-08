# AnyPixel Next — product specification

**Status:** proposed v0.1 product, not implemented. **Date:** 2026-10-08. **Baseline:** AnyPixel commit `a72d884165f56efb07d4f4f04a4bf7b22c0e0029`.

## 1. Product thesis

AnyPixel Next is an open design assistant workflow that helps an existing AI agent make better design decisions, inspect its work, and reuse what a project has learned.

Its expertise is a collection of replaceable **practice packs**: instructions, examples, references, and optional check recommendations. The engine handles context, evidence, and extension execution. The user owns both. A team can change its practice by editing a file, extend it with a plugin, and move it to another agent without surrendering its design history.

This is a new product architecture. Its initial interface remains developer-oriented: an installable CLI, an MCP server, and a portable skill. The first supported work is web and app UI in a code repository. Native apps, presentations, print, and other surfaces can become separately maintained packs and observers after the extension model proves useful.

### The promise

“Bring your project and your agent. Get a design partner that understands your intent, works with your system, shows its reasoning against actual evidence, and remembers the decisions you choose to keep.”

That promise has four testable parts: usefulness on a real task; fidelity to project intent; honest evidence; and improved continuity on a later task. Installation and extensibility are necessary conditions, not substitutes for those outcomes.

## 2. First users and initial problem

The initial user is a developer or small product team using an AI coding agent to build an interface. They have functioning code but spend too much time correcting generic layouts, forgotten brand decisions, weak content hierarchy, and incomplete interaction states. They can run a local preview and review a code diff. They do not want to adopt a second development environment.

A second user is the designer or design-system maintainer who wants to teach the agent how the team works. They should contribute useful expertise without understanding the runtime. A third user is the extension author who wants to connect a tool or implement a check; they need stable interfaces and a runnable fixture.

The initial wedge is **improving an existing screen in an existing product**. A screenshot-only generator has little knowledge of the surrounding product; a rule checker has little say about what should be designed. The proposed workflow connects intent, existing system, implementation, and follow-up. This is a positioning hypothesis, not a claim that competing products cannot do these things.

## 3. What the existing project teaches us

AnyPixel already separates measurements from judgment in important places, preserves report evidence, and treats failed execution differently from design failure. Those are strengths. Its current reports and tests provide migration fixtures.

Its extension limits are also concrete: doctrine paths are embedded in the loader; the contract validator has fixed channel and gate tables; the runner has a fixed executor map. These force new kinds of expertise through old categories. The source audit and exact links are in [RESEARCH.md](RESEARCH.md#local-evidence).

The project's Study B suggests that explicit behavioral constraints can change generated structure and that accessibility guidance supplies a separate benefit. It used four briefs per condition, one model family, one lens, and project-owned measurements. It does **not** establish better human-perceived design, broad model generality, or the superiority of a complete lens package. The next product must evaluate those claims instead of inheriting them.

The current npm archive is small. Here, “bloat” primarily means conceptual overhead, coupling, and the amount users and contributors must understand. A small tarball can still expose too many concepts.

## 4. Product principles

1. **Start from the job.** Establish audience, intended action, and constraints before choosing style. Use available repository context; ask only questions whose answers could change the work.
2. **Teach through files.** Workflow instructions and design examples are ordinary Markdown and assets. Editing a practice should not require rebuilding a server.
3. **Work with the existing system.** Prefer the project's components, tokens, content, and interaction patterns. Surface deliberate departures and their rationale.
4. **Make evidence inspectable.** A screenshot, a measured check, a model interpretation, and a human preference are different things. Preserve those distinctions in every interface.
5. **Keep the host in control.** The agent the user already chose handles reasoning, code changes, external services, and permissions. The runtime supplies focused capabilities.
6. **Accumulate decisions, not unquestioned doctrine.** Remember a scoped choice with its reason. Let the owner correct, expire, or replace it.
7. **Make extension the normal path.** First-party tools use the public extension interface. No special hard-coded list of approved design domains.
8. **Earn complexity.** Add infrastructure when a tested workflow needs it. A general workflow engine, vector database, marketplace, and hosted collaboration app are outside v0.1.

## 5. The user experience

### A. Improve an existing screen — the launch workflow

**User:** “The onboarding screen feels busy. Help users finish setup, and keep our existing design system.”

1. The agent reads the selected task, the relevant source files, available project brief, and accepted decisions. It states a narrow goal: make the next setup action clearer while preserving required information.
2. It observes the specified preview and viewport. A missing preview yields a concrete setup instruction or a source-only review clearly labeled as such. The assistant must not imply that it saw a live interface when it did not.
3. It gives a short diagnosis: what already works, up to three prioritized improvements, and the evidence and tradeoff for each. “Reduce card count” is insufficient; “group optional account details so the next setup action is easier to locate” connects the change to a goal.
4. The agent makes a bounded patch under the user's existing authorization. The workflow does not create a new approval ritual for ordinary reversible edits. It pauses for consequential product decisions or scope changes that the user has not authorized.
5. It observes again under comparable conditions. It checks that required content and functionality remain, reports measured regressions, and explains what remains uncertain. At most two repair iterations follow the initial change by default; lack of progress ends the loop sooner.
6. It produces a portable review with before/after evidence, the actual source diff reference, changes, remaining findings, and coverage. An approved reusable decision can be recorded for future tasks.

**Example result:** “Grouped optional settings below the primary step and reused the existing form spacing. The primary action is visible at the tested mobile viewport. Automated checks found no new violations in this state. Keyboard flow and the invitation error state still need observation.” Avoid “The design is 94% good.”

**Failure cases:** auth wall, unstable page, missing fonts, unknown source-to-preview relationship, browser unavailable, unsupported check, disputed subjective finding, failed patch, cancellation, or exhausted iteration budget. Each returns the useful partial work and names the missing evidence. A source change during capture invalidates the comparison until recaptured. [Technical behavior](TECHNICAL-SPEC.md#failure-and-recovery) defines storage and error semantics.

### B. Explore a new flow — included, lightweight

**User:** “Design an invitation flow for our workspace product.”

The agent discovers reusable components and existing team decisions, clarifies role/permission ambiguity if necessary, and sketches two meaningfully different approaches. Each direction includes task flow, content hierarchy, key states, and tradeoffs. Visual implementation uses the host's normal tools; the core runtime does not generate images or code.

The assistant discusses distinctions such as single versus bulk invitation and immediate versus deferred role selection. Palette swaps alone do not count as alternative directions. It recommends one with reasons tied to the brief. If the user has authorized autonomous selection and the choice is reversible, it proceeds with a stated assumption.

The chosen direction becomes a short brief and implementation plan. Loading, empty, error, success, permission, responsive, keyboard, and reduced-motion considerations are examined when relevant; they are not all mechanically asserted to apply to every screen. Review and decision recording use the same path as workflow A.

### C. Teach or change the practice — the extensibility proof

**User:** “For our analytics product, dense tables are intentional. Stop replacing them with cards.”

The assistant proposes a scoped project decision: prefer a table for comparing many records, preserve scan-friendly alignment, and offer a compact mobile alternative where appropriate. The user may accept it through the current conversation or edit the decision file directly. A later task retrieves it only in its declared scope.

A designer can move that guidance into a team pack with examples and counterexamples. A plugin author can add a deterministic check for token usage without editing core. Both paths must work in a fresh checkout using documented templates. There is no mandatory public submission, registry listing, or maintainer approval to use a private pack.

## 6. What “expert” means

Expertise is demonstrated by the quality of a decision in context. It includes framing the problem, reusing good existing work, considering alternative flows, explaining tradeoffs, checking interaction states, and knowing what the available evidence cannot establish.

The initial starter practice covers product intent, information hierarchy, interaction and content clarity, responsive behavior, accessibility, and design-system consistency. It points to focused examples on demand. It must not paste an entire design encyclopedia into every task. Agent Skills provides an interoperable format for this progressive loading; context-selection behavior is specified separately in the runtime. [Agent Skills specification](https://agentskills.io/specification).

Each substantial guidance entry should include:

- The situation and goal where it helps.
- The recommendation and its reasoning.
- A worked example and a case where the recommendation is wrong or insufficient.
- Sources, provenance, and licensing for included assets.
- What is measured, inferred, or still a hypothesis.

A pack may contain a strong aesthetic point of view. It must identify that perspective and its intended use. Famous-designer names are unnecessary for the default workflow; descriptive practices such as dense product UI or expressive editorial layouts are easier to modify and combine.

Critique should analyze a design against its objectives and support discussion. That framing draws on [Nielsen Norman Group's critique guidance](https://www.nngroup.com/articles/design-critiques/). Automated accessibility checks remain partial evidence, consistent with [W3C's evaluation guidance](https://www.w3.org/WAI/test-evaluate/tools/selecting/).

## 7. How the practice improves over time

There are three separate improvement loops. None requires model fine-tuning.

| Loop | What changes | Who controls it | Proof of benefit |
| --- | --- | --- | --- |
| Within a task | A bounded implementation and a fresh observation | Existing host workflow and user intent | Comparable before/after evidence and preserved behavior |
| Within a project | Accepted scoped decisions and project guidance | Project owner through ordinary files and review | Later tasks respect valid decisions and ignore superseded ones |
| Across the community | Versioned practice packs, fixtures, and plugins | Pack maintainers and normal contribution review | Held-out task results, reported regressions, and documented limits |

Raw conversation and successful tool calls do not become universal rules. An assistant may propose a decision, but only an explicit user choice or an already authorized project edit makes it accepted. Acceptance proves a preference was accepted; it does not prove the preference improved usability.

Memory must handle contradiction and changing context. A new accepted decision explicitly supersedes an old one; expired decisions are excluded from active context. Two active decisions with the same declared key and matching scope are shown as a conflict rather than silently averaged. The host helps identify semantic contradictions across different keys; the core does not claim to understand every prose conflict. Personal preferences stay local unless the user chooses to share them. The initial product has project memory only; cross-project personalization is deferred.

Community guidance has `experimental`, `tested`, or `deprecated` status in its documentation, with a tested scope. “Tested” requires a described evaluation and evidence links, not a download count. This adapts the principle of evidence-backed, context-specific contributions in the [GOV.UK Design System criteria](https://design-system.service.gov.uk/community/contribution-criteria/).

## 8. Scope and release boundary

### v0.1 includes

One starter practice; the three workflows above; project Markdown context and decisions; a local CLI and stdio MCP wrapper; browser observation using an optional Playwright extension; automated accessibility through axe; JSON and self-contained HTML review exports; local pack discovery and validation; a public observer/check API; and contributor examples.

The CLI can gather evidence and run deterministic checks without a model. Conversational interpretation and code changes require a capable host agent. An unavailable image-capable host means visual critique is not assessed. The runtime never pretends it independently reasoned about pixels.

### Deferred until demonstrated demand

Hosted accounts, billing, remote MCP hosting, editor-specific UI, a design canvas, full Figma synchronization, native-app observers, autonomous background learning, a central marketplace, vector search, multi-agent orchestration, model training, and a generic workflow DSL.

Figma and Pencil are integration opportunities, not prerequisites. Existing host connections may supply design evidence; v0.1 supports importing explicitly supplied artifacts with source labels. A dedicated integration must validate actual access and provenance before claiming support. In particular, Figma currently documents a catalog restriction on connecting clients. [Figma MCP documentation](https://developers.figma.com/docs/figma-mcp-server/).

## 9. Open source as a product capability

Recommend **Apache-2.0 for newly authored engine code, starter instructions, and examples**, with explicit notices for third-party material. This is a proposed release choice, not a relicensing action. Current AnyPixel is marked UNLICENSED; reusable files require a provenance and rights review before transfer. Do not copy reference imagery or external datasets merely because they are in the old tree. Apache's terms include license and notice obligations as well as a patent grant. [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

The public project should work completely from a clone. It needs a concise README, one ten-minute tutorial, CONTRIBUTING, an extension template, maintained fixtures, a code of conduct, security reporting, a changelog, and named maintainers. Core API changes use a short RFC; an example correction should be an ordinary small pull request. Contributors retain ownership under the project license; a broad copyright-transfer CLA is not part of this proposal.

Contribution paths progress from improving an example to sharing a pack, adding a regression fixture, implementing a check or observer, and proposing a core change. Design contributors can maintain content without becoming runtime engineers. Published third-party packs identify their owner and compatibility; inclusion is not an endorsement of every design opinion. [Open Source Guides on roles and governance](https://opensource.guide/leadership-and-governance/).

Distribution begins with repository folders and standard package-manager installation. A curated list can link to packs later. The engine must never require that list or a company-controlled server to load a pack. Pin dependencies and preserve the ability to fork.

## 10. Adoption, sustainability, and success

The launch demonstration should show a real weak screen becoming more usable, a remembered decision improving a second task, and an outside contributor changing the workflow without a core patch. Publish the starting state, exact setup, output, and limitations so the demonstration can be repeated.

Recruit five pilot users across at least three repositories. Observe setup, a first task, and a second task a week later. Measure where they intervene and whether the assistant saves design correction work. Report raw counts; this is a usability pilot, not proof of population-level demand.

Proposed product targets are: four of five users complete the first useful review within ten minutes on a supported setup; three return for a second real task; at least one designer changes a pack without assistance; and an external developer creates a working check without touching core. These are decision thresholds we are choosing, not externally validated benchmarks.

Quality evaluation compares the same host agent alone, with a plain project brief, and with the proposed workflow. Memory is evaluated separately. If the runtime does not improve outcomes beyond a well-written skill and brief, ship the simpler product. If users value only capture and review, narrow the promise rather than adding more architecture.

Commercial possibilities include maintained team packs, support, and optional collaboration services. Do not make any of them a v0.1 dependency or remove the local capability to manufacture demand. Contributor trust depends on a useful open edition and a public roadmap. The [delivery plan](ROADMAP.md) sets the evidence gates before expansion.
