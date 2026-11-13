import type { Invite } from "@/lib/data";
import { createInvite, setInviteActive } from "@/lib/actions";
import { CopyButton } from "@/components/app/CopyButton";
import { fmtDay } from "@/lib/util";

/** Invite links for a product (creators) or for the team. Copy one, make a new one, switch one off. */
export function InvitePanel({ invites, origin, back, role, productId, canManage = true }: {
  invites: Invite[]; origin: string; back: string; role: "creator" | "team"; productId?: string; canManage?: boolean;
}) {
  const now = Date.now();
  const state = (i: Invite) =>
    !i.active ? "off" : i.expires_at && Date.parse(i.expires_at) <= now ? "expired" : i.max_uses !== null && i.uses >= i.max_uses ? "full" : "active";
  return (
    <div className="space-y-3">
      {invites.length === 0 && <div className="font-mono text-xs text-ink-3">No invite links yet.</div>}
      {invites.map((i) => {
        const url = `${origin}/join/${i.code}`;
        const st = state(i);
        return (
          <div key={i.id} className={`rounded-xl border border-line bg-panel-2 p-4 ${st === "active" ? "" : "opacity-60"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{i.name}</span>
              <span className={st === "active" ? "pill-live" : "pill-muted"}>{st}</span>
              <span className="pill-muted">{role === "team" ? "Team" : "Creator"}</span>
              <span className="ml-auto font-mono text-[11px] text-ink-3">
                used {i.uses}{i.max_uses !== null ? ` of ${i.max_uses}` : " · no limit"} · {i.expires_at ? `expires ${fmtDay(i.expires_at.slice(0, 10), { day: "numeric", month: "short", year: "numeric" })}` : "never expires"} · Discord required
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1 basis-56 truncate rounded-lg bg-bg px-3 py-2 font-mono text-[11px] text-ink-2">{url}</div>
              {st === "active" && <CopyButton text={url} label="Copy" small />}
              {canManage && (
                <form action={setInviteActive}>
                  <input type="hidden" name="id" value={i.id} /><input type="hidden" name="back" value={back} />
                  <input type="hidden" name="active" value={i.active ? "0" : "1"} />
                  <button className="btn-ghost px-3 py-1.5 text-xs">{i.active ? "Switch off" : "Switch on"}</button>
                </form>
              )}
            </div>
          </div>
        );
      })}
      {canManage && (
        <form action={createInvite} className="grid grid-cols-1 gap-2 rounded-xl border border-dashed border-line-2 p-4 sm:grid-cols-[1fr_150px_130px_auto]">
          <input type="hidden" name="role" value={role} /><input type="hidden" name="back" value={back} />
          {productId && <input type="hidden" name="product_id" value={productId} />}
          <input name="name" maxLength={80} placeholder={role === "team" ? "Name, e.g. Staff invite" : "Name, e.g. Discord announcement"} className="input" aria-label="Invite link name" />
          <select name="expires_days" className="select" defaultValue="" aria-label="Expiry">
            <option value="">Never expires</option>
            <option value="1">Expires in 1 day</option>
            <option value="7">Expires in 7 days</option>
            <option value="30">Expires in 30 days</option>
          </select>
          <input name="max_uses" type="number" min={1} placeholder="Max uses" className="input" aria-label="Maximum uses (optional)" />
          <button className="btn-primary">New invite link</button>
        </form>
      )}
    </div>
  );
}
