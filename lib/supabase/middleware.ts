import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isApp = request.nextUrl.pathname.startsWith("/app");

  // Public site must always load, even before Supabase is configured.
  if (!url || !key) {
    if (isApp) {
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      to.searchParams.set("setup", "1");
      return NextResponse.redirect(to);
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (isApp && !user) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(to);
  }
  if (request.nextUrl.pathname === "/login" && user) {
    const to = request.nextUrl.clone();
    to.pathname = "/app";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}
