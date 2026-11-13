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
