export function DashboardMock() {
  const creators = [
    { name: "Arn", share: 80.5, sales: "$4,947.10", c: "bg-accent" },
    { name: "Nahomy", share: 12.3, sales: "$758.20", c: "bg-violet" },
    { name: "Mazi", share: 5.1, sales: "$311.94", c: "bg-amber" },
    { name: "3 more", share: 2.1, sales: "$129.00", c: "bg-sky" },
  ];
  return (
    <div className="card overflow-hidden shadow-[0_30px_80px_-30px_rgba(53,208,127,0.25)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-ink-3">Brand</span>
          <span className="text-ink-3">/</span>
          <span className="font-medium">Lash Serum US</span>
          <span className="pill-live">Active</span>
        </div>
        <div className="hidden items-center gap-2 font-mono text-[11px] text-ink-3 sm:flex">
          <span className="rounded-md border border-line-2 px-2 py-1">All creators</span>
          <span className="rounded-md border border-line-2 px-2 py-1">This month · 1 – 9 Nov</span>
        </div>
      </div>
      <div className="grid gap-6 p-5 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="label">Total sales · this month · 9 creators</div>
          <div className="big-number mt-2 text-6xl font-extrabold md:text-7xl">
            <span className="text-ink-3">$</span>6,147<span className="text-3xl text-ink-3">.24</span>
          </div>
          <div className="mt-2 font-mono text-xs text-ink-3">▲ 18% vs same days last month · data through 8 Nov</div>
          <svg viewBox="0 0 400 90" className="mt-4 h-20 w-full">
            <defs>
              <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#35d07f" stopOpacity="0.35" />
                <stop offset="1" stopColor="#35d07f" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,60 L50,45 L100,55 L150,20 L200,35 L250,30 L300,50 L350,15 L400,25 L400,90 L0,90 Z" fill="url(#g)" />
            <path d="M0,60 L50,45 L100,55 L150,20 L200,35 L250,30 L300,50 L350,15 L400,25" fill="none" stroke="#35d07f" strokeWidth="2" />
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["211", "purchases"],
            ["215", "units"],
            ["16,254", "clicks"],
            ["1.30%", "conversion"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-line bg-panel-2 p-4">
              <div className="big-number text-2xl font-bold">{v}</div>
              <div className="label mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="label">By creator · total sales share</div>
          <div className="font-mono text-[11px] text-accent">View all 9 creators →</div>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-line">
          {creators.map((c) => (
            <div key={c.name} className={`${c.c} h-full`} style={{ width: `${c.share}%` }} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {creators.map((c) => (
            <div key={c.name} className="flex items-center gap-2 text-sm">
              <span className={`h-2.5 w-2.5 rounded-sm ${c.c}`} />
              <span>{c.name}</span>
              <span className="ml-auto font-mono text-xs text-ink-3">{c.sales} · {c.share}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
