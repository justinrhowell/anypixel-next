# AnyPixel Next

An editable design practice for your existing AI agent, with tools to inspect interfaces, review evidence, and remember project decisions.

**Local alpha — 0.1.0-alpha.0.** The first workflow runs. It is not yet a published npm package or a certified integration with particular agent hosts. See [tested behavior and remaining work](docs/STATUS.md).

## Try the complete demonstration

Requires Node 24 or newer. From this repository:

```sh
npm ci
npx playwright install chromium
npm run demo
```

If Google Chrome is already installed, the browser download is unnecessary:

```sh
BROWSER_CHANNEL=chrome npm run demo
```

The demo starts a local invitation form, captures evidence, reports two intentionally introduced accessibility issues, repairs the fixture, captures again, and recalls a scripted project decision. It prints before/after HTML report paths. This demonstrates the workflow and measurements, not independent proof of better design.

## Use in your project

```sh
npm run build
node /absolute/path/to/anypixel-next/dist/cli/index.js init --project /path/to/your/project
node /absolute/path/to/anypixel-next/dist/cli/index.js context \
  --project /path/to/your/project \
  --task "Improve the invitation screen" --scope src/invite.tsx
```

Quote paths containing spaces. Add `.anypixel/` to the consumer project's `.gitignore`. The CLI never overwrites an existing configuration. Context and pack validation work without browser tools or a model-provider key.

Install the [starter skill](packs/starter/skills/design-partner/SKILL.md) using your agent's normal skill mechanism, or ask it to read the skill and its reference. The host supplies reasoning, source edits, and tool permissions.

For browser capture, install the separate web package into the consumer project (see [local packaged installation](docs/QUICKSTART.md)). Explicitly configure its module and allowed preview origin:

```json
{
  "schemaVersion": 1,
  "packs": ["builtin:starter"],
  "extensions": [{ "module": "anypixel-next-web", "trusted": true }],
  "checks": [{ "id": "web/axe" }],
  "allowedOrigins": ["http://localhost:3000"]
}
```

## Plug into an agent

The stdio server uses the same operations as the CLI:

```sh
node /absolute/path/to/anypixel-next/dist/cli/index.js mcp --project /path/to/your/project
```

Register that command, arguments, and working directory in your host's MCP configuration. It exposes exactly five tools: `design_context`, `design_observe`, `design_review`, `design_record`, and `design_read`. Use the absolute Node 24 binary if your host starts with a different Node version.

The official SDK client has been tested; named-host support is pending. This alpha does not configure hosts or launch a second model behind your agent.

## Make it yours

Edit `design/brief.md`, `design/system.md`, or scoped decisions in `design/decisions/`. Add a [practice pack](examples/dense-product-ui) to the configured pack directories, then explicitly run `pack lock` after reviewing changes. The [extension guide](docs/EXTENSIONS.md) shows how to register a custom check without modifying core.

Reports preserve captured evidence and distinguish measurements from judgments. They do not produce a global design score. Project files and local operation artifacts stay on your machine unless you share them.

## Develop and contribute

```sh
npm test
RUN_BROWSER=1 npm test
```

The first command runs deterministic and MCP transport tests; the live browser test is opt-in. Use `BROWSER_CHANNEL=chrome` if needed. [CONTRIBUTING](CONTRIBUTING.md) describes how to change a practice, add an extension, or propose an API change.

New code and original packs use [Apache-2.0](LICENSE). The approved [proposal](docs/proposal/PRODUCT-SPEC.md) explains the direction; [STATUS](docs/STATUS.md) describes what actually exists. Package names remain provisional and publication is disabled while the alpha is being validated.
