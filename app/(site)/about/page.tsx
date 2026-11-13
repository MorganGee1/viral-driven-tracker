import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE.name} is operated by ${SITE.company}, a Dubai-registered agency providing Amazon advertising measurement and creator services to brands.`,
};

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
      <div className="label mb-3">About us</div>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">The company behind {SITE.name}.</h1>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5 text-ink-2 leading-relaxed">
          <p>
            <strong className="text-ink">{SITE.name}</strong> is a product and service of <strong className="text-ink">{SITE.company}</strong>, a company registered in a Dubai free zone, United Arab Emirates, and trading as {SITE.tradeName}.
          </p>
          <p>
            The agency has produced short-form content for supplement and beauty brands on TikTok, Instagram and Facebook since 2022. Over that time its creator network has grown to around 150 creators producing on the order of 100 million views a month for the brands it works with, most of which sell on Amazon.
          </p>
          <p>
            Views were never the point. Brands kept asking which creators were sending traffic that converted on Amazon, and the honest answer was that nobody could tell. Amazon Attribution could answer it, but only if every creator and every placement had its own tag, and only if someone kept that structure in order across a hundred-plus people.
          </p>
          <p>
            So we built the tooling to do that for our own brands first, then opened it to the brands we manage creators for. {SITE.name} is that platform, together with the measurement and creator management services around it.
          </p>
          <p>
            Today we provide Amazon advertising measurement and creator services to consumer brands selling on Amazon in the United States and the United Kingdom, including our own brands and client brands in supplements, pet health and beauty.
          </p>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="label">Legal entity</div>
            <div className="mt-2 text-sm font-medium">{SITE.company}</div>
            <div className="mt-1 font-mono text-xs text-ink-3">Free zone company, Dubai, UAE</div>
          </div>
          <div className="card p-5">
            <div className="label">Trading as</div>
            <div className="mt-2 text-sm font-medium">{SITE.tradeName}</div>
            <a href={SITE.parentSite} target="_blank" rel="noreferrer" className="mt-1 block font-mono text-xs text-accent">viraldrivenmedia.com</a>
          </div>
          <div className="card p-5">
            <div className="label">Registered office</div>
            <div className="mt-2 text-sm">{SITE.address}</div>
          </div>
          <div className="card p-5">
            <div className="label">Contact</div>
            <a href={`mailto:${SITE.email}`} className="mt-2 block text-sm text-accent">{SITE.email}</a>
          </div>
          <div className="card p-5">
            <div className="label">Founded</div>
            <div className="mt-2 text-sm">Organic content, 2022. Agency incorporated in Dubai, 2025.</div>
          </div>
        </div>
      </div>

      <div className="mt-16 border-t border-line pt-10">
        <h2 className="text-2xl font-bold">How the platform relates to the agency</h2>
        <p className="mt-3 max-w-3xl text-ink-2 leading-relaxed">
          {SITE.company} is the operating entity for both {SITE.tradeName}, the content agency at viraldrivenmedia.com, and {SITE.name}, the Amazon measurement platform at this site. The same company, team and contact details stand behind both. Clients of the agency use the platform as part of their service; brands can also engage us for measurement only.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/services" className="btn-ghost">Services</Link>
          <Link href="/contact" className="btn-primary">Contact</Link>
        </div>
      </div>
    </div>
  );
}
