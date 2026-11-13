import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { type Placement, type Platform, type Role, type Totals, ZERO } from "@/lib/util";

export type Profile = {
  id: string; username: string; discord_username: string | null; discord_id: string | null;
  avatar_url: string | null; role: Role; created_at: string;
};
export type Brand = { id: string; name: string; marketplace: string; tag_template: string | null };
export type Product = { id: string; brand_id: string; name: string; status: "active" | "archived"; created_at: string };
export type AmazonPage = { id: string; product_id: string; name: string; url: string; archived_at: string | null };
export type Link = {
  id: string; short_id: string; product_id: string; page_id: string; owner_id: string;
  platform: Platform; account: string; placement: Placement; name: string; note: string | null;
  amazon_tag: string | null; archived_at: string | null; created_at: string;
};
export type Invite = {
  id: string; code: string; name: string; role: "creator" | "team"; product_id: string | null;
  active: boolean; expires_at: string | null; max_uses: number | null; uses: number; created_at: string;
};
export type DayRow = Totals & { day: string };

const PROFILE_COLS = "id, username, discord_username, discord_id, avatar_url, role, created_at";
const LINK_COLS = "id, short_id, product_id, page_id, owner_id, platform, account, placement, name, note, amazon_tag, archived_at, created_at";

type Res<T> = { data: T[] | null; error: { message: string } | null };

/** The database hands back at most 1,000 rows per request. This keeps asking until it has them all. */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<Res<T>>): Promise<T[]> {
  const size = 1000;
  const out: T[] = [];
  for (let i = 0; ; i += size) {
    const { data, error } = await page(i, i + size - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < size) return out;
  }
}

export const getMe = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select(PROFILE_COLS).eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});

/** Brands and products this person is allowed to see (the database decides). */
export const getNav = cache(async () => {
  const supabase = await createClient();
  const [brands, products] = await Promise.all([
    fetchAll<Brand>((a, b) => supabase.from("brands").select("id, name, marketplace, tag_template").order("name").order("id").range(a, b)),
    fetchAll<Product>((a, b) => supabase.from("products").select("id, brand_id, name, status, created_at").order("name").order("id").range(a, b)),
  ]);
  return { brands, products };
});

export const getProduct = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("id, brand_id, name, status, created_at").eq("id", id).maybeSingle();
  if (!product) return null;
  const [{ data: brand }, { data: pages, error }] = await Promise.all([
    supabase.from("brands").select("id, name, marketplace, tag_template").eq("id", product.brand_id).maybeSingle(),
    supabase.from("amazon_pages").select("id, product_id, name, url, archived_at").eq("product_id", id).order("created_at"),
  ]);
  if (error) throw new Error(error.message);
  if (!brand) return null;
  return { product: product as Product, brand: brand as Brand, pages: (pages ?? []) as AmazonPage[] };
});

export async function getBrand(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("id, name, marketplace, tag_template").eq("id", id).maybeSingle();
  return (data as Brand | null) ?? null;
}

/** Every link in a product the person may see: all of them for the team, their own for a creator. */
export async function getLinks(filter: { product?: string; brand?: string }) {
  const supabase = await createClient();
  if (filter.brand) {
    const { products } = await getNav();
    const ids = products.filter((p) => p.brand_id === filter.brand).map((p) => p.id);
    if (!ids.length) return [] as Link[];
    return fetchAll<Link>((a, b) => supabase.from("links").select(LINK_COLS).in("product_id", ids).order("created_at", { ascending: false }).order("id").range(a, b));
  }
  return fetchAll<Link>((a, b) => {
    let q = supabase.from("links").select(LINK_COLS);
    if (filter.product) q = q.eq("product_id", filter.product);
    return q.order("created_at", { ascending: false }).order("id").range(a, b);
  });
}

export async function getProfilesByIds(ids: string[]) {
  const map = new Map<string, Profile>();
  const unique = [...new Set(ids)];
  if (!unique.length) return map;
  const supabase = await createClient();
  for (let i = 0; i < unique.length; i += 200) {
    const { data, error } = await supabase.from("profiles").select(PROFILE_COLS).in("id", unique.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const p of (data ?? []) as Profile[]) map.set(p.id, p);
  }
  return map;
}

export async function getAllProfiles() {
  const supabase = await createClient();
  return fetchAll<Profile>((a, b) => supabase.from("profiles").select(PROFILE_COLS).order("created_at").order("id").range(a, b));
}

/** Creator ids who joined this product through an invite link. */
export async function getMemberIds(productId: string) {
  const supabase = await createClient();
  const rows = await fetchAll<{ creator_id: string; joined_at: string }>((a, b) =>
    supabase.from("memberships").select("creator_id, joined_at").eq("product_id", productId).order("joined_at").order("creator_id").range(a, b));
  return rows;
}

export async function getAllMemberships() {
  const supabase = await createClient();
  return fetchAll<{ creator_id: string; product_id: string }>((a, b) =>
    supabase.from("memberships").select("creator_id, product_id").order("product_id").order("creator_id").range(a, b));
}

export async function getInvites(filter: { product?: string; role: "creator" | "team" }) {
  const supabase = await createClient();
  let q = supabase.from("invites").select("id, code, name, role, product_id, active, expires_at, max_uses, uses, created_at").eq("role", filter.role);
  if (filter.product) q = q.eq("product_id", filter.product);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Invite[];
}

// ---------- numbers ----------
type Scope = { product?: string; brand?: string; from: string | null; to: string | null };
type Raw = { clicks: number | string; dpv: number | string; atc: number | string; purchases: number | string; units: number | string; sales: number | string };
const toTotals = (r: Raw): Totals => ({
  clicks: Number(r.clicks), dpv: Number(r.dpv), atc: Number(r.atc),
  purchases: Number(r.purchases), units: Number(r.units), sales: Number(r.sales),
});

/** Totals per link for a date range. Links with no activity are simply absent. */
export async function getLinkTotals(scope: Scope): Promise<Map<string, Totals>> {
  const supabase = await createClient();
  const rows = await fetchAll<Raw & { link_id: string }>((a, b) =>
    supabase.rpc("link_totals", { p_product: scope.product ?? null, p_brand: scope.brand ?? null, p_from: scope.from, p_to: scope.to })
      .order("link_id").range(a, b));
  return new Map(rows.map((r) => [r.link_id, toTotals(r)]));
}

/** Totals per product for a date range, across everything the person may see. */
export async function getProductTotals(from: string | null, to: string | null): Promise<Map<string, Totals>> {
  const supabase = await createClient();
  const rows = await fetchAll<Raw & { product_id: string }>((a, b) =>
    supabase.rpc("product_totals", { p_from: from, p_to: to }).order("product_id").range(a, b));
  return new Map(rows.map((r) => [r.product_id, toTotals(r)]));
}

/** Totals per day. Pass linkIds to narrow to a filtered set of links. */
export async function getDailyTotals(scope: Scope, linkIds?: string[] | null): Promise<DayRow[]> {
  if (linkIds && linkIds.length === 0) return [];
  const supabase = await createClient();
  const rows = await fetchAll<Raw & { day: string }>((a, b) =>
    supabase.rpc("daily_totals", { p_product: scope.product ?? null, p_brand: scope.brand ?? null, p_from: scope.from, p_to: scope.to, p_links: linkIds ?? null })
      .order("day").range(a, b));
  return rows.map((r) => ({ day: r.day, ...toTotals(r) }));
}

/** Brand Referral Bonus. The database only answers this for the team. */
export async function getBonus(scope: Scope): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bonus_total", { p_product: scope.product ?? null, p_brand: scope.brand ?? null, p_from: scope.from, p_to: scope.to });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

/** Last day we hold numbers for. Amazon restates recent days, so this is shown next to every total. */
export async function getDataThrough(scope: { product?: string; brand?: string }): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("data_through", { p_product: scope.product ?? null, p_brand: scope.brand ?? null });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}

export const totalsFor = (map: Map<string, Totals>, linkId: string) => map.get(linkId) ?? ZERO;

export type AmazonStatus = {
  connected: boolean; region?: string; advertiser_id?: string | null; advertiser_name?: string | null;
  candidates?: { profileId: string; advertiserId: string; advertiserName: string; countryCode: string }[];
  connected_at?: string; last_sync_at?: string | null; last_sync_status?: string | null; last_sync_rows?: number | null;
};
/** Whether a brand is connected to the Amazon Ads API, and how the last sync went. Never returns the token. */
export async function getAmazonStatus(brandId: string): Promise<AmazonStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("amazon_status", { p_brand: brandId });
  if (error) throw new Error(error.message);
  return (data as AmazonStatus | null) ?? { connected: false };
}
