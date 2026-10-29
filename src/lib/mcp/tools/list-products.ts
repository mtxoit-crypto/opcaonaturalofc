import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "Consultar produtos cadastrados",
  description: "Lista produtos ativos cadastrados no banco da loja; não inclui produtos de fallback ou preços atualizados da Shopify.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("Quantidade máxima de produtos, de 1 a 50."),
    offset: z.number().int().min(0).max(10000).default(0).describe("Quantidade de produtos a pular na paginação."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, offset }, ctx) => {
    const client = supabaseForUser(ctx);
    const { data, error } = await client.from("products")
      .select("id,slug,name,subtitle,price,capsule_count,in_stock")
      .eq("is_active", true).order("sort_order").order("id")
      .range(offset, offset + limit - 1).abortSignal(ctx.signal);
    if (error) throw new ToolError("Não foi possível consultar os produtos.");
    const products = (data ?? []).map(p => ({ id: p.id, slug: p.slug, name: p.name, subtitle: p.subtitle, catalog_price_brl: p.price, capsule_count: p.capsule_count, in_stock: p.in_stock }));
    return {
      content: [{ type: "text", text: JSON.stringify({ source: "database_catalog", products }) }],
      structuredContent: { source: "database_catalog", products },
    };
  },
});