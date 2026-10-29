# Package updates

- [x] Apply the five photo display adjustments without replacing unrelated code.
- [x] Require verified email for invited administrators and retire unused visitor order creation.
- [ ] Storage scan resolution: owner requests all media public, but workspace blocks public buckets. Await enabling public buckets in workspace Privacy & Security; existing access unchanged and finding remains active.
- [x] Verify photo views, invitation permissions, and existing page metadata.

## Agent integrations

- [x] Enable delegated OAuth and preserve consent through existing sign-in methods.
- [x] Add bounded read-only MCP catalog tools and a browser-local catalog read tool.
- [x] Verify consent states, tool authorization, and extract the MCP manifest. Real approve/deny and product read passed with current local revision served under the allowed origin; hosted revision awaits republish. Browser lacks native WebMCP, so native registration is unverified.