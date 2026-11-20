import crypto from "node:crypto";

/**
 * The green and red bars at the top of a page take their text from the address (?ok=… / ?error=…).
 * Left alone, anyone could write their own text into a link ("Your account is locked, email x@…") and it
 * would show up inside the app, looking like the app said it. So every message the app puts in an address
 * is signed here, and the middleware drops any message whose signature does not match.
 *
 * This file is for the server (actions and routes). lib/flash-edge.ts checks the same signature in the
 * middleware, which cannot use Node's crypto. The two must stay in step: same secret order, same text.
 */
export type FlashKind = "ok" | "error";

/** Any server-only secret will do. Without one (a fresh deploy) messages are not signed and not checked. */
export const flashSecret = () =>
  process.env.FLASH_SECRET || process.env.CRON_SECRET || process.env.AMAZON_TOKEN_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** What gets signed. The prefix keeps this use of the secret apart from every other use of it. */
export const flashText = (kind: FlashKind, message: string) => `flash-v1:${kind}\n${message}`;

export function signFlash(kind: FlashKind, message: string): string {
  const secret = flashSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(flashText(kind, message)).digest("hex").slice(0, 32);
}

/** "ok=Saved&sig=…" ready to put after a ? or & in an address. */
export function flashQuery(kind: FlashKind, message: string): string {
  const sig = signFlash(kind, message);
  return `${kind}=${encodeURIComponent(message)}${sig ? `&sig=${sig}` : ""}`;
}
