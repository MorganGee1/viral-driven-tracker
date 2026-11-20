import { NextResponse, type NextRequest } from "next/server";
import { flashAllowed } from "@/lib/flash-edge";
import { updateSession } from "@/lib/supabase/middleware";
import { SITE } from "@/lib/site";

/**
 * The live site has one real address (NEXT_PUBLIC_SITE_URL). Discord sign-in sends people back to
 * that address only, and invite links copy whatever address the team member is on. So anyone who
 * opens the live site on any other address it answers to (the vercel.app address, an old
 * subdomain) is moved to the same page on the real address.
 */
function moveToRealAddress(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") return null;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").toLowerCase();
  let real: URL;
  try { real = new URL(SITE.url); } catch { return null; }
  if (!host || host === real.host.toLowerCase()) return null;
  return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, real.origin), 307);
}

export async function middleware(request: NextRequest) {
  const moved = moveToRealAddress(request);
  if (moved) return moved;
  const path = request.nextUrl.pathname;
  // The bars at the top of an app page take their text from the address. Only show text the app itself
  // signed: anything else (a link someone wrote by hand) loses its message before the page is built.
  if (request.method === "GET" && path.startsWith("/app") && !(await flashAllowed(request.nextUrl.searchParams))) {
    const clean = request.nextUrl.clone();
    for (const k of ["ok", "error", "sig"]) clean.searchParams.delete(k);
    return NextResponse.redirect(clean, 307);
  }
  const needsSession = path.startsWith("/app") || path === "/login" || path.startsWith("/join");
  return needsSession ? updateSession(request) : NextResponse.next();
}

export const config = {
  // Every page. Not the API routes (the daily job and Amazon call those directly) or static files.
  matcher: ["/((?!api/|_next/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)"],
};
