import Link from "next/link";
import { HeroVisual } from "@/components/site/HeroVisual";
import { SITE } from "@/lib/site";

const steps: { n: string; who: "Team" | "Creator" | "Amazon"; t: string; d: string }[] = [
  {
    n: "01", who: "Team",
    t: "Add the brand and what it sells",
    d: "Someone on the team adds the brand, then each product under it with the Amazon address its links point to (amazon.com/dp/...). One product can have more than one Amazon page. A lash brand might list a serum and a mascara.",
  },
  {
    n: "02", who: "Team",
    t: "Connect the brand's Amazon Ads account",
    d: "The brand signs in with Login with Amazon and approves access to Amazon Attribution for its own advertiser account. We use that access for two jobs: getting the Attribution tag that goes on each link, and pulling the Attribution report. Nothing else in the account gets touched.",
  },
  {
    n: "03", who: "Team",
    t: "Send creators an invite link",
    d: "Every product has its own invite links. The team copies one and sends it to the creators promoting that product. An invite can be switched off whenever you like.",
  },
  {
    n: "04", who: "Creator",
    t: "Sign in with Discord",
    d: "The creator opens the invite, signs in with Discord and lands on that product. Discord is the only way in, which is how the team always knows who is who. There's no password to forget.",
  },
  {
    n: "05", who: "Creator",
    t: "Make a link for each place they post",
    d: "They pick the platform, type the account name and choose where the link will sit: bio, ManyChat, post description or story. Then they name it. It's one link per account and placement, and they can make as many as they need.",
  },
  {
    n: "06", who: "Creator",
    t: "Copy it and post it",
    d: "The link is the plain Amazon address with an Amazon Attribution tag on the end. We don't run a redirect or a link shortener, so the shopper goes straight from the post to the Amazon listing.",
  },
  {
    n: "07", who: "Amazon",
    t: "Amazon measures the click and the sale",
    d: "Amazon Attribution records clicks, detail page views, add to carts, purchases, units and sales against each tag. We pull that report every day, and pull the last 31 days again each time, because Amazon restates recent days.",
  },
  {
    n: "08", who: "Team",
    t: "See the sales by creator",
    d: "The team gets total sales for the brand and for each product, with the split underneath: which creator, which of their accounts, which placement, which link. A creator sees their own links and their own numbers. That's all they see.",
  },
];

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
  ["Profiles", "We read the list of advertiser profiles the brand approved. That's how the right Amazon Attribution account gets linked to the right brand."],
  ["Attribution tags", "We fetch the brand's Amazon Attribution tag, so each creator link carries its own campaign, ad group and creative values."],
  ["Attribution reports", "We pull the daily performance report for each tag. It holds clicks, detail page views, add to carts, purchases, units sold, sales and Brand Referral Bonus."],
];

const apiNot = [
  "Sponsored Products, Sponsored Brands, Sponsored Display and DSP campaigns are off limits. We never create, edit, pause or bid on them.",
  "No shopper data comes through. Amazon Attribution reports are totals per tag, with no customer names, emails or order details in them.",
  "One brand's numbers stay with that brand. We don't show them to another brand, and we don't sell or pass on Amazon data.",
  "A brand can disconnect whenever it wants. Report pulls stop that day and we delete its data on request.",
];

const services = [
  { t: "Amazon Attribution setup", d: "We set up Amazon Attribution for your brand and connect it to the tracker, arranged so every creator link gets measured on its own." },
  { t: "Creator tracking links", d: "Each creator makes their own links for bio, ManyChat, captions and stories. What they post is a real Amazon address with no redirect in the middle." },
  { t: "Sales reporting per creator", d: "Clicks, detail page views, add to carts, purchases, units and sales, split by creator, account, placement and link. There's a spreadsheet export too." },
  { t: "Brand Referral Bonus", d: "We make sure creator traffic qualifies for Amazon's Brand Referral Bonus and report the bonus next to the sales. Only the brand's team can see it." },
  { t: "Creator network management", d: "Recruiting, onboarding, weekly account reviews and payments for creator networks of 10 to 150 people, run on the numbers the tracker reports." },
  { t: "Short-form content production", d: "TikTok, Instagram and Facebook content made to send shoppers to Amazon. That means UGC, AI avatar videos and slideshows from our team and creator network." },
];

const faqs = [
  ["Who is this for?", "Brands that sell on Amazon in the US or UK and use creators on TikTok, Instagram and Facebook to send shoppers to their listings. It answers one question, which is where the money is coming from."],
  ["Who logs in?", "Two groups. The brand's team and our agency staff see everything for the brand. Creators see their own links and their own numbers. Everyone signs in with Discord."],
  ["Does it change the link creators post?", "No. Creators post a normal amazon.com or amazon.co.uk address with an Amazon Attribution tag on the end. Nothing passes through our servers on the way to Amazon."],
  ["Where do the numbers come from?", "Amazon Attribution, which is Amazon's own measurement for traffic from outside Amazon. Brands that have connected their Amazon Ads account get a daily sync through the Amazon Ads API. Brands that haven't can upload the Attribution report and get the same pages."],
  ["Do creators see each other's numbers?", "No. A creator sees their own links, clicks and sales. Other creators, brand totals and the Brand Referral Bonus stay hidden from them."],
  ["What does it cost?", "The tracker is included for brands on a creator management retainer with us. Measurement-only setups are quoted per brand. Book a call and you'll get a number."],
];

const creatorLinks = [
  ["IG Bio", "Instagram @lashtruth.nora, Bio", "$1,204.50"],
  ["IG ManyChat", "Instagram @lashtruth.nora, ManyChat", "$2,911.00"],
  ["FB Story", "Facebook Lashtruth.nora, Story", "$388.10"],
];

const teamCreators: [string, string, number[]][] = [
  ["Nora", "$4,503.60", [27, 65, 8]],
  ["Kai", "$1,877.25", [20, 70, 10]],
  ["Lena", "$640.10", [100, 0, 0]],
];

const placementColors = ["bg-accent", "bg-ink", "bg-ink-3"];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-2">
      {items.map((x) => (
        <li key={x} className="flex gap-3"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-3" />{x}</li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:py-24">
          <div className="max-w-2xl xl:max-w-none">
            <h1 className="text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-6xl md:leading-[1.02]">
              Know which creator sold what on Amazon
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-7 text-ink-2">
              {SITE.name} is an advertising measurement tool for brands that sell on Amazon. Creators make their own Amazon Attribution links,
              one for each account and placement. The brand sees what every link sold.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/#how" className="btn-primary btn-lg">See how it works</Link>
              <Link href="/contact" className="btn-ghost btn-lg">Talk to us</Link>
            </div>
          </div>
          <HeroVisual />
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-5 py-4 font-mono text-xs leading-5 text-ink-3">
            Operated by {SITE.company} in Dubai, UAE. We work with Amazon brands in the US and UK.
          </p>
        </div>
      </section>

      <section id="how" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="label mb-3">How it works</div>
          <h2 className="max-w-3xl text-3xl font-medium tracking-tight md:text-4xl">From an Amazon listing to sales per creator, in eight steps</h2>
          <p className="mt-4 max-w-2xl text-ink-2">Each step says who does it. Mostly that&apos;s the brand&apos;s team or the creator, and Amazon does the measuring.</p>
          <ol className="mt-12 border-t border-line">
            {steps.map((s) => (
              <li key={s.n} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-line py-6 md:grid-cols-[40px_88px_minmax(0,2fr)_minmax(0,3fr)] md:gap-x-6">
                <span className="row-span-3 font-mono text-sm leading-6 text-ink-3 md:row-span-1">{s.n}</span>
                <span className="font-mono text-xs leading-6 text-ink-3">{s.who}</span>
                <h3 className="col-start-2 text-base font-medium leading-6 md:col-start-auto">{s.t}</h3>
                <p className="col-start-2 text-sm leading-relaxed text-ink-2 md:col-start-auto">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="platform" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="label mb-3">Two sides</div>
          <h2 className="max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">What a creator sees is not what the team sees</h2>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="card min-w-0 p-6">
              <div className="label">Creator side</div>
              <h3 className="mt-2 text-xl font-medium">Make links, see what they sold</h3>
              <Bullets items={[
                "Join from an invite link and sign in with Discord",
                "Make a link for each account and each placement",
                "Copy the link into a bio, ManyChat flow, caption or story",
                "See clicks and sales for each of their own links",
                "Rename or archive a link. Nothing gets deleted, so past sales stay in the reports",
                "No view of other creators, brand totals or the Brand Referral Bonus",
              ]} />
              <div className="mt-6 rounded-lg bg-panel-2 p-4">
                <div className="label">Your links, an example</div>
                <div className="mt-2 divide-y divide-line">
                  {creatorLinks.map(([name, where, sales]) => (
                    <div key={name} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 font-medium">{name}</span>
                          <span className="leader" />
                          <span className="num shrink-0 font-mono text-xs">{sales}</span>
                        </div>
                        <div className="mt-1 truncate font-mono text-xs text-ink-3">{where}</div>
                      </div>
                      <span className="inline-flex h-6 shrink-0 items-center rounded bg-ink px-2 font-mono text-xs text-panel">Copy</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card min-w-0 p-6">
              <div className="label">Team side</div>
              <h3 className="mt-2 text-xl font-medium">See where every dollar came from</h3>
              <Bullets items={[
                "A brand overview with total sales, then each product on its own",
                "A product overview with sales, purchases, units, clicks, conversion and each creator's share",
                "Creators ranked by sales, with their split by placement",
                "Earnings you can filter by creator, account, placement, Amazon page and link, then export",
                "Every tracking link from every creator in one table",
                "Invite links, Amazon pages and team members, all managed without a developer",
              ]} />
              <div className="mt-6 rounded-lg bg-panel-2 p-4">
                <div className="label">Creators, an example</div>
                <div className="mt-4 space-y-3">
                  {teamCreators.map(([name, sales, split]) => (
                    <div key={name} className="grid grid-cols-[56px_minmax(0,1fr)_88px] items-center gap-3">
                      <span className="text-sm font-medium">{name}</span>
                      <div className="flex h-2 overflow-hidden rounded-sm bg-line">
                        {split.map((w, i) => <div key={i} className={placementColors[i]} style={{ width: `${w}%` }} />)}
                      </div>
                      <span className="num text-right font-mono text-xs">{sales}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-4 font-mono text-xs text-ink-3">
                  {["Bio", "ManyChat", "Story"].map((p, i) => (
                    <span key={p} className="flex items-center gap-2"><span className={`h-2 w-2 rounded-sm ${placementColors[i]}`} />{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8"><Link href="/login" className="btn-ghost">Team and creator sign in</Link></div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="label mb-3">What every link records</div>
          <h2 className="max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">Every link carries seven facts, so you can cut the sales any way you like</h2>
          <div className="card mt-12 overflow-hidden">
            {levels.map(([level, example, source]) => (
              <div key={level} className="grid grid-cols-1 gap-1 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
                <div className="text-sm font-medium">{level}</div>
                <div className="font-mono text-xs leading-5 text-ink">{example}</div>
                <div className="text-sm text-ink-2">{source}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="amazon" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="label mb-3">How we use the Amazon Ads API</div>
          <h2 className="max-w-3xl text-3xl font-medium tracking-tight md:text-4xl">We use the Amazon Ads API for Amazon Attribution and nothing else</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-ink-2">
            The tracker connects to a brand&apos;s Amazon Ads account after the brand approves it through Login with Amazon, and not before.
            It calls the Amazon Attribution part of the Amazon Ads API for that one brand.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div>
              <div className="label">What we call</div>
              <ol className="mt-2">
                {apiUse.map(([t, d], i) => (
                  <li key={t} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 border-b border-line py-5 last:border-0">
                    <span className="font-mono text-sm leading-6 text-ink-3">0{i + 1}</span>
                    <div>
                      <h3 className="text-base font-medium leading-6">{t}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="card self-start p-6">
              <div className="label">What we don&apos;t do</div>
              <Bullets items={apiNot} />
              <p className="mt-6 text-sm text-ink-2">
                The full detail is in the <Link href="/privacy" className="text-ink underline underline-offset-4">privacy policy</Link> and <Link href="/terms" className="text-ink underline underline-offset-4">terms</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="label mb-3">What we do</div>
          <h2 className="max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">Advertising measurement and creator services for Amazon brands</h2>
          <div className="mt-12 grid grid-cols-1 gap-x-12 md:grid-cols-2">
            {services.map((s) => (
              <div key={s.t} className="border-t border-line py-6">
                <h3 className="text-base font-medium">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/services" className="text-sm text-ink underline underline-offset-4">Full service descriptions</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="label mb-3">Questions</div>
          <dl className="mt-6 border-t border-line">
            {faqs.map(([q, a]) => (
              <div key={q} className="grid grid-cols-1 gap-2 border-b border-line py-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
                <dt className="text-base font-medium">{q}</dt>
                <dd className="text-sm leading-relaxed text-ink-2">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-24 text-center">
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Stop paying creators for views</h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-2">Book a 15 minute call and we&apos;ll tell you what it takes to get your brand measured.</p>
          <div className="mt-8 flex justify-center gap-3">
            <a href={SITE.calendly} target="_blank" rel="noreferrer" className="btn-primary btn-lg">Book a call</a>
            <Link href="/contact" className="btn-ghost btn-lg">Email us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
