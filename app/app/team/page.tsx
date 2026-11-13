import { redirect } from "next/navigation";
import { getAllMemberships, getAllProfiles, getInvites, getMe, getNav, type Profile } from "@/lib/data";
import { setRole } from "@/lib/actions";
import { getOrigin } from "@/lib/origin";
import { Flash } from "@/components/app/Flash";
import { InvitePanel } from "@/components/app/InvitePanel";
import { ROLE_LABEL, fmtDay, isTeamRole } from "@/lib/util";

export default async function Team({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; q?: string }> }) {
  const sp = await searchParams;
  const me = (await getMe())!;
  if (!isTeamRole(me.role)) redirect("/app");
  const owner = me.role === "owner";
  const [people, memberships, { products }, invites, origin] = await Promise.all([
    getAllProfiles(), getAllMemberships(), getNav(), owner ? getInvites({ role: "team" }) : Promise.resolve([]), getOrigin(),
  ]);
  const staff = people.filter((p) => p.role !== "creator").sort((a, b) => (a.role === b.role ? a.username.localeCompare(b.username) : a.role === "owner" ? -1 : 1));
  const q = sp.q?.trim().toLowerCase();
  const creators = people.filter((p) => p.role === "creator").filter((p) => !q || `${p.username} ${p.discord_username ?? ""}`.toLowerCase().includes(q));
  const creatorCount = people.filter((p) => p.role === "creator").length;
  const productName = new Map(products.map((p) => [p.id, p.name]));
  const joined = (id: string) => memberships.filter((m) => m.creator_id === id).map((m) => productName.get(m.product_id)).filter(Boolean);

  const person = (p: Profile) => (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full" /> : <div className="h-9 w-9 shrink-0 rounded-full bg-line-2" />}
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{p.username}{p.id === me.id && <span className="ml-2 font-mono text-[10px] text-ink-3">you</span>}</div>
        <div className="truncate font-mono text-[10px] text-ink-3">
          {p.discord_username ? `@${p.discord_username} · ` : ""}joined {fmtDay(p.created_at.slice(0, 10), { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>
    </div>
  );
  const roleForm = (p: Profile) =>
    owner && p.id !== me.id ? (
      <form action={setRole} className="flex shrink-0 items-center gap-2">
        <input type="hidden" name="id" value={p.id} />
        <select name="role" defaultValue={p.role} className="select w-28 py-1.5" aria-label={`Role for ${p.username}`}>
          <option value="creator">Creator</option><option value="team">Team</option><option value="owner">Owner</option>
        </select>
        <button className="btn-ghost py-1.5">Save</button>
      </form>
    ) : (
      <span className={p.role === "creator" ? "pill-muted" : "pill-live"}>{ROLE_LABEL[p.role]}</span>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Flash ok={sp.ok} error={sp.error} />
      <div>
        <div className="label">Team · {staff.length} {staff.length === 1 ? "person" : "people"}</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Who sees everything</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Team members see every brand, creator, link and sale, and can add brands, products, Amazon pages and invite links.
          Creators only ever see their own links and numbers. {owner ? "As the owner, you add and remove team members." : "Only the owner can add or remove team members."}
        </p>
        <div className="mt-5 space-y-2">
          {staff.map((p) => <div key={p.id} className="card flex flex-wrap items-center gap-3 p-3">{person(p)}{roleForm(p)}</div>)}
        </div>
      </div>

      {owner && (
        <div>
          <div className="label">Add team members</div>
          <p className="mt-2 mb-4 text-sm leading-relaxed text-ink-2">
            Send a team invite link. Whoever opens it signs in with Discord and joins the team straight away, so switch the link off once everyone is in.
            Someone already signed in as a creator? Change their role in the list below instead.
          </p>
          <InvitePanel invites={invites} origin={origin} back="/app/team" role="team" />
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="label">Creators · {creatorCount}</div>
            <p className="mt-2 text-sm text-ink-2">Everyone who has signed in with Discord. They join products through invite links on each product&apos;s Creators tab.</p>
          </div>
          <form method="get" className="ml-auto"><input name="q" defaultValue={sp.q ?? ""} placeholder="Search creators" className="input w-48 py-1.5" aria-label="Search creators" /></form>
        </div>
        <div className="mt-4 space-y-2">
          {creators.length === 0 && <div className="card p-5 font-mono text-xs text-ink-3">{q ? "No creator matches that search." : "No creators have signed in yet."}</div>}
          {creators.map((p) => {
            const list = joined(p.id);
            return (
              <div key={p.id} className="card flex flex-wrap items-center gap-3 p-3">
                {person(p)}
                <span className="font-mono text-[11px] text-ink-3">{list.length ? list.join(", ") : "not in a product yet"}</span>
                {roleForm(p)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
