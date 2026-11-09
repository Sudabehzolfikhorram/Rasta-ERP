import { Building2, Calendar, DocumentText, Hierarchy, MagicStar, People, type IconType } from "@/components/icons";
import { useApp } from "@/lib/store";
import { accounts, companies, sourceLabel, statusLabel, users, type DocSource, type DocStatus } from "@/data/demo";
import { cn, toFa, shortToman } from "@/lib/utils";
import { TODAY, diffDays, weekday } from "@/lib/jalali";
import { DataTable } from "@/components/ui/data-table";
import { Columns, Donut, Heatmap, MiniBars } from "@/components/charts";

type Stat = { icon: IconType; tint: string; label: string; value: string; sub: string; trend?: number[] };

/** Every number on this page is counted from the documents, accounts, users and reminders in the system. Nothing is estimated. */
function useOverview() {
  const { docs, events, chats } = useApp();
  const n = (s: DocStatus) => docs.filter((d) => d.status === s).length;
  const bySource = (["ai", "file", "voice", "manual"] as DocSource[]).map((s, i) => ({ label: sourceLabel[s], value: docs.filter((d) => d.source === s).length, color: `--ch-${[1, 2, 4, 6][i]}` }));
  const aban = docs.filter((d) => d.m === 8);
  const days = Array.from({ length: TODAY.d }, (_, i) => ({ label: toFa(i + 1), value: aban.filter((d) => d.d === i + 1).length }));
  const weeks = [0, 1, 2].map((w) => aban.filter((d) => d.d > w * 7 && d.d <= Math.min((w + 1) * 7, TODAY.d)));
  const posted = (m: number) => docs.filter((d) => d.m === m && d.status === "posted").reduce((a, d) => a + d.lines.reduce((x, l) => x + l.debit, 0), 0);
  const roles = new Set(users.map((u) => u.role)).size;
  const groups = new Set(accounts.map((a) => a.group)).size;
  const open = events.filter((e) => !e.done);
  const thisWeek = open.filter((e) => { const k = diffDays(e.m, e.d); return k >= 0 && k < 7; }).length;
  const ai = docs.filter((d) => d.source === "ai");
  const stats: Stat[] = [
    { icon: People, tint: "--ch-1", label: "کاربران فعال", value: `${toFa(users.filter((u) => u.active).length)} از ${toFa(users.length)}`, sub: `${toFa(roles)} نقش تعریف‌شده` },
    { icon: DocumentText, tint: "--ch-2", label: "اسناد آبان تا امروز", value: toFa(aban.filter((d) => d.d <= TODAY.d).length), sub: `${toFa(n("pending"))} سند منتظر تأیید`, trend: weeks.map((w) => w.length) },
    { icon: Hierarchy, tint: "--ch-3", label: "حساب‌های تفصیلی", value: toFa(accounts.length), sub: `در ${toFa(groups)} گروه حساب` },
    { icon: Building2, tint: "--ch-4", label: "گردش اسناد تأییدشده", value: shortToman(posted(7) + posted(8)), sub: `مهر و آبان، ${toFa(companies.length)} شرکت`, trend: [posted(7), posted(8)] },
    { icon: Calendar, tint: "--ch-5", label: "یادآوری‌های باز", value: toFa(open.length), sub: `${toFa(thisWeek)} مورد در هفت روز آینده` },
    { icon: MagicStar, tint: "--ch-6", label: "اسناد ثبت‌شده با دستیار", value: toFa(ai.length), sub: chats.length ? `${toFa(chats.length)} گفت‌وگو در این ماه` : "از پیام، فایل یا گفت‌وگو" , trend: weeks.map((w) => w.filter((d) => d.source === "ai").length) },
  ];
  // documents per recorder, counted from the documents themselves
  const people = [...new Set(docs.map((d) => d.by))];
  const docsBy = (name: string) => aban.filter((d) => d.by === name).length;
  const heat = people.map((p) => [0, 1, 2, 3, 4, 5].map((w) => docs.filter((d) => d.by === p && weekday(d.m, d.d) === w).length));
  return { docs, n, bySource, days, stats, people, docsBy, heat };
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
  const { docs, n, bySource, days, stats, docsBy } = useOverview();
  return (
    <div className="flex flex-col gap-4">
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", !dense && "2xl:grid-cols-6")}>{stats.map((s) => <StatTile key={s.label} s={s} />)}</div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel p-5">
          <div className="mb-4 flex items-baseline justify-between"><h3 className="text-[15px] font-extrabold">اسناد ثبت‌شده در روزهای آبان</h3><span className="text-[12px] text-muted-foreground">تعداد سند</span></div>
          <Columns items={days} height={170} highlight={TODAY.d - 1} />
        </section>
        <section className="panel p-5">
          <h3 className="mb-4 text-[15px] font-extrabold">روش ثبت اسناد</h3>
          <Donut items={bySource} center={<span><b className="num block text-[20px] font-extrabold leading-none">{toFa(docs.length)}</b><span className="text-[11px] text-muted-foreground">سند</span></span>} />
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel p-5">
          <h3 className="mb-3 text-[15px] font-extrabold">کاربران سیستم</h3>
          <UsersTable docsBy={docsBy} />
        </section>
        <section className="panel p-5">
          <h3 className="mb-3 text-[15px] font-extrabold">وضعیت اسناد</h3>
          <StatusCounts n={n} />
        </section>
      </div>
    </div>
  );
}

function UsersTable({ docsBy }: { docsBy: (name: string) => number }) {
  const max = Math.max(...users.map((u) => docsBy(u.name)), 1);
  return (
    <DataTable caption="کاربران سیستم" rowKey={(u) => u.name} rows={users} dense
      columns={[
        { key: "name", label: "نام", render: (u) => <span className="flex items-center gap-2.5"><span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[12px] font-bold">{u.name[0]}<i className={cn("absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-surface", u.active ? "bg-success" : "bg-muted-foreground/50")} aria-label={u.active ? "فعال" : "غیرفعال"} /></span><b className="whitespace-nowrap">{u.name}</b></span> },
        { key: "role", label: "نقش", hide: "sm", render: (u) => <span className="whitespace-nowrap text-muted-foreground">{u.role}</span> },
        { key: "docs", label: "سند آبان", render: (u) => <span className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(docsBy(u.name) / max) * 100}%` }} /></span><b>{toFa(docsBy(u.name))}</b></span> },
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
  const { docs, n, bySource, stats, people, docsBy, heat } = useOverview();
  const total = bySource.reduce((a, x) => a + x.value, 0) || 1;
  return (
    <div className="flex flex-col gap-4">
      <section className="panel grid grid-cols-2 overflow-hidden sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("flex flex-col gap-1 border-border/70 p-4", i > 0 && "xl:border-s", "border-b xl:border-b-0")}>
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground"><s.icon className="size-4" variant="Bulk" style={{ color: `hsl(var(${s.tint}))` }} />{s.label}</span>
            <b className="num text-[22px] font-extrabold leading-tight">{s.value}</b>
            {s.trend ? <MiniBars data={s.trend} color={s.tint} className="h-7" /> : <span className="h-7" aria-hidden />}
            <span className="num text-[11px] text-muted-foreground">{s.sub}</span>
          </div>
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-12">
        <section className="panel p-5 xl:col-span-7">
          <div className="mb-4 flex items-baseline justify-between"><h3 className="text-[15px] font-extrabold">اسناد هر ثبت‌کننده در روزهای هفته</h3><span className="text-[12px] text-muted-foreground">تعداد سند</span></div>
          <Heatmap rows={people.map((p) => p.split(" ")[0])} cols={["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"]} values={heat} />
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
        <section className="panel p-5 xl:col-span-8"><h3 className="mb-3 text-[15px] font-extrabold">کاربران سیستم</h3><UsersTable docsBy={docsBy} /></section>
        <section className="panel p-5 xl:col-span-4">
          <h3 className="mb-1 text-[15px] font-extrabold">وضعیت اسناد</h3>
          <StatusCounts n={n} />
        </section>
      </div>
    </div>
  );
}
