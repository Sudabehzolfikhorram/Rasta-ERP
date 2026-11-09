import { Building2, Calendar, DocumentText, Hierarchy, MagicStar, People, TickCircle, type IconType } from "@/components/icons";
import { useApp } from "@/lib/store";
import { accounts, companies, sourceLabel, statusLabel, users, type DocSource, type DocStatus } from "@/data/demo";
import { cn, toFa, shortToman } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Columns, Donut, Heatmap, MiniBars } from "@/components/charts";

type Stat = { icon: IconType; tint: string; label: string; value: string; sub: string; trend: number[] };

function useOverview() {
  const { docs, events, chats } = useApp();
  const n = (s: DocStatus) => docs.filter((d) => d.status === s).length;
  const bySource = (["ai", "file", "voice", "manual"] as DocSource[]).map((s, i) => ({ label: sourceLabel[s], value: docs.filter((d) => d.source === s).length, color: `--ch-${[1, 2, 4, 6][i]}` }));
  // activity per day in Aban: real seed docs plus a steady synthetic baseline of routine entries
  const base = [3, 4, 2, 5, 3, 0, 1, 4, 6, 3, 5, 4, 0, 2, 5, 6, 3];
  const days = Array.from({ length: 17 }, (_, i) => ({ label: toFa(i + 1), value: base[i] + docs.filter((d) => d.m === 8 && d.d === i + 1).length }));
  const monthDocs = days.reduce((a, d) => a + d.value, 0);
  const open = events.filter((e) => !e.done).length;
  const stats: Stat[] = [
    { icon: People, tint: "--ch-1", label: "کاربران فعال", value: `${toFa(users.filter((u) => u.active).length)} از ${toFa(users.length)}`, sub: "۴ نقش تعریف‌شده", trend: [3, 3, 4, 4, 4, 4] },
    { icon: DocumentText, tint: "--ch-2", label: "اسناد آبان", value: toFa(monthDocs), sub: `${toFa(n("pending"))} سند منتظر تأیید`, trend: [52, 61, 58, 66, 70, monthDocs] },
    { icon: Hierarchy, tint: "--ch-3", label: "حساب‌های تفصیلی", value: toFa(accounts.length), sub: "در ۸ گروه حساب", trend: [18, 20, 21, 23, 24, accounts.length] },
    { icon: Building2, tint: "--ch-4", label: "گردش مالی ۱۴۰۵ تا امروز", value: shortToman(13_800_000_000_000), sub: `${toFa(companies.length)} شرکت · همت = هزار میلیارد تومان`, trend: [0.6, 0.8, 0.9, 1.1, 1.25, 1.38] },
    { icon: Calendar, tint: "--ch-5", label: "یادآوری‌های باز", value: toFa(open), sub: "۳ مورد در این هفته", trend: [9, 12, 11, 14, 13, open] },
    { icon: MagicStar, tint: "--ch-6", label: "گفت‌وگو با دستیار", value: toFa(chats.length + 41), sub: "در این ماه", trend: [12, 19, 24, 30, 36, chats.length + 41] },
  ];
  const modules: [string, string, "success" | "neutral"][] = [
    ["حسابداری عمومی", "فعال", "success"], ["تقویم مالی و یادآوری", "فعال", "success"], ["دستیار هوشمند", "فعال", "success"],
    ["گزارش‌ساز", "فعال", "success"], ["خزانه‌داری", "فاز بعد", "neutral"], ["حقوق و دستمزد", "فاز بعد", "neutral"],
  ];
  return { docs, n, bySource, days, stats, modules };
}

/** Assist: colourful stat cards with a large Bulk icon watermark in the corner, then charts and tables. */
function StatTile({ s }: { s: Stat }) {
  const I = s.icon;
  return (
    <div className="panel relative overflow-hidden p-4" style={{ backgroundImage: `linear-gradient(160deg, hsl(var(${s.tint}) / .13), transparent 62%)` }}>
      <I aria-hidden variant="Bulk" className="pointer-events-none absolute -bottom-5 -end-4 size-[104px] opacity-[0.07]" style={{ color: `hsl(var(${s.tint}))` }} />
      <span className="grid size-9 place-items-center rounded-[10px] text-white shadow-soft" style={{ background: `hsl(var(${s.tint}))` }}><I className="size-5" variant="Bold" /></span>
      <span className="mt-3 block text-[12.5px] font-bold text-muted-foreground">{s.label}</span>
      <b className="num mt-0.5 block text-[26px] font-extrabold leading-tight">{s.value}</b>
      <span className="num block text-[11.5px] text-muted-foreground">{s.sub}</span>
    </div>
  );
}

export function SystemOverview({ dense }: { dense?: boolean }) {
  const { docs, n, bySource, days, stats, modules } = useOverview();
  return (
    <div className="flex flex-col gap-4">
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", !dense && "2xl:grid-cols-6")}>{stats.map((s) => <StatTile key={s.label} s={s} />)}</div>
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
        <section className="panel p-5">
          <h3 className="mb-3 text-[15px] font-extrabold">کاربران سیستم</h3>
          <UsersTable />
        </section>
        <section className="panel p-5">
          <h3 className="mb-3 text-[15px] font-extrabold">بخش‌های سیستم</h3>
          <ul className="flex flex-col divide-y divide-border/70">
            {modules.map(([l, s, t]) => <li key={l} className="flex items-center justify-between py-2.5 text-[13px]"><span className="font-semibold">{l}</span><Badge tone={t}>{s}</Badge></li>)}
          </ul>
          <StatusCounts n={n} />
          <p className="num mt-3 text-[11.5px] text-muted-foreground">آخرین پشتیبان‌گیری: دیروز ساعت ۲۳:۰۰ · نسخه‌ی ۰٫۵</p>
        </section>
      </div>
    </div>
  );
}

function UsersTable() {
  const max = Math.max(...users.map((u) => u.docs));
  return (
    <DataTable caption="کاربران سیستم" rowKey={(u) => u.name} rows={users} dense
      columns={[
        { key: "name", label: "نام", render: (u) => <span className="flex items-center gap-2.5"><span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[12px] font-bold">{u.name[0]}<i className={cn("absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-surface", u.active ? "bg-success" : "bg-muted-foreground/50")} aria-label={u.active ? "فعال" : "غیرفعال"} /></span><b className="whitespace-nowrap">{u.name}</b></span> },
        { key: "role", label: "نقش", hide: "sm", render: (u) => <span className="whitespace-nowrap text-muted-foreground">{u.role}</span> },
        { key: "docs", label: "سند آبان", render: (u) => <span className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(u.docs / max) * 100}%` }} /></span><b>{toFa(u.docs)}</b></span> },
        { key: "last", label: "آخرین فعالیت", hide: "md", render: (u) => <span className="whitespace-nowrap text-muted-foreground">{u.last}</span> },
      ]} />
  );
}

function StatusCounts({ n }: { n: (s: DocStatus) => number }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      {(["posted", "pending", "draft"] as DocStatus[]).map((s) => (
        <div key={s} className="rounded-field bg-muted/60 py-2">
          <b className={cn("num block text-[18px]", s === "posted" ? "text-success" : s === "pending" ? "text-warning" : "text-muted-foreground")}>{toFa(n(s))}</b>
          <span className="text-[11.5px] text-muted-foreground">{statusLabel[s]}</span>
        </div>
      ))}
    </div>
  );
}

/** Bento: one scorecard strip with trend bars, an activity heatmap per user and a stacked entry-method bar. */
export function SystemScorecard() {
  const { docs, n, bySource, stats, modules } = useOverview();
  const total = bySource.reduce((a, x) => a + x.value, 0) || 1;
  const heat = users.slice(0, 4).map((u, i) => [3, 5, 4, 6, 2, 0].map((v, j) => Math.max(0, Math.round(v * (u.docs / 18) + ((i + j) % 3) - 1))));
  return (
    <div className="flex flex-col gap-4">
      <section className="panel grid grid-cols-2 overflow-hidden sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("flex flex-col gap-1 border-border/70 p-4", i > 0 && "xl:border-s", "border-b xl:border-b-0")}>
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground"><s.icon className="size-4" variant="Bulk" style={{ color: `hsl(var(${s.tint}))` }} />{s.label}</span>
            <b className="num text-[22px] font-extrabold leading-tight">{s.value}</b>
            <MiniBars data={s.trend} color={s.tint} className="h-7" />
            <span className="num text-[11px] text-muted-foreground">{s.sub}</span>
          </div>
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-12">
        <section className="panel p-5 xl:col-span-7">
          <div className="mb-4 flex items-baseline justify-between"><h3 className="text-[15px] font-extrabold">فعالیت کاربران در روزهای هفته</h3><span className="text-[12px] text-muted-foreground">تعداد سند</span></div>
          <Heatmap rows={users.slice(0, 4).map((u) => u.name.split(" ")[0])} cols={["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"]} values={heat} />
        </section>
        <section className="panel flex flex-col p-5 xl:col-span-5">
          <h3 className="mb-4 text-[15px] font-extrabold">روش ثبت {toFa(docs.length)} سند</h3>
          <div className="flex h-4 overflow-hidden rounded-full">{bySource.map((x) => <span key={x.label} style={{ width: `${(x.value / total) * 100}%`, background: `hsl(var(${x.color}))` }} />)}</div>
          <ul className="num mt-4 grid grid-cols-2 gap-3 text-[12.5px]">
            {bySource.map((x) => <li key={x.label} className="rounded-field border border-border/70 px-3 py-2"><span className="flex items-center gap-1.5 text-muted-foreground"><i className="size-2.5 rounded-[3px]" style={{ background: `hsl(var(${x.color}))` }} />{x.label}</span><b className="text-[17px]">{toFa(x.value)}</b> <span className="text-muted-foreground">سند · {toFa(Math.round((x.value / total) * 100))}٪</span></li>)}
          </ul>
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <section className="panel p-5 xl:col-span-8"><h3 className="mb-3 text-[15px] font-extrabold">کاربران سیستم</h3><UsersTable /></section>
        <section className="panel p-5 xl:col-span-4">
          <h3 className="mb-3 text-[15px] font-extrabold">بخش‌های سیستم</h3>
          <div className="grid grid-cols-2 gap-2">
            {modules.map(([l, s, t]) => (
              <div key={l} className={cn("rounded-field border px-3 py-2.5", t === "success" ? "border-success/25 bg-success-soft/40" : "border-border bg-muted/40")}>
                <span className="flex items-center gap-1.5 text-[12.5px] font-bold">{t === "success" && <TickCircle className="size-4 shrink-0 text-success" variant="Bold" />}{l}</span>
                <span className="text-[11.5px] text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
          <StatusCounts n={n} />
        </section>
      </div>
    </div>
  );
}
