"use client";
import { useState } from "react";
import { importReport, type ImportResult } from "@/lib/actions";

export function ImportForm({ productId }: { productId: string }) {
  const [res, setRes] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setRes(null);
        const fd = new FormData(e.currentTarget);
        fd.set("product_id", productId);
        try {
          setRes(await importReport(fd));
        } catch {
          setRes({ ok: false, message: "The upload failed. Check the file is a CSV under 20 MB and try again.", rows: 0, matched: 0, links: 0 });
        }
        setBusy(false);
      }}
    >
      <div className="label">Upload an Amazon Attribution report</div>
      <input type="file" name="file" accept=".csv,text/csv" required
        className="block w-full text-sm text-ink-2 file:mr-4 file:rounded-lg file:border-0 file:bg-panel-2 file:px-4 file:py-2 file:text-sm file:text-ink" />
      <button className="btn-primary disabled:opacity-50" disabled={busy}>{busy ? "Importing…" : "Import CSV"}</button>
      {res && (
        <div className={`space-y-2 rounded-lg border p-4 text-xs ${res.ok ? "border-accent/40 bg-accent/10 text-accent" : "border-rose/40 bg-rose/10 text-rose"}`}>
          <div className="text-sm font-semibold">{res.ok ? "Imported" : "Not imported"}</div>
          <div>{res.message}</div>
          {res.days && <div className="font-mono">Days covered: {res.days}</div>}
          {res.columns && res.columns.length > 0 && <div className="font-mono text-ink-2">Columns read: {res.columns.join(", ")}</div>}
          {res.unmatched && res.unmatched.length > 0 && (
            <div className="font-mono text-ink-2">Rows that matched no link (first {res.unmatched.length}): {res.unmatched.join(" · ")}</div>
          )}
        </div>
      )}
    </form>
  );
}
