import { PLACEMENTS, PLACEMENT_KEYS, PLATFORMS, PLATFORM_KEYS, ZERO, accountLabel, addTotals, sourceLabel, type Placement, type Platform, type Totals } from "@/lib/util";

/**
 * Turns a product's links and their numbers into what the Overview shows: the total, who sold it,
 * where it came from (placement and platform) and which links did it. Pure: no database in here,
 * so it can be checked on its own.
 */

export type OverviewLink = {
  id: string; owner_id: string; platform: Platform; account: string; placement: Placement; name: string; archived_at: string | null;
};
export type SourceRow = { key: string; label: string; links: number; t: Totals };
export type CreatorRow = { id: string; name: string; t: Totals; links: number; best: string | null };
export type TopLink = { id: string; creatorId: string; creator: string; account: string; placement: string; name: string; archived: boolean; t: Totals };

export type Overview = {
  creatorCount: number;          // everyone who joined or has a link
  liveLinks: number;             // live links in view (the chosen creator's, or everyone's)
  total: Totals;                 // in view, this period
  before: Totals | null;         // in view, the comparison period (null when there is none)
  creators: CreatorRow[];        // across everyone, ranked, only those with clicks or sales
  quietCreators: number;         // joined or have links, but no clicks or sales in these dates
  allSales: number;              // across everyone, for shares
  placements: SourceRow[];       // in view
  platforms: SourceRow[];        // in view
  topLinks: TopLink[];           // in view, ranked, only links with clicks or sales
  activeLinks: number;           // in view, links with clicks or sales
};

const active = (t: Totals) => t.sales > 0 || t.purchases > 0 || t.clicks > 0;
/** Biggest sales first, then purchases, then clicks, then by name so the order never jumps about. */
const rank = <T extends { t: Totals }>(label: (x: T) => string) => (a: T, b: T) =>
  b.t.sales - a.t.sales || b.t.purchases - a.t.purchases || b.t.clicks - a.t.clicks || label(a).localeCompare(label(b));

export function buildOverview(input: {
  links: OverviewLink[];
  totals: Map<string, Totals>;
  before: Map<string, Totals> | null;
  names: Map<string, string>;
  memberIds: string[];
  chosen: string | null;
}): Overview {
  const { links, totals, before, names, chosen } = input;
  const of = (id: string) => totals.get(id) ?? ZERO;
  const creatorIds = [...new Set([...input.memberIds, ...links.map((l) => l.owner_id)])];
  const inView = chosen ? links.filter((l) => l.owner_id === chosen) : links;

  // who sold it: always across everyone, so picking one creator still shows where they stand
  const per = new Map<string, { t: Totals; links: OverviewLink[] }>();
  for (const l of links) {
    const c = per.get(l.owner_id) ?? { t: ZERO, links: [] };
    c.t = addTotals(c.t, of(l.id));
    c.links.push(l);
    per.set(l.owner_id, c);
  }
  const creators: CreatorRow[] = [...per.entries()].filter(([, c]) => active(c.t)).map(([id, c]) => {
    const best = c.links.map((l) => ({ l, t: of(l.id) })).filter((x) => active(x.t)).sort(rank((x) => x.l.name))[0];
    return { id, name: names.get(id) ?? "Unknown", t: c.t, links: c.links.filter((l) => !l.archived_at).length, best: best ? sourceLabel(best.l.platform, best.l.placement) : null };
  }).sort(rank((c) => c.name));

  // where it came from: one row per placement and per platform that has a live link or any numbers
  const group = <K extends string>(keys: K[], labels: Record<K, string>, pick: (l: OverviewLink) => K): SourceRow[] =>
    keys.map((key) => {
      const mine = inView.filter((l) => pick(l) === key);
      return { key, label: labels[key], links: mine.filter((l) => !l.archived_at).length, t: mine.reduce((s, l) => addTotals(s, of(l.id)), ZERO) };
    }).filter((r) => r.links > 0 || active(r.t)).sort(rank((r) => r.label));

  const ranked = inView.map((l) => ({ l, t: of(l.id) })).filter((x) => active(x.t)).sort(rank((x) => x.l.name));

  return {
    creatorCount: creatorIds.length,
    liveLinks: inView.filter((l) => !l.archived_at).length,
    total: inView.reduce((s, l) => addTotals(s, of(l.id)), ZERO),
    before: before ? inView.reduce((s, l) => addTotals(s, before.get(l.id) ?? ZERO), ZERO) : null,
    creators,
    quietCreators: creatorIds.length - creators.length,
    allSales: creators.reduce((s, c) => s + c.t.sales, 0),
    placements: group(PLACEMENT_KEYS, PLACEMENTS, (l) => l.placement),
    platforms: group(PLATFORM_KEYS, PLATFORMS, (l) => l.platform),
    topLinks: ranked.slice(0, 8).map(({ l, t }) => ({
      id: l.id, creatorId: l.owner_id, creator: names.get(l.owner_id) ?? "Unknown", account: accountLabel(l.platform, l.account),
      placement: PLACEMENTS[l.placement], name: l.name, archived: !!l.archived_at, t,
    })),
    activeLinks: ranked.length,
  };
}
