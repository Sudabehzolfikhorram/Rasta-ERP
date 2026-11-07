import * as React from "react";
import { cn, toFa } from "@/lib/utils";

export function Spark({ data, className }: { data: readonly number[]; className?: string }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${100 - (i / (data.length - 1)) * 100},${26 - ((v - min) / (max - min || 1)) * 22}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function useWidth<T extends HTMLElement>() {
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

const AXIS = 34; // room for the value axis on the left (RTL end side)

/** Cash: actual line (primary), agent forecast dashed (AI), dip marker. RTL: time runs right to left.
 *  Rendered at real pixel size so labels and markers never scale. */
export function CashChart({ actual: a0, forecast: f0, todayDay = 16, scale = 1, unit = "ریال" }: { actual: number[]; forecast: number[]; todayDay?: number; scale?: number; unit?: string }) {
  const [ref, { w: W, h: measuredH }] = useWidth<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);
  const H = Math.max(measuredH, 220);
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
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round(((W - 8 - px) / (plotW - 8)) * n);
    setHover(i >= 0 && i <= n ? i : null);
  };
  const hv = hover ?? null;
  return (
    <div ref={ref} className="relative mt-3 min-h-[220px] w-full flex-1">
      {W > 0 && (
        <svg width={W} height={H} className="absolute inset-0 block touch-none" role="img" aria-label="نمودار نقدینگی: ۱۲ روز گذشته و پیش‌بینی ۱۲ روز آینده" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--ai))" stopOpacity="0.10" />
              <stop offset="100%" stopColor="hsl(var(--ai))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={AXIS} x2={W} y1={y(t)} y2={y(t)} stroke="hsl(var(--border))" strokeDasharray={t === lo ? undefined : "2 6"} />
              <text x={AXIS - 8} y={y(t) + 4} fontSize="11" textAnchor="end" fill="hsl(var(--muted-foreground))" className="num">{toFa(String(t).replace(".", "٫"))}</text>
            </g>
          ))}
          <rect x={AXIS} y="4" width={Math.max(x(now) - AXIS, 0)} height={H - 32} fill="hsl(var(--ai) / 0.04)" rx="8" />
          <polygon points={`${x(0)},${y(lo)} ${pts(0, actual)} ${x(now)},${y(lo)}`} fill="url(#cashFill)" />
          <polygon points={`${x(now)},${y(lo)} ${pts(now, forecast)} ${x(n)},${y(lo)}`} fill="url(#fcFill)" />
          <polyline points={pts(0, actual)} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={pts(now, forecast)} fill="none" stroke="hsl(var(--ai))" strokeWidth="2.4" strokeDasharray="5 6" strokeLinejoin="round" strokeLinecap="round" />
          <line x1={x(now)} x2={x(now)} y1="4" y2={H - 28} stroke="hsl(var(--foreground))" strokeOpacity=".25" />
          {[0, 4, now, now + 4, n].map((i) => (
            <text key={i} x={x(i)} y={H - 8} fontSize="11" textAnchor={i === 0 ? "start" : i === n ? "end" : "middle"} fill="hsl(var(--muted-foreground))" fontWeight={i === now ? 700 : 400}>
              {i === now ? "امروز" : `${toFa(day(i))} آبان`}
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
        <div
          className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-xl border border-border bg-popover px-3 py-2 text-[12px] shadow-lift"
          style={{ left: Math.min(Math.max(x(hv), 80), W - 80), top: Math.max(y(series[hv]) - 64, 0) }}
        >
          <div className="text-muted-foreground">{hv === now ? "امروز" : `${toFa(day(hv))} آبان`} · {hv > now ? "پیش‌بینی" : "واقعی"}</div>
          <b className="num text-[13.5px]">{toFa(String(+series[hv].toFixed(2)).replace(".", "٫"))} میلیارد {unit}</b>
        </div>
      )}
    </div>
  );
}
