"use client";
import { useState } from "react";
export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className={`btn ${done ? "bg-accent-2 text-black" : "bg-accent text-black hover:bg-accent-2"}`}>
      {done ? "Copied" : label}
    </button>
  );
}
