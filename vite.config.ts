// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { normalize } from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

const mcp = mcpPlugin({ trustForwardedHost: false, trustForwardedProto: false });
const resolveMcpConfig = mcp.configResolved;
if (process.platform === "win32" && typeof resolveMcpConfig === "function") {
  // The MCP plugin compares paths using the native separator; Vite supplies forward slashes.
  mcp.configResolved = function (config) {
    return resolveMcpConfig.call(this, { ...config, root: normalize(config.root) });
  };
}

export default defineConfig({
  vite: { plugins: [mcp] },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
