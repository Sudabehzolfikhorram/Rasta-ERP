import type * as React from "react";
import { useApp } from "@/lib/store";
import { Segmented } from "@/components/shell/Topbar";
import { group, toEn, toFa } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

function Row({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
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

export function Settings() {
  const { settings, setSettings, concept, setConcept, theme, setTheme, unit, setUnit, toast } = useApp();
  const levels = ["کل", "معین", "تفصیلی"];
  const range: [number, number][] = [[1, 2], [2, 4], [4, 9]];
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <section className="panel px-5 py-2">
        <h2 className="pb-1 pt-3 text-[15px] font-extrabold">حساب‌ها و سند</h2>
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
        <Row title="ورود مبلغ در سند" note="ذخیره و چاپ همیشه به ریال است">
          <Segmented label="واحد ورود مبلغ" value={settings.inputUnit} onChange={(v) => setSettings({ inputUnit: v })} items={[["toman", "تومان"], ["rial", "ریال"]]} />
        </Row>
        <Row title="نمایش مبلغ در گزارش‌ها">
          <Segmented label="واحد نمایش" value={unit} onChange={setUnit} items={[["rial", "ریال"], ["toman", "تومان"]]} />
        </Row>
      </section>
      <section className="panel px-5 py-2">
        <h2 className="pb-1 pt-3 text-[15px] font-extrabold">ظاهر</h2>
        <Row title="کانسپت">
          <Segmented label="کانسپت" value={concept} onChange={setConcept} items={[["assist", "دستیار"], ["bento", "پیشخوان"]]} />
        </Row>
        <Row title="حالت">
          <Segmented label="حالت" value={theme} onChange={setTheme} items={[["light", "روشن"], ["dark", "تیره"]]} />
        </Row>
        <Row title="حرکت‌ها" note="حرکت پس‌زمینه و جلوه‌ها">
          <Switch checked={settings.motion} onCheckedChange={(v) => { setSettings({ motion: v }); toast(v ? "حرکت‌ها روشن شد." : "حرکت‌ها خاموش شد."); }} aria-label="حرکت‌ها" />
        </Row>
      </section>
    </div>
  );
}
