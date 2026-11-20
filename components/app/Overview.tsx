import Link from "next/link";
import type { ReactNode } from "react";
import type { CreatorRow, Overview, SourceRow } from "@/lib/overview";
import { SplitBar } from "@/components/app/Charts";
import { TrendChart, type TrendPoint } from "@/components/app/TrendChart";
import { conversion, fmtDay, money, moneyParts, num, pctChange, share } from "@/lib/util";

/**
 * The team's Overview for one product, laid out to answer three questions in order:
 * how much was sold, where it came from, and who sold it.
 *
 * Colour rule: the page is graphite and white. The accent is used once, for the sales line.
 * Green and red only ever mean "up" and "down" against the comparison dates.
 */

// The creator share bar runs from white to faint, biggest seller first, so order alone tells them apart.
const SHADES = ["bg-ink", "bg-ink/65", "bg-ink/45", "bg-ink/30", "bg-ink/20", "bg-ink/10"];
const SHOWN = 8;

export type OverviewProps = {
  productId: string;
  cur: string;
  heading: string;                 // "Sales this month"
  compare: string | null;          // "1 to 19 Oct", or null when there is nothing to compare with
  through: string | null;
  chosen: { id: string; name: string } | null;
  keep: string;                    // the date filters as a query string, so links keep the dates
  o: Overview;
  bonus: number;                   // 0 hides the line
  chart: { points: TrendPoint[]; max: number; ticks: { at: number; label: string }[]; summary: string };
  legend: string;                  // "Sales per day", or "Sales per day, last 90 days" for all time
  filters: ReactNode;
};

/** "+11%" in green or "−9%" in red. Nothing at all when there was nothing before to compare with. */
function Change({ now, before, className = "" }: { now: number; before: number | undefined; className?: string }) {
  const c = before === undefined ? null : pctChange(now, before);
  if (c === null) return null;
  const r = Math.round(c);
  return <span className={`num ${r > 0 ? "text-sky" : r < 0 ? "text-rose" : "text-ink-3"} ${className}`}>{r > 0 ? "+" : r < 0 ? "−" : ""}{num(Math.abs(r))}%</span>;
}
/** Conversion moves in points, not percent of a percent. */
function ChangePoints({ now, before }: { now: [number, number]; before: [number, number] | undefined }) {
  if (!before || !(before[1] > 0) || !(now[1] > 0)) return null;
  const d = (now[0] / now[1] - before[0] / before[1]) * 100;
  const r = Math.round(d * 100) / 100;
  return <span className={`num ${r > 0 ? "text-sky" : r < 0 ? "text-rose" : "text-ink-3"}`}>{r > 0 ? "+" : r < 0 ? "−" : ""}{Math.abs(r).toFixed(2)} pt</span>;
}

const th = "pb-2 pl-4 text-right align-bottom text-xs font-normal text-ink-3 whitespace-nowrap";
const td = "num py-2.5 pl-4 text-right font-mono text-[13px] whitespace-nowrap";
const tdTop = "num pt-3 pl-4 text-right font-mono text-[13px] whitespace-nowrap";
const quiet = (v: number) => (v > 0 ? "text-ink" : "text-ink-3");

/** One breakdown (by placement, or by platform): a line of numbers per row, with its share drawn underneath. */
function SourceTable({ title, rows, cur, basis, whole }: { title: string; rows: SourceRow[]; cur: string; basis: "sales" | "clicks"; whole: number }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th scope="col" className="pb-2 text-left align-bottom text-xs font-normal text-ink-3">{title}</th>
          <th scope="col" className={th}>Sales</th>
          <th scope="col" className={`${th} hidden sm:table-cell`}>Purchases</th>
          <th scope="col" className={th}>Clicks</th>
          <th scope="col" className={`${th} hidden sm:table-cell`}>Conversion</th>
        </tr>
      </thead>
      {rows.map((r) => {
        const mine = basis === "sales" ? r.t.sales : r.t.clicks;
        const part = whole > 0 ? mine / whole : 0;
        const live = r.t.sales > 0 || r.t.clicks > 0;
        return (
          <tbody key={r.key} className="border-t border-line">
            <tr>
              <th scope="row" className="pt-3 text-left font-normal">
                <span className={live ? "text-ink" : "text-ink-2"}>{r.label}</span>
                <span className="ml-2 whitespace-nowrap text-xs text-ink-3">{num(r.links)} {r.links === 1 ? "link" : "links"}</span>
              </th>
              <td className={`${tdTop} ${quiet(r.t.sales)}`}>{money(r.t.sales, cur)}</td>
              <td className={`${tdTop} hidden sm:table-cell ${quiet(r.t.purchases)}`}>{num(r.t.purchases)}</td>
              <td className={`${tdTop} ${quiet(r.t.clicks)}`}>{num(r.t.clicks)}</td>
              <td className={`${tdTop} hidden sm:table-cell ${quiet(r.t.purchases)}`}>{conversion(r.t.purchases, r.t.clicks)}</td>
            </tr>
            <tr>
              <td colSpan={5} className="pb-3 pt-2">
                <div className="flex items-center gap-3" title={`${share(mine, whole)} of ${basis}`}>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                    <div className={`h-full rounded-full ${live ? "bg-ink" : ""}`} style={{ width: `${part * 100}%` }} />
                  </div>
                  <span className="num w-9 shrink-0 text-right font-mono text-xs text-ink-3">{whole > 0 ? `${Math.round(part * 100)}%` : ""}</span>
                </div>
              </td>
            </tr>
          </tbody>
        );
      })}
    </table>
  );
}

export function OverviewView({ productId, cur, heading, compare, through, chosen, keep, o, bonus, chart, legend, filters }: OverviewProps) {
  const t = o.total;
  const b = compare ? o.before ?? undefined : undefined;
  const m = moneyParts(t.sales, cur);
  const href = (path: string, extra = "") => `/app/products/${productId}${path}${[keep, extra].filter(Boolean).length ? `?${[keep, extra].filter(Boolean).join("&")}` : ""}`;
  const shown = o.creators.slice(0, SHOWN);
  const more = o.creators.slice(SHOWN);
  const moreSales = more.reduce((s, c) => s + c.t.sales, 0);
  const tail = o.creators.slice(5).reduce((s, c) => s + c.t.sales, 0);
  const parts = [
    ...o.creators.slice(0, 5).filter((c) => c.t.sales > 0).map((c, i) => ({ key: c.id, value: c.t.sales, color: SHADES[i], title: `${c.name}: ${money(c.t.sales, cur)}` })),
    ...(tail > 0 ? [{ key: "rest", value: tail, color: SHADES[5], title: `Everyone else: ${money(tail, cur)}` }] : []),
  ];
  // where it came from: bars show share of sales; before the first sale they fall back to share of clicks
  const basis: "sales" | "clicks" = t.sales > 0 ? "sales" : "clicks";
  const whole = basis === "sales" ? t.sales : t.clicks;
  const lines: { label: string; value: string; change: ReactNode }[] = [
    { label: "Purchases", value: num(t.purchases), change: <Change now={t.purchases} before={b?.purchases} /> },
    { label: "Units", value: num(t.units), change: <Change now={t.units} before={b?.units} /> },
    { label: "Clicks", value: num(t.clicks), change: <Change now={t.clicks} before={b?.clicks} /> },
    { label: "Conversion", value: conversion(t.purchases, t.clicks), change: <ChangePoints now={[t.purchases, t.clicks]} before={b ? [b.purchases, b.clicks] : undefined} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="text-sm text-ink-3">
          {through ? `Numbers run up to ${fmtDay(through, { day: "numeric", month: "short", year: "numeric" })}, in Los Angeles days.` : "No sales have been reported yet."}
        </p>
        {filters}
      </div>

      {/* ---------- how much ---------- */}
      <section className="card overflow-hidden" aria-labelledby="ov-total">
        <div className="grid gap-x-14 gap-y-8 p-6 md:grid-cols-[minmax(0,1fr)_minmax(250px,330px)] md:p-8">
          <div className="min-w-0">
            <h1 id="ov-total" className="text-sm text-ink-2">{heading}{chosen ? `, ${chosen.name} only` : ""}</h1>
            <div className="big-number mt-3 flex items-baseline font-medium leading-none tracking-[-0.03em]">
              <span className="mr-1.5 text-3xl text-ink-3 md:text-5xl">{m.symbol}</span>
              <span className="text-6xl md:text-8xl">{m.whole}</span>
              <span className="text-2xl text-ink-2 md:text-4xl">.{m.fraction}</span>
            </div>
            <div className="mt-5 space-y-1 text-sm">
              {b && b.sales > 0 && (
                <p className="text-ink-2">
                  <Change now={t.sales} before={b.sales} className="font-medium" /> on {compare}, which made {money(b.sales, cur)}
                </p>
              )}
              <p className="text-ink-3">
                {chosen
                  ? <>From {num(o.liveLinks)} {o.liveLinks === 1 ? "link" : "links"}.</>
                  : <>From {num(o.creatorCount)} {o.creatorCount === 1 ? "creator" : "creators"} and {num(o.liveLinks)} {o.liveLinks === 1 ? "link" : "links"}.</>}
                {" "}Sales include brand halo.
                {chosen && <>{" "}<Link href={href("")} className="text-ink-2 underline underline-offset-4 hover:text-ink">Show every creator</Link></>}
              </p>
            </div>
          </div>

          <dl className="self-end text-sm">
            {lines.map((l) => (
              <div key={l.label} className="flex items-baseline gap-2 py-1.5">
                <dt className="flex min-w-0 flex-1 items-baseline gap-2 text-ink-2"><span className="shrink-0">{l.label}</span><span className="leader" aria-hidden="true" /></dt>
                <dd className="num shrink-0 font-mono text-ink">{l.value}</dd>
                {b && <dd className="w-16 shrink-0 text-right font-mono text-xs">{l.change}</dd>}
              </div>
            ))}
            {bonus > 0 && (
              <div className="mt-1.5 flex items-baseline gap-2 border-t border-line py-1.5 pt-3">
                <dt className="flex min-w-0 flex-1 items-baseline gap-2 text-ink-2"><span className="shrink-0">Brand Referral Bonus</span><span className="leader" aria-hidden="true" /></dt>
                <dd className="num shrink-0 font-mono text-ink">{money(bonus, cur)}</dd>
                {b && <dd className="w-16 shrink-0 text-right text-xs text-ink-3">team only</dd>}
              </div>
            )}
          </dl>
        </div>

        <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 px-6 pb-4 text-xs text-ink-3 md:px-8 ${chart.points.some((p) => p.value > 0 || (p.before ?? 0) > 0) ? "" : "hidden"}`}>
          <span className="flex items-center gap-2"><span className="h-0.5 w-4 rounded-full bg-accent" />{legend}</span>
          {compare && chart.points.some((p) => p.before !== null) && (
            <span className="flex items-center gap-2"><span className="w-4 border-t border-dashed border-ink-3" />{compare}</span>
          )}
        </div>
        <TrendChart {...chart} />
      </section>

      {/* ---------- where it came from ---------- */}
      <section className="card p-6 md:p-8" aria-labelledby="ov-where">
        <h2 id="ov-where" className="text-base font-medium">Where the sales came from</h2>
        <p className="mt-1 text-sm text-ink-3">
          Every link is made for one spot on one platform. These are the totals for each{chosen ? `, for ${chosen.name}'s links` : ""}.
        </p>
        {o.placements.length === 0 ? (
          <p className="mt-6 text-sm text-ink-2">No links yet. Invite creators from the Creators tab and each one makes their own.</p>
        ) : (
          <>
            <div className="mt-6 grid items-start gap-x-14 gap-y-8 lg:grid-cols-2">
              <SourceTable title="Placement" rows={o.placements} cur={cur} basis={basis} whole={whole} />
              <SourceTable title="Platform" rows={o.platforms} cur={cur} basis={basis} whole={whole} />
            </div>
            {whole > 0 && <p className="mt-5 text-xs text-ink-3">The bar under each one is its share of {basis}.</p>}
          </>
        )}
      </section>

      {/* ---------- who sold it ---------- */}
      <section className="card p-6 md:p-8" aria-labelledby="ov-who">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="ov-who" className="text-base font-medium">Who sold it</h2>
          <Link href={href("/creators")} className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink">All {num(o.creatorCount)} creators</Link>
        </div>
        {o.creators.length === 0 ? (
          <p className="mt-4 text-sm text-ink-2">No clicks or sales in these dates yet.</p>
        ) : (
          <>
            {parts.length > 0 && <div className="mt-5"><SplitBar parts={parts} className="h-2 rounded-full" /></div>}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="w-8 min-w-8 pb-2 text-left align-bottom text-xs font-normal text-ink-3"><span className="sr-only">Rank</span></th>
                    <th scope="col" className="pb-2 text-left align-bottom text-xs font-normal text-ink-3">Creator</th>
                    <th scope="col" className={th}>Sales</th>
                    <th scope="col" className={th}>Share</th>
                    <th scope="col" className={th}>Purchases</th>
                    <th scope="col" className={th}>Clicks</th>
                    <th scope="col" className={th}>Conversion</th>
                    <th scope="col" className="hidden pb-2 pl-8 text-left align-bottom text-xs font-normal text-ink-3 md:table-cell">Best link</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c, i) => <CreatorLine key={c.id} c={c} i={i} cur={cur} allSales={o.allSales} on={chosen?.id === c.id} href={href("", `creator=${c.id}`)} />)}
                </tbody>
              </table>
            </div>
            {(more.length > 0 || o.quietCreators > 0) && (
              <p className="mt-4 text-sm text-ink-3">
                {more.length > 0 && (moreSales > 0
                  ? <>{num(more.length)} more {more.length === 1 ? "creator" : "creators"} brought in {money(moreSales, cur)}{more.length === 1 ? "" : " between them"}. </>
                  : <>{num(more.length)} more {more.length === 1 ? "creator" : "creators"} had clicks but no sales. </>)}
                {o.quietCreators > 0 && <>{num(o.quietCreators)} {o.quietCreators === 1 ? "creator has" : "creators have"} had no clicks in these dates.</>}
              </p>
            )}
          </>
        )}
      </section>

      {/* ---------- which links ---------- */}
      <section className="card p-6 md:p-8" aria-labelledby="ov-links">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="ov-links" className="text-base font-medium">The links that brought it in</h2>
          <Link href={href("/links")} className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink">All tracking links</Link>
        </div>
        {o.topLinks.length === 0 ? (
          <p className="mt-4 text-sm text-ink-2">No link has had a click in these dates yet.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="w-8 min-w-8 pb-2 text-left align-bottom text-xs font-normal text-ink-3"><span className="sr-only">Rank</span></th>
                    <th scope="col" className="pb-2 text-left align-bottom text-xs font-normal text-ink-3">Creator</th>
                    <th scope="col" className="pb-2 pl-4 text-left align-bottom text-xs font-normal text-ink-3">Account</th>
                    <th scope="col" className="pb-2 pl-4 text-left align-bottom text-xs font-normal text-ink-3">Placement</th>
                    <th scope="col" className={th}>Sales</th>
                    <th scope="col" className={th}>Purchases</th>
                    <th scope="col" className={th}>Clicks</th>
                    <th scope="col" className={th}>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {o.topLinks.map((l, i) => (
                    <tr key={l.id} className="border-t border-line">
                      <td className="num min-w-8 py-2.5 pr-2 font-mono text-xs text-ink-3">{i + 1}</td>
                      <th scope="row" className="max-w-40 truncate py-2.5 text-left font-normal">{l.creator}</th>
                      <td className="max-w-52 truncate py-2.5 pl-4 text-ink-2">{l.account}</td>
                      <td className="whitespace-nowrap py-2.5 pl-4 text-ink-2">{l.placement}{l.archived && <span className="ml-2 text-xs text-ink-3">archived</span>}</td>
                      <td className={`${td} ${quiet(l.t.sales)}`}>{money(l.t.sales, cur)}</td>
                      <td className={`${td} ${quiet(l.t.purchases)}`}>{num(l.t.purchases)}</td>
                      <td className={`${td} ${quiet(l.t.clicks)}`}>{num(l.t.clicks)}</td>
                      <td className={`${td} ${quiet(l.t.purchases)}`}>{conversion(l.t.purchases, l.t.clicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {o.activeLinks > o.topLinks.length && (
              <p className="mt-4 text-sm text-ink-3">{num(o.activeLinks - o.topLinks.length)} more {o.activeLinks - o.topLinks.length === 1 ? "link" : "links"} had clicks or sales. Earnings lists every one.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CreatorLine({ c, i, cur, allSales, on, href }: { c: CreatorRow; i: number; cur: string; allSales: number; on: boolean; href: string }) {
  return (
    <tr className={`border-t border-line ${on ? "bg-panel-2" : ""}`}>
      <td className="num min-w-8 py-2.5 pr-2 font-mono text-xs text-ink-3">{i + 1}</td>
      <th scope="row" className="py-2.5 text-left font-normal">
        <span className="flex items-center gap-2.5">
          <span className={`h-2 w-2 shrink-0 rounded-sm ${c.t.sales > 0 && i < 5 ? SHADES[i] : "bg-transparent"}`} aria-hidden="true" />
          <Link href={href} className="max-w-48 truncate underline-offset-4 hover:underline" title={`Show only ${c.name}`}>{c.name}</Link>
        </span>
      </th>
      <td className={`${td} ${quiet(c.t.sales)}`}>{money(c.t.sales, cur)}</td>
      <td className={`${td} text-ink-3`}>{c.t.sales > 0 ? share(c.t.sales, allSales) : ""}</td>
      <td className={`${td} ${quiet(c.t.purchases)}`}>{num(c.t.purchases)}</td>
      <td className={`${td} ${quiet(c.t.clicks)}`}>{num(c.t.clicks)}</td>
      <td className={`${td} ${quiet(c.t.purchases)}`}>{conversion(c.t.purchases, c.t.clicks)}</td>
      <td className="hidden max-w-52 truncate py-2.5 pl-8 text-ink-2 md:table-cell">{c.best ?? ""}</td>
    </tr>
  );
}
