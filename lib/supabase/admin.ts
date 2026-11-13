import { createClient } from "@supabase/supabase-js";

/**
 * Server-only database client that skips the access rules. Used for two things only: storing a brand's
 * Amazon connection, and the nightly sync that writes sales numbers with nobody signed in.
 * Never import this into anything that runs in the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
