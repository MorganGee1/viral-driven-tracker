"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-8">
        <div className="label">Something broke</div>
        <h1 className="mt-2 text-2xl font-bold">This page could not load its numbers</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          Nothing was lost. Try again, and if it keeps happening send this code to the team: <span className="font-mono text-ink">{error.digest ?? "no code"}</span>
        </p>
        <button onClick={reset} className="btn-primary mt-6">Try again</button>
      </div>
    </div>
  );
}
