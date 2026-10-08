# AnyPixel Next web extension

Optional browser tools for AnyPixel Next. Configure `anypixel-next-web` as a trusted extension in the consumer project. It registers `web/browser` and `web/axe` through the same API as external extensions.

Install Playwright Chromium explicitly with `npx playwright install chromium`, or pass `channel: "chrome"` to use installed Google Chrome. Installing the main AnyPixel Next package does not download a browser.

Requests require an allowed target origin, a viewport, and a state label. This alpha captures an unauthenticated initial page only; login/storage-state configuration is not yet supported. Browser evidence does not prove source-revision association or full interaction coverage. See the main repository's extension guide for artifact details and limits.
