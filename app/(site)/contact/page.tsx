import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE.company} about Amazon attribution and creator measurement for your brand.`,
};

export default function Contact() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 md:py-24">
      <div className="label mb-3">Contact</div>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Tell us about your brand.</h1>
      <p className="mt-4 max-w-xl text-ink-2">Marketplace, product category and roughly how many creators you work with is enough to start. We reply within one working day.</p>

      <div className="mt-12 grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <ContactForm />
        <div className="space-y-4">
          <div className="card p-5">
            <div className="label">Email</div>
            <a href={`mailto:${SITE.email}`} className="mt-2 block text-accent">{SITE.email}</a>
          </div>
          <div className="card p-5">
            <div className="label">Book a call</div>
            <a href={SITE.calendly} target="_blank" rel="noreferrer" className="mt-2 block text-accent">15 minute discovery call</a>
          </div>
          <div className="card p-5">
            <div className="label">Company</div>
            <div className="mt-2 text-sm">{SITE.company}</div>
            <div className="mt-1 text-sm text-ink-2">{SITE.address}</div>
          </div>
          <div className="card p-5">
            <div className="label">Existing clients and creators</div>
            <a href="/login" className="mt-2 block text-accent">Sign in to the platform</a>
          </div>
        </div>
      </div>
    </div>
  );
}
