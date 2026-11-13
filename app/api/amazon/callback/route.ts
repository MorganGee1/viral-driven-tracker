import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBrand, getMe } from "@/lib/data";
import { amazonConfigured, encrypt, exchangeCode, findAdvertisers, finishConnection, regionFor } from "@/lib/amazon";
import { getOrigin } from "@/lib/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/server";
import { isTeamRole } from "@/lib/util";

export const maxDuration = 60;

/** Amazon sends the person back here after they approve. Store the (encrypted) token and find the brand's Attribution advertiser. */
export async function GET(request: Request) {
  const origin = await getOrigin();
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?setup=1`);
  const url = new URL(request.url);
  const jar = await cookies();
  let saved: { state?: string; brandId?: string; back?: string } = {};
  try { saved = JSON.parse(jar.get("amz_state")?.value ?? "{}"); } catch { /* treated as a mismatch below */ }
  const back = saved.back?.startsWith("/app") ? saved.back : "/app";
  const to = (key: "ok" | "error", msg: string) => {
    const res = NextResponse.redirect(`${origin}${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(msg)}`);
    res.cookies.delete({ name: "amz_state", path: "/api/amazon" });
    return res;
  };
  const me = await getMe();
  if (!me || !isTeamRole(me.role)) return NextResponse.redirect(`${origin}/app`);
  if (!amazonConfigured()) return to("error", "The Amazon Ads API is not set up on this site yet.");
  if (url.searchParams.get("error")) return to("error", "Amazon access was not approved, so nothing was connected.");
  const code = url.searchParams.get("code");
  if (!code || !saved.state || !saved.brandId || url.searchParams.get("state") !== saved.state) return to("error", "That Amazon sign-in could not be verified. Start again from Settings.");
  const brand = await getBrand(saved.brandId);
  if (!brand) return to("error", "Brand not found.");

  try {
    const region = regionFor(brand.marketplace);
    const tokens = await exchangeCode(region, code, `${origin}/api/amazon/callback`);
    if (!tokens.refresh_token) return to("error", "Amazon did not return a long-lived token. Try connecting again.");
    const candidates = await findAdvertisers(region, tokens.access_token!, brand.marketplace);
    if (!candidates.length) return to("error", `That Amazon login has no Amazon Attribution advertiser for ${brand.marketplace}. Sign in with the account that owns ${brand.name}'s Amazon Ads.`);
    const db = createAdminClient();
    const { error } = await db.from("amazon_connections").upsert({
      brand_id: brand.id, region, refresh_token_enc: encrypt(tokens.refresh_token), candidates, connected_by: me.id, connected_at: new Date().toISOString(),
      profile_id: null, advertiser_id: null, advertiser_name: null, last_sync_at: null, last_sync_status: null, last_sync_rows: null,
    }, { onConflict: "brand_id" });
    if (error) throw new Error(error.message);
    if (candidates.length === 1) {
      await finishConnection(brand.id, candidates[0], region, tokens.access_token!);
      return to("ok", `Connected to ${candidates[0].advertiserName}. New links are tagged automatically. Press Sync now to pull the last 31 days.`);
    }
    return to("ok", "Connected. Now pick which Amazon Attribution advertiser this brand is.");
  } catch (e) {
    return to("error", e instanceof Error ? e.message : "Connecting to Amazon failed.");
  }
}
