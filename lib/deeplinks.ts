import type { SupabaseClient } from "@supabase/supabase-js";
import { createDeepLink, linktwinConfigured, updateDeepLink } from "@/lib/linktwin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamRole, taggedUrl, type Role } from "@/lib/util";

export type DeepSync = { made: number; updated: number; failed: number; left: number; message?: string };
const NOTHING: DeepSync = { made: 0, updated: 0, failed: 0, left: 0 };

type Row = {
  id: string; short_id: string; product_id: string; page_id: string; owner_id: string; name: string;
  amazon_tag: string | null; deep_url: string | null; deep_id: string | null; deep_dest: string | null;
};

/**
 * The database only lets the team or the server write a link's deep link. A team member's own session is
 * enough. For a creator the server needs the service key; without it their link waits for the next team action.
 */
export function deepWriter(role: Role, session: SupabaseClient): SupabaseClient | null {
  if (isTeamRole(role)) return session;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try { return createAdminClient(); } catch { return null; }
}

/**
 * Makes or updates deep links for tracked, live links in products that have deep links switched on.
 * Narrow it with a product, a brand or a list of links. Does at most `limit` LinkTwin calls per run
 * and reports how many links are still waiting, so one slow run never holds a page up.
 */
export async function syncDeepLinks(
  db: SupabaseClient, scope: { productId?: string; brandId?: string; linkIds?: string[] }, limit = 15,
): Promise<DeepSync> {
  if (!linktwinConfigured()) return NOTHING;
  let pq = db.from("products").select("id, name, brand_id").eq("deep_links", true);
  if (scope.productId) pq = pq.eq("id", scope.productId);
  if (scope.brandId) pq = pq.eq("brand_id", scope.brandId);
  const { data: products } = await pq;
  if (!products?.length) return NOTHING;
  const productIds = products.map((p) => p.id);

  let lq = db.from("links")
    .select("id, short_id, product_id, page_id, owner_id, name, amazon_tag, deep_url, deep_id, deep_dest")
    .in("product_id", productIds).is("archived_at", null).not("amazon_tag", "is", null).order("created_at").limit(1000);
  if (scope.linkIds?.length) lq = lq.in("id", scope.linkIds);
  const [{ data: links }, { data: pages }, { data: brands }] = await Promise.all([
    lq,
    db.from("amazon_pages").select("id, url").in("product_id", productIds),
    db.from("brands").select("id, name").in("id", [...new Set(products.map((p) => p.brand_id))]),
  ]);
  const pageUrl = new Map((pages ?? []).map((p) => [p.id, p.url as string]));
  const brandName = new Map((brands ?? []).map((b) => [b.id, b.name as string]));
  const product = new Map(products.map((p) => [p.id, p]));

  const todo = ((links ?? []) as Row[])
    .map((l) => ({ l, dest: taggedUrl(pageUrl.get(l.page_id) ?? "", l.amazon_tag) }))
    .filter(({ l, dest }) => dest && (!l.deep_url || l.deep_dest !== dest));
  if (!todo.length) return NOTHING;
  const batch = todo.slice(0, limit);

  const owners = [...new Set(batch.map(({ l }) => l.owner_id))];
  const { data: people } = await db.from("profiles").select("id, username").in("id", owners);
  const who = new Map((people ?? []).map((p) => [p.id, p.username as string]));

  const out: DeepSync = { made: 0, updated: 0, failed: 0, left: todo.length - batch.length };
  // five at a time keeps well under LinkTwin's limit of 120 requests a minute
  for (let i = 0; i < batch.length; i += 5) {
    await Promise.all(batch.slice(i, i + 5).map(async ({ l, dest }) => {
      const p = product.get(l.product_id)!;
      const title = [brandName.get(p.brand_id), p.name, who.get(l.owner_id), l.name].filter(Boolean).join(" · ");
      const res = l.deep_id ? await updateDeepLink(l.deep_id, dest, title) : await createDeepLink(dest, title, `Tracker link ${l.short_id}`);
      if (!res.ok) { out.failed++; out.message = res.message; return; }
      const { error } = await db.from("links").update({ deep_url: res.url, deep_id: res.id, deep_dest: dest }).eq("id", l.id);
      if (error) { out.failed++; out.message = "Could not save a deep link."; return; }
      if (l.deep_id) out.updated++; else out.made++;
    }));
  }
  out.left += out.failed;
  return out;
}

/** One line for the green or red bar after a team action. */
export function deepSummary(r: DeepSync) {
  const parts: string[] = [];
  if (r.made) parts.push(`${r.made} deep ${r.made === 1 ? "link" : "links"} made`);
  if (r.updated) parts.push(`${r.updated} updated`);
  if (r.left) parts.push(`${r.left} still to make`);
  if (r.failed && r.message) parts.push(r.message);
  return parts.join(". ");
}
