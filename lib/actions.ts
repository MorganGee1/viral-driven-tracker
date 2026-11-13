"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/data";
import {
  PLACEMENTS, PLATFORMS, cleanAmazonUrl, defaultLinkName, isTeamRole, parseCsv, toIsoDate,
  type Placement, type Platform,
} from "@/lib/util";

// ---------- helpers ----------
const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);

/** Where to send the person back to, taken from the form. Only ever a path inside the app. */
function backTo(fd: FormData, fallback: string) {
  const raw = String(fd.get("back") ?? "");
  if (!raw.startsWith("/app")) return fallback;
  const [path, query = ""] = raw.split("?");
  const sp = new URLSearchParams(query);
  sp.delete("error"); sp.delete("ok"); sp.delete("new");
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
}
function withParam(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}
function fail(path: string, message: string): never {
  redirect(withParam(path, "error", message));
}

async function requireMe() {
  const me = await getMe();
  if (!me) redirect("/login");
  return me;
}
async function requireTeam() {
  const me = await requireMe();
  if (!isTeamRole(me.role)) redirect("/app");
  return me;
}
async function requireOwner() {
  const me = await requireMe();
  if (me.role !== "owner") redirect("/app");
  return me;
}

// ---------- brands ----------
export async function addBrand(fd: FormData) {
  const me = await requireTeam();
  const name = str(fd, "name", 80);
  const marketplace = str(fd, "marketplace", 4) || "US";
  if (!name) fail("/app", "Give the brand a name.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("brands").insert({ name, marketplace, created_by: me.id }).select("id").single();
  if (error || !data) fail("/app", "Could not add the brand. Try again.");
  revalidatePath("/app", "layout");
  redirect(`/app/brands/${data.id}`);
}

export async function updateBrand(fd: FormData) {
  await requireTeam();
  const id = str(fd, "id");
  const back = backTo(fd, `/app/brands/${id}`);
  const name = str(fd, "name", 80);
  const marketplace = str(fd, "marketplace", 4) || "US";
  if (!name) fail(back, "The brand needs a name.");
  const supabase = await createClient();
  const { error } = await supabase.from("brands").update({ name, marketplace }).eq("id", id);
  if (error) fail(back, "Could not save the brand.");
  revalidatePath("/app", "layout");
  redirect(withParam(back, "ok", "Brand saved"));
}

export async function setTagTemplate(fd: FormData) {
  await requireTeam();
  const id = str(fd, "brand_id");
  const back = backTo(fd, `/app/brands/${id}`);
  const tpl = str(fd, "tag_template", 1000).replace(/^[?&]+/, "");
  if (tpl && !(tpl.includes("aa_campaignid=") && tpl.includes("aa_adgroupid=") && tpl.includes("aa_creativeid="))) {
    fail(back, "That does not look like an Amazon Attribution tag template. It needs aa_campaignid, aa_adgroupid and aa_creativeid in it.");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("brands").update({ tag_template: tpl || null }).eq("id", id);
  if (error) fail(back, "Could not save the tag template.");
  revalidatePath("/app", "layout");
  redirect(withParam(back, "ok", tpl ? "Tag template saved. New links are tagged automatically." : "Tag template removed"));
}

// ---------- products and Amazon pages ----------
export async function addProduct(fd: FormData) {
  await requireTeam();
  const brand_id = str(fd, "brand_id");
  const back = backTo(fd, `/app/brands/${brand_id}`);
  const name = str(fd, "name", 80);
  const pageName = str(fd, "page_name", 80) || name;
  const url = cleanAmazonUrl(str(fd, "page_url", 600));
  if (!name) fail(back, "Give the product a name.");
  if (!url) fail(back, "The Amazon page has to be an amazon address, like https://www.amazon.com/dp/B0XXXXXXXX.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert({ brand_id, name }).select("id").single();
  if (error || !data) fail(back, "Could not add the product.");
  const { error: e2 } = await supabase.from("amazon_pages").insert({ product_id: data.id, name: pageName, url });
  if (e2) fail(`/app/products/${data.id}/settings`, "Product added, but the Amazon page did not save. Add it here.");
  revalidatePath("/app", "layout");
  redirect(`/app/products/${data.id}/creators?ok=${encodeURIComponent("Product added. Create an invite link to bring creators in.")}`);
}

export async function updateProduct(fd: FormData) {
  await requireTeam();
  const id = str(fd, "id");
  const back = backTo(fd, `/app/products/${id}/settings`);
  const name = str(fd, "name", 80);
  if (!name) fail(back, "The product needs a name.");
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ name }).eq("id", id);
  if (error) fail(back, "Could not save the product.");
  revalidatePath("/app", "layout");
  redirect(withParam(back, "ok", "Product saved"));
}

export async function setProductStatus(fd: FormData) {
  await requireTeam();
  const id = str(fd, "id");
  const back = backTo(fd, `/app/products/${id}/settings`);
  const status = str(fd, "status") === "archived" ? "archived" : "active";
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) fail(back, "Could not change the product.");
  revalidatePath("/app", "layout");
  redirect(withParam(back, "ok", status === "archived" ? "Product archived. Creators no longer see it. Its sales stay in the reports." : "Product is live again"));
}

export async function addPage(fd: FormData) {
  await requireTeam();
  const product_id = str(fd, "product_id");
  const back = backTo(fd, `/app/products/${product_id}/settings`);
  const name = str(fd, "name", 80);
  const url = cleanAmazonUrl(str(fd, "url", 600));
  if (!name) fail(back, "Give the Amazon page a name creators will recognise.");
  if (!url) fail(back, "That is not an Amazon address. It should look like https://www.amazon.com/dp/B0XXXXXXXX.");
  const supabase = await createClient();
  const { error } = await supabase.from("amazon_pages").insert({ product_id, name, url });
  if (error) fail(back, "Could not add the Amazon page.");
  revalidatePath(`/app/products/${product_id}`, "layout");
  redirect(withParam(back, "ok", "Amazon page added"));
}

export async function updatePage(fd: FormData) {
  await requireTeam();
  const id = str(fd, "id");
  const product_id = str(fd, "product_id");
  const back = backTo(fd, `/app/products/${product_id}/settings`);
  const name = str(fd, "name", 80);
  const url = cleanAmazonUrl(str(fd, "url", 600));
  if (!name) fail(back, "The Amazon page needs a name.");
  if (!url) fail(back, "That is not an Amazon address.");
  const supabase = await createClient();
  const { error } = await supabase.from("amazon_pages").update({ name, url }).eq("id", id);
  if (error) fail(back, "Could not save the Amazon page.");
  revalidatePath(`/app/products/${product_id}`, "layout");
  redirect(withParam(back, "ok", "Amazon page saved"));
}

/** Removing a page hides it from creators. Links already made for it keep working. */
export async function setPageArchived(fd: FormData) {
  await requireTeam();
  const id = str(fd, "id");
  const product_id = str(fd, "product_id");
  const back = backTo(fd, `/app/products/${product_id}/settings`);
  const archived = str(fd, "archived") === "1";
  const supabase = await createClient();
  const { error } = await supabase.from("amazon_pages").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id);
  if (error) fail(back, "Could not change the Amazon page.");
  revalidatePath(`/app/products/${product_id}`, "layout");
  redirect(withParam(back, "ok", archived ? "Amazon page removed from the list creators pick from" : "Amazon page restored"));
}

// ---------- invite links ----------
export async function createInvite(fd: FormData) {
  const me = await requireTeam();
  const role = str(fd, "role") === "team" ? "team" : "creator";
  const product_id = role === "creator" ? str(fd, "product_id") : null;
  const back = backTo(fd, role === "team" ? "/app/team" : `/app/products/${product_id}/creators`);
  if (role === "team" && me.role !== "owner") fail(back, "Only the owner can invite team members.");
  const name = str(fd, "name", 80) || (role === "team" ? "Team invite" : "Creator invite");
  const days = Number(str(fd, "expires_days"));
  const max = Number(str(fd, "max_uses"));
  const supabase = await createClient();
  const { error } = await supabase.from("invites").insert({
    name, role, product_id, created_by: me.id,
    expires_at: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null,
    max_uses: max > 0 ? Math.floor(max) : null,
  });
  if (error) fail(back, "Could not create the invite link.");
  revalidatePath(back.split("?")[0]);
  redirect(withParam(back, "ok", "Invite link created. Copy it and send it."));
}

export async function setInviteActive(fd: FormData) {
  await requireTeam();
  const id = str(fd, "id");
  const back = backTo(fd, "/app/team");
  const active = str(fd, "active") === "1";
  const supabase = await createClient();
  const { data, error } = await supabase.from("invites").update({ active }).eq("id", id).select("id");
  if (error || !data?.length) fail(back, "Could not change that invite link.");
  revalidatePath(back.split("?")[0]);
  redirect(withParam(back, "ok", active ? "Invite link switched on" : "Invite link switched off. Nobody new can join with it."));
}

// ---------- tracking links ----------
export async function createLink(fd: FormData) {
  const me = await requireMe();
  const product_id = str(fd, "product_id");
  const back = backTo(fd, `/app/products/${product_id}`);
  const platform = str(fd, "platform") as Platform;
  const placement = str(fd, "placement") as Placement;
  const account = str(fd, "account", 80);
  const note = str(fd, "note", 300) || null;
  if (!(platform in PLATFORMS)) fail(back, "Pick a platform.");
  if (!(placement in PLACEMENTS)) fail(back, "Pick where the link will go.");
  if (!account) fail(back, "Type the account this link is for, for example @yourhandle.");
  const name = str(fd, "name", 80) || defaultLinkName(platform, placement);
  const owner_id = isTeamRole(me.role) && str(fd, "owner_id") ? str(fd, "owner_id") : me.id;

  const supabase = await createClient();
  let page_id = str(fd, "page_id");
  if (!page_id) {
    const { data: pages } = await supabase.from("amazon_pages").select("id").eq("product_id", product_id).is("archived_at", null).order("created_at");
    if (pages?.length === 1) page_id = pages[0].id;
    else fail(back, "Pick the Amazon page this link should open.");
  }
  const { data, error } = await supabase.from("links")
    .insert({ product_id, page_id, owner_id, platform, account, placement, name, note })
    .select("id").single();
  if (error || !data) fail(back, "Could not make the link. If this keeps happening, ask your manager to check you were added to this product.");
  revalidatePath(`/app/products/${product_id}`, "layout");
  redirect(withParam(back, "new", data.id));
}

export async function updateLink(fd: FormData) {
  await requireMe();
  const id = str(fd, "id");
  const product_id = str(fd, "product_id");
  const back = backTo(fd, `/app/products/${product_id}`);
  const name = str(fd, "name", 80);
  const note = str(fd, "note", 300) || null;
  if (!name) fail(back, "The link needs a name.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("links").update({ name, note }).eq("id", id).select("id");
  if (error || !data?.length) fail(back, "Could not rename the link.");
  revalidatePath(`/app/products/${product_id}`, "layout");
  redirect(withParam(back, "ok", "Link saved"));
}

/** Links are never deleted: an old one may still be live in a bio and its sales stay in the reports. */
export async function setLinkArchived(fd: FormData) {
  await requireMe();
  const id = str(fd, "id");
  const product_id = str(fd, "product_id");
  const back = backTo(fd, `/app/products/${product_id}`);
  const archived = str(fd, "archived") === "1";
  const supabase = await createClient();
  const { data, error } = await supabase.from("links").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id).select("id");
  if (error || !data?.length) fail(back, "Could not change the link.");
  revalidatePath(`/app/products/${product_id}`, "layout");
  redirect(withParam(back, "ok", archived ? "Link archived. It still counts sales if it is live somewhere." : "Link restored"));
}

export async function setTag(fd: FormData) {
  await requireTeam();
  const id = str(fd, "id");
  const product_id = str(fd, "product_id");
  const back = backTo(fd, `/app/products/${product_id}/links`);
  let tag = str(fd, "tag", 1000);
  // accept a whole pasted Amazon address and keep only the part after the question mark
  if (/^https?:\/\//i.test(tag)) tag = tag.includes("?") ? tag.slice(tag.indexOf("?") + 1) : "";
  tag = tag.replace(/^[?&]+/, "");
  const supabase = await createClient();
  const { error } = await supabase.from("links").update({ amazon_tag: tag || null }).eq("id", id);
  if (error) fail(back, "Could not save the tag.");
  revalidatePath(`/app/products/${product_id}`, "layout");
  redirect(withParam(back, "ok", tag ? "Tag saved. The link is tracked." : "Tag removed"));
}

// ---------- people ----------
export async function setRole(fd: FormData) {
  const me = await requireOwner();
  const id = str(fd, "id");
  const role = str(fd, "role");
  if (!["owner", "team", "creator"].includes(role)) fail("/app/team", "Pick a role.");
  if (id === me.id) fail("/app/team", "You cannot change your own role. Another owner has to do it.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select("id");
  if (error || !data?.length) fail("/app/team", "Could not change that role.");
  revalidatePath("/app", "layout");
  redirect(withParam("/app/team", "ok", "Role saved"));
}

// ---------- Amazon Attribution report upload ----------
export type ImportResult = {
  ok: boolean; message: string; rows: number; matched: number; links: number;
  days?: string; columns?: string[]; unmatched?: string[];
};

/**
 * Reads an Amazon Attribution report (CSV) and stores the numbers per link per day.
 * A row belongs to a link when any name column on it (campaign, ad group, creative, tag) contains the
 * link's short id, or carries the link's exact tag. Columns that include brand halo ("Total ...") win
 * over the promoted-product-only ones, so totals match what the brand sees in Amazon.
 */
export async function importReport(fd: FormData): Promise<ImportResult> {
  const me = await getMe();
  const none = { rows: 0, matched: 0, links: 0 };
  if (!me || !isTeamRole(me.role)) return { ok: false, message: "Team only.", ...none };
  const product_id = str(fd, "product_id");
  const file = fd.get("file") as File | null;
  if (!file || !file.size) return { ok: false, message: "Choose a CSV file first.", ...none };
  if (file.size > 20 * 1024 * 1024) return { ok: false, message: "That file is over 20 MB. Export a shorter date range.", ...none };
  const table = parseCsv(await file.text());
  // Amazon exports sometimes carry title lines above the header: find the row that has a date column.
  const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
  const headIdx = table.findIndex((r) => r.some((c) => ["date", "day", "reportdate"].includes(norm(c))));
  if (headIdx < 0) return { ok: false, message: "No Date column found. Export the report by day (daily granularity) and upload that.", ...none };
  const header = table[headIdx].map(norm);
  const body = table.slice(headIdx + 1);
  if (!body.length) return { ok: false, message: "The file has a header but no rows.", ...none };

  const find = (...names: string[]) => { for (const n of names) { const i = header.indexOf(n); if (i >= 0) return i; } return -1; };
  const cDate = find("date", "day", "reportdate");
  const cClicks = find("clickthroughs", "clicks", "totalclicks", "clickthrus");
  const cDpv = find("totaldetailpageviews", "totaldpv", "totaldetailpageviewclicks", "detailpageviews", "dpv", "detailpageviewclicks");
  const cAtc = find("totaladdtocart", "totaladdtocarts", "totalatc", "addtocart", "addtocarts", "atc");
  const cPurch = find("totalpurchases", "purchases", "orders", "totalorders");
  const cUnits = find("totalunitssold", "totalunits", "unitssold", "units");
  const cSales = find("totalsales", "totalproductsales", "sales", "productsales", "revenue", "attributedsales");
  const cBonus = find("brandreferralbonus", "brb", "referralbonus", "estimatedbrandreferralbonus");
  const nameCols = header.map((h, i) => (/(campaign|adgroup|creative|tag|linkid|link|adname|ad)$/.test(h) || /^(campaign|adgroup|creative|tag|link)/.test(h) ? i : -1)).filter((i) => i >= 0);
  if (!nameCols.length) return { ok: false, message: "No Campaign, Ad group or Creative column found, so rows cannot be matched to links.", rows: body.length, matched: 0, links: 0 };
  if (cSales < 0 && cPurch < 0 && cClicks < 0) return { ok: false, message: "No Clicks, Purchases or Sales columns found in this file.", rows: body.length, matched: 0, links: 0 };

  const supabase = await createClient();
  const links: { id: string; short_id: string; amazon_tag: string | null }[] = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await supabase.from("links").select("id, short_id, amazon_tag").eq("product_id", product_id).order("id").range(i, i + 999);
    if (error) return { ok: false, message: error.message, rows: body.length, matched: 0, links: 0 };
    links.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const byToken = new Map<string, string>();
  const byTag = new Map<string, string>();
  for (const l of links) {
    byToken.set(l.short_id.toLowerCase(), l.id);
    byToken.set(l.id.toLowerCase(), l.id);
    if (l.amazon_tag) byTag.set(l.amazon_tag.replace(/^[?&]+/, "").trim(), l.id);
  }
  const matchLink = (r: string[]): string | null => {
    for (const c of nameCols) {
      const cell = String(r[c] ?? "").trim();
      if (!cell) continue;
      const tag = byTag.get(cell.replace(/^[?&]+/, ""));
      if (tag) return tag;
      const whole = byToken.get(cell.toLowerCase());
      if (whole) return whole;
      for (const tok of cell.toLowerCase().split(/[^a-z0-9]+/)) {
        const hit = tok && byToken.get(tok);
        if (hit) return hit;
      }
    }
    return null;
  };

  const n = (i: number, r: string[]) => (i < 0 ? 0 : Number(String(r[i] ?? "0").replace(/[^0-9.\-]/g, "")) || 0);
  type Acc = { link_id: string; day: string; clicks: number; detail_page_views: number; add_to_carts: number; purchases: number; units: number; sales: number; bonus: number };
  const acc = new Map<string, Acc>();
  const unmatched = new Set<string>();
  let matched = 0, minDay = "", maxDay = "";
  for (const r of body) {
    const day = toIsoDate(r[cDate]);
    if (!day) continue;
    const link_id = matchLink(r);
    if (!link_id) { if (unmatched.size < 5) unmatched.add(nameCols.map((c) => r[c]).filter(Boolean).join(" / ").slice(0, 80)); continue; }
    matched++;
    if (!minDay || day < minDay) minDay = day;
    if (!maxDay || day > maxDay) maxDay = day;
    const key = `${link_id}|${day}`;
    const a = acc.get(key) ?? { link_id, day, clicks: 0, detail_page_views: 0, add_to_carts: 0, purchases: 0, units: 0, sales: 0, bonus: 0 };
    a.clicks += n(cClicks, r); a.detail_page_views += n(cDpv, r); a.add_to_carts += n(cAtc, r);
    a.purchases += n(cPurch, r); a.units += n(cUnits, r); a.sales += n(cSales, r); a.bonus += n(cBonus, r);
    acc.set(key, a);
  }
  const all = [...acc.values()];
  const used = [cDate, ...nameCols, cClicks, cDpv, cAtc, cPurch, cUnits, cSales, cBonus].filter((i) => i >= 0).map((i) => table[headIdx][i].trim());
  if (!all.length) {
    return {
      ok: false, rows: body.length, matched: 0, links: 0, columns: used, unmatched: [...unmatched],
      message: "No rows matched a link. In Amazon, the ad group (or campaign) name has to contain the link's ID shown in Tracking links.",
    };
  }
  for (let i = 0; i < all.length; i += 500) {
    const chunk = all.slice(i, i + 500);
    const { error } = await supabase.from("link_stats").upsert(
      chunk.map((a) => ({
        link_id: a.link_id, day: a.day, clicks: Math.round(a.clicks), detail_page_views: Math.round(a.detail_page_views),
        add_to_carts: Math.round(a.add_to_carts), purchases: Math.round(a.purchases), units: Math.round(a.units), sales: Math.round(a.sales * 100) / 100,
      })), { onConflict: "link_id,day" });
    if (error) return { ok: false, message: `Import stopped part way: ${error.message}`, rows: body.length, matched, links: 0, columns: used };
    if (cBonus >= 0) {
      const { error: e2 } = await supabase.from("link_bonus").upsert(
        chunk.map((a) => ({ link_id: a.link_id, day: a.day, amount: Math.round(a.bonus * 100) / 100 })), { onConflict: "link_id,day" });
      if (e2) return { ok: false, message: `Sales imported, but the Brand Referral Bonus did not: ${e2.message}`, rows: body.length, matched, links: 0, columns: used };
    }
  }
  revalidatePath("/app", "layout");
  return {
    ok: true, rows: body.length, matched, links: new Set(all.map((a) => a.link_id)).size,
    days: minDay === maxDay ? minDay : `${minDay} to ${maxDay}`, columns: used, unmatched: [...unmatched],
    message: `${matched} of ${body.length} rows matched ${new Set(all.map((a) => a.link_id)).size} links.`,
  };
}
