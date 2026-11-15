import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE.company} about Amazon attribution and creator measurement for your brand.`,
};

function Way({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-4">
      <div className="label">{k}</div>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function Contact() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 md:py-24">
      <div className="label mb-3">Contact</div>
      <h1 className="text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">Tell us about your brand</h1>
      <p className="mt-6 max-w-xl text-lg leading-7 text-ink-2">Your marketplace, product category and roughly how many creators you work with is enough to start. We reply within one working day.</p>

      <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ContactForm />
        <div className="self-start border-b border-line">
          <Way k="Email"><a href={`mailto:${SITE.email}`} className="underline underline-offset-4">{SITE.email}</a></Way>
          <Way k="Book a call"><a href={SITE.calendly} target="_blank" rel="noreferrer" className="underline underline-offset-4">15 minute discovery call</a></Way>
          <Way k="Company">
            <div>{SITE.company}</div>
            <div className="text-ink-2">{SITE.address}</div>
          </Way>
          <Way k="Existing clients and creators"><a href="/login" className="underline underline-offset-4">Sign in to the platform</a></Way>
        </div>
      </div>
    </div>
  );
}
