import { getCampaign, getCampaignLinks, getMe, getProfilesByIds, getStats, monthRanges, sum, money, num, pct, currencyFor, PLACEMENTS } from "@/lib/data";
import { Delta } from "@/components/app/Delta";
import { Sparkline } from "@/components/app/Sparkline";

const COLORS = ["bg-accent", "bg-violet", "bg-amber", "bg-sky", "bg-rose", "bg-ink-3"];

export default async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getMe())!;
  const isManager = me.role === "manager";
  const { campaign, brand } = (await getCampaign(id))!;
  const cur = currencyFor(brand.marketplace);
  const r = monthRanges();
  const links = await getCampaignLinks(id);
  const ids = links.map((l) => l.id);
  const [now, prev] = await Promise.all([getStats(ids, r.from, r.to), getStats(ids, r.prevFrom, r.prevTo)]);
  const t = sum(now), p = sum(prev);
  const owners = await getProfilesByIds([...new Set(links.map((l) => l.owner_id))]);

  // by creator
  const linkOwner = new Map(links.map((l) => [l.id, l.owner_id]));
  const byCreator = new Map<string, number>();
  for (const s of now) { const o = linkOwner.get(s.link_id)!; byCreator.set(o, (byCreator.get(o) ?? 0) + Number(s.sales)); }
  const creators = [...byCreator.entries()].sort((a, b) => b[1] - a[1]);
  const totalSales = t.sales || 1;

  // by placement
  const linkPlacement = new Map(links.map((l) => [l.id, l.placement]));
  const byPlacement = new Map<string, number>();
  for (const s of now) { const k = linkPlacement.get(s.link_id)!; byPlacement.set(k, (byPlacement.get(k) ?? 0) + Number(s.sales)); }

  // daily series
  const daily = new Map<string, number>();
  for (const s of now) daily.set(s.day, (daily.get(s.day) ?? 0) + Number(s.sales));
  const days = [...daily.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const lastDay = days.at(-1)?.[0];
  const conv = t.clicks ? ((t.purchases / t.clicks) * 100).toFixed(2) + "%" : "—";
  const lastLabel = lastDay ? new Date(lastDay + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "no data yet";

  return (
    <div className="space-y-8">
      <div className="card relative overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 opacity-70"><Sparkline points={days.map((d) => d[1])} /></div>
        <div className="relative grid gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="label">Total sales · this month · {isManager ? `${creators.length} creators` : "your links"}</div>
            <div className="big-number mt-2 text-6xl font-extrabold md:text-8xl">
              {money(t.sales, cur).replace(/\.\d\d$/, "")}<span className="text-3xl text-ink-3 md:text-4xl">{money(t.sales, cur).slice(-3)}</span>
            </div>
            <div className="mt-3 font-mono text-xs text-ink-3"><Delta value={pct(t.sales, p.sales)} /> vs same days last month · data through {lastLabel}</div>
            {isManager && t.bonus > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/10 px-3 py-1.5 font-mono text-xs text-amber">
                Brand Referral Bonus {money(t.bonus, cur)} · managers only
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 self-end">
            {[
              [num(t.purchases), "purchases", pct(t.purchases, p.purchases)],
              [num(t.units), "units", pct(t.units, p.units)],
              [num(t.clicks), "clicks", pct(t.clicks, p.clicks)],
              [conv, "conversion", null],
            ].map(([v, l, d]) => (
              <div key={l as string} className="rounded-xl border border-line bg-panel-2/80 p-4 backdrop-blur">
                <div className="big-number text-2xl font-bold">{v as string}</div>
                <div className="mt-1 flex items-center justify-between"><span className="label">{l as string}</span><span className="font-mono text-[11px]"><Delta value={d as number | null} /></span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isManager && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="label">By creator · {creators.length} creators · total sales share · this month</div>
          </div>
          {creators.length === 0 ? (
            <p className="mt-3 font-mono text-xs text-ink-3">No sales recorded this month yet. Import an Attribution report or wait for the daily sync.</p>
          ) : (
            <>
              <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-line">
                {creators.map(([o, v], i) => <div key={o} className={`${COLORS[i % COLORS.length]} h-full`} style={{ width: `${(v / totalSales) * 100}%` }} title={owners.get(o)?.username} />)}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map(([o, v], i) => (
                  <div key={o} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-sm ${COLORS[i % COLORS.length]}`} />
                    <span className="truncate">{owners.get(o)?.username ?? "Unknown"}</span>
                    <span className="ml-auto font-mono text-xs text-ink-3">{money(v, cur)} · {((v / totalSales) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="label">By placement · sales this month</div>
          <div className="mt-4 space-y-2">
            {(Object.keys(PLACEMENTS) as (keyof typeof PLACEMENTS)[]).map((k) => {
              const v = byPlacement.get(k) ?? 0;
              return (
                <div key={k} className="flex items-center gap-3 text-sm">
                  <span className="w-32 text-ink-2">{PLACEMENTS[k]}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-accent" style={{ width: `${(v / totalSales) * 100}%` }} /></div>
                  <span className="w-24 text-right font-mono text-xs">{money(v, cur)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-6">
          <div className="label">Funnel · this month</div>
          <div className="mt-4 space-y-2 text-sm">
            {[["Clicks", t.clicks], ["Detail page views", t.dpv], ["Add to carts", t.atc], ["Purchases", t.purchases], ["Units", t.units]].map(([l, v]) => (
              <div key={l as string} className="flex items-center justify-between border-b border-line py-1.5 last:border-0">
                <span className="text-ink-2">{l as string}</span><span className="big-number font-semibold">{num(v as number)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
