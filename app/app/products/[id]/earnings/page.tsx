import Link from "next/link";
import { redirect } from "next/navigation";
import { getDailyTotals, getDataThrough, getLinkTotals, getLinks, getMe, getProduct, getProfilesByIds } from "@/lib/data";
import { accountKey, filterLinks, hasFilters, readFilters } from "@/lib/earnings";
import { AutoForm } from "@/components/app/AutoForm";
import { DayChart } from "@/components/app/Charts";
import { PeriodSelect } from "@/components/app/PeriodSelect";
import {
  PLACEMENTS, PLACEMENT_KEYS, ZERO, accountLabel, addDays, addTotals, currencyFor, daySeries, fmtDay, isTeamRole, money, num,
  resolvePeriod, share, sumTotals, todayLA, type Totals,
} from "@/lib/util";

type SP = Record<string, string | undefined>;
const METRICS = { clicks: "Clicks", dpv: "Detail page views", atc: "Add to cart", sales: "Total sales" } as const;
type Metric = keyof typeof METRICS;
const GRAINS = { day: "Daily", week: "Weekly", month: "Monthly" } as const;
type Grain = keyof typeof GRAINS;

function bucketOf(day: string, grain: Grain) {
  if (grain === "month") return `${day.slice(0, 7)}-01`;
  if (grain === "week") return addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7)); // weeks start Monday
  return day;
}

export default async function Earnings({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = (await getMe())!;
  if (!isTeamRole(me.role)) redirect(`/app/products/${id}`);
  const { brand, pages } = (await getProduct(id))!;
  const cur = currencyFor(brand.marketplace);
  const period = resolvePeriod(sp);
  const f = readFilters(sp);
  const metric: Metric = sp.metric && sp.metric in METRICS ? (sp.metric as Metric) : "sales";
  const grain: Grain = sp.grain && sp.grain in GRAINS ? (sp.grain as Grain) : "day";

  const [links, totals, through] = await Promise.all([
    getLinks({ product: id }),
    getLinkTotals({ product: id, from: period.from, to: period.to }),
    getDataThrough({ product: id }),
  ]);
  const profiles = await getProfilesByIds(links.map((l) => l.owner_id));
  const shown = filterLinks(links, profiles, f);
  const filtered = hasFilters(f);
  const daily = await getDailyTotals({ product: id, from: period.from, to: period.to }, filtered ? shown.map((l) => l.id) : null);
  const t = sumTotals(shown.map((l) => totals.get(l.id) ?? ZERO));

  // chart
  const today = todayLA();
  const chartFrom = period.from ?? daily[0]?.day ?? addDays(today, -29);
  const periodEnd = period.to && period.to < today ? period.to : today;
  // stop at the last day Amazon has reported, so unreported days are not drawn as zero
  const chartTo = through && through >= chartFrom && through < periodEnd ? through : periodEnd;
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const buckets = new Map<string, number>();
  for (const d of daySeries(chartFrom, chartTo)) {
    const b = bucketOf(d, grain);
    buckets.set(b, (buckets.get(b) ?? 0) + (byDay.get(d)?.[metric] ?? 0));
  }
  const chartDays = [...buckets.keys()];

  // table: one row per creator, their links underneath
  const pageOf = new Map(pages.map((p) => [p.id, p]));
  const groups = new Map<string, { total: Totals; links: typeof shown }>();
  for (const l of shown) {
    const g = groups.get(l.owner_id) ?? { total: ZERO, links: [] };
    g.total = addTotals(g.total, totals.get(l.id) ?? ZERO);
    g.links.push(l);
    groups.set(l.owner_id, g);
  }
  const rows = [...groups.entries()].sort((a, b) => b[1].total.sales - a[1].total.sales || b[1].total.clicks - a[1].total.clicks);

  // filter choices
  const creators = [...new Set(links.map((l) => l.owner_id))].map((cid) => profiles.get(cid)).filter((p) => !!p).sort((a, b) => a!.username.localeCompare(b!.username));
  const accounts = [...new Map(links.map((l) => [accountKey(l), accountLabel(l.platform, l.account)])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const linkChoices = filterLinks(links, profiles, { ...f, link: undefined, q: undefined });

  const query = (over: Record<string, string | null>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && !["ok", "error"].includes(k)) u.set(k, v);
    for (const [k, v] of Object.entries(over)) { if (v === null) u.delete(k); else u.set(k, v); }
    const s = u.toString();
    return s ? `?${s}` : "";
  };
  const cols = "md:grid-cols-[minmax(160px,1.6fr)_80px_80px_80px_90px_120px_70px]";
  const cell = "hidden text-right font-mono text-xs text-ink-2 md:block";
  const value = (m: Metric) => (m === "sales" ? money(t.sales, cur) : num(t[m]));

  return (
    <div className="space-y-4">
      <AutoForm className="card flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="metric" value={metric} />
        <input type="hidden" name="grain" value={grain} />
        <PeriodSelect period={period} withDates from={sp.from} to={sp.to} />
        <label className="block"><span className="label mb-1 block">Creator</span>
          <select name="creator" defaultValue={f.creator ?? ""} className="select min-w-36 py-1.5">
            <option value="">All</option>{creators.map((p) => <option key={p!.id} value={p!.id}>{p!.username}</option>)}
          </select></label>
        <label className="block"><span className="label mb-1 block">Account</span>
          <select name="account" defaultValue={f.account ?? ""} className="select min-w-36 py-1.5">
            <option value="">All</option>{accounts.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select></label>
        <label className="block"><span className="label mb-1 block">Placement</span>
          <select name="placement" defaultValue={f.placement ?? ""} className="select min-w-32 py-1.5">
            <option value="">All</option>{PLACEMENT_KEYS.map((k) => <option key={k} value={k}>{PLACEMENTS[k]}</option>)}
          </select></label>
        {pages.length > 1 && (
          <label className="block"><span className="label mb-1 block">Amazon page</span>
            <select name="page" defaultValue={f.page ?? ""} className="select min-w-32 py-1.5">
              <option value="">All</option>{pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
        )}
        <label className="block"><span className="label mb-1 block">Link</span>
          <select name="link" defaultValue={f.link ?? ""} className="select min-w-36 max-w-56 py-1.5">
            <option value="">All</option>
            {linkChoices.map((l) => <option key={l.id} value={l.id}>{l.name} · {profiles.get(l.owner_id)?.username ?? "Unknown"}</option>)}
          </select></label>
        <label className="block"><span className="label mb-1 block">Search</span>
          <input name="q" defaultValue={f.q ?? ""} placeholder="Name, handle, link ID" className="input w-44 py-1.5" /></label>
        {filtered && <Link href={`/app/products/${id}/earnings${query({ creator: null, account: null, placement: null, page: null, link: null, q: null })}`} className="btn-ghost py-1.5">Clear filters</Link>}
        <a href={`/app/products/${id}/earnings/export${query({ metric: null, grain: null })}`} className="btn-ghost ml-auto py-1.5">Export sales (CSV)</a>
      </AutoForm>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(METRICS) as Metric[]).map((m) => (
          <Link key={m} href={query({ metric: m })} scroll={false}
            className={`card p-4 transition hover:border-line-2 ${m === metric ? "border-accent" : ""}`}>
            <div className="label">{METRICS[m]}</div>
            <div className="big-number mt-1 text-2xl font-bold">{value(m)}</div>
          </Link>
        ))}
      </div>

      <div className="card p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="label">{METRICS[metric]} · {period.label.toLowerCase()}</div>
          <div className="ml-auto flex gap-1 rounded-lg border border-line p-0.5">
            {(Object.keys(GRAINS) as Grain[]).map((g) => (
              <Link key={g} href={query({ grain: g })} scroll={false} className={`rounded-md px-3 py-1 font-mono text-[11px] ${g === grain ? "bg-panel-2 text-ink" : "text-ink-3 hover:text-ink"}`}>{GRAINS[g]}</Link>
            ))}
          </div>
        </div>
        <DayChart days={chartDays} bar={chartDays.map((d) => buckets.get(d) ?? 0)} barLabel={METRICS[metric]} format={metric === "sales" ? (n) => money(n, cur) : num} />
        <p className="mt-3 font-mono text-[11px] text-ink-3">
          Amazon source days, America/Los_Angeles. {through ? `Data through ${fmtDay(through, { day: "numeric", month: "short", year: "numeric" })}. ` : ""}
          Amazon can restate recent days for up to 31 days. Total sales includes brand halo.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className={`hidden gap-4 border-b border-line px-5 py-3 md:grid ${cols}`}>
          <span className="label">Creator</span><span className="label text-right">Clicks</span><span className="label text-right">DPV</span><span className="label text-right">ATC</span>
          <span className="label text-right">Purchases</span><span className="label text-right">Total sales</span><span className="label text-right">Share</span>
        </div>
        {rows.length === 0 && <div className="px-5 py-6 font-mono text-xs text-ink-3">{links.length === 0 ? "No tracking links have been made for this product yet." : "No links match these filters."}</div>}
        {rows.map(([cid, g]) => (
          <details key={cid} className="border-b border-line last:border-0" open={rows.length === 1}>
            <summary className={`grid cursor-pointer select-none grid-cols-[1fr_auto] items-center gap-x-4 px-5 py-3 hover:bg-panel-2 ${cols}`}>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{profiles.get(cid)?.username ?? "Unknown"}</div>
                <div className="truncate font-mono text-[10px] text-ink-3">{profiles.get(cid)?.discord_username ? `@${profiles.get(cid)!.discord_username} · ` : ""}{g.links.length} {g.links.length === 1 ? "link" : "links"}</div>
              </div>
              <div className={cell}>{num(g.total.clicks)}</div><div className={cell}>{num(g.total.dpv)}</div><div className={cell}>{num(g.total.atc)}</div>
              <div className={cell}>{num(g.total.purchases)}</div>
              <div className="big-number text-right font-semibold">{money(g.total.sales, cur)}</div>
              <div className={cell}>{share(g.total.sales, t.sales)}</div>
            </summary>
            <div className="border-t border-line bg-panel-2">
              {[...g.links].sort((a, b) => (totals.get(b.id)?.sales ?? 0) - (totals.get(a.id)?.sales ?? 0)).map((l) => {
                const lt = totals.get(l.id) ?? ZERO;
                return (
                  <div key={l.id} className={`grid grid-cols-[1fr_auto] items-center gap-x-4 border-b border-line/60 px-5 py-2.5 last:border-0 ${cols}`}>
                    <div className="min-w-0 pl-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="pill-muted">{PLACEMENTS[l.placement]}</span>
                        <span className="truncate">{l.name}</span>
                        {l.archived_at && <span className="pill-muted">archived</span>}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[10px] text-ink-3">
                        {accountLabel(l.platform, l.account)}{pages.length > 1 ? ` · ${pageOf.get(l.page_id)?.name ?? ""}` : ""} · ID {l.short_id}
                      </div>
                    </div>
                    <div className={cell}>{num(lt.clicks)}</div><div className={cell}>{num(lt.dpv)}</div><div className={cell}>{num(lt.atc)}</div>
                    <div className={cell}>{num(lt.purchases)}</div>
                    <div className="text-right font-mono text-sm">{money(lt.sales, cur)}</div>
                    <div className={cell}>{share(lt.sales, t.sales)}</div>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
