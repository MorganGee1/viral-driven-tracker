import Link from "next/link";
import { Logo } from "@/components/site/Nav";
import { amazonConfigured } from "@/lib/amazon";
import { lookupConnectLink, type ConnectLookup } from "@/lib/connectlinks";
import { SITE } from "@/lib/site";
import { fmtDay } from "@/lib/util";

export const metadata = { title: "Connect Amazon Ads", robots: { index: false }, referrer: "no-referrer" as const };
export const dynamic = "force-dynamic";

/**
 * The page a client lands on from a connect link. No sign-in: the link is the permission.
 * It shows the brand's name and country and one button, which goes to Amazon's own sign-in.
 * Every message here is fixed text. Nothing from the address is ever printed on the page.
 */

const DEAD: Record<string, string> = {
  not_found: "This connect link does not exist. Check you copied the whole link.",
  off: "This connect link has been switched off. Ask whoever sent it for a new one.",
  expired: "This connect link has expired. Ask whoever sent it for a new one.",
  unavailable: "This page cannot be opened right now. Try again in a few minutes.",
};

const market = (m: string) => `Amazon ${m}`;

export default async function ConnectPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ error?: string }> }) {
  const { code } = await params;
  const sp = await searchParams;
  const ready = amazonConfigured();
  let found: ConnectLookup | null = null;
  if (ready) { try { found = await lookupConnectLink(code); } catch { found = null; } }

  const state = !ready ? "unavailable" : !found ? "unavailable" : found.state;
  const brand = found?.brand;
  const tried: Record<string, string> = brand ? {
    denied: "Amazon access was not approved, so nothing was connected. You can try again below.",
    state: "That Amazon sign-in could not be checked. Start again with the button below.",
    no_advertiser: `That Amazon login has no Amazon Attribution account for ${market(brand.marketplace)}. Sign in with the Amazon login that manages ${brand.name}'s Amazon Ads and try again.`,
    failed: "Connecting did not go through. Try again. If it fails a second time, tell whoever sent you this link.",
    setup: "This site is not ready to connect to Amazon yet. Tell whoever sent you this link.",
  } : {};
  const problem = sp.error ? tried[sp.error] ?? tried.failed : null;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link href="/" className="text-sm text-ink-2 transition-colors hover:text-ink">What is this?</Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="card w-full max-w-lg p-8">
          <div className="label">Amazon Ads connection</div>

          {state === "used" && brand ? (
            <>
              <h1 className="mt-2 text-2xl font-medium">{brand.name} is connected</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                That is everything we needed from you. You can close this tab.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                Sales from creator links start to show in the tracker after the next nightly sync. This link has been used and will not work again.
              </p>
            </>
          ) : state === "ok" && brand && found?.link ? (
            <>
              <h1 className="mt-2 text-2xl font-medium">Connect {brand.name} to {SITE.name}</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                {SITE.tradeName} has asked to connect <strong className="text-ink">{brand.name}</strong>&apos;s Amazon Ads account ({market(brand.marketplace)}), so sales from creator links can be counted link by link.
              </p>
              {problem && (
                <div role="status" className="mt-5 rounded-lg border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">{problem}</div>
              )}
              <ul className="mt-5 space-y-2 text-sm leading-relaxed text-ink-2">
                <li className="flex gap-3"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />It makes Amazon Attribution tags for creator links.</li>
                <li className="flex gap-3"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />It reads the Amazon Attribution report: clicks, add to carts, purchases and sales per link.</li>
                <li className="flex gap-3"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />It does not create, change or pause campaigns, and it does not touch budgets, bids or billing.</li>
              </ul>
              <a href={`/api/amazon/connect?link=${code}`} className="btn btn-lg mt-6 w-full bg-ink text-bg hover:bg-white">Continue with Amazon</a>
              <p className="mt-5 font-mono text-xs leading-5 text-ink-3">
                Sign in with the Amazon login that manages {brand.name}&apos;s Amazon Ads. Amazon&apos;s own screen words the access more widely than the list above, because the permission Amazon gives to ads tools is a broad one. The list above is what this tracker does with it.
              </p>
              <p className="mt-3 font-mono text-xs leading-5 text-ink-3">
                No account to create here and nothing to install. Ask us to disconnect at any time and the stored access is deleted. This link works once and expires on {fmtDay(found.link.expires_at.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })}. See the <Link href="/privacy" className="text-ink-2 underline underline-offset-4">privacy policy</Link>.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-2xl font-medium">This link will not connect anything</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{DEAD[state] ?? DEAD.not_found}</p>
              <p className="mt-5 font-mono text-xs leading-5 text-ink-3">Questions: <a href={`mailto:${SITE.email}`} className="text-ink-2 underline underline-offset-4">{SITE.email}</a></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
