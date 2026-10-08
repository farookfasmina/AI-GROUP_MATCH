// Small, dependency-free bar charts. Thin bars (max 24px), rounded data end, value at the tip,
// text in ink colours (never the bar colour), and a native tooltip on every bar.
import { cx } from "./ui";

export const SERIES = ["#2a78d6", "#eb6834"]; // categorical slots 1 and 2 (validated palette)

export function BarList({ items, max, format = (v) => v, color = SERIES[0], empty = "No data yet" }) {
  const valid = items.filter((i) => i.value !== null && i.value !== undefined);
  if (!valid.length) return <p className="py-6 text-center text-sm text-slate-400">{empty}</p>;
  const top = max ?? Math.max(...valid.map((i) => i.value), 0.0001);
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-[minmax(0,38%)_1fr] items-center gap-3">
          <span className="truncate text-sm text-slate-600" title={i.label}>{i.label}</span>
          <div className="flex items-center gap-2" title={`${i.label}: ${i.value === null || i.value === undefined ? "no data" : format(i.value)}${i.note ? ` (${i.note})` : ""}`}>
            <div className="h-5 flex-1">
              {i.value !== null && i.value !== undefined && (
                <div className="h-full rounded-r" style={{ width: `${Math.max(1.5, (i.value / top) * 100)}%`, background: color }} />
              )}
            </div>
            <span className="w-11 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-800">
              {i.value === null || i.value === undefined ? "-" : format(i.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
      {items.map((it, k) => (
        <span key={it} className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: SERIES[k] }} /> {it}
        </span>
      ))}
    </div>
  );
}

// Two series per row (e.g. AI vs random, default vs learned weight).
export function PairedBars({ rows, series, max, format = (v) => v }) {
  const vals = rows.flatMap((r) => r.values).filter((v) => v !== null && v !== undefined);
  if (!vals.length) return <p className="py-6 text-center text-sm text-slate-400">No data yet</p>;
  const top = max ?? Math.max(...vals);
  return (
    <div>
      <Legend items={series} />
      <div className="mt-4 space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[minmax(0,38%)_1fr] items-center gap-3">
            <span className="truncate text-sm text-slate-600" title={r.label}>{r.label}</span>
            <div className="space-y-[2px]">
              {r.values.map((v, k) => (
                <div key={k} className="flex items-center gap-2" title={`${r.label} - ${series[k]}: ${v === null || v === undefined ? "no data" : format(v)}`}>
                  <div className="h-3.5 flex-1">
                    {v !== null && v !== undefined && (
                      <div className="h-full rounded-r" style={{ width: `${Math.max(1.5, (v / top) * 100)}%`, background: SERIES[k] }} />
                    )}
                  </div>
                  <span className="w-11 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700">
                    {v === null || v === undefined ? "-" : format(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Vertical columns for an ordered category (e.g. match-score bucket -> average rating).
export function Columns({ items, max, format = (v) => v, height = 180, color = SERIES[0] }) {
  const valid = items.filter((i) => i.value !== null && i.value !== undefined);
  if (!valid.length) return <p className="py-6 text-center text-sm text-slate-400">No data yet</p>;
  const top = max ?? Math.max(...valid.map((i) => i.value));
  return (
    <div>
      <div className="flex items-end gap-3 border-b border-slate-200 px-2" style={{ height }}>
        {items.map((i) => (
          <div key={i.label} className="flex h-full flex-1 flex-col items-center justify-end"
            title={`${i.label}: ${i.value === null || i.value === undefined ? "no data" : format(i.value)}${i.note ? ` (${i.note})` : ""}`}>
            <span className="mb-1 text-xs font-semibold tabular-nums text-slate-700">
              {i.value === null || i.value === undefined ? "" : format(i.value)}
            </span>
            {i.value !== null && i.value !== undefined && (
              <div className="w-full max-w-[24px] rounded-t" style={{ height: `${(i.value / top) * (height - 28)}px`, background: color }} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 px-2 pt-2">
        {items.map((i) => (
          <div key={i.label} className="flex-1 text-center">
            <p className="text-xs font-medium text-slate-600">{i.label}</p>
            {i.note && <p className="text-[11px] text-slate-400">{i.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Meter({ value, className }) {
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <div className={cx("h-1.5 w-full rounded-full bg-slate-100", className)}>
      <div className="h-full rounded-full bg-brand-500" style={{ width: `${v * 100}%` }} />
    </div>
  );
}
