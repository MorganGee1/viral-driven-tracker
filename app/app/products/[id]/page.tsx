import { notFound } from "next/navigation";
import {
  getBonus, getDailyTotals, getDataThrough, getLinkTotals, getLinks, getMe, getMemberIds, getProduct, getProfilesByIds,
  type Profile,
} from "@/lib/data";
import { AutoForm } from "@/components/app/AutoForm";
import { DayChart, SplitBar } from "@/components/app/Charts";
import { Flash } from "@/components/app/Flash";
import { LinkRow } from "@/components/app/LinkRow";
import { NewLinkForm } from "@/components/app/NewLinkForm";
import { PeriodSelect } from "@/components/app/PeriodSelect";
import { CopyButton } from "@/components/app/CopyButton";
import {
  ZERO, conversion, currencyFor, daySeries, fmtDay, isTeamRole, money, num, resolvePeriod, share, sumTotals, taggedUrl, addDays, todayLA,
} from "@/lib/util";

type SP = { period?: string; from?: string; to?: string; creator?: string; ok?: string; error?: string; new?: string };
const COLORS = ["bg-accent", "bg-violet", "bg-amber", "bg-sky", "bg-rose", "bg-ink-3"];

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
  const urlOf = (l: (typeof links)[number]) => taggedUrl(pageOf.get(l.page_id)?.url ?? "", l.amazon_tag);
  const row = (l: (typeof links)[number]) => (
    <LinkRow key={l.id} link={l} url={urlOf(l)} pageName={pages.length > 1 ? pageOf.get(l.page_id)?.name ?? null : null}
      totals={totals.get(l.id) ?? ZERO} cur={cur} team={false} back={back} fresh={l.id === sp.new} />
  );

  return (
    <div>
      <Flash ok={sp.ok} error={sp.error} />
      {fresh && (
        <div className="mb-5 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <div className="text-sm font-semibold text-accent">Link ready: {fresh.name}</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1 truncate rounded-lg bg-bg px-3 py-2 font-mono text-[11px] text-ink-2">{urlOf(fresh)}</div>
            <CopyButton text={urlOf(fresh)} />
          </div>
          {!fresh.amazon_tag && <p className="mt-2 text-xs text-amber">Tracking has not been attached to this link yet. Your manager does that. Wait for it to show as tracked before you post it, or its sales will not count for you.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label">Your links · {period.label.toLowerCase()}</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Hi {me.username.split(" ")[0]}. Here is what your links sold.</h1>
        </div>
        <AutoForm className="flex items-end gap-3"><PeriodSelect period={period} /></AutoForm>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {([["Sales", money(mine.sales, cur)], ["Purchases", num(mine.purchases)], ["Clicks", num(mine.clicks)]] as const).map(([l, v]) => (
          <div key={l} className="card min-w-0 p-3 sm:p-4">
            <div className="label">{l}</div>
            <div className="big-number mt-1 truncate text-base font-bold sm:text-2xl">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 font-mono text-[11px] text-ink-3">
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
          <p className="mt-3 px-1 font-mono text-[11px] leading-relaxed text-ink-3">
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
  const creatorIds = [...new Set([...members.map((m) => m.creator_id), ...links.map((l) => l.owner_id)])];
  const profiles = await getProfilesByIds(creatorIds);
  const chosen = sp.creator && creatorIds.includes(sp.creator) ? sp.creator : null;
  const scoped = chosen ? links.filter((l) => l.owner_id === chosen) : links;
  const t = sumTotals(scoped.map((l) => totals.get(l.id) ?? ZERO));

  // each creator's share of sales (always across everyone, so the bar keeps its meaning when one is picked)
  const byCreator = new Map<string, number>();
  for (const l of links) byCreator.set(l.owner_id, (byCreator.get(l.owner_id) ?? 0) + (totals.get(l.id)?.sales ?? 0));
  const ranked = [...byCreator.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const allSales = ranked.reduce((s, [, v]) => s + v, 0);
  const top = ranked.slice(0, 5);
  const rest = ranked.slice(5).reduce((s, [, v]) => s + v, 0);
  const parts = [
    ...top.map(([cid, v], i) => ({ key: cid, value: v, color: COLORS[i], title: `${profiles.get(cid)?.username ?? "Unknown"}: ${money(v, cur)}` })),
    ...(rest > 0 ? [{ key: "rest", value: rest, color: COLORS[5], title: `Everyone else: ${money(rest, cur)}` }] : []),
  ];

  // daily chart: the chosen dates, or the last 90 days when "all time" is picked
  const today = todayLA();
  const chartFrom = period.from ?? addDays(today, -89);
  const periodEnd = period.to && period.to < today ? period.to : today;
  const chartTo = through && through >= chartFrom && through < periodEnd ? through : periodEnd;
  const daily = await getDailyTotals({ product: id, from: chartFrom, to: chartTo }, chosen ? scoped.map((l) => l.id) : null);
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const days = daySeries(chartFrom, chartTo);
  const names = creatorIds.map((cid) => profiles.get(cid)).filter((p): p is Profile => !!p).sort((a, b) => a.username.localeCompare(b.username));

  return (
    <div className="space-y-4">
      <Flash ok={sp.ok} error={sp.error} />
      <AutoForm className="flex flex-wrap items-end gap-3">
        <PeriodSelect period={period} withDates from={sp.from} to={sp.to} />
        <label className="block">
          <span className="label mb-1 block">Creator</span>
          <select name="creator" defaultValue={chosen ?? ""} className="select min-w-44 py-1.5">
            <option value="">All creators</option>
            {names.map((p) => <option key={p.id} value={p.id}>{p.username}</option>)}
          </select>
        </label>
        <span className="ml-auto self-center font-mono text-[11px] text-ink-3">
          {through ? `Data through ${fmtDay(through, { day: "numeric", month: "short", year: "numeric" })} · Los Angeles days` : "No sales data yet"}
        </span>
      </AutoForm>

      <div className="card grid grid-cols-1 gap-6 p-6 md:grid-cols-[1.3fr_1fr] md:p-8">
        <div>
          <div className="label">Total sales · {period.label.toLowerCase()} · {chosen ? profiles.get(chosen)?.username : `${creatorIds.length} creators`}</div>
          <div className="big-number mt-2 text-5xl font-extrabold md:text-7xl">{money(t.sales, cur)}</div>
          <div className="mt-2 font-mono text-[11px] text-ink-3">Includes brand halo</div>
          {!chosen && bonus > 0 && (
            <div className="mt-4 inline-flex rounded-lg border border-amber/30 bg-amber/10 px-3 py-1.5 font-mono text-xs text-amber">
              Brand Referral Bonus {money(bonus, cur)} · team only
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 self-end">
          {([["Purchases", num(t.purchases)], ["Units", num(t.units)], ["Clicks", num(t.clicks)], ["Conversion", conversion(t.purchases, t.clicks)]] as const).map(([l, v]) => (
            <div key={l} className="rounded-xl border border-line bg-panel-2 p-4">
              <div className="big-number text-2xl font-bold">{v}</div>
              <div className="label mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="label">Each creator&apos;s share of sales · {period.label.toLowerCase()}</div>
        {ranked.length === 0 ? (
          <p className="mt-3 font-mono text-xs text-ink-3">No sales in these dates yet.</p>
        ) : (
          <>
            <div className="mt-4"><SplitBar parts={parts} /></div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {top.map(([cid, v], i) => (
                <div key={cid} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${COLORS[i]}`} />
                  <span className="truncate">{profiles.get(cid)?.username ?? "Unknown"}</span>
                  <span className="ml-auto shrink-0 font-mono text-xs text-ink-3">{money(v, cur)} · {share(v, allSales)}</span>
                </div>
              ))}
              {rest > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${COLORS[5]}`} />
                  <span className="truncate">{ranked.length - 5} more creators</span>
                  <span className="ml-auto shrink-0 font-mono text-xs text-ink-3">{money(rest, cur)} · {share(rest, allSales)}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card p-6">
        <div className="label mb-3">Sales and purchases per day{period.from ? "" : " · last 90 days"}</div>
        <DayChart days={days} bar={days.map((d) => byDay.get(d)?.sales ?? 0)} line={days.map((d) => byDay.get(d)?.purchases ?? 0)}
          barLabel="Sales" lineLabel="Purchases" format={(n) => money(n, cur)} />
      </div>
    </div>
  );
}
