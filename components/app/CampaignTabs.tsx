"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function CampaignTabs({ id, isManager }: { id: string; isManager: boolean }) {
  const path = usePathname();
  const tabs = [
    ["", "Overview"], ["/links", "Tracking links"],
    ...(isManager ? [["/import", "Import report"], ["/settings", "Settings"]] : []),
  ];
  return (
    <div className="flex gap-1 border-b border-line">
      {tabs.map(([s, l]) => {
        const href = `/app/campaigns/${id}${s}`;
        const active = s === "" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`-mb-px border-b-2 px-3 py-2.5 text-sm ${active ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}>{l}</Link>
        );
      })}
    </div>
  );
}
