import * as React from "react";
import { ArrowUp, Check, ChevronDown, Download, FileSpreadsheet, FileText, Filter, Loader2, MessageSquareText, Plus, Printer, Send, Sparkles, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { reports, reportGroups, type Report, type Row } from "@/data/reports";
import { cashActual, cashForecast } from "@/data/demo";
import { cn, toFa, toEn, unitLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CashChart, PairBars, RankBars, StackBars, Treemap, Waterfall } from "@/components/charts";

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
    <div className="rounded-2xl border border-border bg-surface/80 p-3.5 animate-rise">
      <ol className="flex flex-col gap-2">
        {job.steps.map((s, k) => (
          <li key={s} className={cn("flex items-center gap-2.5 text-[12.5px] transition-colors", k > i && "text-muted-foreground/70")}>
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-300", k < i ? "bg-ai text-white" : k === i ? "bg-ai-soft text-ai-ink" : "bg-muted")}>
              {k < i ? <Check className="size-3" strokeWidth={3} /> : k === i ? <Loader2 className="size-3 animate-spin" /> : null}
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
                      <input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={to.includes(c)} onChange={() => setTo((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))} />
                      <span className="flex-1">{c}</span>
                      <span className="text-[11px] text-muted-foreground">ایمیل و پیامک</span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button size="sm" className="mt-2 w-full" disabled={!to.length || sent === "sending"} onClick={() => { setSent("sending"); setTimeout(() => { setSent("yes"); toast(`صورت‌حساب مهر برای ${toFa(to.length)} مشتری فرستاده شد.`, "ai"); }, 1100); }}>
                {sent === "sending" ? <Loader2 className="animate-spin" /> : <Send />} ارسال برای {toFa(to.length)} مشتری
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
  const [msgs, setMsgs] = React.useState<({ who: "me"; text: string } | { who: "ai"; job?: Job; text?: string; key: number })[]>([]);
  const [text, setText] = React.useState("");
  const end = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msgs]);
  const run = (ask: string) => {
    if (!ask.trim()) return;
    const hit = JOBS.find((j) => j.re.test(ask));
    setMsgs((m) => [...m, { who: "me", text: ask }, hit ? { who: "ai", job: hit.make(ask), key: Date.now() } : { who: "ai", text: "این کار را هنوز بلد نیستم. یکی از پیشنهادهای زیر را امتحان کنید.", key: Date.now() }]);
    setText("");
  };
  const finish = React.useCallback((j: Job) => { if (j.report) onReport(j.report); if (j.kind === "export") setTimeout(onExport, 200); }, [onReport, onExport]);
  return (
    <section className="panel flex h-full min-h-[520px] flex-col overflow-hidden" aria-label="دستیار گزارش">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <span className="ai-edge grid size-7 place-items-center rounded-full text-white"><Sparkles className="size-3.5" /></span>
        <b className="text-[14px]">دستیار گزارش</b>
        {close && <button aria-label="بستن دستیار" onClick={close} className="ms-auto grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" /></button>}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {msgs.length === 0 && <p className="text-[13px] leading-7 text-muted-foreground">کاری را بگویید که چند قدم دارد؛ قدم‌ها را اینجا می‌بینید و پیش از ارسال هر چیزی، از شما می‌پرسم.</p>}
        {msgs.map((m, k) => m.who === "me" ? (
          <div key={k} className="ms-8 rounded-2xl rounded-ss-md bg-primary px-3.5 py-2.5 text-[13px] leading-6 text-primary-foreground animate-rise">{m.text}</div>
        ) : m.job ? <JobCard key={m.key} job={m.job} onFinish={finish} /> : (
          <div key={m.key} className="me-8 rounded-2xl bg-muted px-3.5 py-2.5 text-[13px] leading-6 animate-rise">{m.text}</div>
        ))}
        <div ref={end} />
      </div>
      <div className="border-t border-border/70 p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {SUGGEST.map((s) => <button key={s} onClick={() => run(s)} className="chip h-auto shrink-0 py-1 text-[11.5px]">{s}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); run(text); }} className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="مثلاً: صورت‌حساب مهر را بفرست" aria-label="پیام به دستیار گزارش" className="rounded-full" />
          <Button type="submit" size="icon" variant="ai" aria-label="فرستادن"><ArrowUp /></Button>
        </form>
      </div>
    </section>
  );
}

function AdvancedFilter({ report, conds, setConds }: { report: Report; conds: Cond[]; setConds: (c: Cond[]) => void }) {
  const [draft, setDraft] = React.useState<Cond[]>(conds.length ? conds : [{ id: 1, col: report.cols[1]?.key ?? report.cols[0].key, op: ">", val: "" }]);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (open) setDraft(conds.length ? conds : [{ id: 1, col: report.cols[1]?.key ?? report.cols[0].key, op: ">", val: "" }]); }, [open, conds, report]);
  const sel = "h-9 rounded-lg border border-input bg-surface px-2 text-[12.5px] outline-none focus:border-ring";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline"><Filter /> فیلتر پیشرفته{conds.length ? ` (${toFa(conds.length)})` : ""}</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px]" align="end">
        <b className="text-[13.5px]">ردیف‌هایی را نشان بده که…</b>
        <div className="mt-3 flex flex-col gap-2">
          {draft.map((c, i) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <span className="w-6 text-[11.5px] text-muted-foreground">{i ? "و" : ""}</span>
              <select aria-label="ستون" className={cn(sel, "flex-1")} value={c.col} onChange={(e) => setDraft(draft.map((x) => (x.id === c.id ? { ...x, col: e.target.value, op: report.cols.find((k) => k.key === e.target.value)?.num ? ">" : "~" } : x)))}>
                {report.cols.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
              </select>
              <select aria-label="شرط" className={sel} value={c.op} onChange={(e) => setDraft(draft.map((x) => (x.id === c.id ? { ...x, op: e.target.value as Cond["op"] } : x)))}>
                <option value=">">بیشتر از</option><option value="<">کمتر از</option><option value="=">برابر</option><option value="~">شامل</option>
              </select>
              <input aria-label="مقدار" className={cn(sel, "w-24")} value={c.val} onChange={(e) => setDraft(draft.map((x) => (x.id === c.id ? { ...x, val: e.target.value } : x)))} />
              <button aria-label="حذف شرط" onClick={() => setDraft(draft.filter((x) => x.id !== c.id))} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={() => setDraft([...draft, { id: Date.now(), col: report.cols[0].key, op: "~", val: "" }])} className="mt-2 flex items-center gap-1 text-[12.5px] font-bold text-primary"><Plus className="size-3.5" /> شرط دیگر</button>
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setConds([]); setOpen(false); }}>پاک کردن</Button>
          <Button size="sm" onClick={() => { setConds(draft.filter((c) => c.val.trim())); setOpen(false); }}>اعمال</Button>
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

export function Reports() {
  const { reportSeed, unit, toast } = useApp();
  const [id, setId] = React.useState(reportSeed ?? "pl");
  const [period, setPeriod] = React.useState<Period>("aban");
  const [conds, setConds] = React.useState<Cond[]>([]);
  const [chatOpen, setChatOpen] = React.useState(false);
  const r = reports.find((x) => x.id === id)!;
  const k = periods.find((p) => p[0] === period)![2];
  const u = unitLabel(unit);
  const rows = applyConds(scaleRows(r, k, unit === "toman"), conds);
  const pick = React.useCallback((x: string) => { setId(x); setConds([]); }, []);
  const doExport = React.useCallback(() => { const rep = reports.find((x) => x.id === "tb")!; exportCsv(rep, scaleRows(rep, 1, unit === "toman"), u); toast("فایل اکسل تراز آزمایشی دانلود شد."); }, [unit, u, toast]);

  const chart = () => {
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
  const totals = r.cols.map((c) => (c.num && !/٪/.test(c.label) ? rows.reduce((a, x) => a + (typeof x[c.key] === "number" ? (x[c.key] as number) : 0), 0) : null));

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[210px_minmax(0,1fr)_330px]">
      {/* tree */}
      <nav className="panel no-print h-fit p-3 lg:sticky lg:top-4" aria-label="فهرست گزارش‌ها">
        {reportGroups.map((g) => (
          <div key={g} className="mb-2">
            <div className="flex items-center gap-1 px-2 pb-1 pt-2 text-[11.5px] font-semibold text-muted-foreground"><ChevronDown className="size-3" />{g}</div>
            <ul className="ms-3 border-s border-border ps-1.5">
              {reports.filter((x) => x.group === g).map((x) => (
                <li key={x.id}>
                  <button onClick={() => pick(x.id)} aria-current={x.id === id ? "page" : undefined}
                    className={cn("w-full rounded-xl px-3 py-2 text-start text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", x.id === id && "bg-primary-soft font-bold text-primary hover:bg-primary-soft hover:text-primary")}>{x.title}</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* report */}
      <div className="flex min-w-0 flex-col gap-4">
        <section className="panel no-print flex flex-wrap items-center gap-2 p-3">
          <h2 className="px-2 text-[17px] font-extrabold">{r.title}</h2>
          <div className="flex rounded-full bg-muted/80 p-1" role="radiogroup" aria-label="دوره">
            {periods.map(([p, l]) => (
              <button key={p} role="radio" aria-checked={period === p} onClick={() => setPeriod(p)} className={cn("h-7 rounded-full px-3 text-[12.5px] font-semibold text-muted-foreground", period === p && "bg-surface text-foreground shadow-soft")}>{l}</button>
            ))}
          </div>
          <div className="ms-auto flex flex-wrap gap-2">
            <AdvancedFilter key={r.id} report={r} conds={conds} setConds={setConds} />
            <Popover>
              <PopoverTrigger asChild><Button size="sm" variant="outline"><Download /> خروجی</Button></PopoverTrigger>
              <PopoverContent className="w-52 p-1.5" align="end">
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] hover:bg-muted" onClick={() => { exportCsv(r, rows, u); toast(`فایل «${r.title}» دانلود شد.`); }}><FileSpreadsheet className="size-4 text-success" /> اکسل</button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] hover:bg-muted" onClick={() => window.print()}><FileText className="size-4 text-danger" /> PDF</button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] hover:bg-muted" onClick={() => window.print()}><Printer className="size-4" /> چاپ</button>
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="ai" className="xl:hidden" onClick={() => setChatOpen(true)}><MessageSquareText /> دستیار</Button>
          </div>
          {conds.length > 0 && (
            <div className="flex w-full flex-wrap gap-1.5 px-2">
              {conds.map((c) => (
                <span key={c.id} className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[12px] text-primary">
                  {r.cols.find((x) => x.key === c.col)?.label} {c.op === ">" ? "بیشتر از" : c.op === "<" ? "کمتر از" : c.op === "=" ? "برابر" : "شامل"} {c.val}
                  <button aria-label="حذف شرط" onClick={() => setConds(conds.filter((x) => x.id !== c.id))}><X className="size-3" /></button>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="panel p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <b className="text-[14px]">{periods.find((p) => p[0] === period)![1]} ۱۴۰۵</b>
            <span className="text-[12px] text-muted-foreground">میلیارد {u}</span>
          </div>
          {rows.length ? chart() : <p className="py-10 text-center text-[13px] text-muted-foreground">با این فیلتر ردیفی نمی‌ماند.</p>}
        </section>

        <section className="panel-data overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-[12px] text-muted-foreground">
                  {r.cols.map((c) => <th key={c.key} className={cn("px-4 py-3 font-semibold", c.num ? "text-end" : "text-start")}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-primary-soft/30">
                    {r.cols.map((c) => {
                      const v = row[c.key];
                      return <td key={c.key} className={cn("px-4 py-2.5", c.num ? "num text-end font-semibold" : "font-bold", typeof v === "number" && v < 0 && "text-muted-foreground")}>{typeof v === "number" ? (v < 0 ? `(${fa(-v)})` : fa(v)) : v}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
              {rows.length > 1 && r.chart !== "waterfall" && (
                <tfoot>
                  <tr className="border-t border-border bg-surface-2/80 text-[13px]">
                    {r.cols.map((c, i) => <td key={c.key} className={cn("px-4 py-3 font-extrabold", c.num ? "num text-end" : "")}>{i === 0 ? "جمع" : totals[i] !== null ? fa(totals[i]!) : ""}</td>)}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {r.note && <p className="border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">{r.note}</p>}
        </section>
      </div>

      <div className="no-print hidden xl:block"><div className="sticky top-4 h-[calc(100vh-120px)]"><Assistant onReport={pick} onExport={doExport} /></div></div>
      {chatOpen && (
        <div className="no-print fixed inset-y-4 end-4 z-50 w-[min(380px,calc(100vw-32px))] animate-rise xl:hidden">
          <Assistant onReport={pick} onExport={doExport} close={() => setChatOpen(false)} />
        </div>
      )}
    </div>
  );
}
