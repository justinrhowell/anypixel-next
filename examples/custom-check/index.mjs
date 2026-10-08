// A standalone plugin: no core import, domain enum, or dispatcher edit.
export default {
  apiVersion: 1,
  id: 'example/heading-check',
  version: '0.1.0',
  checks: {
    'example/one-heading': {
      optionsSchema: { type: 'object', properties: {}, additionalProperties: false },
      requires: ['web/dom'],
      async evaluate(input) {
        const artifact = input.artifacts.find((a) => a.kind === 'web/dom');
        const dom = JSON.parse(Buffer.from(artifact.base64, 'base64').toString());
        const count = dom.headings.filter((h) => h.level === 1).length;
        return {
          status: 'completed',
          limitations: ['This is an example team convention, not a universal accessibility rule.'],
          findings:
            count === 1
              ? []
              : [
                  {
                    id: 'heading-count',
                    author: 'example/heading-check',
                    category: 'team-convention',
                    basis: 'measured',
                    priority: 'low',
                    claim: `Found ${count} first-level headings.`,
                    goalRelevance: 'This example project chooses one main page heading.',
                    evidence: [artifact.id],
                    proposedAction: 'Review whether one heading best describes this page.',
                    uncertainty: 'The correct heading structure depends on the document.',
                  },
                ],
        };
      },
    },
  },
};
