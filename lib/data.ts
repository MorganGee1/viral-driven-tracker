import { createClient } from "@/lib/supabase/server";

export type Profile = { id: string; username: string; avatar_url: string | null; role: "manager" | "creator" };
export type Brand = { id: string; name: string; marketplace: string };
export type Campaign = { id: string; brand_id: string; name: string; product_url: string; status: string };
export type Link = {
  id: string; campaign_id: string; owner_id: string; placement: "bio" | "comment" | "manychat" | "other";
  note: string | null; amazon_tag: string | null; created_at: string;
};
export type Stat = {
  link_id: string; day: string; clicks: number; detail_page_views: number; add_to_carts: number;
  purchases: number; units: number; sales: number; referral_bonus: number;
};

export const PLACEMENTS: Record<Link["placement"], string> = {
  bio: "Bio link", comment: "Pinned comment", manychat: "ManyChat", other: "Other",
};

export async function getMe(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id, username, avatar_url, role").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

export async function getBrandsWithCampaigns() {
  const supabase = await createClient();
  const [{ data: brands }, { data: campaigns }] = await Promise.all([
    supabase.from("brands").select("id, name, marketplace").order("name"),
    supabase.from("campaigns").select("id, brand_id, name, product_url, status").order("name"),
  ]);
  return { brands: (brands ?? []) as Brand[], campaigns: (campaigns ?? []) as Campaign[] };
}

export async function getCampaign(id: string) {
  const supabase = await createClient();
  const { data: campaign } = await supabase.from("campaigns").select("id, brand_id, name, product_url, status").eq("id", id).single();
  if (!campaign) return null;
  const { data: brand } = await supabase.from("brands").select("id, name, marketplace").eq("id", campaign.brand_id).single();
  return { campaign: campaign as Campaign, brand: brand as Brand };
}

export async function getCampaignLinks(campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("links")
    .select("id, campaign_id, owner_id, placement, note, amazon_tag, created_at")
    .eq("campaign_id", campaignId).order("created_at", { ascending: false });
  return (data ?? []) as Link[];
}

export async function getProfilesByIds(ids: string[]) {
  if (!ids.length) return new Map<string, Profile>();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, username, avatar_url, role").in("id", ids);
  return new Map(((data ?? []) as Profile[]).map((p) => [p.id, p]));
}

export async function getAllProfiles() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, username, avatar_url, role, created_at").order("username");
  return (data ?? []) as (Profile & { created_at: string })[];
}

/** Stats for a set of links, for a day range (inclusive, yyyy-mm-dd). */
export async function getStats(linkIds: string[], from: string, to: string) {
  if (!linkIds.length) return [] as Stat[];
  const supabase = await createClient();
  const { data } = await supabase.from("link_stats").select("*").in("link_id", linkIds).gte("day", from).lte("day", to);
  return (data ?? []) as Stat[];
}

// ---------- period maths ----------
export function iso(d: Date) { return d.toISOString().slice(0, 10); }

export function monthRanges(now = new Date()) {
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), day = now.getUTCDate();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m, day));
  const prevStart = new Date(Date.UTC(y, m - 1, 1));
  const prevDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const prevEnd = new Date(Date.UTC(y, m - 1, Math.min(day, prevDays)));
  return { from: iso(start), to: iso(end), prevFrom: iso(prevStart), prevTo: iso(prevEnd), label: `1 – ${day} ${start.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}` };
}

export type Totals = { clicks: number; dpv: number; atc: number; purchases: number; units: number; sales: number; bonus: number };
export function sum(stats: Stat[]): Totals {
  return stats.reduce((t, s) => ({
    clicks: t.clicks + s.clicks, dpv: t.dpv + s.detail_page_views, atc: t.atc + s.add_to_carts,
    purchases: t.purchases + s.purchases, units: t.units + s.units, sales: t.sales + Number(s.sales), bonus: t.bonus + Number(s.referral_bonus),
  }), { clicks: 0, dpv: 0, atc: 0, purchases: 0, units: 0, sales: 0, bonus: 0 });
}

export function pct(now: number, prev: number) {
  if (!prev) return null;
  return Math.round(((now - prev) / prev) * 100);
}

export const money = (n: number, cur = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(n);
export const num = (n: number) => new Intl.NumberFormat("en-US").format(n);
export const currencyFor = (marketplace: string) => (marketplace === "UK" ? "GBP" : marketplace === "DE" || marketplace === "FR" ? "EUR" : "USD");

/** Build the URL a creator posts. */
export function taggedUrl(productUrl: string, tag: string | null) {
  if (!tag) return productUrl;
  const clean = tag.replace(/^\?/, "").trim();
  return productUrl.includes("?") ? `${productUrl}&${clean}` : `${productUrl}?${clean}`;
}
