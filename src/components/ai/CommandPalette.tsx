import * as React from "react";
import { Command } from "cmdk";
import { ArrowLeft, BarChart3, CalendarDays, FilePlus2, Files, House, Keyboard, Settings2, UserRound, Sparkles } from "@/components/icons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useApp } from "@/lib/store";
import { Orb } from "@/components/ai/Orb";
import { money, unitLabel } from "@/lib/utils";
import { followUps } from "@/components/ai/followups";

export type Answer = { title: string; line: string; rows: [string, string][]; note: string; id: string; report?: string };

/** Demo agent: a few intents answered with real-looking tools (synthetic data). */
export function answerFor(q: string, unit: "rial" | "toman"): Answer | null {
  const u = unitLabel(unit);
  if (/پیش.?بینی|آخر (ماه|آبان)/.test(q))
    return {
      id: "forecast", title: "پیش‌بینی نقدینگی تا آخر آبان", report: "cf",
      line: "با دریافت‌ها و چک‌های در راه، موجودی ۲۲ آبان به کم‌ترین حد می‌رسد و بعد دوباره بالا می‌رود.",
      rows: [["کم‌ترین موجودی · ۲۲ آبان", `${money(44_200_000_000, unit)} ${u}`], ["چک‌های پرداختی تا آخر ماه", `${money(3_340_000_000, unit)} ${u}`], ["موجودی پیش‌بینی‌شده · ۳۰ آبان", `${money(51_600_000_000, unit)} ${u}`]],
      note: "از چک‌ها و سررسیدهای تقویم مالی",
    };
  if (/مقایسه|با مهر/.test(q))
    return {
      id: "compare", title: "آبان در برابر مهر", report: "expcmp",
      line: "درآمد آبان ۱۱٪ بیشتر از مهر است و هزینه‌ها تقریباً ثابت مانده‌اند.",
      rows: [["درآمد", "+۱۱٪"], ["هزینه‌ها", "+۲٪"], ["سود خالص", "+۱۸٪"]],
      note: "از گزارش سود و زیان",
    };
  if (/هزینه/.test(q))
    return {
      id: "expenses", title: "هزینه‌های آبان به تفکیک", report: "expmix",
      line: "دو سوم هزینه‌های آبان حقوق و دستمزد است.",
      rows: [["حقوق و دستمزد", `${money(3_800_000_000, unit)} ${u}`], ["اجاره", `${money(650_000_000, unit)} ${u}`], ["حمل و نقل", `${money(580_000_000, unit)} ${u}`], ["سایر", `${money(770_000_000, unit)} ${u}`]],
      note: "از اسناد تأییدشده‌ی آبان",
    };
  if (/صورت.?حساب|مشتری/.test(q))
    return {
      id: "statements", title: "مانده‌ی مشتری‌ها · پایان مهر", report: "statements",
      line: "چهار مشتری بدهکارند. بیشترین مانده با پخش البرز است.",
      rows: [["پخش البرز", `${money(4_470_000_000, unit)} ${u}`], ["سیمان تهران", `${money(2_900_000_000, unit)} ${u}`], ["پتروشیمی مارون", `${money(2_830_000_000, unit)} ${u}`], ["فولاد مبارکه", `${money(2_600_000_000, unit)} ${u}`]],
      note: "برای فرستادن صورت‌حساب، گزارش را باز کنید و از دستیار گزارش بخواهید.",
    };
  if (/مانده|بانک/.test(q))
    return {
      id: "banks", title: "مانده‌ی بانک‌ها · امروز", report: "banks",
      line: `جمع موجودی بانک‌ها ${money(46_700_000_000, unit)} ${u} است. بیشترش در پارسیان جاری است.`,
      rows: [["بانک پارسیان · جاری ۴۴۱۰", `${money(31_200_000_000, unit)} ${u}`], ["بانک ملت · جاری ۸۸۲۰", `${money(9_800_000_000, unit)} ${u}`], ["بانک پارسیان · سپرده ۹۱۰۲", `${money(5_700_000_000, unit)} ${u}`]],
      note: "از اسناد تأییدشده تا ساعت ۱۰:۴۰ · داده‌ی آزمایشی",
    };
  if (/تراز/.test(q))
    return {
      id: "tb", title: "تراز آزمایشی آبان · سطح کل", report: "tb",
      line: "سند‌های آبان تراز است. سه گروه بیشترین گردش را دارند:",
      rows: [["دارایی‌های جاری", `${money(61_050_000_000, unit)} ${u}`], ["بدهی‌های جاری", `${money(9_400_000_000, unit)} ${u}`], ["درآمد عملیاتی", `${money(18_900_000_000, unit)} ${u}`]],
      note: "دوره‌ی آبان، سطح کل",
    };
  if (/نقدینگی|چرا/.test(q))
    return {
      id: "why-cash", title: "چرا نقدینگی ۶٪ بالا رفت؟",
      line: "بیشترِ افزایش از دریافت پتروشیمی مارون است.",
      rows: [["دریافت پتروشیمی مارون", `+${money(5_000_000_000, unit)}`], ["پرداخت به تکین‌کو", `−${money(4_000_000_000, unit)}`], ["کارمزد بانکی", `−${money(12_000_000, unit)}`]],
      note: "از اسناد ثبت‌شده‌ی آبان",
    };
  if (/چک|تکین/.test(q))
    return {
      id: "cheque", title: "چک تکین‌کو · سررسید امروز",
      line: "چک ۱٫۲ میلیارد ریالی امروز ساعت ۱۱ سررسید می‌شود. موجودی بانک ملت کافی است.",
      rows: [["شماره‌ی صیادی", "۰۰۸۸۴۱۲۹"], ["مبلغ", `${money(1_200_000_000, unit)} ${u}`], ["بانک", "ملت · جاری ۸۸۲۰"]],
      note: "از تقویم مالی",
    };
  if (/تأیید|منتظر|دیروز/.test(q))
    return {
      id: "pending", title: "اسناد منتظر تأیید",
      line: "۲ سند منتظر شماست و هر دو از بررسی‌ها سالم گذشته‌اند.",
      rows: [["دریافت از فولاد مبارکه", "۰۴۲"], ["کارمزد خدمات بانکی آبان", "۰۴۱"]],
      note: "از صفحه‌ی اسناد می‌توانید یکجا تأیید کنید.",
    };
  return null;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, paletteSeed, go, startVoucher, unit, openReport, openCalendar } = useApp();
  const [q, setQ] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [answer, setAnswer] = React.useState<Answer | null>(null);

  const ask = React.useCallback((text: string) => {
    if (!text.trim()) return;
    setThinking(true);
    setAnswer(null);
    setTimeout(() => { setAnswer(answerFor(text, unit) ?? { id: "none", title: "این را هنوز بلد نیستم", line: "در این نمونه می‌توانید درباره‌ی مانده‌ی بانک‌ها، تراز آزمایشی، نقدینگی، چک‌ها، مشتری‌ها و اسناد منتظر تأیید بپرسید.", rows: [], note: "" }); setThinking(false); }, 450);
  }, [unit]);

  React.useEffect(() => {
    if (paletteOpen) { setQ(paletteSeed); setAnswer(null); if (paletteSeed) ask(paletteSeed); }
  }, [paletteOpen, paletteSeed, ask]);

  const close = () => setPaletteOpen(false);
  const run = (fn: () => void) => () => { fn(); close(); };
  const looksLikeEntry = /واریز|پرداخت|دادیم|خرید|منتقل|میلیون|میلیارد|تومان/.test(q);

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">از راستا بپرسید</DialogTitle>
        <Command shouldFilter={false} label="فرمان راستا" className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-border px-5">
            <Orb size={28} busy={thinking} />
            <Command.Input
              value={q}
              onValueChange={(v) => { setQ(v); setAnswer(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.defaultPrevented && q && !looksLikeEntry) { e.preventDefault(); ask(q); } }}
              placeholder="بپرسید یا سند را در یک جمله بگویید…"
              className="h-16 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <Kbd>Esc</Kbd>
          </div>

          {(thinking || answer) && (
            <div className="border-b border-border bg-ai-soft/40 px-5 py-4">
              {thinking ? (
                <p className="flex items-center gap-2 text-[13px] text-ai-ink"><Orb size={18} busy /> در حال خواندن اسناد…</p>
              ) : answer && (
                <div className="animate-in fade-in-0 slide-in-from-top-1">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[14.5px]">{answer.title}</b>
                    {answer.report && (
                      <Button size="sm" variant="outline" onClick={() => { openReport(answer.report!); close(); }}>
                        <BarChart3 /> باز کردن گزارش
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
              <Command.Group heading="ثبت سند" className="cmd-group">
                <Command.Item onSelect={run(() => startVoucher({ text: q }))} className="cmd-item">
                  <FilePlus2 /> ساختن سند از همین جمله <ArrowLeft className="ms-auto opacity-50" />
                </Command.Item>
              </Command.Group>
            )}
            <Command.Group heading={answer && answer.id !== "none" ? "بعدش بپرسید" : "بپرسید"} className="cmd-group" forceMount={!!answer}>
              {(answer && answer.id !== "none" ? followUps(answer.id, [q], 4) : ["مانده‌ی بانک‌ها", "مانده‌ی مشتری‌ها", "تراز آزمایشی آبان", "چرا نقدینگی بالا رفت؟", "اسناد منتظر تأیید"]).map((s) => (
                <Command.Item key={s} value={s} forceMount={!!answer} onSelect={() => { setQ(s); ask(s); }} className="cmd-item">
                  <Sparkles className="text-ai" /> {s}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="برو به" className="cmd-group">
              <Command.Item onSelect={run(() => go("dashboard"))} className="cmd-item"><House /> داشبورد</Command.Item>
              <Command.Item onSelect={run(() => startVoucher())} className="cmd-item"><FilePlus2 /> سند جدید با دستیار</Command.Item>
              <Command.Item onSelect={run(() => startVoucher({ manual: true }))} className="cmd-item"><Keyboard /> سند جدید، دستی</Command.Item>
              <Command.Item onSelect={run(() => go("documents"))} className="cmd-item"><Files /> اسناد</Command.Item>
              <Command.Item onSelect={run(() => go("reports"))} className="cmd-item"><BarChart3 /> گزارش‌ها</Command.Item>
              <Command.Item onSelect={run(() => openCalendar())} className="cmd-item"><CalendarDays /> تقویم مالی</Command.Item>
              <Command.Item onSelect={run(() => go("settings"))} className="cmd-item"><Settings2 /> تنظیمات</Command.Item>
              <Command.Item onSelect={run(() => go("profile"))} className="cmd-item"><UserRound /> حساب کاربری و شرکت‌ها</Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center gap-4 border-t border-border px-5 py-2.5 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> پرسیدن یا اجرا</span>
            <span className="flex items-center gap-1.5"><Kbd>↑ ↓</Kbd> جابه‌جایی</span>
            <span className="ms-auto">هیچ سندی بدون تأیید شما ثبت نمی‌شود.</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
