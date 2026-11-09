import * as React from "react";
import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, CalendarDays, CardReceive, Check, CheckCheck, ChevronDown, ChevronUp, FileImage, GripVertical, History, LayoutGrid, MoneySend, Paperclip, Plus, RotateCcw, Send, ShieldCheck, StatusUp, TimerReset, Trash2, Wallet3, type IconType } from "@/components/icons";
import { DEFAULT_WIDGETS, useApp, WIDGETS } from "@/lib/store";
import { cashActual, cashForecast, catMeta, inbox, kpis, statusLabel, type DocStatus, type InboxItem } from "@/data/demo";
import { reports } from "@/data/reports";
import { cn, money, short, toFa, unitLabel } from "@/lib/utils";
import { dayIndex, diffDays, fmtDay, isToday, monthLength, relDay, TODAY, weekday, WD_SHORT } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WhyPopover } from "@/components/ai/WhyPopover";
import { Orb } from "@/components/ai/Orb";
import { MicButton, VoiceBar, VoiceError } from "@/components/ai/VoiceBar";
import { useVoice } from "@/lib/voice";
import { ArcMix, CashChart, DotMatrix, MiniBars, StackBars, TrendArea, Waterfall } from "@/components/charts";
import { ACCEPT } from "@/components/voucher/analyze";
import { answerFor } from "@/components/ai/CommandPalette";
import { followUps } from "@/components/ai/followups";
import { docNo, docTotal, partyOf } from "@/components/voucher/VoucherEditor";

const looksLikeEntry = (t: string) => /واریز|پرداخت|دادیم|خرید|دریافت|منتقل|میلیون|میلیارد|تومان|ریال/.test(t);
export const statusTone: Record<DocStatus, "neutral" | "warning" | "success"> = { draft: "neutral", pending: "warning", posted: "success" };

/** Opens the system file picker; the chosen file goes straight to the voucher page for analysis. */
function useAttach() {
  const { startVoucher } = useApp();
  const ref = React.useRef<HTMLInputElement>(null);
  const input = <input ref={ref} type="file" accept={ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) startVoucher({ file: f }); e.target.value = ""; }} />;
  return { open: () => ref.current?.click(), input };
}

function useDecisions() {
  const { go, toast, openCalendar, docs, openDoc } = useApp();
  const [items, setItems] = React.useState(inbox);
  const pending = docs.filter((d) => d.status === "pending").length;
  const live = items.map((i) => (i.kind === "approve" ? { ...i, title: `${toFa(pending)} سند منتظر تأیید شماست` } : i)).filter((i) => i.kind !== "approve" || pending);
  const remove = (id: string, msg?: string) => { setItems((x) => x.filter((i) => i.id !== id)); if (msg) toast(msg); };
  const primary = (i: InboxItem) => {
    if (i.kind === "draft") { remove(i.id); openDoc("d34"); }
    else if (i.kind === "approve") go("documents");
    else if (i.kind === "check") openDoc("d41");
    else openCalendar({ m: 8, d: 30 });
  };
  return { items: live, primary, remove };
}
const kindIcon = { draft: FileImage, check: ShieldCheck, approve: CheckCheck, close: TimerReset };

/* ---------------- shared widgets ---------------- */
function Head({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[15px] font-extrabold">{title}</h2>
      {action}
    </div>
  );
}
const LinkBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="flex items-center gap-1 text-[12.5px] font-bold text-primary hover:underline">{children}</button>
);

function Delta({ k }: { k: (typeof kpis)[number] }) {
  return (
    <span className={cn("num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[12px] font-bold", k.good ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
      {k.delta > 0 ? <ArrowUpLeft className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}{toFa(Math.abs(k.delta).toFixed(1)).replace(".", "٫")}٪
    </span>
  );
}

const KPI_TONE: Record<string, [string, IconType]> = { cash: ["--ch-1", Wallet3], ar: ["--ch-2", CardReceive], ap: ["--ch-3", MoneySend], pl: ["--ch-4", StatusUp] };
function KpiCard({ k }: { k: (typeof kpis)[number] }) {
  const { unit } = useApp();
  const [c, KI] = KPI_TONE[k.id] ?? ["--ch-1", Wallet3];
  const s = short(k.rial, unit);
  const u = unitLabel(unit);
  const fmt = (v: number) => `${toFa(String(+((unit === "rial" ? v : v / 10)).toFixed(2))).replace(".", "٫")} میلیارد ${u}`;
  return (
    <div className="panel relative isolate flex flex-col overflow-hidden p-5">
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: `linear-gradient(150deg, hsl(var(${c}) / .12), transparent 55%)` }} />
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-[10px]" style={{ background: `hsl(var(${c}) / .16)`, color: `hsl(var(${c}))` }}><KI className="size-[18px]" variant="Bulk" /></span>
        <span className="text-[13.5px] font-bold">{k.label}</span>
        <Delta k={k} />
        <WhyPopover className="ms-auto" title={k.label} line={k.why.line} parts={k.why.parts} />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="num text-[30px] font-extrabold leading-none tracking-tight">{s.n}</span>
        <span className="num text-[12px] text-muted-foreground">{s.s} {u}</span>
      </div>
      <div className="num mt-1.5 text-[12px] text-muted-foreground">{k.today}</div>
      {/* the trend gets its own band under the text so nothing overlaps */}
      <div className="mt-4">
        <TrendArea data={k.series} tone={k.id === "pl" ? "ai" : "primary"} fmt={fmt} labelFor={(i) => { const d = TODAY.d - i; return d > 0 ? fmtDay(8, d) : fmtDay(7, 30 + d); }}
          className="h-16 w-full" />
        <div className="flex justify-between pt-1 text-[10.5px] text-muted-foreground"><span>امروز</span><span>۳۰ روز پیش</span></div>
      </div>
    </div>
  );
}
function Kpis() {
  return <div data-tour="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">{kpis.map((k) => <KpiCard key={k.id} k={k} />)}</div>;
}

function Decisions({ layout = "list" }: { layout?: "list" | "grid" }) {
  const { items, primary } = useDecisions();
  return (
    <section data-tour="inbox" className="panel flex flex-col p-5">
      <Head title="کارهای منتظر اقدام" action={<span className="num rounded-md bg-warning-soft px-2 text-[12px] font-bold text-warning">{toFa(items.length)}</span>} />
      {items.length ? (
        <ul className={cn(layout === "grid" ? "grid gap-3 sm:grid-cols-2" : "flex flex-col")}>
          {items.map((i) => {
            const I = kindIcon[i.kind];
            return (
              <li key={i.id} className={cn("flex flex-wrap items-center gap-3 animate-rise sm:flex-nowrap", layout === "grid" ? "rounded-field border border-border/70 bg-surface/60 p-3" : "border-t border-border/60 py-3 first:border-t-0 first:pt-0")}>
                <span className="grid size-9 shrink-0 place-items-center rounded-field bg-muted text-foreground"><I className="size-4" /></span>
                <div className="min-w-0 flex-1 basis-40">
                  <div className="truncate text-[13.5px] font-bold">{i.title}</div>
                  <div className="num truncate text-[12px] text-muted-foreground">{i.detail}</div>
                </div>
                                <Button size="sm" variant="soft" onClick={() => primary(i)}>{i.primary}</Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty icon={CheckCheck} title="کاری منتظر شما نیست" text="سندها و بررسی‌های جدید اینجا نمایش داده می‌شوند." />
      )}
    </section>
  );
}

export function Empty({ icon: I, title, text, action }: { icon: IconType; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><I className="size-6" variant="Bulk" /></span>
      <b className="text-[14px]">{title}</b>
      {text && <p className="max-w-[280px] text-[12.5px] text-muted-foreground">{text}</p>}
      {action}
    </div>
  );
}

function Agenda() {
  const { events, openCalendar, toggleEvent, unit } = useApp();
  const [sel, setSel] = React.useState<number>(TODAY.d);
  const days = Array.from({ length: 7 }, (_, i) => TODAY.d - 1 + i);
  const list = events.filter((e) => e.m === TODAY.m && e.d === sel);
  const week = events.filter((e) => e.m === TODAY.m && days.includes(e.d));
  const weekOut = week.reduce((a, e) => a + (e.amount ?? 0), 0);
  return (
    <section data-tour="today" className="panel flex flex-col p-5">
      <Head title="برنامه‌ی این هفته" action={<LinkBtn onClick={() => openCalendar({ m: TODAY.m, d: sel })}><CalendarDays className="size-4" /> تقویم مالی</LinkBtn>} />
      <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="روزهای هفته">
        {days.map((d) => {
          const has = events.some((e) => e.m === TODAY.m && e.d === d && !e.done);
          const fri = weekday(TODAY.m, d) === 6;
          return (
            <button key={d} role="tab" aria-selected={sel === d} onClick={() => setSel(d)}
              className={cn("relative flex flex-col items-center rounded-field py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted", sel === d && "bg-primary text-primary-foreground hover:bg-primary")}>
              {WD_SHORT[weekday(TODAY.m, d)]}
              <b className={cn("num text-[14px]", sel === d ? "text-primary-foreground" : fri ? "text-danger" : "text-foreground")}>{toFa(d)}</b>
              {has && <span className={cn("absolute bottom-0.5 size-1 rounded-full bg-primary", sel === d && "bg-white")} />}
            </button>
          );
        })}
      </div>
      <ul className="mt-2">
        {list.map((e) => (
          <li key={e.id} className="flex items-center gap-3 border-t border-border/60 py-2.5 first:border-t-0">
            <Checkbox checked={!!e.done} onCheckedChange={() => toggleEvent(e.id)} aria-label={`انجام شد: ${e.title}`} />
            <span className="size-2 shrink-0 rounded-full" style={{ background: `hsl(${catMeta[e.cat].color})` }} />
            <div className="min-w-0 flex-1">
              <div className={cn("truncate text-[13.5px] font-bold", e.done && "text-muted-foreground line-through decoration-1")}>{e.title}</div>
              <div className="num text-[12px] text-muted-foreground">{e.time ? `ساعت ${e.time}` : catMeta[e.cat].label}{e.amount ? ` · ${short(e.amount, unit).n} ${short(e.amount, unit).s} ${unitLabel(unit)}` : ""}</div>
            </div>
          </li>
        ))}
      </ul>
      {!list.length && <Empty icon={CalendarDays} title="برای این روز برنامه‌ای ثبت نشده" action={<Button size="sm" variant="soft" onClick={() => openCalendar({ m: TODAY.m, d: sel })}><Plus /> افزودن یادآوری</Button>} />}
      <div className="num mt-auto grid grid-cols-3 gap-2 pt-4 text-center">
        {([["سررسید این هفته", toFa(week.length), "--ch-1"], ["انجام‌شده", toFa(week.filter((e) => e.done).length), "--ch-2"], ["خروجی هفته", `${short(weekOut, unit).n} ${short(weekOut, unit).s}`, "--ch-3"]] as const).map(([l, v, c]) => (
          <div key={l} className="rounded-field border px-2 py-2" style={{ borderColor: `hsl(var(${c}) / .22)`, background: `linear-gradient(140deg, hsl(var(${c}) / .14), hsl(var(${c}) / .04))` }}><b className="block text-[14px]" style={{ color: `hsl(var(${c}))` }}>{v}</b><span className="text-[11px] text-muted-foreground">{l}</span></div>
        ))}
      </div>
    </section>
  );
}

function RecentDocs({ dense }: { dense?: boolean }) {
  const { docs, openDoc, go, unit } = useApp();
  const list = [...docs].sort((a, b) => dayIndex(b.m, b.d) - dayIndex(a.m, a.d) || b.seq - a.seq).slice(0, dense ? 5 : 4);
  return (
    <section className="panel flex flex-col p-5">
      <Head title="آخرین اسناد" action={<LinkBtn onClick={() => go("documents")}>همه‌ی اسناد <ArrowLeft className="size-4" /></LinkBtn>} />
      {list.length ? (
        <ul className="flex flex-col divide-y divide-border/60">
          {list.map((d) => (
            <li key={d.id}>
              <button onClick={() => openDoc(d.id)} className="-mx-2 grid w-[calc(100%+16px)] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 rounded-field px-2 py-2.5 text-start transition-colors hover:bg-muted/70">
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-bold">{d.title}</span>
                  <span className="num block truncate text-[11.5px] text-muted-foreground">{docNo(d.m, d.seq)} · {fmtDay(d.m, d.d)}{dense ? "" : ` · ${partyOf(d)}`}</span>
                </span>
                <b className="num text-[13px]">{money(docTotal(d), unit)}</b>
                <Badge tone={statusTone[d.status]} className="w-[84px] justify-center">{statusLabel[d.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      ) : <Empty icon={FileImage} title="هنوز سندی ثبت نشده" />}
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
          <h2 className="text-[15px] font-extrabold">موجودی نقد و بانک</h2>
          <div className="num mt-1.5 text-[30px] font-extrabold leading-none">{s.n} <span className="text-[13px] font-medium text-muted-foreground">{s.s} {unitLabel(unit)}</span></div>
        </div>
        <WhyPopover className="ms-auto" title="پیش‌بینی نقدینگی" line="۲۲ آبان موجودی به حدود ۴۴ میلیارد ریال می‌رسد، چون حقوق و بیمه هم‌زمان پرداخت می‌شوند." parts={[["حقوق آبان", "−۳٫۸ میلیارد"], ["لیست بیمه", "−۱٫۱ میلیارد"], ["دریافت فولاد مبارکه", "+۲٫۴ میلیارد"]]} />
      </div>
      <CashChart actual={cashActual} forecast={cashForecast} scale={unit === "rial" ? 1 : 0.1} unit={unitLabel(unit)} minH={200} />
      <div className="flex flex-wrap gap-4 pt-2 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-primary" />واقعی</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-ai" />پیش‌بینی</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full border-2 border-warning" />کمترین موجودی: ۲۲ آبان</span>
      </div>
    </section>
  );
}

/** Modern stat cards: each one pairs the number with a different kind of context (split, goal, comparison, trend). */
function StatCard({ icon: I, tint, label, k, children, foot, onOpen }: { icon: IconType; tint: string; label: string; k: (typeof kpis)[number]; children: React.ReactNode; foot: string; onOpen: () => void }) {
  const { unit } = useApp();
  const s = short(k.rial, unit);
  return (
    <div className="panel group relative flex flex-col overflow-hidden p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-[10px]" style={{ background: `hsl(var(${tint}) / .14)`, color: `hsl(var(${tint}))` }}><I className="size-5" variant="Bulk" /></span>
        <span className="text-[13px] font-bold">{label}</span>
        <span className="ms-auto"><Delta k={k} /></span>
      </div>
      <div className="num mt-3 text-[27px] font-extrabold leading-none tracking-tight">{s.n} <span className="text-[12px] font-medium text-muted-foreground">{s.s} {unitLabel(unit)}</span></div>
      <div className="mt-3 flex-1">{children}</div>
      <button onClick={onOpen} className="num mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-[12px] text-muted-foreground hover:text-foreground">
        {foot}<ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      </button>
    </div>
  );
}
function StatCards() {
  const { openReport, go } = useApp();
  const [cash, ar, ap, pl] = kpis;
  const split: [string, number, string][] = [["پارسیان", 61, "--ch-1"], ["ملت", 32, "--ch-4"], ["صندوق و سایر", 7, "--ch-6"]];
  return (
    <div data-tour="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Wallet3} tint="--ch-1" label="موجودی نقد و بانک" k={cash} foot="مانده‌ی هر حساب" onOpen={() => openReport("banks")}>
        <div className="flex h-2.5 overflow-hidden rounded-full">{split.map(([l, v, c]) => <span key={l} style={{ width: `${v}%`, background: `hsl(var(${c}))` }} />)}</div>
        <ul className="num mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">{split.map(([l, v, c]) => <li key={l} className="flex items-center gap-1"><i className="size-2 rounded-full" style={{ background: `hsl(var(${c}))` }} />{l} {toFa(v)}٪</li>)}</ul>
      </StatCard>
      <StatCard icon={CardReceive} tint="--ch-2" label="حساب‌های دریافتنی" k={ar} foot="۳٫۲ میلیارد ریال سررسید گذشته" onOpen={() => openReport("aging")}>
        <div className="flex items-center justify-between text-[11.5px] text-muted-foreground"><span>وصول آبان</span><b className="num text-foreground">۶۸٪ از هدف</b></div>
        <div className="relative mt-1.5 h-2.5 rounded-full bg-muted">
          <span className="absolute inset-y-0 start-0 rounded-full" style={{ width: "68%", background: "hsl(var(--ch-2))" }} />
          <span className="absolute -inset-y-1 w-0.5 rounded bg-foreground/70" style={{ insetInlineStart: "85%" }} title="هدف تا امروز" />
        </div>
        <p className="num mt-1.5 text-[11px] text-muted-foreground">خط تیره: هدف تا امروز (۸۵٪)</p>
      </StatCard>
      <StatCard icon={MoneySend} tint="--ch-5" label="حساب‌های پرداختنی" k={ap} foot="۲ پرداخت در هفته‌ی آینده" onOpen={() => go("calendar")}>
        {([["آبان", 9.4, 1], ["مهر", 13.4, 0.35]] as const).map(([l, v, o]) => (
          <div key={l} className="mb-1.5 grid grid-cols-[34px_minmax(0,1fr)_40px] items-center gap-2 text-[11.5px]">
            <span className="text-muted-foreground">{l}</span>
            <span className="h-2.5 rounded-full" style={{ width: `${(v / 13.4) * 100}%`, background: `hsl(var(--ch-5) / ${o})` }} />
            <b className="num text-end">{toFa(String(v)).replace(".", "٫")}</b>
          </div>
        ))}
      </StatCard>
      <StatCard icon={StatusUp} tint="--ch-3" label="سود خالص آبان" k={pl} foot="روند ۱۲ ماه گذشته" onOpen={() => openReport("pl")}>
        <MiniBars data={[1.8, 2.1, 1.6, 2.4, 2.2, 2.7, 2.5, 2.3, 2.9, 2.6, 2.84, 3.15]} color="--ch-3" />
      </StatCard>
    </div>
  );
}

/** Document status: a segmented ring (share of each status) beside the three stages, then the documents still waiting. */
function ApprovalTile() {
  const { docs, go, openDoc } = useApp();
  const stages: { s: DocStatus; l: string; c: string }[] = [
    { s: "posted", l: "تأییدشده", c: "--success" }, { s: "pending", l: "منتظر تأیید", c: "--warning" }, { s: "draft", l: "پیش‌نویس", c: "--viz-7" },
  ];
  const all = Math.max(docs.length, 1);
  const n = (s: DocStatus) => docs.filter((d) => d.status === s).length;
  const pct = Math.round((n("posted") / all) * 100);
  const waiting = docs.filter((d) => d.status === "pending").slice(0, 2);
  const S = 116, sw = 13, r = (S - sw) / 2, C = 2 * Math.PI * r;
  let off = 0;
  return (
    <section className="panel flex flex-col p-5">
      <Head title="وضعیت اسناد آبان" action={<span className="num text-[12px] text-muted-foreground">{toFa(docs.length)} سند</span>} />
      <div className="flex items-center gap-5">
        <div className="relative grid shrink-0 place-items-center" style={{ width: S, height: S }}>
          <svg width={S} height={S} className="-rotate-90" role="img" aria-label={stages.map((st) => `${st.l} ${toFa(n(st.s))}`).join("، ")}>
            <circle cx={S / 2} cy={S / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={sw} />
            {stages.map((st) => {
              const len = (n(st.s) / all) * C;
              const el = len > 0 && <circle key={st.s} cx={S / 2} cy={S / 2} r={r} fill="none" stroke={`hsl(var(${st.c}))`} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${Math.max(len - sw - 3, 0.1)} ${C}`} strokeDashoffset={-(off + sw / 2 + 1.5)} />;
              off += len;
              return el;
            })}
          </svg>
          <span className="absolute inset-0 grid place-content-center text-center"><b className="num text-[22px] leading-none">{toFa(pct)}٪</b><span className="mt-1 text-[11px] text-muted-foreground">تأییدشده</span></span>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
          {stages.map((st) => (
            <li key={st.s} className="text-[12.5px]">
              <span className="flex items-center gap-2"><i className="size-2.5 rounded-full" style={{ background: `hsl(var(${st.c}))` }} /><span className="flex-1">{st.l}</span><b className="num text-[14px]">{toFa(n(st.s))}</b></span>
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full" style={{ width: `${(n(st.s) / all) * 100}%`, background: `hsl(var(${st.c}))` }} /></span>
            </li>
          ))}
        </ul>
      </div>
      {waiting.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
          {waiting.map((d) => (
            <li key={d.id}><button onClick={() => openDoc(d.id)} className="flex w-full items-center gap-2 rounded-[8px] px-1.5 py-1 text-start text-[12.5px] hover:bg-muted">
              <i className="size-1.5 shrink-0 rounded-full bg-warning" /><span className="min-w-0 flex-1 truncate">{d.title}</span><span className="num text-[11px] text-muted-foreground">سند {toFa(d.seq)}</span>
            </button></li>
          ))}
        </ul>
      )}
      <Button size="sm" variant="soft" className="mt-4" onClick={() => go("documents")}>بررسی اسناد</Button>
    </section>
  );
}

function MonthTile() {
  const { events, openCalendar } = useApp();
  const len = monthLength(TODAY.m), lead = weekday(TODAY.m, 1);
  const next = events.filter((e) => !e.done && diffDays(e.m, e.d) >= 0).sort((a, b) => dayIndex(a.m, a.d) - dayIndex(b.m, b.d))[0];
  return (
    <section className="panel flex flex-col p-5">
      <Head title="تقویم آبان" action={<LinkBtn onClick={() => openCalendar()}>تقویم کامل</LinkBtn>} />
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">{WD_SHORT.map((w) => <span key={w}>{w}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }).map((_, i) => <span key={"b" + i} />)}
        {Array.from({ length: len }, (_, i) => i + 1).map((d) => {
          const open = events.filter((e) => e.m === TODAY.m && e.d === d && !e.done);
          const fri = weekday(TODAY.m, d) === 6 || d === 22;
          return (
            <button key={d} onClick={() => openCalendar({ m: TODAY.m, d })} aria-label={`${fmtDay(TODAY.m, d)}${open.length ? `، ${toFa(open.length)} مورد` : ""}`}
              className={cn("num relative grid h-10 place-items-center rounded-field text-[12px] transition-colors hover:bg-muted", fri && "text-danger", isToday(TODAY.m, d) && "bg-primary font-bold text-primary-foreground hover:bg-primary")}>
              {toFa(d)}
              {open.length > 0 && <span className="absolute bottom-1 flex gap-0.5">{open.slice(0, 3).map((e) => <i key={e.id} className="size-1 rounded-full" style={{ background: isToday(TODAY.m, d) ? "white" : `hsl(${catMeta[e.cat].color})` }} />)}</span>}
            </button>
          );
        })}
      </div>
      {next && <p className="num mt-3 truncate text-[12.5px] text-muted-foreground">بعدی: <b className="text-foreground">{next.title}</b> · {relDay(next.m, next.d)}</p>}
    </section>
  );
}

function AgingTile() {
  const { openReport } = useApp();
  const r = reports.find((x) => x.id === "aging")!;
  return (
    <section className="panel flex flex-col p-5">
      <Head title="سنی مطالبات" action={<LinkBtn onClick={() => openReport("aging")}>گزارش</LinkBtn>} />
      <StackBars rows={r.rows.map((x) => ({ label: String(x.item), values: [x.a, x.b, x.c, x.d] as number[] }))} keys={["جاری", "تا ۳۰ روز", "تا ۶۰ روز", "بیش از ۶۰ روز"]} colors={["--seq-1", "--seq-2", "--seq-3", "--seq-4"]} />
      <p className="mt-3 text-[11.5px] text-muted-foreground">ارقام به میلیارد ریال</p>
    </section>
  );
}

function SpendTile() {
  const { openReport, unit } = useApp();
  const r = reports.find((x) => x.id === "expmix")!;
  const k = unit === "toman" ? 10 : 1;
  const total = r.rows.reduce((a, x) => a + (x.v as number), 0) / k;
  return (
    <section className="panel flex flex-col p-5">
      <Head title="ترکیب هزینه‌های آبان" action={<LinkBtn onClick={() => openReport("expmix")}>گزارش</LinkBtn>} />
      <ArcMix items={r.rows.map((x) => [String(x.item), (x.v as number) / k])} unit={`میلیارد ${unitLabel(unit)}`} onPick={() => openReport("expmix")}
        total={<><b className="num block text-[22px] leading-none">{toFa(total.toFixed(1)).replace(".", "٫")}</b><span className="mt-1 block text-[11.5px] text-muted-foreground">میلیارد {unitLabel(unit)}، جمع آبان</span></>} />
    </section>
  );
}

function FlowTile() {
  const { unit } = useApp();
  const k = unit === "toman" ? 10 : 1;
  return (
    <section className="panel flex flex-col p-5">
      <Head title="گردش نقدی آبان" action={<span className="num text-[12px] text-muted-foreground">۱ تا ۱۷ آبان</span>} />
      <Waterfall zoom total="امروز" unit={unitLabel(unit)} items={[["اول آبان", 42.1 / k], ["دریافت", 9.8 / k], ["فروش نقدی", 1.6 / k], ["خرید", -2.9 / k], ["حقوق", -0.9 / k], ["سایر", -1.35 / k]]} />
    </section>
  );
}

function HeatTile() {
  const { docs } = useApp();
  // counted from the documents: one column per week, the current week last
  const sat = dayIndex(TODAY.m, TODAY.d) - weekday(TODAY.m, TODAY.d);
  const at = (w: number, col: number) => docs.filter((d) => dayIndex(d.m, d.d) === sat - (4 - col) * 7 + w).length;
  const vals = Array.from({ length: 7 }, (_, w) => Array.from({ length: 5 }, (_, c) => at(w, c)));
  const perDay = vals.map((r) => r.reduce((a, v) => a + v, 0));
  const top = perDay.indexOf(Math.max(...perDay));
  const total = perDay.reduce((a, v) => a + v, 0);
  const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  return (
    <section className="panel flex flex-col p-5">
      <Head title="فعالیت ثبت سند" action={<span className="num text-[12px] text-muted-foreground">{toFa(total)} سند در ۵ هفته‌ی اخیر</span>} />
      <DotMatrix rows={WD_SHORT} cols={["۴ هفته پیش", "۳ هفته پیش", "۲ هفته پیش", "هفته‌ی قبل", "این هفته"]} values={vals} mark={[weekday(TODAY.m, TODAY.d), 4]} />
      <p className="mt-auto pt-3 text-[11.5px] text-muted-foreground">{total ? `بیشترین ثبت در ${DAYS[top]}‌ها بوده است؛ ${toFa(perDay[top])} سند.` : "هنوز سندی در این بازه ثبت نشده است."}</p>
    </section>
  );
}

function CloseTile() {
  const [steps, setSteps] = React.useState<{ l: string; who: string; ok: boolean }[]>([
    { l: "ثبت همه‌ی اسناد آبان", who: "علی رضایی", ok: false },
    { l: "مغایرت‌گیری بانک پارسیان", who: "رضا موسوی", ok: true },
    { l: "مغایرت‌گیری بانک ملت", who: "رضا موسوی", ok: false },
    { l: "محاسبه‌ی استهلاک آبان", who: "سودابه زلفی خرم", ok: true },
    { l: "ثبت حقوق و بیمه", who: "مریم کاظمی", ok: true },
  ]);
  const done = steps.filter((s) => s.ok).length, left = steps.length - done;
  const pct = done / steps.length, R = 22, C = 2 * Math.PI * R;
  const daysLeft = monthLength(TODAY.m) - TODAY.d;
  return (
    <section className="panel flex flex-col gap-4 p-5">
      <div className="flex items-center gap-4">
        <span className="relative grid size-[60px] shrink-0 place-items-center">
          <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="26" cy="26" r={R} fill="none" strokeWidth="5" className="stroke-muted" />
            <circle cx="26" cy="26" r={R} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-primary transition-[stroke-dashoffset] duration-500" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
          </svg>
          <b className="num text-[14px] font-extrabold">{toFa(Math.round(pct * 100))}٪</b>
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold">بستن دوره‌ی آبان</h3>
          <p className="num mt-0.5 text-[12.5px] text-muted-foreground">{left ? `${toFa(left)} کار مانده، ${toFa(daysLeft)} روز تا پایان ماه` : "همه‌ی کارها انجام شد. دوره آماده‌ی بستن است."}</p>
        </div>
      </div>
      <ol className="flex flex-col gap-1.5">
        {steps.map((s, i) => (
          <li key={s.l}>
            <button type="button" aria-pressed={s.ok} onClick={() => setSteps((x) => x.map((y, j) => (j === i ? { ...y, ok: !y.ok } : y)))}
              className={cn("flex w-full items-center gap-3 rounded-field border px-3 py-2.5 text-start transition-colors", s.ok ? "border-transparent bg-muted/50" : "border-border bg-surface/70 hover:border-primary/40")}>
              <span className={cn("num grid size-6 shrink-0 place-items-center rounded-full text-[11.5px] font-bold transition-colors", s.ok ? "bg-success text-white" : "border-2 border-border text-muted-foreground")}>{s.ok ? <Check className="size-3.5" strokeWidth={3} /> : toFa(i + 1)}</span>
              <span className="min-w-0 flex-1">
                <b className={cn("block truncate text-[13px]", s.ok && "font-semibold text-muted-foreground")}>{s.l}</b>
                <span className="block text-[11.5px] text-muted-foreground">{s.who}</span>
              </span>
              <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold", s.ok ? "text-success" : "bg-warning-soft text-warning")}>{s.ok ? "انجام شد" : "مانده"}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------- widget board: add, move, remove ----------------
   Editing collapses every widget to a slim tile (title + controls) so the order is easy to change;
   widgets not on the board appear below as live previews that can be added with one click. */
function Board({ render, span, grid }: { render: (id: string) => React.ReactNode; span: (id: string) => string; grid: string }) {
  const { widgets, setWidgets, concept } = useApp();
  const [edit, setEdit] = React.useState(false);
  const [drag, setDrag] = React.useState<string | null>(null);
  const all = WIDGETS[concept];
  const hidden = all.filter((w) => !widgets.includes(w.id));
  const move = (id: string, by: number) => {
    const i = widgets.indexOf(id), j = i + by;
    if (j < 0 || j >= widgets.length) return;
    const next = [...widgets]; [next[i], next[j]] = [next[j], next[i]]; setWidgets(next);
  };
  const def = (id: string) => all.find((w) => w.id === id);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-extrabold">{concept === "assist" ? "نمای کلی" : "پیشخوان من"}</h2>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {edit && <Button size="sm" variant="ghost" onClick={() => setWidgets(DEFAULT_WIDGETS[concept])}><RotateCcw /> چیدمان پیش‌فرض</Button>}
          <Button size="sm" variant={edit ? "default" : "outline"} onClick={() => setEdit(!edit)}>{edit ? "پایان شخصی‌سازی" : <><LayoutGrid /> شخصی‌سازی</>}</Button>
        </div>
      </div>
      {edit && <p className="-mt-2 text-[12.5px] text-muted-foreground">ویجت‌ها را بکشید یا با فلش‌ها جابه‌جا کنید. ویجت‌های پیشنهادی پایین صفحه‌اند.</p>}
      {widgets.length ? (
        <div className={grid}>
          {widgets.map((id, i) => (
            <div key={id} className={cn("relative min-w-0", span(id), !edit && "[&>*]:h-full", drag === id && "opacity-40")}
              draggable={edit}
              onDragStart={(e) => { setDrag(id); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => setDrag(null)}
              onDragOver={(e) => {
                if (!edit || !drag || drag === id) return;
                e.preventDefault();
                const next = widgets.filter((w) => w !== drag); next.splice(next.indexOf(id) + (widgets.indexOf(drag) < i ? 1 : 0), 0, drag); setWidgets(next);
              }}>
              {edit ? (
                <div className="panel flex h-[72px] items-center gap-2 border-dashed px-3 animate-rise">
                  <GripVertical className="size-5 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[13.5px]">{def(id)?.title ?? id}</b>
                    <span className="block truncate text-[11.5px] text-muted-foreground">{def(id)?.desc}</span>
                  </div>
                  <button aria-label={`جابه‌جایی ${def(id)?.title} به قبل`} onClick={() => move(id, -1)} disabled={i === 0} className="grid size-8 place-items-center rounded-md hover:bg-muted disabled:opacity-30"><ChevronUp className="size-4" /></button>
                  <button aria-label={`جابه‌جایی ${def(id)?.title} به بعد`} onClick={() => move(id, 1)} disabled={i === widgets.length - 1} className="grid size-8 place-items-center rounded-md hover:bg-muted disabled:opacity-30"><ChevronDown className="size-4" /></button>
                  <button aria-label={`حذف ${def(id)?.title}`} onClick={() => setWidgets(widgets.filter((w) => w !== id))} className="grid size-8 place-items-center rounded-md text-danger hover:bg-danger-soft"><Trash2 className="size-4" /></button>
                </div>
              ) : <div className="h-full [&>*]:h-full">{render(id)}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="panel"><Empty icon={LayoutGrid} title="ویجتی روی داشبورد نیست" text="از «شخصی‌سازی» ویجت‌های مورد نیازتان را اضافه کنید." action={<Button size="sm" variant="soft" onClick={() => setWidgets(DEFAULT_WIDGETS[concept])}>بازگرداندن چیدمان پیش‌فرض</Button>} /></div>
      )}
      {edit && (
        <section className="mt-2 flex flex-col gap-3" aria-label="ویجت‌های پیشنهادی">
          <h3 className="text-[14px] font-extrabold">ویجت‌های پیشنهادی</h3>
          {hidden.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {hidden.map((w) => (
                <div key={w.id} className="panel group flex flex-col overflow-hidden">
                  <div className="relative h-[170px] overflow-hidden border-b border-border/70 bg-muted/30" aria-hidden>
                    <div className="pointer-events-none absolute right-0 top-0 w-[200%] origin-top-right scale-50 select-none p-4 [&>*]:shadow-none">{render(w.id)}</div>
                    <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[hsl(var(--glass))] to-transparent" />
                  </div>
                  <div className="flex items-center gap-3 p-3.5">
                    <div className="min-w-0 flex-1"><b className="block text-[13.5px]">{w.title}</b><span className="block text-[12px] text-muted-foreground">{w.desc}</span></div>
                    <Button size="sm" variant="soft" onClick={() => setWidgets([...widgets, w.id])}><Plus /> افزودن</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-muted-foreground">همه‌ی ویجت‌ها روی داشبورد هستند.</p>}
        </section>
      )}
    </div>
  );
}

/* =====================================================================
   Concept 1 «دستیار»: the assistant is the main section; widgets sit below it
   ===================================================================== */
function AssistHub() {
  const { startVoucher, docs, chats, events, openAssistant, unit } = useApp();
  const [text, setText] = React.useState("");
  const attach = useAttach();
  const voice = useVoice(React.useCallback((t: string) => setText(t), []), { sample: "مانده‌ی بانک‌ها را بگو و نقدینگی تا آخر ماه را پیش‌بینی کن" });
  const pending = docs.filter((d) => d.status === "pending").length;
  const due = events.filter((e) => isToday(e.m, e.d) && !e.done).length;
  // the chips continue the latest conversation instead of repeating the same four openers
  const last = chats[0];
  const lastAsked = last ? last.msgs.filter((m) => m.who === "me").map((m) => m.text) : [];
  const next = followUps(last ? answerFor(lastAsked[lastAsked.length - 1] ?? last.title, unit)?.id : null, lastAsked, 4);
  // questions continue on the assistant page, where the conversation history lives
  const send = (t = text) => {
    const q = t.trim();
    if (!q) return;
    if (looksLikeEntry(q)) startVoucher({ text: q }); else openAssistant({ ask: q });
  };
  return (
    <section data-tour="hero" className="hero flex flex-col p-6 lg:p-7">
      <div className="flex flex-wrap items-center gap-4">
        <Orb size={64} busy={voice.rec} />
        <div className="min-w-[200px] flex-1">
          <p className="text-[13px] font-bold text-muted-foreground">صبح بخیر، سودابه</p>
          <h2 className="num mt-1 text-[21px] font-extrabold leading-9 lg:text-[23px]">
            {pending ? `${toFa(pending)} سند منتظر تأیید شماست` : "سندی منتظر تأیید نیست"}{due ? ` و ${toFa(due)} کار برای امروز دارید.` : "."}
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => openAssistant()}><History /> گفت‌وگوهای قبلی <span className="num rounded-full bg-muted px-1.5 text-[11px]">{toFa(chats.length)}</span></Button>
      </div>
      {voice.rec ? <VoiceBar voice={voice} className="mt-6 min-h-[58px]" /> : (
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-6 flex items-center gap-1.5 rounded-[calc(var(--r-field)+4px)] border border-input bg-surface p-1.5 ps-4 shadow-soft focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label="پیام به دستیار"
          placeholder="بپرسید یا رویداد را بنویسید؛ مثلاً «۵۰۰ میلیون تومان از مارون واریز شد»"
          className="h-11 min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground" />
        <MicButton voice={voice} />
        <button type="button" aria-label="بارگذاری مدرک" onClick={attach.open} className="grid size-10 shrink-0 place-items-center rounded-field text-muted-foreground hover:bg-muted hover:text-foreground"><Paperclip className="size-5" /></button>
        {attach.input}
        <Button type="submit" variant="ai" className="h-10 shrink-0 px-4" disabled={!text.trim()}><Send /> ارسال</Button>
      </form>
      )}
      <VoiceError voice={voice} sample="۵۰۰ میلیون تومان از پتروشیمی مارون به پارسیان واریز شد" onSample={setText} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {next.map((s) => (
          <button key={s} onClick={() => send(s)} className="chip h-8 bg-surface">{s}</button>
        ))}
      </div>
    </section>
  );
}

const ASSIST_SPAN: Record<string, string> = { kpis: "lg:col-span-12", decisions: "lg:col-span-7", agenda: "lg:col-span-5", cash: "lg:col-span-7", recent: "lg:col-span-5", approvals: "lg:col-span-5", close: "lg:col-span-7" };
function AssistDashboard() {
  const render = (id: string) => ({ kpis: <Kpis />, decisions: <Decisions />, agenda: <Agenda />, recent: <RecentDocs dense />, cash: <CashTile />, approvals: <ApprovalTile />, close: <CloseTile /> }[id] ?? null);
  return (
    <div className="flex flex-col gap-6">
      <AssistHub />
      <Board render={render} span={(id) => ASSIST_SPAN[id] ?? "lg:col-span-6"} grid="grid grid-flow-row-dense grid-cols-1 gap-5 lg:grid-cols-12" />
    </div>
  );
}

/* =====================================================================
   Concept 2 «پیشخوان»: a bento board; the assistant is a command strip on top
   ===================================================================== */
function BentoCommand() {
  const { openPalette, startVoucher } = useApp();
  const [text, setText] = React.useState("");
  const attach = useAttach();
  const send = () => { const t = text.trim(); if (!t) return; looksLikeEntry(t) ? startVoucher({ text: t }) : openPalette(t); };
  return (
    <section data-tour="hero" className="hero flex flex-wrap items-center gap-4 p-4">
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex min-w-[280px] flex-1 items-center gap-2">
        <Orb size={36} />
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label="دستور به دستیار" placeholder="دستور بدهید: «تراز آزمایشی آبان» یا «۱۲ میلیون کرایه‌ی حمل دادیم»"
          className="h-11 min-w-0 flex-1 rounded-field border border-input bg-surface px-3.5 text-[14px] outline-none focus:border-ring focus:ring-4 focus:ring-ring/15" />
        <Button type="button" variant="outline" size="icon" aria-label="بارگذاری مدرک" onClick={attach.open}><Paperclip /></Button>
        {attach.input}
        <Button type="submit" variant="ai" className="h-10" disabled={!text.trim()}>اجرا</Button>
      </form>
    </section>
  );
}

const BENTO_SPAN: Record<string, string> = {
  stats: "md:col-span-6 xl:col-span-12", cash: "md:col-span-6 xl:col-span-8", month: "md:col-span-6 xl:col-span-4",
  flow: "md:col-span-6 xl:col-span-7", spend: "md:col-span-6 xl:col-span-5", aging: "md:col-span-6 xl:col-span-5",
  recent: "md:col-span-6 xl:col-span-7", approvals: "md:col-span-3 xl:col-span-4", heat: "md:col-span-3 xl:col-span-8",
  close: "md:col-span-3 xl:col-span-4", decisions: "md:col-span-6 xl:col-span-8",
};

function BentoDashboard() {
  const render = (id: string) => ({
    stats: <StatCards />, cash: <CashTile />, approvals: <ApprovalTile />, month: <MonthTile />, aging: <AgingTile />, flow: <FlowTile />, heat: <HeatTile />,
    spend: <SpendTile />, recent: <RecentDocs dense />, decisions: <Decisions />, close: <CloseTile />,
  }[id] ?? null);
  return (
    <div className="flex flex-col gap-5">
      <BentoCommand />
      <Board render={render} span={(id) => BENTO_SPAN[id] ?? "xl:col-span-6"} grid="grid grid-flow-row-dense grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12" />
    </div>
  );
}

export function Dashboard() {
  const { concept } = useApp();
  return concept === "bento" ? <BentoDashboard /> : <AssistDashboard />;
}

