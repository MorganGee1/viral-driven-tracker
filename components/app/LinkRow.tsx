import type { Link as TLink, Profile } from "@/lib/data";
import { setLinkArchived, setTag, updateLink } from "@/lib/actions";
import { CopyButton } from "@/components/app/CopyButton";
import { PLACEMENTS, accountLabel, fmtDay, money, num, type Totals } from "@/lib/util";

/** One tracking link: who, where, the address to copy, its numbers and the few things that can be changed. */
export function LinkRow({ link, url, pageName, totals, cur, owner, team, back, fresh }: {
  link: TLink; url: string; pageName: string | null; totals: Totals; cur: string;
  owner?: Profile; team: boolean; back: string; fresh?: boolean;
}) {
  const archived = !!link.archived_at;
  return (
    <div className={`card min-w-0 p-4 ${fresh ? "border-accent" : ""} ${archived ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-52">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{link.name}</span>
            {link.amazon_tag ? <span className="pill-live">tracked</span> : <span className="pill border-amber/40 text-amber">not tracked yet</span>}
            {archived && <span className="pill-muted">archived</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink-3">
            {team && <span className="text-ink-2">{owner?.username ?? "Unknown"}{owner?.discord_username ? ` · @${owner.discord_username}` : ""}</span>}
            <span>{accountLabel(link.platform, link.account)}</span>
            <span>{PLACEMENTS[link.placement]}</span>
            {pageName && <span>{pageName}</span>}
            <span>made {fmtDay(link.created_at.slice(0, 10), { day: "numeric", month: "short", year: "numeric" })}</span>
            {team && <span>ID {link.short_id}</span>}
          </div>
          {link.note && <div className="mt-1.5 text-xs text-ink-2">{link.note}</div>}
        </div>
        <div className="text-right">
          <div className="big-number font-semibold">{money(totals.sales, cur)}</div>
          <div className="font-mono text-[10px] text-ink-3">{num(totals.purchases)} sales · {num(totals.clicks)} clicks</div>
        </div>
        <CopyButton text={url} />
      </div>
      <div className="mt-3 truncate rounded-lg bg-bg px-3 py-2 font-mono text-[11px] text-ink-2" title={url}>{url}</div>
      <details className="mt-2">
        <summary className="cursor-pointer select-none font-mono text-[11px] text-ink-3 hover:text-ink">{team ? "Rename, tag or archive" : "Rename or archive"}</summary>
        <div className="mt-3 space-y-3">
          <form action={updateLink} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="id" value={link.id} /><input type="hidden" name="product_id" value={link.product_id} /><input type="hidden" name="back" value={back} />
            <input name="name" required maxLength={80} defaultValue={link.name} className="input" aria-label="Link name" />
            <input name="note" maxLength={300} defaultValue={link.note ?? ""} placeholder="Note" className="input" aria-label="Note" />
            <button className="btn-ghost">Save</button>
          </form>
          {team && (
            <form action={setTag} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <input type="hidden" name="id" value={link.id} /><input type="hidden" name="product_id" value={link.product_id} /><input type="hidden" name="back" value={back} />
              <input name="tag" defaultValue={link.amazon_tag ?? ""} placeholder="Amazon Attribution tag, or paste the whole tagged address" className="input font-mono text-[11px]" aria-label="Amazon Attribution tag" />
              <button className="btn-ghost">Save tag</button>
            </form>
          )}
          <form action={setLinkArchived}>
            <input type="hidden" name="id" value={link.id} /><input type="hidden" name="product_id" value={link.product_id} /><input type="hidden" name="back" value={back} />
            <input type="hidden" name="archived" value={archived ? "0" : "1"} />
            <button className={archived ? "btn-ghost" : "btn-danger"}>{archived ? "Restore link" : "Archive link"}</button>
            {!archived && <span className="ml-3 font-mono text-[11px] text-ink-3">Archiving hides it. It is never deleted, so past sales stay in the reports.</span>}
          </form>
        </div>
      </details>
    </div>
  );
}
