"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Brand, Product } from "@/lib/data";

export function Sidebar({ brands, products, isTeam }: { brands: Brand[]; products: Product[]; isTeam: boolean }) {
  const path = usePathname();
  const item = (href: string, label: string, opts: { sub?: boolean; dim?: boolean } = {}) => {
    const active = path === href || (href !== "/app" && path.startsWith(href));
    return (
      <Link key={href} href={href}
        className={`block truncate rounded-lg px-3 py-1.5 text-sm transition ${opts.sub ? "ml-3" : ""} ${active ? "bg-panel-2 text-ink" : opts.dim ? "text-ink-3 hover:bg-panel-2 hover:text-ink" : "text-ink-2 hover:bg-panel-2 hover:text-ink"}`}>
        {label}
      </Link>
    );
  };
  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <div className="space-y-0.5">
        {item("/app", "Home")}
        {isTeam && item("/app/team", "Team")}
      </div>
      <div className="label mt-6 mb-2 px-3">{isTeam ? "Brands" : "Your products"}</div>
      {brands.length === 0 && <div className="px-3 font-mono text-xs text-ink-3">{isTeam ? "No brands yet" : "Nothing yet"}</div>}
      {brands.map((b) => (
        <div key={b.id} className="mb-2">
          <div className="flex items-center justify-between px-3 py-1">
            {isTeam
              ? <Link href={`/app/brands/${b.id}`} className={`truncate text-xs font-semibold uppercase tracking-wider hover:text-ink ${path === `/app/brands/${b.id}` ? "text-ink" : "text-ink-2"}`}>{b.name}</Link>
              : <span className="truncate text-xs font-semibold uppercase tracking-wider text-ink-2">{b.name}</span>}
            <span className="font-mono text-[10px] text-ink-3">{b.marketplace}</span>
          </div>
          <div className="space-y-0.5">
            {products.filter((p) => p.brand_id === b.id).map((p) =>
              item(`/app/products/${p.id}`, p.status === "archived" ? `${p.name} (archived)` : p.name, { sub: true, dim: p.status === "archived" }))}
          </div>
        </div>
      ))}
    </nav>
  );
}
