import Link from "next/link";
import { getMe, getBrandsWithCampaigns, getStats, monthRanges, sum, money, currencyFor, num, pct } from "@/lib/data";
import { addBrand, addCampaign } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { Delta } from "@/components/app/Delta";

export default async function Home() {
  const me = (await getMe())!;
  const { brands, campaigns } = await getBrandsWithCampaigns();
  const isManager = me.role === "manager";
  const r = monthRanges();

  // links visible to this user (RLS already limits creators to their own)
  const supabase = await createClient();
  const { data: links } = await supabase.from("links").select("id, campaign_id");
  const linkIds = (links ?? []).map((l) => l.id);
  const [cur, prev] = await Promise.all([getStats(linkIds, r.from, r.to), getStats(linkIds, r.prevFrom, r.prevTo)]);
  const byCampaign = new Map<string, string[]>();
  for (const l of links ?? []) byCampaign.set(l.campaign_id, [...(byCampaign.get(l.campaign_id) ?? []), l.id]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">{isManager ? "All brands" : "Your campaigns"} · this month · {r.label}</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Hi {me.username.split(" ")[0]}.</h1>
        </div>
      </div>

      {brands.length === 0 && (
        <div className="card mt-8 p-8 text-center">
          <h2 className="text-xl font-semibold">{isManager ? "Add your first brand" : "No campaigns yet"}</h2>
          <p className="mt-2 text-sm text-ink-2">{isManager ? "A brand holds campaigns. A campaign is one Amazon product URL that creators make links for." : "Your manager hasn't set up a campaign yet. Check back soon."}</p>
        </div>
      )}

      <div className="mt-8 space-y-10">
        {brands.map((b) => {
          const cs = campaigns.filter((c) => c.brand_id === b.id);
          const cur_ = currencyFor(b.marketplace);
          return (
            <section key={b.id}>
              <div className="mb-3 flex items-center justify-between">
                <Link href={`/app/brands/${b.id}`} className="text-lg font-semibold hover:text-accent">{b.name} <span className="ml-2 font-mono text-xs text-ink-3">{b.marketplace}</span></Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {cs.map((c) => {
                  const ids = byCampaign.get(c.id) ?? [];
                  const t = sum(cur.filter((s) => ids.includes(s.link_id)));
                  const p = sum(prev.filter((s) => ids.includes(s.link_id)));
                  return (
                    <Link key={c.id} href={`/app/campaigns/${c.id}`} className="card p-5 transition hover:border-line-2">
                      <div className="flex items-center justify-between">
                        <div className="truncate font-medium">{c.name}</div>
                        <span className={c.status === "active" ? "pill-live" : "pill-muted"}>{c.status}</span>
                      </div>
                      <div className="big-number mt-3 text-3xl font-bold">{money(t.sales, cur_)}</div>
                      <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-ink-3">
                        <Delta value={pct(t.sales, p.sales)} /> vs same days last month
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px] text-ink-3">
                        <div><span className="text-ink">{num(t.purchases)}</span> purchases</div>
                        <div><span className="text-ink">{num(t.clicks)}</span> clicks</div>
                        <div><span className="text-ink">{ids.length}</span> links</div>
                      </div>
                    </Link>
                  );
                })}
                {cs.length === 0 && <div className="card p-5 font-mono text-xs text-ink-3">No campaigns in this brand yet.</div>}
              </div>
            </section>
          );
        })}
      </div>

      {isManager && (
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <form action={addBrand} className="card space-y-3 p-5">
            <div className="label">Add a brand</div>
            <input name="name" required placeholder="Brand name" className="input" />
            <select name="marketplace" className="select" defaultValue="US">
              <option value="US">US · amazon.com</option>
              <option value="UK">UK · amazon.co.uk</option>
              <option value="DE">DE · amazon.de</option>
              <option value="CA">CA · amazon.ca</option>
            </select>
            <button className="btn-primary w-full">Add brand</button>
          </form>
          <form action={addCampaign} className="card space-y-3 p-5">
            <div className="label">Add a campaign</div>
            <select name="brand_id" required className="select" disabled={brands.length === 0}>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input name="name" required placeholder="Campaign name, e.g. Hip & Joint Chews" className="input" />
            <input name="product_url" required placeholder="Amazon product URL, e.g. https://www.amazon.com/dp/B0XXXXXXX" className="input" />
            <button className="btn-primary w-full" disabled={brands.length === 0}>Add campaign</button>
          </form>
        </div>
      )}
    </div>
  );
}
