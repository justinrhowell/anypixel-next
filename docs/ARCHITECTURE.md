# Architecture

The host agent makes design judgments and edits the product. AnyPixel supplies project context, evidence, checks, and decisions through five shared operations.

```text
CLI / MCP
    ↓
Shared core → configured observers and checks
    ↕
Project guidance, decisions, and evidence files
```

| Location               | Responsibility                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `src/core/`            | Context selection, decisions, evidence integrity, reviews, and extension execution       |
| `src/cli/`, `src/mcp/` | Thin adapters over the same operations                                                   |
| `src/sdk/`             | Extension contracts                                                                      |
| `extensions/web/`      | Optional Playwright capture and axe checks                                               |
| `packs/`, `examples/`  | Editable guidance and examples of independent contributions                              |
| `schemas/`             | Machine-readable contracts; operation schemas are generated from `src/core/contracts.ts` |

Core does not import the browser extension or the MCP adapter. Extensions register observers and checks through the same API available to contributors. They run in worker processes for cancellation and failure isolation; they are trusted code, not sandboxed code.

Projects keep editable guidance and scoped Markdown decisions in `design/`. Local captures, context snapshots, and HTML/JSON reviews live in `.anypixel/`, outside version control. Evidence manifests bind artifacts to their hashes. Reviews distinguish measurements from host judgments and expose checks that could not run.

Practice packs are data and text. Adding one does not authorize executable extensions. Pack locks make guidance changes explicit.

See [current status](STATUS.md) for implementation limits and [extension contracts](EXTENSIONS.md) to build on this API. The original research and proposal are preserved in the [initial commit](https://github.com/justinrhowell/anypixel-next/tree/e651bbbffd826c250ec47daefaec520712360510/docs/proposal).
