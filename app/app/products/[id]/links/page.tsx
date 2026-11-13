import Link from "next/link";
import { redirect } from "next/navigation";
import { getLinkTotals, getLinks, getMe, getMemberIds, getProduct, getProfilesByIds } from "@/lib/data";
import { filterLinks } from "@/lib/earnings";
import { AutoForm } from "@/components/app/AutoForm";
import { Flash } from "@/components/app/Flash";
import { LinkRow } from "@/components/app/LinkRow";
import { NewLinkForm } from "@/components/app/NewLinkForm";
import { PeriodSelect } from "@/components/app/PeriodSelect";
import { PLACEMENTS, PLACEMENT_KEYS, ZERO, currencyFor, isTeamRole, resolvePeriod, taggedUrl } from "@/lib/util";

type SP = { period?: string; q?: string; creator?: string; placement?: string; archived?: string; untracked?: string; show?: string; ok?: string; error?: string; new?: string };

export default async function Links({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = (await getMe())!;
  if (!isTeamRole(me.role)) redirect(`/app/products/${id}`);
  const { brand, pages } = (await getProduct(id))!;
  const cur = currencyFor(brand.marketplace);
  const period = resolvePeriod({ period: sp.period });
  const [links, totals, members] = await Promise.all([
    getLinks({ product: id }),
    getLinkTotals({ product: id, from: period.from, to: period.to }),
    getMemberIds(id),
  ]);
  const profiles = await getProfilesByIds([...links.map((l) => l.owner_id), ...members.map((m) => m.creator_id), me.id]);
  const pageOf = new Map(pages.map((p) => [p.id, p]));
  const untracked = links.filter((l) => !l.amazon_tag && !l.archived_at).length;

  let shown = filterLinks(links, profiles, { creator: sp.creator, placement: sp.placement, q: sp.q?.trim() || undefined });
  if (sp.archived !== "1") shown = shown.filter((l) => !l.archived_at);
  if (sp.untracked === "1") shown = shown.filter((l) => !l.amazon_tag);
  const limit = Math.max(50, Math.min(2000, Number(sp.show) || 50));
  const page = shown.slice(0, limit);

  const keep = new URLSearchParams();
  for (const k of ["period", "q", "creator", "placement", "archived", "untracked"] as const) if (sp[k]) keep.set(k, sp[k]!);
  const back = `/app/products/${id}/links${keep.toString() ? `?${keep}` : ""}`;
  const creators = [...new Set(links.map((l) => l.owner_id))].map((c) => profiles.get(c)).filter((p) => !!p).sort((a, b) => a!.username.localeCompare(b!.username));
  const owners = [...new Set([me.id, ...members.map((m) => m.creator_id), ...links.map((l) => l.owner_id)])]
    .map((c) => profiles.get(c)).filter((p) => !!p)
    .map((p) => ({ id: p!.id, label: p!.id === me.id ? `${p!.username} (me)` : p!.username }));

  return (
    <div className="space-y-4">
      <Flash ok={sp.ok} error={sp.error} />
      <AutoForm className="flex flex-wrap items-end gap-3">
        <PeriodSelect period={period} />
        <label className="block"><span className="label mb-1 block">Creator</span>
          <select name="creator" defaultValue={sp.creator ?? ""} className="select min-w-36 py-1.5">
            <option value="">All</option>{creators.map((p) => <option key={p!.id} value={p!.id}>{p!.username}</option>)}
          </select></label>
        <label className="block"><span className="label mb-1 block">Placement</span>
          <select name="placement" defaultValue={sp.placement ?? ""} className="select min-w-32 py-1.5">
            <option value="">All</option>{PLACEMENT_KEYS.map((k) => <option key={k} value={k}>{PLACEMENTS[k]}</option>)}
          </select></label>
        <label className="block"><span className="label mb-1 block">Search</span>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Creator, link, handle, ID" className="input w-48 py-1.5" /></label>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-2"><input type="checkbox" name="untracked" value="1" defaultChecked={sp.untracked === "1"} className="accent-[#35d07f]" />Not tracked yet ({untracked})</label>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-2"><input type="checkbox" name="archived" value="1" defaultChecked={sp.archived === "1"} className="accent-[#35d07f]" />Show archived</label>
      </AutoForm>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-3">
          <div className="label">{shown.length} of {links.length} links · numbers for {period.label.toLowerCase()}</div>
          {shown.length === 0 && <div className="card p-6 font-mono text-xs text-ink-3">{links.length === 0 ? "No links yet. Creators make their own after joining with an invite link." : "No links match."}</div>}
          {page.map((l) => (
            <LinkRow key={l.id} link={l} url={taggedUrl(pageOf.get(l.page_id)?.url ?? "", l.amazon_tag)} pageName={pageOf.get(l.page_id)?.name ?? null}
              totals={totals.get(l.id) ?? ZERO} cur={cur} owner={profiles.get(l.owner_id)} team back={back} fresh={l.id === sp.new} />
          ))}
          {shown.length > limit && (
            <Link href={`/app/products/${id}/links?${new URLSearchParams({ ...Object.fromEntries(keep), show: String(limit + 100) })}`} scroll={false} className="btn-ghost w-full">
              Show 100 more ({shown.length - limit} left)
            </Link>
          )}
        </div>
        <div className="min-w-0 space-y-4">
          <NewLinkForm key={links.length} productId={id} back={back} pages={pages.filter((p) => !p.archived_at).map((p) => ({ id: p.id, name: p.name }))}
            accounts={links.filter((l) => l.owner_id === me.id).map((l) => ({ platform: l.platform, account: l.account }))} owners={owners} defaultOwner={me.id} />
          <div className="card p-5 text-xs leading-relaxed text-ink-2">
            <div className="label mb-2">How a link gets tracked</div>
            {brand.tag_template
              ? <p>This brand has an Amazon Attribution tag template, so every new link is tagged the moment it is made. Nothing to do here.</p>
              : <p>Until the Amazon Ads API is connected, a link is tracked once it has an Amazon Attribution tag. In Amazon Ads, open Measurement and reporting, then Amazon Attribution, make an ad group named with the link&apos;s <span className="font-mono text-ink">ID</span>, copy the address Amazon gives you and paste it under &quot;Rename, tag or archive&quot;. Sales then come in through Import report.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
