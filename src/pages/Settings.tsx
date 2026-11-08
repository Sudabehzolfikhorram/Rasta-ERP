import * as React from "react";
import { Add, Bell, CalendarDays, FileCog, Lock, Palette, AlarmClock, TickCircle } from "@/components/icons";
import { useApp, type Channel, type NotifKind } from "@/lib/store";
import { Segmented } from "@/components/shell/Topbar";
import { cn, toFa } from "@/lib/utils";
import { MONTHS } from "@/lib/jalali";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount";
import { SimpleSelect } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { monthLength } from "@/lib/jalali";

export function Row({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border/70 py-4 first:border-t-0">
      <div className="min-w-[200px] flex-1">
        <div className="text-[14px] font-bold">{title}</div>
        {note && <div className="num mt-0.5 text-[12.5px] text-muted-foreground">{note}</div>}
      </div>
      {children}
    </div>
  );
}

const NOTIF: [NotifKind, string, string][] = [
  ["approve", "اسناد منتظر تأیید", "وقتی سندی بالاتر از سقف ثبت می‌شود"],
  ["due", "سررسیدها و یادآوری‌ها", "چک، قسط، مالیات و یادآوری‌های شما"],
  ["ai", "هشدارهای دستیار", "احتمال ثبت تکراری، مغایرت بانکی و ناهنجاری"],
  ["system", "رویدادهای سیستم", "ورود کاربر جدید، پشتیبان‌گیری و به‌روزرسانی"],
];
const CHANNELS: [Channel, string][] = [["app", "در برنامه"], ["email", "ایمیل"], ["sms", "پیامک"]];

type SectionId = "display" | "docs" | "calendars" | "reminders" | "notify";
const SECTIONS: [SectionId, string, typeof Bell][] = [["display", "ظاهر و نمایش", Palette], ["docs", "حساب‌ها و سند", FileCog], ["calendars", "تقویم‌ها و سال مالی", CalendarDays], ["reminders", "یادآوری‌ها", AlarmClock], ["notify", "اعلان‌ها", Bell]];

/** − value + : used instead of a native number field so it looks the same everywhere. */
function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex h-10 items-center rounded-field border border-input bg-surface">
      <button type="button" aria-label={`کم کردن ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-35">−</button>
      <span className="num w-7 text-center text-[14px] font-bold" aria-live="polite">{toFa(value)}</span>
      <button type="button" aria-label={`زیاد کردن ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-35">+</button>
    </div>
  );
}

function useSections() {
  const { settings, setSettings, concept, setConcept, theme, setTheme, toast } = useApp();
  const levels = ["کل", "معین", "تفصیلی"];
  const range: [number, number][] = [[1, 2], [2, 4], [4, 9]];
  const cal = settings.calendars, rem = settings.reminders;
  const body: Record<SectionId, React.ReactNode> = {
    display: (
      <>
        <Row title="کانسپت"><Segmented label="کانسپت" value={concept} onChange={setConcept} items={[["assist", "دستیار"], ["bento", "پیشخوان"]]} /></Row>
        <Row title="حالت نمایش"><Segmented label="حالت نمایش" value={theme} onChange={setTheme} items={[["light", "روشن"], ["dark", "تیره"]]} /></Row>
        <Row title="جلوه‌های حرکتی" note="انیمیشن دستیار و جابه‌جایی صفحه‌ها"><Switch checked={settings.motion} onCheckedChange={(v) => { setSettings({ motion: v }); toast(v ? "جلوه‌های حرکتی فعال شد." : "جلوه‌های حرکتی غیرفعال شد."); }} aria-label="جلوه‌های حرکتی" /></Row>
      </>
    ),
    docs: (
      <>
        <Row title="طول کد حساب" note={`نمونه: ⁦${toFa(["1", "1".padStart(settings.codeLen[1], "0"), "1".padStart(settings.codeLen[2], "0")].join("-"))}⁩`}>
          <div className="flex gap-2">
            {levels.map((l, i) => (
              <label key={l} className="flex flex-col items-center gap-1 text-[12px] text-muted-foreground">
                {l}
                <Stepper label={`طول کد ${l}`} value={settings.codeLen[i]} min={range[i][0]} max={range[i][1]}
                  onChange={(v) => { const c = [...settings.codeLen] as [number, number, number]; c[i] = v; setSettings({ codeLen: c }); }} />
              </label>
            ))}
          </div>
        </Row>
        <Row title="سقف تأیید مدیر مالی" note="سندهای بالاتر از این مبلغ پس از ثبت منتظر تأیید می‌مانند">
          <AmountInput label="سقف تأیید به ریال" value={settings.approvalLimit} onChange={(v) => setSettings({ approvalLimit: v })} className="w-56" inputClassName="h-10" />
        </Row>
      </>
    ),
    calendars: (
      <>
        <Row title="تقویم هجری شمسی" note="تقویم اصلی سیستم؛ همه‌ی اسناد با این تاریخ ثبت می‌شوند"><Switch checked disabled aria-label="تقویم هجری شمسی" /></Row>
        <Row title="نمایش تاریخ میلادی" note="کنار روزهای تقویم مالی"><Switch checked={cal.gregorian} onCheckedChange={(v) => setSettings({ calendars: { ...cal, gregorian: v } })} aria-label="نمایش تاریخ میلادی" /></Row>
        <Row title="نمایش تاریخ قمری"><Switch checked={cal.hijri} onCheckedChange={(v) => setSettings({ calendars: { ...cal, hijri: v } })} aria-label="نمایش تاریخ قمری" /></Row>
        <Row title="تعطیلات رسمی" note="روزهای تعطیل در تقویم قرمز نمایش داده می‌شوند"><Switch checked={cal.holidays} onCheckedChange={(v) => setSettings({ calendars: { ...cal, holidays: v } })} aria-label="تعطیلات رسمی" /></Row>
        <FiscalYears />
      </>
    ),
    reminders: (
      <>
        <Row title="زمان یادآوری پیش‌فرض" note="برای سررسیدها و یادآوری‌های جدید">
          <SimpleSelect className="w-[170px]" label="زمان یادآوری" value={rem.lead} onChange={(v) => setSettings({ reminders: { ...rem, lead: +v } })} options={[[0, "همان روز"], [1, "یک روز قبل"], [3, "سه روز قبل"], [7, "یک هفته قبل"]]} />
        </Row>
        <Row title="خلاصه‌ی روزانه" note="فهرست کارهای امروز، هر روز صبح">
          <SimpleSelect className="w-[170px]" label="ساعت خلاصه‌ی روزانه" value={rem.digest} onChange={(v) => setSettings({ reminders: { ...rem, digest: v } })} options={[["۰۷:۳۰", "ساعت ۷:۳۰"], ["۰۸:۰۰", "ساعت ۸:۰۰"], ["۰۹:۰۰", "ساعت ۹:۰۰"]]} />
        </Row>
        {([["tax", "مهلت‌های مالیات و بیمه"], ["cheque", "سررسید چک‌ها"], ["loan", "اقساط وام"], ["close", "پایان دوره‌ی مالی"]] as const).map(([k, l]) => (
          <Row key={k} title={l} note="به‌صورت خودکار به تقویم اضافه می‌شود"><Switch checked={rem[k]} onCheckedChange={(v) => setSettings({ reminders: { ...rem, [k]: v } })} aria-label={l} /></Row>
        ))}
      </>
    ),
    notify: (
      <div className="overflow-x-auto py-2">
        <table className="w-full min-w-[480px] text-[13px]">
          <thead><tr className="text-[12px] text-muted-foreground"><th className="py-2 text-start font-semibold">نوع اعلان</th>{CHANNELS.map(([c, l]) => <th key={c} className="w-24 py-2 text-center font-semibold">{l}</th>)}</tr></thead>
          <tbody>
            {NOTIF.map(([k, l, n]) => (
              <tr key={k} className="border-t border-border/70">
                <td className="py-3"><b className="block text-[13.5px]">{l}</b><span className="text-[12px] text-muted-foreground">{n}</span></td>
                {CHANNELS.map(([c, cl]) => (
                  <td key={c} className="py-3"><div className="grid place-items-center"><Checkbox aria-label={`${l} از طریق ${cl}`} checked={settings.notify[k][c]} onCheckedChange={(v) => setSettings({ notify: { ...settings.notify, [k]: { ...settings.notify[k], [c]: !!v } } })} /></div></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  };
  return body;
}

export function Settings() {
  const { concept } = useApp();
  const body = useSections();
  const [tab, setTab] = React.useState<SectionId>("display");
  if (concept === "bento") {
    return (
      <div className="grid gap-5 md:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="panel edge-run h-fit p-2 md:sticky md:top-4" aria-label="بخش‌های تنظیمات">
          {SECTIONS.map(([id, l, I]) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
              className={cn("flex w-full items-center gap-2.5 rounded-field px-3 py-2.5 text-start text-[13.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", tab === id && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary")}>
              <I className="size-4" />{l}
            </button>
          ))}
        </nav>
        <section className="panel px-5 py-2">
          <h2 className="pb-1 pt-3 text-[16px] font-extrabold">{SECTIONS.find((s) => s[0] === tab)![1]}</h2>
          {body[tab]}
        </section>
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {SECTIONS.map(([id, l, I]) => (
        <section key={id} className="panel px-5 py-2">
          <h2 className="flex items-center gap-2 pb-1 pt-3 text-[15px] font-extrabold"><I className="size-4 text-muted-foreground" />{l}</h2>
          {body[id]}
        </section>
      ))}
    </div>
  );
}

/* ---------- fiscal years: list, period timeline and a custom-year dialog ---------- */
type FY = { id: string; title: string; start: [number, number, number]; end: [number, number, number]; state: "closed" | "open" | "draft"; custom?: boolean };
const fmtD = ([y, m, d]: [number, number, number]) => `${toFa(d)} ${MONTHS[m - 1]} ${toFa(y)}`;
const monthsBetween = (a: [number, number, number], b: [number, number, number]) => (b[0] - a[0]) * 12 + (b[1] - a[1]) + (b[2] >= monthLength(b[1]) - 1 ? 1 : 0);

function FiscalYears() {
  const { settings, setSettings, toast } = useApp();
  const [years, setYears] = React.useState<FY[]>([
    { id: "y1404", title: "سال مالی ۱۴۰۴", start: [1404, 1, 1], end: [1404, 12, 29], state: "closed" },
    { id: "y1405", title: "سال مالی ۱۴۰۵", start: [1405, settings.fiscalStart, 1], end: [1405, 12, 29], state: "open" },
  ]);
  const [periods, setPeriods] = React.useState<("closed" | "open" | "future")[]>(MONTHS.map((_, i) => (i < 7 ? "closed" : i === 7 ? "open" : "future")));
  const [dlg, setDlg] = React.useState(false);
  const cur = years.find((y) => y.state === "open")!;
  return (
    <div className="flex flex-col gap-4 border-t border-border/70 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <div className="text-[14px] font-bold">سال‌های مالی</div>
          <div className="text-[12.5px] text-muted-foreground">هر سال مالی می‌تواند ۱۲ ماهه یا با بازه‌ی دلخواه باشد.</div>
        </div>
        <Button size="sm" variant="soft" onClick={() => setDlg(true)}><Add /> سال مالی جدید</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {years.map((y) => (
          <div key={y.id} className={cn("rounded-[calc(var(--r-field)+4px)] border p-4", y.state === "open" ? "border-primary/40 bg-primary-soft/40" : "border-border bg-surface/60")}>
            <div className="flex items-center gap-2">
              <b className="text-[14px]">{y.title}</b>
              <Badge className="ms-auto" tone={y.state === "open" ? "success" : y.state === "closed" ? "neutral" : "info"}>{y.state === "open" ? "جاری" : y.state === "closed" ? "بسته‌شده" : "آماده‌ی شروع"}</Badge>
            </div>
            <p className="num mt-1.5 text-[12.5px] text-muted-foreground">{fmtD(y.start)} تا {fmtD(y.end)}</p>
            <p className="num text-[12px] text-muted-foreground">{toFa(monthsBetween(y.start, y.end) || 12)} ماه{y.custom ? " · سفارشی" : ""}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[calc(var(--r-field)+4px)] border border-border bg-surface/60 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <b className="text-[13.5px]">دوره‌های {cur.title}</b>
          <span className="text-[12px] text-muted-foreground">برای بستن یا باز کردن، روی ماه بزنید.</span>
          <label className="ms-auto flex items-center gap-2 text-[12.5px]"><span className="text-muted-foreground">ماه شروع</span>
            <SimpleSelect className="w-[150px]" label="ماه شروع سال مالی" value={settings.fiscalStart} onChange={(v) => { setSettings({ fiscalStart: +v }); setYears((x) => x.map((y) => (y.id === "y1405" ? { ...y, start: [1405, +v, 1] } : y))); }} options={MONTHS.map((m, i) => [i + 1, m])} />
          </label>
        </div>
        <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 xl:grid-cols-12">
          {MONTHS.map((m, i) => {
            const st = periods[i];
            return (
              <li key={m}>
                <button disabled={st === "future"} onClick={() => { setPeriods((p) => p.map((x, j) => (j === i ? (x === "closed" ? "open" : "closed") : x))); toast(`دوره‌ی ${m} ${st === "closed" ? "باز" : "بسته"} شد.`); }}
                  className={cn("flex w-full flex-col items-center gap-1 rounded-field border px-1 py-2 text-[12px] font-bold transition-colors", st === "closed" ? "border-border bg-muted/70 text-muted-foreground" : st === "open" ? "border-success/40 bg-success-soft text-success" : "border-dashed border-border text-muted-foreground/70")}>
                  {st === "closed" ? <Lock className="size-4" /> : st === "open" ? <TickCircle className="size-4" variant="Bulk" /> : <span className="size-4" />}
                  {m}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex flex-wrap gap-4 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-muted-foreground/40" />بسته</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-success" />باز</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] border border-dashed border-muted-foreground" />آینده</span>
        </div>
      </div>
      {dlg && <NewFiscalYear onClose={() => setDlg(false)} onSave={(y) => { setYears((x) => [...x, y]); setDlg(false); toast(`${y.title} تعریف شد.`, "success"); }} />}
    </div>
  );
}

function NewFiscalYear({ onClose, onSave }: { onClose: () => void; onSave: (y: FY) => void }) {
  const [mode, setMode] = React.useState<"standard" | "custom">("standard");
  const [title, setTitle] = React.useState("سال مالی ۱۴۰۶");
  const [start, setStart] = React.useState<[number, number, number]>([1406, 1, 1]);
  const [end, setEnd] = React.useState<[number, number, number]>([1406, 12, 29]);
  const effEnd: [number, number, number] = mode === "standard" ? (start[1] === 1 ? [start[0], 12, 29] : [start[0] + 1, start[1] - 1, monthLength(start[1] - 1)]) : end;
  const len = monthsBetween(start, effEnd);
  const bad = mode === "custom" && (len < 1 || len > 18);
  const dateRow = (v: [number, number, number], set: (x: [number, number, number]) => void, label: string) => (
    <div className="flex flex-col gap-1.5">
      <span className="field-label">{label}</span>
      <div className="grid grid-cols-[72px_minmax(0,1fr)_86px] gap-2">
        <SimpleSelect label={`${label}: روز`} value={Math.min(v[2], monthLength(v[1]))} onChange={(d) => set([v[0], v[1], +d])} options={Array.from({ length: monthLength(v[1]) }, (_, i) => [i + 1, toFa(i + 1)])} />
        <SimpleSelect label={`${label}: ماه`} value={v[1]} onChange={(m) => set([v[0], +m, Math.min(v[2], monthLength(+m))])} options={MONTHS.map((m, i) => [i + 1, m])} />
        <SimpleSelect label={`${label}: سال`} value={v[0]} onChange={(y) => set([+y, v[1], v[2]])} options={[1404, 1405, 1406, 1407, 1408].map((y) => [y, toFa(y)])} />
      </div>
    </div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="top-[10vh] w-[min(520px,calc(100vw-32px))]">
        <DialogTitle className="border-b border-border px-6 py-4 text-[16px] font-extrabold">سال مالی جدید</DialogTitle>
        <div className="flex flex-col gap-4 px-6 py-5">
          <label className="flex flex-col gap-1.5"><span className="field-label">عنوان</span><Input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="نوع سال مالی">
            {([["standard", "۱۲ ماهه", "از ماه شروع، دوازده ماه"], ["custom", "سفارشی", "تاریخ شروع و پایان دلخواه"]] as const).map(([k, l, n]) => (
              <button key={k} role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={cn("rounded-field border p-3 text-start transition-colors", mode === k ? "border-primary bg-primary-soft/60" : "border-border hover:bg-muted/50")}>
                <b className={cn("block text-[13.5px]", mode === k && "text-primary")}>{l}</b><span className="text-[12px] text-muted-foreground">{n}</span>
              </button>
            ))}
          </div>
          {dateRow(start, setStart, "تاریخ شروع")}
          {mode === "custom" ? dateRow(end, setEnd, "تاریخ پایان") : <p className="num rounded-field bg-muted/60 px-3 py-2 text-[12.5px] text-muted-foreground">پایان: {fmtD(effEnd)}</p>}
          <p className={cn("num text-[12.5px]", bad ? "font-semibold text-danger" : "text-muted-foreground")}>{bad ? "طول سال مالی باید بین ۱ تا ۱۸ ماه باشد." : `طول سال مالی: ${toFa(len)} ماه · ${toFa(len)} دوره‌ی ماهانه ساخته می‌شود.`}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-3.5">
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button disabled={bad || !title.trim()} onClick={() => onSave({ id: `y${Date.now()}`, title: title.trim(), start, end: effEnd, state: "draft", custom: mode === "custom" })}>تعریف سال مالی</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
