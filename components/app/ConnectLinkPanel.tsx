import type { ConnectLinkRow } from "@/lib/data";
import { createConnectLink, revokeConnectLink } from "@/lib/actions";
import { CONNECT_LINK_DAYS, connectLinkState } from "@/lib/connectlinks";
import { CopyButton } from "@/components/app/CopyButton";
import { fmtDay } from "@/lib/util";

const date = (iso: string) => fmtDay(iso.slice(0, 10), { day: "numeric", month: "short", year: "numeric" });

/**
 * The link the team sends to whoever holds a brand's Amazon Ads login. They open it, sign in with
 * Amazon and approve. No Discord and no tracker account. Sits inside the Amazon connection box.
 */
export function ConnectLinkPanel({ link, brandId, brandName, origin, back, connected = false }: {
  link: ConnectLinkRow | null; brandId: string; brandName: string; origin: string; back: string; connected?: boolean;
}) {
  const st = link ? connectLinkState(link) : null;
  const url = link ? `${origin}/connect/${link.code}` : "";
  const live = st === "ok";
  return (
    <div className="space-y-3 rounded-lg border border-line bg-panel-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">Client connect link</span>
        {st && <span className={live ? "pill-live" : "pill-muted"}>{live ? "active" : st}</span>}
        <span className="ml-auto font-mono text-xs text-ink-3">no Discord · no tracker account · works once</span>
      </div>
      <p className="text-sm leading-relaxed text-ink-2">
        Send this to whoever holds {brandName}&apos;s Amazon Ads login. They open it, sign in with Amazon and approve, and {brandName} is connected here. They never see the tracker.
      </p>
      {live && link && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 basis-56 truncate rounded-lg bg-bg px-3 py-2 font-mono text-xs text-ink-2">{url}</div>
          <CopyButton text={url} label="Copy" small />
          <form action={revokeConnectLink}>
            <input type="hidden" name="id" value={link.id} /><input type="hidden" name="back" value={back} />
            <button className="btn-ghost btn-sm">Switch off</button>
          </form>
        </div>
      )}
      {link?.last_error && (
        <p className="font-mono text-xs leading-relaxed text-rose">Last try through the link: {link.last_error}</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <form action={createConnectLink}>
          <input type="hidden" name="brand_id" value={brandId} /><input type="hidden" name="back" value={back} />
          <button className={live ? "btn-ghost btn-sm" : connected ? "btn-ghost" : "btn-primary"}>{live ? "Make a new link" : link ? "Make a new connect link" : "Make a connect link"}</button>
        </form>
        <span className="font-mono text-xs text-ink-3">
          {!link ? `A link lasts ${CONNECT_LINK_DAYS} days.`
            : live ? `Expires ${date(link.expires_at)}. A new link switches this one off.`
            : st === "used" ? `Used ${date(link.used_at!)}. Make a new one to reconnect.`
            : st === "expired" ? `Expired ${date(link.expires_at)}.`
            : "Switched off."}
        </span>
      </div>
    </div>
  );
}
