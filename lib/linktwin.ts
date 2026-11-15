/**
 * LinkTwin makes "deep links": a short link that opens the Amazon app on a phone instead of the
 * browser inside Instagram or TikTok. The tracker sends LinkTwin the full tagged Amazon address
 * and stores the short link it hands back. Off until LINKTWIN_API_KEY is set.
 */
const BASE = `${(process.env.LINKTWIN_TEST_BASE ?? "https://linktw.in").replace(/\/+$/, "")}/api`;

export const linktwinConfigured = () => !!process.env.LINKTWIN_API_KEY;

export type DeepResult = { ok: true; id: string; url: string } | { ok: false; message: string };

async function call(path: string, method: "POST" | "PUT", body: Record<string, unknown>): Promise<DeepResult> {
  const key = process.env.LINKTWIN_API_KEY;
  if (!key) return { ok: false, message: "LinkTwin is not set up on this site yet." };
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => null)) as { error?: number | string; message?: string; id?: number | string; shorturl?: string } | null;
    if (!res.ok || !json || Number(json.error) !== 0 || !json.shorturl || json.id == null) {
      const why = json?.message ?? (res.status === 429 ? "LinkTwin is rate limiting us. Try again in a minute." : `LinkTwin answered ${res.status}.`);
      return { ok: false, message: String(why).slice(0, 200) };
    }
    return { ok: true, id: String(json.id), url: json.shorturl };
  } catch {
    return { ok: false, message: "LinkTwin did not answer." };
  }
}

const extras = () => (process.env.LINKTWIN_DOMAIN ? { domain: process.env.LINKTWIN_DOMAIN } : {});

/** Makes a new deep link that opens `dest`. `title` and `note` only show in the LinkTwin dashboard. */
export function createDeepLink(dest: string, title: string, note: string) {
  return call("/url/add", "POST", { url: dest, display_title: title.slice(0, 120), note: note.slice(0, 250), ...extras() });
}

/** Points an existing deep link at a new address, so a link a creator already posted keeps working. */
export function updateDeepLink(id: string, dest: string, title: string) {
  return call(`/url/${encodeURIComponent(id)}/update`, "PUT", { url: dest, display_title: title.slice(0, 120) });
}
