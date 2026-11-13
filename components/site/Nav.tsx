import Link from "next/link";
import { SITE } from "@/lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-[3px] border-accent" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">{SITE.name}</span>
    </Link>
  );
}

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-ink-2 md:flex">
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#platform" className="hover:text-ink">Creators and team</Link>
          <Link href="/#amazon" className="hover:text-ink">Amazon data</Link>
          <Link href="/services" className="hover:text-ink">Services</Link>
          <Link href="/about" className="hover:text-ink">About</Link>
          <Link href="/contact" className="hover:text-ink">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/contact" className="btn-primary">Talk to us</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2">
            {SITE.name} is an Amazon advertising measurement service and software platform operated by{" "}
            <strong className="text-ink">{SITE.company}</strong>, a Dubai-registered company trading as {SITE.tradeName}.
            We provide Amazon Attribution setup, creator tracking links and sales reporting to brands that sell on Amazon.
          </p>
          <p className="mt-4 font-mono text-xs text-ink-3">
            {SITE.company}
            <br />
            {SITE.address}
            <br />
            <a href={`mailto:${SITE.email}`} className="hover:text-ink">{SITE.email}</a>
          </p>
        </div>
        <div>
          <div className="label mb-3">Company</div>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><Link href="/about" className="hover:text-ink">About us</Link></li>
            <li><Link href="/services" className="hover:text-ink">Services</Link></li>
            <li><Link href="/contact" className="hover:text-ink">Contact</Link></li>
            <li><a href={SITE.parentSite} className="hover:text-ink" target="_blank" rel="noreferrer">viraldrivenmedia.com</a></li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><Link href="/privacy" className="hover:text-ink">Privacy policy</Link></li>
            <li><Link href="/terms" className="hover:text-ink">Terms of service</Link></li>
            <li><Link href="/login" className="hover:text-ink">Team and creator sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 font-mono text-[11px] text-ink-3 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} {SITE.company}. All rights reserved.</span>
          <span>Amazon, Amazon Ads and Amazon Attribution are trademarks of Amazon.com, Inc. or its affiliates. {SITE.name} is an independent service and is not endorsed by Amazon.</span>
        </div>
      </div>
    </footer>
  );
}
