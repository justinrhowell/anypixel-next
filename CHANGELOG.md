# Changelog

## 0.1.0-alpha.0 — unreleased

Initial local implementation: shared CLI/MCP operations; locked data-only packs;
scoped Markdown decisions; immutable verified evidence; isolated extension
workers; optional browser/axe package; HTML review and scripted before/after demo.

Added project-relative screenshot/document import through `builtin:files`, with
explicit provenance limits and no browser dependency. Observers now receive
the resolved `io.projectRoot` from the runtime.

The API remains provisional. Real-host certification, authenticated capture,
and independent design-quality pilots remain release work.
