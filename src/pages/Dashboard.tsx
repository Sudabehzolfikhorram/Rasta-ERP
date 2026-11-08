import * as React from "react";
import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, CalendarDays, CheckCheck, ChevronDown, ChevronUp, FileImage, GripVertical, History, LayoutGrid, Mic, Paperclip, Plus, RotateCcw, Send, ShieldCheck, TimerReset, Trash2, X } from "lucide-react";
import { DEFAULT_WIDGETS, useApp, WIDGETS, type Chat } from "@/lib/store";
import { cashActual, cashForecast, catMeta, inbox, kpis, statusLabel, type DocStatus, type InboxItem } from "@/data/demo";
import { reports } from "@/data/reports";
import { cn, money, short, toFa, unitLabel } from "@/lib/utils";
import { dayIndex, diffDays, fmtDay, isToday, monthLength, relDay, TODAY, weekday, WD_SHORT } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WhyPopover } from "@/components/ai/WhyPopover";
import { Orb } from "@/components/ai/Orb";
import { answerFor } from "@/components/ai/CommandPalette";
import { CashChart, Ring, Spark, StackBars, Treemap, TrendArea } from "@/components/charts";
import { ACCEPT } from "@/components/voucher/analyze";
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

function KpiCard({ k }: { k: (typeof kpis)[number] }) {
  const { unit } = useApp();
  const s = short(k.rial, unit);
  const u = unitLabel(unit);
  const fmt = (v: number) => `${toFa(String(+((unit === "rial" ? v : v / 10)).toFixed(2))).replace(".", "٫")} میلیارد ${u}`;
  return (
    <div className="panel relative flex min-h-[196px] flex-col overflow-hidden p-5">
      <div className="flex items-center gap-2">
        <span className="text-[13.5px] font-bold">{k.label}</span>
        <Delta k={k} />
        <WhyPopover className="ms-auto" title={k.label} line={k.why.line} parts={k.why.parts} />
      </div>
      <span className="text-[11.5px] text-muted-foreground">۳۰ روز گذشته</span>
      <div className="relative z-10 mt-auto">
        <div className="num text-[32px] font-extrabold leading-none tracking-tight">{s.n}</div>
        <div className="num mt-1.5 text-[12px] text-muted-foreground">{s.s} {u} · {k.today}</div>
      </div>
      <TrendArea data={k.series} tone={k.id === "pl" ? "ai" : "primary"} fmt={fmt} labelFor={(i) => { const d = TODAY.d - i; return d > 0 ? fmtDay(8, d) : fmtDay(7, 30 + d); }}
        className="absolute bottom-0 left-0 h-[56%] w-[60%]" />
    </div>
  );
}
function Kpis() {
  return <div data-tour="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">{kpis.map((k) => <KpiCard key={k.id} k={k} />)}</div>;
}

function Decisions({ layout = "list" }: { layout?: "list" | "grid" }) {
  const { items, primary, remove } = useDecisions();
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
                {i.secondary && <Button size="sm" variant="ghost" onClick={() => remove(i.id, "ثبت شد: این دو سند تکراری نیستند.")}>{i.secondary}</Button>}
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

export function Empty({ icon: I, title, text, action }: { icon: typeof X; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><I className="size-5" /></span>
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
        <ul className="flex flex-col">
          {list.map((d) => (
            <li key={d.id}>
              <button onClick={() => openDoc(d.id)} className="-mx-2 grid w-[calc(100%+16px)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-field px-2 py-2.5 text-start transition-colors hover:bg-muted/70">
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-bold">{d.title}</span>
                  <span className="num block truncate text-[12px] text-muted-foreground">{docNo(d.m, d.seq)} · {fmtDay(d.m, d.d)}{dense ? "" : ` · ${partyOf(d)}`}</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <b className="num text-[13px]">{money(docTotal(d), unit)}</b>
                  <Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge>
                </span>
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

function MiniKpis() {
  const { unit } = useApp();
  return (
    <div data-tour="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {kpis.slice(1).map((k, i) => {
        const s = short(k.rial, unit);
        return (
          <div key={k.id} className="panel flex flex-col p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold">{k.label}<span className="ms-auto"><Delta k={k} /></span></div>
            <div className="num mt-2 text-[24px] font-extrabold leading-none">{s.n} <span className="text-[11.5px] font-medium text-muted-foreground">{s.s} {unitLabel(unit)}</span></div>
            <Spark data={k.series} className={cn("mt-3 h-9", ["text-ch-1", "text-ch-3", "text-ch-2"][i])} />
          </div>
        );
      })}
    </div>
  );
}

function ApprovalTile() {
  const { docs, go } = useApp();
  const n = (s: DocStatus) => docs.filter((d) => d.status === s).length;
  const posted = n("posted");
  return (
    <section className="panel flex flex-col p-5">
      <Head title="وضعیت اسناد آبان" />
      <div className="flex items-center gap-4">
        <Ring value={posted / docs.length} size={88} stroke={8} tone="success">
          <span className="num text-[18px] font-extrabold leading-none">{toFa(Math.round((posted / docs.length) * 100))}٪</span>
        </Ring>
        <ul className="num flex flex-1 flex-col gap-1.5 text-[13px]">
          <li className="flex justify-between"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-success" />تأییدشده</span><b>{toFa(posted)}</b></li>
          <li className="flex justify-between"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-warning" />منتظر تأیید</span><b>{toFa(n("pending"))}</b></li>
          <li className="flex justify-between"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-muted-foreground" />پیش‌نویس</span><b>{toFa(n("draft"))}</b></li>
        </ul>
      </div>
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
  return (
    <section className="panel flex flex-col p-5">
      <Head title="ترکیب هزینه‌های آبان" action={<LinkBtn onClick={() => openReport("expmix")}>گزارش</LinkBtn>} />
      <Treemap height={210} items={[...r.rows.slice(0, 3).map((x) => [String(x.item), (x.v as number) / k] as [string, number]), ["سایر", r.rows.slice(3).reduce((a, x) => a + (x.v as number), 0) / k]]} unit={`میلیارد ${unitLabel(unit)}`} onPick={() => openReport("expmix")} />
    </section>
  );
}

function CloseTile() {
  const [steps, setSteps] = React.useState<[string, boolean][]>([["ثبت همه‌ی اسناد آبان", false], ["مغایرت‌گیری بانک پارسیان", true], ["مغایرت‌گیری بانک ملت", false], ["محاسبه‌ی استهلاک آبان", true], ["ثبت حقوق و بیمه", true]]);
  const done = steps.filter((s) => s[1]).length;
  return (
    <section className="panel flex flex-col p-5">
      <Head title="چک‌لیست پایان دوره‌ی آبان" action={<span className="num text-[12.5px] text-muted-foreground">{toFa(done)} از {toFa(steps.length)}</span>} />
      <div className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ul className="mt-3 flex flex-col gap-2">
        {steps.map(([l, ok], i) => (
          <li key={l}>
            <label className={cn("flex cursor-pointer items-center gap-2.5 text-[13px]", ok && "text-muted-foreground line-through decoration-1")}>
              <Checkbox checked={ok} onCheckedChange={(v) => setSteps((x) => x.map((s, j) => (j === i ? [s[0], !!v] : s)))} />{l}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- widget board: add, move, remove ---------------- */
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
  const titleOf = (id: string) => all.find((w) => w.id === id)?.title ?? id;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-extrabold">{concept === "assist" ? "نمای کلی" : "پیشخوان من"}</h2>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {edit && (
            <>
              <Popover>
                <PopoverTrigger asChild><Button size="sm" variant="outline" disabled={!hidden.length}><Plus /> افزودن ویجت</Button></PopoverTrigger>
                <PopoverContent align="end" className="w-60 p-1.5">
                  {hidden.map((w) => (
                    <button key={w.id} onClick={() => setWidgets([...widgets, w.id])} className="flex w-full items-center gap-2 rounded-field px-3 py-2 text-start text-[13px] hover:bg-muted"><Plus className="size-4 text-muted-foreground" />{w.title}</button>
                  ))}
                </PopoverContent>
              </Popover>
              <Button size="sm" variant="ghost" onClick={() => setWidgets(DEFAULT_WIDGETS[concept])}><RotateCcw /> چیدمان پیش‌فرض</Button>
            </>
          )}
          <Button size="sm" variant={edit ? "default" : "outline"} onClick={() => setEdit(!edit)}>{edit ? "پایان ویرایش" : <><LayoutGrid /> شخصی‌سازی</>}</Button>
        </div>
      </div>
      {edit && <p className="-mt-2 text-[12.5px] text-muted-foreground">ویجت‌ها را بکشید و جابه‌جا کنید، یا با دکمه‌های بالا و پایین ترتیبشان را عوض کنید.</p>}
      {widgets.length ? (
        <div className={grid}>
          {widgets.map((id, i) => (
            <div key={id} className={cn("relative min-w-0 [&>*]:h-full", span(id), edit && "rounded-[calc(var(--radius)+6px)] p-1.5 outline-dashed outline-2 outline-offset-0 outline-primary/35", drag === id && "opacity-50")}
              draggable={edit}
              onDragStart={(e) => { setDrag(id); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => setDrag(null)}
              onDragOver={(e) => {
                if (!edit || !drag || drag === id) return;
                e.preventDefault();
                const next = widgets.filter((w) => w !== drag); next.splice(next.indexOf(id) + (widgets.indexOf(drag) < i ? 1 : 0), 0, drag); setWidgets(next);
              }}>
              {edit && (
                <div className="absolute inset-x-3 top-3 z-20 flex items-center gap-1 rounded-field border border-border bg-popover px-2 py-1 shadow-lift">
                  <GripVertical className="size-4 cursor-grab text-muted-foreground" aria-hidden />
                  <b className="flex-1 truncate text-[12.5px]">{titleOf(id)}</b>
                  <button aria-label={`بالا بردن ${titleOf(id)}`} onClick={() => move(id, -1)} disabled={i === 0} className="grid size-7 place-items-center rounded-md hover:bg-muted disabled:opacity-30"><ChevronUp className="size-4" /></button>
                  <button aria-label={`پایین بردن ${titleOf(id)}`} onClick={() => move(id, 1)} disabled={i === widgets.length - 1} className="grid size-7 place-items-center rounded-md hover:bg-muted disabled:opacity-30"><ChevronDown className="size-4" /></button>
                  <button aria-label={`حذف ${titleOf(id)}`} onClick={() => setWidgets(widgets.filter((w) => w !== id))} className="grid size-7 place-items-center rounded-md text-danger hover:bg-danger-soft"><Trash2 className="size-4" /></button>
                </div>
              )}
              <div className={cn("h-full [&>*]:h-full", edit && "pointer-events-none select-none")}>{render(id)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel"><Empty icon={LayoutGrid} title="ویجتی روی داشبورد نیست" text="از «شخصی‌سازی» ویجت‌های مورد نیازتان را اضافه کنید." action={<Button size="sm" variant="soft" onClick={() => setWidgets(DEFAULT_WIDGETS[concept])}>بازگرداندن چیدمان پیش‌فرض</Button>} /></div>
      )}
    </div>
  );
}

/* =====================================================================
   Concept 1 «دستیار»: the assistant is the main section; widgets sit below it
   ===================================================================== */
function AssistHub() {
  const { startVoucher, docs, chats, startChat, addMsg, unit, openReport, events } = useApp();
  const [text, setText] = React.useState("");
  const [active, setActive] = React.useState<string | null>(null);
  const [thinking, setThinking] = React.useState(false);
  const attach = useAttach();
  const pending = docs.filter((d) => d.status === "pending").length;
  const due = events.filter((e) => isToday(e.m, e.d) && !e.done).length;
  const chat = chats.find((c) => c.id === active) ?? null;

  const send = (t = text) => {
    const q = t.trim();
    if (!q) return;
    if (looksLikeEntry(q)) { startVoucher({ text: q }); return; }
    const id = active && chat ? (addMsg(active, { who: "me", text: q }), active) : startChat("home", q);
    setActive(id);
    setText("");
    setThinking(true);
    setTimeout(() => {
      const a = answerFor(q, unit);
      addMsg(id, { who: "ai", text: a ? `${a.line}${a.rows.length ? "\n" + a.rows.map(([k, v]) => `• ${k}: ${v}`).join("\n") : ""}` : "در این نسخه درباره‌ی مانده‌ی بانک‌ها، تراز آزمایشی، نقدینگی، چک‌ها، مشتری‌ها و اسناد منتظر تأیید پاسخ می‌دهم. برای ثبت سند، رویداد را در یک جمله بنویسید." });
      setThinking(false);
    }, 900);
  };

  return (
    <section data-tour="hero" className="hero grid gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-h-[340px] flex-col p-6 lg:p-7">
        {chat ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              <button onClick={() => setActive(null)} className="flex items-center gap-1 text-[12.5px] font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4 rotate-180" /> گفت‌وگوی جدید</button>
              <b className="ms-auto max-w-[60%] truncate text-[13px]">{chat.title}</b>
            </div>
            <ol className="flex max-h-[300px] flex-1 flex-col gap-3 overflow-y-auto pe-1" aria-live="polite">
              {chat.msgs.map((m, i) => (
                <li key={i} className={cn("flex items-start gap-2.5 animate-rise", m.who === "me" && "flex-row-reverse")}>
                  {m.who === "ai" && <Orb size={26} />}
                  <div className={cn("num max-w-[85%] whitespace-pre-line rounded-[calc(var(--r-field)+4px)] px-4 py-2.5 text-[13.5px] leading-7", m.who === "me" ? "bg-primary text-primary-foreground" : "border border-border bg-surface")}>{m.text}</div>
                </li>
              ))}
              {thinking && <li className="flex items-center gap-2.5 text-[13px] text-muted-foreground"><Orb size={26} busy /> در حال بررسی اسناد…</li>}
            </ol>
            {chat.scope === "reports" && <Button size="sm" variant="outline" className="mt-3 w-fit" onClick={() => openReport("statements")}>باز کردن گزارش</Button>}
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex items-center gap-4">
              <Orb size={64} busy={thinking} />
              <div>
                <p className="text-[13px] font-bold text-muted-foreground">صبح بخیر، سارا</p>
                <h2 className="num mt-1 text-[21px] font-extrabold leading-9 lg:text-[23px]">
                  {pending ? `${toFa(pending)} سند منتظر تأیید شماست` : "سندی منتظر تأیید نیست"}{due ? ` و ${toFa(due)} کار برای امروز دارید.` : "."}
                </h2>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["مانده‌ی بانک‌ها", "چرا نقدینگی بالا رفت؟", "اسناد منتظر تأیید", "چک تکین‌کو"].map((s) => (
                <button key={s} onClick={() => send(s)} className="chip h-8 bg-surface">{s}</button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-5 flex items-center gap-1.5 rounded-[calc(var(--r-field)+4px)] border border-input bg-surface p-1.5 ps-4 shadow-soft focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="پیام به دستیار"
            placeholder={chat ? "ادامه‌ی گفت‌وگو…" : "بپرسید یا رویداد را بنویسید؛ مثلاً «۵۰۰ میلیون تومان از مارون واریز شد»"}
            className="h-10 min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground" />
          <button type="button" aria-label="ضبط صدا" onClick={() => startVoucher()} className="grid size-10 shrink-0 place-items-center rounded-field text-muted-foreground hover:bg-muted hover:text-foreground"><Mic className="size-5" /></button>
          <button type="button" aria-label="بارگذاری مدرک" onClick={attach.open} className="grid size-10 shrink-0 place-items-center rounded-field text-muted-foreground hover:bg-muted hover:text-foreground"><Paperclip className="size-5" /></button>
          {attach.input}
          <Button type="submit" variant="ai" className="h-10 shrink-0 px-4" disabled={!text.trim() || thinking}><Send /> ارسال</Button>
        </form>
      </div>
      <ChatHistory active={active} onPick={setActive} />
    </section>
  );
}

function ChatHistory({ active, onPick }: { active: string | null; onPick: (id: string | null) => void }) {
  const { chats, removeChat } = useApp();
  return (
    <aside className="flex flex-col border-t border-border/70 bg-surface/40 p-4 lg:border-s lg:border-t-0" aria-label="گفت‌وگوهای قبلی">
      <div className="mb-2 flex items-center gap-2 px-1">
        <History className="size-4 text-muted-foreground" />
        <b className="text-[13px]">گفت‌وگوهای قبلی</b>
        <button onClick={() => onPick(null)} className="ms-auto flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"><Plus className="size-3.5" /> جدید</button>
      </div>
      {chats.length ? (
        <ul className="flex max-h-[330px] flex-col gap-0.5 overflow-y-auto">
          {chats.map((c: Chat) => (
            <li key={c.id} className="group relative">
              <button onClick={() => onPick(c.id)} aria-current={active === c.id ? "true" : undefined}
                className={cn("w-full rounded-field px-3 py-2 pe-9 text-start transition-colors hover:bg-muted/80", active === c.id && "bg-primary-soft")}>
                <span className={cn("block truncate text-[13px] font-semibold", active === c.id && "text-primary")}>{c.title}</span>
                <span className="num block text-[11.5px] text-muted-foreground">{c.when} · {c.scope === "reports" ? "گزارش‌ها" : c.scope === "doc" ? "سند" : "داشبورد"}</span>
              </button>
              <button aria-label={`حذف گفت‌وگوی ${c.title}`} onClick={() => { removeChat(c.id); if (active === c.id) onPick(null); }}
                className="absolute end-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"><X className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      ) : <Empty icon={History} title="گفت‌وگویی ذخیره نشده" text="پرسش‌های شما از دستیار اینجا می‌ماند." />}
    </aside>
  );
}

function AssistDashboard() {
  const render = (id: string) => ({ kpis: <Kpis />, decisions: <Decisions />, agenda: <Agenda />, recent: <RecentDocs />, cash: <CashTile /> }[id] ?? null);
  return (
    <div className="flex flex-col gap-6">
      <AssistHub />
      <Board render={render} span={(id) => (id === "kpis" || id === "cash" ? "lg:col-span-2" : "")} grid="grid grid-cols-1 gap-5 lg:grid-cols-2" />
    </div>
  );
}

/* =====================================================================
   Concept 2 «پیشخوان»: a bento board; the assistant is a command strip on top
   ===================================================================== */
function BentoCommand() {
  const { openPalette, startVoucher, docs, events, go } = useApp();
  const [text, setText] = React.useState("");
  const attach = useAttach();
  const pending = docs.filter((d) => d.status === "pending").length;
  const todayLeft = events.filter((e) => isToday(e.m, e.d) && !e.done).length;
  const send = () => { const t = text.trim(); if (!t) return; looksLikeEntry(t) ? startVoucher({ text: t }) : openPalette(t); };
  return (
    <section data-tour="hero" className="hero flex flex-wrap items-center gap-4 p-4">
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex min-w-[280px] flex-[2] items-center gap-2">
        <Orb size={36} />
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label="دستور به دستیار" placeholder="دستور بدهید: «تراز آزمایشی آبان» یا «۱۲ میلیون کرایه‌ی حمل دادیم»"
          className="h-11 min-w-0 flex-1 rounded-field border border-input bg-surface px-3.5 text-[14px] outline-none focus:border-ring focus:ring-4 focus:ring-ring/15" />
        <Button type="button" variant="outline" size="icon" aria-label="بارگذاری مدرک" onClick={attach.open}><Paperclip /></Button>
        {attach.input}
        <Button type="submit" variant="ai" className="h-10" disabled={!text.trim()}>اجرا</Button>
      </form>
      <dl className="flex flex-1 flex-wrap gap-2">
        {([[pending, "منتظر تأیید", () => go("documents"), "warning"], [todayLeft, "کار امروز", () => go("calendar"), "info"]] as const).map(([n, l, fn, tone]) => (
          <button key={l} onClick={fn} className="flex min-w-[120px] flex-1 items-center gap-2.5 rounded-field border border-border bg-surface/70 px-3 py-2 text-start hover:bg-surface">
            <span className={cn("num grid size-8 place-items-center rounded-field text-[15px] font-extrabold", tone === "warning" ? "bg-warning-soft text-warning" : "bg-info-soft text-info")}>{toFa(n)}</span>
            <span className="text-[12.5px] font-semibold">{l}</span>
          </button>
        ))}
      </dl>
    </section>
  );
}

const BENTO_SPAN: Record<string, string> = {
  cash: "md:col-span-6 xl:col-span-7", month: "md:col-span-6 xl:col-span-5", minis: "md:col-span-6 xl:col-span-12",
  approvals: "md:col-span-3 xl:col-span-4", aging: "md:col-span-3 xl:col-span-4", spend: "md:col-span-6 xl:col-span-4",
  recent: "md:col-span-6 xl:col-span-7", close: "md:col-span-6 xl:col-span-5", decisions: "md:col-span-6 xl:col-span-12",
};

function BentoDashboard() {
  const render = (id: string) => ({
    cash: <CashTile />, minis: <MiniKpis />, approvals: <ApprovalTile />, month: <MonthTile />, aging: <AgingTile />,
    spend: <SpendTile />, recent: <RecentDocs dense />, decisions: <Decisions />, close: <CloseTile />,
  }[id] ?? null);
  return (
    <div className="flex flex-col gap-5">
      <BentoCommand />
      <Board render={render} span={(id) => BENTO_SPAN[id] ?? "xl:col-span-6"} grid="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12" />
    </div>
  );
}

export function Dashboard() {
  const { concept } = useApp();
  return concept === "bento" ? <BentoDashboard /> : <AssistDashboard />;
}

