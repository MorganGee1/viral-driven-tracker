import { redirect } from "next/navigation";
import { getAllProfiles, getMe } from "@/lib/data";
import { setRole } from "@/lib/actions";

export default async function Team() {
  const me = (await getMe())!;
  if (me.role !== "manager") redirect("/app");
  const people = await getAllProfiles();
  return (
    <div className="mx-auto max-w-4xl">
      <div className="label">Team · {people.length} people</div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Roles</h1>
      <p className="mt-2 text-sm text-ink-2">Everyone who signs in with Discord appears here as a creator. Managers see every brand, link and sale, and can set Attribution tags and import reports. Creators see only their own links.</p>
      <div className="mt-6 space-y-2">
        {people.map((p) => (
          <div key={p.id} className="card flex items-center gap-3 p-3">
            {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full" /> : <div className="h-9 w-9 rounded-full bg-line-2" />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{p.username}{p.id === me.id && <span className="ml-2 font-mono text-[10px] text-ink-3">you</span>}</div>
              <div className="font-mono text-[10px] text-ink-3">joined {new Date(p.created_at).toLocaleDateString("en-GB")}</div>
            </div>
            <form action={setRole} className="flex items-center gap-2">
              <input type="hidden" name="id" value={p.id} />
              <select name="role" defaultValue={p.role} className="select w-36 py-1.5" disabled={p.id === me.id}>
                <option value="creator">Creator</option><option value="manager">Manager</option>
              </select>
              <button className="btn-ghost py-1.5" disabled={p.id === me.id}>Save</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
