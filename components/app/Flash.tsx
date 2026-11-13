/** Green or red line at the top of a page after an action. Reads ?ok= and ?error= from the address. */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div role="status" className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? "border-rose/40 bg-rose/10 text-rose" : "border-accent/40 bg-accent/10 text-accent"}`}>
      {error ?? ok}
    </div>
  );
}
