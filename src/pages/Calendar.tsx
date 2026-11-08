import * as React from "react";
import { Bell, ChevronLeft, ChevronRight, LayoutGrid, List, Plus, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { catMeta, type CalEvent, type EventCat } from "@/data/demo";
import { cn, short, toEn, toFa, unitLabel } from "@/lib/utils";
import { dayIndex, diffDays, fmtDay, fmtFull, isToday, MONTHS, monthLength, relDay, TODAY, weekday, WEEKDAYS } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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

function dueBadge(e: CalEvent) {
  if (e.done) return <Badge tone="success">انجام شد</Badge>;
  const n = diffDays(e.m, e.d);
  if (n < 0) return <Badge tone="danger">{toFa(-n)} روز گذشته</Badge>;
  if (n === 0) return <Badge tone="warning">امروز</Badge>;
  if (n <= 3) return <Badge tone="warning">{relDay(e.m, e.d)}</Badge>;
  return <Badge>{relDay(e.m, e.d)}</Badge>;
}

export function Calendar() {
  const { events, addEvent, toggleEvent, calDay, toast, unit, startVoucher } = useApp();
  const [month, setMonth] = React.useState(calDay?.m ?? TODAY.m);
  const [day, setDay] = React.useState(calDay ?? { m: TODAY.m, d: TODAY.d });
  const [view, setView] = React.useState<"month" | "list">("month");
  const [cats, setCats] = React.useState<EventCat[]>([]);
  const [text, setText] = React.useState("");
  const shown = events.filter((e) => !cats.length || cats.includes(e.cat));
  const on = (m: number, d: number) => shown.filter((e) => e.m === m && e.d === d).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const lead = weekday(month, 1);
  const len = monthLength(month);
  const upcoming = shown.filter((e) => !e.done && diffDays(e.m, e.d) >= -3).sort((a, b) => dayIndex(a.m, a.d) - dayIndex(b.m, b.d)).slice(0, 7);
  const u = unitLabel(unit);
  const amt = (r?: number) => { if (!r) return null; const s = short(r, unit); return `${s.n} ${s.s} ${u}`; };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const p = parseReminder(text, day);
    addEvent({ id: `u${Date.now()}`, m: p.m, d: p.d, time: p.time, title: p.title, cat: "reminder" });
    setDay({ m: p.m, d: p.d });
    setMonth(p.m);
    setText("");
    toast(`یادآوری ${fmtDay(p.m, p.d)}${p.time ? `، ساعت ${p.time}` : ""} ثبت شد.`, "ai");
  };

  const EventRow = ({ e, showDay }: { e: CalEvent; showDay?: boolean }) => (
    <li className="flex items-start gap-3 border-t border-border/70 py-3 first:border-t-0">
      <input type="checkbox" checked={!!e.done} onChange={() => toggleEvent(e.id)} aria-label={`انجام شد: ${e.title}`} className="mt-1 size-4 shrink-0 accent-[hsl(var(--primary))]" />
      <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: `hsl(${catMeta[e.cat].color})` }} />
      <div className="min-w-0 flex-1">
        <div className={cn("text-[13.5px] font-bold", e.done && "text-muted-foreground line-through decoration-1")}>{e.title}</div>
        <div className="num mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted-foreground">
          {showDay && <span>{fmtDay(e.m, e.d)}</span>}
          {e.time && <span>ساعت {e.time}</span>}
          {amt(e.amount) && <span className="font-semibold text-foreground">{amt(e.amount)}</span>}
          <span>{catMeta[e.cat].label}</span>
          {e.auto && <span className="flex items-center gap-1 text-ai-ink"><Sparkles className="size-3" />خودکار</span>}
        </div>
        {e.note && <div className="mt-0.5 text-[12px] text-muted-foreground">{e.note}</div>}
        {!e.done && ((e.cat === "cheque" && e.title.includes("تکین")) || e.cat === "loan") && (
          <button onClick={() => startVoucher({ text: e.cat === "cheque" ? "۱۲۰ میلیون تومان چک تکین‌کو از بانک ملت پرداخت شد" : "۸۵ میلیون تومان قسط وام از بانک ملت پرداخت شد" })} className="mt-1 text-[12px] font-bold text-primary hover:underline">ثبت سند همین مورد</button>
        )}
      </div>
      {dueBadge(e)}
    </li>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="panel flex min-w-0 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button aria-label="ماه قبل" disabled={month <= 7} onClick={() => setMonth(month - 1)} className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-30"><ChevronRight className="size-4" /></button>
            <h2 className="min-w-[110px] text-center text-[17px] font-extrabold">{MONTHS[month - 1]} ۱۴۰۵</h2>
            <button aria-label="ماه بعد" disabled={month >= 10} onClick={() => setMonth(month + 1)} className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-30"><ChevronLeft className="size-4" /></button>
          </div>
          {month !== TODAY.m && <Button size="sm" variant="ghost" onClick={() => { setMonth(TODAY.m); setDay({ ...TODAY }); }}>امروز</Button>}
          <div className="ms-auto flex rounded-full bg-muted/80 p-1" role="radiogroup" aria-label="نما">
            {([["month", LayoutGrid, "ماه"], ["list", List, "فهرست"]] as const).map(([k, I, l]) => (
              <button key={k} role="radio" aria-checked={view === k} onClick={() => setView(k)} className={cn("flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-muted-foreground", view === k && "bg-surface text-foreground shadow-soft")}><I className="size-3.5" />{l}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Object.keys(catMeta) as EventCat[]).map((c) => (
            <button key={c} className="chip h-7" aria-pressed={cats.includes(c)} onClick={() => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>
              <i className="size-2 rounded-full" style={{ background: `hsl(${catMeta[c].color})` }} />{catMeta[c].label}
            </button>
          ))}
        </div>

        {view === "month" ? (
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-1.5 pb-1.5 text-center text-[11.5px] font-semibold text-muted-foreground">
              {WEEKDAYS.map((w) => <span key={w} className="truncate">{w}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: lead }).map((_, i) => <span key={"b" + i} />)}
              {Array.from({ length: len }, (_, i) => i + 1).map((d) => {
                const list = on(month, d);
                const sel = day.m === month && day.d === d;
                const fri = weekday(month, d) === 6;
                return (
                  <button key={d} onClick={() => setDay({ m: month, d })} aria-label={`${fmtFull(month, d)}، ${toFa(list.length)} رویداد`} aria-pressed={sel}
                    className={cn("flex min-h-[92px] flex-col gap-1 rounded-2xl border border-transparent bg-surface/55 p-1.5 text-start transition-colors hover:border-primary/30 sm:p-2",
                      fri && "bg-muted/50", sel && "border-primary/60 bg-primary-soft/60", isToday(month, d) && "ring-2 ring-primary/70")}>
                    <span className={cn("num grid size-6 place-items-center rounded-full text-[12.5px] font-bold", isToday(month, d) && "bg-primary text-primary-foreground", fri && !isToday(month, d) && "text-muted-foreground")}>{toFa(d)}</span>
                    {list.slice(0, 2).map((e) => (
                      <span key={e.id} className={cn("hidden items-center gap-1 rounded-md bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold sm:flex", e.done && "opacity-50")}>
                        <i className="size-1.5 shrink-0 rounded-full" style={{ background: `hsl(${catMeta[e.cat].color})` }} /><span className="truncate">{e.title}</span>
                      </span>
                    ))}
                    {list.length > 0 && <span className="flex gap-0.5 sm:hidden">{list.map((e) => <i key={e.id} className="size-1.5 rounded-full" style={{ background: `hsl(${catMeta[e.cat].color})` }} />)}</span>}
                    {list.length > 2 && <span className="num hidden text-[11px] text-muted-foreground sm:block">+{toFa(list.length - 2)} مورد</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <ul className="mt-4">
            {shown.filter((e) => e.m === month).sort((a, b) => a.d - b.d).map((e) => <EventRow key={e.id} e={e} showDay />)}
            {!shown.some((e) => e.m === month) && <li className="py-10 text-center text-[13px] text-muted-foreground">این ماه موردی نیست.</li>}
          </ul>
        )}
      </section>

      <aside className="flex flex-col gap-5">
        <section className="panel p-5">
          <h3 className="text-[15px] font-extrabold">{fmtFull(day.m, day.d)}</h3>
          <p className="text-[12px] text-muted-foreground">{relDay(day.m, day.d)}</p>
          <ul className="mt-2">
            {on(day.m, day.d).map((e) => <EventRow key={e.id} e={e} />)}
            {!on(day.m, day.d).length && <li className="py-6 text-center text-[13px] text-muted-foreground">برای این روز چیزی ثبت نشده.</li>}
          </ul>
          <form onSubmit={add} className="mt-3 flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="«پنجشنبه ساعت ۱۰ پیگیری چک جم»" aria-label="یادآوری تازه" className="rounded-full" />
            <Button type="submit" variant="soft" size="icon" aria-label="افزودن یادآوری"><Plus /></Button>
          </form>
        </section>

        <section className="panel p-5">
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold"><Bell className="size-4" /> پیش رو</h3>
          <ul className="mt-2">
            {upcoming.map((e) => (
              <li key={e.id}>
                <button onClick={() => { setMonth(e.m); setDay({ m: e.m, d: e.d }); }} className="flex w-full items-center gap-3 border-t border-border/70 py-2.5 text-start first:border-t-0 hover:text-primary">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: `hsl(${catMeta[e.cat].color})` }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{e.title}</span>
                    <span className="num text-[11.5px] text-muted-foreground">{fmtDay(e.m, e.d)}{amt(e.amount) ? ` · ${amt(e.amount)}` : ""}</span>
                  </span>
                  {dueBadge(e)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
