import { chromium } from 'playwright';
import axe from 'axe-core';

const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['url', 'state', 'viewport'],
  properties: {
    url: { type: 'string', pattern: '^https?://' },
    state: { type: 'string', minLength: 1 },
    viewport: {
      type: 'object',
      additionalProperties: false,
      required: ['width', 'height'],
      properties: {
        width: { type: 'integer', minimum: 240, maximum: 3840 },
        height: { type: 'integer', minimum: 240, maximum: 2160 },
      },
    },
    channel: { enum: ['chrome', 'chromium'] },
  },
};
const artifact = (id, kind, mimeType, data) => ({
  id,
  kind,
  mimeType,
  base64: Buffer.from(data).toString('base64'),
});

export default {
  apiVersion: 1,
  id: 'anypixel/web',
  version: '0.1.0-alpha.0',
  observers: {
    'web/browser': {
      inputSchema,
      artifactKinds: ['web/screenshot', 'web/dom', 'axe/results'],
      async observe(input, io) {
        if (!io.allowedOrigins.includes(new URL(input.url).origin))
          throw new Error('Target origin is not in design/project.json allowedOrigins');
        const browser = await chromium.launch({
          channel: input.channel === 'chrome' ? 'chrome' : undefined,
          headless: true,
        });
        const abort = () => {
          void browser.close();
        };
        io.signal.addEventListener('abort', abort, { once: true });
        try {
          const context = await browser.newContext({
            viewport: input.viewport,
            reducedMotion: 'reduce',
          });
          const page = await context.newPage();
          const limitations = ['Only this route, viewport, and state were inspected.'];
          let blockedNavigation = false;
          await context.route('**/*', async (route) => {
            if (
              route.request().isNavigationRequest() &&
              !io.allowedOrigins.includes(new URL(route.request().url()).origin)
            ) {
              blockedNavigation = true;
              await route.abort();
            } else await route.continue();
          });
          await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          if (blockedNavigation || !io.allowedOrigins.includes(new URL(page.url()).origin))
            throw new Error('Navigation left the configured origins');
          await page.evaluate(() => document.fonts.ready);
          await page.addScriptTag({ content: axe.source });
          const initialURL = page.url();
          const startedAt = new Date().toISOString();
          const results = await page.evaluate(
            async () =>
              await window.axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
              }),
          );
          const dom = await page.evaluate(() => ({
            title: document.title,
            url: location.href,
            headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) => ({
              level: Number(el.tagName.slice(1)),
              text: el.textContent?.trim(),
            })),
            controls: [...document.querySelectorAll('button,input,select,textarea,a[href]')]
              .slice(0, 500)
              .map((el) => {
                const r = el.getBoundingClientRect();
                return {
                  tag: el.tagName.toLowerCase(),
                  text: el.textContent?.trim().slice(0, 200),
                  label: el.getAttribute('aria-label'),
                  rect: { x: r.x, y: r.y, width: r.width, height: r.height },
                };
              }),
            scroll: {
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight,
            },
          }));
          const screenshot = await page.screenshot({
            fullPage: false,
            animations: 'disabled',
            timeout: 10000,
          });
          if (blockedNavigation || page.url() !== initialURL)
            throw new Error('Route changed while collecting evidence; recapture a stable state');
          limitations.push(
            'Screenshot, DOM facts, and axe results share a browser session but are collected sequentially; changing content may differ.',
          );
          return {
            metadata: {
              schemaVersion: 1,
              url: page.url(),
              state: input.state,
              viewport: input.viewport,
              browser: browser.version(),
              axeVersion: axe.version,
              startedAt,
              endedAt: new Date().toISOString(),
            },
            limitations,
            artifacts: [
              artifact('screenshot', 'web/screenshot', 'image/png', screenshot),
              artifact('dom', 'web/dom', 'application/json', JSON.stringify(dom)),
              artifact('axe', 'axe/results', 'application/json', JSON.stringify(results)),
            ],
          };
        } finally {
          io.signal.removeEventListener('abort', abort);
          await browser.close();
        }
      },
    },
  },
  checks: {
    'web/axe': {
      optionsSchema: { type: 'object', properties: {}, additionalProperties: false },
      requires: ['axe/results'],
      async evaluate(input) {
        const evidence = input.artifacts.find((a) => a.kind === 'axe/results');
        const raw = JSON.parse(Buffer.from(evidence.base64, 'base64').toString('utf8'));
        if (
          !Array.isArray(raw.violations) ||
          !Array.isArray(raw.incomplete) ||
          !raw.testEngine?.version
        )
          throw new Error('Unsupported axe artifact');
        return {
          status: 'completed',
          limitations: raw.incomplete.map(
            (r) => `Manual assessment remains for ${r.id} (${r.nodes.length} nodes).`,
          ),
          findings: raw.violations.map((r) => ({
            id: r.id,
            author: 'web/axe',
            category: 'accessibility',
            basis: 'measured',
            priority: ['critical', 'serious'].includes(r.impact) ? 'high' : 'medium',
            claim: r.help,
            goalRelevance: `An automated accessibility check identified ${r.nodes.length} affected element(s).`,
            evidence: [evidence.id],
            proposedAction: r.nodes
              .map((n) => `${n.target.join(', ')}: ${n.failureSummary ?? r.description}`)
              .join('\n'),
            uncertainty:
              'Automated axe results apply to the captured DOM state and do not establish complete accessibility.',
          })),
        };
      },
    },
  },
};
