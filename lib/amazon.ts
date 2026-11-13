import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, todayLA, toIsoDate } from "@/lib/util";

/**
 * Amazon Ads API: Login with Amazon + the Amazon Attribution endpoints.
 *
 * Written from Amazon's published API reference. It has been run end to end against a local stand-in
 * for Amazon, NOT against Amazon itself, because API access had not been approved when this was written.
 * Expect to adjust small things (field names in report rows) the first time it meets real data.
 *
 * What it calls, and nothing else:
 *   GET  /v2/profiles                          which advertiser accounts the brand approved
 *   GET  /attribution/advertisers              the Amazon Attribution advertiser for a profile
 *   GET  /attribution/publishers               to pick a publisher for the tag template
 *   GET  /attribution/tags/nonMacroTemplateTag the tag template links are built from
 *   POST /attribution/report                   daily clicks and sales per link
 */

export type Region = "NA" | "EU" | "FE";
const REGIONS: Record<Region, { auth: string; token: string; api: string }> = {
  NA: { auth: "https://www.amazon.com/ap/oa", token: "https://api.amazon.com/auth/o2/token", api: "https://advertising-api.amazon.com" },
  EU: { auth: "https://eu.account.amazon.com/ap/oa", token: "https://api.amazon.co.uk/auth/o2/token", api: "https://advertising-api-eu.amazon.com" },
  FE: { auth: "https://apac.account.amazon.com/ap/oa", token: "https://api.amazon.co.jp/auth/o2/token", api: "https://advertising-api-fe.amazon.com" },
};
/** AMAZON_TEST_BASE points every call at a local stand-in. It is only ever set in tests. */
function endpoints(region: Region) {
  const t = process.env.AMAZON_TEST_BASE;
  return t ? { auth: `${t}/ap/oa`, token: `${t}/auth/o2/token`, api: t } : REGIONS[region];
}
export const regionFor = (marketplace: string): Region => (["US", "CA", "MX", "BR"].includes(marketplace) ? "NA" : ["JP", "AU", "SG"].includes(marketplace) ? "FE" : "EU");
export const amazonConfigured = () =>
  !!process.env.AMAZON_CLIENT_ID && !!process.env.AMAZON_CLIENT_SECRET && !!process.env.AMAZON_TOKEN_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------- keeping the refresh token encrypted at rest ----------
const key = () => crypto.createHash("sha256").update(process.env.AMAZON_TOKEN_KEY ?? "").digest();
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64");
}
export function decrypt(enc: string): string {
  const raw = Buffer.from(enc, "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
}

// ---------- Login with Amazon ----------
export function authorizeUrl(region: Region, redirectUri: string, state: string) {
  const q = new URLSearchParams({
    client_id: process.env.AMAZON_CLIENT_ID!, scope: "advertising::campaign_management", response_type: "code", redirect_uri: redirectUri, state,
  });
  return `${endpoints(region).auth}?${q}`;
}
async function token(region: Region, params: Record<string, string>) {
  const res = await fetch(endpoints(region).token, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, cache: "no-store",
    body: new URLSearchParams({ ...params, client_id: process.env.AMAZON_CLIENT_ID!, client_secret: process.env.AMAZON_CLIENT_SECRET! }),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; error_description?: string; error?: string };
  if (!res.ok || !body.access_token) throw new Error(`Login with Amazon refused: ${body.error_description ?? body.error ?? res.status}`);
  return body;
}
export const exchangeCode = (region: Region, code: string, redirectUri: string) => token(region, { grant_type: "authorization_code", code, redirect_uri: redirectUri });
export const refreshAccess = async (region: Region, refreshToken: string) => (await token(region, { grant_type: "refresh_token", refresh_token: refreshToken })).access_token!;

// ---------- API calls ----------
async function api<T>(region: Region, access: string, profileId: string | null, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${access}`, "Amazon-Advertising-API-ClientId": process.env.AMAZON_CLIENT_ID!, Accept: "application/json",
  };
  if (profileId) headers["Amazon-Advertising-API-Scope"] = profileId;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${endpoints(region).api}${path}`, { method: init.method ?? "GET", headers, cache: "no-store", body: init.body !== undefined ? JSON.stringify(init.body) : undefined });
    if ((res.status === 429 || res.status >= 500) && attempt < 3) { await new Promise((r) => setTimeout(r, 800 * 2 ** attempt)); continue; }
    const text = await res.text();
    if (!res.ok) throw new AmazonError(res.status, `Amazon ${path.split("?")[0]} answered ${res.status}: ${text.slice(0, 300)}`);
    return (text ? JSON.parse(text) : null) as T;
  }
}
export class AmazonError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export type Candidate = { profileId: string; advertiserId: string; advertiserName: string; countryCode: string };

/** Every Amazon Attribution advertiser the signed-in Amazon account can reach, for the brand's marketplace first. */
export async function findAdvertisers(region: Region, access: string, marketplace: string): Promise<Candidate[]> {
  const profiles = (await api<{ profileId: number | string; countryCode?: string }[]>(region, access, null, "/v2/profiles")) ?? [];
  const mine = profiles.filter((p) => (p.countryCode ?? "").toUpperCase() === marketplace.toUpperCase());
  const out: Candidate[] = [];
  const seen = new Set<string>();
  for (const p of (mine.length ? mine : profiles).slice(0, 40)) {
    const profileId = String(p.profileId);
    const res = await api<{ advertisers?: { advertiserId: string; advertiserName: string }[] }>(region, access, profileId, "/attribution/advertisers").catch(() => null);
    for (const a of res?.advertisers ?? []) {
      if (seen.has(a.advertiserId)) continue;
      seen.add(a.advertiserId);
      out.push({ profileId, advertiserId: String(a.advertiserId), advertiserName: a.advertiserName, countryCode: p.countryCode ?? "" });
    }
  }
  return out;
}

/** Finds the first string anywhere in Amazon's answer that looks like an Attribution tag. */
function findTag(node: unknown): string | null {
  if (typeof node === "string") return node.includes("aa_creativeid") && node.includes("maas") ? node : null;
  if (Array.isArray(node)) { for (const n of node) { const t = findTag(n); if (t) return t; } return null; }
  if (node && typeof node === "object") { for (const v of Object.values(node)) { const t = findTag(v); if (t) return t; } }
  return null;
}

/** The tag template links are built from: a publisher that takes plain (non-macro) tags, social ones first. */
export async function fetchTagTemplate(region: Region, access: string, c: Pick<Candidate, "profileId" | "advertiserId">): Promise<string> {
  const pubs = (await api<{ publishers?: { id: string; name: string; macroEnabled?: boolean }[] }>(region, access, c.profileId, "/attribution/publishers"))?.publishers ?? [];
  const plain = pubs.filter((p) => !p.macroEnabled);
  const order = [/^instagram$/i, /instagram/i, /tiktok/i, /facebook/i, /social/i, /other/i];
  const pick = order.map((re) => plain.find((p) => re.test(p.name))).find(Boolean) ?? plain[0];
  if (!pick) throw new Error("Amazon returned no publisher that takes plain tags.");
  const q = new URLSearchParams({ publisherIds: String(pick.id), advertiserIds: c.advertiserId });
  const tag = findTag(await api<unknown>(region, access, c.profileId, `/attribution/tags/nonMacroTemplateTag?${q}`));
  if (!tag) throw new Error(`Amazon returned no tag template for publisher ${pick.name}.`);
  return tag.replace(/^[?&]+/, "");
}

// ---------- the nightly sync ----------
const FULL = ["Click-throughs", "attributedDetailPageViewsClicks14d", "attributedAddToCartClicks14d", "attributedPurchases14d", "unitsSold14d", "attributedSales14d",
  "attributedTotalDetailPageViewsClicks14d", "attributedTotalAddToCartClicks14d", "attributedTotalPurchases14d", "totalUnitsSold14d", "totalAttributedSales14d", "brb_bonus_amount"];
/** Fallback if Amazon rejects a name in the full list. */
const SAFE = ["Click-throughs", "attributedTotalDetailPageViewsClicks14d", "attributedTotalPurchases14d", "totalUnitsSold14d", "totalAttributedSales14d", "brb_bonus_amount"];

type Row = Record<string, unknown>;
async function fetchReport(region: Region, access: string, c: { profileId: string; advertiserId: string }, from: string, to: string, metrics: string[]): Promise<Row[]> {
  const rows: Row[] = [];
  let cursorId = "";
  for (let page = 0; page < 500; page++) {
    const res = await api<{ reports?: Row[]; cursorId?: string | null } | Row[]>(region, access, c.profileId, "/attribution/report", {
      method: "POST",
      // one row per ad group per day. Each link is its own ad group, and Amazon only gives Brand Referral Bonus at this level.
      body: { reportType: "PERFORMANCE", advertiserIds: c.advertiserId, startDate: from.replace(/-/g, ""), endDate: to.replace(/-/g, ""), groupBy: "ADGROUP", count: 5000, cursorId, metrics: metrics.join(",") },
    });
    const batch = Array.isArray(res) ? res : res?.reports ?? [];
    rows.push(...batch);
    const next = Array.isArray(res) ? "" : res?.cursorId ?? "";
    if (!batch.length || !next || next === cursorId) break;
    cursorId = next;
  }
  return rows;
}

const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
function reader(row: Row) {
  const m = new Map(Object.entries(row).map(([k, v]) => [norm(k), v]));
  const n = (...keys: string[]) => { for (const k of keys) { const v = m.get(norm(k)); if (v !== undefined && v !== null && v !== "") return Number(String(v).replace(/[^0-9.\-]/g, "")) || 0; } return 0; };
  const s = (...keys: string[]) => { for (const k of keys) { const v = m.get(norm(k)); if (v !== undefined && v !== null) return String(v); } return ""; };
  return { n, s };
}

export type SyncResult = { ok: boolean; message: string; rows: number; links: number };

/** Pulls the last 31 days for one brand and replaces those days in the tracker. Amazon restates recent days, so always 31. */
export async function syncBrand(brandId: string): Promise<SyncResult> {
  const db = createAdminClient();
  const finish = async (r: SyncResult) => {
    await db.from("amazon_connections").update({ last_sync_at: new Date().toISOString(), last_sync_status: r.ok ? "ok" : r.message.slice(0, 500), last_sync_rows: r.rows }).eq("brand_id", brandId);
    return r;
  };
  const { data: conn } = await db.from("amazon_connections").select("region, refresh_token_enc, profile_id, advertiser_id").eq("brand_id", brandId).maybeSingle();
  if (!conn) return { ok: false, message: "This brand is not connected to Amazon.", rows: 0, links: 0 };
  if (!conn.profile_id || !conn.advertiser_id) return finish({ ok: false, message: "Pick which Amazon Attribution advertiser this brand is, in Settings.", rows: 0, links: 0 });
  try {
    const region = conn.region as Region;
    const access = await refreshAccess(region, decrypt(conn.refresh_token_enc));
    const today = todayLA();
    const from = addDays(today, -31);
    const who = { profileId: conn.profile_id, advertiserId: conn.advertiser_id };
    let rows: Row[];
    let note = "";
    try {
      rows = await fetchReport(region, access, who, from, today, FULL);
    } catch (e) {
      if (!(e instanceof AmazonError) || e.status !== 400) throw e;
      rows = await fetchReport(region, access, who, from, today, SAFE);
      note = " Add to cart was not available from Amazon for this pull.";
    }

    // which links belong to this brand, by their ID (the ad group in the tag)
    const { data: products } = await db.from("products").select("id").eq("brand_id", brandId);
    const productIds = (products ?? []).map((p) => p.id);
    const byShort = new Map<string, string>();
    for (let i = 0; productIds.length; i += 1000) {
      const { data, error } = await db.from("links").select("id, short_id").in("product_id", productIds).order("id").range(i, i + 999);
      if (error) throw new Error(error.message);
      for (const l of data ?? []) byShort.set(l.short_id.toLowerCase(), l.id);
      if (!data || data.length < 1000) break;
    }

    type Acc = { link_id: string; day: string; clicks: number; detail_page_views: number; add_to_carts: number; purchases: number; units: number; sales: number; bonus: number };
    const acc = new Map<string, Acc>();
    let sawBonus = false;
    for (const row of rows) {
      const { n, s } = reader(row);
      const link_id = byShort.get(s("adGroupId", "adgroupId", "creativeId").toLowerCase());
      const day = toIsoDate(s("date", "reportDate"));
      if (!link_id || !day) continue;
      const k = `${link_id}|${day}`;
      const a = acc.get(k) ?? { link_id, day, clicks: 0, detail_page_views: 0, add_to_carts: 0, purchases: 0, units: 0, sales: 0, bonus: 0 };
      a.clicks += n("Click-throughs", "clickThroughs");
      a.detail_page_views += n("attributedTotalDetailPageViewsClicks14d", "attributedDetailPageViewsClicks14d");
      a.add_to_carts += n("attributedTotalAddToCartClicks14d", "attributedAddToCartClicks14d");
      a.purchases += n("attributedTotalPurchases14d", "attributedPurchases14d");
      a.units += n("totalUnitsSold14d", "unitsSold14d");
      a.sales += n("totalAttributedSales14d", "attributedSales14d");
      if (Object.keys(row).some((key) => norm(key) === "brbbonusamount")) { sawBonus = true; a.bonus += n("brb_bonus_amount"); }
      acc.set(k, a);
    }
    const all = [...acc.values()];
    for (let i = 0; i < all.length; i += 500) {
      const chunk = all.slice(i, i + 500);
      const { error } = await db.from("link_stats").upsert(chunk.map((a) => ({
        link_id: a.link_id, day: a.day, clicks: Math.round(a.clicks), detail_page_views: Math.round(a.detail_page_views), add_to_carts: Math.round(a.add_to_carts),
        purchases: Math.round(a.purchases), units: Math.round(a.units), sales: Math.round(a.sales * 100) / 100,
      })), { onConflict: "link_id,day" });
      if (error) throw new Error(error.message);
      if (sawBonus) {
        const { error: e2 } = await db.from("link_bonus").upsert(chunk.map((a) => ({ link_id: a.link_id, day: a.day, amount: Math.round(a.bonus * 100) / 100 })), { onConflict: "link_id,day" });
        if (e2) throw new Error(e2.message);
      }
    }
    const links = new Set(all.map((a) => a.link_id)).size;
    return finish({ ok: true, rows: rows.length, links, message: `Pulled ${rows.length} rows from Amazon for ${from} to ${today}, covering ${links} links.${note}` });
  } catch (e) {
    return finish({ ok: false, message: e instanceof Error ? e.message : "Sync failed", rows: 0, links: 0 });
  }
}

/** Saves which advertiser the brand is, fetches its tag template, and tags any links still waiting. */
export async function finishConnection(brandId: string, c: Candidate, region: Region, access: string) {
  const db = createAdminClient();
  const template = await fetchTagTemplate(region, access, c);
  const { error } = await db.from("amazon_connections").update({ profile_id: c.profileId, advertiser_id: c.advertiserId, advertiser_name: c.advertiserName }).eq("brand_id", brandId);
  if (error) throw new Error(error.message);
  await db.from("brands").update({ tag_template: template }).eq("id", brandId);
  await db.rpc("apply_tag_template", { p_brand: brandId });
}
