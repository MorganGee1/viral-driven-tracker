"use client";
import { useRef, useState } from "react";

/** One day on the chart. Everything a reader sees is already worded by the server. */
export type TrendPoint = {
  day: string;
  label: string;          // "19 Nov"
  value: number;
  text: string;           // "£31.14"
  sub: string;            // "2 purchases, 37 clicks"
  before: number | null;  // the same day of the comparison dates, when there is one
  beforeText: string | null; // "19 Oct: £12.40"
};

/**
 * Sales per day as one line, with the comparison dates as a dashed line behind it.
 * The line is the one place the accent colour is used on the page. Move across it (mouse, finger
 * or arrow keys) to read any day exactly.
 */
export function TrendChart({ points, max, ticks, summary }: {
  points: TrendPoint[]; max: number; ticks: { at: number; label: string }[]; summary: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const n = points.length;
  // nothing sold and nothing to compare with: say so plainly instead of drawing a flat line on an invented scale
  const flat = points.every((p) => !(p.value > 0) && !((p.before ?? 0) > 0));
  if (!n || flat) return <div className="mx-6 mb-6 flex h-24 items-center justify-center rounded-lg border border-dashed border-line text-sm text-ink-3 md:mx-8 md:mb-8">No sales in these dates yet.</div>;

  // the top 14% of the plot is headroom, so the peak never touches what sits above it
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (Math.max(0, v) / max) * 86;
  const path = (vals: number[]) => (vals.length === 1 ? `0,${y(vals[0])} 100,${y(vals[0])}` : vals.map((v, i) => `${x(i)},${y(v)}`).join(" "));
  const now = path(points.map((p) => p.value));
  const beforeVals = points.filter((p) => p.before !== null).map((p) => p.before as number);
  const hasBefore = beforeVals.length > 0;
  const before = hasBefore ? (beforeVals.length === 1 && n > 1 ? `0,${y(beforeVals[0])} ${x(0) + 0.01},${y(beforeVals[0])}` : path(beforeVals)) : "";

  const at = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    const rel = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setHover(n === 1 ? 0 : Math.round(rel * (n - 1)));
  };
  const p = hover === null ? null : points[hover];
  const hx = hover === null ? 0 : x(hover);
  const marks = n <= 2 ? points.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <div className="pb-5 pl-6 pr-16 md:pl-8">
      <div
        ref={box}
        role="img"
        aria-label={summary}
        tabIndex={0}
        className="relative h-40 touch-pan-y select-none border-b border-line-2 outline-none focus-visible:border-accent md:h-52"
        onPointerMove={(e) => at(e.clientX)}
        onPointerDown={(e) => at(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          setHover((h) => Math.min(n - 1, Math.max(0, (h ?? n - 1) + (e.key === "ArrowRight" ? 1 : -1))));
        }}
      >
        {ticks.map((t) => (
          <div key={t.at} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ top: `${y(t.at)}%` }}>
            <span className="absolute left-full -translate-y-1/2 whitespace-nowrap pl-2 font-mono text-[11px] leading-4 text-ink-3">{t.label}</span>
          </div>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <polygon points={`0,100 ${now} 100,100`} className="fill-accent/10" />
          {hasBefore && <polyline points={before} fill="none" className="stroke-ink-3" strokeWidth="1.25" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />}
          <polyline points={now} fill="none" className="stroke-accent" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {p && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-line-2" style={{ left: `${hx}%` }} />
            <div className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-accent" style={{ left: `${hx}%`, top: `${y(p.value)}%` }} />
            <div
              className={`pointer-events-none absolute top-3 z-10 w-max max-w-[70vw] rounded-lg border border-line-2 bg-panel-2 px-3 py-2 shadow-lg shadow-black/40 ${hx > 70 ? "-translate-x-full" : hx < 30 ? "" : "-translate-x-1/2"}`}
              style={{ left: `calc(${hx}% + ${hx > 70 ? -10 : hx < 30 ? 10 : 0}px)` }}
            >
              <div className="text-xs text-ink-3">{p.label}</div>
              <div className="num mt-0.5 text-base font-medium">{p.text}</div>
              <div className="mt-0.5 text-xs text-ink-2">{p.sub}</div>
              {p.beforeText && <div className="mt-1 border-t border-line pt-1 text-xs text-ink-3">{p.beforeText}</div>}
            </div>
          </>
        )}
        <span className="sr-only" aria-live="polite">{p ? `${p.label}: ${p.text}. ${p.sub}.${p.beforeText ? ` ${p.beforeText}.` : ""}` : ""}</span>
      </div>
      <div className="relative h-6 font-mono text-[11px] text-ink-3">
        {marks.map((i) => (
          <span key={i} className={`absolute top-2 whitespace-nowrap ${i === 0 ? "left-0" : i === n - 1 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>{points[i].label}</span>
        ))}
      </div>
    </div>
  );
}
