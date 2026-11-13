import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Signed-in person lands here from an invite link: join, then go to the right place. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const origin = new URL(request.url).origin;
  if (!/^[a-z0-9]{6,40}$/i.test(code)) return NextResponse.redirect(`${origin}/join/${encodeURIComponent(code)}`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/join/${code}`);
  const { data, error } = await supabase.rpc("redeem_invite", { p_code: code });
  const res = data as { ok: boolean; reason?: string; role?: string; product_id?: string; already?: boolean } | null;
  if (error || !res?.ok) return NextResponse.redirect(`${origin}/join/${code}?error=${encodeURIComponent(res?.reason ?? "failed")}`);
  if (res.role === "team") {
    return NextResponse.redirect(`${origin}/app?ok=${encodeURIComponent(res.already ? "You are already on the team." : "You are on the team. You can see every brand.")}`);
  }
  return NextResponse.redirect(`${origin}/app/products/${res.product_id}${res.already ? "" : `?ok=${encodeURIComponent("You are in. Make your first link below.")}`}`);
}
