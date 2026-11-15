import Link from "next/link";
import { SITE } from "@/lib/site";

/* The mark is a receipt with a torn bottom edge, in the one accent colour. */
const MARK = "M7 3h10a2 2 0 0 1 2 2v15.5l-1.75-1.5-1.75 1.5-1.75-1.5-1.75 1.5-1.75-1.5-1.75 1.5-1.75-1.5L5 20.5V5a2 2 0 0 1 2-2ZM8 7.25h8v1.5H8ZM8 10.75h5v1.5H8Z";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="shrink-0 text-accent">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={MARK} />
      </svg>
      <span className="whitespace-nowrap text-base font-medium">{SITE.name}</span>
    </Link>
  );
}

const LINKS = [
  ["/#how", "How it works"],
  ["/#platform", "Creators and team"],
  ["/#amazon", "Amazon data"],
  ["/services", "Services"],
  ["/about", "About"],
  ["/contact", "Contact"],
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-ink-2 lg:flex">
          {LINKS.map(([href, label]) => <Link key={href} href={href} className="transition-colors hover:text-ink">{label}</Link>)}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden text-sm text-ink-2 transition-colors hover:text-ink sm:block">Sign in</Link>
          <Link href="/contact" className="btn-primary hidden sm:inline-flex">Talk to us</Link>
          <details className="relative lg:hidden">
            <summary className="btn-ghost cursor-pointer list-none [&::-webkit-details-marker]:hidden">Menu</summary>
            <div className="absolute right-0 top-11 w-56 rounded-xl border border-line bg-panel p-2 shadow-[0_8px_24px_rgb(31_27_22/0.08)]">
              {LINKS.map(([href, label]) => <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink">{label}</Link>)}
              <div className="my-2 border-t border-line" />
              <Link href="/login" className="block rounded-lg px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink">Sign in</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2">
            {SITE.name} is an Amazon advertising measurement service and software platform operated by{" "}
            <strong className="text-ink">{SITE.company}</strong>, a Dubai-registered company trading as {SITE.tradeName}.
            We provide Amazon Attribution setup, creator tracking links and sales reporting to brands that sell on Amazon.
          </p>
          <p className="mt-4 font-mono text-xs leading-5 text-ink-3">
            {SITE.company}
            <br />
            {SITE.address}
            <br />
            <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-ink">{SITE.email}</a>
          </p>
        </div>
        <div>
          <div className="label mb-2">Company</div>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><Link href="/about" className="transition-colors hover:text-ink">About us</Link></li>
            <li><Link href="/services" className="transition-colors hover:text-ink">Services</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-ink">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="label mb-2">Legal</div>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><Link href="/privacy" className="transition-colors hover:text-ink">Privacy policy</Link></li>
            <li><Link href="/terms" className="transition-colors hover:text-ink">Terms of service</Link></li>
            <li><Link href="/login" className="transition-colors hover:text-ink">Team and creator sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 font-mono text-xs leading-5 text-ink-3 md:flex-row md:items-start md:justify-between md:gap-8">
          <span className="shrink-0">© {new Date().getFullYear()} {SITE.company}. All rights reserved.</span>
          <span className="md:text-right">Amazon, Amazon Ads and Amazon Attribution are trademarks of Amazon.com, Inc. or its affiliates. {SITE.name} is an independent service and is not endorsed by Amazon.</span>
        </div>
      </div>
    </footer>
  );
}
