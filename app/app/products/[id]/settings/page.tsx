import { redirect } from "next/navigation";
import { getLinks, getMe, getProduct } from "@/lib/data";
import { addPage, setPageArchived, setProductStatus, setTagTemplate, updatePage, updateProduct } from "@/lib/actions";
import { Flash } from "@/components/app/Flash";
import { isTeamRole } from "@/lib/util";

export default async function Settings({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = (await getMe())!;
  if (!isTeamRole(me.role)) redirect(`/app/products/${id}`);
  const { product, brand, pages } = (await getProduct(id))!;
  const links = await getLinks({ product: id });
  const back = `/app/products/${id}/settings`;
  const used = (pageId: string) => links.filter((l) => l.page_id === pageId).length;

  return (
    <div className="max-w-3xl space-y-4">
      <Flash ok={sp.ok} error={sp.error} />

      <form action={updateProduct} className="card space-y-3 p-5">
        <div className="label">Product name</div>
        <input type="hidden" name="id" value={id} /><input type="hidden" name="back" value={back} />
        <div className="flex gap-2">
          <input name="name" required maxLength={80} defaultValue={product.name} className="input" aria-label="Product name" />
          <button className="btn-ghost shrink-0">Rename</button>
        </div>
      </form>

      <div className="card space-y-3 p-5">
        <div className="label">Amazon pages</div>
        <p className="text-sm text-ink-2">The Amazon addresses creators can point a link at. They pick from this list and cannot type their own.</p>
        {pages.map((p) => (
          <div key={p.id} className={`rounded-xl border border-line bg-panel-2 p-3 ${p.archived_at ? "opacity-60" : ""}`}>
            <form action={updatePage} className="grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr_auto]">
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="product_id" value={id} /><input type="hidden" name="back" value={back} />
              <input name="name" required maxLength={80} defaultValue={p.name} className="input" aria-label="Amazon page name" />
              <input name="url" required defaultValue={p.url} className="input font-mono text-[11px]" aria-label="Amazon address" />
              <button className="btn-ghost">Save</button>
            </form>
            <form action={setPageArchived} className="mt-2 flex items-center gap-3">
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="product_id" value={id} /><input type="hidden" name="back" value={back} />
              <input type="hidden" name="archived" value={p.archived_at ? "0" : "1"} />
              <button className="font-mono text-[11px] text-ink-3 underline-offset-2 hover:text-ink hover:underline">{p.archived_at ? "Restore" : "Remove from list"}</button>
              <span className="font-mono text-[11px] text-ink-3">{used(p.id)} {used(p.id) === 1 ? "link uses" : "links use"} this page{p.archived_at ? " · removed, creators cannot pick it" : ""}</span>
            </form>
          </div>
        ))}
        {pages.length === 0 && <div className="font-mono text-xs text-amber">No Amazon page yet. Creators cannot make links until there is one.</div>}
        <form action={addPage} className="grid grid-cols-1 gap-2 rounded-xl border border-dashed border-line-2 p-3 sm:grid-cols-[180px_1fr_auto]">
          <input type="hidden" name="product_id" value={id} /><input type="hidden" name="back" value={back} />
          <input name="name" required maxLength={80} placeholder="Name, e.g. Mascara" className="input" aria-label="New Amazon page name" />
          <input name="url" required placeholder="https://www.amazon.com/dp/B0XXXXXXXX" className="input font-mono text-[11px]" aria-label="New Amazon address" />
          <button className="btn-primary">Add page</button>
        </form>
        <p className="font-mono text-[11px] leading-relaxed text-ink-3">Changing an address changes where every link made for that page goes, including ones already posted. Removing a page only hides it from the list. Links already made for it keep working.</p>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center gap-3">
          <div className="label">Amazon connection · {brand.name}</div>
          {brand.tag_template ? <span className="pill-live">tags automatic</span> : <span className="pill border-amber/40 text-amber">not connected</span>}
        </div>
        <p className="text-sm leading-relaxed text-ink-2">
          Sales numbers come from Amazon Attribution. {brand.tag_template
            ? "This brand has a tag template, so every new link is tagged automatically."
            : "The Amazon Ads API is not connected yet, so links are tagged by hand in Tracking links and numbers come in through Import report."}
        </p>
        <form action={setTagTemplate} className="space-y-2">
          <input type="hidden" name="brand_id" value={brand.id} /><input type="hidden" name="back" value={back} />
          <label className="label block" htmlFor="tpl">Attribution tag template (from the Amazon Ads API, shared by every product of {brand.name})</label>
          <textarea id="tpl" name="tag_template" rows={3} defaultValue={brand.tag_template ?? ""} className="input font-mono text-[11px]"
            placeholder="maas=maas_adg_api_...&ref_=aa_maas&aa_campaignid=...&aa_adgroupid=...&aa_creativeid=..." />
          <button className="btn-ghost">Save template</button>
        </form>
        <p className="font-mono text-[11px] leading-relaxed text-ink-3">Leave this empty until Amazon has approved API access. With a template saved, the tracker fills in the product, creator and link on every new link, and Amazon reports sales per link.</p>
      </div>

      <form action={setProductStatus} className="card flex flex-wrap items-center gap-3 p-5">
        <input type="hidden" name="id" value={id} /><input type="hidden" name="back" value={back} />
        <input type="hidden" name="status" value={product.status === "archived" ? "active" : "archived"} />
        <div className="min-w-0 flex-1 basis-64">
          <div className="label">{product.status === "archived" ? "This product is archived" : "Archive this product"}</div>
          <p className="mt-1 text-sm text-ink-2">{product.status === "archived" ? "Creators cannot see it. Bring it back any time." : "Hides it from creators. Nothing is deleted and its sales stay in the reports."}</p>
        </div>
        <button className={product.status === "archived" ? "btn-primary" : "btn-danger"}>{product.status === "archived" ? "Make live again" : "Archive product"}</button>
      </form>
    </div>
  );
}
