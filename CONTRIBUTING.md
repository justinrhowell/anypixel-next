# Contributing

Start with `npm ci` and `npm run check` on Node 24+. Run `npm run format` before committing. The live browser test runs with `npm run test:browser`; install Playwright Chromium first or use `BROWSER_CHANNEL=chrome`. CI runs all tests, including browser capture.

Useful contributions include a clearer example, a counterexample that breaks current guidance, a small regression fixture, a practice pack, or an observer/check. Design expertise does not require TypeScript. Mark untested guidance experimental and explain its scope. Do not include private customer data, credentials, or assets without distribution rights.

For content, explain the user task and why the change helps. For a check, provide a fixture that triggers it and one that should not; distinguish team preferences from standards. For runtime changes, test the behavior and failure modes rather than mirroring the implementation. Record schema/API changes in CHANGELOG.md and update generated schemas through `npm run build`.

Core API changes should begin with a short issue or proposal describing the use case, smallest interface change, compatibility, and verification. Small corrections do not need a formal RFC. Contributions are licensed under Apache-2.0. No copyright assignment is required.

Be respectful, specific, and generous in review. Critique the work against its goals; do not attack the contributor. The maintainer may remove harassment or private information and should explain moderation decisions where doing so is appropriate.
