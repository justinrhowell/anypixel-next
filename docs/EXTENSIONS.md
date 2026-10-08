# Extending the practice

## Content first

A pack is a directory containing `pack.json`, Markdown guidance, and optional self-contained skill directories. The [dense product example](../examples/dense-product-ui/pack.json) and [pack schema](../schemas/pack.schema.json) are the starting point. This alpha accepts md/txt/json content; richer asset formats can be added with explicit size and portability rules.

Add its directory to `design/project.json`'s `packs` array. Run `pack validate PATH`, inspect the content, then `pack lock`. A changed file causes a visible lock mismatch until deliberately accepted. The starter uses the same validation and loading path; the `builtin:starter` string only resolves its installation directory.

Guides that match scope are included before the budget is exhausted. Examples are selected by literal topic matching against the task. Omitted entries remain readable by entry ID from the saved context. Required project guidance and accepted decisions are never silently dropped to fit the budget.

## Native checks and observers

Copy the standalone [custom check](../examples/custom-check/index.mjs) into the consumer project and add its relative module path to the configured trusted extensions. Add `example/one-heading` to the checks list. It reads the browser observer's saved `web/dom` artifact. No engine file or design-domain enum changes.

An extension default-exports `apiVersion`, `id`, `version`, and optional `observers` and `checks`. See [SDK interfaces](../src/sdk/index.ts). Inputs/options use JSON Schema; outputs follow the generated [observation](../schemas/observation.schema.json) and [check-result](../schemas/checkResult.schema.json) schemas. Additional semantic invariants, such as measured evidence references, are enforced by core.

Observers return a bounded array of base64 artifacts with unique local IDs and declared kinds. Core publishes them with capture-qualified IDs, MIME types, sizes, and hashes. Checks receive verified artifacts and options, and return findings plus an execution status. The core stamps check origin/version and rejects references to artifacts that were not supplied.

Workers use a separate Node process, a minimal environment, timeouts, and cancellation. Native extensions remain trusted code with the user's OS permissions; this is not a sandbox. Installing a pack cannot register executable code. The main package includes no browser dependency; the browser extension owns Playwright and axe.

## Initial browser artifact contracts

- `web/screenshot`: PNG for the configured viewport, with animations disabled during screenshot collection. It is not a full-page screenshot.
- `web/dom`: JSON with title, URL, heading level/text pairs, up to 500 controls with tag/text/ARIA-label/viewport-relative CSS-pixel rectangle, and document scroll dimensions. It is not a complete accessibility tree or source map.
- `axe/results`: raw axe results, including test-engine version, violations, passes, incomplete results, and applicable metadata. The bundled `web/axe` check validates the fields it consumes.

Capture metadata records browser and axe versions, viewport, supplied state label, URL, and collection times. Artifacts share a session but are collected sequentially. Source revision is `unknown`; a local URL alone cannot prove which source commit it renders. Capture limits are 20 MB per artifact and 25 MB total. Worker IPC replies are capped at 40 MB after serialization.

## Contract source and compatibility

Runtime schemas are authored once in [contracts.ts](../src/core/contracts.ts) using Zod; TypeScript types are inferred and JSON Schemas generated during build. This implements the proposal's single-source requirement through a code schema rather than hand-maintained JSON plus separate types. Native plugin input/options schemas remain ordinary JSON Schema.

This alpha API is provisional. Breaking changes need versioned release notes and fixture updates. Do not claim third-party compatibility until the consumer's actual extension has been tested.
