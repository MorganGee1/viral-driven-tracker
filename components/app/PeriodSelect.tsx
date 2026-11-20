import { periodOptions, type Period } from "@/lib/util";

/** The date dropdown used on every report page. Sits inside an AutoForm. */
export function PeriodSelect({ period, withDates = false, from, to, compact = false }: { period: Period; withDates?: boolean; from?: string; to?: string; compact?: boolean }) {
  const options = periodOptions();
  // compact: the fields sit in one row and their labels are kept for screen readers only
  const label = compact ? "sr-only" : "label mb-1 block";
  return (
    <>
      <label className="block">
        <span className={label}>Dates</span>
        <select name="period" defaultValue={period.key === "custom" ? "month" : period.key} className="select min-w-40 py-1.5" key={period.key} title="Dates">
          {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </label>
      {withDates && (
        <>
          <label className="block">
            <span className={label}>From</span>
            <input type="date" name="from" defaultValue={period.key === "custom" ? from : ""} className="input py-1.5" title="From this day" />
          </label>
          <label className="block">
            <span className={label}>To</span>
            <input type="date" name="to" defaultValue={period.key === "custom" ? to : ""} className="input py-1.5" title="To this day" />
          </label>
        </>
      )}
    </>
  );
}
