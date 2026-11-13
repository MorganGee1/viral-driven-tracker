import { Logo } from "@/components/site/Nav";
import { DiscordButton } from "@/components/app/DiscordButton";
import { SITE } from "@/lib/site";
import Link from "next/link";

export const metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; setup?: string }> }) {
  const sp = await searchParams;
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  return (
    <div className="hero-glow flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link href="/" className="text-sm text-ink-2 hover:text-ink">Back to site</Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="card w-full max-w-sm p-8">
          <div className="label">Team and creator access</div>
          <h1 className="mt-2 text-2xl font-bold">Sign in to {SITE.short}</h1>
          <p className="mt-2 text-sm text-ink-2">One click with Discord. No passwords. It is the only way in, so the team always knows who is who.</p>
          <div className="mt-6">
            {configured ? (
              <DiscordButton next={next} />
            ) : (
              <div className="rounded-lg border border-amber/40 bg-amber/10 p-3 font-mono text-xs text-amber">
                Sign-in is not switched on yet. Add the Supabase environment variables and redeploy.
              </div>
            )}
          </div>
          {sp.error && <p className="mt-4 font-mono text-xs text-rose">Sign in failed. Try again.</p>}
          <p className="mt-6 font-mono text-[11px] leading-relaxed text-ink-3">
            New creator? Open the invite link your manager sent you. By signing in you agree to the <Link href="/terms" className="text-ink-2">terms</Link> and <Link href="/privacy" className="text-ink-2">privacy policy</Link>. Creators only see their own links and sales.
          </p>
        </div>
      </div>
    </div>
  );
}
