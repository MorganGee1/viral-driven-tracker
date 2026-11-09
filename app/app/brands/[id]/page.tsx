import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe, type Brand, type Campaign } from "@/lib/data";
import { addCampaign, deleteBrand } from "@/lib/actions";

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getMe())!;
  const supabase = await createClient();
  const { data: brand } = await supabase.from("brands").select("id, name, marketplace").eq("id", id).single();
  if (!brand) notFound();
  const { data: campaigns } = await supabase.from("campaigns").select("id, brand_id, name, product_url, status").eq("brand_id", id).order("name");
  const b = brand as Brand, cs = (campaigns ?? []) as Campaign[];
  return (
    <div className="mx-auto max-w-4xl">
      <div className="label">Brand · {b.marketplace}</div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{b.name}</h1>
      <div className="mt-6 space-y-2">
        {cs.map((c) => (
          <Link key={c.id} href={`/app/campaigns/${c.id}`} className="card flex items-center justify-between p-4 hover:border-line-2">
            <div><div className="font-medium">{c.name}</div><div className="truncate font-mono text-[11px] text-ink-3">{c.product_url}</div></div>
            <span className={c.status === "active" ? "pill-live" : "pill-muted"}>{c.status}</span>
          </Link>
        ))}
        {cs.length === 0 && <div className="card p-5 font-mono text-xs text-ink-3">No campaigns yet.</div>}
      </div>
      {me.role === "manager" && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <form action={addCampaign} className="card space-y-3 p-5">
            <div className="label">Add a campaign to {b.name}</div>
            <input type="hidden" name="brand_id" value={b.id} />
            <input name="name" required placeholder="Campaign name" className="input" />
            <input name="product_url" required placeholder="Amazon product URL" className="input" />
            <button className="btn-primary w-full">Add campaign</button>
          </form>
          <form action={deleteBrand} className="card flex items-center justify-between p-5">
            <input type="hidden" name="id" value={b.id} />
            <div><div className="text-sm font-medium">Delete brand</div><div className="font-mono text-[11px] text-ink-3">Deletes all its campaigns and links.</div></div>
            <button className="btn-danger">Delete</button>
          </form>
        </div>
      )}
    </div>
  );
}
