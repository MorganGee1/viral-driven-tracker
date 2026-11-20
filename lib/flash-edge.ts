/**
 * The middleware's half of lib/flash.ts: checks that an ?ok= or ?error= message was written by the app.
 * Uses Web Crypto only, because the middleware does not run on Node. Keep in step with lib/flash.ts.
 */
const secret = () =>
  process.env.FLASH_SECRET || process.env.CRON_SECRET || process.env.AMAZON_TOKEN_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function sign(kind: "ok" | "error", message: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(`flash-v1:${kind}\n${message}`)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/** Compares two strings without stopping at the first difference. */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * True when the address carries no message, or carries exactly one message with a good signature.
 * With no secret on the site nothing is signed, so nothing is checked.
 */
export async function flashAllowed(params: URLSearchParams): Promise<boolean> {
  const ok = params.getAll("ok"), error = params.getAll("error");
  if (!ok.length && !error.length) return true;
  const key = secret();
  if (!key) return true;
  if (ok.length + error.length !== 1) return false;
  const sig = params.get("sig") ?? "";
  if (!/^[a-f0-9]{32}$/.test(sig)) return false;
  return same(sig, ok.length ? await sign("ok", ok[0], key) : await sign("error", error[0], key));
}
