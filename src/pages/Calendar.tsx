import * as React from "react";
import { CalendarCheck2, ChevronLeft, ChevronRight, Clock, FilePlus2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { catMeta, holidays, type CalEvent, type EventCat } from "@/data/demo";
import { cn, short, toEn, toFa, unitLabel } from "@/lib/utils";
import { dayIndex, diffDays, fmtDay, fmtFull, isToday, MONTHS, monthLength, relDay, TODAY, weekday, WEEKDAYS, WD_SHORT } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Segmented } from "@/components/shell/Topbar";
import { Orb } from "@/components/ai/Orb";
import { Empty } from "@/pages/Dashboard";

/** "پنجشنبه ساعت ۱۰ پیگیری چک جم" → day, time and title */
export function parseReminder(s: string, base: { m: number; d: number }) {
  const t = toEn(s);
  let m = base.m, d = base.d;
  const wd = WEEKDAYS.findIndex((w) => t.includes(w.replace("‌", "")) || t.includes(w));
  const dm = t.match(/(\d{1,2})\s*(مهر|آبان|آذر|دی)/);
  if (/فردا/.test(t)) { m = TODAY.m; d = TODAY.d + 1; }
  else if (dm) { m = MONTHS.indexOf(dm[2]) + 1; d = +dm[1]; }
  else if (wd >= 0) {
    const now = weekday(TODAY.m, TODAY.d);
    const add = ((wd - now + 7) % 7) || 7;
    m = TODAY.m; d = TODAY.d + add;
  }
  if (d > monthLength(m)) { d -= monthLength(m); m += 1; }
  const tm = t.match(/ساعت\s*(\d{1,2})(?::(\d{2}))?/);
  const time = tm ? toFa(`${tm[1].padStart(2, "0")}:${tm[2] ?? "00"}`) : undefined;
  const title = s.replace(/(شنبه|یکشنبه|یک‌شنبه|دوشنبه|سه‌شنبه|سه شنبه|چهارشنبه|پنجشنبه|پنج‌شنبه|جمعه|فردا)/g, "").replace(/ساعت\s*[\d۰-۹]{1,2}(:[\d۰-۹]{2})?/g, "").replace(/[\d۰-۹]{1,2}\s*(مهر|آبان|آذر|دی)/g, "").replace(/\s+/g, " ").trim();
  return { m, d, time, title: title || s.trim() };
}

/* other calendars come from Intl, anchored at 1 Farvardin 1405 = 21 March 2026 */
const toDate = (m: number, d: number) => new Date(2026, 2, 21 + dayIndex(m, d), 12);
const greg = (m: number, d: number, withMonth = false) => new Intl.DateTimeFormat("fa-IR-u-ca-gregory", withMonth ? { day: "numeric", month: "short" } : { day: "numeric" }).format(toDate(m, d));
const hijri = (m: number, d: number) => new Intl.DateTimeFormat("fa-IR-u-ca-islamic-umalqura", { day: "numeric", month: "short" }).format(toDate(m, d));
const gregRange = (m: number) => `${new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { month: "long" }).format(toDate(m, 1))} تا ${new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { month: "long", year: "numeric" }).format(toDate(m, monthLength(m)))}`;
const holidayOn = (m: number, d: number) => holidays.find((h) => h.m === m && h.d === d);
const hourOf = (t?: string) => (t ? parseInt(toEn(t), 10) + (parseInt(toEn(t).split(":")[1] ?? "0", 10) / 60) : null);

function dueBadge(e: CalEvent) {
  if (e.done) return <Badge tone="success">انجام شد</Badge>;
  const n = diffDays(e.m, e.d);
  if (n < 0) return <Badge tone="danger">{toFa(-n)} روز گذشته</Badge>;
  if (n === 0) return <Badge tone="warning">امروز</Badge>;
  if (n <= 3) return <Badge tone="warning">{relDay(e.m, e.d)}</Badge>;
  return <Badge>{relDay(e.m, e.d)}</Badge>;
}

type View = "month" | "week" | "agenda";
type Day = { m: number; d: number };
const addDays = (x: Day, n: number): Day => {
  let { m, d } = x; d += n;
  while (d > monthLength(m)) { d -= monthLength(m); m += 1; }
  while (d < 1) { m -= 1; d += monthLength(m); }
  return { m, d };
};

/* ---------- create / edit dialog ---------- */
function NewReminder({ open, onOpenChange, at }: { open: boolean; onOpenChange: (o: boolean) => void; at: Day }) {
  const { addEvent, toast } = useApp();
  const [title, setTitle] = React.useState("");
  const [m, setM] = React.useState(at.m);
  const [d, setD] = React.useState(at.d);
  const [time, setTime] = React.useState("");
  const [cat, setCat] = React.useState<EventCat>("reminder");
  const [amount, setAmount] = React.useState("");
  const [sentence, setSentence] = React.useState("");
  React.useEffect(() => { if (open) { setM(at.m); setD(at.d); setTitle(""); setTime(""); setAmount(""); setSentence(""); setCat("reminder"); } }, [open, at.m, at.d]);
  const fromSentence = () => { if (!sentence.trim()) return; const p = parseReminder(sentence, { m, d }); setTitle(p.title); setM(p.m); setD(p.d); if (p.time) setTime(toEn(p.time)); };
  const save = () => {
    if (!title.trim()) return;
    const amt = parseInt(toEn(amount).replace(/[^\d]/g, "") || "0", 10);
    addEvent({ id: `u${Date.now()}`, m, d: Math.min(d, monthLength(m)), time: time ? toFa(time) : undefined, title: title.trim(), cat, amount: amt ? amt * 10 : undefined });
    toast(`یادآوری «${title.trim()}» برای ${fmtDay(m, d)} ثبت شد.`);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="top-[10vh] w-[min(520px,calc(100vw-32px))] p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <DialogTitle className="text-[16px] font-extrabold">یادآوری جدید</DialogTitle>
          <button aria-label="بستن" onClick={() => onOpenChange(false)} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 rounded-field border border-ai/30 bg-ai-soft/40 p-1.5 ps-2.5">
            <Orb size={22} />
            <input value={sentence} onChange={(e) => setSentence(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fromSentence(); } }} aria-label="یادآوری در یک جمله"
              placeholder="در یک جمله: «پنجشنبه ساعت ۱۰ پیگیری چک پخش البرز»" className="h-8 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
            <Button size="sm" variant="ai" type="button" onClick={fromSentence} disabled={!sentence.trim()}>پر کن</Button>
          </div>
          <label className="flex flex-col gap-1.5"><span className="field-label">عنوان</span><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: پیگیری مانده‌ی بانک ملت" autoFocus /></label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5"><span className="field-label">ماه</span>
              <select value={m} onChange={(e) => setM(+e.target.value)} className="h-10 rounded-field border border-input bg-surface px-2.5 text-[13.5px]">{[8, 9, 10, 11, 12].map((x) => <option key={x} value={x}>{MONTHS[x - 1]}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1.5"><span className="field-label">روز</span><Input type="number" min={1} max={monthLength(m)} value={d} onChange={(e) => setD(Math.min(Math.max(+e.target.value || 1, 1), monthLength(m)))} className="num" /></label>
            <label className="flex flex-col gap-1.5"><span className="field-label">ساعت</span><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="num" dir="ltr" /></label>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="field-label">دسته</span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(catMeta) as EventCat[]).map((c) => (
                <button key={c} type="button" className="chip h-8" aria-pressed={cat === c} onClick={() => setCat(c)}><i className="size-2 rounded-full" style={{ background: `hsl(${catMeta[c].color})` }} />{catMeta[c].label}</button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5"><span className="field-label">مبلغ (اختیاری، تومان)</span><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" dir="ltr" className="num text-left" placeholder="۰" /></label>
          <p className="num text-[12px] text-muted-foreground">{fmtFull(m, Math.min(d, monthLength(m)))}{time ? ` · ساعت ${toFa(time)}` : ""} · یک روز قبل اعلان می‌آید</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={save} disabled={!title.trim()}>ذخیره‌ی یادآوری</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- one event: a chip that opens its details ---------- */
function EventChip({ e, wide }: { e: CalEvent; wide?: boolean }) {
  const { toggleEvent, removeEvent, startVoucher, unit, toast } = useApp();
  const s = e.amount ? short(e.amount, unit) : null;
  const voucherText = e.cat === "cheque" && e.title.includes("تکین") ? "۱۲۰ میلیون تومان چک تکین‌کو از بانک ملت پرداخت شد" : e.cat === "loan" ? "۸۵ میلیون تومان قسط وام از بانک ملت پرداخت شد" : null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button onClick={(ev) => ev.stopPropagation()} title={e.title}
          className={cn("flex w-full min-w-0 items-center gap-1.5 rounded-[6px] px-1.5 text-start text-[11.5px] font-semibold leading-5 transition-[filter] hover:brightness-95", wide && "py-1 text-[12.5px]", e.done && "opacity-60")}
          style={{ background: `hsl(${catMeta[e.cat].color} / 0.16)`, boxShadow: `inset 3px 0 0 hsl(${catMeta[e.cat].color})` }}>
          {e.time && <span className="num shrink-0 text-muted-foreground">{e.time}</span>}
          <span className={cn("truncate", e.done && "line-through")}>{e.title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px]" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 size-3 shrink-0 rounded-[4px]" style={{ background: `hsl(${catMeta[e.cat].color})` }} />
          <div className="min-w-0 flex-1">
            <b className="block text-[14.5px] leading-6">{e.title}</b>
            <p className="num text-[12.5px] text-muted-foreground">{fmtFull(e.m, e.d)}{e.time ? ` · ساعت ${e.time}` : ""}</p>
          </div>
        </div>
        <dl className="num mt-3 flex flex-col gap-1.5 text-[12.5px]">
          <div className="flex justify-between"><dt className="text-muted-foreground">دسته</dt><dd className="font-semibold">{catMeta[e.cat].label}</dd></div>
          {s && <div className="flex justify-between"><dt className="text-muted-foreground">مبلغ</dt><dd className="font-bold">{s.n} {s.s} {unitLabel(unit)}</dd></div>}
          {e.auto && <div className="flex justify-between"><dt className="text-muted-foreground">منبع</dt><dd className="flex items-center gap-1 font-semibold text-ai-ink"><Sparkles className="size-3" /> ساخته‌شده توسط دستیار</dd></div>}
          {e.note && <p className="mt-1 rounded-field bg-muted/70 px-2.5 py-1.5 text-muted-foreground">{e.note}</p>}
        </dl>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] font-semibold"><Checkbox checked={!!e.done} onCheckedChange={() => toggleEvent(e.id)} /> انجام شد</label>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {voucherText && !e.done && <Button size="sm" onClick={() => startVoucher({ text: voucherText })}><FilePlus2 /> ثبت سند</Button>}
          {!e.auto && <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => { removeEvent(e.id); toast("یادآوری حذف شد."); }}><Trash2 /> حذف</Button>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------- mini month (side) ---------- */
function MiniMonth({ month, setMonth, sel, onPick, has }: { month: number; setMonth: (m: number) => void; sel: Day; onPick: (d: Day) => void; has: (d: Day) => boolean }) {
  const lead = weekday(month, 1);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <b className="text-[13.5px]">{MONTHS[month - 1]} ۱۴۰۵</b>
        <div className="flex">
          <button aria-label="ماه قبل" disabled={month <= 7} onClick={() => setMonth(month - 1)} className="grid size-7 place-items-center rounded-full hover:bg-muted disabled:opacity-30"><ChevronRight className="size-4" /></button>
          <button aria-label="ماه بعد" disabled={month >= 12} onClick={() => setMonth(month + 1)} className="grid size-7 place-items-center rounded-full hover:bg-muted disabled:opacity-30"><ChevronLeft className="size-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10.5px] text-muted-foreground">{WD_SHORT.map((w) => <span key={w} className="py-1">{w}</span>)}</div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: lead }).map((_, i) => <span key={"b" + i} />)}
        {Array.from({ length: monthLength(month) }, (_, i) => i + 1).map((d) => {
          const on = sel.m === month && sel.d === d, today = isToday(month, d), off = weekday(month, d) === 6 || !!holidayOn(month, d);
          return (
            <button key={d} onClick={() => onPick({ m: month, d })} aria-label={fmtDay(month, d)} aria-pressed={on}
              className={cn("num relative mx-auto grid size-7 place-items-center rounded-full text-[11.5px] transition-colors hover:bg-muted", off && "text-danger", on && !today && "bg-primary-soft font-bold text-primary", today && "bg-primary font-bold text-primary-foreground hover:bg-primary")}>
              {toFa(d)}
              {has({ m: month, d }) && !today && <i className="absolute bottom-0.5 size-1 rounded-full bg-primary/70" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Calendar() {
  const { events, calDay, concept, settings, setSettings, unit, toggleEvent, addEvent, toast } = useApp();
  const bento = concept === "bento";
  const [month, setMonth] = React.useState(calDay?.m ?? TODAY.m);
  const [mini, setMini] = React.useState(calDay?.m ?? TODAY.m);
  const [sel, setSel] = React.useState<Day>(calDay ?? { m: TODAY.m, d: TODAY.d });
  const [view, setView] = React.useState<View>(bento && (typeof window === "undefined" || window.innerWidth >= 768) ? "month" : "agenda");
  const [hidden, setHidden] = React.useState<EventCat[]>([]);
  const [create, setCreate] = React.useState<Day | null>(null);
  const [quick, setQuick] = React.useState("");
  const showHol = settings.calendars.holidays;

  const shown = events.filter((e) => !hidden.includes(e.cat));
  const on = (m: number, d: number) => shown.filter((e) => e.m === m && e.d === d).sort((a, b) => (hourOf(a.time) ?? -1) - (hourOf(b.time) ?? -1));
  const upcoming = shown.filter((e) => !e.done && diffDays(e.m, e.d) >= 0).sort((a, b) => dayIndex(a.m, a.d) - dayIndex(b.m, b.d) || (hourOf(a.time) ?? 0) - (hourOf(b.time) ?? 0));
  const pick = (d: Day) => { setSel(d); setMonth(d.m); setMini(d.m); };
  const step = (n: number) => {
    if (view === "month") { const m = Math.min(Math.max(month + n, 7), 12); setMonth(m); setMini(m); }
    else pick(addDays(sel, n * 7));
  };
  const title = view === "month" ? `${MONTHS[month - 1]} ۱۴۰۵` : (() => { const s = addDays(sel, -weekday(sel.m, sel.d)), e = addDays(s, 6); return `${fmtDay(s.m, s.d)} تا ${fmtDay(e.m, e.d)}`; })();
  const amt = (r?: number) => { if (!r) return null; const s = short(r, unit); return `${s.n} ${s.s} ${unitLabel(unit)}`; };

  const addQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quick.trim()) return;
    const p = parseReminder(quick, sel);
    addEvent({ id: `u${Date.now()}`, m: p.m, d: p.d, time: p.time, title: p.title, cat: "reminder" });
    pick({ m: p.m, d: p.d });
    setQuick("");
    toast(`یادآوری ${fmtDay(p.m, p.d)}${p.time ? `، ساعت ${p.time}` : ""} ثبت شد.`, "ai");
  };

  /* ----- month grid ----- */
  const monthGrid = () => {
    const lead = weekday(month, 1), len = monthLength(month);
    const cells = Math.ceil((lead + len) / 7) * 7;
    return (
      <div className="flex min-w-[720px] flex-col">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((w, i) => <span key={w} className={cn("py-2 text-center text-[12px] font-bold text-muted-foreground", i === 6 && "text-danger")}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: cells }, (_, i) => {
            const d = i - lead + 1;
            if (d < 1 || d > len) return <div key={i} className="min-h-[118px] border-b border-s border-border/60 bg-muted/20" />;
            const list = on(month, d);
            const hol = showHol ? holidayOn(month, d) : undefined;
            const fri = weekday(month, d) === 6;
            const isSel = sel.m === month && sel.d === d;
            return (
              <div key={i} role="button" tabIndex={0} aria-label={`${fmtFull(month, d)}${list.length ? `، ${toFa(list.length)} مورد` : ""}`}
                onClick={() => setSel({ m: month, d })} onDoubleClick={() => setCreate({ m: month, d })}
                onKeyDown={(e) => { if (e.key === "Enter") setCreate({ m: month, d }); }}
                className={cn("group flex min-h-[118px] cursor-pointer flex-col gap-1 border-b border-s border-border/60 p-1.5 transition-colors hover:bg-muted/40", (fri || hol) && "bg-danger-soft/25", isSel && "bg-primary-soft/40")}>
                <div className="flex items-center gap-1">
                  <span className={cn("num grid size-7 place-items-center rounded-full text-[13px] font-bold", (fri || hol) && "text-danger", isToday(month, d) && "bg-primary text-primary-foreground")}>{toFa(d)}</span>
                  {settings.calendars.gregorian && <span className="num text-[10.5px] text-muted-foreground">{greg(month, d, d === 1)}</span>}
                  {settings.calendars.hijri && <span className="num ms-auto text-[10px] text-muted-foreground">{hijri(month, d)}</span>}
                  <button aria-label={`یادآوری برای ${fmtDay(month, d)}`} onClick={(e) => { e.stopPropagation(); setCreate({ m: month, d }); }}
                    className={cn("grid size-6 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-surface hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100", !settings.calendars.hijri && "ms-auto")}><Plus className="size-3.5" /></button>
                </div>
                {hol && <span className="truncate px-1 text-[10.5px] font-semibold text-danger" title={hol.title}>تعطیل: {hol.title}</span>}
                <div className="flex flex-col gap-0.5">
                  {list.slice(0, 3).map((e) => <EventChip key={e.id} e={e} />)}
                  {list.length > 3 && <button onClick={(ev) => { ev.stopPropagation(); setSel({ m: month, d }); setView("agenda"); }} className="px-1.5 text-start text-[11px] font-bold text-muted-foreground hover:text-foreground">{toFa(list.length - 3)} مورد دیگر</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ----- week: all-day row + hours ----- */
  const weekGrid = () => {
    const start = addDays(sel, -weekday(sel.m, sel.d));
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
    const H = 48;
    return (
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-border">
          <span />
          {days.map((d) => {
            const off = weekday(d.m, d.d) === 6 || (showHol && !!holidayOn(d.m, d.d));
            return (
              <button key={`${d.m}-${d.d}`} onClick={() => setSel(d)} className="flex flex-col items-center gap-0.5 py-2">
                <span className={cn("text-[11.5px] font-semibold text-muted-foreground", off && "text-danger")}>{WEEKDAYS[weekday(d.m, d.d)]}</span>
                <span className={cn("num grid size-9 place-items-center rounded-full text-[17px] font-extrabold", off && "text-danger", isToday(d.m, d.d) && "bg-primary text-primary-foreground")}>{toFa(d.d)}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-border">
          <span className="py-1.5 text-center text-[10.5px] text-muted-foreground">تمام روز</span>
          {days.map((d) => {
            const hol = showHol ? holidayOn(d.m, d.d) : undefined;
            return (
              <div key={`${d.m}-${d.d}`} className="flex min-h-[40px] flex-col gap-0.5 border-s border-border/60 p-1">
                {hol && <span className="truncate rounded-[6px] bg-danger-soft px-1.5 text-[11px] font-semibold leading-5 text-danger">{hol.title}</span>}
                {on(d.m, d.d).filter((e) => !e.time).map((e) => <EventChip key={e.id} e={e} />)}
              </div>
            );
          })}
        </div>
        <div className="relative grid grid-cols-[52px_repeat(7,minmax(0,1fr))]">
          <div>{hours.map((h) => <div key={h} className="num relative text-center text-[10.5px] text-muted-foreground" style={{ height: H }}><span className="relative -top-2">{toFa(`${h}:00`)}</span></div>)}</div>
          {days.map((d) => (
            <div key={`${d.m}-${d.d}`} className="relative border-s border-border/60" onDoubleClick={() => setCreate(d)}>
              {hours.map((h) => <div key={h} className="border-t border-border/50" style={{ height: H }} />)}
              {on(d.m, d.d).filter((e) => e.time).map((e) => {
                const top = ((hourOf(e.time) ?? 8) - 8) * H;
                return <div key={e.id} className="absolute inset-x-1" style={{ top: top + 2, height: H - 6 }}><EventChip e={e} wide /></div>;
              })}
              {isToday(d.m, d.d) && <span className="pointer-events-none absolute inset-x-0 border-t-2 border-danger" style={{ top: (10.6 - 8) * H }}><i className="absolute -start-1 -top-[5px] size-2 rounded-full bg-danger" /></span>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ----- agenda (schedule) ----- */
  const agenda = () => {
    const from = view === "agenda" ? sel : { m: month, d: 1 };
    const days = Array.from({ length: 45 }, (_, i) => addDays(from, i)).filter((d) => d.m <= 12);
    const rows = days.map((d) => ({ d, list: on(d.m, d.d), hol: showHol ? holidayOn(d.m, d.d) : undefined })).filter((r) => r.list.length || r.hol);
    if (!rows.length) return <Empty icon={CalendarCheck2} title="برنامه‌ای در این بازه نیست" text="با دکمه‌ی «یادآوری جدید» یک مورد اضافه کنید." />;
    return (
      <ol className="flex flex-col">
        {rows.map(({ d, list, hol }) => (
          <li key={`${d.m}-${d.d}`} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-border/60 px-2 py-3 last:border-0">
            <button onClick={() => pick(d)} className="flex items-start gap-2 text-start">
              <span className={cn("num grid size-10 shrink-0 place-items-center rounded-full text-[18px] font-extrabold", isToday(d.m, d.d) && "bg-primary text-primary-foreground", (weekday(d.m, d.d) === 6 || hol) && !isToday(d.m, d.d) && "text-danger")}>{toFa(d.d)}</span>
              <span className="pt-0.5 text-[11.5px] leading-4 text-muted-foreground">{MONTHS[d.m - 1]}<br />{WEEKDAYS[weekday(d.m, d.d)]}</span>
            </button>
            <ul className="flex flex-col gap-1.5">
              {hol && <li className="text-[12.5px] font-semibold text-danger">تعطیل رسمی: {hol.title}</li>}
              {list.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-field px-2 py-1.5 hover:bg-muted/50">
                  <Checkbox checked={!!e.done} onCheckedChange={() => toggleEvent(e.id)} aria-label={`انجام شد: ${e.title}`} color={catMeta[e.cat].color} />
                  <span className="num w-12 shrink-0 text-[12px] text-muted-foreground">{e.time ?? "تمام روز"}</span>
                  <span className={cn("min-w-0 flex-1 truncate text-[13.5px] font-bold", e.done && "text-muted-foreground line-through")}>{e.title}</span>
                  {amt(e.amount) && <span className="num text-[12.5px] font-semibold">{amt(e.amount)}</span>}
                  {dueBadge(e)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    );
  };

  const side = (
    <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
      <section className="panel flex flex-col gap-4 p-4">
        <Button size="lg" className="w-full" onClick={() => setCreate(sel)}><Plus /> یادآوری جدید</Button>
        <MiniMonth month={mini} setMonth={setMini} sel={sel} onPick={pick} has={(d) => on(d.m, d.d).some((e) => !e.done)} />
      </section>
      <section className="panel p-4">
        <h3 className="mb-2.5 text-[13px] font-extrabold">تقویم‌ها</h3>
        <ul className="flex flex-col gap-2.5">
          {(Object.keys(catMeta) as EventCat[]).map((c) => (
            <li key={c}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <Checkbox color={catMeta[c].color} checked={!hidden.includes(c)} onCheckedChange={() => setHidden((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))} />
                {catMeta[c].label}
                <span className="num ms-auto text-[11.5px] text-muted-foreground">{toFa(events.filter((e) => e.cat === c && !e.done).length)}</span>
              </label>
            </li>
          ))}
          <li className="mt-1 border-t border-border pt-2.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
              <Checkbox color="var(--danger)" checked={showHol} onCheckedChange={(v) => setSettings({ calendars: { ...settings.calendars, holidays: !!v } })} /> تعطیلات رسمی
            </label>
          </li>
        </ul>
      </section>
      <section className="panel p-4">
        <h3 className="mb-1 flex items-center gap-1.5 text-[13px] font-extrabold"><Clock className="size-4 text-muted-foreground" /> پیش رو</h3>
        {upcoming.length ? (
          <ul>
            {upcoming.slice(0, 5).map((e) => (
              <li key={e.id}>
                <button onClick={() => pick({ m: e.m, d: e.d })} className="flex w-full items-start gap-2.5 border-t border-border/60 py-2.5 text-start first:border-t-0">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: `hsl(${catMeta[e.cat].color})` }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{e.title}</span>
                    <span className="num block text-[11.5px] text-muted-foreground">{fmtDay(e.m, e.d)}{e.time ? ` · ${e.time}` : ""}{amt(e.amount) ? ` · ${amt(e.amount)}` : ""}</span>
                  </span>
                  {dueBadge(e)}
                </button>
              </li>
            ))}
          </ul>
        ) : <Empty icon={CalendarCheck2} title="موردی پیش رو نیست" />}
      </section>
    </aside>
  );

  return (
    <div className={cn("grid gap-5", bento ? "xl:grid-cols-[minmax(0,1fr)_290px]" : "xl:grid-cols-[290px_minmax(0,1fr)]")}>
      {!bento && side}
      <div className="flex min-w-0 flex-col gap-4">
        {!bento && (
          <form onSubmit={addQuick} className="hero flex items-center gap-3 p-3 ps-4">
            <Orb size={30} />
            <input value={quick} onChange={(e) => setQuick(e.target.value)} aria-label="افزودن یادآوری با یک جمله" placeholder="یادآوری را در یک جمله بنویسید؛ مثلاً «پنجشنبه ساعت ۱۰ جلسه با حسابرس»"
              className="h-10 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground" />
            <Button type="submit" variant="ai" disabled={!quick.trim()}><Plus /> افزودن</Button>
          </form>
        )}
        <section className="panel-data flex min-w-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <Button size="sm" variant="outline" onClick={() => pick({ m: TODAY.m, d: TODAY.d })}>امروز</Button>
            <div className="flex">
              <button aria-label="قبلی" onClick={() => step(-1)} className="grid size-8 place-items-center rounded-full hover:bg-muted"><ChevronRight className="size-4" /></button>
              <button aria-label="بعدی" onClick={() => step(1)} className="grid size-8 place-items-center rounded-full hover:bg-muted"><ChevronLeft className="size-4" /></button>
            </div>
            <div>
              <h2 className="num text-[17px] font-extrabold leading-6">{view === "agenda" ? `از ${fmtDay(sel.m, sel.d)}` : title}</h2>
              {settings.calendars.gregorian && view === "month" && <p className="num text-[11.5px] text-muted-foreground">{gregRange(month)}</p>}
            </div>
            <Segmented className="ms-auto" label="نما" value={view} onChange={setView} items={[["month", "ماه"], ["week", "هفته"], ["agenda", "برنامه"]]} />
          </div>
          <div className="overflow-x-auto">
            {view === "month" ? monthGrid() : view === "week" ? weekGrid() : <div className="p-2">{agenda()}</div>}
          </div>
          {view === "month" && <p className="border-t border-border px-4 py-2 text-[11.5px] text-muted-foreground">برای افزودن یادآوری روی روز دوبار کلیک کنید یا دکمه‌ی + را بزنید.</p>}
        </section>
      </div>
      {bento && side}
      <NewReminder open={!!create} onOpenChange={(o) => !o && setCreate(null)} at={create ?? sel} />
    </div>
  );
}
