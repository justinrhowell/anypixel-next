# AnyPixel Next

[![Checks](https://github.com/justinrhowell/anypixel-next/actions/workflows/check.yml/badge.svg)](https://github.com/justinrhowell/anypixel-next/actions/workflows/check.yml)

Design guidance and review tools for coding agents.

AnyPixel helps your agent inspect an interface, check its changes, and reuse your project's design decisions. The guidance is Markdown you can edit. The evidence and decisions stay with your project.

- **Teach your practice.** Add examples, brand guidance, and scoped decisions.
- **Check the result.** Capture a screen, run checks, and compare changes in an HTML report.
- **Extend it.** Add a practice pack or a check without changing the engine.

Use it through the CLI or MCP. Your existing agent handles reasoning and code edits.

**Early alpha.** Runs locally; npm publication and testing in individual agent hosts are still ahead. [Current status](docs/STATUS.md).

## Try it

Requires Node 24 or newer.

```sh
git clone https://github.com/justinrhowell/anypixel-next.git
cd anypixel-next
npm ci
npx playwright install chromium
npm run demo
```

The demo reviews an invitation form, fixes two accessibility issues, and checks the result. It prints before/after report paths and shows a decision carried into the next task.

Already have Chrome? Skip the browser download and run `BROWSER_CHANNEL=chrome npm run demo`.

## Use it in your project

Follow the [quickstart](docs/QUICKSTART.md) to install the CLI, connect an MCP client, and capture your own interface. Add the [starter skill](packs/starter/skills/design-partner/SKILL.md) to your agent to guide the workflow.

The CLI and MCP expose the same five operations: context, observe, review, record, and read. Import an existing screenshot or capture a live page with the optional browser extension. Guidance, decisions, and file import work without a browser or a model API key.

## Contribute

Start with a [practice pack](examples/dense-product-ui) or a [custom check](examples/custom-check). See [contributing](CONTRIBUTING.md) and the [extension guide](docs/EXTENSIONS.md) for the contracts and development setup.

```sh
npm run check
npm run test:browser
```

[Roadmap](docs/ROADMAP.md) · [Architecture](docs/ARCHITECTURE.md) · [Apache-2.0](LICENSE)
