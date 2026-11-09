import Link from "next/link";
import { DashboardMock } from "@/components/site/DashboardMock";
import { SITE } from "@/lib/site";

const services = [
  {
    t: "Amazon Attribution setup",
    d: "We set up Amazon Attribution inside your Amazon Ads account, structure campaigns and ad groups per creator and placement, and generate the tagged links so every click off Amazon is measured.",
  },
  {
    t: "Creator tracking links",
    d: "Every creator gets their own links for bio, pinned comments and DM automations. They post real Amazon URLs, no redirects, so the click and the sale are attributed to the right person.",
  },
  {
    t: "Sales reporting per creator",
    d: "Clicks, detail page views, add to carts, purchases, units and sales, broken down by creator and placement, month to date and against the same days last month.",
  },
  {
    t: "Brand Referral Bonus",
    d: "We make sure your external traffic qualifies for Amazon's Brand Referral Bonus and report the bonus earned alongside the sales, so you see the full return on creator traffic.",
  },
  {
    t: "Creator network management",
    d: "Recruitment, onboarding, weekly account reviews and payments for creator networks of 10 to 150 people, all run against the numbers the platform reports.",
  },
  {
    t: "Short-form content production",
    d: "TikTok, Instagram and Facebook content built to send traffic to Amazon: UGC, AI avatar videos and slideshow formats, produced by our in-house team and creator network.",
  },
];

const steps = [
  ["01", "Connect", "You give us manager access to your Amazon Ads account, or connect it with Login with Amazon. We create the Attribution structure for your products."],
  ["02", "Issue links", "Creators sign in with Discord and generate their own links per placement. Managers see every link, creators only see their own."],
  ["03", "Measure", "Attribution data syncs into the platform daily. Sales are matched to the creator and placement that drove them."],
  ["04", "Act", "Weekly reviews show who is driving sales and who is not. Pay, scale or cut creators on real numbers, not views."],
];

const faqs = [
  ["Who is this for?", "Brands selling on Amazon in the US or UK that use creators, influencers or their own content on TikTok, Instagram and Facebook to send traffic to their listings, and want to know which of that traffic turns into sales."],
  ["Do you run the ads or just measure them?", "Both. The platform measures external traffic through Amazon Attribution. The agency side produces the content and manages the creators who post it. You can take the service with or without the content production."],
  ["Does it change the links creators post?", "No. Creators post standard amazon.com or amazon.co.uk product URLs with an Amazon Attribution tag on the end. There is no redirect through our servers."],
  ["Do creators see each other's numbers?", "No. Creators only ever see their own links and their own sales. Managers at the brand and at our agency see everything."],
  ["How does data get in?", "Through the Amazon Ads API where the brand has granted access, or through Amazon Attribution report uploads where it has not. Either way the platform shows the same reports."],
  ["What does it cost?", "The platform is included for brands on a creator management retainer with us. Measurement-only setups are quoted per brand. Book a call and we'll give you a number on it."],
];

export default function Home() {
  return (
    <>
      <section className="hero-glow border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 md:pt-28">
          <div className="pill-live mb-6">Amazon advertising measurement</div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Know which creators actually sell your product on Amazon.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            {SITE.name} is an Amazon Attribution and creator measurement service for brands. We set up the tracking, give every creator their own links, and report the sales each one drives, down to the placement.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary px-5 py-3 text-base">Talk to us about your brand</Link>
            <Link href="/services" className="btn-ghost px-5 py-3 text-base">See the services</Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-ink-3">
            <span>Operated by {SITE.company}</span>
            <span>Dubai, UAE</span>
            <span>Serving US and UK Amazon brands</span>
          </div>
          <div className="mt-14">
            <DashboardMock />
          </div>
        </div>
      </section>

      <section id="services" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">What we do</div>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">Advertising measurement and creator services for Amazon brands.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.t} className="card p-6">
                <h3 className="text-base font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/services" className="text-sm text-accent hover:underline">Full service descriptions →</Link>
          </div>
        </div>
      </section>

      <section id="how" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">How it works</div>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">From Amazon Ads account to per-creator sales in a week.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {steps.map(([n, t, d]) => (
              <div key={n} className="card p-6">
                <div className="font-mono text-xs text-accent">{n}</div>
                <h3 className="mt-3 text-base font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="label mb-3">The platform</div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Two sides. One set of numbers.</h2>
              <p className="mt-5 text-ink-2 leading-relaxed">
                Managers see every brand, campaign, creator and link, with sales month to date, purchases, units, clicks, conversion and Brand Referral Bonus. Creators sign in with Discord and see one thing: their own links and what those links sold.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ink-2">
                {[
                  "Brands and campaigns, each tied to an Amazon product URL",
                  "Links per placement: bio, pinned comment, ManyChat, other",
                  "Amazon Attribution tags attached by managers, invisible to creators",
                  "Daily stats per link: clicks, DPV, ATC, purchases, units, sales",
                  "Month to date vs same days last month on every campaign",
                  "Report upload for brands without API access yet",
                ].map((x) => (
                  <li key={x} className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{x}</li>
                ))}
              </ul>
              <div className="mt-8"><Link href="/login" className="btn-ghost">Client sign in</Link></div>
            </div>
            <div className="card p-6">
              <div className="label">Tracking links · creator view</div>
              {[
                ["Bio link", "TikTok bio", "$1,204.50"],
                ["Pinned comment", "Video 14 Oct", "$388.10"],
                ["ManyChat", "DM keyword LASH", "$2,911.00"],
              ].map(([a, b, c]) => (
                <div key={a} className="mt-3 flex items-center justify-between rounded-xl border border-line bg-panel-2 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{a}</div>
                    <div className="font-mono text-[11px] text-ink-3">{b}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="big-number font-semibold">{c}</span>
                    <span className="rounded-md bg-accent px-2.5 py-1 font-mono text-[11px] text-black">Copy</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 font-mono text-[11px] text-ink-3">Creators see their own links only. Sales this month.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">Questions</div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map(([q, a]) => (
              <div key={q} className="card p-6">
                <h3 className="text-base font-semibold">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Stop paying creators for views.</h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-2">Book a 15 minute call and we'll tell you what it takes to get your brand measured.</p>
          <div className="mt-8 flex justify-center gap-3">
            <a href={SITE.calendly} target="_blank" rel="noreferrer" className="btn-primary px-5 py-3 text-base">Book a call</a>
            <Link href="/contact" className="btn-ghost px-5 py-3 text-base">Email us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
