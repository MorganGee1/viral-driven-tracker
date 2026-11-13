import { NextResponse } from "next/server";
import { getLinkTotals, getLinks, getMe, getProduct, getProfilesByIds } from "@/lib/data";
import { filterLinks, readFilters } from "@/lib/earnings";
import { PLACEMENTS, PLATFORMS, ZERO, isTeamRole, resolvePeriod, sumTotals, toCsv } from "@/lib/util";

export const dynamic = "force-dynamic";

/** The Earnings table as a spreadsheet file: one row per link, with the same filters as the page. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me || !isTeamRole(me.role)) return new NextResponse("Team only", { status: 403 });
  const data = await getProduct(id);
  if (!data) return new NextResponse("Not found", { status: 404 });
  const sp = Object.fromEntries(new URL(request.url).searchParams.entries());
  const period = resolvePeriod(sp);
  const [links, totals] = await Promise.all([getLinks({ product: id }), getLinkTotals({ product: id, from: period.from, to: period.to })]);
  const profiles = await getProfilesByIds(links.map((l) => l.owner_id));
  const shown = filterLinks(links, profiles, readFilters(sp));
  const all = sumTotals(shown.map((l) => totals.get(l.id) ?? ZERO));
  const pageOf = new Map(data.pages.map((p) => [p.id, p]));

  const rows: (string | number)[][] = [[
    "Brand", "Product", "Creator", "Discord username", "Discord ID", "Link name", "Link ID", "Platform", "Account", "Placement",
    "Amazon page", "Amazon page address", "Link made", "Archived", "Clicks", "Detail page views", "Add to carts", "Purchases", "Units",
    "Total sales", "Share of sales %", "From", "To",
  ]];
  for (const l of [...shown].sort((a, b) => (totals.get(b.id)?.sales ?? 0) - (totals.get(a.id)?.sales ?? 0))) {
    const t = totals.get(l.id) ?? ZERO;
    const p = profiles.get(l.owner_id);
    rows.push([
      data.brand.name, data.product.name, p?.username ?? "", p?.discord_username ?? "", p?.discord_id ?? "", l.name, l.short_id,
      PLATFORMS[l.platform], l.account, PLACEMENTS[l.placement], pageOf.get(l.page_id)?.name ?? "", pageOf.get(l.page_id)?.url ?? "",
      l.created_at.slice(0, 10), l.archived_at ? "yes" : "no", t.clicks, t.dpv, t.atc, t.purchases, t.units,
      t.sales.toFixed(2), all.sales > 0 ? ((t.sales / all.sales) * 100).toFixed(1) : "0.0", period.from ?? "all time", period.to ?? "all time",
    ]);
  }
  const slug = data.product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
  const range = period.from ? `${period.from}_to_${period.to}` : "all-time";
  return new NextResponse("﻿" + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}_sales_${range}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
