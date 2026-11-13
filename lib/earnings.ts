import type { Link, Profile } from "@/lib/data";
import { PLACEMENTS, type Placement } from "@/lib/util";

export type EarningsFilters = { creator?: string; account?: string; placement?: string; page?: string; link?: string; q?: string };

/** "instagram|@handle": one value for the Account filter. */
export const accountKey = (l: Pick<Link, "platform" | "account">) => `${l.platform}|${l.account.trim().toLowerCase()}`;

export function readFilters(sp: Record<string, string | undefined>): EarningsFilters {
  const pick = (k: string) => (sp[k] && sp[k]!.trim() ? sp[k]!.trim() : undefined);
  return { creator: pick("creator"), account: pick("account"), placement: pick("placement"), page: pick("page"), link: pick("link"), q: pick("q") };
}
export const hasFilters = (f: EarningsFilters) => Object.values(f).some(Boolean);

/** The links left after the Earnings filters and search box are applied. */
export function filterLinks(links: Link[], profiles: Map<string, Profile>, f: EarningsFilters): Link[] {
  const q = f.q?.toLowerCase();
  return links.filter((l) => {
    if (f.creator && l.owner_id !== f.creator) return false;
    if (f.account && accountKey(l) !== f.account) return false;
    if (f.placement && l.placement !== f.placement) return false;
    if (f.page && l.page_id !== f.page) return false;
    if (f.link && l.id !== f.link) return false;
    if (q) {
      const p = profiles.get(l.owner_id);
      const hay = [l.name, l.account, l.short_id, l.note ?? "", PLACEMENTS[l.placement as Placement], p?.username ?? "", p?.discord_username ?? ""].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
