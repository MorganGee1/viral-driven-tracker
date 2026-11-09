import { redirect } from "next/navigation";
import { getMe } from "@/lib/data";
import { ImportForm } from "@/components/app/ImportForm";

export default async function Import({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await getMe())!;
  if (me.role !== "manager") redirect(`/app/campaigns/${id}`);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <ImportForm campaignId={id} />
      <div className="card p-5 text-sm leading-relaxed text-ink-2">
        <div className="label mb-3">How the report maps to links</div>
        <ol className="list-decimal space-y-2 pl-5">
          <li>In Amazon Ads → Measurement &amp; Reporting → Amazon Attribution, download the campaign report as CSV (daily granularity).</li>
          <li>The platform matches each row to a link by the <strong className="text-ink">Ad group</strong> or <strong className="text-ink">Creative</strong> column. Name your ad groups with the link's 8-character id (shown under each link on the Tracking links tab), or paste the link's full tag into Save tag and the report's tag column will match.</li>
          <li>Columns read: Date, Clicks, Detail Page Views, Add to Carts, Purchases, Units Sold, Sales, Brand Referral Bonus. Anything else is ignored.</li>
          <li>Re-uploading the same days overwrites them. Safe to run weekly.</li>
        </ol>
        <p className="mt-4 font-mono text-[11px] text-ink-3">When Amazon Ads API access is approved, the daily sync replaces this upload. Nothing else changes.</p>
      </div>
    </div>
  );
}
