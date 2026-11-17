import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_product",
  title: "Consultar detalhes de um produto",
  description: "Consulta um produto ativo pelo slug; preço cadastrado é informativo e o checkout Stripe confirma preço e estoque numérico.",
  inputSchema: { slug: z.string().min(1).max(200).describe("Slug do produto retornado por list_products.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    const client = supabaseForUser(ctx);
    const { data, error } = await client.from("products")
      .select("id,slug,name,subtitle,description,benefits,capsule_count,price,in_stock")
      .eq("is_active", true).eq("slug", slug).abortSignal(ctx.signal).maybeSingle();
    if (error) throw new ToolError("Não foi possível consultar o produto.");
    if (!data) throw new ToolError("Produto não encontrado ou indisponível.");
    const product = { id: data.id, slug: data.slug, name: data.name, subtitle: data.subtitle, description: data.description, benefits: data.benefits, capsule_count: data.capsule_count, catalog_price_brl: data.price, in_stock: data.in_stock };
    return {
      content: [{ type: "text", text: JSON.stringify({ source: "database_catalog", product }) }],
      structuredContent: { source: "database_catalog", product },
    };
  },
});
