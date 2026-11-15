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
    p: "Amazon Attribution is Amazon's measurement product for traffic that comes from outside Amazon. We set it up inside your Amazon Ads account, or inside ours as your agency, and keep it in order as your creator roster changes.",
    l: [
      "A campaign and ad group structure per creator and per placement",
      "Tagged links issued through the platform",
      "Bulk changes when creators join or leave",
      "Ongoing checks that tags are live and attributing",
    ],
  },
  {
    h: "Creator tracking links",
    p: "Creators post standard Amazon product URLs with an Attribution tag on the end. We don't put a redirect or a link shortener between the viewer and your listing.",
    l: [
      "Separate links for bio, ManyChat, post descriptions and stories, per account",
      "Creators make and copy their own links after signing in with Discord",
      "The Amazon Attribution tag is attached for the creator, and they can't change it",
      "Links can be renamed or archived but never deleted, so past sales stay in the reports",
    ],
  },
  {
    h: "Sales reporting per creator",
    p: "The platform turns Attribution data into one view per brand, one per product and one per creator.",
    l: [
      "Clicks, detail page views, add to carts, purchases, units, sales",
      "This month, last 30 days, any past month or all time, with a spreadsheet export",
      "Share of sales by creator, from the top sellers down to the long tail",
      "A daily sync through the Amazon Ads API, or report upload while API access is pending",
    ],
  },
  {
    h: "Brand Referral Bonus",
    p: "Brand registered sellers earn a bonus from Amazon on sales that come from external traffic. We set the traffic up so it qualifies and report the bonus next to the sales.",
    l: ["An eligibility check for your marketplace and brand", "Bonus reported per brand and product for the team", "Hidden from creators, which keeps payouts uncomplicated"],
  },
  {
    h: "Creator network management",
    p: "For brands that want us to run the creators as well as measure them.",
    l: [
      "Recruitment and onboarding into the platform",
      "Weekly account reviews based on sales, with views a distant second",
      "Monthly creator payments reconciled against tracked sales",
      "Coaches and VAs assigned per brand",
    ],
  },
  {
    h: "Short-form content production",
    p: "Content made to send traffic to Amazon, from the agency behind this platform.",
    l: ["UGC, AI avatar video and slideshow formats", "TikTok, Instagram and Facebook", "New versions of whatever the tracking says is selling"],
  },
];

export default function Services() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
      <div className="label mb-3">Services</div>
      <h1 className="text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">Advertising measurement and creator services for brands on Amazon</h1>
      <p className="mt-6 max-w-2xl text-lg leading-7 text-ink-2">
        Everything below is provided by {SITE.company} to brands and their advertising teams. The platform is the software. The rest is the service around it.
      </p>
      <div className="mt-16">
        {blocks.map((b) => (
          <div key={b.h} className="grid grid-cols-1 gap-6 border-t border-line py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-12">
            <div>
              <h2 className="text-xl font-medium">{b.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{b.p}</p>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-ink-2">
              {b.l.map((x) => (
                <li key={x} className="flex gap-3"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-3" />{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="card mt-8 p-8 text-center">
        <h2 className="text-2xl font-medium">Get your brand on it</h2>
        <p className="mt-2 text-ink-2">Tell us the marketplace and how many creators you work with.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/contact" className="btn-primary">Contact us</Link>
          <a href={SITE.calendly} target="_blank" rel="noreferrer" className="btn-ghost">Book a call</a>
        </div>
      </div>
    </div>
  );
}
