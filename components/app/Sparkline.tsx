export function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 1000, h = 300, max = Math.max(...points, 1);
  const xs = points.map((p, i) => [(i / (points.length - 1)) * w, h - (p / max) * (h * 0.8) - 10]);
  const line = xs.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e0457b" stopOpacity="0.35" /><stop offset="1" stopColor="#e0457b" stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#sg)" />
      <path d={line} fill="none" stroke="#e0457b" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
