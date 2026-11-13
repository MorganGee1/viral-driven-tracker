import { fmtDay, num } from "@/lib/util";

/** Bars for one number per day, with an optional line for a second number on its own scale. */
export function DayChart({ days, bar, line, barLabel, lineLabel, format = num, height = 220 }: {
  days: string[]; bar: number[]; line?: number[]; barLabel: string; lineLabel?: string;
  format?: (n: number) => string; height?: number;
}) {
  if (!days.length) return <div className="flex h-32 items-center justify-center font-mono text-xs text-ink-3">No numbers for these dates yet.</div>;
  const w = 1000, h = height, padB = 22, padT = 8;
  const maxBar = Math.max(...bar, 1);
  const maxLine = line ? Math.max(...line, 1) : 1;
  const slot = w / days.length;
  const bw = Math.max(1, Math.min(34, slot * 0.7));
  const y = (v: number, max: number) => padT + (h - padB - padT) * (1 - v / max);
  const pts = line?.map((v, i) => `${(i + 0.5) * slot},${y(v, maxLine)}`).join(" ");
  const ticks = days.length <= 2 ? days.map((_, i) => i) : [0, Math.floor((days.length - 1) / 2), days.length - 1];
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] text-ink-3">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" />{barLabel} · peak {format(Math.max(...bar, 0))}</span>
        {line && lineLabel && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-rose" />{lineLabel} · peak {num(Math.max(...line, 0))}</span>}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`${barLabel} per day`}>
        <line x1="0" x2={w} y1={h - padB} y2={h - padB} stroke="#1f2a2e" />
        {bar.map((v, i) => (
          <rect key={days[i]} x={(i + 0.5) * slot - bw / 2} y={y(v, maxBar)} width={bw} height={Math.max(0, h - padB - y(v, maxBar))} rx="2" fill="#35d07f" opacity="0.85">
            <title>{`${fmtDay(days[i])}: ${format(v)} ${barLabel.toLowerCase()}${line && lineLabel ? `, ${num(line[i])} ${lineLabel.toLowerCase()}` : ""}`}</title>
          </rect>
        ))}
        {pts && <polyline points={pts} fill="none" stroke="#e0457b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
        {ticks.map((i) => (
          <text key={i} x={Math.min(w - 4, Math.max(4, (i + 0.5) * slot))} y={h - 5} fill="#6e7c78" fontSize="13" fontFamily="monospace"
            textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"}>{fmtDay(days[i])}</text>
        ))}
      </svg>
    </div>
  );
}

/** One thin bar split into coloured parts, for shares (by creator, by placement). */
export function SplitBar({ parts, className = "h-2.5" }: { parts: { key: string; value: number; color: string; title: string }[]; className?: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-line ${className}`}>
      {total > 0 && parts.filter((p) => p.value > 0).map((p) => (
        <div key={p.key} className={`${p.color} h-full`} style={{ width: `${(p.value / total) * 100}%` }} title={p.title} />
      ))}
    </div>
  );
}
