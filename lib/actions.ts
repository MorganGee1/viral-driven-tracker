"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/data";

async function requireManager() {
  const me = await getMe();
  if (!me || me.role !== "manager") throw new Error("Managers only");
  return me;
}

export async function addBrand(formData: FormData) {
  const me = await requireManager();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const marketplace = String(formData.get("marketplace") ?? "US");
  if (!name) return;
  await supabase.from("brands").insert({ name, marketplace, created_by: me.id });
  revalidatePath("/app", "layout");
}

export async function deleteBrand(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  await supabase.from("brands").delete().eq("id", String(formData.get("id")));
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function addCampaign(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const brand_id = String(formData.get("brand_id"));
  const name = String(formData.get("name") ?? "").trim();
  let product_url = String(formData.get("product_url") ?? "").trim();
  if (!name || !product_url) return;
  if (!/^https?:\/\//i.test(product_url)) product_url = `https://${product_url}`;
  const { data } = await supabase.from("campaigns").insert({ brand_id, name, product_url }).select("id").single();
  revalidatePath("/app", "layout");
  if (data) redirect(`/app/campaigns/${data.id}`);
}

export async function updateCampaign(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const product_url = String(formData.get("product_url") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  await supabase.from("campaigns").update({ name, product_url, status }).eq("id", id);
  revalidatePath("/app", "layout");
}

export async function deleteCampaign(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  await supabase.from("campaigns").delete().eq("id", String(formData.get("id")));
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function createLink(formData: FormData) {
  const me = await getMe();
  if (!me) return;
  const supabase = await createClient();
  const campaign_id = String(formData.get("campaign_id"));
  const placement = String(formData.get("placement") ?? "bio");
  const note = String(formData.get("note") ?? "").trim() || null;
  const owner_id = me.role === "manager" && formData.get("owner_id") ? String(formData.get("owner_id")) : me.id;
  await supabase.from("links").insert({ campaign_id, placement, note, owner_id });
  revalidatePath(`/app/campaigns/${campaign_id}`, "layout");
}

export async function deleteLink(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const campaign_id = String(formData.get("campaign_id"));
  await supabase.from("links").delete().eq("id", id);
  revalidatePath(`/app/campaigns/${campaign_id}`, "layout");
}

export async function setTag(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const campaign_id = String(formData.get("campaign_id"));
  const tag = String(formData.get("tag") ?? "").trim() || null;
  await supabase.from("links").update({ amazon_tag: tag }).eq("id", id);
  revalidatePath(`/app/campaigns/${campaign_id}`, "layout");
}

export async function setRole(formData: FormData) {
  const me = await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const role = String(formData.get("role")) === "manager" ? "manager" : "creator";
  if (id === me.id && role !== "manager") return; // don't demote yourself
  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/app/team");
}

/**
 * Import an Amazon Attribution report CSV.
 * Matches rows to links by the tag stored on the link (link.amazon_tag) or by a column named "Link ID" / "Ad group" whose value equals the link's short id.
 * Accepts the standard columns: Date, Clicks, Detail Page Views, Add to Carts, Purchases, Units Sold, Sales, Brand Referral Bonus (optional).
 */
export async function importReport(formData: FormData): Promise<{ ok: boolean; rows: number; matched: number; message: string }> {
  await requireManager();
  const supabase = await createClient();
  const campaign_id = String(formData.get("campaign_id"));
  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, rows: 0, matched: 0, message: "No file" };
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, rows: 0, matched: 0, message: "CSV has no data rows" };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => header.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  const cDate = col("date", "day");
  const cClicks = col("clicks");
  const cDpv = col("detail page view", "dpv");
  const cAtc = col("add to cart", "atc");
  const cPurch = col("purchases", "orders");
  const cUnits = col("units");
  const cSales = col("sales", "revenue");
  const cBonus = col("referral bonus", "brb");
  const cTag = col("creative", "ad group", "adgroup", "tag", "link id", "link");
  if (cDate < 0 || cTag < 0) return { ok: false, rows: rows.length - 1, matched: 0, message: "Need a Date column and an Ad group / Creative / Link column" };

  const { data: links } = await supabase.from("links").select("id, amazon_tag").eq("campaign_id", campaign_id);
  const byTag = new Map<string, string>();
  for (const l of links ?? []) {
    byTag.set(l.id, l.id);
    byTag.set(l.id.slice(0, 8), l.id);
    if (l.amazon_tag) byTag.set(l.amazon_tag.replace(/^\?/, "").trim(), l.id);
  }

  const upserts: Record<string, unknown>[] = [];
  const n = (i: number, r: string[]) => (i < 0 ? 0 : Number(String(r[i] ?? "0").replace(/[^0-9.\-]/g, "")) || 0);
  for (const r of rows.slice(1)) {
    const key = String(r[cTag] ?? "").trim();
    const link_id = byTag.get(key) ?? [...byTag.entries()].find(([k]) => key.includes(k))?.[1];
    if (!link_id) continue;
    const day = toIsoDate(r[cDate]);
    if (!day) continue;
    upserts.push({
      link_id, day,
      clicks: n(cClicks, r), detail_page_views: n(cDpv, r), add_to_carts: n(cAtc, r),
      purchases: n(cPurch, r), units: n(cUnits, r), sales: n(cSales, r), referral_bonus: n(cBonus, r),
    });
  }
  if (upserts.length) {
    const { error } = await supabase.from("link_stats").upsert(upserts, { onConflict: "link_id,day" });
    if (error) return { ok: false, rows: rows.length - 1, matched: upserts.length, message: error.message };
  }
  revalidatePath(`/app/campaigns/${campaign_id}`, "layout");
  return { ok: true, rows: rows.length - 1, matched: upserts.length, message: `${upserts.length} of ${rows.length - 1} rows matched a link` };
}

function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); out.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur.length || row.length) { row.push(cur); out.push(row); }
  return out.filter((r) => r.some((x) => x.trim() !== ""));
}

function toIsoDate(s: string): string | null {
  if (!s) return null;
  s = s.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`; // US m/d/y as Amazon exports
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
