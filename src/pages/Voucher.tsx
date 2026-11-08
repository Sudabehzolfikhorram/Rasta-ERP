import * as React from "react";
import { ArrowLeft, Check, FileImage, FileSpreadsheet, FileText, Keyboard, Mic, Paperclip, PencilLine, RotateCcw, Send, Square, Upload, Wand2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { type Doc } from "@/data/demo";
import { cn, group, toFa } from "@/lib/utils";
import { fmtDay, TODAY } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/shell/Topbar";
import { Orb } from "@/components/ai/Orb";
import { answer, facts, linesFor, nextSlot, questionFor, understand, type Draft, type Slot } from "@/components/voucher/agent";
import { ACCEPT, analyzeFile, sampleReceipt, type Analysis } from "@/components/voucher/analyze";
import { balanceDoc, blankLine, buildChecks, ChecksList, docBalanced, docNo, docTotal, VoucherEditor, type InUnit } from "@/components/voucher/VoucherEditor";

type Phase = "input" | "reading" | "asking" | "review";
type Via = "text" | "voice" | "file";

const EXAMPLES = [
  "۵۰۰ میلیون تومان از پتروشیمی مارون به حساب پارسیان واریز شد",
  "دیروز ۱۲ میلیون تومان کرایه‌ی حمل بار از صندوق دادیم",
  "۳۰۰ میلیون تومان از سپرده‌ی پارسیان به جاری منتقل شد",
];
const VOICE_DEMO = "دیروز دوازده میلیون تومان کرایه حمل بار به اصفهان از صندوق دادیم";
const SLOT_OF: Record<string, Slot> = { نوع: "kind", مبلغ: "amount", "از طرف": "party", "به حساب": "bank", "از حساب": "bank", بابت: "expense", از: "from", به: "to" };

/* ---------- voice: real recognition when the browser has it, a sample sentence otherwise ---------- */
type SR = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; abort: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
function useVoice(onText: (t: string, demo: boolean) => void) {
  const [rec, setRec] = React.useState(false);
  const [live, setLive] = React.useState("");
  const r = React.useRef<SR | null>(null);
  const text = React.useRef("");
  const timer = React.useRef<number>();
  const finish = React.useCallback(() => {
    clearTimeout(timer.current);
    setRec(false);
    const t = text.current.trim();
    onText(t || VOICE_DEMO, !t);
    text.current = "";
    setLive("");
  }, [onText]);
  const stop = () => { if (r.current) r.current.stop(); else finish(); };
  const start = () => {
    text.current = "";
    setRec(true);
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (Ctor) {
      try {
        const s = new Ctor();
        s.lang = "fa-IR"; s.interimResults = true; s.continuous = false;
        s.onresult = (e) => { const all = Array.from(e.results).map((x) => x[0].transcript).join(" "); text.current = all; setLive(all); };
        s.onerror = () => { /* fall back to the sample sentence */ };
        s.onend = () => { if (r.current) { r.current = null; finish(); } };
        r.current = s;
        s.start();
      } catch { r.current = null; }
    }
    timer.current = window.setTimeout(() => stop(), 6000);
  };
  React.useEffect(() => () => { clearTimeout(timer.current); r.current?.abort(); }, []);
  return { rec, live, start, stop };
}

function Wave() {
  return (
    <span className="flex h-6 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => (
        <i key={i} className="block h-full w-[3px] origin-center rounded-full bg-current" style={{ animation: `bar ${0.7 + (i % 4) * 0.13}s ease-in-out ${i * 0.06}s infinite` }} />
      ))}
    </span>
  );
}

const FileIcon = ({ a, className }: { a: Pick<Analysis, "kind">; className?: string }) => {
  const I = a.kind === "image" ? FileImage : a.kind === "sheet" ? FileSpreadsheet : FileText;
  return <I className={className} />;
};

/** Hidden file input + a function that opens it. */
function useFilePicker(onFile: (f: File) => void) {
  const ref = React.useRef<HTMLInputElement>(null);
  const input = <input ref={ref} type="file" accept={ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />;
  return { open: () => ref.current?.click(), input };
}

/* ---------- the live card: facts light up along a rail ---------- */
function Rail({ draft, phase, current, onRedo }: { draft: Draft | null; phase: Phase; current: Slot | null; onRedo: (k: string) => void }) {
  const list = draft ? facts(draft) : [{ k: "نوع", v: null }, { k: "مبلغ", v: null }, { k: "از طرف", v: null }, { k: "به حساب", v: null }];
  const filled = list.filter((f) => f.v).length;
  return (
    <section className="panel relative overflow-hidden p-5" data-tour="rail" aria-label="خلاصه‌ی سند">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-extrabold">خلاصه‌ی سند</h3>
        <span className="num text-[12px] text-muted-foreground">{toFa(filled)} از {toFa(list.length)}</span>
      </div>
      <ol className="relative mt-5">
        <span className="absolute bottom-3 start-[11px] top-3 w-px bg-border" aria-hidden />
        <span className="absolute start-[11px] top-3 w-px bg-ai transition-[height] duration-700 ease-out" style={{ height: `calc(${(Math.max(filled - 1, 0) / Math.max(list.length - 1, 1)) * 100}% - 12px)` }} aria-hidden />
        {list.map((f) => {
          const asking = current && SLOT_OF[f.k] === current && phase === "asking";
          return (
            <li key={f.k} className="relative flex min-h-[58px] items-start gap-3.5">
              <span className={cn("relative z-10 mt-0.5 grid size-[23px] shrink-0 place-items-center rounded-full border-2 bg-surface transition-colors duration-500",
                f.v ? "border-ai bg-ai text-white" : asking ? "border-ai animate-ping-soft" : "border-border")}>
                {f.v && <Check className="size-3" strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-semibold text-muted-foreground">{f.k}</div>
                {f.v ? (
                  <button key={f.v} onClick={() => phase === "asking" && onRedo(f.k)} disabled={phase !== "asking"}
                    className={cn("num block max-w-full truncate text-start text-[14px] font-bold animate-fly", phase === "asking" && "editable")} title={phase === "asking" ? "برای تغییر انتخاب کنید" : undefined}>
                    {f.v}
                  </button>
                ) : (
                  <span className={cn("mt-1 block h-3.5 w-28 rounded-full bg-muted", phase === "reading" && "shimmer")} />
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {draft && (
        <div className="mt-1 flex items-center gap-2 border-t border-border/70 pt-3 text-[12px] text-muted-foreground">
          <span className="num">تاریخ: <b className="text-foreground">{fmtDay(draft.day.m, draft.day.d)}</b></span>
          <span className="ms-auto">منبع: {draft.source}</span>
        </div>
      )}
    </section>
  );
}

/* ---------- composer: say it, type it or upload a file ---------- */
function Composer({ onSubmit, onFile, seed }: { onSubmit: (t: string, via: Via) => void; onFile: (f: File) => void; seed: string }) {
  const [text, setText] = React.useState(seed);
  const [over, setOver] = React.useState(false);
  const [demoNote, setDemoNote] = React.useState(false);
  const picker = useFilePicker(onFile);
  const voice = useVoice(React.useCallback((t: string, demo: boolean) => { setText(t); setDemoNote(demo); onSubmit(t, "voice"); }, [onSubmit]));
  return (
    <section
      data-tour="entry"
      className={cn("panel relative overflow-hidden p-5 transition-shadow", over && "shadow-lift ring-2 ring-ai/60")}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <div className="flex items-start gap-3">
        <Orb size={40} busy={voice.rec} />
        <div>
          <h2 className="text-[18px] font-extrabold">شرح رویداد مالی</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">بنویسید، بگویید یا مدرک را بارگذاری کنید. اطلاعات ناقص را دستیار می‌پرسد.</p>
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSubmit(text, "text"); }} className="mt-4 rounded-[calc(var(--r-field)+2px)] border border-input bg-surface focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
        {voice.rec ? (
          <div className="flex min-h-[104px] flex-col items-center justify-center gap-2 px-4 py-4 text-ai-ink" aria-live="polite">
            <Wave />
            <span className="text-[13px] font-semibold">{voice.live || "در حال شنیدن…"}</span>
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) onSubmit(text, "text"); } }}
            rows={3}
            aria-label="شرح رویداد"
            placeholder="مثلاً: ۵۰۰ میلیون تومان از پتروشیمی مارون به پارسیان واریز شد"
            className="block w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-8 outline-none placeholder:text-muted-foreground"
          />
        )}
        <div className="flex items-center gap-2 px-3 pb-3">
          <Button type="button" variant={voice.rec ? "default" : "outline"} size="icon" aria-label={voice.rec ? "پایان ضبط" : "ضبط صدا"} onClick={() => (voice.rec ? voice.stop() : voice.start())} className={cn(voice.rec && "bg-danger hover:bg-danger/90")}>
            {voice.rec ? <Square className="size-4" /> : <Mic />}
          </Button>
          <Button type="button" variant="outline" onClick={picker.open}><Paperclip /> بارگذاری مدرک</Button>
          {picker.input}
          <span className="hidden text-[11.5px] text-muted-foreground lg:inline">{voice.rec ? "برای پایان دوباره بزنید" : "Enter برای ساخت سند"}</span>
          <Button type="submit" variant="ai" className="ms-auto" disabled={!text.trim() || voice.rec}><Wand2 /> ساخت سند</Button>
        </div>
      </form>
      {demoNote && <p className="mt-2 text-[11.5px] text-muted-foreground">مرورگر صدا را تشخیص نداد؛ جمله‌ی نمونه به‌کار رفت.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => { setText(ex); onSubmit(ex, "text"); }} className="chip h-auto min-h-8 py-1 text-start">{ex}</button>
        ))}
      </div>
      <button onClick={picker.open} className="mt-4 flex w-full flex-col items-center gap-1 rounded-[calc(var(--r-field)+2px)] border border-dashed border-input px-4 py-5 text-center transition-colors hover:border-ai/60 hover:bg-ai-soft/30">
        <Upload className="size-5 text-muted-foreground" />
        <span className="text-[13px] font-bold">فایل را اینجا رها کنید یا انتخاب کنید</span>
        <span className="text-[11.5px] text-muted-foreground">عکس فیش یا چک، PDF فاکتور، یا صورت‌حساب بانک (CSV)</span>
      </button>
      <button onClick={() => onFile(sampleReceipt())} className="mt-2 text-[12px] font-semibold text-primary hover:underline">فایل ندارید؟ با فیش نمونه امتحان کنید</button>
      {over && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-ai-soft/85 backdrop-blur-sm">
          <span className="flex items-center gap-2 text-[15px] font-bold text-ai-ink"><Upload /> رها کنید تا تحلیل شود</span>
        </div>
      )}
    </section>
  );
}

/* ---------- reading: the file preview with a scan line, the orb working beside it ---------- */
function Reading({ via, file, onDone, compact }: { via: Via; file: Analysis | null; onDone: () => void; compact?: boolean }) {
  const steps = via === "file" ? ["بارگذاری فایل", "خواندن مبلغ، تاریخ و طرف حساب", "پیدا کردن حساب‌ها"] : via === "voice" ? ["تبدیل صدا به متن", "تحلیل جمله", "پیدا کردن حساب‌ها"] : ["تحلیل جمله", "پیدا کردن حساب‌ها", "مقایسه با اسناد قبلی"];
  const [i, setI] = React.useState(0);
  const [pct, setPct] = React.useState(0);
  React.useEffect(() => { const t = setInterval(() => setPct((p) => Math.min(p + 4, 100)), 40); return () => clearInterval(t); }, []);
  React.useEffect(() => {
    if (i >= steps.length) { const t = setTimeout(onDone, 250); return () => clearTimeout(t); }
    const t = setTimeout(() => setI(i + 1), via === "file" ? 900 : 620);
    return () => clearTimeout(t);
  }, [i, steps.length, onDone, via]);
  return (
    <section className={cn("panel p-5", compact && "p-4")} aria-live="polite" aria-busy={i < steps.length}>
      {file && (
        <div className="mb-5 flex gap-4">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-field border border-border bg-surface shadow-soft">
            {file.url ? <img src={file.url} alt={`پیش‌نمایش ${file.name}`} className="size-full object-cover" /> : (
              <div className="flex size-full flex-col gap-1.5 p-3"><FileIcon a={file} className="mb-1 size-5 text-muted-foreground" />{Array.from({ length: 5 }).map((_, k) => <span key={k} className="h-1.5 rounded bg-muted" style={{ width: `${55 + ((k * 23) % 40)}%` }} />)}</div>
            )}
            <span className="absolute inset-x-0 h-0.5 bg-ai shadow-[0_0_14px_hsl(var(--ai))]" style={{ animation: "scan 1.1s ease-in-out infinite alternate" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold">{file.name}</div>
            <div className="num text-[12px] text-muted-foreground">{file.meta}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full ai-edge transition-[width] duration-100" style={{ width: `${pct}%` }} /></div>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {file.fields.slice(0, Math.max(0, i + 1)).map(([k, v]) => <li key={k} className="num rounded-full bg-ai-soft px-2.5 py-0.5 text-[11.5px] text-ai-ink animate-fly">{k}: <b>{v}</b></li>)}
            </ul>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Orb size={compact ? 40 : 56} busy />
        <ol className="flex flex-1 flex-col gap-2.5">
          {steps.map((s, k) => (
            <li key={s} className={cn("flex items-center gap-3 text-[13.5px]", k > i && "text-muted-foreground")}>
              <span className={cn("grid size-5 place-items-center rounded-full transition-colors", k < i ? "bg-ai text-white" : k === i ? "bg-ai-soft" : "bg-muted")}>
                {k < i && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className={cn(k === i && "font-bold")}>{s}</span>
              {k === i && <span className="shimmer h-2 flex-1 rounded-full" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- asking: one question at a time ---------- */
function Ask({ draft, slot, limit, onAnswer, history, inline }: { draft: Draft; slot: Slot; limit: number; onAnswer: (v: string) => void; history: string[]; inline?: boolean }) {
  const q = questionFor(slot, draft, limit);
  const [val, setVal] = React.useState("");
  const many = q.options.length > 6;
  return (
    <section className={cn("panel p-5", inline && "border-ai/30 p-4")} aria-live="polite">
      {history.length > 0 && !inline && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {history.map((h, i) => <span key={i} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[12px] text-muted-foreground"><Check className="size-3 text-ai" />{h}</span>)}
        </div>
      )}
      <div key={slot} className="animate-rise">
        <div className="flex items-start gap-3">
          <Orb size={32} />
          <div>
            <p className={cn("num font-extrabold leading-8", inline ? "text-[15px]" : "text-[17px]")}>{q.ask}</p>
            {q.hint && <p className="num text-[12.5px] text-muted-foreground">{q.hint}</p>}
          </div>
        </div>
        {q.input === "amount" ? (
          <form onSubmit={(e) => { e.preventDefault(); if (/\d|[۰-۹]/.test(val)) onAnswer(val); }} className="mt-4 flex gap-2 ps-11">
            <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="۱۲۰ میلیون" aria-label="مبلغ"
              className="h-11 flex-1 rounded-field border border-input bg-surface px-4 text-[15px] font-bold outline-none focus:border-ring focus:ring-4 focus:ring-ring/15" />
            <Button type="submit" size="lg" className="h-11">ادامه <ArrowLeft /></Button>
          </form>
        ) : (
          <div className={cn("mt-4 grid gap-2 ps-11", inline ? "flex flex-wrap" : many ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2")}>
            {q.options.map((o, k) => (
              <button key={o.value} onClick={() => onAnswer(o.value)} style={{ animationDelay: `${k * 40}ms` }}
                className={cn("group flex flex-col justify-center rounded-field border border-border bg-surface px-4 py-2 text-start transition-[border-color,background-color,transform] animate-rise hover:-translate-y-px hover:border-ai/50 hover:bg-ai-soft/50 focus-visible:border-ai", inline ? "min-h-10" : "min-h-12")}>
                <span className="text-[13.5px] font-bold">{o.label}</span>
                {o.sub && <span className="num text-[11.5px] text-muted-foreground">{o.sub}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- concept 2: one smart form, filled in place ---------- */
function SmartFill({ onSubmit, onFile, busy, file, seed }: { onSubmit: (t: string) => void; onFile: (f: File) => void; busy: boolean; file: Analysis | null; seed: string }) {
  const [text, setText] = React.useState(seed);
  const picker = useFilePicker(onFile);
  const voice = useVoice(React.useCallback((t: string) => { setText(t); onSubmit(t); }, [onSubmit]));
  return (
    <section data-tour="entry" className="hero p-4"
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSubmit(text); }} className="flex flex-wrap items-center gap-2">
        <Orb size={34} busy={busy || voice.rec} />
        <div className="min-w-[220px] flex-1">
          <label htmlFor="smart" className="block text-[12px] font-bold text-muted-foreground">پر کردن خودکار فرم</label>
          <input id="smart" value={voice.rec ? voice.live || "در حال شنیدن…" : text} onChange={(e) => setText(e.target.value)} readOnly={voice.rec}
            placeholder="شرح رویداد را بنویسید یا مدرک را بکشید روی همین کادر"
            className="h-9 w-full bg-transparent text-[14.5px] font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground" />
        </div>
        <Button type="button" variant="outline" size="icon" aria-label={voice.rec ? "پایان ضبط" : "ضبط صدا"} onClick={() => (voice.rec ? voice.stop() : voice.start())}>{voice.rec ? <Square className="size-4" /> : <Mic />}</Button>
        <Button type="button" variant="outline" onClick={picker.open}><Paperclip /> مدرک</Button>
        {picker.input}
        <Button type="submit" variant="ai" disabled={!text.trim() || busy}><Wand2 /> پر کن</Button>
      </form>
      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-field border border-border bg-surface/80 p-2 pe-3">
          {file.url ? <img src={file.url} alt="" className="size-10 rounded-[6px] object-cover" /> : <span className="grid size-10 place-items-center rounded-[6px] bg-muted"><FileIcon a={file} className="size-5 text-muted-foreground" /></span>}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold">{file.name}</div>
            <div className="num truncate text-[11.5px] text-muted-foreground">{file.meta}{busy ? " · در حال تحلیل…" : ` · ${file.fields.map(([k, v]) => `${k}: ${v}`).slice(0, 2).join(" · ")}`}</div>
          </div>
          {busy && <span className="shimmer h-2 w-24 rounded-full" />}
        </div>
      )}
      {!file && !busy && (
        <div className="mt-2 flex flex-wrap gap-1.5 ps-11">
          {EXAMPLES.slice(0, 2).map((ex) => <button key={ex} onClick={() => { setText(ex); onSubmit(ex); }} className="chip h-7 text-[12px]">{ex}</button>)}
          <button onClick={() => onFile(sampleReceipt())} className="chip h-7 text-[12px]"><FileImage className="size-3.5" /> فیش نمونه</button>
        </div>
      )}
    </section>
  );
}

export function Voucher() {
  const { voucherSeed, toast, docs, saveDoc, nextSeq, settings, concept, openDoc } = useApp();
  const bento = concept === "bento";
  const editing = voucherSeed?.doc ?? null;
  const [mode, setMode] = React.useState<"ai" | "manual">(editing || voucherSeed?.manual ? "manual" : "ai");
  const [phase, setPhase] = React.useState<Phase>(editing || bento ? "review" : "input");
  const [via, setVia] = React.useState<Via>("text");
  const [file, setFile] = React.useState<Analysis | null>(null);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [force, setForce] = React.useState<Slot | null>(null);
  const [history, setHistory] = React.useState<string[]>([]);
  const [inUnit, setInUnit] = React.useState<InUnit>(settings.inputUnit);
  const [dupOk, setDupOk] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const pendingText = React.useRef("");

  const fresh = React.useCallback((): Doc => ({ id: `n${Date.now()}`, seq: nextSeq(), m: TODAY.m, d: TODAY.d, title: "", kind: "general", status: "draft", source: "manual", lines: [blankLine(), blankLine()], attachments: [], by: "سارا احمدی" }), [nextSeq]);
  const [doc, setDocState] = React.useState<Doc>(() => editing ?? fresh());
  const setDoc = (fn: (d: Doc) => Doc) => setDocState(fn);

  const slot = draft ? force ?? nextSlot(draft, settings.approvalLimit) : null;

  const fill = React.useCallback((d: Draft, v: Via, f: Analysis | null) => {
    const { title, lines } = linesFor(d);
    setDocState((x) => ({ ...x, title, lines, kind: d.kind ?? "general", m: d.day.m, d: d.day.d, source: v === "file" ? "file" : v === "voice" ? "voice" : "ai", attachments: f ? [...new Set([...x.attachments, f.name])] : x.attachments }));
  }, []);
  const toReview = React.useCallback((d: Draft) => { fill(d, via, file); setPhase("review"); }, [fill, via, file]);

  const submit = React.useCallback((t: string, v: Via) => {
    pendingText.current = t; setVia(v); setFile(null);
    if (bento) { setBusy(true); setTimeout(() => { const d = understand(t, v === "voice" ? "صدا" : "متن"); setDraft(d); setForce(null); fill(d, v, null); setBusy(false); }, 900); }
    else setPhase("reading");
  }, [bento, fill]);

  const onFile = React.useCallback(async (f: File) => {
    setVia("file");
    setBusy(true);
    if (!bento) setPhase("reading");
    const a = await analyzeFile(f);
    setFile(a);
    pendingText.current = a.text;
    if (bento) {
      setTimeout(() => { const d = understand(a.text, "فایل"); setDraft(d); setForce(null); fill(d, "file", a); setBusy(false); }, 1200);
    } else setBusy(false);
  }, [bento, fill]);

  const afterRead = React.useCallback(() => {
    const d = understand(pendingText.current, via === "file" ? "فایل" : via === "voice" ? "صدا" : "متن");
    setDraft(d);
    setHistory([]);
    setForce(null);
    if (nextSlot(d, settings.approvalLimit)) setPhase("asking"); else toReview(d);
  }, [via, settings.approvalLimit, toReview]);

  const onAnswer = (v: string) => {
    if (!draft || !slot) return;
    const q = questionFor(slot, draft, settings.approvalLimit);
    const label = q.options.find((o) => o.value === v)?.label ?? toFa(v);
    const nd = answer(draft, slot, v);
    setDraft(nd);
    setForce(null);
    setHistory((h) => [...h, label]);
    if (bento) fill(nd, via, file);
    else if (!nextSlot(nd, settings.approvalLimit)) setTimeout(() => toReview(nd), 380);
  };
  const redo = (k: string) => { if (draft) setForce(SLOT_OF[k] ?? null); };

  // arriving from the dashboard or the command bar with a sentence or a file the user picked
  React.useEffect(() => {
    if (editing || voucherSeed?.manual) return;
    if (voucherSeed?.file) void onFile(voucherSeed.file);
    else if (voucherSeed?.text) submit(voucherSeed.text, "text");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = () => { setPhase(bento ? "review" : "input"); setDraft(null); setFile(null); setHistory([]); setDocState(fresh()); setDupOk(false); pendingText.current = ""; };

  const total = docTotal(doc);
  const checks = buildChecks(doc, docs, settings.approvalLimit, dupOk, setDupOk, () => setDocState(balanceDoc), toast);
  const blocking = checks.some((c) => c.state === "bad");
  const ok = docBalanced(doc) && !blocking;

  const save = (asDraft: boolean) => {
    const status: Doc["status"] = asDraft ? "draft" : total > settings.approvalLimit ? "pending" : "posted";
    const title = doc.title.trim() || "سند بدون شرح";
    saveDoc({ ...doc, title, status, source: mode === "manual" && !editing && !draft ? "manual" : doc.source });
    toast(asDraft ? `پیش‌نویس ${docNo(doc.m, doc.seq)} ذخیره شد.` : status === "pending" ? `سند ${docNo(doc.m, doc.seq)} ثبت شد و برای تأیید مدیر مالی ارسال شد.` : `سند ${docNo(doc.m, doc.seq)} ثبت شد.`);
    openDoc(doc.id);
  };

  const switchMode = (m: "ai" | "manual") => {
    setMode(m);
    if (m === "manual") { if (phase !== "review") { setDocState(fresh()); setPhase("review"); } }
    else if (!editing) restart();
  };

  const sideActions = (
    <section data-tour="send" className="panel flex flex-col gap-2 p-5">
      <div className="num mb-1 flex items-baseline justify-between">
        <span className="text-[12.5px] text-muted-foreground">جمع سند</span>
        <b className="text-[18px]">{group(total)} <span className="text-[11.5px] font-normal text-muted-foreground">ریال</span></b>
      </div>
      <Button size="lg" disabled={!ok} onClick={() => save(false)}><Send /> {total > settings.approvalLimit ? "ثبت و ارسال برای تأیید" : "ثبت سند"}</Button>
      <Button variant="outline" onClick={() => save(true)}>ذخیره‌ی پیش‌نویس</Button>
      {!ok && total > 0 && <p className="text-center text-[12px] text-danger">موارد قرمز را اصلاح کنید.</p>}
      {total > settings.approvalLimit && ok && <p className="num text-center text-[11.5px] text-muted-foreground">مبلغ بالاتر از سقف {group(settings.approvalLimit)} ریال است.</p>}
    </section>
  );
  const guard = (
    <section data-tour="guard" className="panel p-5">
      <h3 className="mb-3 text-[15px] font-extrabold">بررسی سند</h3>
      <ChecksList checks={checks} compact />
    </section>
  );

  /* ---------- concept 2 «پیشخوان»: smart form ---------- */
  if (bento) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {editing ? <span className="num text-[13px] font-bold">ویرایش سند {docNo(editing.m, editing.seq)}</span> : <span className="text-[13px] text-muted-foreground">فرم را مستقیم پر کنید یا بگذارید دستیار پر کند.</span>}
          {(draft || doc.lines.some((l) => l.debit || l.credit)) && !editing && <Button size="sm" variant="ghost" className="ms-auto" onClick={restart}><RotateCcw /> فرم خالی</Button>}
        </div>
        {!editing && <SmartFill onSubmit={(t) => submit(t, "text")} onFile={onFile} busy={busy} file={file} seed={voucherSeed?.text ?? ""} />}
        {!busy && draft && slot && slot !== "limit" && <Ask inline draft={draft} slot={slot} limit={settings.approvalLimit} onAnswer={onAnswer} history={history} />}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className={cn("min-w-0 transition-opacity", busy && "pointer-events-none opacity-60")}>
            <VoucherEditor doc={doc} setDoc={setDoc} inUnit={inUnit} setInUnit={setInUnit} />
          </div>
          <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">{sideActions}{guard}</aside>
        </div>
      </div>
    );
  }

  /* ---------- concept 1 «دستیار»: a short conversation, then review ---------- */
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="روش ثبت" value={mode} onChange={switchMode} items={[["ai", "با دستیار"], ["manual", "دستی"]]} className="text-[13px]" />
        {mode === "ai" && phase !== "input" && <Button size="sm" variant="ghost" onClick={restart}><RotateCcw /> شروع دوباره</Button>}
        {editing && <span className="num text-[12.5px] text-muted-foreground">ویرایش سند {docNo(editing.m, editing.seq)}</span>}
      </div>

      {mode === "ai" && phase !== "review" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            {phase === "input" && <Composer onSubmit={submit} onFile={onFile} seed={voucherSeed?.text ?? ""} />}
            {phase === "reading" && (busy ? <Reading key="wait" via="file" file={null} onDone={() => undefined} /> : <Reading key={pendingText.current + via} via={via} file={file} onDone={afterRead} />)}
            {phase === "asking" && draft && slot && <Ask draft={draft} slot={slot} limit={settings.approvalLimit} onAnswer={onAnswer} history={history} />}
            {phase !== "input" && pendingText.current && (
              <p className="flex items-start gap-2 px-1 text-[13px] text-muted-foreground">
                {via === "voice" ? <Mic className="mt-1 size-3.5 shrink-0" /> : via === "file" ? <FileImage className="mt-1 size-3.5 shrink-0" /> : <Keyboard className="mt-1 size-3.5 shrink-0" />}
                <span>«{pendingText.current}»</span>
              </p>
            )}
            {phase === "asking" && file?.note && <p className="px-1 text-[12.5px] text-muted-foreground">{file.note}</p>}
          </div>
          <Rail draft={draft} phase={phase} current={slot} onRedo={redo} />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            {mode === "ai" && (
              <div className="flex items-center gap-3 rounded-[var(--radius)] border border-ai/25 bg-ai-soft/60 px-4 py-3 text-[13.5px] text-ai-ink animate-rise">
                <Orb size={24} />
                <span className="flex-1"><b>پیش‌نویس سند آماده است.</b> پیش از ثبت بازبینی کنید؛ همه‌ی خانه‌ها قابل ویرایش‌اند.</span>
                <PencilLine className="size-4 shrink-0 opacity-70" />
              </div>
            )}
            {file && mode === "ai" && (
              <div className="panel flex items-center gap-3 p-3">
                {file.url ? <img src={file.url} alt="" className="size-12 rounded-field object-cover" /> : <span className="grid size-12 place-items-center rounded-field bg-muted"><FileIcon a={file} className="size-5 text-muted-foreground" /></span>}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold">{file.name}</div>
                  <div className="num truncate text-[12px] text-muted-foreground">{file.fields.map(([k, v]) => `${k}: ${v}`).join(" · ")}</div>
                </div>
                <span className="text-[11.5px] text-muted-foreground">به پیوست اضافه شد</span>
                <button aria-label="برداشتن از پیوست" onClick={() => { setDocState((d) => ({ ...d, attachments: d.attachments.filter((x) => x !== file.name) })); setFile(null); }} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
              </div>
            )}
            <VoucherEditor doc={doc} setDoc={setDoc} inUnit={inUnit} setInUnit={setInUnit} />
          </div>
          <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">{sideActions}{guard}</aside>
        </div>
      )}
    </div>
  );
}
