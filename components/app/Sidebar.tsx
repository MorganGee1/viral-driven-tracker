"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Brand, Campaign } from "@/lib/data";

export function Sidebar({ brands, campaigns, isManager }: { brands: Brand[]; campaigns: Campaign[]; isManager: boolean }) {
  const path = usePathname();
  const item = (href: string, label: string, sub = false) => {
    const active = path === href || (href !== "/app" && path.startsWith(href));
    return (
      <Link key={href} href={href}
        className={`block truncate rounded-lg px-3 py-1.5 text-sm transition ${sub ? "ml-3" : ""} ${active ? "bg-panel-2 text-ink" : "text-ink-2 hover:bg-panel-2 hover:text-ink"}`}>
        {label}
      </Link>
    );
  };
  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <div className="space-y-0.5">
        {item("/app", "Home")}
        {isManager && item("/app/team", "Team")}
      </div>
      <div className="label mt-6 mb-2 px-3">Brands</div>
      {brands.length === 0 && <div className="px-3 font-mono text-xs text-ink-3">No brands yet</div>}
      {brands.map((b) => (
        <div key={b.id} className="mb-2">
          <div className="flex items-center justify-between px-3 py-1">
            <Link href={`/app/brands/${b.id}`} className="truncate text-xs font-semibold uppercase tracking-wider text-ink-2 hover:text-ink">{b.name}</Link>
            <span className="font-mono text-[10px] text-ink-3">{b.marketplace}</span>
          </div>
          <div className="space-y-0.5">
            {campaigns.filter((c) => c.brand_id === b.id).map((c) => item(`/app/campaigns/${c.id}`, c.name, true))}
          </div>
        </div>
      ))}
    </nav>
  );
}
