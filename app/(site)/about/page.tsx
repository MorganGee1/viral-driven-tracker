import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE.name} is operated by ${SITE.company}, a Dubai-registered agency providing Amazon advertising measurement and creator services to brands.`,
};

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-4">
      <div className="label">{k}</div>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
      <div className="label mb-3">About us</div>
      <h1 className="text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">The company behind {SITE.name}</h1>

      <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-5 leading-relaxed text-ink-2">
          <p>
            <strong className="text-ink">{SITE.name}</strong> is a product and service of <strong className="text-ink">{SITE.company}</strong>, a company registered in a Dubai free zone, United Arab Emirates, and trading as {SITE.tradeName}.
          </p>
          <p>
            The agency has made short-form content for supplement and beauty brands on TikTok, Instagram and Facebook since 2022. The creator network is now around 150 people, putting out roughly 100 million views a month for the brands we work with. Most of those brands sell on Amazon.
          </p>
          <p>
            Views were never the point. Brands kept asking which creators were sending traffic that converted on Amazon, and the honest answer was that nobody could tell. Amazon Attribution could answer it, but only if every creator and every placement had its own tag, and only if someone kept all of that in order across a hundred-plus people.
          </p>
          <p>
            So we built the tooling for our own brands first, then opened it to the brands we manage creators for. {SITE.name} is that platform, plus the measurement and creator management services around it.
          </p>
          <p>
            Today we provide Amazon advertising measurement and creator services to consumer brands selling on Amazon in the United States and the United Kingdom. That covers our own brands and client brands in supplements, pet health and beauty.
          </p>
        </div>

        <div className="border-b border-line">
          <Fact k="Legal entity">
            <div className="font-medium">{SITE.company}</div>
            <div className="text-ink-2">Free zone company, Dubai, UAE</div>
          </Fact>
          <Fact k="Trading as">{SITE.tradeName}</Fact>
          <Fact k="Registered office">{SITE.address}</Fact>
          <Fact k="Contact"><a href={`mailto:${SITE.email}`} className="underline underline-offset-4">{SITE.email}</a></Fact>
          <Fact k="Founded">Organic content since 2022. Agency incorporated in Dubai in 2025.</Fact>
        </div>
      </div>

      <div className="mt-16 border-t border-line pt-12">
        <h2 className="text-2xl font-medium">How the platform relates to the agency</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-2">
          {SITE.company} is the operating entity for both {SITE.tradeName}, the content agency, and {SITE.name}, the Amazon measurement platform on this site. The same company, team and contact details stand behind both. Clients of the agency use the platform as part of their service, and brands can also come to us for measurement on its own.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/contact" className="btn-primary">Contact</Link>
          <Link href="/services" className="btn-ghost">Services</Link>
        </div>
      </div>
    </div>
  );
}
