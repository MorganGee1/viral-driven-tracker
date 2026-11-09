"use client";
import { useState } from "react";
import { importReport } from "@/lib/actions";

export function ImportForm({ campaignId }: { campaignId: string }) {
  const [res, setRes] = useState<{ ok: boolean; message: string; rows: number; matched: number } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        fd.set("campaign_id", campaignId);
        setRes(await importReport(fd));
        setBusy(false);
      }}
    >
      <div className="label">Import Amazon Attribution report</div>
      <input type="file" name="file" accept=".csv,text/csv" required className="block w-full text-sm text-ink-2 file:mr-4 file:rounded-lg file:border-0 file:bg-panel-2 file:px-4 file:py-2 file:text-sm file:text-ink" />
      <button className="btn-primary" disabled={busy}>{busy ? "Importing…" : "Import CSV"}</button>
      {res && (
        <div className={`rounded-lg border p-3 font-mono text-xs ${res.ok ? "border-accent/40 bg-accent/10 text-accent" : "border-rose/40 bg-rose/10 text-rose"}`}>
          {res.message}
        </div>
      )}
    </form>
  );
}
