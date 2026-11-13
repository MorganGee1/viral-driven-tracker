import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe, getNav, getProductTotals, getLinks } from "@/lib/data";
import { addBrand } from "@/lib/actions";
import { Flash } from "@/components/app/Flash";
import { ZERO, currencyFor, isTeamRole, money, num, resolvePeriod, sumTotals } from "@/lib/util";

export default async function Home({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = (await getMe())!;
  const team = isTeamRole(me.role);
  const { brands, products } = await getNav();
  const live = products.filter((p) => p.status === "active");

  // A creator in one product goes straight to it.
  if (!team && live.length === 1 && !sp.ok && !sp.error) redirect(`/app/products/${live[0].id}`);

  const month = resolvePeriod({});
  const totals = await getProductTotals(month.from, month.to);
  const first = me.username.split(" ")[0];

  if (!team) {
    const myLinks = await getLinks({});
    return (
      <div className="mx-auto max-w-4xl">
        <Flash ok={sp.ok} error={sp.error} />
        <div className="label">Your products · this month</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Hi {first}.</h1>
        {live.length === 0 ? (
          <div className="card mt-8 p-8">
            <h2 className="text-xl font-semibold">You are signed in. One step left.</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              You have not joined a product yet. Open the invite link your manager sent you and you will land on the product, ready to make your links.
              No link? Ask them for one in Discord.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {live.map((p) => {
              const b = brands.find((x) => x.id === p.brand_id);
              const t = totals.get(p.id) ?? ZERO;
              const count = myLinks.filter((l) => l.product_id === p.id && !l.archived_at).length;
              return (
                <Link key={p.id} href={`/app/products/${p.id}`} className="card p-5 transition hover:border-line-2">
                  <div className="label">{b?.name}</div>
                  <div className="mt-1 truncate text-lg font-semibold">{p.name}</div>
                  <div className="big-number mt-3 text-3xl font-bold">{money(t.sales, currencyFor(b?.marketplace ?? "US"))}</div>
                  <div className="mt-2 font-mono text-[11px] text-ink-3">
                    <span className="text-ink">{num(t.purchases)}</span> sales · <span className="text-ink">{num(t.clicks)}</span> clicks · <span className="text-ink">{count}</span> {count === 1 ? "link" : "links"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Flash ok={sp.ok} error={sp.error} />
      <div className="label">All brands · this month</div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Hi {first}.</h1>

      {brands.length === 0 && (
        <div className="card mt-8 p-8">
          <h2 className="text-xl font-semibold">Set up your first brand</h2>
          <ol className="mt-4 space-y-2 text-sm leading-relaxed text-ink-2">
            <li><span className="font-mono text-accent">1</span> &nbsp;Add a brand below.</li>
            <li><span className="font-mono text-accent">2</span> &nbsp;Add a product under it, with the Amazon page its links point to.</li>
            <li><span className="font-mono text-accent">3</span> &nbsp;Create an invite link for the product and send it to your creators.</li>
            <li><span className="font-mono text-accent">4</span> &nbsp;Creators sign in with Discord and make their own links. Sales show up per creator, account and placement.</li>
          </ol>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const ps = products.filter((p) => p.brand_id === b.id);
          const t = sumTotals(ps.map((p) => totals.get(p.id) ?? ZERO));
          const liveCount = ps.filter((p) => p.status === "active").length;
          return (
            <Link key={b.id} href={`/app/brands/${b.id}`} className="card p-5 transition hover:border-line-2">
              <div className="flex items-center justify-between">
                <div className="truncate text-lg font-semibold">{b.name}</div>
                <span className="pill-muted">{b.marketplace}</span>
              </div>
              <div className="big-number mt-3 text-3xl font-bold">{money(t.sales, currencyFor(b.marketplace))}</div>
              <div className="mt-2 font-mono text-[11px] text-ink-3">
                <span className="text-ink">{num(t.purchases)}</span> purchases · <span className="text-ink">{num(t.clicks)}</span> clicks · <span className="text-ink">{liveCount}</span> {liveCount === 1 ? "product" : "products"}
              </div>
            </Link>
          );
        })}
      </div>

      <form action={addBrand} className="card mt-10 max-w-md space-y-3 p-5">
        <div className="label">Add a brand</div>
        <input name="name" required maxLength={80} placeholder="Brand name" className="input" />
        <select name="marketplace" className="select" defaultValue="US" aria-label="Amazon marketplace">
          <option value="US">US · amazon.com</option>
          <option value="UK">UK · amazon.co.uk</option>
          <option value="CA">CA · amazon.ca</option>
          <option value="DE">DE · amazon.de</option>
          <option value="FR">FR · amazon.fr</option>
          <option value="IT">IT · amazon.it</option>
          <option value="ES">ES · amazon.es</option>
        </select>
        <button className="btn-primary w-full">Add brand</button>
      </form>
    </div>
  );
}
