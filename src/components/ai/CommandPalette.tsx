import * as React from "react";
import { Command } from "cmdk";
import { ArrowLeft, BarChart3, Bell, FilePlus2, House, Landmark, Loader2, Pin, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useApp, type Pinned } from "@/lib/store";
import { money, unitLabel } from "@/lib/utils";

type Answer = { title: string; line: string; rows: [string, string][]; note: string; id: string };

/** Demo agent: a few intents answered with real-looking tools (synthetic data). */
function answerFor(q: string, unit: "rial" | "toman"): Answer | null {
  const u = unitLabel(unit);
  if (/مانده|بانک/.test(q))
    return {
      id: "banks", title: "مانده‌ی بانک‌ها · امروز",
      line: `جمع موجودی بانک‌ها ${money(46_700_000_000, unit)} ${u} است. بیشترش در پارسیان جاری است.`,
      rows: [["بانک پارسیان · جاری ۴۴۱۰", `${money(31_200_000_000, unit)} ${u}`], ["بانک ملت · جاری ۸۸۲۰", `${money(9_800_000_000, unit)} ${u}`], ["بانک پارسیان · سپرده ۹۱۰۲", `${money(5_700_000_000, unit)} ${u}`]],
      note: "از اسناد تأییدشده تا ساعت ۱۰:۴۰ · داده‌ی آزمایشی",
    };
  if (/تراز/.test(q))
    return {
      id: "tb", title: "تراز آزمایشی آبان · سطح کل",
      line: "سند‌های آبان تراز است. سه گروه بیشترین گردش را دارند:",
      rows: [["دارایی‌های جاری", `${money(61_050_000_000, unit)} ${u}`], ["بدهی‌های جاری", `${money(9_400_000_000, unit)} ${u}`], ["درآمد عملیاتی", `${money(18_900_000_000, unit)} ${u}`]],
      note: "گزارش‌ساز با همین پارامترها باز می‌شود: دوره آبان، سطح کل، ۴ ستونی",
    };
  if (/نقدینگی|چرا/.test(q))
    return {
      id: "why-cash", title: "چرا نقدینگی ۶٪ بالا رفت؟",
      line: "بیشترِ افزایش از دریافت پتروشیمی مارون است.",
      rows: [["دریافت پتروشیمی مارون", `+${money(5_000_000_000, unit)}`], ["پرداخت حقوق آبان", `−${money(1_800_000_000, unit)}`], ["کارمزد بانکی", `−${money(12_000_000, unit)}`]],
      note: "بر اساس ۲۳ سند دیروز",
    };
  if (/چک|تکین/.test(q))
    return {
      id: "cheque", title: "چک تکین‌کو · سررسید امروز",
      line: "چک ۱٫۲ میلیارد ریالی امروز ساعت ۱۱ سررسید می‌شود. موجودی بانک ملت کافی است.",
      rows: [["شماره‌ی صیادی", "۰۰۸۸۴۱۲۹"], ["مبلغ", `${money(1_200_000_000, unit)} ${u}`], ["بانک", "ملت · جاری ۸۸۲۰"]],
      note: "ایجنت تقویم این سررسید را از سند ۰۰۲۷ پیدا کرد",
    };
  if (/تأیید|منتظر|دیروز/.test(q))
    return {
      id: "pending", title: "اسناد منتظر تأیید",
      line: "۱۲ سند منتظر شماست. ۱۰ سند سالم‌اند و ۲ سند هشدار دارند.",
      rows: [["سالم", "۱۰ سند"], ["هشدار تکراری", "۱ سند"], ["بدون پیوست", "۱ سند"]],
      note: "تأیید گروهی از صندوق «منتظر تصمیم شما»",
    };
  return null;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, paletteSeed, go, startVoucher, unit, pin, toast, setTour } = useApp();
  const [q, setQ] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [answer, setAnswer] = React.useState<Answer | null>(null);

  const ask = React.useCallback((text: string) => {
    if (!text.trim()) return;
    setThinking(true);
    setAnswer(null);
    setTimeout(() => { setAnswer(answerFor(text, unit) ?? { id: "none", title: "این را هنوز بلد نیستم", line: "در این کانسپت، پرسش درباره‌ی مانده‌ی بانک‌ها، تراز آزمایشی، نقدینگی، چک‌ها و اسناد منتظر تأیید جواب دارد.", rows: [], note: "" }); setThinking(false); }, 450);
  }, [unit]);

  React.useEffect(() => {
    if (paletteOpen) { setQ(paletteSeed); setAnswer(null); if (paletteSeed) ask(paletteSeed); }
  }, [paletteOpen, paletteSeed, ask]);

  const close = () => setPaletteOpen(false);
  const run = (fn: () => void) => () => { fn(); close(); };
  const looksLikeEntry = /واریز|پرداخت|خرید|فروش|میلیون|میلیارد/.test(q);

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">از راستا بپرسید</DialogTitle>
        <Command shouldFilter={false} label="فرمان راستا" className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-border px-5">
            <span className="ai-edge grid size-7 place-items-center rounded-full text-white"><Sparkles className="size-4" /></span>
            <Command.Input
              value={q}
              onValueChange={(v) => { setQ(v); setAnswer(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.defaultPrevented && q && !looksLikeEntry) { e.preventDefault(); ask(q); } }}
              placeholder="بپرسید، دستور بدهید یا یک سند را با یک جمله بنویسید…"
              className="h-16 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <Kbd>Esc</Kbd>
          </div>

          {(thinking || answer) && (
            <div className="border-b border-border bg-ai-soft/40 px-5 py-4">
              {thinking ? (
                <p className="flex items-center gap-2 text-[13px] text-ai-ink"><Loader2 className="size-4 animate-spin" /> ایجنت تحلیل‌گر جواب را از اسناد می‌سازد…</p>
              ) : answer && (
                <div className="animate-in fade-in-0 slide-in-from-top-1">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[14.5px]">{answer.title}</b>
                    {answer.rows.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => { pin(answer as Pinned); toast("روی داشبورد سنجاق شد.", "ai"); go("dashboard"); close(); }}>
                        <Pin /> سنجاق روی داشبورد
                      </Button>
                    )}
                  </div>
                  <p className="num mt-1 text-[13.5px] leading-7">{answer.line}</p>
                  {answer.rows.length > 0 && (
                    <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface">
                      {answer.rows.map(([k, v]) => <li key={k} className="num flex justify-between px-3 py-2 text-[13px]"><span>{k}</span><b dir="auto">{v}</b></li>)}
                    </ul>
                  )}
                  {answer.note && <p className="mt-2 text-[11.5px] text-muted-foreground">{answer.note}</p>}
                </div>
              )}
            </div>
          )}

          <Command.List className="max-h-[46vh] overflow-auto p-2">
            {looksLikeEntry && (
              <Command.Group heading="ایجنت ثبت" className="cmd-group">
                <Command.Item onSelect={run(() => startVoucher(q))} className="cmd-item">
                  <FilePlus2 /> ساختن پیش‌نویس سند از همین جمله <ArrowLeft className="ms-auto opacity-50" />
                </Command.Item>
              </Command.Group>
            )}
            <Command.Group heading="بپرسید" className="cmd-group">
              {["مانده‌ی بانک‌ها", "تراز آزمایشی آبان", "چرا نقدینگی بالا رفت؟", "اسناد منتظر تأیید"].map((s) => (
                <Command.Item key={s} value={s} onSelect={() => { setQ(s); ask(s); }} className="cmd-item">
                  <Sparkles className="text-ai" /> {s}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="برو به" className="cmd-group">
              <Command.Item onSelect={run(() => go("dashboard"))} className="cmd-item"><House /> امروز</Command.Item>
              <Command.Item onSelect={run(() => startVoucher())} className="cmd-item"><FilePlus2 /> سند جدید</Command.Item>
              <Command.Item onSelect={run(() => toast("گزارش‌ساز در کانسپت بعدی ساخته می‌شود."))} className="cmd-item"><BarChart3 /> گزارش‌ساز</Command.Item>
              <Command.Item onSelect={run(() => toast("یادآوری را در بخش «امروز» با یک جمله بنویسید.", "ai"))} className="cmd-item"><Bell /> یادآوری جدید</Command.Item>
              <Command.Item onSelect={run(() => toast("درخت حساب در کانسپت بعدی ساخته می‌شود."))} className="cmd-item"><Landmark /> درخت حساب</Command.Item>
              <Command.Item onSelect={run(() => setTour(true))} className="cmd-item"><Sparkles /> تور همین صفحه</Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center gap-4 border-t border-border px-5 py-2.5 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> پرسیدن یا اجرا</span>
            <span className="flex items-center gap-1.5"><Kbd>↑ ↓</Kbd> جابه‌جایی</span>
            <span className="ms-auto">جواب‌ها پیش‌نویس‌اند؛ هیچ سندی بدون تأیید شما قطعی نمی‌شود.</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
