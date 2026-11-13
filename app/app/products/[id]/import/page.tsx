import { redirect } from "next/navigation";
import { getDataThrough, getMe, getProduct } from "@/lib/data";
import { ImportForm } from "@/components/app/ImportForm";
import { fmtDay, isTeamRole } from "@/lib/util";

export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getMe())!;
  if (!isTeamRole(me.role)) redirect(`/app/products/${id}`);
  const { product } = (await getProduct(id))!;
  const through = await getDataThrough({ product: id });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <ImportForm productId={id} />
        <div className="font-mono text-[11px] text-ink-3">
          {through ? `${product.name} has numbers up to ${fmtDay(through, { day: "numeric", month: "short", year: "numeric" })}.` : `${product.name} has no numbers yet.`}
        </div>
      </div>
      <div className="card space-y-3 p-6 text-sm leading-relaxed text-ink-2">
        <div className="label">How to do it</div>
        <p>This is how sales get in until the Amazon Ads API is connected. After that it happens on its own every night and this page is only a backup.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>In Amazon Ads, open <strong className="text-ink">Measurement and reporting</strong>, then <strong className="text-ink">Amazon Attribution</strong>.</li>
          <li>Download the report <strong className="text-ink">by day</strong>, split by ad group (or creative), for the <strong className="text-ink">last 31 days</strong>.</li>
          <li>Upload the CSV here.</li>
        </ol>
        <p>Rows are matched to links by the link ID in the campaign, ad group or creative name, or by the link&apos;s tag. Always pull the last 31 days: Amazon restates recent days, and uploading the same days again replaces the old numbers instead of doubling them.</p>
        <p>Where the report has both, the &quot;Total&quot; columns are used, so sales include brand halo.</p>
      </div>
    </div>
  );
}
