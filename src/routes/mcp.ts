// route: /mcp
// emitted to: src/routes/mcp.ts

import { createFileRoute } from "@tanstack/react-router";

import { createTanStackMcpHandler } from "@lovable.dev/mcp-js/stacks/tanstack";

import mcp from "../lib/mcp/index";

const mcpHandler = createTanStackMcpHandler(mcp, {
  resourcePath: "/mcp",
  metadataPath: "/.well-known/oauth-protected-resource",
  trustForwardedHost: false,
  trustForwardedProto: false,
});

const MAX_MCP_REQUEST_BYTES = 16_384;

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      ANY: async (context) => {
        const { request } = context;
        if (request.method === "POST") {
          const declaredLength = Number(request.headers.get("content-length") ?? 0);
          if (declaredLength > MAX_MCP_REQUEST_BYTES) {
            return Response.json({ error: "Request too large." }, { status: 413 });
          }
          const reader = request.clone().body?.getReader();
          if (reader) {
            let totalBytes = 0;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              totalBytes += value.byteLength;
              if (totalBytes > MAX_MCP_REQUEST_BYTES) {
                await reader.cancel();
                return Response.json({ error: "Request too large." }, { status: 413 });
              }
            }
          }
        }
        return mcpHandler(context);
      },
    },
  },
});
