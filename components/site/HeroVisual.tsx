/*
  The hero visual: the product view for one product, with a receipt for one link laid over its corner.
  Every number here belongs to one made-up brand, so the receipt, the creator rows and the examples
  further down the page all add up: Nora's three links come to $4,503.60, and the four rows to $7,412.50.
*/
const creators = [
  { name: "Nora", sales: "$4,503.60", share: "60.8%", width: 60.8, color: "bg-accent" },
  { name: "Kai", sales: "$1,877.25", share: "25.3%", width: 25.3, color: "bg-ink" },
  { name: "Lena", sales: "$640.10", share: "8.6%", width: 8.6, color: "bg-ink-3" },
  { name: "6 more creators", sales: "$391.55", share: "5.3%", width: 5.3, color: "bg-line-2" },
];

const stats = [
  ["Purchases", "248"],
  ["Units", "255"],
  ["Clicks", "16,254"],
  ["Conversion", "1.53%"],
];

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-ink-2">{k}</span>
      <span className="leader" />
      <span className="num shrink-0 text-ink">{v}</span>
    </div>
  );
}

export function Receipt({ className = "" }: { className?: string }) {
  return (
    <div className={`receipt-wrap w-64 ${className}`}>
      <div className="receipt px-5 pb-8 pt-5 font-mono text-xs leading-5">
        <div className="text-center text-ink">Viral Driven Tracker</div>
        <div className="text-center text-ink-3">Link statement, 1 to 8 Nov</div>
        <div className="receipt-rule" />
        <Row k="Link" v="IG ManyChat" />
        <Row k="Creator" v="Nora" />
        <Row k="Account" v="@lashtruth.nora" />
        <Row k="Platform" v="Instagram" />
        <Row k="Placement" v="ManyChat" />
        <Row k="Amazon page" v="Lash Serum" />
        <div className="receipt-rule" />
        <Row k="Clicks" v="3,412" />
        <Row k="Add to carts" v="301" />
        <Row k="Purchases" v="98" />
        <Row k="Units" v="101" />
        <div className="receipt-rule" />
        <div className="flex items-baseline gap-2 text-sm">
          <span className="shrink-0 font-medium text-ink">Sales</span>
          <span className="leader" />
          <span className="num shrink-0 text-base font-medium text-accent">$2,911.00</span>
        </div>
        <div className="mt-4 text-center text-ink-3">Totals reported by Amazon Attribution</div>
      </div>
    </div>
  );
}

export function ProductView({ className = "" }: { className?: string }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-3">Northwind Beauty</span>
          <span className="text-ink-3">/</span>
          <span className="font-medium">Lash Serum</span>
        </div>
        <span className="font-mono text-xs text-ink-3">Example data</span>
      </div>
      <div className="px-5 pb-5 pt-6">
        <div className="label">Total sales this month</div>
        <div className="big-number mt-2 text-5xl font-medium tracking-[-0.02em]">$7,412.50</div>
        <div className="mt-2 font-mono text-xs text-ink-3">9 creators, data through 8 Nov</div>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-4">
          {stats.map(([label, value]) => (
            <div key={label}>
              <div className="big-number text-xl font-medium">{value}</div>
              <div className="label mt-1">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-baseline justify-between">
          <div className="label">Each creator&apos;s share of sales</div>
        </div>
        <div className="mt-3 flex h-2 w-full overflow-hidden rounded-sm bg-panel-2">
          {creators.map((c) => <div key={c.name} className={`${c.color} h-full`} style={{ width: `${c.width}%` }} />)}
        </div>
        <div className="mt-4 space-y-2">
          {creators.map((c) => (
            <div key={c.name} className="flex items-baseline gap-2 text-sm">
              <span className={`h-2 w-2 shrink-0 self-center rounded-sm ${c.color}`} />
              <span className="shrink-0">{c.name}</span>
              <span className="leader" />
              <span className="num shrink-0 font-mono text-xs text-ink">{c.sales}</span>
              <span className="num w-12 shrink-0 text-right font-mono text-xs text-ink-3">{c.share}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Lays itself out by the room it is given, not the screen: side by side from 576px, stacked below that. */
export function HeroVisual() {
  return (
    <div className="@container w-full max-w-2xl xl:max-w-none">
      <div className="relative">
        <ProductView className="@xl:mr-60" />
        <Receipt className="relative z-10 -mt-3 ml-auto mr-3 rotate-2 @xl:absolute @xl:-right-4 @xl:top-24 @xl:mr-0 @xl:mt-0 @xl:rotate-3" />
      </div>
    </div>
  );
}
