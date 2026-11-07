import * as React from "react";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, CircleDashed, FileImage, Keyboard, Loader2, Paperclip, Plus, Scale, Send, Sparkles, Trash2, Upload, Wand2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { accounts } from "@/data/demo";
import { cn, group, toEn, toFa, words } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountPicker, suggestFor } from "@/components/voucher/AccountPicker";

type Row = { id: number; account: string | null; desc: string; debit: number; credit: number; ai?: boolean };
type Mode = "sentence" | "file" | "manual";
type InUnit = "toman" | "rial";

let nextId = 1;
const blank = (): Row => ({ id: nextId++, account: null, desc: "", debit: 0, credit: 0 });

/* ---------- demo "agent": parse a Persian sentence into a draft ---------- */
function parseSentence(s: string) {
  const t = toEn(s);
  const m = t.match(/([\d.,٬]+)\s*(هزار میلیارد|میلیارد|میلیون|هزار)?\s*(تومان|ریال)?/);
  const base = m ? parseFloat(m[1].replace(/[,٬]/g, "")) : 0;
  const mult = m?.[2] === "هزار میلیارد" ? 1e12 : m?.[2] === "میلیارد" ? 1e9 : m?.[2] === "میلیون" ? 1e6 : m?.[2] === "هزار" ? 1e3 : 1;
  const rial = base * mult * (m?.[3] === "ریال" ? 1 : 10);
  const party = accounts.find((a) => a.code.startsWith("1-103") && t.includes(a.name.split(" ")[0])) ?? accounts.find((a) => a.code.startsWith("3-301") && t.includes(a.name));
  const bankWord = ["پارسیان", "ملت"].find((b) => t.includes(b));
  const bankOptions = accounts.filter((a) => a.code.startsWith("1-101") && bankWord && a.name.includes(bankWord));
  const receive = /واریز|دریافت|گرفتیم/.test(t);
  return { rial, party, bankOptions, receive, text: t, unitGuess: m?.[3] ? null : "تومان" };
}

function MoneyInput({ value, onChange, unit, label }: { value: number; onChange: (rial: number) => void; unit: InUnit; label: string }) {
  const shown = value ? group(unit === "toman" ? value / 10 : value) : "";
  return (
    <div className="flex flex-col gap-0.5">
      <Input
        inputMode="numeric"
        dir="ltr"
        aria-label={label}
        value={shown}
        placeholder="۰"
        onChange={(e) => {
          const n = parseInt(toEn(e.target.value).replace(/[^\d]/g, "") || "0", 10);
          onChange(unit === "toman" ? n * 10 : n);
        }}
        className="num text-left font-bold"
      />
      {unit === "toman" && value > 0 && <span className="num truncate text-[11px] text-muted-foreground" title={words(value)}>= {group(value)} ریال</span>}
    </div>
  );
}

type GuardCheck = { id: string; label: string; state: "ok" | "warn" | "bad" | "idle"; note: string; action?: { label: string; run: () => void } };

export function Voucher() {
  const { voucherSeed, toast, go } = useApp();
  const [mode, setMode] = React.useState<Mode>("sentence");
  const [inUnit, setInUnit] = React.useState<InUnit>("toman");
  const [rows, setRows] = React.useState<Row[]>(() => [blank(), blank()]);
  const [sentence, setSentence] = React.useState(voucherSeed ?? "");
  const [thinking, setThinking] = React.useState(false);
  const [question, setQuestion] = React.useState<null | { options: typeof accounts; pending: ReturnType<typeof parseSentence> }>(null);
  const [desc, setDesc] = React.useState("");
  const [attached, setAttached] = React.useState(false);
  const [dupDismissed, setDupDismissed] = React.useState(false);
  const [status, setStatus] = React.useState<"draft" | "sent">("draft");

  const fill = (p: ReturnType<typeof parseSentence>, bankCode: string) => {
    if (p.receive) {
      const party = p.party ?? accounts[4];
      const d = `دریافت از ${party.name}`;
      setDesc(d);
      setRows([
        { id: nextId++, account: bankCode, desc: d, debit: p.rial, credit: 0, ai: true },
        { id: nextId++, account: party.code, desc: d, debit: 0, credit: p.rial, ai: true },
      ]);
    } else {
      // a payment: expense (guessed from the words) against cash or bank
      const expense = suggestFor(p.text) ?? accounts.find((a) => a.code.startsWith("6-"))!;
      const from = /صندوق/.test(p.text) ? "1-101-100010" : bankCode;
      const d = `پرداخت بابت ${expense.name}`;
      setDesc(d);
      setRows([
        { id: nextId++, account: expense.code, desc: d, debit: p.rial, credit: 0, ai: true },
        { id: nextId++, account: from, desc: d, debit: 0, credit: p.rial, ai: true },
      ]);
    }
    setQuestion(null);
  };

  const runAgent = (s = sentence) => {
    if (!s.trim()) return;
    setThinking(true);
    setQuestion(null);
    setTimeout(() => {
      const p = parseSentence(s);
      setThinking(false);
      if (!p.rial) { toast("مبلغ را پیدا نکردم. مثلاً بنویسید «۵۰۰ میلیون تومان».", "ai"); return; }
      if (p.bankOptions.length > 1) setQuestion({ options: p.bankOptions, pending: p });
      else fill(p, p.bankOptions[0]?.code ?? "1-101-100001");
    }, 700);
  };

  // If we arrived from the inbox or the palette with a sentence, draft it right away.
  React.useEffect(() => {
    if (voucherSeed) runAgent(voucherSeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalD = rows.reduce((a, r) => a + r.debit, 0);
  const totalC = rows.reduce((a, r) => a + r.credit, 0);
  const diff = totalD - totalC;
  const balanced = totalD > 0 && diff === 0;
  const missingAcc = rows.some((r) => (r.debit || r.credit) && !r.account);
  const isDup = rows.some((r) => r.account === "1-103-300014" && r.credit === 5_000_000_000);

  const update = (id: number, patch: Partial<Row>) => setRows((x) => x.map((r) => (r.id === id ? { ...r, ...patch, ai: false } : r)));
  const balance = () => {
    if (!diff) return;
    setRows((x) => {
      const empty = x.find((r) => !r.debit && !r.credit);
      const patch = diff > 0 ? { credit: diff, debit: 0 } : { debit: -diff, credit: 0 };
      return empty ? x.map((r) => (r.id === empty.id ? { ...r, ...patch } : r)) : [...x, { ...blank(), ...patch }];
    });
  };

  const checks: GuardCheck[] = [
    { id: "bal", label: "تراز بودن سند", state: totalD === 0 ? "idle" : balanced ? "ok" : "bad", note: totalD === 0 ? "هنوز مبلغی ننوشته‌اید" : balanced ? "جمع بدهکار و بستانکار یکی است" : `اختلاف ${group(Math.abs(diff))} ریال`, action: !balanced && totalD > 0 ? { label: "تراز کن", run: balance } : undefined },
    { id: "acc", label: "حساب همه‌ی ردیف‌ها", state: totalD === 0 ? "idle" : missingAcc ? "bad" : "ok", note: missingAcc ? "یک ردیف هنوز حساب ندارد" : "همه‌ی ردیف‌ها حساب دارند" },
    { id: "nat", label: "ماهیت حساب‌ها", state: totalD === 0 ? "idle" : "ok", note: "با ماهیت تعریف‌شده‌ی حساب‌ها جور است" },
    { id: "dup", label: "سند تکراری", state: isDup && !dupDismissed ? "warn" : totalD === 0 ? "idle" : "ok", note: isDup && !dupDismissed ? "۱۴ آبان سند ۰۰۳۸ با همین مبلغ و همین طرف حساب ثبت شده" : "سند مشابهی پیدا نشد", action: isDup && !dupDismissed ? { label: "تکراری نیست", run: () => { setDupDismissed(true); toast("ثبت شد. دلیلش در سابقه‌ی سند می‌ماند.", "ai"); } } : undefined },
    { id: "att", label: "پیوست", state: attached ? "ok" : "idle", note: attached ? "تصویر فیش پیوست شد" : "اختیاری، ولی برای دریافت‌ها بهتر است" },
    { id: "per", label: "دوره‌ی مالی", state: "ok", note: "آبان ۱۴۰۵ باز است" },
  ];
  const canSend = balanced && !missingAcc;

  const send = () => {
    setStatus("sent");
    toast("سند ت-۰۱۲ برای تأیید رفت.");
  };

  if (status === "sent") {
    return (
      <section className="panel mx-auto mt-6 flex w-full max-w-xl flex-col items-center gap-3 p-10 text-center animate-in fade-in-0 zoom-in-95">
        <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success"><CheckCircle2 className="size-7" /></span>
        <h2 className="text-[20px] font-extrabold">سند برای تأیید رفت</h2>
        <p className="num max-w-[46ch] text-[14px] leading-7 text-muted-foreground">
          شماره‌ی موقت ت-۰۱۲ · {group(totalD)} ریال. وقتی قطعی شود، شماره‌ی دائم آبان را می‌گیرد.
        </p>
        <div className="mt-2 flex gap-2">
          <Button onClick={() => go("dashboard")}>بازگشت به امروز <ArrowLeft /></Button>
          <Button variant="outline" onClick={() => { setStatus("draft"); setRows([blank(), blank()]); setSentence(""); setDesc(""); setAttached(false); setDupDismissed(false); }}>
            <Plus /> سند بعدی
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        {/* header strip */}
        <section className="panel flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">پیش‌نویس</Badge>
            <span className="num text-[13px] text-muted-foreground">شماره‌ی موقت <b className="text-foreground">ت-۰۱۲</b></span>
          </div>
          <span className="num text-[13px] text-muted-foreground">تاریخ <b className="text-foreground">۱۴۰۵/۰۸/۱۶</b></span>
          <span className="text-[13px] text-muted-foreground">نوع <b className="text-foreground">عادی</b></span>
          <span className="text-[13px] text-muted-foreground">منبع <b className="text-foreground">{rows.some((r) => r.ai) ? "ایجنت ثبت" : "دستی"}</b></span>
          <div className="ms-auto flex items-center gap-2 text-[12.5px] text-muted-foreground">
            ورود مبلغ به
            <div role="radiogroup" aria-label="واحد ورود مبلغ" className="flex rounded-full bg-muted p-1">
              {(["toman", "rial"] as const).map((u) => (
                <button key={u} role="radio" aria-checked={inUnit === u} onClick={() => setInUnit(u)} className={cn("h-7 rounded-full px-3 font-semibold", inUnit === u && "bg-surface text-foreground shadow-soft")}>
                  {u === "toman" ? "تومان" : "ریال"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* three ways in */}
        <section data-tour="entry" className="panel p-5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[16px] font-extrabold">سند را چطور بسازیم؟</h2>
              <TabsList>
                <TabsTrigger value="sentence"><Wand2 /> با یک جمله</TabsTrigger>
                <TabsTrigger value="file"><FileImage /> از عکس یا فایل</TabsTrigger>
                <TabsTrigger value="manual"><Keyboard /> دستی</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          {mode === "sentence" && (
            <div className="mt-4">
              <form onSubmit={(e) => { e.preventDefault(); runAgent(); }} className="flex gap-2">
                <div className="relative flex-1">
                  <Sparkles className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ai" />
                  <Input value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="مثلاً: ۵۰۰ میلیون تومان از پتروشیمی مارون به حساب پارسیان واریز شد" aria-label="شرح سند با یک جمله" className="h-12 rounded-full pe-4 ps-10 text-[14px]" />
                </div>
                <Button type="submit" variant="ai" size="lg" disabled={thinking}>{thinking ? <Loader2 className="animate-spin" /> : <Sparkles />} پیش‌نویس بساز</Button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {["۵۰۰ میلیون تومان از پتروشیمی مارون به حساب پارسیان واریز شد", "۱۲ میلیون تومان کرایه‌ی حمل بار از صندوق پرداخت شد"].map((ex) => (
                  <button key={ex} onClick={() => { setSentence(ex); runAgent(ex); }} className="rounded-full border border-border bg-surface/70 px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:border-ai/40 hover:text-foreground">
                    {ex}
                  </button>
                ))}
              </div>
              {thinking && <p className="mt-3 flex items-center gap-2 text-[13px] text-ai-ink"><Loader2 className="size-4 animate-spin" /> ایجنت ثبت حساب‌ها را از اسناد مشابه قبلی پیدا می‌کند…</p>}
              {question && (
                <div className="mt-4 rounded-2xl bg-ai-soft/70 p-4 animate-in fade-in-0 slide-in-from-top-1">
                  <p className="flex items-center gap-2 text-[13.5px] font-bold text-ai-ink"><Sparkles className="size-4" /> فقط یک سؤال: پول به کدام حساب پارسیان آمده؟</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.options.map((o) => <Button key={o.code} size="sm" variant="outline" onClick={() => fill(question.pending, o.code)}>{o.name}</Button>)}
                  </div>
                  {question.pending.unitGuess && <p className="mt-3 text-[12px] text-muted-foreground">واحد را ننوشته بودید، تومان در نظر گرفتم. معادل ریالی زیر هر مبلغ هست.</p>}
                </div>
              )}
            </div>
          )}

          {mode === "file" && (
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
              <button
                onClick={() => { setAttached(true); setSentence("۵۰۰ میلیون تومان از پتروشیمی مارون به حساب پارسیان واریز شد"); runAgent("۵۰۰ میلیون تومان از پتروشیمی مارون به حساب پارسیان واریز شد"); }}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-input bg-surface/60 p-8 text-center transition-colors hover:border-ai/50 hover:bg-ai-soft/40"
              >
                <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary shadow-soft"><Upload className="size-5" /></span>
                <b className="text-[14px]">عکس فیش، متن پیامک بانک یا فایل اکسل را اینجا بکشید</b>
                <span className="text-[12px] text-muted-foreground">در این نمونه، با یک کلیک فیش آزمایشی خوانده می‌شود</span>
              </button>
              <div className="rounded-2xl border border-border bg-surface/60 p-4 text-[13px]">
                <b className="text-[13.5px]">ایجنت ثبت از فایل چه برمی‌دارد</b>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="size-4 text-success" /> مبلغ، تاریخ و طرف حساب</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-success" /> شماره‌ی پیگیری بانک</li>
                  <li className="flex items-center gap-2"><CircleDashed className="size-4 text-warning" /> هر جا مطمئن نباشد، خانه را خالی می‌گذارد و علامت می‌زند</li>
                </ul>
              </div>
            </div>
          )}

          {mode === "manual" && (
            <p className="mt-4 text-[13px] leading-7 text-muted-foreground">
              شرح هر ردیف را بنویسید تا حساب پیشنهاد شود. <b className="text-foreground">Enter</b> به خانه‌ی بعدی می‌رود و ردیف آخر برای تراز شدن خودکار پیشنهاد می‌شود.
            </p>
          )}
        </section>

        {/* the voucher itself */}
        <section data-tour="lines" className="panel-data overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
            <h2 className="text-[16px] font-extrabold">ردیف‌های سند</h2>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="شرح کلی سند" aria-label="شرح کلی سند" className="h-9 max-w-sm flex-1 rounded-full" />
            <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setRows((x) => [...x, blank()])}><Plus /> ردیف</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] table-fixed text-[13px]">
              <thead>
                <tr className="text-[12px] text-muted-foreground">
                  <th className="w-10 px-3 py-2.5 text-center font-semibold">#</th>
                  <th className="w-[30%] px-2 py-2.5 text-start font-semibold">حساب</th>
                  <th className="px-2 py-2.5 text-start font-semibold">شرح ردیف</th>
                  <th className="w-[19%] px-2 py-2.5 text-start font-semibold">بدهکار ({inUnit === "toman" ? "تومان" : "ریال"})</th>
                  <th className="w-[19%] px-2 py-2.5 text-start font-semibold">بستانکار ({inUnit === "toman" ? "تومان" : "ریال"})</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={cn("align-top transition-colors", r.ai && "bg-ai-soft/40")}>
                    <td className="num px-3 pt-4 text-center text-muted-foreground">
                      {r.ai ? <Sparkles className="mx-auto size-3.5 text-ai" aria-label="پر شده توسط ایجنت" /> : toFa(i + 1)}
                    </td>
                    <td className="px-2 py-2"><AccountPicker value={r.account} onChange={(c) => update(r.id, { account: c })} desc={r.desc || desc} invalid={!!(r.debit || r.credit) && !r.account} /></td>
                    <td className="px-2 py-2"><Input value={r.desc} onChange={(e) => update(r.id, { desc: e.target.value })} placeholder={desc || "شرح"} aria-label={`شرح ردیف ${toFa(i + 1)}`} /></td>
                    <td className="px-2 py-2"><MoneyInput label={`بدهکار ردیف ${toFa(i + 1)}`} unit={inUnit} value={r.debit} onChange={(v) => update(r.id, { debit: v, credit: v ? 0 : r.credit })} /></td>
                    <td className="px-2 py-2"><MoneyInput label={`بستانکار ردیف ${toFa(i + 1)}`} unit={inUnit} value={r.credit} onChange={(v) => update(r.id, { credit: v, debit: v ? 0 : r.debit })} /></td>
                    <td className="px-2 pt-3">
                      <button aria-label="حذف ردیف" disabled={rows.length <= 2} onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-danger disabled:opacity-30">
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div data-tour="balance" className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-border bg-surface-2/80 px-5 py-4">
            <span className="num text-[13px] text-muted-foreground">جمع بدهکار <b className="text-[15px] text-foreground">{group(totalD)}</b> ریال</span>
            <span className="num text-[13px] text-muted-foreground">جمع بستانکار <b className="text-[15px] text-foreground">{group(totalC)}</b> ریال</span>
            <span className="ms-auto">
              {totalD === 0 ? <Badge><Scale className="size-3" /> منتظر مبلغ</Badge>
                : balanced ? <Badge tone="success"><Check className="size-3" /> سند تراز است</Badge>
                : <span className="flex items-center gap-2"><Badge tone="danger"><AlertTriangle className="size-3" /> اختلاف {group(Math.abs(diff))} ریال</Badge><Button size="sm" variant="soft" onClick={balance}>تراز کن</Button></span>}
            </span>
          </div>
        </section>
      </div>

      {/* right rail: the guard + actions */}
      <aside className="flex flex-col gap-5">
        <section data-tour="guard" className="panel p-5">
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold">
            <span className="ai-edge grid size-5 place-items-center rounded-full text-white"><Sparkles className="size-3" /></span>
            نگهبان سند
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground">ایجنت کنترل هم‌زمان با نوشتن شما بررسی می‌کند.</p>
          <ul className="mt-4 flex flex-col gap-3">
            {checks.map((c) => (
              <li key={c.id} className="flex gap-3">
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                  c.state === "ok" && "bg-success-soft text-success", c.state === "warn" && "bg-warning-soft text-warning", c.state === "bad" && "bg-danger-soft text-danger", c.state === "idle" && "bg-muted text-muted-foreground")}>
                  {c.state === "ok" ? <Check className="size-3.5" /> : c.state === "idle" ? <CircleDashed className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold">{c.label}</div>
                  <div className="num text-[12px] leading-5 text-muted-foreground">{c.note}</div>
                  {c.action && <button onClick={c.action.run} className="mt-1 text-[12px] font-bold text-primary underline-offset-4 hover:underline">{c.action.label}</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section data-tour="send" className="panel sticky top-5 flex flex-col gap-2 p-5">
          <Button size="lg" disabled={!canSend} onClick={send}><Send /> ارسال برای تأیید</Button>
          <Button variant="outline" onClick={() => toast("پیش‌نویس ت-۰۱۲ ذخیره شد.")}>ذخیره‌ی پیش‌نویس</Button>
          <button onClick={() => setAttached(true)} className="mt-1 flex items-center justify-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
            <Paperclip className="size-3.5" /> {attached ? "۱ پیوست" : "افزودن پیوست"}
          </button>
          {!canSend && totalD > 0 && <p className="text-center text-[12px] text-danger">برای ارسال، سند باید تراز باشد و همه‌ی ردیف‌ها حساب داشته باشند.</p>}
        </section>
      </aside>
    </div>
  );
}
