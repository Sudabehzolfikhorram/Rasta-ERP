import * as React from "react";
import { AlertTriangle, CalendarDays, Check, CircleDashed, FileImage, FileText, Info, Lock, Paperclip, Plus, Scale, Sparkles, Trash2, Upload, X } from "@/components/icons";
import { accountBy, kindLabel, type Doc, type DocKind, type DocLine } from "@/data/demo";
import { cn, group, toFa } from "@/lib/utils";
import { fmtNum, MONTHS, monthLength, TODAY, weekday, WD_SHORT } from "@/lib/jalali";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AccountPicker } from "./AccountPicker";
import { AmountInput } from "@/components/ui/amount";

let nid = 9000;
export const blankLine = (): DocLine => ({ id: nid++, account: null, desc: "", debit: 0, credit: 0 });

export const docNo = (m: number, seq: number) => toFa(`1405-${String(m).padStart(2, "0")}-${String(seq).padStart(3, "0")}`);

/* Amounts are typed in rial; the toman equivalent shows under each field. */
export function MoneyInput({ value, onChange, label }: { value: number; onChange: (rial: number) => void; label: string }) {
  return <AmountInput label={label} value={value} onChange={onChange} quiet inputClassName="h-11 text-[14px]" />;
}

function DatePick({ m, d, onChange }: { m: number; d: number; onChange: (m: number, d: number) => void }) {
  const [open, setOpen] = React.useState(false);
  const [mm, setMm] = React.useState(m);
  const lead = weekday(mm, 1);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="editable num flex items-center gap-1.5 text-[14px] font-bold" aria-label="تاریخ سند"><CalendarDays className="size-4 text-muted-foreground" />{fmtNum(m, d)}</button>
      </PopoverTrigger>
      <PopoverContent className="w-[290px]">
        <div className="mb-2 flex items-center justify-between">
          <b className="text-[13.5px]">{MONTHS[mm - 1]} ۱۴۰۵</b>
          <div className="flex gap-1">
            <button className="chip h-7" aria-pressed={mm === 7} onClick={() => setMm(7)}>مهر</button>
            <button className="chip h-7" aria-pressed={mm === 8} onClick={() => setMm(8)}>آبان</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">{WD_SHORT.map((w) => <span key={w}>{w}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: lead }).map((_, i) => <span key={"b" + i} />)}
          {Array.from({ length: monthLength(mm) }, (_, i) => i + 1).map((day) => {
            const future = mm > TODAY.m || (mm === TODAY.m && day > TODAY.d);
            const sel = mm === m && day === d;
            return (
              <button key={day} disabled={future} onClick={() => { onChange(mm, day); setOpen(false); }}
                className={cn("num grid h-8 place-items-center rounded-lg text-[12.5px] hover:bg-muted disabled:opacity-30", sel && "bg-primary text-primary-foreground hover:bg-primary", mm === TODAY.m && day === TODAY.d && !sel && "ring-1 ring-primary/50")}>
                {toFa(day)}
              </button>
            );
          })}
        </div>
        {mm === 7 && <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-warning"><Lock className="size-3" /> مهر بسته شده است</p>}
      </PopoverContent>
    </Popover>
  );
}

export type Check = { id: string; label: string; state: "ok" | "warn" | "bad" | "idle"; note: string; action?: { label: string; run: () => void } };

export function buildChecks(doc: Doc, docs: Doc[], limit: number, dupOk: boolean, setDupOk: (v: boolean) => void, balance: () => void, toast: (t: string, tone?: "ai") => void): Check[] {
  const totalD = doc.lines.reduce((a, r) => a + r.debit, 0);
  const totalC = doc.lines.reduce((a, r) => a + r.credit, 0);
  const diff = totalD - totalC;
  const empty = totalD === 0 && totalC === 0;
  const balanced = !empty && diff === 0;
  const missing = doc.lines.some((r) => (r.debit || r.credit) && !r.account);
  const dup = docs.find((x) => x.id !== doc.id && x.lines.some((l) => l.credit > 0 && doc.lines.some((m) => m.credit === l.credit && m.account === l.account)));
  const needsAtt = doc.kind === "receipt" || doc.kind === "cheque";
  const closed = doc.m < TODAY.m;
  return [
    { id: "bal", label: "تراز", state: empty ? "idle" : balanced ? "ok" : "bad", note: empty ? "هنوز مبلغی نیست" : balanced ? "بدهکار و بستانکار برابر است" : `${toFa(group(Math.abs(diff)))} ریال اختلاف`, action: !balanced && !empty ? { label: "تراز کن", run: balance } : undefined },
    { id: "acc", label: "حساب ردیف‌ها", state: empty ? "idle" : missing ? "bad" : "ok", note: missing ? "یک ردیف حساب ندارد" : "همه‌ی ردیف‌ها حساب دارند" },
    { id: "dup", label: "تکراری", state: empty ? "idle" : dup && !dupOk ? "warn" : "ok", note: dup && !dupOk ? `شبیه سند ${docNo(dup.m, dup.seq)} است` : "سند مشابهی نیست", action: dup && !dupOk ? { label: "تکراری نیست", run: () => { setDupOk(true); toast("دلیلش در سابقه‌ی سند می‌ماند.", "ai"); } } : undefined },
    { id: "att", label: "پیوست", state: doc.attachments.length ? "ok" : needsAtt ? "warn" : "idle", note: doc.attachments.length ? `${toFa(doc.attachments.length)} فایل پیوست شده` : needsAtt ? "برای دریافت، تصویر فیش لازم است" : "اختیاری" },
    { id: "per", label: "دوره", state: closed ? "bad" : "ok", note: closed ? `${MONTHS[doc.m - 1]} بسته شده است` : `${MONTHS[doc.m - 1]} باز است` },
    { id: "lim", label: "تأیید", state: totalD > limit ? "warn" : "ok", note: totalD > limit ? "بالای سقف؛ مدیر مالی تأیید می‌کند" : "زیر سقف؛ مستقیم ثبت می‌شود" },
  ];
}

export function ChecksList({ checks, compact }: { checks: Check[]; compact?: boolean }) {
  return (
    <ul className={cn("flex flex-col", compact ? "gap-2" : "gap-3")}>
      {checks.map((c) => (
        <li key={c.id} className="flex gap-2.5">
          <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
            c.state === "ok" && "bg-success-soft text-success", c.state === "warn" && "bg-warning-soft text-warning", c.state === "bad" && "bg-danger-soft text-danger", c.state === "idle" && "bg-muted text-muted-foreground")}>
            {c.state === "ok" ? <Check className="size-3.5" /> : c.state === "idle" ? <CircleDashed className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold">{c.label}</div>
            <div className="num text-[12px] leading-5 text-muted-foreground">{c.note}</div>
            {c.action && <button onClick={c.action.run} className="mt-0.5 text-[12px] font-bold text-primary underline-offset-4 hover:underline">{c.action.label}</button>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Attachments({ files, onAdd, onRemove }: { files: string[]; onAdd: (names: string[]) => void; onRemove: (n: string) => void }) {
  const input = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  return (
    <section className="panel p-5" data-tour="attach">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[15px] font-extrabold"><Paperclip className="size-4" /> پیوست‌ها</h3>
        <span className="text-[12px] text-muted-foreground">فیش، فاکتور، بارنامه یا تصویر چک</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {files.map((f) => (
          <span key={f} className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface/80 pe-1.5 ps-3 text-[12.5px] animate-fly">
            {/\.(jpe?g|png|webp|heic)$/i.test(f) ? <FileImage className="size-4 text-primary" /> : <FileText className="size-4 text-primary" />}
            <span className="max-w-[180px] truncate">{f}</span>
            <button aria-label={`حذف ${f}`} onClick={() => onRemove(f)} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"><X className="size-3.5" /></button>
          </span>
        ))}
        <button
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); onAdd(Array.from(e.dataTransfer.files).map((f) => f.name)); }}
          className={cn("flex h-10 items-center gap-2 rounded-xl border border-dashed border-input px-3 text-[12.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground", over && "border-primary bg-primary-soft text-primary")}
        >
          <Upload className="size-4" /> {files.length ? "فایل دیگر" : "فایل را بکشید یا انتخاب کنید"}
        </button>
        <input ref={input} type="file" multiple hidden onChange={(e) => { onAdd(Array.from(e.target.files ?? []).map((f) => f.name)); e.target.value = ""; }} />
      </div>
    </section>
  );
}

/** The voucher form: one header card, then line cards with a full-width description under each line. */
export function VoucherEditor({ doc, setDoc }: { doc: Doc; setDoc: (fn: (d: Doc) => Doc) => void }) {
  const lines = doc.lines;
  const totalD = lines.reduce((a, r) => a + r.debit, 0);
  const totalC = lines.reduce((a, r) => a + r.credit, 0);
  const diff = totalD - totalC;
  const balanced = totalD > 0 && diff === 0;
  const setLines = (fn: (l: DocLine[]) => DocLine[]) => setDoc((d) => ({ ...d, lines: fn(d.lines) }));
  const update = (id: number, patch: Partial<DocLine>) => setLines((x) => x.map((r) => (r.id === id ? { ...r, ...patch, ai: false } : r)));
  const balance = () => setDoc(balanceDoc);

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <section className="panel p-5" data-tour="head">
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="field-label">شماره‌ی سند</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="num flex w-fit items-center gap-1.5 text-[14px] font-bold"><Lock className="size-3.5 text-muted-foreground" />{docNo(doc.m, doc.seq)}</span>
              </TooltipTrigger>
              <TooltipContent>خودکار: سال، ماه و شماره‌ی ترتیبی</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-col gap-1">
            <span className="field-label">تاریخ</span>
            <DatePick m={doc.m} d={doc.d} onChange={(m, d) => setDoc((x) => ({ ...x, m, d }))} />
          </div>
          <div className="flex flex-col gap-1 lg:col-span-2">
            <span className="field-label">نوع</span>
            <div className="flex flex-wrap gap-1.5">
              {(["receipt", "payment", "transfer", "cheque", "general"] as DocKind[]).map((k) => (
                <button key={k} className="chip h-7" aria-pressed={doc.kind === k} onClick={() => setDoc((x) => ({ ...x, kind: k }))}>{kindLabel[k]}</button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
            <span className="field-label">شرح سند</span>
            <Input value={doc.title} onChange={(e) => setDoc((x) => ({ ...x, title: e.target.value }))} placeholder="مثلاً: دریافت از پتروشیمی مارون" className="h-11 text-[14px]" />
          </label>
        </div>
      </section>

      {/* lines */}
      <section className="panel-data overflow-hidden" data-tour="lines">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <h3 className="text-[15px] font-extrabold">ردیف‌ها</h3>
          <span className="hidden text-[12px] text-muted-foreground sm:inline">خانه‌های سفید را می‌توانید تغییر دهید</span>
          <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setLines((x) => [...x, { ...blankLine(), desc: doc.title }])}><Plus /> ردیف</Button>
        </div>
        <div className="hidden grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_36px] gap-3 px-5 pt-3 text-[11.5px] font-semibold text-muted-foreground md:grid">
          <span />
          <span>حساب</span>
          <span>بدهکار</span>
          <span>بستانکار</span>
          <span />
        </div>
        <ol>
          {lines.map((r, i) => (
            <li key={r.id} className={cn("grid grid-cols-[28px_minmax(0,1fr)_36px] gap-x-3 gap-y-2 border-b border-border/70 px-5 py-3.5 last:border-b-0 md:grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_36px]", r.ai && "bg-ai-soft/35")}>
              <span className="num row-span-2 pt-3 text-center text-[12.5px] font-bold text-muted-foreground">
                {r.ai ? <Sparkles className="mx-auto size-4 text-ai" aria-label="پر شده با دستیار" /> : toFa(i + 1)}
              </span>
              <AccountPicker value={r.account} onChange={(c) => update(r.id, { account: c })} desc={r.desc || doc.title} invalid={!!(r.debit || r.credit) && !r.account} />
              <div className="col-start-2 grid grid-cols-2 gap-3 md:col-start-auto md:contents">
                <MoneyInput label={`بدهکار ردیف ${toFa(i + 1)}`} value={r.debit} onChange={(v) => update(r.id, { debit: v, credit: v ? 0 : r.credit })} />
                <MoneyInput label={`بستانکار ردیف ${toFa(i + 1)}`} value={r.credit} onChange={(v) => update(r.id, { credit: v, debit: v ? 0 : r.debit })} />
              </div>
              <button aria-label={`حذف ردیف ${toFa(i + 1)}`} disabled={lines.length <= 2} onClick={() => setLines((x) => x.filter((y) => y.id !== r.id))}
                className="col-start-3 row-start-1 mt-1.5 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-danger disabled:opacity-30 md:col-start-auto md:row-start-auto">
                <Trash2 className="size-4" />
              </button>
              <Input value={r.desc} onChange={(e) => update(r.id, { desc: e.target.value })} placeholder="شرح ردیف" aria-label={`شرح ردیف ${toFa(i + 1)}`}
                className="col-span-2 col-start-2 h-10 border-transparent bg-muted/50 text-[13px] md:col-span-3" />
            </li>
          ))}
        </ol>
        <div data-tour="balance" className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-border bg-surface-2/80 px-5 py-3.5">
          <span className="num text-[13px] text-muted-foreground">بدهکار <b className="text-[15px] text-foreground">{group(totalD)}</b></span>
          <span className="num text-[13px] text-muted-foreground">بستانکار <b className="text-[15px] text-foreground">{group(totalC)}</b></span>
          <span className="text-[12px] text-muted-foreground">ریال</span>
          <span className="ms-auto">
            {totalD === 0 && totalC === 0 ? <Badge><Scale className="size-3" /> منتظر مبلغ</Badge>
              : balanced ? <Badge tone="success"><Check className="size-3" /> تراز است</Badge>
              : <span className="flex items-center gap-2"><Badge tone="danger"><AlertTriangle className="size-3" /> {toFa(group(Math.abs(diff)))} اختلاف</Badge><Button size="sm" variant="soft" onClick={balance}>تراز کن</Button></span>}
          </span>
        </div>
      </section>

      <Attachments
        files={doc.attachments}
        onAdd={(n) => setDoc((d) => ({ ...d, attachments: [...new Set([...d.attachments, ...n])] }))}
        onRemove={(n) => setDoc((d) => ({ ...d, attachments: d.attachments.filter((x) => x !== n) }))}
      />
      <p className="flex items-center gap-1.5 px-1 text-[12px] text-muted-foreground"><Info className="size-3.5" /> شماره‌ی سند خودکار است. بقیه‌ی خانه‌ها را می‌توانید تغییر دهید. مبلغ‌ها به ریال ذخیره می‌شوند.</p>
    </div>
  );
}

/** Put the difference on the first empty line, or add a line for it. */
export function balanceDoc(d: Doc): Doc {
  const diff = d.lines.reduce((a, r) => a + r.debit - r.credit, 0);
  if (!diff) return d;
  const empty = d.lines.find((r) => !r.debit && !r.credit);
  const patch = diff > 0 ? { credit: diff, debit: 0 } : { debit: -diff, credit: 0 };
  return { ...d, lines: empty ? d.lines.map((r) => (r.id === empty.id ? { ...r, ...patch } : r)) : [...d.lines, { ...blankLine(), desc: d.title, ...patch }] };
}

export const docTotal = (d: Doc) => d.lines.reduce((a, r) => a + r.debit, 0);
export const docBalanced = (d: Doc) => { const t = docTotal(d); return t > 0 && t === d.lines.reduce((a, r) => a + r.credit, 0) && !d.lines.some((r) => (r.debit || r.credit) && !r.account); };
const PARTY_ORDER = ["ar", "ap", "loan", "exp", "rev", "tax", "notes", "cash"];
export const partyOf = (d: Doc) => {
  const accs = d.lines.map((l) => accountBy(l.account)).filter(Boolean);
  if (d.kind === "transfer") return accs.map((a) => a!.name).join(" ← ");
  return [...accs].sort((a, b) => PARTY_ORDER.indexOf(a!.group) - PARTY_ORDER.indexOf(b!.group))[0]?.name ?? "";
};
