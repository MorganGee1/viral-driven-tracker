import { notFound } from "next/navigation";
import { getCampaign, getMe } from "@/lib/data";
import { CampaignTabs } from "@/components/app/CampaignTabs";

export default async function CampaignLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getMe())!;
  const data = await getCampaign(id);
  if (!data) notFound();
  const { campaign, brand } = data;
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-ink-3">{brand.name}</span><span className="text-ink-3">/</span>
        <span className="font-semibold">{campaign.name}</span>
        <span className={campaign.status === "active" ? "pill-live" : "pill-muted"}>{campaign.status}</span>
        <span className="pill-muted">{me.role}</span>
        <a href={campaign.product_url} target="_blank" rel="noreferrer" className="ml-auto truncate font-mono text-[11px] text-ink-3 hover:text-ink">{campaign.product_url}</a>
      </div>
      <div className="mt-4"><CampaignTabs id={id} isManager={me.role === "manager"} /></div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
