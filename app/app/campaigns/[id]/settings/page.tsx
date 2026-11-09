import { redirect } from "next/navigation";
import { getCampaign, getMe } from "@/lib/data";
import { updateCampaign, deleteCampaign } from "@/lib/actions";

export default async function Settings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getMe())!;
  if (me.role !== "manager") redirect(`/app/campaigns/${id}`);
  const { campaign } = (await getCampaign(id))!;
  return (
    <div className="max-w-xl space-y-4">
      <form action={updateCampaign} className="card space-y-3 p-6">
        <div className="label">Campaign settings</div>
        <input type="hidden" name="id" value={id} />
        <div><label className="label mb-1.5 block">Name</label><input name="name" defaultValue={campaign.name} className="input" required /></div>
        <div><label className="label mb-1.5 block">Amazon product URL</label><input name="product_url" defaultValue={campaign.product_url} className="input font-mono text-xs" required /></div>
        <div><label className="label mb-1.5 block">Status</label>
          <select name="status" defaultValue={campaign.status} className="select"><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select>
        </div>
        <button className="btn-primary">Save</button>
      </form>
      <form action={deleteCampaign} className="card flex items-center justify-between p-6">
        <input type="hidden" name="id" value={id} />
        <div><div className="text-sm font-medium">Delete campaign</div><div className="font-mono text-[11px] text-ink-3">Removes all its links and stats. No undo.</div></div>
        <button className="btn-danger">Delete</button>
      </form>
    </div>
  );
}
