"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DiscordButton({ next }: { next?: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo } });
  }
  return (
    <button onClick={go} disabled={busy} className="btn w-full bg-[#5865F2] py-3 text-white hover:bg-[#4752c4] disabled:opacity-60">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.4a18 18 0 0 1 4.5 2.3 15.5 15.5 0 0 0-15.4 0A18 18 0 0 1 8.8 3.4L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9 0 13.4.3 17.8a19.9 19.9 0 0 0 6 3l1.3-2a12.8 12.8 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 11.8 0l.5.4a12.8 12.8 0 0 1-2 1l1.3 2a19.9 19.9 0 0 0 6-3c.4-5.1-.7-9.5-3.4-13.4ZM8.5 15.1c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>
      {busy ? "Redirecting…" : "Continue with Discord"}
    </button>
  );
}
