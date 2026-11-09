import { cn } from "@/lib/utils";
import type { IconType } from "@/components/icons";

/* One stat card for the whole system. The tint follows the content (money, time, people, risk…),
   the icon sits in a soft chip and repeats as a faint watermark in the corner. */
export type Tone = "blue" | "teal" | "violet" | "sky" | "amber" | "rose" | "slate";
const VAR: Record<Tone, string> = { blue: "--ch-1", teal: "--ch-2", violet: "--ch-3", sky: "--ch-4", amber: "--warning", rose: "--danger", slate: "--ch-6" };

export function StatCard({ label, value, unit, sub, icon: I, tone = "blue", progress, bars, className }: {
  label: string; value: React.ReactNode; unit?: string; sub?: React.ReactNode; icon: IconType; tone?: Tone;
  progress?: number; bars?: readonly number[]; className?: string;
}) {
  const c = VAR[tone];
  const max = bars ? Math.max(...bars, 1) : 1;
  return (
    <div className={cn("relative isolate flex min-h-[118px] flex-col overflow-hidden rounded-[calc(var(--r-field)+6px)] border p-4", className)}
      style={{ borderColor: `hsl(var(${c}) / .22)`, background: `linear-gradient(140deg, hsl(var(${c}) / .13), hsl(var(${c}) / .03) 60%), hsl(var(--surface) / .55)` }}>
      <I className="pointer-events-none absolute -bottom-4 -end-3 -z-10 size-[92px]" variant="Bulk" style={{ color: `hsl(var(${c}))`, opacity: 0.08 }} />
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-[10px]" style={{ background: `hsl(var(${c}) / .16)`, color: `hsl(var(${c}))` }}><I className="size-[18px]" variant="Bulk" /></span>
        <span className="min-w-0 truncate text-[12.5px] font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="num mt-auto flex items-baseline gap-1.5 pt-3">
        <b className="text-[24px] font-extrabold leading-none tracking-tight">{value}</b>
        {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
        {bars && (
          <span className="ms-auto flex h-7 items-end gap-[3px]" aria-hidden>
            {bars.map((v, i) => <i key={i} className="block w-[5px] rounded-t-[2px]" style={{ height: `${Math.max(12, (v / max) * 100)}%`, background: `hsl(var(${c}) / ${i === bars.length - 1 ? 1 : 0.45})` }} />)}
          </span>
        )}
      </div>
      {progress !== undefined && (
        <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full" style={{ background: `hsl(var(${c}) / .14)` }}>
          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, background: `hsl(var(${c}))` }} />
        </span>
      )}
      {sub && <div className="num mt-1.5 text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
