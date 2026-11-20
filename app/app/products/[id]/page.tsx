import { notFound } from "next/navigation";
import {
  getBonus, getDailyTotals, getDataThrough, getLinkTotals, getLinks, getMe, getMemberIds, getProduct, getProfilesByIds,
  type Profile,
} from "@/lib/data";
import { AutoForm } from "@/components/app/AutoForm";
import { Flash } from "@/components/app/Flash";
import { LinkRow } from "@/components/app/LinkRow";
import { NewLinkForm } from "@/components/app/NewLinkForm";
import { OverviewView } from "@/components/app/Overview";
import { PeriodSelect } from "@/components/app/PeriodSelect";
import { CopyButton } from "@/components/app/CopyButton";
import type { TrendPoint } from "@/components/app/TrendChart";
import { buildOverview } from "@/lib/overview";
import {
  ZERO, addDays, copyUrl, currencyFor, daySeries, fmtDay, isTeamRole, money, moneyShort, niceMax, num, previousWindow, resolvePeriod, sumTotals, todayLA,
} from "@/lib/util";

type SP = { period?: string; from?: string; to?: string; creator?: string; ok?: string; error?: string; new?: string };

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = (await getMe())!;
  const data = await getProduct(id);
  if (!data) notFound();
  return isTeamRole(me.role) ? <TeamOverview id={id} sp={sp} /> : <CreatorLinks id={id} sp={sp} me={me} />;
}

// =====================================================================
// Creator: my links for this product, and nothing else
// =====================================================================
async function CreatorLinks({ id, sp, me }: { id: string; sp: SP; me: Profile }) {
  const { product, brand, pages } = (await getProduct(id))!;
  const cur = currencyFor(brand.marketplace);
  const period = resolvePeriod(sp);
  const [links, totals, through] = await Promise.all([
    getLinks({ product: id }),
    getLinkTotals({ product: id, from: period.from, to: period.to }),
    getDataThrough({ product: id }),
  ]);
  const mine = sumTotals(links.map((l) => totals.get(l.id) ?? ZERO));
  const live = links.filter((l) => !l.archived_at);
  const archived = links.filter((l) => l.archived_at);
  const pageOf = new Map(pages.map((p) => [p.id, p]));
  const livePages = pages.filter((p) => !p.archived_at);
  const back = `/app/products/${id}${period.key !== "month" && period.key !== "custom" ? `?period=${period.key}` : ""}`;
  const fresh = sp.new ? links.find((l) => l.id === sp.new) : undefined;
  const addr = (l: (typeof links)[number]) => copyUrl(product.deep_links, l, pageOf.get(l.page_id)?.url ?? "");
  const urlOf = (l: (typeof links)[number]) => addr(l).url;
  const row = (l: (typeof links)[number]) => (
    <LinkRow key={l.id} link={l} url={urlOf(l)} plainUrl={addr(l).deep ? addr(l).plain : undefined} deepWaiting={addr(l).waiting} pageName={pages.length > 1 ? pageOf.get(l.page_id)?.name ?? null : null}
      totals={totals.get(l.id) ?? ZERO} cur={cur} team={false} back={back} fresh={l.id === sp.new} />
  );

  return (
    <div>
      <Flash ok={sp.ok} error={sp.error} />
      {fresh && (
        <div className="mb-5 rounded-lg border border-sky/30 bg-sky/5 p-4">
          <div className="text-sm font-medium text-sky">Link ready: {fresh.name}</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1 truncate rounded-lg bg-bg px-3 py-2 font-mono text-xs text-ink-2">{urlOf(fresh)}</div>
            <CopyButton text={urlOf(fresh)} />
          </div>
          {addr(fresh).deep && <p className="mt-2 text-xs text-ink-2">This link opens the Amazon app on a phone, where the shopper is already signed in.</p>}
          {addr(fresh).waiting && <p className="mt-2 text-xs text-ink-2">The app-opening link for this one is still being made. This plain Amazon link works in the meantime.</p>}
          {!fresh.amazon_tag && <p className="mt-2 text-xs text-amber">Tracking has not been attached to this link yet. Your manager does that. Wait for it to show as tracked before you post it, or its sales will not count for you.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label">Your links · {period.label.toLowerCase()}</div>
          <h1 className="mt-1 text-2xl font-medium">What your links sold</h1>
        </div>
        <AutoForm className="flex items-end gap-3"><PeriodSelect period={period} /></AutoForm>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {([["Sales", money(mine.sales, cur)], ["Purchases", num(mine.purchases)], ["Clicks", num(mine.clicks)]] as const).map(([l, v]) => (
          <div key={l} className="card min-w-0 p-3 sm:p-4">
            <div className="label">{l}</div>
            <div className="big-number mt-1 truncate text-base font-medium sm:text-2xl">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 font-mono text-xs text-ink-3">
        {through ? `Numbers run up to ${fmtDay(through, { day: "numeric", month: "short" })}. Amazon takes a day or two to report sales, so today will look low.` : "No sales have been reported for this product yet."}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 min-w-0 space-y-3 lg:order-1">
          <div className="label">Your links · {live.length}</div>
          {live.length === 0 && <div className="card p-6 text-sm text-ink-2">No links yet. Make one for each account and each place you post: bio, ManyChat, caption, story.</div>}
          {live.map(row)}
          {archived.length > 0 && (
            <details className="pt-2">
              <summary className="cursor-pointer select-none font-mono text-xs text-ink-3 hover:text-ink">Archived links · {archived.length}</summary>
              <div className="mt-3 space-y-3">{archived.map(row)}</div>
            </details>
          )}
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <NewLinkForm key={links.length} productId={id} back={back} pages={livePages.map((p) => ({ id: p.id, name: p.name }))}
            accounts={links.map((l) => ({ platform: l.platform, account: l.account }))} />
          <p className="mt-3 px-1 font-mono text-xs leading-relaxed text-ink-3">
            You only ever see your own links and numbers for {product.name}. Other creators cannot see yours.
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Team: product overview
// =====================================================================
async function TeamOverview({ id, sp }: { id: string; sp: SP }) {
  const { brand } = (await getProduct(id))!;
  const cur = currencyFor(brand.marketplace);
  const period = resolvePeriod(sp);
  const [links, totals, members, bonus, through] = await Promise.all([
    getLinks({ product: id }),
    getLinkTotals({ product: id, from: period.from, to: period.to }),
    getMemberIds(id),
    getBonus({ product: id, from: period.from, to: period.to }),
    getDataThrough({ product: id }),
  ]);
  const memberIds = members.map((m) => m.creator_id);
  const creatorIds = [...new Set([...memberIds, ...links.map((l) => l.owner_id)])];
  const profiles = await getProfilesByIds(creatorIds);
  const chosen = sp.creator && creatorIds.includes(sp.creator) ? sp.creator : null;
  const scopedIds = chosen ? links.filter((l) => l.owner_id === chosen).map((l) => l.id) : null;

  // the chart covers the chosen dates (the last 90 days for "all time"), stopping at the last day we hold numbers for
  const today = todayLA();
  const chartFrom = period.from ?? addDays(today, -89);
  const periodEnd = period.to && period.to < today ? period.to : today;
  const chartTo = through && through >= chartFrom && through < periodEnd ? through : periodEnd;
  // what these dates are compared with: the same days of the month before, or the same number of days straight before
  const prev = previousWindow(period, chartTo);
  const [daily, beforeTotals, beforeDaily] = await Promise.all([
    getDailyTotals({ product: id, from: chartFrom, to: chartTo }, scopedIds),
    prev ? getLinkTotals({ product: id, from: prev.from, to: prev.to }) : null,
    prev ? getDailyTotals({ product: id, from: prev.from, to: prev.to }, scopedIds) : null,
  ]);

  const names = new Map([...profiles.values()].map((p) => [p.id, p.username]));
  const o = buildOverview({ links, totals, before: beforeTotals, names, memberIds, chosen });
  // only compare when the earlier dates actually had something in them
  const comparing = !!prev && !!o.before && (o.before.sales > 0 || o.before.clicks > 0);

  const byDay = new Map(daily.map((d) => [d.day, d]));
  const beforeByDay = new Map((beforeDaily ?? []).map((d) => [d.day, d]));
  const points: TrendPoint[] = daySeries(chartFrom, chartTo).map((day, i) => {
    const d = byDay.get(day);
    const bDay = comparing && prev && addDays(prev.from, i) <= prev.to ? addDays(prev.from, i) : null;
    const before = bDay ? beforeByDay.get(bDay)?.sales ?? 0 : null;
    const purchases = d?.purchases ?? 0;
    return {
      day, label: fmtDay(day), value: d?.sales ?? 0, text: money(d?.sales ?? 0, cur),
      sub: `${num(purchases)} ${purchases === 1 ? "purchase" : "purchases"}, ${num(d?.clicks ?? 0)} ${d?.clicks === 1 ? "click" : "clicks"}`,
      before, beforeText: bDay && before !== null ? `${fmtDay(bDay)}: ${money(before, cur)}` : null,
    };
  });
  const max = niceMax(Math.max(0, ...points.map((p) => Math.max(p.value, p.before ?? 0))));
  const heading = period.key === "month" ? "Sales this month" : period.key === "30d" ? "Sales in the last 30 days" : period.key === "all" ? "Sales, all time"
    : period.key === "custom" ? `Sales, ${period.label}` : `Sales in ${period.label}`;
  const keep = period.key === "custom" ? `from=${period.from}&to=${period.to}` : period.key !== "month" ? `period=${period.key}` : "";
  const people = creatorIds.map((cid) => profiles.get(cid)).filter((p): p is Profile => !!p).sort((a, b) => a.username.localeCompare(b.username));

  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      <OverviewView
        productId={id} cur={cur} heading={heading} compare={comparing && prev ? prev.label : null} through={through}
        chosen={chosen ? { id: chosen, name: names.get(chosen) ?? "Unknown" } : null} keep={keep} o={o} bonus={chosen ? 0 : bonus}
        legend={period.from ? "Sales per day" : "Sales per day, last 90 days"}
        chart={{
          points, max, ticks: [{ at: max / 2, label: moneyShort(max / 2, cur) }, { at: max, label: moneyShort(max, cur) }],
          summary: `${heading}: ${money(o.total.sales, cur)} across ${points.length} ${points.length === 1 ? "day" : "days"}${period.from ? "" : ", last 90 days shown"}. Use the arrow keys to read each day.`,
        }}
        filters={
          <AutoForm className="flex flex-wrap items-center gap-2">
            <PeriodSelect period={period} withDates from={sp.from} to={sp.to} compact />
            <label className="block">
              <span className="sr-only">Creator</span>
              <select name="creator" defaultValue={chosen ?? ""} className="select min-w-40 py-1.5" title="Creator">
                <option value="">All creators</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.username}</option>)}
              </select>
            </label>
          </AutoForm>
        }
      />
    </>
  );
}
