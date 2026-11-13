"use client";
import type { ReactNode } from "react";

/** A filter bar: changing any dropdown or date reloads the page with the new filters. */
export function AutoForm({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <form
      method="get"
      className={className}
      onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        const f = e.currentTarget;
        const field = (n: string) => f.elements.namedItem(n) as HTMLInputElement | null;
        // picking a preset period clears any custom dates; custom dates need both ends before reloading
        if (t.name === "period") for (const n of ["from", "to"]) { const el = field(n); if (el) el.value = ""; }
        if (t.type === "date" && !(field("from")?.value && field("to")?.value)) return;
        if (t.tagName === "SELECT" || t.type === "date" || t.type === "checkbox") f.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
