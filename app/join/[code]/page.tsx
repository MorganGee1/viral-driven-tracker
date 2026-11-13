import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/Nav";
import { DiscordButton } from "@/components/app/DiscordButton";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Join", robots: { index: false } };
export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  off: "This invite link has been switched off. Ask whoever sent it for a new one.",
  expired: "This invite link has expired. Ask whoever sent it for a new one.",
  full: "This invite link has been used the maximum number of times. Ask for a new one.",
  not_found: "This invite link does not exist. Check you copied the whole link.",
  no_profile: "Your account is still being set up. Wait a few seconds and open the invite link again.",
  failed: "Something went wrong joining. Open the invite link again.",
};

type Preview = { found: boolean; open: boolean; role?: "creator" | "team"; product?: string | null; brand?: string | null };

export default async function Join({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ error?: string }> }) {
  const { code } = await params;
  const sp = await searchParams;
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let preview: Preview = { found: false, open: false };
  let signedIn = false;
  if (configured && /^[a-z0-9]{6,40}$/i.test(code)) {
    const supabase = await createClient();
    const [{ data }, { data: { user } }] = await Promise.all([supabase.rpc("invite_preview", { p_code: code }), supabase.auth.getUser()]);
    if (data) preview = data as Preview;
    signedIn = !!user;
  }
  // Signed in already: join straight away (people who already joined get through even if the link is now off).
  if (preview.found && signedIn && !sp.error) redirect(`/join/${code}/accept`);

  const problem = sp.error ? REASONS[sp.error] ?? REASONS.failed : !preview.found ? REASONS.not_found : !preview.open ? REASONS.off : null;
  const isTeam = preview.role === "team";
  return (
    <div className="hero-glow flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link href="/" className="text-sm text-ink-2 hover:text-ink">What is this?</Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="card w-full max-w-md p-8">
          {problem ? (
            <>
              <div className="label">Invite link</div>
              <h1 className="mt-2 text-2xl font-bold">This link will not let you in</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{problem}</p>
              <Link href="/login" className="btn-ghost mt-6 w-full">Already joined? Sign in</Link>
            </>
          ) : (
            <>
              <div className="label">{isTeam ? "Team invite" : "Creator invite"}</div>
              <h1 className="mt-2 text-2xl font-bold">
                {isTeam ? "Join the team" : <>Join {preview.product}</>}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                {isTeam
                  ? "You have been invited as a team member. You will see every brand, creator, link and sale."
                  : <>You have been invited to make tracking links for <strong className="text-ink">{preview.product}</strong>{preview.brand ? <> by {preview.brand}</> : null}. Sign in with Discord, make a link for each place you post, and see the sales your links bring in.</>}
              </p>
              <div className="mt-6"><DiscordButton next={`/join/${code}/accept`} /></div>
              <p className="mt-5 font-mono text-[11px] leading-relaxed text-ink-3">
                Discord is the only way in, so the team always knows who is who. We read your Discord name, ID and avatar. Nothing else, and we never post for you.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
