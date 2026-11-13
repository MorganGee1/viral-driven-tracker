"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["", "Overview"], ["/creators", "Creators"], ["/earnings", "Earnings"],
  ["/links", "Tracking links"], ["/import", "Import report"], ["/settings", "Settings"],
] as const;

export function ProductTabs({ id }: { id: string }) {
  const path = usePathname();
  return (
    <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0">
      {TABS.map(([suffix, label]) => {
        const href = `/app/products/${id}${suffix}`;
        const active = suffix === "" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm ${active ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
