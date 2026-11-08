import * as React from "react";
import { ArrowLeft, ArrowUpLeft, ArrowDownLeft, CalendarDays, Check, CheckCheck, FileImage, Mic, Paperclip, Plus, ShieldCheck, Sparkles, TimerReset, Wand2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { cashActual, cashForecast, catMeta, inbox, kpis, type InboxItem } from "@/data/demo";
import { reports } from "@/data/reports";
import { cn, short, toFa, unitLabel } from "@/lib/utils";
import { dayIndex, diffDays, fmtDay, isToday, monthLength, relDay, TODAY, weekday, WD_SHORT } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { WhyPopover } from "@/components/ai/WhyPopover";
import { CashChart, Ring, Spark, StackBars, Treemap, TrendArea } from "@/components/charts";

const looksLikeEntry = (t: string) => /واریز|پرداخت|دادیم|خرید|دریافت|منتقل|میلیون|میلیارد|تومان|ریال/.test(t);

function HeroLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 260" className={cn("hero-lines pointer-events-none absolute", className)} fill="none" stroke="white" strokeOpacity=".35" strokeWidth="1.2" strokeLinecap="round" aria-hidden>
      <path d="M20 200 H110 Q 132 200 148 184 L 268 64 Q 282 50 300 50 A 60 60 0 0 1 360 110 V 190" />
      <path className="l2" d="M60 230 A 70 70 0 0 0 128 250 Q 150 250 166 234 L 300 100 Q 314 86 332 86 A 40 40 0 0 1 372 126 V 240" />
      <path className="l3" d="M200 160 H 360" />
      <path className="l4" d="M250 10 V 50 H 300" />
      {[[110, 200], [200, 160], [300, 50], [360, 190], [250, 50], [128, 250]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="white" fillOpacity=".7" stroke="none" />)}
    </svg>
  );
}

function useDecisions() {
  const { startVoucher, go, toast, openCalendar, docs } = useApp();
  const [items, setItems] = React.useState(inbox);
  const pending = docs.filter((d) => d.status === "pending").length;
  const live = items.map((i) => (i.kind === "approve" ? { ...i, title: pending ? `${toFa(pending)} سند منتظر تأیید شما` : "سندی منتظر تأیید نیست" } : i)).filter((i) => i.kind !== "approve" || pending);
  const remove = (id: string, msg?: string) => { setItems((x) => x.filter((i) => i.id !== id)); if (msg) toast(msg); };
  const primary = (i: InboxItem) => {
    if (i.kind === "draft") { remove(i.id); startVoucher({ file: true }); }
    else if (i.kind === "approve") go("documents");
    else if (i.kind === "check") go("documents");
    else openCalendar({ m: 8, d: 30 });
  };
  return { items: live, primary, remove };
}
const kindIcon = { draft: FileImage, check: ShieldCheck, approve: CheckCheck, close: TimerReset };

/* =====================================================================
   Concept 1 «دستیار»: one conversation surface, then the few numbers that matter
   ===================================================================== */
function AssistHero() {
  const { startVoucher, openPalette, docs } = useApp();
  const [text, setText] = React.useState("");
  const pending = docs.filter((d) => d.status === "pending").length;
  const go = (t = text) => { if (!t.trim()) return; looksLikeEntry(t) ? startVoucher({ text: t }) : openPalette(t); };
  const L = ({ children, q }: { children: React.ReactNode; q: string }) => (
    <button onClick={() => openPalette(q)} className="rounded-md px-0.5 font-extrabold text-white underline decoration-white/50 decoration-2 underline-offset-[7px] transition-colors hover:bg-white/15">{children}</button>
  );
  return (
    <section data-tour="hero" className="hero relative overflow-hidden p-6 lg:p-8">
      <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <HeroLines className="-bottom-6 left-0 hidden h-[115%] w-auto opacity-90 md:block" />
      <div className="relative max-w-[680px]">
        <div className="flex items-center gap-2 text-[12.5px] font-bold text-white/85"><Sparkles className="size-4" /> امروز در یک نگاه</div>
        <p className="num mt-3 text-[20px] font-medium leading-[2.1] lg:text-[22px]">
          <L q="اسناد منتظر تأیید">{toFa(pending)} سند</L> منتظر تأیید شماست و <L q="چک تکین‌کو">چک تکین‌کو</L> امروز سررسید است.
          نقدینگی <L q="چرا نقدینگی بالا رفت؟">۶٪ بیشتر</L> شد.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); go(); }} className="mt-5 flex items-center gap-1.5 rounded-full bg-white p-1.5 ps-5 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.5)]">
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="به دستیار بگویید"
            placeholder="بگویید چه شد؛ مثلاً «۵۰۰ میلیون تومان از مارون واریز شد»"
            className="h-11 min-w-0 flex-1 bg-transparent text-[14.5px] text-[#0F2341] outline-none placeholder:text-[#5B6B80]" />
          <button type="button" aria-label="گفتن با صدا" onClick={() => startVoucher()} className="grid size-11 shrink-0 place-items-center rounded-full text-[#1E3A6E] hover:bg-[#EEF3FB]"><Mic className="size-5" /></button>
          <button type="button" aria-label="فرستادن فیش" onClick={() => startVoucher({ file: true })} className="grid size-11 shrink-0 place-items-center rounded-full text-[#1E3A6E] hover:bg-[#EEF3FB]"><Paperclip className="size-5" /></button>
          <Button type="submit" variant="ai" className="h-11 shrink-0 px-5"><Wand2 /> ساختن سند</Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {[["فیش را بفرستید", () => startVoucher({ file: true })], ["مانده‌ی بانک‌ها", () => openPalette("مانده‌ی بانک‌ها")], ["صورت‌حساب مشتری‌ها", () => openPalette("صورت‌حساب مشتری‌ها")]].map(([l, fn]) => (
            <button key={l as string} onClick={fn as () => void} className="h-8 rounded-full border border-white/30 bg-white/10 px-3.5 text-[12.5px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20">{l as string}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

function KpiCard({ k, compact }: { k: (typeof kpis)[number]; compact?: boolean }) {
  const { unit } = useApp();
  const s = short(k.rial, unit);
  const up = k.delta > 0;
  const u = unitLabel(unit);
  const fmt = (v: number) => `${toFa(String(+((unit === "rial" ? v : v / 10)).toFixed(2))).replace(".", "٫")} میلیارد ${u}`;
  return (
    <div className={cn("panel relative flex flex-col overflow-hidden p-5", compact ? "min-h-[178px]" : "min-h-[208px]")}>
      <div className="flex items-center gap-2">
        <span className="text-[13.5px] font-bold">{k.label}</span>
        <span className={cn("num ms-auto inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[12px] font-bold", k.good ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
          {up ? <ArrowUpLeft className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}{toFa(Math.abs(k.delta).toFixed(1)).replace(".", "٫")}٪
        </span>
        <WhyPopover title={k.label} line={k.why.line} parts={k.why.parts} />
      </div>
      <span className="text-[11.5px] text-muted-foreground">۳۰ روز گذشته</span>
      <div className="relative z-10 mt-auto">
        <div className="num text-[34px] font-extrabold leading-none tracking-tight">{s.n}</div>
        <div className="num mt-1.5 text-[12px] text-muted-foreground">{s.s} {u} · <span className={k.good ? "text-success" : "text-danger"}>{k.today}</span></div>
      </div>
      <TrendArea data={k.series} tone={k.id === "pl" ? "ai" : "primary"} fmt={fmt} labelFor={(i) => { const d = TODAY.d - i; return d > 0 ? fmtDay(8, d) : fmtDay(7, 30 + d); }}
        className="absolute bottom-0 left-0 h-[58%] w-[62%]" />
    </div>
  );
}

function Decisions({ layout = "list" }: { layout?: "list" | "grid" }) {
  const { items, primary, remove } = useDecisions();
  return (
    <section data-tour="inbox" className="panel flex flex-col p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold">منتظر تصمیم شما</h2>
        <span className="num rounded-full bg-ai-soft px-2.5 text-[12px] font-bold text-ai-ink">{toFa(items.length)}</span>
      </div>
      {items.length ? (
        <ul className={cn("mt-3", layout === "grid" ? "grid gap-3 sm:grid-cols-2" : "flex flex-col")}>
          {items.map((i) => {
            const I = kindIcon[i.kind];
            return (
              <li key={i.id} className={cn("flex flex-wrap items-center gap-3 animate-rise sm:flex-nowrap", layout === "grid" ? "rounded-2xl border border-border/70 bg-surface/60 p-3" : "border-t border-border/60 py-3 first:border-t-0")}>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ai-soft text-ai-ink"><I className="size-4" /></span>
                <div className="min-w-0 flex-1 basis-40">
                  <div className="truncate text-[13.5px] font-bold">{i.title}</div>
                  <div className="num truncate text-[12px] text-muted-foreground">{i.detail}</div>
                </div>
                {i.secondary && <Button size="sm" variant="ghost" onClick={() => remove(i.id, "یادم ماند؛ این دو سند تکراری نیستند.")}>{i.secondary}</Button>}
                <Button size="sm" variant="soft" onClick={() => primary(i)}>{i.primary}</Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-success-soft text-success"><Check /></span>
          <b className="text-[14px]">کاری نمانده</b>
        </div>
      )}
    </section>
  );
}

function Agenda() {
  const { events, openCalendar, toggleEvent, unit } = useApp();
  const [sel, setSel] = React.useState<number>(TODAY.d);
  const days = Array.from({ length: 7 }, (_, i) => TODAY.d - 1 + i);
  const list = events.filter((e) => e.m === TODAY.m && e.d === sel);
  return (
    <section data-tour="today" className="panel flex flex-col p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold">برنامه</h2>
        <button onClick={() => openCalendar({ m: TODAY.m, d: sel })} className="flex items-center gap-1 text-[12.5px] font-bold text-primary hover:underline"><CalendarDays className="size-4" /> تقویم</button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1" role="tablist" aria-label="روزهای هفته">
        {days.map((d) => {
          const has = events.some((e) => e.m === TODAY.m && e.d === d && !e.done);
          return (
            <button key={d} role="tab" aria-selected={sel === d} onClick={() => setSel(d)}
              className={cn("relative flex flex-col items-center rounded-2xl py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted", sel === d && "bg-primary text-primary-foreground hover:bg-primary")}>
              {WD_SHORT[weekday(TODAY.m, d)]}
              <b className={cn("num text-[14px] text-foreground", sel === d && "text-primary-foreground")}>{toFa(d)}</b>
              {has && <span className={cn("absolute bottom-0.5 size-1 rounded-full bg-ai", sel === d && "bg-white")} />}
            </button>
          );
        })}
      </div>
      <ul className="mt-2">
        {list.map((e) => (
          <li key={e.id} className="flex items-center gap-3 border-t border-border/60 py-2.5 first:border-t-0">
            <input type="checkbox" checked={!!e.done} onChange={() => toggleEvent(e.id)} aria-label={`انجام شد: ${e.title}`} className="size-4 accent-[hsl(var(--primary))]" />
            <span className="size-2 shrink-0 rounded-full" style={{ background: `hsl(${catMeta[e.cat].color})` }} />
            <div className="min-w-0 flex-1">
              <div className={cn("truncate text-[13.5px] font-bold", e.done && "text-muted-foreground line-through decoration-1")}>{e.title}</div>
              <div className="num text-[12px] text-muted-foreground">{e.time ? `ساعت ${e.time}` : catMeta[e.cat].label}{e.amount ? ` · ${short(e.amount, unit).n} ${short(e.amount, unit).s}` : ""}</div>
            </div>
          </li>
        ))}
        {!list.length && <li className="py-6 text-center text-[13px] text-muted-foreground">برنامه‌ای ندارید.</li>}
      </ul>
    </section>
  );
}

function AssistDashboard() {
  return (
    <div className="flex flex-col gap-5">
      <AssistHero />
      <div data-tour="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.id} k={k} />)}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Decisions />
        <Agenda />
      </div>
    </div>
  );
}

/* =====================================================================
   Concept 2 «پیشخوان»: a bento board, every answer one glance away
   ===================================================================== */
function BentoHero() {
  const { docs, events, startVoucher, go } = useApp();
  const pending = docs.filter((d) => d.status === "pending").length;
  const todayLeft = events.filter((e) => isToday(e.m, e.d) && !e.done).length;
  const stats: [string, string][] = [[toFa(pending), "سند منتظر تأیید"], [toFa(todayLeft), "کار امروز"], ["۸۰٪", "آماده‌ی بستن آبان"]];
  return (
    <section data-tour="hero" className="hero relative flex flex-col overflow-hidden p-6">
      <HeroLines className="-left-10 -top-6 h-[120%] w-auto opacity-70" />
      <div className="relative">
        <div className="text-[12.5px] font-bold text-white/80">صبح یکشنبه</div>
        <h2 className="mt-1 text-[22px] font-extrabold leading-9">سه کار مهم امروز آماده است.</h2>
      </div>
      <dl className="relative mt-5 grid grid-cols-3 gap-2">
        {stats.map(([n, l]) => (
          <div key={l} className="rounded-2xl bg-white/12 p-3">
            <dt className="text-[11.5px] text-white/80">{l}</dt>
            <dd className="num text-[24px] font-extrabold">{n}</dd>
          </div>
        ))}
      </dl>
      <div className="relative mt-auto flex flex-wrap gap-2 pt-5">
        <Button className="bg-white text-[hsl(var(--hero-ink))] hover:bg-white/90" onClick={() => go("documents")}>شروع با تأییدها <ArrowLeft /></Button>
        <Button variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20" onClick={() => startVoucher()}><Plus /> سند تازه</Button>
      </div>
    </section>
  );
}

function CashTile() {
  const { unit } = useApp();
  const s = short(48_250_000_000, unit);
  return (
    <section className="panel flex flex-col p-5">
      <div className="flex items-start gap-3">
        <div>
          <h2 className="text-[13.5px] font-bold text-muted-foreground">نقد و بانک</h2>
          <div className="num mt-1 text-[30px] font-extrabold leading-none">{s.n} <span className="text-[13px] font-medium text-muted-foreground">{s.s} {unitLabel(unit)}</span></div>
        </div>
        <WhyPopover className="ms-auto" title="پیش‌بینی نقد" line="۲۲ آبان نقد به حدود ۴۴ میلیارد ریال می‌رسد، چون حقوق و بیمه هم‌زمان پرداخت می‌شوند." parts={[["حقوق آبان", "−۳٫۸ میلیارد"], ["لیست بیمه", "−۱٫۱ میلیارد"], ["دریافت فولاد مبارکه", "+۲٫۴ میلیارد"]]} />
      </div>
      <CashChart actual={cashActual} forecast={cashForecast} scale={unit === "rial" ? 1 : 0.1} unit={unitLabel(unit)} minH={200} />
      <div className="flex flex-wrap gap-4 pt-2 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-primary" />واقعی</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-ai" />پیش‌بینی</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full border-2 border-warning" />کمترین: ۲۲ آبان</span>
      </div>
    </section>
  );
}

function MiniKpi({ k }: { k: (typeof kpis)[number] }) {
  const { unit } = useApp();
  const s = short(k.rial, unit);
  return (
    <div className="panel flex flex-col p-4">
      <div className="flex items-center gap-2 text-[12.5px] font-bold text-muted-foreground">
        {k.label}
        <span className={cn("num ms-auto inline-flex items-center gap-0.5 rounded-md px-1.5 text-[11.5px] font-bold", k.good ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>{k.delta > 0 ? <ArrowUpLeft className="size-3" /> : <ArrowDownLeft className="size-3" />}{toFa(Math.abs(k.delta).toFixed(1)).replace(".", "٫")}٪</span>
      </div>
      <div className="num mt-2 text-[24px] font-extrabold leading-none">{s.n} <span className="text-[11.5px] font-medium text-muted-foreground">{s.s}</span></div>
      <Spark data={k.series} className={cn("mt-3 h-9", k.id === "pl" ? "text-ai" : "text-primary")} />
    </div>
  );
}

function ApprovalTile() {
  const { docs, go } = useApp();
  const pending = docs.filter((d) => d.status === "pending").length;
  const posted = docs.filter((d) => d.status === "posted").length;
  return (
    <button onClick={() => go("documents")} className="panel flex items-center gap-4 p-4 text-start transition-shadow hover:shadow-lift">
      <Ring value={posted / docs.length} size={84} stroke={8}>
        <span className="num text-[18px] font-extrabold leading-none">{toFa(Math.round((posted / docs.length) * 100))}٪</span>
      </Ring>
      <div>
        <div className="text-[12.5px] font-bold text-muted-foreground">اسناد آبان</div>
        <div className="num mt-1 text-[13px]"><b className="text-[18px]">{toFa(posted)}</b> ثبت‌شده</div>
        <div className="num text-[12.5px] text-warning">{toFa(pending)} منتظر تأیید</div>
      </div>
    </button>
  );
}

function MonthTile() {
  const { events, openCalendar } = useApp();
  const len = monthLength(TODAY.m), lead = weekday(TODAY.m, 1);
  const next = events.filter((e) => !e.done && diffDays(e.m, e.d) >= 0).sort((a, b) => dayIndex(a.m, a.d) - dayIndex(b.m, b.d))[0];
  return (
    <section className="panel flex flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-extrabold">آبان</h2>
        <button onClick={() => openCalendar()} className="text-[12px] font-bold text-primary hover:underline">تقویم کامل</button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10.5px] text-muted-foreground">{WD_SHORT.map((w) => <span key={w}>{w}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }).map((_, i) => <span key={"b" + i} />)}
        {Array.from({ length: len }, (_, i) => i + 1).map((d) => {
          const ev = events.filter((e) => e.m === TODAY.m && e.d === d);
          const open = ev.filter((e) => !e.done);
          return (
            <button key={d} onClick={() => openCalendar({ m: TODAY.m, d })} aria-label={`${fmtDay(TODAY.m, d)}${ev.length ? `، ${toFa(ev.length)} مورد` : ""}`}
              className={cn("num relative grid aspect-square place-items-center rounded-lg text-[11.5px] transition-colors hover:ring-1 hover:ring-primary/40",
                open.length ? "font-bold" : "text-muted-foreground", isToday(TODAY.m, d) && "bg-primary text-primary-foreground")}
              style={open.length && !isToday(TODAY.m, d) ? { background: `hsl(${catMeta[open[0].cat].color} / 0.16)` } : undefined}>
              {toFa(d)}
            </button>
          );
        })}
      </div>
      {next && <p className="num mt-3 truncate text-[12px] text-muted-foreground">بعدی: <b className="text-foreground">{next.title}</b> · {relDay(next.m, next.d)}</p>}
    </section>
  );
}

function AgingTile() {
  const { openReport } = useApp();
  const r = reports.find((x) => x.id === "aging")!;
  return (
    <section className="panel flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-extrabold">عمر طلب‌ها</h2>
        <button onClick={() => openReport("aging")} className="text-[12px] font-bold text-primary hover:underline">گزارش</button>
      </div>
      <StackBars rows={r.rows.map((x) => ({ label: String(x.item), values: [x.a, x.b, x.c, x.d] as number[] }))} keys={["جاری", "تا ۳۰", "تا ۶۰", "بیش از ۶۰ روز"]} colors={["--seq-1", "--seq-2", "--seq-3", "--seq-4"]} />
    </section>
  );
}

function SpendTile() {
  const { openReport, unit } = useApp();
  const r = reports.find((x) => x.id === "expmix")!;
  return (
    <section className="panel flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-extrabold">هزینه‌های آبان</h2>
        <button onClick={() => openReport("expmix")} className="text-[12px] font-bold text-primary hover:underline">گزارش</button>
      </div>
      <Treemap height={230} items={[...r.rows.slice(0, 3).map((x) => [String(x.item), (x.v as number) / (unit === "toman" ? 10 : 1)] as [string, number]), ["سایر", r.rows.slice(3).reduce((a, x) => a + (x.v as number), 0) / (unit === "toman" ? 10 : 1)]]} unit={`میلیارد ${unitLabel(unit)}`} onPick={() => openReport("expmix")} />
    </section>
  );
}

function CloseTile() {
  const steps: [string, boolean][] = [["همه‌ی اسناد ثبت شد", false], ["تطبیق بانک پارسیان", true], ["تطبیق بانک ملت", false], ["استهلاک آبان", true], ["حقوق و بیمه", true]];
  const done = steps.filter((s) => s[1]).length;
  return (
    <section className="panel flex flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-extrabold">بستن آبان</h2>
        <span className="num text-[12px] text-muted-foreground">{toFa(done)} از {toFa(steps.length)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full ai-edge" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {steps.map(([l, ok]) => (
          <li key={l} className={cn("flex items-center gap-2 text-[12.5px]", ok && "text-muted-foreground")}>
            <span className={cn("grid size-4 place-items-center rounded-full", ok ? "bg-ai text-white" : "border border-border")}>{ok && <Check className="size-2.5" strokeWidth={3} />}</span>{l}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BentoDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12 [&>div]:min-w-0 [&>div>*]:h-full">
      <div className="md:col-span-6 xl:col-span-5"><BentoHero /></div>
      <div className="md:col-span-6 xl:col-span-7"><CashTile /></div>
      <div data-tour="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:col-span-6 xl:col-span-9">
        {kpis.slice(1).map((k) => <MiniKpi key={k.id} k={k} />)}
      </div>
      <div className="md:col-span-6 xl:col-span-3"><ApprovalTile /></div>
      <div className="md:col-span-3 xl:col-span-3"><MonthTile /></div>
      <div className="md:col-span-3 xl:col-span-5"><AgingTile /></div>
      <div className="md:col-span-6 xl:col-span-4"><SpendTile /></div>
      <div className="md:col-span-6 xl:col-span-7"><Decisions layout="grid" /></div>
      <div className="md:col-span-6 xl:col-span-5"><CloseTile /></div>
    </div>
  );
}

export function Dashboard() {
  const { concept } = useApp();
  return concept === "bento" ? <BentoDashboard /> : <AssistDashboard />;
}

