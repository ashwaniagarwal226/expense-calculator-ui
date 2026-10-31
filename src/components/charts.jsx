import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell, LabelList,
} from "recharts";
import { compact, money } from "../api";

const TOKENS = ["--series-1", "--series-2", "--series-3", "--series-4", "--muted", "--surface", "--grid"];

/** Reads chart colours from CSS tokens so charts follow light/dark mode. */
export function useChartColors() {
  const read = () => {
    const s = getComputedStyle(document.documentElement);
    return Object.fromEntries(TOKENS.map((t) => [t.slice(2), s.getPropertyValue(t).trim()]));
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setColors(read());
    mq.addEventListener("change", update);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { mq.removeEventListener("change", update); obs.disconnect(); };
  }, []);
  return colors;
}

export function ChartTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="t">{labelFormatter ? labelFormatter(label, payload) : label}</div>
      {payload.map((p) => (
        <div className="row" key={p.dataKey}>
          <span><i style={{ background: p.color || p.fill }} />{p.name}</span>
          <b className="num">{money(p.value)}</b>
        </div>
      ))}
    </div>
  );
}

/** One series -> one colour. Bars sorted by amount, value label at the bar end. */
export function CategoryBars({ data, onSelect, selected }) {
  const c = useChartColors();
  const rows = data.slice(0, 10).map((d) => ({ ...d, label: `${d.icon || ""} ${d.name}` }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }} barCategoryGap={6}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={170} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--accent-wash)" }} />
        <Bar isAnimationActive={false} dataKey="amount" name="Spent" radius={[0, 4, 4, 0]} maxBarSize={18}
             onClick={(d) => onSelect?.(d.code)} style={{ cursor: onSelect ? "pointer" : "default" }}>
          {rows.map((r) => (
            <Cell key={r.code} fill={c["series-1"]} fillOpacity={!selected || selected === r.code ? 1 : 0.35} />
          ))}
          <LabelList dataKey="amount" position="right" formatter={compact} style={{ fill: c.muted, fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Expenses vs income per month (same unit, one axis). */
export function TrendChart({ months, onSelect }) {
  const c = useChartColors();
  const rows = [...months].slice(0, 12).reverse().map((m) => ({
    key: `${m.year}-${m.month}`,
    label: `${m.label.slice(0, 3)} ${String(m.year).slice(2)}`,
    Expenses: Number(m.expenses),
    Income: Number(m.income),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}
                onClick={(e) => e?.activeTooltipIndex != null && onSelect?.(rows.length - 1 - e.activeTooltipIndex)}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} interval="preserveStartEnd" minTickGap={8} />
        <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "var(--ink-2)" }}>{v}</span>} />
        <Bar isAnimationActive={false} dataKey="Expenses" fill={c["series-1"]} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar isAnimationActive={false} dataKey="Income" fill={c["series-2"]} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekdayChart({ values }) {
  const c = useChartColors();
  const rows = values.map((v, i) => ({ day: WEEKDAYS[i], Spent: Number(v) }));
  const max = Math.max(...rows.map((r) => r.Spent));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} />
        <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
        <Tooltip content={<ChartTooltip />} />
        <Bar isAnimationActive={false} dataKey="Spent" fill={c["series-1"]} radius={[4, 4, 0, 0]} maxBarSize={28}>
          {/* label only the peak day */}
          <LabelList dataKey="Spent" position="top"
                     content={({ x, y, width, value }) => value === max && value > 0 ? (
                       <text x={x + width / 2} y={y - 6} textAnchor="middle" fill={c.muted} fontSize={12}>{compact(value)}</text>
                     ) : null} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Two-part meter with text labels (aqua/yellow need visible labels for contrast). */
export function SplitMeter({ parts }) {
  const total = parts.reduce((s, p) => s + Number(p.value || 0), 0) || 1;
  return (
    <div>
      <div className="meter" role="img"
           aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(", ")}>
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${(Number(p.value) / total) * 100}%`, background: `var(${p.token})` }} />
        ))}
      </div>
      <div className="legend">
        {parts.map((p) => (
          <span key={p.label}>
            <i style={{ background: `var(${p.token})` }} />
            {p.label} <b className="num">{money(p.value)}</b> ({Math.round((Number(p.value) / total) * 100)}%)
          </span>
        ))}
      </div>
    </div>
  );
}
