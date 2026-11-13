import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description: "Amazon Attribution setup, creator tracking links, per-creator sales reporting, Brand Referral Bonus and creator network management for brands selling on Amazon.",
};

const blocks = [
  {
    h: "Amazon Attribution setup and management",
    p: "Amazon Attribution is Amazon's measurement product for traffic that comes from outside Amazon. We set it up inside your Amazon Ads account, or inside ours as your agency, and keep it organised as your creator roster changes.",
    l: [
      "Campaign and ad group structure per creator and per placement",
      "Tagged links generated and issued through the platform",
      "Bulk changes when creators join or leave",
      "Ongoing checks that tags are live and attributing",
    ],
  },
  {
    h: "Creator tracking links",
    p: "Creators post standard Amazon product URLs with an Attribution tag. No redirects, no link shorteners, nothing between the viewer and your listing.",
    l: [
      "Separate links for bio, ManyChat, post descriptions and stories, per account",
      "Creators create and copy their own links after signing in with Discord",
      "The Amazon Attribution tag is attached for the creator. They cannot change it",
      "Links can be renamed or archived but never deleted, so past sales stay in the reports",
    ],
  },
  {
    h: "Sales reporting per creator",
    p: "The platform turns Attribution data into one view per brand, one per product and one per creator.",
    l: [
      "Clicks, detail page views, add to carts, purchases, units, sales",
      "This month, last 30 days, any past month or all time, with a spreadsheet export",
      "Share of sales by creator, top performers and the long tail",
      "Daily sync through the Amazon Ads API, or report upload where API access is pending",
    ],
  },
  {
    h: "Brand Referral Bonus",
    p: "Brand registered sellers earn a bonus from Amazon on sales driven by external traffic. We structure the traffic so it qualifies and report the bonus next to the sales.",
    l: ["Eligibility check for your marketplace and brand", "Bonus reported per brand and product for the team", "Hidden from creators so payouts stay simple"],
  },
  {
    h: "Creator network management",
    p: "For brands that want the whole thing run, not just measured.",
    l: [
      "Recruitment and onboarding into the platform",
      "Weekly account reviews based on sales, not views",
      "Monthly creator payments reconciled against tracked sales",
      "Coaches and VAs assigned per brand",
    ],
  },
  {
    h: "Short-form content production",
    p: "Content made to send traffic to Amazon, from the agency behind this platform.",
    l: ["UGC, AI avatar video and slideshow formats", "TikTok, Instagram and Facebook", "Iteration on what the tracking says sells"],
  },
];

export default function Services() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
      <div className="label mb-3">Services</div>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Advertising measurement and creator services for brands on Amazon.</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-2">
        Everything below is provided by {SITE.company} to brands and their advertising teams. The platform is the software side; the rest is the service around it.
      </p>
      <div className="mt-14 space-y-12">
        {blocks.map((b) => (
          <div key={b.h} className="grid grid-cols-1 gap-5 border-t border-line pt-8 md:grid-cols-[1fr_1.3fr]">
            <div>
              <h2 className="text-xl font-semibold">{b.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{b.p}</p>
            </div>
            <ul className="space-y-2 text-sm text-ink-2">
              {b.l.map((x) => (
                <li key={x} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-16 card p-8 text-center">
        <h2 className="text-2xl font-bold">Want your brand on it?</h2>
        <p className="mt-2 text-ink-2">Tell us the marketplace and how many creators you work with.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/contact" className="btn-primary">Contact us</Link>
          <a href={SITE.calendly} target="_blank" rel="noreferrer" className="btn-ghost">Book a call</a>
        </div>
      </div>
    </div>
  );
}
