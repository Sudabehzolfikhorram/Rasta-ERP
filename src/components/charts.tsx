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
export function Waterfall({ items, total, unit }: { items: [string, number][]; total: string; unit: string }) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const H = 260, top = 18, bottom = 46;
  let run = 0;
  const bars = items.map(([l, v]) => { const from = run; run += v; return { l, v, from, to: run }; });
  const all = [0, ...bars.flatMap((b) => [b.from, b.to])];
  const max = Math.max(...all), min = Math.min(...all);
  const y = (v: number) => top + (1 - (v - min) / (max - min || 1)) * (H - top - bottom);
  const cols = bars.length + 1;
  const bw = w / cols;
  const xAt = (i: number) => w - (i + 1) * bw; // RTL: first bar on the right
  return (
    <div ref={ref} className="w-full" style={{ height: H }}>
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label="نمودار آبشاری">
          <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="hsl(var(--border))" />
          {bars.map((b, i) => (
            <g key={b.l}>
              <rect x={xAt(i) + bw * 0.18} width={bw * 0.64} y={Math.min(y(b.from), y(b.to))} height={Math.max(Math.abs(y(b.from) - y(b.to)), 2)} rx="6"
                fill={b.v >= 0 ? "hsl(var(--primary))" : "hsl(var(--cat-6) / 0.55)"} />
              {i < bars.length - 1 && <line x1={xAt(i) + bw * 0.18} x2={xAt(i + 1) + bw * 0.82} y1={y(b.to)} y2={y(b.to)} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 3" strokeOpacity=".6" />}
              <text x={xAt(i) + bw / 2} y={Math.min(y(b.from), y(b.to)) - 6} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="hsl(var(--foreground))" className="num">{b.v > 0 ? fa1(b.v, 2) : `(${fa1(-b.v, 2)})`}</text>
              <text x={xAt(i) + bw / 2} y={H - 26} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">{b.l}</text>
            </g>
          ))}
          <rect x={xAt(bars.length) + bw * 0.18} width={bw * 0.64} y={Math.min(y(0), y(run))} height={Math.abs(y(0) - y(run))} rx="6" fill="hsl(var(--ai))" />
          <text x={xAt(bars.length) + bw / 2} y={y(run) - 6} textAnchor="middle" fontSize="12" fontWeight="800" fill="hsl(var(--ai-ink))" className="num">{fa1(run, 2)}</text>
          <text x={xAt(bars.length) + bw / 2} y={H - 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--foreground))">{total}</text>
          <text x={w} y={H - 6} textAnchor="start" fontSize="10.5" fill="hsl(var(--muted-foreground))">میلیارد {unit}</text>
        </svg>
      )}
    </div>
  );
}

/** Squarified-enough treemap (slice and dice by row). */
export function Treemap({ items, unit, onPick, height = 260 }: { items: [string, number][]; unit: string; onPick?: (l: string) => void; height?: number }) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const H = height;
  const sorted = [...items].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  // two rows: biggest ones on top
  const rows: [string, number][][] = [[], []];
  let acc = 0;
  for (const it of sorted) { (acc < total * 0.62 ? rows[0] : rows[1]).push(it); acc += it[1]; }
  const shades = ["--ch-1", "--ch-2", "--ch-3", "--ch-4", "--ch-5", "--ch-6", "--ch-1"];
  let k = 0;
  return (
    <div ref={ref} className="w-full" style={{ height: H }}>
      {w > 0 && rows.map((row, ri) => {
        const rs = row.reduce((s, [, v]) => s + v, 0);
        const rh = (rs / total) * H;
        let x = 0;
        return (
          <div key={ri} className="relative" style={{ height: rh }}>
            {row.map(([l, v]) => {
              const cw = (v / rs) * w;
              const shade = shades[k++ % shades.length];
              const el = (
                <button key={l} onClick={() => onPick?.(l)} title={l}
                  className="absolute overflow-hidden rounded-xl border p-2.5 text-start text-foreground transition-[background-color] hover:brightness-[1.03]"
                  style={{ right: x + 2, width: cw - 4, top: 2, height: rh - 4, background: `hsl(var(${shade}) / 0.16)`, borderColor: `hsl(var(${shade}) / 0.35)`, boxShadow: `inset 3px 0 0 hsl(var(${shade}))` }}>
                  <div className="truncate text-[12.5px] font-bold">{l}</div>
                  {rh > 52 && cw > 64 && <div className="num truncate text-[11.5px] text-muted-foreground">{toFa(Math.round((v / total) * 100))}٪{cw > 170 ? ` · ${fa1(v, 2)} ${unit}` : ""}</div>}
                </button>
              );
              x += cw;
              return el;
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal stacked bars (aging). */
export function StackBars({ rows, keys, colors }: { rows: { label: string; values: number[] }[]; keys: string[]; colors: string[] }) {
  const max = Math.max(...rows.map((r) => r.values.reduce((a, b) => a + b, 0)));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3 text-[11.5px] text-muted-foreground">
        {keys.map((k, i) => <span key={k} className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: `hsl(var(${colors[i]}))` }} />{k}</span>)}
      </div>
      {rows.map((r) => {
        const sum = r.values.reduce((a, b) => a + b, 0);
        return (
          <div key={r.label} className="grid grid-cols-[110px_1fr_64px] items-center gap-3 text-[12.5px]">
            <span className="truncate font-semibold">{r.label}</span>
            <div className="flex h-5 overflow-hidden rounded-full bg-muted" style={{ width: `${(sum / max) * 100}%` }}>
              {r.values.map((v, i) => v > 0 && <span key={i} title={`${keys[i]}: ${fa1(v, 2)}`} style={{ width: `${(v / sum) * 100}%`, background: `hsl(var(${colors[i]}))` }} />)}
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
  const max = Math.max(...items.flatMap((i) => [i.a, i.b]));
  return (
    <div>
      <div className="mb-3 flex gap-4 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-ch-6" />{keys[0]}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-ch-1" />{keys[1]}</span>
      </div>
      <div className="flex h-[220px] items-end gap-3 border-b border-border">
        {items.map((it) => (
          <div key={it.label} className="flex h-full flex-1 flex-col justify-end">
            <div className="flex flex-1 items-end justify-center gap-1">
              <span className="w-1/3 max-w-5 rounded-t-md bg-ch-6 transition-[height] duration-500" style={{ height: `${(it.a / max) * 100}%` }} title={`${keys[0]}: ${fa1(it.a, 2)}`} />
              <span className="w-1/3 max-w-5 rounded-t-md bg-ch-1 transition-[height] duration-500" style={{ height: `${(it.b / max) * 100}%` }} title={`${keys[1]}: ${fa1(it.b, 2)}`} />
            </div>
          </div>
        ))}
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
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map(([l, v], i) => (
        <li key={l} className="grid grid-cols-[130px_1fr_auto] items-center gap-3 text-[12.5px]">
          <span className="truncate font-semibold" title={l}>{l}</span>
          <span className="h-2.5 rounded-full bg-muted"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(Math.abs(v) / max) * 100}%`, background: v < 0 ? "hsl(var(--ch-6))" : `hsl(var(--ch-${(i % 5) + 1}))` }} /></span>
          <b className="num min-w-[56px] whitespace-nowrap">{v < 0 ? `(${fa1(-v, 2)})` : fa1(v, 2)}</b>
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
