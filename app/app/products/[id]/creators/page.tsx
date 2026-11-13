import Link from "next/link";
import { redirect } from "next/navigation";
import { getInvites, getLinkTotals, getLinks, getMe, getMemberIds, getProduct, getProfilesByIds } from "@/lib/data";
import { getOrigin } from "@/lib/origin";
import { AutoForm } from "@/components/app/AutoForm";
import { SplitBar } from "@/components/app/Charts";
import { Flash } from "@/components/app/Flash";
import { InvitePanel } from "@/components/app/InvitePanel";
import { PeriodSelect } from "@/components/app/PeriodSelect";
import { PLACEMENTS, PLACEMENT_COLOR, PLACEMENT_KEYS, accountLabel, currencyFor, isTeamRole, money, num, resolvePeriod, share, type Placement } from "@/lib/util";

type SP = { period?: string; q?: string; ok?: string; error?: string; invite?: string };

export default async function Creators({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = (await getMe())!;
  if (!isTeamRole(me.role)) redirect(`/app/products/${id}`);
  const { brand } = (await getProduct(id))!;
  const cur = currencyFor(brand.marketplace);
  const period = resolvePeriod({ period: sp.period });
  const [links, totals, allTime, members, invites, origin] = await Promise.all([
    getLinks({ product: id }),
    getLinkTotals({ product: id, from: period.from, to: period.to }),
    period.key === "all" ? Promise.resolve(null) : getLinkTotals({ product: id, from: null, to: null }),
    getMemberIds(id),
    getInvites({ product: id, role: "creator" }),
    getOrigin(),
  ]);
  const ever = allTime ?? totals;
  const ids = [...new Set([...members.map((m) => m.creator_id), ...links.map((l) => l.owner_id)])];
  const profiles = await getProfilesByIds(ids);

  const rows = ids.map((cid) => {
    const mine = links.filter((l) => l.owner_id === cid);
    const by = Object.fromEntries(PLACEMENT_KEYS.map((k) => [k, { sales: 0, purchases: 0 }])) as Record<Placement, { sales: number; purchases: number }>;
    let sales = 0, purchases = 0, everSales = 0;
    for (const l of mine) {
      const t = totals.get(l.id);
      if (t) { sales += t.sales; purchases += t.purchases; by[l.placement].sales += t.sales; by[l.placement].purchases += t.purchases; }
      everSales += ever.get(l.id)?.sales ?? 0;
    }
    const accounts = [...new Set(mine.filter((l) => !l.archived_at).map((l) => accountLabel(l.platform, l.account)))];
    return { cid, p: profiles.get(cid), sales, purchases, everSales, by, accounts, linkCount: mine.filter((l) => !l.archived_at).length };
  });
  const q = sp.q?.trim().toLowerCase();
  const shown = rows
    .filter((r) => !q || `${r.p?.username ?? ""} ${r.p?.discord_username ?? ""}`.toLowerCase().includes(q))
    .sort((a, b) => b.sales - a.sales || b.purchases - a.purchases || (a.p?.username ?? "").localeCompare(b.p?.username ?? ""));
  const selling = shown.filter((r) => r.sales > 0 || r.purchases > 0);
  const quiet = shown.filter((r) => !(r.sales > 0 || r.purchases > 0));
  const total = rows.reduce((s, r) => s + r.sales, 0);
  const back = `/app/products/${id}/creators`;
  const activeInvites = invites.filter((i) => i.active).length;

  return (
    <div className="space-y-4">
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex flex-wrap items-end gap-3">
        <AutoForm className="flex flex-wrap items-end gap-3">
          <PeriodSelect period={period} />
          <label className="block">
            <span className="label mb-1 block">Search</span>
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Creator name" className="input w-48 py-1.5" />
          </label>
        </AutoForm>
        <div className="ml-auto font-mono text-[11px] text-ink-3">{ids.length} creators · {money(total, cur)} {period.label.toLowerCase()}</div>
      </div>

      <details className="card p-5" open={invites.length === 0 || !!sp.ok || sp.invite === "1"}>
        <summary className="flex cursor-pointer select-none items-center gap-3">
          <span className="btn-primary">Invite creators</span>
          <span className="font-mono text-[11px] text-ink-3">{activeInvites} active invite {activeInvites === 1 ? "link" : "links"}. Anyone who opens one signs in with Discord and lands on this product.</span>
        </summary>
        <div className="mt-4"><InvitePanel invites={invites} origin={origin} back={back} role="creator" productId={id} /></div>
      </details>

      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[1fr_130px_80px_minmax(120px,1fr)_120px] gap-4 border-b border-line px-5 py-3 md:grid">
          <span className="label">Creator</span><span className="label text-right">Total sales</span><span className="label text-right">Sales</span>
          <span className="label">By placement</span><span className="label text-right">All time</span>
        </div>
        {selling.length === 0 && <div className="px-5 py-6 font-mono text-xs text-ink-3">{q ? "No creator matches that search with sales in these dates." : "No sales in these dates yet."}</div>}
        {selling.map((r, i) => (
          <details key={r.cid} className="group border-b border-line last:border-0">
            <summary className="grid cursor-pointer select-none grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 hover:bg-panel-2 md:grid-cols-[1fr_130px_80px_minmax(120px,1fr)_120px]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 shrink-0 font-mono text-[11px] text-ink-3">{i + 1}</span>
                {r.p?.avatar_url ? <img src={r.p.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full" /> : <div className="h-8 w-8 shrink-0 rounded-full bg-line-2" />}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.p?.username ?? "Unknown"}</div>
                  <div className="truncate font-mono text-[10px] text-ink-3">{r.p?.discord_username ? `@${r.p.discord_username}` : "Discord"}</div>
                </div>
              </div>
              <div className="big-number text-right font-semibold">{money(r.sales, cur)}</div>
              <div className="hidden text-right font-mono text-xs text-ink-2 md:block">{num(r.purchases)}</div>
              <div className="col-span-2 md:col-span-1">
                <SplitBar className="h-2" parts={PLACEMENT_KEYS.map((k) => ({ key: k, value: r.by[k].sales, color: PLACEMENT_COLOR[k], title: `${PLACEMENTS[k]}: ${num(r.by[k].purchases)} sales, ${share(r.by[k].sales, r.sales)}` }))} />
              </div>
              <div className="hidden text-right font-mono text-xs text-ink-3 md:block">{money(r.everSales, cur)}</div>
            </summary>
            <div className="grid grid-cols-1 gap-4 border-t border-line bg-panel-2 px-5 py-4 md:grid-cols-2">
              <div>
                <div className="label mb-2">Sales by placement</div>
                {PLACEMENT_KEYS.filter((k) => r.by[k].sales > 0 || r.by[k].purchases > 0).map((k) => (
                  <div key={k} className="flex items-center gap-2 py-1 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-sm ${PLACEMENT_COLOR[k]}`} />
                    <span>{PLACEMENTS[k]}</span>
                    <span className="ml-auto font-mono text-xs text-ink-2">{num(r.by[k].purchases)} sales · {share(r.by[k].sales, r.sales)} · {money(r.by[k].sales, cur)}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="label mb-2">Accounts · {r.linkCount} live {r.linkCount === 1 ? "link" : "links"}</div>
                <div className="text-sm text-ink-2">{r.accounts.length ? r.accounts.join(", ") : "No links yet"}</div>
                <div className="mt-3 font-mono text-[11px] text-ink-3">Discord ID {r.p?.discord_id ?? "unknown"}</div>
                <Link href={`/app/products/${id}/earnings?creator=${r.cid}&period=${period.key}`} className="mt-3 inline-block text-sm text-accent hover:underline">Open in Earnings</Link>
              </div>
            </div>
          </details>
        ))}
      </div>

      {quiet.length > 0 && (
        <details className="card px-5 py-3">
          <summary className="cursor-pointer select-none font-mono text-xs text-ink-3 hover:text-ink">
            {quiet.length} {quiet.length === 1 ? "creator" : "creators"} with no sales {period.key === "all" ? "yet" : "in these dates"}
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quiet.map((r) => (
              <div key={r.cid} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <span className="truncate">{r.p?.username ?? "Unknown"}</span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-3">{r.linkCount} {r.linkCount === 1 ? "link" : "links"}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-3">
        {PLACEMENT_KEYS.map((k) => <span key={k} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-sm ${PLACEMENT_COLOR[k]}`} />{PLACEMENTS[k]}</span>)}
      </div>
    </div>
  );
}
