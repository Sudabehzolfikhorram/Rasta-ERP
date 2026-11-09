import * as React from "react";
import { cn, toFa } from "@/lib/utils";

export function useSize<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

const fa1 = (v: number, d = 1) => toFa(String(+v.toFixed(d))).replace(".", "٫");
let uid = 0;
const useId = () => React.useMemo(() => `c${++uid}`, []);

export function Spark({ data, className }: { data: readonly number[]; className?: string }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${100 - (i / (data.length - 1)) * 100},${26 - ((v - min) / (max - min || 1)) * 22}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Smooth path through points (monotone-ish cubic). */
function smooth(p: [number, number][]) {
  if (p.length < 2) return "";
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i - 1] ?? p[i], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2] ?? p[i + 1];
    const t = 0.18;
    d += ` C${x1 + (x2 - x0) * t},${y1 + (y2 - y0) * t} ${x2 - (x3 - x1) * t},${y2 - (y3 - y1) * t} ${x2},${y2}`;
  }
  return d;
}

/** KPI trend: a soft area rising toward "today" at the end side, with a hover readout. Time runs right to left. */
export function TrendArea({ data, tone = "primary", fmt, labelFor, className }: { data: readonly number[]; tone?: "primary" | "ai"; fmt: (v: number) => string; labelFor: (i: number) => string; className?: string }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const [hv, setHv] = React.useState<number | null>(null);
  const id = useId();
  const n = data.length;
  const min = Math.min(...data), max = Math.max(...data);
  const H = Math.max(h, 40);
  const x = (i: number) => w - (i / (n - 1)) * w;
  const y = (v: number) => 6 + (1 - (v - min) / (max - min || 1)) * (H - 12);
  const pts = data.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smooth(pts);
  const col = `hsl(var(--${tone}))`;
  return (
    <div ref={ref} className={cn("relative", className)}>
      {w > 0 && (
        <svg width={w} height={H} className="absolute inset-0 block overflow-visible" role="img" aria-label="روند ۳۰ روز گذشته"
          onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.round(((w - (e.clientX - r.left)) / w) * (n - 1)); setHv(Math.min(Math.max(i, 0), n - 1)); }}
          onPointerLeave={() => setHv(null)}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={col} stopOpacity="0.22" />
              <stop offset="100%" stopColor={col} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="70%" stopColor="#fff" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id={`${id}k`}><rect width={w} height={H} fill={`url(#${id}m)`} /></mask>
          </defs>
          <g mask={`url(#${id}k)`}>
            <path d={`${line} L${x(n - 1)},${H} L${x(0)},${H} Z`} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" />
          </g>
          {hv !== null && (
            <g pointerEvents="none">
              <line x1={x(hv)} x2={x(hv)} y1={0} y2={H} stroke="hsl(var(--foreground))" strokeOpacity=".25" strokeDasharray="3 4" />
              <circle cx={x(hv)} cy={y(data[hv])} r="4" fill={col} stroke="hsl(var(--surface))" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
      {hv !== null && w > 0 && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-border bg-popover px-2.5 py-1.5 text-[12px] shadow-lift"
          style={{ left: Math.min(Math.max(x(hv), 56), w - 56), top: Math.max(y(data[hv]) - 52, -8) }}>
          <b className="num">{fmt(data[hv])}</b>
          <div className="text-[11px] text-muted-foreground">{labelFor(hv)}</div>
        </div>
      )}
    </div>
  );
}

const AXIS = 34;

/** Cash: actual line (primary), forecast dashed (AI), dip marker. Time runs right to left. */
export function CashChart({ actual: a0, forecast: f0, todayDay = 17, scale = 1, unit = "ریال", minH = 220 }: { actual: number[]; forecast: number[]; todayDay?: number; scale?: number; unit?: string; minH?: number }) {
  const [ref, { w: W, h: measuredH }] = useSize<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);
  const id = useId();
  const H = Math.max(measuredH, minH);
  const actual = a0.map((v) => v * scale), forecast = f0.map((v) => v * scale);
  const step = scale < 1 ? 0.4 : 4;
  const all = [...actual, ...forecast];
  const lo = Math.floor((Math.min(...all) - step / 4) / step) * step, hi = Math.ceil((Math.max(...all) + step / 4) / step) * step;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => +(lo + i * step).toFixed(1));
  const n = actual.length + forecast.length - 2;
  const plotW = Math.max(W - AXIS, 10);
  const x = (i: number) => W - 8 - (i / n) * (plotW - 8);
  const y = (v: number) => 12 + (1 - (v - lo) / (hi - lo)) * (H - 40);
  const now = actual.length - 1;
  const series = [...actual, ...forecast.slice(1)];
  const pts = (from: number, vals: number[]) => vals.map((v, i) => `${x(from + i)},${y(v)}`).join(" ");
  const dipI = now + forecast.indexOf(Math.min(...forecast));
  const day = (i: number) => todayDay - now + i;
  const dayLabel = (i: number) => { const d = day(i); return d > 30 ? `${toFa(d - 30)} آذر` : `${toFa(d)} آبان`; };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((W - 8 - (e.clientX - r.left)) / (plotW - 8)) * n);
    setHover(i >= 0 && i <= n ? i : null);
  };
  const hv = hover;
  return (
    <div ref={ref} className="relative mt-3 w-full flex-1" style={{ minHeight: minH }}>
      {W > 0 && (
        <svg width={W} height={H} className="absolute inset-0 block touch-none" role="img" aria-label="نقدینگی: ۱۲ روز گذشته و پیش‌بینی ۱۲ روز آینده" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--ai))" stopOpacity="0.12" />
              <stop offset="100%" stopColor="hsl(var(--ai))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={AXIS} x2={W} y1={y(t)} y2={y(t)} stroke="hsl(var(--border))" strokeDasharray={t === lo ? undefined : "2 6"} />
              <text x={AXIS - 8} y={y(t) + 4} fontSize="11" textAnchor="end" fill="hsl(var(--muted-foreground))" className="num">{fa1(t)}</text>
            </g>
          ))}
          <rect x={AXIS} y="4" width={Math.max(x(now) - AXIS, 0)} height={H - 32} fill="hsl(var(--ai) / 0.05)" rx="8" />
          <polygon points={`${x(0)},${y(lo)} ${pts(0, actual)} ${x(now)},${y(lo)}`} fill={`url(#${id}a)`} />
          <polygon points={`${x(now)},${y(lo)} ${pts(now, forecast)} ${x(n)},${y(lo)}`} fill={`url(#${id}f)`} />
          <polyline points={pts(0, actual)} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={pts(now, forecast)} fill="none" stroke="hsl(var(--ai))" strokeWidth="2.4" strokeDasharray="5 6" strokeLinejoin="round" strokeLinecap="round" />
          <line x1={x(now)} x2={x(now)} y1="4" y2={H - 28} stroke="hsl(var(--foreground))" strokeOpacity=".25" />
          {[0, 4, now, now + 4, n].map((i) => (
            <text key={i} x={x(i)} y={H - 8} fontSize="11" textAnchor={i === 0 ? "start" : i === n ? "end" : "middle"} fill="hsl(var(--muted-foreground))" fontWeight={i === now ? 700 : 400}>
              {i === now ? "امروز" : dayLabel(i)}
            </text>
          ))}
          <circle cx={x(dipI)} cy={y(series[dipI])} r="5.5" fill="hsl(var(--surface))" stroke="hsl(var(--warning))" strokeWidth="2.4" />
          <circle cx={x(now)} cy={y(actual[now])} r="5" fill="hsl(var(--primary))" stroke="hsl(var(--surface))" strokeWidth="2.5" />
          {hv !== null && (
            <g pointerEvents="none">
              <line x1={x(hv)} x2={x(hv)} y1="4" y2={H - 28} stroke="hsl(var(--ring))" strokeOpacity=".5" />
              <circle cx={x(hv)} cy={y(series[hv])} r="4.5" fill={hv > now ? "hsl(var(--ai))" : "hsl(var(--primary))"} stroke="hsl(var(--surface))" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
      {hv !== null && W > 0 && (
        <div className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-xl border border-border bg-popover px-3 py-2 text-[12px] shadow-lift"
          style={{ left: Math.min(Math.max(x(hv), 80), W - 80), top: Math.max(y(series[hv]) - 64, 0) }}>
          <div className="text-muted-foreground">{hv === now ? "امروز" : dayLabel(hv)} · {hv > now ? "پیش‌بینی" : "واقعی"}</div>
          <b className="num text-[13.5px]">{fa1(series[hv], 2)} میلیارد {unit}</b>
        </div>
      )}
    </div>
  );
}

/** Waterfall: how a total is built. Values in billions. Positive = primary, negative = muted slate, total = AI. */
export function Waterfall({ items, total, unit, zoom }: { items: [string, number][]; total: string; unit: string; zoom?: boolean }) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const H = 260, top = 18, bottom = 46;
  let run = 0;
  const bars = items.map(([l, v]) => { const from = run; run += v; return { l, v, from, to: run }; });
  const all = [0, ...bars.flatMap((b) => [b.from, b.to])];
  const max = Math.max(...all);
  // zoomed bridges (opening balance first) start the axis near the lowest running total, so small moves stay visible
  const min = zoom ? Math.min(...bars.slice(1).flatMap((b) => [b.from, b.to]), run) * 0.94 : Math.min(...all);
  const y = (v: number) => Math.min(H - bottom, top + (1 - (v - min) / (max - min || 1)) * (H - top - bottom));
  const cols = bars.length + 1;
  const bw = w / cols;
  const xAt = (i: number) => w - (i + 1) * bw; // RTL: first bar on the right
  return (
    <div ref={ref} className="w-full" style={{ height: H }}>
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label="نمودار آبشاری">
          <defs>
            <linearGradient id="wf-pos" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="hsl(var(--ch-1))" /><stop offset="1" stopColor="hsl(var(--ch-4))" /></linearGradient>
            <pattern id="wf-neg" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="hsl(var(--ch-6) / .35)" /><rect width="3" height="6" fill="hsl(var(--ch-6) / .6)" /></pattern>
            <linearGradient id="wf-tot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="hsl(var(--ch-2))" /><stop offset="1" stopColor="hsl(var(--ai))" /></linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} x2={w} y1={top + f * (H - top - bottom)} y2={top + f * (H - top - bottom)} stroke="hsl(var(--border))" strokeOpacity=".6" strokeDasharray="3 4" />)}
          <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="hsl(var(--border))" />
          {bars.map((b, i) => (
            <g key={b.l}>
              <rect x={xAt(i) + bw * 0.18} width={bw * 0.64} y={Math.min(y(b.from), y(b.to))} height={Math.max(Math.abs(y(b.from) - y(b.to)), 2)} rx="6"
                fill={b.v >= 0 ? "url(#wf-pos)" : "url(#wf-neg)"} />
              {i < bars.length - 1 && <line x1={xAt(i) + bw * 0.18} x2={xAt(i + 1) + bw * 0.82} y1={y(b.to)} y2={y(b.to)} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 3" strokeOpacity=".6" />}
              <text x={xAt(i) + bw / 2} y={Math.min(y(b.from), y(b.to)) - 6} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="hsl(var(--foreground))" className="num">{b.v > 0 ? fa1(b.v, 2) : `(${fa1(-b.v, 2)})`}</text>
              <text x={xAt(i) + bw / 2} y={H - 26} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">{b.l}</text>
            </g>
          ))}
          <rect x={xAt(bars.length) + bw * 0.18} width={bw * 0.64} y={Math.min(y(0), y(run))} height={Math.abs(y(0) - y(run))} rx="6" fill="url(#wf-tot)" />
          <text x={xAt(bars.length) + bw / 2} y={y(run) - 6} textAnchor="middle" fontSize="12" fontWeight="800" fill="hsl(var(--ai-ink))" className="num">{fa1(run, 2)}</text>
          <text x={xAt(bars.length) + bw / 2} y={H - 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--foreground))">{total}</text>
          <text x={w} y={H - 6} textAnchor="start" fontSize="10.5" fill="hsl(var(--muted-foreground))">میلیارد {unit}</text>
        </svg>
      )}
    </div>
  );
}

/** Squarified treemap: solid, harmonious tiles; labels only where they fit, with a ranked legend beside it. */
type Rect = { x: number; y: number; w: number; h: number };
function squarify(values: number[], r: Rect): Rect[] {
  const out: Rect[] = [];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const scaled = values.map((v) => (v / total) * r.w * r.h);
  let rect = { ...r };
  let i = 0;
  const worst = (row: number[], side: number) => {
    const s = row.reduce((a, b) => a + b, 0), mx = Math.max(...row), mn = Math.min(...row);
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  while (i < scaled.length) {
    const side = Math.min(rect.w, rect.h);
    const row = [scaled[i]];
    let j = i + 1;
    while (j < scaled.length && worst([...row, scaled[j]], side) <= worst(row, side)) { row.push(scaled[j]); j++; }
    const s = row.reduce((a, b) => a + b, 0);
    if (rect.w >= rect.h) {
      const cw = s / rect.h; let y = rect.y;
      for (const v of row) { const h = v / cw; out.push({ x: rect.x, y, w: cw, h }); y += h; }
      rect = { x: rect.x + cw, y: rect.y, w: rect.w - cw, h: rect.h };
    } else {
      const rh = s / rect.w; let x = rect.x;
      for (const v of row) { const w = v / rh; out.push({ x, y: rect.y, w, h: rh }); x += w; }
      rect = { x: rect.x, y: rect.y + rh, w: rect.w, h: rect.h - rh };
    }
    i = j;
  }
  return out;
}
const TM = ["--ch-1", "--ch-2", "--ch-3", "--ch-4", "--ch-5", "--ch-6"];
export function Treemap({ items, unit, onPick, height = 280, legend = true }: { items: [string, number][]; unit: string; onPick?: (l: string) => void; height?: number; legend?: boolean }) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const sorted = [...items].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  const rects = w > 0 ? squarify(sorted.map(([, v]) => v), { x: 0, y: 0, w, h: height }) : [];
  return (
    <div className={cn("grid gap-5", legend && "lg:grid-cols-[1fr_220px]")}>
      <div ref={ref} className="relative w-full" style={{ height }}>
        {rects.map((r, i) => {
          const [l, v] = sorted[i];
          const c = TM[i % TM.length];
          const big = r.w > 96 && r.h > 56, mid = r.w > 54 && r.h > 34;
          return (
            <button key={l} onClick={() => onPick?.(l)} title={`${l} · ${toFa(Math.round((v / total) * 100))}٪ · ${fa1(v, 2)} ${unit}`}
              className="absolute overflow-hidden rounded-[14px] p-3 text-start transition-[filter] hover:brightness-110"
              style={{ right: r.x + 2, top: r.y + 2, width: Math.max(r.w - 4, 0), height: Math.max(r.h - 4, 0), color: "hsl(var(--tm-ink))",
                background: `linear-gradient(150deg, hsl(var(${c})) 0%, hsl(var(${c}) / .78) 100%)`, boxShadow: "inset 0 1px 0 rgb(255 255 255 / .25)" }}>
              {mid && <div className="num text-[15px] font-extrabold leading-none">{toFa(Math.round((v / total) * 100))}٪</div>}
              {big && <div className="mt-1.5 truncate text-[12.5px] font-bold opacity-95">{l}</div>}
              {big && r.h > 84 && <div className="num truncate text-[11px] opacity-80">{fa1(v, 2)} {unit}</div>}
            </button>
          );
        })}
      </div>
      {legend && <ul className="flex flex-col gap-1.5 self-center">
        {sorted.map(([l, v], i) => (
          <li key={l} className="flex items-center gap-2 text-[12.5px]">
            <i className="size-2.5 shrink-0 rounded-[4px]" style={{ background: `hsl(var(${TM[i % TM.length]}))` }} />
            <span className="min-w-0 flex-1 truncate">{l}</span>
            <b className="num">{toFa(Math.round((v / total) * 100))}٪</b>
          </li>
        ))}
      </ul>}
    </div>
  );
}

/** Horizontal stacked bars (aging). */
export function StackBars({ rows, keys, colors }: { rows: { label: string; values: number[] }[]; keys: string[]; colors: string[] }) {
  const max = Math.max(...rows.map((r) => r.values.reduce((a, b) => a + b, 0)));
  const sums = keys.map((_, i) => rows.reduce((a, r) => a + (r.values[i] ?? 0), 0));
  const all = sums.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex flex-col gap-4">
      {/* overall split first: one wide strip with a share per bucket */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {keys.map((k, i) => (
          <div key={k} className="rounded-field border border-border bg-surface/60 p-2.5">
            <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground"><i className="size-2.5 rounded-sm" style={{ background: `hsl(var(${colors[i]}))` }} />{k}</div>
            <div className="num mt-1 text-[16px] font-extrabold">{toFa(Math.round((sums[i] / all) * 100))}٪</div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${(sums[i] / all) * 100}%`, background: `hsl(var(${colors[i]}))` }} /></div>
          </div>
        ))}
      </div>
      {rows.map((r) => {
        const sum = r.values.reduce((a, b) => a + b, 0);
        return (
          <div key={r.label} className="grid grid-cols-[110px_1fr_64px] items-center gap-3 text-[12.5px]">
            <span className="truncate font-semibold">{r.label}</span>
            <div className="flex h-6 gap-[3px]" style={{ width: `${(sum / max) * 100}%` }}>
              {r.values.map((v, i) => v > 0 && <span key={i} title={`${keys[i]}: ${fa1(v, 2)}`} className="rounded-[6px]" style={{ width: `${(v / sum) * 100}%`, background: `hsl(var(${colors[i]}))` }} />)}
            </div>
            <b className="num text-start">{fa1(sum, 2)}</b>
          </div>
        );
      })}
    </div>
  );
}

/** Grouped vertical bars: two periods side by side. */
export function PairBars({ items, keys }: { items: { label: string; a: number; b: number }[]; keys: [string, string] }) {
  const max = Math.max(...items.flatMap((i) => [i.a, i.b])) * 1.12;
  return (
    <div>
      <div className="mb-3 flex gap-4 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-ch-6/60" />{keys[0]}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: "linear-gradient(180deg, hsl(var(--ch-1)), hsl(var(--ch-4)))" }} />{keys[1]}</span>
      </div>
      <div className="relative flex h-[230px] items-end gap-3 border-b border-border" style={{ backgroundImage: "linear-gradient(hsl(var(--border) / .6) 1px, transparent 1px)", backgroundSize: "100% 25%" }}>
        {items.map((it) => {
          const d = it.a ? Math.round(((it.b - it.a) / it.a) * 100) : 0;
          return (
            <div key={it.label} className="flex h-full flex-1 flex-col justify-end">
              <div className="flex flex-1 items-end justify-center gap-1">
                <span className="w-[30%] max-w-6 rounded-t-[7px] bg-ch-6/45 transition-[height] duration-500" style={{ height: `${(it.a / max) * 100}%` }} title={`${keys[0]}: ${fa1(it.a, 2)}`} />
                <span className="relative w-[30%] max-w-6 rounded-t-[7px] transition-[height] duration-500" style={{ height: `${(it.b / max) * 100}%`, background: "linear-gradient(180deg, hsl(var(--ch-1)), hsl(var(--ch-4)))" }} title={`${keys[1]}: ${fa1(it.b, 2)}`}>
                  <b className="num absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10.5px] text-muted-foreground">{d > 0 ? "+" : d < 0 ? "−" : ""}{toFa(Math.abs(d))}٪</b>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3">
        {items.map((it) => <span key={it.label} className="flex-1 truncate text-center text-[11px] text-muted-foreground" title={it.label}>{it.label}</span>)}
      </div>
    </div>
  );
}

/** Ring progress. */
export function Ring({ value, size = 92, stroke = 9, tone = "ai", children }: { value: number; size?: number; stroke?: number; tone?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`hsl(var(--${tone}))`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** Horizontal bars for a ranked list (trial balance, top accounts). */
export function RankBars({ items }: { items: [string, number][] }) {
  const max = Math.max(...items.map(([, v]) => Math.abs(v)));
  const total = items.reduce((a, [, v]) => a + Math.max(v, 0), 0) || 1;
  return (
    <ul className="flex flex-col gap-3">
      {items.map(([l, v], i) => (
        <li key={l} className="grid grid-cols-[22px_130px_1fr_auto] items-center gap-3 text-[12.5px]">
          <span className="num grid size-[22px] place-items-center rounded-[7px] bg-muted text-[11px] font-bold text-muted-foreground">{toFa(i + 1)}</span>
          <span className="truncate font-semibold" title={l}>{l}</span>
          <span className="relative h-3 rounded-full bg-muted/70">
            <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(Math.abs(v) / max) * 100}%`,
              background: v < 0 ? "repeating-linear-gradient(135deg, hsl(var(--ch-6) / .7) 0 4px, hsl(var(--ch-6) / .35) 4px 8px)" : `linear-gradient(270deg, hsl(var(--ch-${(i % 4) + 1})), hsl(var(--ch-${(i % 4) + 1}) / .55))` }} />
          </span>
          <span className="flex min-w-[96px] items-baseline justify-end gap-1.5 whitespace-nowrap">
            <b className="num">{v < 0 ? `(${fa1(-v, 2)})` : fa1(v, 2)}</b>
            {v > 0 && <span className="num text-[11px] text-muted-foreground">{toFa(Math.round((v / total) * 100))}٪</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Donut with a legend; values are counts or shares. */
export function Donut({ items, size = 132, center }: { items: { label: string; value: number; color: string }[]; size?: number; center?: React.ReactNode }) {
  const total = items.reduce((a, x) => a + x.value, 0) || 1;
  const stroke = Math.round(size * 0.14), r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={items.map((x) => `${x.label} ${toFa(x.value)}`).join("، ")}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          {items.map((x) => {
            const len = (x.value / total) * c;
            const el = <circle key={x.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`hsl(var(${x.color}))`} strokeWidth={stroke} strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-off} />;
            off += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
      </div>
      <ul className="flex min-w-[140px] flex-1 flex-col gap-2 text-[12.5px]">
        {items.map((x) => (
          <li key={x.label} className="flex items-center gap-2">
            <i className="size-2.5 shrink-0 rounded-sm" style={{ background: `hsl(var(${x.color}))` }} />
            <span className="flex-1 truncate">{x.label}</span>
            <b className="num">{toFa(x.value)}</b>
            <span className="num w-10 text-end text-muted-foreground">{toFa(Math.round((x.value / total) * 100))}٪</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Simple vertical columns with labels under each bar (activity per day). */
export function Columns({ items, height = 160, color = "--ch-1", highlight }: { items: { label: string; value: number }[]; height?: number; color?: string; highlight?: number }) {
  const max = Math.max(...items.map((x) => x.value), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5 border-b border-border" style={{ height }}>
        {items.map((x, i) => (
          <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
            <span className="num pointer-events-none absolute inset-x-0 -top-0 text-center text-[10.5px] font-bold opacity-0 transition-opacity group-hover:opacity-100" style={{ top: `${(1 - x.value / max) * 100 - 12}%` }}>{toFa(x.value)}</span>
            <span className="mx-auto w-full max-w-6 rounded-t-[5px] transition-[height] duration-500" style={{ height: `${(x.value / max) * 100}%`, minHeight: x.value ? 3 : 0, background: `hsl(var(${color}) / ${highlight === i ? 1 : 0.55})` }} title={`${x.label}: ${toFa(x.value)}`} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {items.map((x, i) => <span key={i} className={cn("num flex-1 truncate text-center text-[10.5px] text-muted-foreground", highlight === i && "font-bold text-foreground")}>{x.label}</span>)}
      </div>
    </div>
  );
}

/** Horizontal cash bridge: each step floats from where the previous one ended. Reads top to bottom like a statement. */
export function BridgeRows({ open, items, unit }: { open: number; items: [string, number][]; unit: string }) {
  let run = open;
  const steps = items.map(([l, v]) => { const from = run; run += v; return { l, v, from, to: run }; });
  const all = [open, ...steps.flatMap((s) => [s.from, s.to])];
  const lo = Math.min(...all) * 0.92, hi = Math.max(...all) * 1.02;
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const row = (label: string, from: number, to: number, kind: "total" | "in" | "out", value: string, key: string) => (
    <div key={key} className="grid grid-cols-[96px_minmax(0,1fr)_64px] items-center gap-3">
      <span className={cn("truncate text-[12.5px]", kind === "total" ? "font-bold" : "text-muted-foreground")}>{label}</span>
      <div className="relative h-6 rounded-md bg-muted/50">
        <span className="absolute inset-y-1 rounded-[5px] transition-all duration-700" style={{
          insetInlineStart: `${pct(Math.min(from, to))}%`, width: `${Math.max(pct(Math.max(from, to)) - pct(Math.min(from, to)), 1.2)}%`,
          background: kind === "total" ? "hsl(var(--primary))" : kind === "in" ? "hsl(var(--ch-2))" : "hsl(var(--ch-5) / .75)",
        }} />
      </div>
      <b className={cn("num text-end text-[12.5px]", kind === "out" && "text-muted-foreground")}>{value}</b>
    </div>
  );
  return (
    <div className="flex flex-col gap-2">
      {row("اول آبان", lo, open, "total", fa1(open), "open")}
      {steps.map((s) => row(s.l, s.from, s.to, s.v >= 0 ? "in" : "out", `${s.v >= 0 ? "+" : "−"}${fa1(Math.abs(s.v))}`, s.l))}
      {row("امروز", lo, run, "total", fa1(run), "close")}
      <span className="num text-[11px] text-muted-foreground">میلیارد {unit}</span>
    </div>
  );
}

/** Concentric radial bars: one ring per item, length = share of the largest. */
export function RadialBars({ items, size = 168, center }: { items: { label: string; value: number; color: string }[]; size?: number; center?: React.ReactNode }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const gap = 4, stroke = Math.max(7, (size / 2 - 26) / items.length - gap);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={items.map((i) => `${i.label}: ${fa1(i.value)}`).join("، ")}>
        {items.map((it, k) => {
          const r = size / 2 - stroke / 2 - k * (stroke + gap);
          const c = 2 * Math.PI * r, f = (it.value / max) * 0.75;
          return (
            <g key={it.label}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} strokeDasharray={`${c * 0.75} ${c}`} strokeLinecap="round" />
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`hsl(var(${it.color}))`} strokeWidth={stroke} strokeDasharray={`${c * f} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray .8s cubic-bezier(.16,1,.3,1)" }} />
            </g>
          );
        })}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}

/** Weekday × week heatmap; darker cell = more entries. */
export function Heatmap({ rows, cols, values }: { rows: string[]; cols: string[]; values: number[][] }) {
  const max = Math.max(...values.flat(), 1);
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `28px repeat(${cols.length}, minmax(0,1fr))` }}>
      <span />
      {cols.map((c) => <span key={c} className="num text-center text-[10.5px] text-muted-foreground">{c}</span>)}
      {rows.map((r, i) => (
        <React.Fragment key={r}>
          <span className="text-[10.5px] leading-6 text-muted-foreground">{r}</span>
          {values[i].map((v, j) => (
            <span key={j} title={`${r}، ${cols[j]}: ${toFa(v)} سند`} className="h-6 rounded-[5px] transition-colors"
              style={{ background: v ? `hsl(var(--ch-1) / ${0.12 + (v / max) * 0.78})` : "hsl(var(--muted) / .7)" }} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Small column chart for stat cards: muted history, the current period in full colour. */
export function MiniBars({ data, color = "--ch-1", className }: { data: readonly number[]; color?: string; className?: string }) {
  const max = Math.max(...data, 1), min = Math.min(...data) * 0.7;
  return (
    <div className={cn("flex h-12 items-end gap-[3px]", className)} aria-hidden>
      {data.map((v, i) => (
        <span key={i} className="flex-1 rounded-t-[3px]" style={{ height: `${((v - min) / (max - min || 1)) * 85 + 15}%`, background: `hsl(var(${color}) / ${i === data.length - 1 ? 1 : 0.28})` }} />
      ))}
    </div>
  );
}

/** Half-ring composition: the largest share starts on the right (reading start), small shares stay visible as slim arcs.
    Hovering a segment or a legend row highlights the pair. */
const VIZ = ["--viz-1", "--viz-2", "--viz-3", "--viz-4", "--viz-5", "--viz-6", "--viz-7"];
export function ArcMix({ items, unit, total: totalLabel, onPick }: { items: [string, number][]; unit: string; total: React.ReactNode; onPick?: (l: string) => void }) {
  const [hot, setHot] = React.useState<number | null>(null);
  const sorted = [...items].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
  const W = 260, R = 104, cx = W / 2, cy = 116, sw = 26, gap = 0.022;
  const pt = (t: number, r = R) => [cx + r * Math.cos(t), cy - r * Math.sin(t)].map((n) => n.toFixed(2)).join(" ");
  let t0 = 0;
  const segs = sorted.map(([l, v], i) => {
    const span = (v / total) * Math.PI;
    const a = t0 + (i ? gap / 2 : 0), b = t0 + span - (i < sorted.length - 1 ? gap / 2 : 0);
    t0 += span;
    return { l, v, i, d: `M ${pt(a)} A ${R} ${R} 0 0 0 ${pt(Math.max(b, a + 0.004))}` };
  });
  const pc = (v: number) => { const p = (v / total) * 100; return p < 10 ? fa1(p, 1) : toFa(Math.round(p)); };
  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto w-full max-w-[300px]">
        {/* angle 0 is the right end, so the largest share starts where an RTL reader starts */}
        <svg viewBox={`0 0 ${W} ${cy + 4}`} className="w-full overflow-visible" role="img" aria-label={sorted.map(([l, v]) => `${l} ${pc(v)}٪`).join("، ")}>
          <path d={`M ${pt(0)} A ${R} ${R} 0 0 0 ${pt(Math.PI)}`} fill="none" stroke="hsl(var(--muted))" strokeWidth={sw} />
          {segs.map((s) => (
            <path key={s.l} d={s.d} fill="none" stroke={`hsl(var(${VIZ[s.i % VIZ.length]}))`} strokeWidth={hot === s.i ? sw + 6 : sw}
              opacity={hot === null || hot === s.i ? 1 : 0.35} className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHot(s.i)} onMouseLeave={() => setHot(null)} onClick={() => onPick?.(s.l)} />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
          {hot === null ? totalLabel : (
            <>
              <b className="num block text-[22px] leading-none">{pc(sorted[hot][1])}٪</b>
              <span className="mt-1 block truncate px-12 text-[12px] text-muted-foreground">{sorted[hot][0]}</span>
            </>
          )}
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {sorted.map(([l, v], i) => (
          <li key={l}>
            <button onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} onClick={() => onPick?.(l)}
              className={cn("flex w-full items-center gap-2 rounded-[8px] px-1.5 py-1 text-start text-[12.5px] transition-colors hover:bg-muted", hot === i && "bg-muted")}>
              <i className="h-3 w-1.5 shrink-0 rounded-full" style={{ background: `hsl(var(${VIZ[i % VIZ.length]}))` }} />
              <span className="min-w-0 flex-1 truncate">{l}</span>
              <span className="num text-[11.5px] text-muted-foreground">{fa1(v, 2)}</span>
              <b className="num w-9 text-end">{pc(v)}٪</b>
            </button>
          </li>
        ))}
      </ul>
      <span className="sr-only">{unit}</span>
    </div>
  );
}

/** Weekday × week activity as a dot matrix: dot size and colour both grow with the count, the number sits inside,
    an empty day is a faint ring, and a slim bar on the end totals each weekday. */
export function DotMatrix({ rows, cols, values, mark }: { rows: string[]; cols: string[]; values: number[][]; mark?: [number, number] }) {
  const max = Math.max(...values.flat(), 1);
  const lvl = (v: number) => (v <= 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));
  const sums = values.map((r) => r.reduce((a, v) => a + v, 0));
  const top = Math.max(...sums, 1);
  return (
    <div>
      <div className="grid items-center gap-x-1.5 gap-y-1" style={{ gridTemplateColumns: `30px repeat(${cols.length}, minmax(0,1fr)) 52px` }}>
        <span />
        {cols.map((c) => <span key={c} className="num truncate text-center text-[10.5px] text-muted-foreground">{c}</span>)}
        <span className="text-center text-[10.5px] text-muted-foreground">جمع</span>
        {rows.map((r, i) => (
          <React.Fragment key={r}>
            <span className="text-[11px] text-muted-foreground">{r}</span>
            {values[i].map((v, j) => {
              const l = lvl(v), size = l ? 12 + l * 3.5 : 7, here = mark && mark[0] === i && mark[1] === j;
              return (
                <span key={j} title={`${r}، ${cols[j]}: ${toFa(v)} سند`} className="grid h-7 place-items-center">
                  <span className={cn("num grid place-items-center rounded-full text-[10px] font-bold transition-transform hover:scale-110", here && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-surface")}
                    style={{ width: size, height: size, background: l ? `hsl(var(--heat-${l}))` : "transparent", boxShadow: l ? undefined : "inset 0 0 0 1.5px hsl(var(--border))", color: l >= 3 ? "white" : "hsl(var(--foreground))" }}>
                    {l >= 2 ? toFa(v) : ""}
                  </span>
                </span>
              );
            })}
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full" style={{ width: `${(sums[i] / top) * 100}%`, background: "hsl(var(--heat-3))" }} /></span>
              <b className="num w-4 text-end text-[11px]">{toFa(sums[i])}</b>
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10.5px] text-muted-foreground">
        کم
        <i className="size-[7px] rounded-full" style={{ boxShadow: "inset 0 0 0 1.5px hsl(var(--border))" }} />
        {[1, 2, 3, 4].map((l) => <i key={l} className="rounded-full" style={{ width: 8 + l * 2, height: 8 + l * 2, background: `hsl(var(--heat-${l}))` }} />)}
        زیاد
      </div>
    </div>
  );
}
