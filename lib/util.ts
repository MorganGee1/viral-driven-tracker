// Pure helpers shared by server and client code. No database access in here.

export type Role = "owner" | "team" | "creator";
export type Placement = "bio" | "manychat" | "post" | "story" | "other";
export type Platform = "instagram" | "facebook" | "tiktok" | "other";

export const PLACEMENTS: Record<Placement, string> = {
  bio: "Bio",
  manychat: "ManyChat",
  post: "Post description",
  story: "Story",
  other: "Other",
};
export const PLACEMENT_KEYS = Object.keys(PLACEMENTS) as Placement[];
export const PLACEMENT_COLOR: Record<Placement, string> = {
  bio: "bg-accent",
  manychat: "bg-violet",
  post: "bg-amber",
  story: "bg-sky",
  other: "bg-ink-3",
};

export const PLATFORMS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  other: "Other",
};
export const PLATFORM_KEYS = Object.keys(PLATFORMS) as Platform[];
export const PLATFORM_SHORT: Record<Platform, string> = { instagram: "IG", facebook: "FB", tiktok: "TikTok", other: "" };

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", team: "Team", creator: "Creator" };
export const isTeamRole = (r: Role | undefined | null) => r === "owner" || r === "team";

/** "IG Bio", "FB ManyChat": what the link name is pre-filled with. */
export function defaultLinkName(platform: Platform, placement: Placement) {
  return [PLATFORM_SHORT[platform], PLACEMENTS[placement]].filter(Boolean).join(" ");
}

export function accountLabel(platform: Platform, account: string) {
  const a = account.trim();
  if (!a) return PLATFORMS[platform];
  return `${PLATFORMS[platform]} ${a}`;
}

// ---------- money and numbers ----------
export const currencyFor = (marketplace: string) =>
  marketplace === "UK" ? "GBP" : ["DE", "FR", "IT", "ES"].includes(marketplace) ? "EUR" : marketplace === "CA" ? "CAD" : "USD";

export const money = (n: number, cur = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
export const num = (n: number) => new Intl.NumberFormat("en-US").format(n || 0);
export const share = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "0%");
export const conversion = (purchases: number, clicks: number) => (clicks > 0 ? `${((purchases / clicks) * 100).toFixed(2)}%` : "n/a");

// ---------- the link a creator copies ----------
/** The plain Amazon address with the tracking tag on the end. No redirect. */
/**
 * The address a creator should copy for a link. With deep links on for the product and a deep link made,
 * that is the deep link (it opens the Amazon app). Otherwise it is the plain tagged Amazon address.
 */
export function copyUrl(deepLinksOn: boolean, link: { deep_url: string | null; amazon_tag: string | null }, pageUrl: string) {
  const plain = taggedUrl(pageUrl, link.amazon_tag);
  const deep = deepLinksOn && link.deep_url ? link.deep_url : null;
  return { url: deep ?? plain, plain, deep: !!deep, waiting: deepLinksOn && !deep && !!link.amazon_tag };
}

export function taggedUrl(pageUrl: string, tag: string | null | undefined) {
  if (!tag) return pageUrl;
  const clean = tag.trim().replace(/^[?&]+/, "");
  if (!clean) return pageUrl;
  const [base, hash] = pageUrl.split("#");
  const joined = base.includes("?") ? `${base}&${clean}` : `${base}?${clean}`;
  return hash ? `${joined}#${hash}` : joined;
}

/** Returns a cleaned https Amazon address, or null if it is not an Amazon page. */
export function cleanAmazonUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    if (!/(^|\.)amazon\.(com|co\.uk|ca|de|fr|it|es|com\.au|co\.jp|in|com\.mx|nl|se|ae|sa|com\.br|pl|com\.be|sg|com\.tr|eg)$/.test(host)) return null;
    u.protocol = "https:";
    return u.toString();
  } catch {
    return null;
  }
}

// ---------- dates: Amazon reports in Los Angeles time ----------
const LA = "America/Los_Angeles";
export function todayLA(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: LA, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
const pad = (n: number) => String(n).padStart(2, "0");
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function fmtDay(day: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!day) return "";
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}
export function fmtMonth(ym: string) {
  return new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export type Period = { key: string; from: string | null; to: string | null; label: string };

/** Options for the period dropdown: this month, last 30 days, all time, then the 12 months before this one. */
export function periodOptions(today = todayLA()): { key: string; label: string }[] {
  const [y, m] = today.split("-").map(Number);
  const out = [
    { key: "month", label: "This month" },
    { key: "30d", label: "Last 30 days" },
    { key: "all", label: "All time" },
  ];
  for (let i = 1; i <= 12; i++) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const ym = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    out.push({ key: ym, label: fmtMonth(ym) });
  }
  return out;
}

/** Works out the date range from the page's ?period= (or ?from=&to=) settings. Default is this month. */
export function resolvePeriod(sp: { period?: string; from?: string; to?: string }, today = todayLA()): Period {
  const isDay = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(`${s}T00:00:00Z`));
  if (isDay(sp.from) && isDay(sp.to) && sp.from! <= sp.to!) {
    return { key: "custom", from: sp.from!, to: sp.to!, label: `${fmtDay(sp.from)} to ${fmtDay(sp.to, { day: "numeric", month: "short", year: "numeric" })}` };
  }
  const key = sp.period ?? "month";
  if (key === "all") return { key, from: null, to: null, label: "All time" };
  if (key === "30d") return { key, from: addDays(today, -29), to: today, label: "Last 30 days" };
  if (/^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      return { key, from: `${key}-01`, to: `${key}-${pad(last)}`, label: fmtMonth(key) };
    }
  }
  return { key: "month", from: `${today.slice(0, 7)}-01`, to: today, label: "This month" };
}

// ---------- totals ----------
export type Totals = { clicks: number; dpv: number; atc: number; purchases: number; units: number; sales: number };
export const ZERO: Totals = { clicks: 0, dpv: 0, atc: 0, purchases: 0, units: 0, sales: 0 };
export function addTotals(a: Totals, b: Totals): Totals {
  return {
    clicks: a.clicks + b.clicks, dpv: a.dpv + b.dpv, atc: a.atc + b.atc,
    purchases: a.purchases + b.purchases, units: a.units + b.units, sales: a.sales + b.sales,
  };
}
export function sumTotals(list: Totals[]): Totals {
  return list.reduce(addTotals, ZERO);
}

// ---------- CSV ----------
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    // stop spreadsheet apps treating a creator-typed value as a formula
    // (a plain @handle is left alone: it is what almost every account looks like)
    if (/^[=+\-@\t\r]/.test(s) && typeof v !== "number" && !/^@[\w.]+$/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && src[i + 1] === "\n") i++; row.push(cur); out.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur.length || row.length) { row.push(cur); out.push(row); }
  return out.filter((r) => r.some((x) => x.trim() !== ""));
}

/** Reads the date formats Amazon exports: 2026-11-01, 11/01/2026 (US), Nov 1, 2026. */
export function toIsoDate(s: string | undefined): string | null {
  if (!s) return null;
  s = s.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  const d = new Date(`${s} UTC`);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Every day from start to end inclusive, so charts show empty days as zero instead of skipping them. */
export function daySeries(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 800; d = addDays(d, 1)) out.push(d);
  return out;
}

// ---------- overview: comparisons and chart scales ----------
const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** "1 to 19 Oct", or "28 Sep to 4 Oct" when the range crosses a month. */
export function rangeLabel(from: string, to: string) {
  if (from === to) return fmtDay(from);
  return from.slice(0, 7) === to.slice(0, 7) ? `${Number(from.slice(8))} to ${fmtDay(to)}` : `${fmtDay(from)} to ${fmtDay(to)}`;
}

/**
 * The dates a period is compared with, or null when there is nothing sensible to compare (all time).
 * A month is compared with the same days of the month before: 1 to 19 Nov against 1 to 19 Oct.
 * Anything else is compared with the same number of days straight before it.
 * `effectiveTo` is the last day we actually hold numbers for inside the period, so a month in progress
 * is never compared against more days than it has had.
 */
export function previousWindow(period: Period, effectiveTo: string): { from: string; to: string; label: string } | null {
  if (!period.from || effectiveTo < period.from) return null;
  const n = dayDiff(period.from, effectiveTo) + 1;
  let from: string, to: string;
  if (period.key === "month" || /^\d{4}-\d{2}$/.test(period.key)) {
    const [y, m] = period.from.split("-").map(Number);
    from = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    const last = new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);
    to = addDays(from, n - 1);
    if (to > last) to = last;
  } else {
    to = addDays(period.from, -1);
    from = addDays(period.from, -n);
  }
  return { from, to, label: rangeLabel(from, to) };
}

/** Change against an earlier number, as a whole percent. Null when there was nothing before to compare with. */
export function pctChange(now: number, before: number): number | null {
  if (!(before > 0)) return null;
  return ((now - before) / before) * 100;
}

/** A round number at or above v, for the top of a chart: 31 becomes 40, 1,480 becomes 1,500. */
export function niceMax(v: number): number {
  if (!(v > 0)) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 3 ? 3 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 6 ? 6 : f <= 8 ? 8 : 10;
  return nice * exp;
}

/** Money for a chart axis: £40, £1.5K, $120K. */
export function moneyShort(n: number, cur = "USD") {
  const big = Math.abs(n) >= 1000;
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: cur, notation: big ? "compact" : "standard",
    minimumFractionDigits: big || Number.isInteger(n) ? 0 : 2, maximumFractionDigits: big ? 1 : Number.isInteger(n) ? 0 : 2,
  }).format(n || 0);
}

/** Money split into its symbol, whole part and pence, so a headline can set each at its own size. */
export function moneyParts(n: number, cur = "USD"): { symbol: string; whole: string; fraction: string } {
  const parts = new Intl.NumberFormat("en-US", { style: "currency", currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).formatToParts(n || 0);
  const pick = (types: string[]) => parts.filter((p) => types.includes(p.type)).map((p) => p.value).join("");
  return { symbol: pick(["minusSign", "currency"]), whole: pick(["integer", "group"]), fraction: pick(["fraction"]) };
}

/** "Facebook bio", "Instagram ManyChat": where a link sits, said the way the team says it. */
export function sourceLabel(platform: Platform, placement: Placement) {
  const place = placement === "manychat" ? "ManyChat" : PLACEMENTS[placement].toLowerCase();
  if (platform === "other") return placement === "other" ? "Other" : place.charAt(0).toUpperCase() + place.slice(1);
  return `${PLATFORMS[platform]} ${place}`;
}
