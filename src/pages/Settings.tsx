import * as React from "react";
import { Bell, CalendarDays, FileCog, Palette, AlarmClock } from "lucide-react";
import { useApp, type Channel, type NotifKind } from "@/lib/store";
import { Segmented } from "@/components/shell/Topbar";
import { cn, group, toEn, toFa } from "@/lib/utils";
import { MONTHS } from "@/lib/jalali";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

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
const Select = ({ value, onChange, options, label }: { value: string | number; onChange: (v: string) => void; options: [string | number, string][]; label: string }) => (
  <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 min-w-[150px] rounded-field border border-input bg-surface px-3 text-[13.5px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15">
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);

const NOTIF: [NotifKind, string, string][] = [
  ["approve", "اسناد منتظر تأیید", "وقتی سندی بالاتر از سقف ثبت می‌شود"],
  ["due", "سررسیدها و یادآوری‌ها", "چک، قسط، مالیات و یادآوری‌های شما"],
  ["ai", "هشدارهای دستیار", "احتمال ثبت تکراری، مغایرت بانکی و ناهنجاری"],
  ["system", "رویدادهای سیستم", "ورود کاربر جدید، پشتیبان‌گیری و به‌روزرسانی"],
];
const CHANNELS: [Channel, string][] = [["app", "در برنامه"], ["email", "ایمیل"], ["sms", "پیامک"]];

type SectionId = "display" | "docs" | "calendars" | "reminders" | "notify";
const SECTIONS: [SectionId, string, typeof Bell][] = [["display", "ظاهر و نمایش", Palette], ["docs", "حساب‌ها و سند", FileCog], ["calendars", "تقویم‌ها و سال مالی", CalendarDays], ["reminders", "یادآوری‌ها", AlarmClock], ["notify", "اعلان‌ها", Bell]];

function useSections() {
  const { settings, setSettings, concept, setConcept, theme, setTheme, unit, setUnit, toast } = useApp();
  const levels = ["کل", "معین", "تفصیلی"];
  const range: [number, number][] = [[1, 2], [2, 4], [4, 9]];
  const cal = settings.calendars, rem = settings.reminders;
  const body: Record<SectionId, React.ReactNode> = {
    display: (
      <>
        <Row title="کانسپت"><Segmented label="کانسپت" value={concept} onChange={setConcept} items={[["assist", "دستیار"], ["bento", "پیشخوان"]]} /></Row>
        <Row title="حالت نمایش"><Segmented label="حالت نمایش" value={theme} onChange={setTheme} items={[["light", "روشن"], ["dark", "تیره"]]} /></Row>
        <Row title="واحد نمایش مبلغ" note="در داشبورد و گزارش‌ها"><Segmented label="واحد نمایش" value={unit} onChange={setUnit} items={[["rial", "ریال"], ["toman", "تومان"]]} /></Row>
        <Row title="جلوه‌های حرکتی" note="حرکت پس‌زمینه و انیمیشن‌ها"><Switch checked={settings.motion} onCheckedChange={(v) => { setSettings({ motion: v }); toast(v ? "جلوه‌های حرکتی فعال شد." : "جلوه‌های حرکتی غیرفعال شد."); }} aria-label="جلوه‌های حرکتی" /></Row>
      </>
    ),
    docs: (
      <>
        <Row title="طول کد حساب" note={`نمونه: ⁦${toFa(["1", "1".padStart(settings.codeLen[1], "0"), "1".padStart(settings.codeLen[2], "0")].join("-"))}⁩`}>
          <div className="flex gap-2">
            {levels.map((l, i) => (
              <label key={l} className="flex flex-col items-center gap-1 text-[12px] text-muted-foreground">
                {l}
                <Input type="number" min={range[i][0]} max={range[i][1]} value={settings.codeLen[i]} aria-label={`طول کد ${l}`}
                  onChange={(e) => { const v = Math.min(Math.max(+e.target.value || range[i][0], range[i][0]), range[i][1]); const c = [...settings.codeLen] as [number, number, number]; c[i] = v; setSettings({ codeLen: c }); }}
                  className="num h-10 w-16 text-center" />
              </label>
            ))}
          </div>
        </Row>
        <Row title="سقف تأیید مدیر مالی" note="سندهای بالاتر از این مبلغ پس از ثبت منتظر تأیید می‌مانند">
          <div className="flex items-center gap-2">
            <Input dir="ltr" inputMode="numeric" value={group(settings.approvalLimit)} aria-label="سقف تأیید به ریال" className="num h-10 w-44 text-left font-bold"
              onChange={(e) => setSettings({ approvalLimit: parseInt(toEn(e.target.value).replace(/[^\d]/g, "") || "0", 10) })} />
            <span className="text-[12.5px] text-muted-foreground">ریال</span>
          </div>
        </Row>
        <Row title="واحد ورود مبلغ در سند" note="ذخیره و چاپ همیشه به ریال است">
          <Segmented label="واحد ورود مبلغ" value={settings.inputUnit} onChange={(v) => setSettings({ inputUnit: v })} items={[["toman", "تومان"], ["rial", "ریال"]]} />
        </Row>
      </>
    ),
    calendars: (
      <>
        <Row title="تقویم هجری شمسی" note="تقویم اصلی سیستم؛ همه‌ی اسناد با این تاریخ ثبت می‌شوند"><Switch checked disabled aria-label="تقویم هجری شمسی" /></Row>
        <Row title="نمایش تاریخ میلادی" note="کنار روزهای تقویم مالی"><Switch checked={cal.gregorian} onCheckedChange={(v) => setSettings({ calendars: { ...cal, gregorian: v } })} aria-label="نمایش تاریخ میلادی" /></Row>
        <Row title="نمایش تاریخ قمری"><Switch checked={cal.hijri} onCheckedChange={(v) => setSettings({ calendars: { ...cal, hijri: v } })} aria-label="نمایش تاریخ قمری" /></Row>
        <Row title="تعطیلات رسمی" note="روزهای تعطیل در تقویم قرمز نمایش داده می‌شوند"><Switch checked={cal.holidays} onCheckedChange={(v) => setSettings({ calendars: { ...cal, holidays: v } })} aria-label="تعطیلات رسمی" /></Row>
        <Row title="شروع سال مالی" note="سال مالی ۱۴۰۵">
          <Select label="ماه شروع سال مالی" value={settings.fiscalStart} onChange={(v) => setSettings({ fiscalStart: +v })} options={MONTHS.map((m, i) => [i + 1, `۱ ${m}`])} />
        </Row>
        <Row title="دوره‌های مالی" note="مهر بسته است؛ آبان باز است">
          <div className="flex flex-wrap gap-1.5">{MONTHS.slice(6, 9).map((m, i) => <span key={m} className={cn("rounded-field px-2.5 py-1 text-[12px] font-bold", i === 0 ? "bg-muted text-muted-foreground" : i === 1 ? "bg-success-soft text-success" : "bg-muted/60 text-muted-foreground")}>{m}: {i === 0 ? "بسته" : i === 1 ? "باز" : "آینده"}</span>)}</div>
        </Row>
      </>
    ),
    reminders: (
      <>
        <Row title="زمان یادآوری پیش‌فرض" note="برای سررسیدها و یادآوری‌های جدید">
          <Select label="زمان یادآوری" value={rem.lead} onChange={(v) => setSettings({ reminders: { ...rem, lead: +v } })} options={[[0, "همان روز"], [1, "یک روز قبل"], [3, "سه روز قبل"], [7, "یک هفته قبل"]]} />
        </Row>
        <Row title="خلاصه‌ی روزانه" note="فهرست کارهای امروز، هر روز صبح">
          <Select label="ساعت خلاصه‌ی روزانه" value={rem.digest} onChange={(v) => setSettings({ reminders: { ...rem, digest: v } })} options={[["۰۷:۳۰", "ساعت ۷:۳۰"], ["۰۸:۰۰", "ساعت ۸:۰۰"], ["۰۹:۰۰", "ساعت ۹:۰۰"]]} />
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
        <nav className="panel h-fit p-2 md:sticky md:top-4" aria-label="بخش‌های تنظیمات">
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
