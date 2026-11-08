import { Bot, CalendarClock, FileText, Building2, ListTree, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import { accounts, companies, sourceLabel, statusLabel, users, type DocSource, type DocStatus } from "@/data/demo";
import { cn, toFa } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Columns, Donut } from "@/components/charts";

/** Default report: a general picture of the system — people, documents, sections and their activity. */
export function SystemOverview({ dense }: { dense?: boolean }) {
  const { docs, events, chats } = useApp();
  const n = (s: DocStatus) => docs.filter((d) => d.status === s).length;
  const bySource = (["ai", "file", "voice", "manual"] as DocSource[]).map((s, i) => ({ label: sourceLabel[s], value: docs.filter((d) => d.source === s).length, color: `--ch-${[1, 2, 4, 6][i]}` }));
  // activity per day in Aban: real seed docs plus a steady synthetic baseline of routine entries
  const base = [3, 4, 2, 5, 3, 0, 1, 4, 6, 3, 5, 4, 0, 2, 5, 6, 3];
  const days = Array.from({ length: 17 }, (_, i) => ({ label: toFa(i + 1), value: base[i] + docs.filter((d) => d.m === 8 && d.d === i + 1).length }));
  const stats: [typeof Users, string, string, string][] = [
    [Users, "کاربران فعال", `${toFa(users.filter((u) => u.active).length)} از ${toFa(users.length)}`, "۴ نقش"],
    [FileText, "اسناد آبان", toFa(days.reduce((a, d) => a + d.value, 0)), `${toFa(n("pending"))} منتظر تأیید`],
    [ListTree, "حساب‌های تفصیلی", toFa(accounts.length), "در ۸ گروه"],
    [Building2, "شرکت‌ها", toFa(companies.length), "۲ سال مالی باز"],
    [CalendarClock, "یادآوری‌های باز", toFa(events.filter((e) => !e.done).length), "۳ مورد این هفته"],
    [Bot, "گفت‌وگو با دستیار", toFa(chats.length + 41), "این ماه"],
  ];
  const modules: [string, string, "success" | "neutral" | "info"][] = [
    ["حسابداری عمومی", "فعال", "success"], ["تقویم مالی و یادآوری", "فعال", "success"], ["دستیار هوشمند", "فعال", "success"],
    ["گزارش‌ساز", "فعال", "success"], ["خزانه‌داری", "فاز بعد", "neutral"], ["حقوق و دستمزد", "فاز بعد", "neutral"],
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", !dense && "2xl:grid-cols-6")}>
        {stats.map(([I, l, v, sub]) => (
          <div key={l} className="panel flex flex-col gap-1 p-4">
            <span className="flex items-center gap-2 text-[12.5px] font-bold text-muted-foreground"><I className="size-4" />{l}</span>
            <b className="num text-[24px] font-extrabold leading-tight">{v}</b>
            <span className="num text-[11.5px] text-muted-foreground">{sub}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel p-5">
          <div className="mb-4 flex items-baseline justify-between"><h3 className="text-[15px] font-extrabold">اسناد ثبت‌شده در روزهای آبان</h3><span className="text-[12px] text-muted-foreground">تعداد سند</span></div>
          <Columns items={days} height={170} highlight={16} />
        </section>
        <section className="panel p-5">
          <h3 className="mb-4 text-[15px] font-extrabold">روش ثبت اسناد</h3>
          <Donut items={bySource} center={<span><b className="num block text-[20px] font-extrabold leading-none">{toFa(docs.length)}</b><span className="text-[11px] text-muted-foreground">سند</span></span>} />
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel-data overflow-hidden">
          <h3 className="border-b border-border px-5 py-3.5 text-[15px] font-extrabold">کاربران سیستم</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead><tr className="border-b border-border text-[12px] text-muted-foreground"><th className="px-5 py-2.5 text-start font-semibold">نام</th><th className="px-2 py-2.5 text-start font-semibold">نقش</th><th className="px-2 py-2.5 text-end font-semibold">سند آبان</th><th className="px-5 py-2.5 text-start font-semibold">آخرین فعالیت</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.name} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-2.5"><span className="flex items-center gap-2 font-bold"><i className={cn("size-2 rounded-full", u.active ? "bg-success" : "bg-muted-foreground/50")} aria-label={u.active ? "فعال" : "غیرفعال"} />{u.name}</span></td>
                    <td className="px-2 py-2.5 text-muted-foreground">{u.role}</td>
                    <td className="num px-2 py-2.5 text-end font-bold">{toFa(u.docs)}</td>
                    <td className="num px-5 py-2.5 text-muted-foreground">{u.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel p-5">
          <h3 className="mb-3 text-[15px] font-extrabold">بخش‌های سیستم</h3>
          <ul className="flex flex-col divide-y divide-border/70">
            {modules.map(([l, s, t]) => <li key={l} className="flex items-center justify-between py-2.5 text-[13px]"><span className="font-semibold">{l}</span><Badge tone={t}>{s}</Badge></li>)}
          </ul>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(["posted", "pending", "draft"] as DocStatus[]).map((s) => (
              <div key={s} className="rounded-field bg-muted/60 py-2">
                <b className={cn("num block text-[18px]", s === "posted" ? "text-success" : s === "pending" ? "text-warning" : "text-muted-foreground")}>{toFa(n(s))}</b>
                <span className="text-[11.5px] text-muted-foreground">{statusLabel[s]}</span>
              </div>
            ))}
          </div>
          <p className="num mt-3 text-[11.5px] text-muted-foreground">آخرین پشتیبان‌گیری: دیروز ساعت ۲۳:۰۰ · نسخه‌ی ۰٫۴</p>
        </section>
      </div>
    </div>
  );
}
