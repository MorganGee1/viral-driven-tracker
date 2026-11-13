import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBonus, getBrand, getDailyTotals, getDataThrough, getMe, getNav, getProductTotals } from "@/lib/data";
import { addProduct, updateBrand } from "@/lib/actions";
import { Flash } from "@/components/app/Flash";
import { DayChart } from "@/components/app/Charts";
import { ZERO, conversion, currencyFor, daySeries, fmtDay, isTeamRole, money, num, resolvePeriod, share, sumTotals } from "@/lib/util";

export default async function BrandPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = (await getMe())!;
  if (!isTeamRole(me.role)) redirect("/app");
  const brand = await getBrand(id);
  if (!brand) notFound();
  const cur = currencyFor(brand.marketplace);
  const products = (await getNav()).products.filter((p) => p.brand_id === id);
  const month = resolvePeriod({});
  const d30 = resolvePeriod({ period: "30d" });

  const [monthTotals, d30Totals, daily, bonus, through] = await Promise.all([
    getProductTotals(month.from, month.to),
    getProductTotals(d30.from, d30.to),
    getDailyTotals({ brand: id, from: d30.from, to: d30.to }),
    getBonus({ brand: id, from: month.from, to: month.to }),
    getDataThrough({ brand: id }),
  ]);
  const m = sumTotals(products.map((p) => monthTotals.get(p.id) ?? ZERO));
  const t30 = sumTotals(products.map((p) => d30Totals.get(p.id) ?? ZERO));
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const days = daySeries(d30.from!, through && through >= d30.from! && through < d30.to! ? through : d30.to!);
  const rows = [...products].sort((a, b) =>
    (a.status === b.status ? (monthTotals.get(b.id)?.sales ?? 0) - (monthTotals.get(a.id)?.sales ?? 0) : a.status === "active" ? -1 : 1));
  const back = `/app/brands/${id}`;

  return (
    <div className="mx-auto max-w-6xl">
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
        <span className="pill-muted">{brand.marketplace}</span>
        <span className="ml-auto font-mono text-[11px] text-ink-3">
          {through ? `Data through ${fmtDay(through, { day: "numeric", month: "short", year: "numeric" })} · Los Angeles days` : "No sales data yet"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="label">Total sales · this month</div>
          <div className="big-number mt-2 text-5xl font-extrabold">{money(m.sales, cur)}</div>
          <div className="mt-2 font-mono text-[11px] text-ink-3">Includes brand halo · {fmtDay(month.from)} to {fmtDay(month.to)}</div>
          {bonus > 0 && (
            <div className="mt-4 inline-flex rounded-lg border border-amber/30 bg-amber/10 px-3 py-1.5 font-mono text-xs text-amber">
              Brand Referral Bonus {money(bonus, cur)} · team only
            </div>
          )}
        </div>
        <div className="card p-6">
          <div className="label">Total sales · last 30 days</div>
          <div className="big-number mt-2 text-5xl font-extrabold">{money(t30.sales, cur)}</div>
          <div className="mt-2 font-mono text-[11px] text-ink-3">{fmtDay(d30.from)} to {fmtDay(d30.to)}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          ["Purchases", num(m.purchases), num(t30.purchases)],
          ["Units", num(m.units), num(t30.units)],
          ["Clicks", num(m.clicks), num(t30.clicks)],
          ["Conversion", conversion(m.purchases, m.clicks), conversion(t30.purchases, t30.clicks)],
        ] as const).map(([label, a, b]) => (
          <div key={label} className="card p-4">
            <div className="label">{label} · this month</div>
            <div className="big-number mt-1 text-2xl font-bold">{a}</div>
            <div className="mt-1 font-mono text-[11px] text-ink-3">last 30 days: {b}</div>
          </div>
        ))}
      </div>

      <div className="card mt-4 p-6">
        <div className="label mb-3">Clicks and purchases per day · last 30 days</div>
        <DayChart days={days} bar={days.map((d) => byDay.get(d)?.clicks ?? 0)} line={days.map((d) => byDay.get(d)?.purchases ?? 0)} barLabel="Clicks" lineLabel="Purchases" />
        <p className="mt-3 font-mono text-[11px] text-ink-3">Amazon can restate the most recent days for up to 31 days, so recent numbers may still move.</p>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="label border-b border-line px-5 py-3">Products · this month</div>
        {rows.length === 0 && <div className="px-5 py-6 font-mono text-xs text-ink-3">No products yet. Add the first one below.</div>}
        {rows.map((p) => {
          const t = monthTotals.get(p.id) ?? ZERO;
          return (
            <Link key={p.id} href={`/app/products/${p.id}`} className={`grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 border-b border-line px-5 py-3 last:border-0 hover:bg-panel-2 md:grid-cols-[1fr_90px_100px_130px_70px] ${p.status === "archived" ? "opacity-50" : ""}`}>
              <div className="truncate font-medium">{p.name}{p.status === "archived" && <span className="pill-muted ml-2">archived</span>}</div>
              <div className="hidden text-right font-mono text-xs text-ink-2 md:block">{num(t.clicks)} clicks</div>
              <div className="hidden text-right font-mono text-xs text-ink-2 md:block">{num(t.purchases)} purchases</div>
              <div className="big-number text-right font-semibold">{money(t.sales, cur)}</div>
              <div className="hidden text-right font-mono text-xs text-ink-3 md:block">{share(t.sales, m.sales)}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <form action={addProduct} className="card space-y-3 p-5">
          <div className="label">Add a product</div>
          <input type="hidden" name="brand_id" value={id} />
          <input type="hidden" name="back" value={back} />
          <input name="name" required maxLength={80} placeholder="Product name, e.g. Lash Serum" className="input" />
          <input name="page_url" required placeholder="Amazon page, e.g. https://www.amazon.com/dp/B0XXXXXXXX" className="input" />
          <input name="page_name" maxLength={80} placeholder="Name for that Amazon page (optional)" className="input" />
          <button className="btn-primary w-full">Add product</button>
          <p className="font-mono text-[11px] leading-relaxed text-ink-3">You can add more Amazon pages to a product later in its Settings.</p>
        </form>
        <form action={updateBrand} className="card space-y-3 p-5">
          <div className="label">Brand details</div>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="back" value={back} />
          <input name="name" required maxLength={80} defaultValue={brand.name} className="input" aria-label="Brand name" />
          <select name="marketplace" className="select" defaultValue={brand.marketplace} aria-label="Amazon marketplace">
            {["US", "UK", "CA", "DE", "FR", "IT", "ES"].map((mk) => <option key={mk} value={mk}>{mk}</option>)}
          </select>
          <button className="btn-ghost w-full">Save brand</button>
        </form>
      </div>
    </div>
  );
}
