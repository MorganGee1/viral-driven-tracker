import Link from "next/link";
import { DashboardMock } from "@/components/site/DashboardMock";
import { SITE } from "@/lib/site";

const steps: { n: string; who: "Team" | "Creator" | "Amazon"; t: string; d: string }[] = [
  {
    n: "01", who: "Team",
    t: "Add the brand, the product and its Amazon page",
    d: "A team member adds the brand, then each product under it, with the Amazon address that product's links point to (amazon.com/dp/...). A product can have more than one Amazon page, for example a serum and a mascara.",
  },
  {
    n: "02", who: "Team",
    t: "Connect the brand's Amazon Ads account",
    d: "The brand signs in with Login with Amazon and approves access to Amazon Attribution for its own advertiser account. The tracker uses that access to get Attribution tags for links and to pull Attribution reports. Nothing else in the account is touched.",
  },
  {
    n: "03", who: "Team",
    t: "Send creators an invite link",
    d: "Each product has invite links. The team copies one and sends it to the creators who are promoting that product. A link can be switched off at any time.",
  },
  {
    n: "04", who: "Creator",
    t: "Sign in with Discord",
    d: "The creator opens the invite link, signs in with Discord and lands on that product. Discord is the only way in, so the team always knows who is who. No passwords, no social accounts to connect.",
  },
  {
    n: "05", who: "Creator",
    t: "Make a link for every account and placement",
    d: "The creator picks the platform, types the account, picks the placement (bio, ManyChat, post description or story) and names the link. One link per account and per placement, as many as they need.",
  },
  {
    n: "06", who: "Creator",
    t: "Copy it and post it",
    d: "The link is the plain Amazon address with an Amazon Attribution tag on the end. There is no redirect and no link shortener, so the shopper goes straight from the post to the Amazon listing.",
  },
  {
    n: "07", who: "Amazon",
    t: "Amazon Attribution measures the click and the sale",
    d: "Amazon records clicks, detail page views, add to carts, purchases, units and sales against each tag. The tracker pulls that report every day and re-pulls the last 31 days, because Amazon restates recent days.",
  },
  {
    n: "08", who: "Team",
    t: "See revenue by creator, account and placement",
    d: "The team sees total sales for the brand and each product, then the split: which creator, which of their accounts, which placement, which link. Creators see their own links and their own numbers, and nothing else.",
  },
];

const whoStyle = { Team: "border-accent/40 bg-accent/10 text-accent", Creator: "border-violet/40 bg-violet/10 text-violet", Amazon: "border-amber/40 bg-amber/10 text-amber" };

const levels = [
  ["Brand", "Northwind Beauty", "Added by the team"],
  ["Product", "Lash Serum", "Added by the team under a brand"],
  ["Amazon page", "amazon.com/dp/B0...", "Added by the team under a product"],
  ["Creator", "Nora (Discord @nora.lash)", "Created when they join with an invite link"],
  ["Account", "Instagram @lashtruth.nora", "Typed by the creator when they make a link"],
  ["Placement", "Bio, ManyChat, Post description, Story", "Picked by the creator from a fixed list"],
  ["Link", "\"IG Bio\"", "Named by the creator"],
];

const apiUse = [
  ["Profiles", "Read the list of advertiser profiles the brand approved, so the right Amazon Attribution account is linked to the right brand."],
  ["Attribution tags", "Get the Amazon Attribution tag for the brand, so each creator link carries its own campaign, ad group and creative values."],
  ["Attribution reports", "Pull the daily performance report: clicks, detail page views, add to carts, purchases, units sold, sales and Brand Referral Bonus, per tag."],
];

const apiNot = [
  "We do not create, edit, pause or bid on Sponsored Products, Sponsored Brands, Sponsored Display or DSP campaigns.",
  "We do not read or store shopper data. Amazon Attribution reports are totals per tag, with no customer names, emails or order details.",
  "We do not share one brand's numbers with another brand, and we never sell or pass on Amazon data.",
  "A brand can disconnect at any time. We stop pulling reports that day and delete its data on request.",
];

const services = [
  { t: "Amazon Attribution setup", d: "We set up Amazon Attribution for your brand, connect it to the tracker and structure it so every creator link is measured on its own." },
  { t: "Creator tracking links", d: "Every creator makes their own links for bio, ManyChat, captions and stories. They post real Amazon addresses, with no redirect in between." },
  { t: "Sales reporting per creator", d: "Clicks, detail page views, add to carts, purchases, units and sales, split by creator, account, placement and link, with a spreadsheet export." },
  { t: "Brand Referral Bonus", d: "We make sure creator traffic qualifies for Amazon's Brand Referral Bonus and report the bonus next to the sales. Only the brand's team sees it." },
  { t: "Creator network management", d: "Recruiting, onboarding, weekly account reviews and payments for creator networks of 10 to 150 people, run on the numbers the tracker reports." },
  { t: "Short-form content production", d: "TikTok, Instagram and Facebook content made to send shoppers to Amazon: UGC, AI avatar videos and slideshows from our team and creator network." },
];

const faqs = [
  ["Who is this for?", "Brands that sell on Amazon in the US or UK and use creators on TikTok, Instagram and Facebook to send shoppers to their listings. It answers one question: which creator, account and placement is the money coming from?"],
  ["Who logs in?", "Two kinds of people. The brand's team and our agency staff, who see everything for the brand. And creators, who see only their own links and their own numbers. Everyone signs in with Discord."],
  ["Does it change the link creators post?", "No. Creators post a normal amazon.com or amazon.co.uk address with an Amazon Attribution tag on the end. Nothing passes through our servers on the way to Amazon."],
  ["Where do the numbers come from?", "From Amazon Attribution, Amazon's own measurement for traffic from outside Amazon. Brands that have connected their Amazon Ads account get a daily sync through the Amazon Ads API. Brands that have not can upload the Attribution report and get the same pages."],
  ["Do creators see each other's numbers?", "No. A creator sees their own links, clicks and sales. They cannot see other creators, brand totals or the Brand Referral Bonus."],
  ["What does it cost?", "The tracker is included for brands on a creator management retainer with us. Measurement-only setups are quoted per brand. Book a call and we will give you a number."],
];

export default function Home() {
  return (
    <>
      <section className="hero-glow border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 md:pt-28">
          <div className="pill-live mb-6">Amazon Attribution for creator traffic</div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            See which creator, account and placement sells your product on Amazon.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            {SITE.name} is an advertising measurement tool for brands that sell on Amazon. Creators make their own Amazon Attribution links.
            The brand sees the revenue each link brings in, split by creator, account and placement.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#how" className="btn-primary px-5 py-3 text-base">See how it works</Link>
            <Link href="/contact" className="btn-ghost px-5 py-3 text-base">Talk to us about your brand</Link>
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

      <section id="how" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">How it works</div>
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">Eight steps from an Amazon listing to revenue per creator.</h2>
          <p className="mt-4 max-w-2xl text-ink-2">Each step shows who does it: the brand&apos;s team, the creator, or Amazon.</p>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {steps.map((s) => (
              <div key={s.n} className="card flex gap-5 p-6">
                <div className="font-mono text-2xl font-medium text-ink-3">{s.n}</div>
                <div>
                  <span className={`pill ${whoStyle[s.who]}`}>{s.who}</span>
                  <h3 className="mt-3 text-base font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">Two sides</div>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">One side for creators. One side for the team.</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card min-w-0 p-6">
              <span className={`pill ${whoStyle.Creator}`}>Creator side</span>
              <h3 className="mt-4 text-xl font-semibold">Make links. See what they sold.</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-2">
                {[
                  "Join through an invite link and sign in with Discord",
                  "Make a link for each account and each placement",
                  "Copy the link and put it in the bio, ManyChat flow, caption or story",
                  "See clicks and sales for each of their own links",
                  "Rename or archive a link. Links are never deleted, so past sales stay in the reports",
                  "Cannot see other creators, brand totals or the Brand Referral Bonus",
                ].map((x) => <li key={x} className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />{x}</li>)}
              </ul>
              <div className="mt-6 rounded-xl border border-line bg-panel-2 p-4">
                <div className="label">Your links · example</div>
                {[
                  ["IG Bio", "Instagram @lashtruth.nora · Bio", "$1,204.50"],
                  ["IG ManyChat", "Instagram @lashtruth.nora · ManyChat", "$2,911.00"],
                  ["FB Story", "Facebook Lashtruth.nora · Story", "$388.10"],
                ].map(([a, b, c]) => (
                  <div key={a} className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{a}</div>
                      <div className="truncate font-mono text-[11px] text-ink-3">{b}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="big-number text-sm font-semibold">{c}</span>
                      <span className="rounded-md bg-accent px-2.5 py-1 font-mono text-[11px] text-black">Copy</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card min-w-0 p-6">
              <span className={`pill ${whoStyle.Team}`}>Team side</span>
              <h3 className="mt-4 text-xl font-semibold">See where every dollar came from.</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-2">
                {[
                  "Brand overview: total sales for the brand, then each product on its own",
                  "Product overview: sales, purchases, units, clicks, conversion and each creator's share",
                  "Creators: everyone ranked by sales, with their split by placement",
                  "Earnings: filter by creator, account, placement, Amazon page and link, then export",
                  "Tracking links: every link from every creator in one table",
                  "Invite links, Amazon pages and team members, managed without a developer",
                ].map((x) => <li key={x} className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{x}</li>)}
              </ul>
              <div className="mt-6 rounded-xl border border-line bg-panel-2 p-4">
                <div className="label">Creators · example</div>
                {[
                  ["Nora", "$4,503.60", [62, 30, 8]],
                  ["Kai", "$1,877.25", [20, 70, 10]],
                  ["Lena", "$640.10", [100, 0, 0]],
                ].map(([name, sales, split]) => (
                  <div key={name as string} className="mt-3 grid grid-cols-[70px_1fr_90px] items-center gap-3">
                    <span className="text-sm font-medium">{name as string}</span>
                    <div className="flex h-2 overflow-hidden rounded-full bg-line">
                      <div className="bg-accent" style={{ width: `${(split as number[])[0]}%` }} />
                      <div className="bg-violet" style={{ width: `${(split as number[])[1]}%` }} />
                      <div className="bg-amber" style={{ width: `${(split as number[])[2]}%` }} />
                    </div>
                    <span className="big-number text-right text-sm font-semibold">{sales as string}</span>
                  </div>
                ))}
                <div className="mt-4 flex gap-4 font-mono text-[11px] text-ink-3">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent" />Bio</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-violet" />ManyChat</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber" />Story</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8"><Link href="/login" className="btn-ghost">Team and creator sign in</Link></div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">What every link records</div>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">Seven levels, so revenue can be cut any way you ask.</h2>
          <div className="card mt-10 overflow-hidden">
            {levels.map(([level, example, source]) => (
              <div key={level} className="grid grid-cols-1 gap-1 border-b border-line px-5 py-3.5 last:border-0 md:grid-cols-[160px_1fr_1fr] md:gap-6">
                <div className="text-sm font-semibold">{level}</div>
                <div className="font-mono text-xs text-ink-2">{example}</div>
                <div className="text-sm text-ink-3">{source}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="amazon" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">How we use the Amazon Ads API</div>
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">Amazon Attribution only. Three things, all for measurement.</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-ink-2">
            The tracker connects to a brand&apos;s Amazon Ads account only after the brand approves it through Login with Amazon. It uses the Amazon Attribution part of the Amazon Ads API, and only for the brand that approved it.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {apiUse.map(([t, d], i) => (
              <div key={t} className="card p-6">
                <div className="font-mono text-xs text-accent">0{i + 1}</div>
                <h3 className="mt-3 text-base font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
              </div>
            ))}
          </div>
          <div className="card mt-4 p-6">
            <div className="label">What we do not do</div>
            <ul className="mt-4 grid grid-cols-1 gap-3 text-sm text-ink-2 md:grid-cols-2">
              {apiNot.map((x) => <li key={x} className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />{x}</li>)}
            </ul>
            <p className="mt-5 text-sm text-ink-3">
              The full detail is in the <Link href="/privacy" className="text-ink-2 underline underline-offset-2">privacy policy</Link> and <Link href="/terms" className="text-ink-2 underline underline-offset-2">terms</Link>.
            </p>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">What we do</div>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">Advertising measurement and creator services for Amazon brands.</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.t} className="card p-6">
                <h3 className="text-base font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/services" className="text-sm text-accent hover:underline">Full service descriptions</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="label mb-3">Questions</div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <p className="mx-auto mt-4 max-w-xl text-ink-2">Book a 15 minute call and we will tell you what it takes to get your brand measured.</p>
          <div className="mt-8 flex justify-center gap-3">
            <a href={SITE.calendly} target="_blank" rel="noreferrer" className="btn-primary px-5 py-3 text-base">Book a call</a>
            <Link href="/contact" className="btn-ghost px-5 py-3 text-base">Email us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
