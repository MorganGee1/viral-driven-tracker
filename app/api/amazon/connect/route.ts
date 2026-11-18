import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getBrand, getMe } from "@/lib/data";
import { amazonConfigured, authorizeUrl, regionFor } from "@/lib/amazon";
import { lookupConnectLink } from "@/lib/connectlinks";
import { getOrigin } from "@/lib/origin";
import { supabaseConfigured } from "@/lib/supabase/server";
import { isTeamRole } from "@/lib/util";

const cookie = (origin: string) => ({ httpOnly: true, sameSite: "lax" as const, secure: origin.startsWith("https"), maxAge: 600, path: "/api/amazon" });

/**
 * Sends someone to Login with Amazon to approve access for a brand. Two ways in:
 *   ?brand=…  a signed-in team member pressed "Connect Amazon Ads" in Settings
 *   ?link=…   a client opened the connect link the team sent them. No tracker sign-in. The link is the permission.
 */
export async function GET(request: Request) {
  const origin = await getOrigin();
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?setup=1`);
  const url = new URL(request.url);
  const link = url.searchParams.get("link");
  if (link !== null) return viaClientLink(origin, link);

  const brandId = url.searchParams.get("brand") ?? "";
  const rawBack = url.searchParams.get("back") ?? "";
  const back = rawBack.startsWith("/app") ? rawBack : "/app";
  const to = (key: "ok" | "error", msg: string) => NextResponse.redirect(`${origin}${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(msg)}`);
  const me = await getMe();
  if (!me || !isTeamRole(me.role)) return NextResponse.redirect(`${origin}/app`);
  if (!amazonConfigured()) return to("error", "The Amazon Ads API is not set up on this site yet. It needs Amazon's approval first, then the keys from the README.");
  const brand = await getBrand(brandId);
  if (!brand) return to("error", "Brand not found.");
  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(regionFor(brand.marketplace), `${origin}/api/amazon/callback`, state));
  res.cookies.set("amz_state", JSON.stringify({ state, brandId, back }), cookie(origin));
  return res;
}

async function viaClientLink(origin: string, code: string) {
  // Anything wrong with the link is explained on its own page.
  const page = `${origin}/connect/${encodeURIComponent(code)}`;
  if (!amazonConfigured()) return NextResponse.redirect(`${page}?error=setup`);
  let found;
  try { found = await lookupConnectLink(code); } catch { return NextResponse.redirect(`${page}?error=failed`); }
  if (found.state !== "ok") return NextResponse.redirect(page);
  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(regionFor(found.brand.marketplace), `${origin}/api/amazon/callback`, state));
  res.cookies.set("amz_state", JSON.stringify({ state, link: code }), cookie(origin));
  return res;
}
