# Implementation status

**2026-10-08 · 0.1.0-alpha.0 · local, unpublished prototype.**

The first complete technical workflow is implemented: context → observation → review → changed observation → comparison → accepted decision → later context. The host still supplies design reasoning and source edits. The demo uses a scripted fixture change and explicitly labeled scripted acceptance, not a fabricated user study.

## Working now

- Five shared operations exposed through the CLI and official MCP server SDK.
- Editable starter skill and external data-only packs, explicit locks, scope filtering, and context snapshots.
- Scoped Markdown decisions with acceptance attestations, expiry, rejection, supersession, conflict detection, and project isolation.
- Verified immutable evidence bundles and local HTML/JSON reports, including partial check failures.
- Trusted extension registration without core dispatcher changes, worker timeouts/cancellation, and output validation.
- Optional Playwright/axe extension capturing screenshots, DOM facts, and raw axe results in one session.
- Independent main-package installation without browser dependencies.

The demonstration's two introduced issues (an unnamed input and button) are found before the fixture repair and absent afterward. A later context includes the accepted fixture decision. These are specific assertions about a controlled example; no broader quality or usability improvement has been established.

## Verified environment and integration scope

| Component                  | Observed version / scope                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Local runtime              | Node 24.21.0; macOS arm64                                                                                                           |
| Compiler                   | TypeScript 7.0.2                                                                                                                    |
| MCP SDK                    | Official server/client 2.3.1                                                                                                        |
| Browser adapter            | Playwright 1.64.0                                                                                                                   |
| Browser actually exercised | Installed Google Chrome 154.0.8037.98                                                                                               |
| Accessibility engine       | axe-core 4.14.0                                                                                                                     |
| MCP verification           | Official SDK client: discovery, structured results, working directory, image return, cancellation, and reconnect                    |
| Package verification       | Tarball install in a clean directory with spaces; actual installed CLI launcher; no Playwright/web package pulled into main install |

The SDK client test is **not** two independent host-certification results. No supported-host claim is made for Codex, Claude, Cursor, or another host. The Linux CI workflow is configured but has not been observed running remotely. Browser binaries are installed explicitly; existing Chrome was used locally.

## Verification

The final local run passed **19 tests, with zero failures and zero skips**. Run `RUN_BROWSER=1 BROWSER_CHANNEL=chrome npm test` to reproduce it. It covers the live capture/fix/compare/memory loop, context and memory failure cases, interrupted keyed operations, extension errors, invalid evidence claims, tampered artifacts, cancellation/timeouts, MCP transport, package installation, and dependency boundaries. The report was also opened in a browser and visually inspected; no horizontal overflow was observed at the tested desktop viewport.

## Remaining release work

1. Test the complete workflow in two actual target agent hosts with real user tasks. Record host versions, setup friction, image use, and cancellation behavior.
2. Add authenticated capture/storage-state support and explicit artifact import; neither is implemented in this alpha. Source-revision association currently stays `unknown`.
3. Complete public API hardening: standalone browser-payload/lock schemas, bounded/paginated tool responses, configurable policy and timeouts, richer pack assets, and crash-recovery fixtures. The initial CI switch blocks high-priority measured findings; it is not the full proposed configurable policy engine.
4. Run independent design-quality and repeat-use pilots against a plain brief/skill baseline. Verify contributor onboarding with someone who did not author this runtime.
5. Confirm package/repository naming and publishing ownership, finish dependency notices, and configure a real private vulnerability-reporting channel before public release.

Decision scopes currently match concrete project-relative source paths, not route labels. Existing decision files can be edited directly; a public compare-and-swap update API is not implemented. Context selection is deterministic topic matching, not semantic retrieval. Interrupted keyed operations fail visibly rather than being silently repeated; after a crash, inspect artifacts and stale locks before retrying with a new key.

The [roadmap](ROADMAP.md) tracks the next release steps. The [architecture](ARCHITECTURE.md) links to the historical proposal.
