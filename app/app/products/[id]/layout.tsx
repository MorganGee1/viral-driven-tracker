import Link from "next/link";
import { notFound } from "next/navigation";
import { getMe, getProduct } from "@/lib/data";
import { ProductTabs } from "@/components/app/ProductTabs";
import { isTeamRole } from "@/lib/util";

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getMe())!;
  const data = await getProduct(id);
  if (!data) notFound();
  const { product, brand } = data;
  const team = isTeamRole(me.role);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {team ? <Link href={`/app/brands/${brand.id}`} className="text-ink-3 hover:text-ink">{brand.name}</Link> : <span className="text-ink-3">{brand.name}</span>}
        <span className="text-ink-3">/</span>
        <span className="text-lg font-semibold">{product.name}</span>
        {product.status === "archived" && <span className="pill-muted">archived</span>}
      </div>
      {team && <div className="mt-4"><ProductTabs id={id} /></div>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
