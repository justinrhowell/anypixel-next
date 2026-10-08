import { McpServer, type ServerContext } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { execute } from '../core/index.js';
import { requests, type Operation } from '../core/contracts.js';
import { version } from '../core/files.js';

export async function serve(project: string) {
  const server = new McpServer({ name: 'anypixel-next', version });
  const descriptions: Record<Operation, string> = {
    context:
      'Load verified practice guidance and accepted decisions for a task. Writes a local context snapshot.',
    observe:
      'Collect evidence through a trusted configured observer. Browser targets must be allowed by the project.',
    review:
      'Evaluate captured evidence and write a local HTML/JSON review. Host judgments must be labeled inferred or human.',
    record:
      'Write a scoped project decision. Accepted status requires an actual user-supported acceptance attestation; never fabricate one.',
    read: 'Verify and read a project-owned snapshot or artifact. Returns images for supported captured image types.',
  };
  for (const [op, schema] of Object.entries(requests)) {
    const operation = op as Operation;
    server.registerTool(
      `design_${op}`,
      { description: descriptions[operation], inputSchema: schema },
      async (input: unknown, extra: ServerContext) => {
        const response = await execute(operation, input, project, extra.mcpReq.signal);
        if (response.result?.base64)
          return {
            content: [
              {
                type: 'image' as const,
                data: response.result.base64,
                mimeType: response.result.mimeType,
              },
            ],
          };
        const encoded = JSON.stringify(response);
        return {
          isError: !!response.error || response.result?.exitCode === 2,
          content: [{ type: 'text' as const, text: encoded }],
          structuredContent: response,
        };
      },
    );
  }
  await server.connect(new StdioServerTransport());
}
