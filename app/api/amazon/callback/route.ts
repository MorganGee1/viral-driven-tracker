import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBrand, getMe } from "@/lib/data";
import { type AmazonApp, amazonConfigured, appConfigured, asApp, encrypt, exchangeCode, findAdvertisers, finishConnection, regionFor } from "@/lib/amazon";
import { lookupConnectLink, noteConnectLinkError, spendConnectLink } from "@/lib/connectlinks";
import { getOrigin } from "@/lib/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/server";
import { isTeamRole } from "@/lib/util";

export const maxDuration = 60;

type Saved = { state?: string; brandId?: string; back?: string; link?: string; app?: string };

/**
 * Which Login with Amazon app this sign-in went through. The connect route wrote it into the state cookie.
 * A sign-in that started before that was added has none, so it falls back to the brand's own setting.
 */
const appOf = (saved: Saved, brand: { amazon_app: string }): AmazonApp =>
  saved.app === "direct" || saved.app === "partner" ? saved.app : asApp(brand.amazon_app);

/** Amazon sends the person back here after they approve. Store the (encrypted) token and find the brand's Attribution advertiser. */
export async function GET(request: Request) {
  const origin = await getOrigin();
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?setup=1`);
  const url = new URL(request.url);
  const jar = await cookies();
  let saved: Saved = {};
  try { saved = JSON.parse(jar.get("amz_state")?.value ?? "{}"); } catch { /* treated as a mismatch below */ }
  // Started from a client connect link: nobody is signed in to the tracker, the link is the permission.
  if (typeof saved.link === "string") return fromClientLink(origin, url, saved.link, saved);

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
  if (!code || !saved.state || !saved.brandId || url.searchParams.get("state") !== saved.state) return to("error", "That Amazon sign-in could not be verified. Start again from the brand page.");
  const brand = await getBrand(saved.brandId);
  if (!brand) return to("error", "Brand not found.");

  const app = appOf(saved, brand);
  if (!appConfigured(app)) return to("error", "The keys for that Amazon app are not on this site. Start again from the brand page.");

  try {
    const region = regionFor(brand.marketplace);
    const tokens = await exchangeCode(app, region, code, `${origin}/api/amazon/callback`);
    if (!tokens.refresh_token) return to("error", "Amazon did not return a long-lived token. Try connecting again.");
    const candidates = await findAdvertisers(app, region, tokens.access_token!, brand.marketplace);
    if (!candidates.length) return to("error", `That Amazon login has no Amazon Attribution advertiser for ${brand.marketplace}. Sign in with the account that owns ${brand.name}'s Amazon Ads.`);
    const db = createAdminClient();
    const { error } = await db.from("amazon_connections").upsert({
      brand_id: brand.id, app, region, refresh_token_enc: encrypt(tokens.refresh_token), candidates, connected_by: me.id, connected_at: new Date().toISOString(),
      profile_id: null, advertiser_id: null, advertiser_name: null, last_sync_at: null, last_sync_status: null, last_sync_rows: null,
    }, { onConflict: "brand_id" });
    if (error) throw new Error(error.message);
    if (candidates.length === 1) {
      await finishConnection(app, brand.id, candidates[0], region, tokens.access_token!);
      return to("ok", `Connected to ${candidates[0].advertiserName}. New links are tagged automatically. Press Sync now to pull the last 31 days.`);
    }
    return to("ok", "Connected. Now pick which Amazon Attribution advertiser this brand is.");
  } catch (e) {
    return to("error", e instanceof Error ? e.message : "Connecting to Amazon failed.");
  }
}

/**
 * The client came through a connect link. Everything is checked again here, because this is the step
 * that writes: the link must still be live, and the brand comes from the link, never from the browser.
 * The client is sent back to the link's own page, which only ever shows a fixed message. The real
 * reason for a failure is kept on the link for the team to read on the brand page.
 */
async function fromClientLink(origin: string, url: URL, linkCode: string, saved: Saved) {
  const state = saved.state;
  const page = `${origin}/connect/${encodeURIComponent(linkCode)}`;
  const to = (query = "") => {
    const res = NextResponse.redirect(`${page}${query}`);
    res.cookies.delete({ name: "amz_state", path: "/api/amazon" });
    return res;
  };
  if (!amazonConfigured()) return to("?error=setup");
  let found;
  try { found = await lookupConnectLink(linkCode); } catch { return to("?error=failed"); }
  if (found.state !== "ok") return to();
  const { link, brand } = found;
  const app = appOf(saved, brand);
  if (!appConfigured(app)) return to("?error=setup");
  if (url.searchParams.get("error")) return to("?error=denied");
  const code = url.searchParams.get("code");
  if (!code || !state || url.searchParams.get("state") !== state) return to("?error=state");

  try {
    const region = regionFor(brand.marketplace);
    const tokens = await exchangeCode(app, region, code, `${origin}/api/amazon/callback`);
    if (!tokens.refresh_token) throw new Error("Amazon did not return a long-lived token.");
    const candidates = await findAdvertisers(app, region, tokens.access_token!, brand.marketplace);
    if (!candidates.length) {
      await noteConnectLinkError(link.id, `The Amazon login the client used has no Amazon Attribution advertiser for ${brand.marketplace}.`);
      return to("?error=no_advertiser");
    }
    const { error } = await createAdminClient().from("amazon_connections").upsert({
      brand_id: brand.id, app, region, refresh_token_enc: encrypt(tokens.refresh_token), candidates, connected_by: null, connected_at: new Date().toISOString(),
      profile_id: null, advertiser_id: null, advertiser_name: null, last_sync_at: null, last_sync_status: null, last_sync_rows: null,
    }, { onConflict: "brand_id" });
    if (error) throw new Error(error.message);
    // The client's part is done the moment the access is stored, so the link is spent here.
    await spendConnectLink(link.id);
    if (candidates.length === 1) {
      // If this last step trips, the team finishes it from the brand page (it shows the advertiser to pick). The client is still done.
      try { await finishConnection(app, brand.id, candidates[0], region, tokens.access_token!); }
      catch (e) { await noteConnectLinkError(link.id, `Access is stored, but setting up tags did not finish: ${e instanceof Error ? e.message : "unknown error"}`); }
    }
    return to();
  } catch (e) {
    await noteConnectLinkError(link.id, e instanceof Error ? e.message : "Connecting to Amazon failed.").catch(() => {});
    return to("?error=failed");
  }
}
