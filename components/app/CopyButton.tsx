"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copy link", small = false }: { text: string; label?: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // older browsers and in-app browsers (Instagram, Discord) block the clipboard API
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }
  return (
    <button type="button" onClick={copy}
      className={`btn shrink-0 ${small ? "btn-sm" : ""} ${done ? "bg-accent text-bg" : "bg-ink text-bg hover:bg-white"}`}>
      {done ? "Copied" : label}
    </button>
  );
}
