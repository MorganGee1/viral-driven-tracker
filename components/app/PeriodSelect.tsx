import { periodOptions, type Period } from "@/lib/util";

/** The date dropdown used on every report page. Sits inside an AutoForm. */
export function PeriodSelect({ period, withDates = false, from, to }: { period: Period; withDates?: boolean; from?: string; to?: string }) {
  const options = periodOptions();
  return (
    <>
      <label className="block">
        <span className="label mb-1 block">Dates</span>
        <select name="period" defaultValue={period.key === "custom" ? "month" : period.key} className="select min-w-40 py-1.5" key={period.key}>
          {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </label>
      {withDates && (
        <>
          <label className="block">
            <span className="label mb-1 block">From</span>
            <input type="date" name="from" defaultValue={period.key === "custom" ? from : ""} className="input py-1.5" />
          </label>
          <label className="block">
            <span className="label mb-1 block">To</span>
            <input type="date" name="to" defaultValue={period.key === "custom" ? to : ""} className="input py-1.5" />
          </label>
        </>
      )}
    </>
  );
}
