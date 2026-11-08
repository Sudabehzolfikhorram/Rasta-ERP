import * as React from "react";
import { ArrowRight, ArrowUp, Check, ChevronDown, Download, FileSpreadsheet, FileText, Filter, History, LayoutDashboard, MessageSquareText, Plus, Printer, Send, Trash2, X } from "@/components/icons";
import { useApp } from "@/lib/store";
import { reports, reportGroups, type Report, type Row } from "@/data/reports";
import { cashActual, cashForecast } from "@/data/demo";
import { cn, toFa, toEn, unitLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CashChart, PairBars, RankBars, StackBars, Treemap, Waterfall } from "@/components/charts";
import { Checkbox } from "@/components/ui/checkbox";
import { Orb } from "@/components/ai/Orb";
import { SystemOverview, SystemScorecard } from "@/pages/Overview";
import { Empty } from "@/pages/Dashboard";

type Period = "aban" | "mehr" | "autumn";
const periods: [Period, string, number][] = [["aban", "آبان", 1], ["mehr", "مهر", 0.92], ["autumn", "پاییز تا امروز", 1.92]];
type Cond = { id: number; col: string; op: ">" | "<" | "=" | "~"; val: string };

const fa = (v: number) => toFa(String(+v.toFixed(2))).replace(".", "٫");

function scaleRows(r: Report, k: number, toman: boolean): Row[] {
  const fixed = r.id === "statements" || r.id === "expcmp"; // these two already name their months
  return r.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, v]) => {
    const col = r.cols.find((c) => c.key === key);
    if (typeof v !== "number" || !col?.num || /٪/.test(col.label)) return [key, v];
    return [key, +(v * (fixed ? 1 : k) / (toman ? 10 : 1)).toFixed(3)];
  })));
}

function exportCsv(r: Report, rows: Row[], unit: string) {
  const head = r.cols.map((c) => (c.num && !/٪/.test(c.label) ? `${c.label} (میلیارد ${unit})` : c.label));
  const body = rows.map((row) => r.cols.map((c) => String(row[c.key] ?? "")));
  const csv = "﻿" + [head, ...body].map((l) => l.map((x) => `"${x.replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `rasta-${r.id}-1405-08.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- side assistant: runs multi-step jobs ---------- */
type Job = { id: string; ask: string; steps: string[]; report?: string; done: string; kind?: "send" | "export" };
const JOBS: { re: RegExp; make: (ask: string) => Job }[] = [
  { re: /صورت.?حساب|بفرست|ارسال/, make: (ask) => ({ id: "send", ask, report: "statements", kind: "send", steps: ["پیدا کردن مشتری‌های بدهکار مهر", "ساختن صورت‌حساب مهر برای ۴ مشتری", "تطبیق مانده‌ها با دفتر معین", "آماده کردن پیام و فایل PDF"], done: "صورت‌حساب‌ها آماده است. پیش از ارسال، گیرنده‌ها را ببینید." }) },
  { re: /مقایسه|مهر.*آبان|آبان.*مهر/, make: (ask) => ({ id: "cmp", ask, report: "expcmp", steps: ["جمع هزینه‌های مهر و آبان", "مقایسه‌ی سرفصل به سرفصل", "پیدا کردن بیشترین تغییر"], done: "هزینه‌های آبان ۴٪ بیشتر از مهر است. بیشترین افزایش در حمل‌ونقل است: ۱۸٪." }) },
  { re: /اکسل|خروجی|تراز/, make: (ask) => ({ id: "xls", ask, report: "tb", kind: "export", steps: ["ساختن تراز آزمایشی آبان", "کنترل برابری گردش‌ها", "آماده کردن فایل اکسل"], done: "فایل تراز آزمایشی آبان دانلود شد." }) },
  { re: /سود|چرا/, make: (ask) => ({ id: "pl", ask, report: "pl", steps: ["خواندن سود و زیان آبان", "مقایسه با مهر"], done: "سود آبان ۳٫۱۵ میلیارد ریال است؛ ۱۱٪ بیشتر از مهر، چون فروش بالا رفت. هزینه‌ی حمل هم ۱۸٪ بیشتر شد." }) },
  { re: /معوق|۶۰|بدهکار|سنی/, make: (ask) => ({ id: "aging", ask, report: "aging", steps: ["خواندن مانده‌ی مشتری‌ها", "دسته‌بندی بر اساس عمر طلب"], done: "دو مشتری بیش از ۶۰ روز بدهکارند: سیمان تهران (۱٫۱ میلیارد) و پتروشیمی مارون (۰٫۳۸ میلیارد ریال)." }) },
];
const SUGGEST = ["صورت‌حساب مهر را آماده کن و برای مشتری‌های بدهکار بفرست", "هزینه‌های آبان را با مهر مقایسه کن", "تراز آزمایشی آبان را اکسل بگیر", "کدام مشتری‌ها بیش از ۶۰ روز بدهکارند؟"];

function JobCard({ job, onFinish }: { job: Job; onFinish: (j: Job) => void }) {
  const { toast } = useApp();
  const [i, setI] = React.useState(0);
  const [sent, setSent] = React.useState<"no" | "sending" | "yes">("no");
  const [to, setTo] = React.useState(["پخش البرز", "پتروشیمی مارون", "سیمان تهران", "فولاد مبارکه"]);
  const done = i >= job.steps.length;
  React.useEffect(() => {
    if (done) { onFinish(job); return; }
    const t = setTimeout(() => setI(i + 1), 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  const all = ["پخش البرز", "پتروشیمی مارون", "سیمان تهران", "فولاد مبارکه"];
  return (
    <div className="rounded-field border border-border bg-surface p-3.5 animate-rise">
      <ol className="flex flex-col gap-2">
        {job.steps.map((s, k) => (
          <li key={s} className={cn("flex items-center gap-2.5 text-[12.5px] transition-colors", k > i && "text-muted-foreground/70")}>
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-300", k < i ? "bg-ai text-white" : k === i ? "bg-ai-soft text-ai-ink" : "bg-muted")}>
              {k < i ? <Check className="size-3" strokeWidth={3} /> : k === i ? <Orb size={14} busy /> : null}
            </span>
            <span className={cn("flex-1", k === i && "font-bold")}>{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full ai-edge transition-[width] duration-700 ease-out" style={{ width: `${(Math.min(i, job.steps.length) / job.steps.length) * 100}%` }} />
      </div>
      {done && (
        <div className="mt-3 animate-rise">
          <p className="num text-[13px] leading-7">{job.done}</p>
          {job.kind === "send" && sent !== "yes" && (
            <div className="mt-2">
              <ul className="flex flex-col gap-1">
                {all.map((c) => (
                  <li key={c}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[12.5px] hover:bg-muted">
                      <Checkbox checked={to.includes(c)} onCheckedChange={() => setTo((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))} />
                      <span className="flex-1">{c}</span>
                      <span className="text-[11px] text-muted-foreground">ایمیل و پیامک</span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button size="sm" className="mt-2 w-full" disabled={!to.length || sent === "sending"} onClick={() => { setSent("sending"); setTimeout(() => { setSent("yes"); toast(`صورت‌حساب مهر برای ${toFa(to.length)} مشتری فرستاده شد.`, "ai"); }, 1100); }}>
                {sent === "sending" ? <Orb size={16} busy /> : <Send />} ارسال برای {toFa(to.length)} مشتری
              </Button>
            </div>
          )}
          {sent === "yes" && <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-bold text-success"><Check className="size-4" /> برای {toFa(to.length)} مشتری فرستاده شد.</p>}
        </div>
      )}
    </div>
  );
}

function Assistant({ onReport, onExport, close }: { onReport: (id: string) => void; onExport: () => void; close?: () => void }) {
  const { chats, startChat, addMsg } = useApp();
  const [msgs, setMsgs] = React.useState<({ who: "me"; text: string } | { who: "ai"; job?: Job; text?: string; key: number })[]>([]);
  const [text, setText] = React.useState("");
  const [showHistory, setShowHistory] = React.useState(false);
  const chatId = React.useRef<string | null>(null);
  const end = React.useRef<HTMLDivElement>(null);
  const past = chats.filter((c) => c.scope === "reports");
  React.useEffect(() => { end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msgs]);
  const run = (ask: string) => {
    if (!ask.trim()) return;
    const hit = JOBS.find((j) => j.re.test(ask));
    if (!chatId.current) chatId.current = startChat("reports", ask); else addMsg(chatId.current, { who: "me", text: ask });
    setMsgs((m) => [...m, { who: "me", text: ask }, hit ? { who: "ai", job: hit.make(ask), key: Date.now() } : { who: "ai", text: "این کار در این نسخه پشتیبانی نمی‌شود. یکی از پیشنهادهای زیر را امتحان کنید.", key: Date.now() }]);
    setText("");
    setShowHistory(false);
  };
  const finish = React.useCallback((j: Job) => {
    if (chatId.current) addMsg(chatId.current, { who: "ai", text: j.done });
    if (j.report) onReport(j.report);
    if (j.kind === "export") setTimeout(onExport, 200);
  }, [onReport, onExport, addMsg]);
  const openPast = (id: string) => {
    const c = chats.find((x) => x.id === id); if (!c) return;
    chatId.current = c.id;
    setMsgs(c.msgs.map((m, k) => (m.who === "me" ? { who: "me", text: m.text } : { who: "ai", text: m.text, key: k })));
    setShowHistory(false);
  };
  return (
    <section className="panel flex h-full min-h-[520px] flex-col overflow-hidden" aria-label="دستیار گزارش">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <Orb size={28} />
        <b className="text-[14px]">دستیار گزارش</b>
        <div className="ms-auto flex gap-1">
          <button aria-label="گفت‌وگوی جدید" title="گفت‌وگوی جدید" onClick={() => { chatId.current = null; setMsgs([]); setShowHistory(false); }} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="size-4" /></button>
          <button aria-label="گفت‌وگوهای قبلی" aria-pressed={showHistory} title="گفت‌وگوهای قبلی" onClick={() => setShowHistory(!showHistory)} className={cn("grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground", showHistory && "bg-primary-soft text-primary")}><History className="size-4" /></button>
          {close && <button aria-label="بستن دستیار" onClick={close} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" /></button>}
        </div>
      </div>
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-3">
          <button onClick={() => setShowHistory(false)} className="mb-2 flex items-center gap-1 px-1 text-[12.5px] font-bold text-muted-foreground hover:text-foreground"><ArrowRight className="size-4" /> بازگشت</button>
          {past.length ? (
            <ul className="flex flex-col gap-0.5">
              {past.map((c) => (
                <li key={c.id}><button onClick={() => openPast(c.id)} className="w-full rounded-field px-3 py-2 text-start hover:bg-muted"><span className="block truncate text-[13px] font-semibold">{c.title}</span><span className="num text-[11.5px] text-muted-foreground">{c.when}</span></button></li>
              ))}
            </ul>
          ) : <Empty icon={History} title="هنوز گفت‌وگویی ندارید" />}
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {msgs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Orb size={56} />
              <p className="max-w-[260px] text-[13px] leading-7 text-muted-foreground">کار چندمرحله‌ای را بنویسید. مراحل را همین‌جا می‌بینید و پیش از هر ارسالی تأیید شما گرفته می‌شود.</p>
            </div>
          )}
          {msgs.map((m, k) => m.who === "me" ? (
            <div key={k} className="ms-8 rounded-[calc(var(--r-field)+4px)] rounded-ss-md bg-primary px-3.5 py-2.5 text-[13px] leading-6 text-primary-foreground animate-rise">{m.text}</div>
          ) : m.job ? <JobCard key={m.key} job={m.job} onFinish={finish} /> : (
            <div key={m.key} className="num me-8 rounded-[calc(var(--r-field)+4px)] border border-border bg-surface px-3.5 py-2.5 text-[13px] leading-6 animate-rise">{m.text}</div>
          ))}
          <div ref={end} />
        </div>
      )}
      <div className="border-t border-border/70 p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {SUGGEST.map((s) => <button key={s} onClick={() => run(s)} className="chip h-auto shrink-0 py-1 text-[11.5px]">{s}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); run(text); }} className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="مثلاً: صورت‌حساب مهر را بفرست" aria-label="پیام به دستیار گزارش" />
          <Button type="submit" size="icon" variant="ai" aria-label="ارسال"><ArrowUp /></Button>
        </form>
      </div>
    </section>
  );
}

const OPS: [Cond["op"], string][] = [[">", "بیشتر از"], ["<", "کمتر از"], ["=", "برابر"], ["~", "شامل"]];
/** Advanced filter: a roomy sheet with one card per condition, a live row count and quick presets. */
function AdvancedFilter({ report, rows, conds, setConds }: { report: Report; rows: Row[]; conds: Cond[]; setConds: (c: Cond[]) => void }) {
  const firstNum = report.cols.find((c) => c.num)?.key ?? report.cols[0].key;
  const blank = (): Cond => ({ id: Date.now(), col: firstNum, op: ">", val: "" });
  const [draft, setDraft] = React.useState<Cond[]>(conds.length ? conds : [blank()]);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (open) setDraft(conds.length ? conds : [blank()]); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = applyConds(rows, draft.filter((c) => c.val.trim()));
  const upd = (id: number, p: Partial<Cond>) => setDraft(draft.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const numCol = report.cols.filter((c) => c.num && !/٪/.test(c.label));
  const presets: [string, Cond[]][] = numCol.length ? [
    [`${numCol[0].label} بیشتر از ۲`, [{ id: 1, col: numCol[0].key, op: ">", val: "2" }]],
    [`${numCol[numCol.length - 1].label} کمتر از ۱`, [{ id: 2, col: numCol[numCol.length - 1].key, op: "<", val: "1" }]],
  ] : [];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant={conds.length ? "soft" : "outline"}><Filter /> فیلتر پیشرفته{conds.length ? ` · ${toFa(conds.length)}` : ""}</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(520px,calc(100vw-24px))] p-0" align="end">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Filter className="size-5 text-primary" variant="Bulk" />
          <b className="text-[14px]">فیلتر پیشرفته</b>
          <span className="num ms-auto rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-bold">{toFa(live.length)} از {toFa(rows.length)} ردیف</span>
        </div>
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto p-4">
          {presets.length > 0 && (
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11.5px] text-muted-foreground">پیشنهاد:</span>
              {presets.map(([l, c]) => <button key={l} onClick={() => setDraft(c.map((x) => ({ ...x, id: Date.now() + x.id })))} className="chip h-7 text-[12px]">{l}</button>)}
            </div>
          )}
          {draft.map((c, i) => {
            const col = report.cols.find((k) => k.key === c.col);
            return (
              <div key={c.id}>
                {i > 0 && <div className="my-1 flex items-center gap-2 text-[11px] font-bold text-muted-foreground"><span className="h-px flex-1 bg-border" />و<span className="h-px flex-1 bg-border" /></div>}
                <div className="rounded-field border border-border bg-surface-2/70 p-3">
                  <div className="flex items-center gap-2">
                    <select aria-label="ستون" className="h-9 min-w-0 flex-1 rounded-field border border-input bg-surface px-2.5 text-[13px] font-semibold outline-none focus:border-ring" value={c.col}
                      onChange={(e) => upd(c.id, { col: e.target.value, op: report.cols.find((k) => k.key === e.target.value)?.num ? ">" : "~" })}>
                      {report.cols.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
                    </select>
                    <button aria-label="حذف شرط" onClick={() => setDraft(draft.filter((x) => x.id !== c.id))} className="grid size-9 place-items-center rounded-field text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex rounded-field bg-muted/80 p-0.5" role="radiogroup" aria-label="شرط">
                      {OPS.filter(([o]) => (col?.num ? o !== "~" : o === "~" || o === "=")).map(([o, l]) => (
                        <button key={o} role="radio" aria-checked={c.op === o} onClick={() => upd(c.id, { op: o })} className={cn("h-8 rounded-[calc(var(--r-field)-2px)] px-3 text-[12px] font-semibold text-muted-foreground", c.op === o && "bg-surface text-foreground shadow-soft")}>{l}</button>
                      ))}
                    </div>
                    <div className="relative min-w-[120px] flex-1">
                      <Input aria-label="مقدار" value={c.val} onChange={(e) => upd(c.id, { val: e.target.value })} placeholder={col?.num ? "مثلاً ۲٫۵" : "متن"} className="num h-9 pe-16" />
                      {col?.num && <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">میلیارد</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={() => setDraft([...draft, blank()])} className="mt-1 flex h-10 items-center justify-center gap-1.5 rounded-field border border-dashed border-border text-[12.5px] font-bold text-primary hover:bg-primary-soft/40"><Plus className="size-4" /> افزودن شرط</button>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <Button size="sm" variant="ghost" onClick={() => { setConds([]); setDraft([blank()]); }}>پاک کردن همه</Button>
          <Button size="sm" onClick={() => { setConds(draft.filter((c) => c.val.trim())); setOpen(false); }}>نمایش {toFa(live.length)} ردیف</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function applyConds(rows: Row[], conds: Cond[]) {
  return rows.filter((r) => conds.every((c) => {
    const v = r[c.col];
    if (c.op === "~") return String(v).includes(c.val);
    const n = parseFloat(toEn(c.val).replace("٫", "."));
    if (isNaN(n) || typeof v !== "number") return true;
    return c.op === ">" ? v > n : c.op === "<" ? v < n : Math.abs(v - n) < 1e-6;
  }));
}

function Tree({ id, pick }: { id: string; pick: (x: string) => void }) {
  return (
    <nav className="panel no-print h-fit p-3 lg:sticky lg:top-4" aria-label="فهرست گزارش‌ها">
      <button onClick={() => pick("overview")} aria-current={id === "overview" ? "page" : undefined}
        className={cn("mb-1 flex w-full items-center gap-2 rounded-field px-3 py-2 text-start text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", id === "overview" && "bg-primary-soft font-bold text-primary hover:bg-primary-soft hover:text-primary")}>
        <LayoutDashboard className="size-4" /> نمای کلی سیستم
      </button>
      {reportGroups.map((g) => (
        <div key={g} className="mb-2">
          <div className="flex items-center gap-1 px-2 pb-1 pt-2 text-[12px] font-bold text-muted-foreground"><ChevronDown className="size-3" />{g}</div>
          <ul className="ms-3 border-s border-border ps-1.5">
            {reports.filter((x) => x.group === g).map((x) => (
              <li key={x.id}>
                <button onClick={() => pick(x.id)} aria-current={x.id === id ? "page" : undefined}
                  className={cn("w-full rounded-field px-3 py-2 text-start text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", x.id === id && "bg-primary-soft font-bold text-primary hover:bg-primary-soft hover:text-primary")}>{x.title}</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Picker({ id, pick }: { id: string; pick: (x: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const title = id === "overview" ? "نمای کلی سیستم" : reports.find((x) => x.id === id)?.title;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-field px-2 py-1 text-[17px] font-extrabold hover:bg-muted" aria-label="انتخاب گزارش">{title}<ChevronDown className="size-4 text-muted-foreground" /></button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1.5">
        <button onClick={() => { pick("overview"); setOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-field px-3 py-2 text-start text-[13px] hover:bg-muted", id === "overview" && "font-bold text-primary")}><LayoutDashboard className="size-4" /> نمای کلی سیستم</button>
        {reportGroups.map((g) => (
          <div key={g}>
            <div className="px-3 pb-0.5 pt-2 text-[11.5px] font-bold text-muted-foreground">{g}</div>
            {reports.filter((x) => x.group === g).map((x) => (
              <button key={x.id} onClick={() => { pick(x.id); setOpen(false); }} className={cn("w-full rounded-field px-3 py-1.5 text-start text-[13px] hover:bg-muted", x.id === id && "font-bold text-primary")}>{x.title}</button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function Reports() {
  const { reportSeed, unit, toast, concept } = useApp();
  const bento = concept === "bento";
  const [id, setId] = React.useState(reportSeed ?? "overview");
  const [period, setPeriod] = React.useState<Period>("aban");
  const [conds, setConds] = React.useState<Cond[]>([]);
  const [chatOpen, setChatOpen] = React.useState(false);
  const r = reports.find((x) => x.id === id) ?? null;
  const k = periods.find((p) => p[0] === period)![2];
  const u = unitLabel(unit);
  const base = r ? scaleRows(r, k, unit === "toman") : [];
  const rows = applyConds(base, conds);
  const pick = React.useCallback((x: string) => { setId(x); setConds([]); }, []);
  const doExport = React.useCallback(() => { const rep = reports.find((x) => x.id === "tb")!; exportCsv(rep, scaleRows(rep, 1, unit === "toman"), u); toast("فایل اکسل تراز آزمایشی دانلود شد."); }, [unit, u, toast]);

  const chart = () => {
    if (!r) return null;
    const div = unit === "toman" ? 10 : 1;
    switch (r.chart) {
      case "waterfall": return <Waterfall items={rows.map((x) => [String(x.item), x.v as number])} total="سود" unit={u} />;
      case "treemap": return <Treemap items={rows.map((x) => [String(x.item), x.v as number])} unit={`میلیارد ${u}`} />;
      case "aging": return <StackBars rows={rows.map((x) => ({ label: String(x.item), values: [x.a, x.b, x.c, x.d] as number[] }))} keys={["جاری", "۱ تا ۳۰ روز", "۳۱ تا ۶۰ روز", "بیش از ۶۰ روز"]} colors={["--seq-1", "--seq-2", "--seq-3", "--seq-4"]} />;
      case "pair": return <PairBars items={rows.map((x) => ({ label: String(x.item), a: x.a as number, b: x.b as number }))} keys={["مهر", "آبان"]} />;
      case "rank": return <RankBars items={rows.filter((x) => typeof x.bal === "number").map((x) => [String(x.item), x.bal as number])} />;
      case "cash": return <div className="flex h-[260px] flex-col"><CashChart actual={cashActual} forecast={cashForecast} scale={1 / div} unit={u} minH={240} /></div>;
    }
  };
  const totals = r ? r.cols.map((c) => (c.num && !/٪/.test(c.label) ? rows.reduce((a, x) => a + (typeof x[c.key] === "number" ? (x[c.key] as number) : 0), 0) : null)) : [];

  const toolbar = (
    <section className="panel no-print flex flex-wrap items-center gap-2 p-3">
      {bento ? <h2 className="px-2 text-[17px] font-extrabold">{r?.title ?? "نمای کلی سیستم"}</h2> : <Picker id={id} pick={pick} />}
      {r && (
        <div className="flex rounded-[calc(var(--r-field)+4px)] bg-muted/80 p-1" role="radiogroup" aria-label="دوره">
          {periods.map(([p, l]) => (
            <button key={p} role="radio" aria-checked={period === p} onClick={() => setPeriod(p)} className={cn("h-7 rounded-field px-3 text-[12.5px] font-semibold text-muted-foreground", period === p && "bg-surface text-foreground shadow-soft")}>{l}</button>
          ))}
        </div>
      )}
      <div className="ms-auto flex flex-wrap gap-2">
        {r && <AdvancedFilter key={r.id} report={r} rows={base} conds={conds} setConds={setConds} />}
        <Popover>
          <PopoverTrigger asChild><Button size="sm" variant="outline"><Download /> خروجی</Button></PopoverTrigger>
          <PopoverContent className="w-52 p-1.5" align="end">
            {r && <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] hover:bg-muted" onClick={() => { exportCsv(r, rows, u); toast(`فایل «${r.title}» دانلود شد.`); }}><FileSpreadsheet className="size-4 text-success" /> اکسل</button>}
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] hover:bg-muted" onClick={() => window.print()}><FileText className="size-4 text-danger" /> PDF</button>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] hover:bg-muted" onClick={() => window.print()}><Printer className="size-4" /> چاپ</button>
          </PopoverContent>
        </Popover>
        {bento && <Button size="sm" variant="ai" onClick={() => setChatOpen(true)}><MessageSquareText /> دستیار گزارش</Button>}
      </div>
      {r && conds.length > 0 && (
        <div className="flex w-full flex-wrap gap-1.5 px-2">
          {conds.map((c) => (
            <span key={c.id} className="flex items-center gap-1 rounded-field bg-primary-soft px-2.5 py-0.5 text-[12px] text-primary">
              {r.cols.find((x) => x.key === c.col)?.label} {c.op === ">" ? "بیشتر از" : c.op === "<" ? "کمتر از" : c.op === "=" ? "برابر" : "شامل"} {c.val}
              <button aria-label="حذف شرط" onClick={() => setConds(conds.filter((x) => x.id !== c.id))}><X className="size-3" /></button>
            </span>
          ))}
        </div>
      )}
    </section>
  );

  const barKey = r ? [...r.cols].reverse().find((c) => c.num && !/٪/.test(c.label))?.key : undefined;
  const barMax = barKey ? Math.max(...rows.map((x) => Math.abs(Number(x[barKey]) || 0)), 1) : 1;
  const table = r && rows.length > 0 && (
    <section className="panel-data overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="bg-muted/60 text-[12px] text-muted-foreground">
              <th className="w-10 py-3 ps-5 text-start font-semibold">#</th>
              {r.cols.map((c) => <th key={c.key} className={cn("whitespace-nowrap px-4 py-3 font-semibold last:pe-5", c.num ? "text-end" : "text-start")}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border/70 transition-colors hover:bg-primary-soft/30">
                <td className="num py-3 ps-5 text-[12px] text-muted-foreground">{toFa(i + 1)}</td>
                {r.cols.map((c) => {
                  const v = row[c.key];
                  const txt = typeof v === "number" ? (v < 0 ? `(${fa(-v)})` : fa(v)) : v;
                  return (
                    <td key={c.key} className={cn("px-4 py-3 last:pe-5", c.num ? "num text-end font-semibold" : "font-bold", typeof v === "number" && v < 0 && "text-muted-foreground")}>
                      {c.key === barKey && typeof v === "number" ? (
                        <span className="flex items-center justify-end gap-2.5"><span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block"><span className="block h-full rounded-full bg-primary/70" style={{ width: `${(Math.abs(v) / barMax) * 100}%` }} /></span>{txt}</span>
                      ) : txt}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {rows.length > 1 && r.chart !== "waterfall" && (
            <tfoot>
              <tr className="border-t-2 border-border bg-surface-2/80 text-[13px]">
                <td className="ps-5" />
                {r.cols.map((c, i) => <td key={c.key} className={cn("px-4 py-3 font-extrabold last:pe-5", c.num ? "num text-end" : "")}>{i === 0 ? "جمع" : totals[i] !== null ? fa(totals[i]!) : ""}</td>)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {r.note && <p className="border-t border-border px-5 py-2.5 text-[12px] text-muted-foreground">{r.note}</p>}
    </section>
  );
  const chartCard = r && (
    <section className="panel flex flex-col p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <b className="text-[14px]">{bento ? "نمودار" : `${periods.find((p) => p[0] === period)![1]} ۱۴۰۵`}</b>
        <span className="text-[12px] text-muted-foreground">میلیارد {u}</span>
      </div>
      {rows.length ? chart() : <Empty icon={Filter} title="با این فیلتر ردیفی باقی نمی‌ماند" action={<Button size="sm" variant="soft" onClick={() => setConds([])}>حذف فیلترها</Button>} />}
    </section>
  );
  // bento leads with numbers: a summary strip, then the register beside a compact chart
  const top = r && barKey ? [...rows].sort((x, y) => Math.abs(Number(y[barKey])) - Math.abs(Number(x[barKey])))[0] : null;
  const summary = r && (
    <section className="panel grid grid-cols-2 overflow-hidden sm:grid-cols-4">
      {([["تعداد ردیف", toFa(rows.length)], ["جمع", barKey ? fa(rows.reduce((a, x) => a + (Number(x[barKey]) || 0), 0)) : "—"], ["بیشترین", top ? String(top.item) : "—"], ["دوره", periods.find((p) => p[0] === period)![1]]] as const).map(([l, v], i) => (
        <div key={l} className={cn("p-4", i > 0 && "border-s border-border/70")}><span className="text-[12px] font-bold text-muted-foreground">{l}</span><b className="num mt-1 block truncate text-[18px] font-extrabold">{v}</b></div>
      ))}
    </section>
  );
  const body = !r ? (bento ? <SystemScorecard /> : <SystemOverview dense />) : bento ? (
    <>
      {summary}
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">{table}{chartCard}</div>
    </>
  ) : (
    <>
      {chartCard}
      {table}
    </>
  );

  if (bento) {
    return (
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Tree id={id} pick={pick} />
        <div className="flex min-w-0 flex-col gap-4">{toolbar}{body}</div>
        {chatOpen && (
          <div className="no-print fixed inset-y-4 end-4 z-50 w-[min(400px,calc(100vw-32px))] animate-rise">
            <Assistant onReport={pick} onExport={doExport} close={() => setChatOpen(false)} />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="no-print xl:sticky xl:top-4 xl:h-[calc(100vh-120px)]"><Assistant onReport={pick} onExport={doExport} /></div>
      <div className="flex min-w-0 flex-col gap-4">{toolbar}{body}</div>
    </div>
  );
}
