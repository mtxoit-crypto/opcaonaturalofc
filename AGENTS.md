<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- Catalog changes (products, product media) are recorded by append-only database triggers into `public.admin_audit_log`. That table is never updated or deleted from, and only admins may read it; write new admin actions through the tables that already carry triggers so they stay audited.
- Product inventory is numeric: `products.stock_quantity` and `products.low_stock_threshold` (nullable, non-negative). Stock reporting and the "low stock" count must use those columns and never infer quantities from the boolean `in_stock` flag.
- Privileged database logic lives in the `private` schema; `public` exposes only thin `SECURITY INVOKER` wrappers. Keep new privileged functions, role checks and price/order calculations in `private` and grant execution only to the roles that need them.
- Recent schema changes are applied through `drizzle/migrations/` (drizzle-kit) while older ones sit in `supabase/migrations/`. Check both before adding a migration, and never re-run an equivalent of a file that is already applied to the live database.
