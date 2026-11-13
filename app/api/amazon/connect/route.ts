import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getBrand, getMe } from "@/lib/data";
import { amazonConfigured, authorizeUrl, regionFor } from "@/lib/amazon";
import { getOrigin } from "@/lib/origin";
import { supabaseConfigured } from "@/lib/supabase/server";
import { isTeamRole } from "@/lib/util";

/** Team clicks "Connect Amazon Ads" on a brand: send them to Login with Amazon to approve access. */
export async function GET(request: Request) {
  const origin = await getOrigin();
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?setup=1`);
  const url = new URL(request.url);
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
  res.cookies.set("amz_state", JSON.stringify({ state, brandId, back }), { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https"), maxAge: 600, path: "/api/amazon" });
  return res;
}
