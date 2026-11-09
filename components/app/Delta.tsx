export function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ink-3">—</span>;
  const up = value >= 0;
  return <span className={up ? "text-accent" : "text-rose"}>{up ? "▲" : "▼"} {Math.abs(value)}%</span>;
}
