import { NextResponse } from "next/server";
import { amazonConfigured, syncBrand } from "@/lib/amazon";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncDeepLinks } from "@/lib/deeplinks";
import { linktwinConfigured } from "@/lib/linktwin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Nightly: pull the last 31 days from Amazon for every connected brand, then make any deep links that are
 * still missing. Vercel calls this with the CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ skipped: "SUPABASE_SERVICE_ROLE_KEY is not set" });
  const db = createAdminClient();
  const deep = linktwinConfigured() ? await syncDeepLinks(db, {}, 60) : null;
  if (!amazonConfigured()) return NextResponse.json({ skipped: "Amazon Ads API keys are not set", deep });
  const { data, error } = await db.from("amazon_connections").select("brand_id").not("advertiser_id", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results = [];
  for (const c of data ?? []) results.push({ brand: c.brand_id, ...(await syncBrand(c.brand_id)) });
  return NextResponse.json({ brands: results.length, results, deep });
}
