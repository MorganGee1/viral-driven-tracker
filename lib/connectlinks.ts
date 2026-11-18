import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Client connect links.
 *
 * The team makes one per brand and sends it to whoever holds that brand's Amazon Ads login. That person
 * opens it, signs in with Amazon and approves, and the brand is connected. They never sign in to the
 * tracker and never need Discord.
 *
 * A link works once, expires, and can be switched off. The table is team only in the database. The
 * public page and the Amazon routes look a link up here, on the server, by its code, with the server's
 * own key, so a signed-out visitor only ever learns what the page shows them: the brand's name and country.
 */
export const CONNECT_LINK_DAYS = 14;
const CODE_RE = /^[a-f0-9]{40}$/;
export const newConnectCode = () => crypto.randomBytes(20).toString("hex");

export type ConnectLinkState = "ok" | "used" | "off" | "expired" | "not_found";
type Times = { expires_at: string; used_at: string | null; revoked_at: string | null };

export function connectLinkState(l: Times, now = Date.now()): Exclude<ConnectLinkState, "not_found"> {
  if (l.used_at) return "used";
  if (l.revoked_at) return "off";
  return Date.parse(l.expires_at) <= now ? "expired" : "ok";
}

export type ConnectBrand = { id: string; name: string; marketplace: string };
export type ConnectLookup =
  | { state: "not_found"; link?: undefined; brand?: undefined }
  | { state: Exclude<ConnectLinkState, "not_found">; link: Times & { id: string; brand_id: string }; brand: ConnectBrand };

/** Finds a link by its code. Throws only if the database cannot be reached. */
export async function lookupConnectLink(code: string): Promise<ConnectLookup> {
  if (!CODE_RE.test(code)) return { state: "not_found" };
  const db = createAdminClient();
  const { data: link, error } = await db.from("amazon_connect_links").select("id, brand_id, expires_at, used_at, revoked_at").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  if (!link) return { state: "not_found" };
  const { data: brand, error: e2 } = await db.from("brands").select("id, name, marketplace").eq("id", link.brand_id).maybeSingle();
  if (e2) throw new Error(e2.message);
  if (!brand) return { state: "not_found" };
  return { state: connectLinkState(link), link, brand: brand as ConnectBrand };
}

/** The link did its job: the brand's Amazon access is stored. It will not work again. */
export async function spendConnectLink(id: string) {
  await createAdminClient().from("amazon_connect_links").update({ used_at: new Date().toISOString(), last_error: null }).eq("id", id);
}

/** Keeps the reason a try through the link failed, so the team can read it in Settings. The client only sees a plain message. */
export async function noteConnectLinkError(id: string, message: string) {
  await createAdminClient().from("amazon_connect_links").update({ last_error: message.slice(0, 500) }).eq("id", id);
}
