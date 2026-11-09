import { getCampaign, getCampaignLinks, getMe, getProfilesByIds, getStats, monthRanges, sum, money, currencyFor, PLACEMENTS, taggedUrl, getAllProfiles } from "@/lib/data";
import { createLink, deleteLink, setTag } from "@/lib/actions";
import { CopyButton } from "@/components/app/CopyButton";

export default async function Links({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getMe())!;
  const isManager = me.role === "manager";
  const { campaign, brand } = (await getCampaign(id))!;
  const cur = currencyFor(brand.marketplace);
  const r = monthRanges();
  const links = await getCampaignLinks(id);
  const stats = await getStats(links.map((l) => l.id), r.from, r.to);
  const owners = await getProfilesByIds([...new Set(links.map((l) => l.owner_id))]);
  const everyone = isManager ? await getAllProfiles() : [];
  const salesFor = (lid: string) => sum(stats.filter((s) => s.link_id === lid));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <div className="label">{isManager ? `All links · ${links.length}` : `Your links · ${links.length}`} · sales this month</div>
        {links.length === 0 && <div className="card p-6 font-mono text-xs text-ink-3">No links yet. Create one on the right.</div>}
        {links.map((l) => {
          const url = taggedUrl(campaign.product_url, l.amazon_tag);
          const t = salesFor(l.id);
          const owner = owners.get(l.owner_id);
          return (
            <div key={l.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {PLACEMENTS[l.placement]}
                    {isManager && <span className="pill-muted">{owner?.username ?? "unknown"}</span>}
                    {!l.amazon_tag && <span className="pill border-amber/40 text-amber">no tag yet</span>}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-ink-3">{l.note ?? `id ${l.id.slice(0, 8)}`} · {new Date(l.created_at).toLocaleDateString("en-GB")}</div>
                </div>
                <div className="text-right">
                  <div className="big-number font-semibold">{money(t.sales, cur)}</div>
                  <div className="font-mono text-[10px] text-ink-3">{t.purchases} purchases · {t.clicks} clicks</div>
                </div>
                <CopyButton text={url} />
                <form action={deleteLink}>
                  <input type="hidden" name="id" value={l.id} /><input type="hidden" name="campaign_id" value={id} />
                  <button className="btn-danger px-3" title="Delete link">✕</button>
                </form>
              </div>
              <div className="mt-3 truncate rounded-lg bg-bg px-3 py-2 font-mono text-[11px] text-ink-2">{url}</div>
              {isManager && (
                <form action={setTag} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={l.id} /><input type="hidden" name="campaign_id" value={id} />
                  <input name="tag" defaultValue={l.amazon_tag ?? ""} placeholder="Amazon Attribution tag, e.g. maas=maas_adg_api_123..." className="input font-mono text-[11px]" />
                  <button className="btn-ghost shrink-0">Save tag</button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <form action={createLink} className="card space-y-3 p-5">
          <div className="label">New link</div>
          <input type="hidden" name="campaign_id" value={id} />
          <div>
            <label className="label mb-1.5 block">Where will it go?</label>
            <select name="placement" className="select" defaultValue="bio">
              {Object.entries(PLACEMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label mb-1.5 block">Note (optional)</label>
            <input name="note" placeholder="e.g. TikTok bio, @handle" className="input" />
          </div>
          {isManager && (
            <div>
              <label className="label mb-1.5 block">For creator</label>
              <select name="owner_id" className="select" defaultValue={me.id}>
                {everyone.map((p) => <option key={p.id} value={p.id}>{p.username}{p.role === "manager" ? " (manager)" : ""}</option>)}
              </select>
            </div>
          )}
          <button className="btn-primary w-full">Create link</button>
          <p className="font-mono text-[11px] leading-relaxed text-ink-3">Post the real Amazon link the Copy button gives you. Make one link per place you put it, so each one is measured on its own.</p>
        </form>
        {isManager && (
          <div className="card p-5 font-mono text-[11px] leading-relaxed text-ink-3">
            <div className="label mb-2">Manager note</div>
            Each link needs an Amazon Attribution tag before it measures anything. Create an ad group per link in Amazon Ads → Measurement → Attribution, copy the part of the generated URL after the <span className="text-ink">?</span>, paste it in Save tag. Sales come in via Import report or the API sync.
          </div>
        )}
      </div>
    </div>
  );
}
