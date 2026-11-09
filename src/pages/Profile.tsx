import * as React from "react";
import { Building2, Check, KeyRound, Lock, Mail, MagicStar, Phone, Plus, ShieldCheck, UserRound, Users } from "@/components/icons";
import { useApp } from "@/lib/store";
import { companies as seed, users as seedUsers, type Company } from "@/data/demo";
import { cn, toFa } from "@/lib/utils";
import { CompanyAvatar } from "@/components/brand/CompanyMark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SimpleSelect } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/* Access is set per role and per area: none, view, record, approve. Each level includes the ones before it. */
const ROLES = ["مدیر مالی", "حسابدار", "خزانه‌دار", "حسابرس داخلی"] as const;
type Role = (typeof ROLES)[number];
const AREAS: [string, string][] = [["docs", "اسناد حسابداری"], ["treasury", "دریافت و پرداخت"], ["reports", "گزارش‌ها"], ["base", "اطلاعات پایه و کدینگ"], ["settings", "تنظیمات و سال مالی"]];
const LEVELS = ["بدون دسترسی", "مشاهده", "ثبت", "تأیید"] as const;
const LEVEL_TONE = ["text-muted-foreground", "text-info", "text-primary", "text-success"];
const seedPerms: Record<Role, number[]> = {
  "مدیر مالی": [3, 3, 3, 3, 3],
  حسابدار: [2, 1, 1, 1, 0],
  "خزانه‌دار": [1, 3, 1, 1, 0],
  "حسابرس داخلی": [1, 1, 1, 1, 1],
};
type User = { name: string; role: string; docs: number; last: string; active: boolean; twofa: boolean };

function Field({ label, value, ltr, wide }: { label: string; value: string; ltr?: boolean; wide?: boolean }) {
  return (
    <label className={cn("flex flex-col gap-1.5", wide && "sm:col-span-2")}>
      <span className="field-label">{label}</span>
      <Input defaultValue={value} dir={ltr ? "ltr" : undefined} className={cn("num", ltr && "text-left")} />
    </label>
  );
}

type Section = "me" | "companies" | "company" | "users" | "access" | "security";
const SECTIONS: [Section, string, typeof Users][] = [["me", "پروفایل من", UserRound], ["companies", "شرکت‌های من", Building2], ["company", "اطلاعات شرکت", Building2], ["users", "کاربران", Users], ["access", "سطح دسترسی‌ها", ShieldCheck], ["security", "امنیت ورود", Lock]];

export function Profile() {
  const { company, setCompany, toast, concept, go } = useApp();
  const bento = concept === "bento";
  const [list, setList] = React.useState<Company[]>(seed);
  const [users, setUsers] = React.useState<User[]>(() => seedUsers.map((u, i) => ({ ...u, twofa: i < 2 })));
  const [perms, setPerms] = React.useState(seedPerms);
  const [role, setRole] = React.useState<Role>("حسابدار");
  const [section, setSection] = React.useState<Section>("me");
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const active = list.find((c) => c.id === company) ?? list[0];
  const setLevel = (r: Role, i: number, v: number) => { setPerms((p) => ({ ...p, [r]: p[r].map((x, j) => (j === i ? v : x)) })); toast(`دسترسی «${r}» به ${AREAS[i][1]}: ${LEVELS[v]}`); };
  const no2fa = users.filter((u) => u.active && !u.twofa);
  const inactive = users.filter((u) => !u.active);

  const me = (
    <section className="panel flex flex-wrap items-center gap-4 p-5">
      <span className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-primary-soft text-[24px] font-extrabold text-primary">س</span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[19px] font-extrabold">سودابه زلفی خرم</h2>
        <p className="text-[13px] text-muted-foreground">مدیر مالی · {active.name}</p>
        <div className="num mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><Mail className="size-3.5" /><span dir="ltr">s.zolfikhorram@algonet.ir</span></span>
          <span className="flex items-center gap-1.5"><Phone className="size-3.5" />۰۹۱۲ ۳۴۵ ۶۷۸۹</span>
          <span className="flex items-center gap-1.5 text-success"><ShieldCheck className="size-3.5" />ورود دومرحله‌ای فعال</span>
        </div>
      </div>
      <Button variant="outline" onClick={() => toast("در نسخه‌ی نمونه تغییر رمز غیرفعال است.")}><KeyRound /> تغییر رمز</Button>
    </section>
  );

  const companyRow = (c: Company) => {
    const on = c.id === active.id;
    return (
      <li key={c.id} className={cn("flex min-w-0 items-center gap-3 rounded-field border p-3.5 transition-colors", on ? "border-primary/50 bg-primary-soft/60" : "border-border bg-surface/60")}>
        <CompanyAvatar name={c.name} className="size-10 rounded-field text-white" letterClass="text-[15px] font-extrabold" style={{ background: `hsl(${c.color})` }} />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[14px]">{c.name}</b>
          <span className="num block truncate text-[12px] text-muted-foreground">سال مالی {c.year} · {c.role} · {toFa(c.docs)} سند</span>
        </div>
        {on ? <Badge tone="success"><Check className="size-3" /> فعال</Badge>
          : <Button size="sm" variant="outline" onClick={() => { setCompany(c.id); toast(`وارد «${c.name}» شدید.`); }}>ورود</Button>}
      </li>
    );
  };
  const companies = (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold"><Building2 className="size-4 text-muted-foreground" /> شرکت‌های من</h2>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus /> افزودن شرکت</Button>
      </div>
      <ul className={cn("grid gap-3", bento && "lg:grid-cols-3")}>{list.map(companyRow)}</ul>
    </section>
  );

  const companyForm = (
    <section className="panel p-5">
      <h2 className="mb-1 text-[15px] font-extrabold">اطلاعات شرکت فعال</h2>
      <p className="mb-4 text-[12.5px] text-muted-foreground">این اطلاعات در سربرگ اسناد، گزارش‌ها و اظهارنامه‌ها چاپ می‌شود.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام شرکت" value={active.name} />
        <Field label="شناسه‌ی ملی" value={active.nid} />
        <Field label="کد اقتصادی" value="۴۱۱۱۴۷۸۹۶۵۲۳" />
        <Field label="شماره‌ی ثبت" value="۴۸۲۲۱۷" />
        <Field label="تلفن" value="۰۲۱ ۸۸۷۷ ۶۶۵۵" />
        <Field label="کد پستی" value="۱۵۱۱۸۴۳۹۱۱" />
        <Field label="نشانی" value="تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۲۱۴" wide />
        <div className="flex flex-col gap-1.5"><span className="field-label">واحد پول پایه</span><span className="flex h-10 items-center gap-2 rounded-field bg-muted/60 px-3.5 text-[13.5px] text-muted-foreground"><Lock className="size-3.5" /> ریال</span></div>
        <div className="flex flex-col gap-1.5"><span className="field-label">سال مالی جاری</span><button onClick={() => go("settings")} className="num flex h-10 items-center rounded-field bg-muted/60 px-3.5 text-start text-[13.5px] text-muted-foreground hover:text-primary">۱ فروردین تا ۲۹ اسفند {active.year} · تنظیمات</button></div>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={() => toast("اطلاعات شرکت ذخیره شد.", "success")}>ذخیره‌ی تغییرات</Button></div>
    </section>
  );

  const userRow = (u: User, i: number) => (
    <li key={u.name} className="flex flex-wrap items-center gap-3 py-3">
      <span className={cn("grid size-9 place-items-center rounded-full text-[13px] font-bold", u.active ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")}>{u.name[0]}</span>
      <span className="min-w-[120px] flex-1"><b className="block text-[13.5px]">{u.name}</b><span className="num text-[12px] text-muted-foreground">آخرین ورود {u.last} · {toFa(u.docs)} سند این ماه</span></span>
      <SimpleSelect label={`نقش ${u.name}`} className="h-9 w-[150px]" value={u.role} onChange={(v) => { setUsers((x) => x.map((y, j) => (j === i ? { ...y, role: v } : y))); toast(`نقش ${u.name}: ${v}`); }} options={ROLES.map((r) => [r, r])} />
      <label className="flex items-center gap-2 text-[12.5px]"><Switch checked={u.active} onCheckedChange={(v) => setUsers((x) => x.map((y, j) => (j === i ? { ...y, active: v } : y)))} aria-label={`فعال بودن ${u.name}`} />{u.active ? "فعال" : "غیرفعال"}</label>
    </li>
  );
  const usersCard = (
    <section className="panel p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold"><Users className="size-4 text-muted-foreground" /> کاربران</h2>
        <Button size="sm" variant="outline" onClick={() => toast("دعوت‌نامه برای کاربر جدید آماده شد.")}><Plus /> دعوت کاربر</Button>
      </div>
      <ul className="flex flex-col divide-y divide-border/70">{users.map(userRow)}</ul>
    </section>
  );

  const security = (
    <section className="panel flex flex-col gap-1 p-5">
      <h2 className="mb-2 text-[15px] font-extrabold">امنیت ورود</h2>
      {users.map((u, i) => (
        <label key={u.name} className="flex items-center gap-3 border-b border-border/60 py-2.5 text-[13px] last:border-0">
          <span className="min-w-0 flex-1"><b>{u.name}</b> <span className="text-muted-foreground">· {u.role}</span></span>
          <span className={cn("text-[12px] font-semibold", u.twofa ? "text-success" : "text-warning")}>{u.twofa ? "دومرحله‌ای" : "فقط رمز"}</span>
          <Switch checked={u.twofa} onCheckedChange={(v) => setUsers((x) => x.map((y, j) => (j === i ? { ...y, twofa: v } : y)))} aria-label={`ورود دومرحله‌ای ${u.name}`} />
        </label>
      ))}
    </section>
  );

  /* ---------- «دستیار»: one role at a time, each area a four-step control ---------- */
  const accessByRole = (
    <section className="panel p-5">
      <h2 className="text-[15px] font-extrabold">سطح دسترسی‌ها</h2>
      <p className="mb-3 text-[12.5px] text-muted-foreground">نقش را انتخاب کنید و برای هر بخش سطح دسترسی را بگذارید. هر سطح، سطح‌های قبلی را هم دارد.</p>
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="نقش">
        {ROLES.map((r) => <button key={r} role="tab" aria-selected={role === r} aria-pressed={role === r} onClick={() => setRole(r)} className="chip h-9 text-[13px]">{r} <span className="num opacity-70">{toFa(users.filter((u) => u.role === r).length)}</span></button>)}
      </div>
      <ul className="flex flex-col gap-2">
        {AREAS.map(([k, l], i) => (
          <li key={k} className="flex flex-wrap items-center gap-3 rounded-field border border-border bg-surface/60 p-3">
            <b className="min-w-[150px] flex-1 text-[13.5px]">{l}</b>
            <div className="flex rounded-[calc(var(--r-field)+4px)] bg-muted/80 p-1" role="radiogroup" aria-label={`دسترسی ${role} به ${l}`}>
              {LEVELS.map((lv, v) => (
                <button key={lv} role="radio" aria-checked={perms[role][i] === v} disabled={role === "مدیر مالی"} onClick={() => setLevel(role, i, v)}
                  className={cn("h-8 rounded-field px-3 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed", perms[role][i] === v && "seg-on bg-surface text-foreground shadow-soft")}>{lv}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {role === "مدیر مالی" && <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground"><Lock className="size-3.5" /> مدیر مالی همه‌ی دسترسی‌ها را دارد و تغییر نمی‌کند.</p>}
    </section>
  );

  /* ---------- «پیشخوان»: the whole matrix at once; a cell steps through the levels ---------- */
  const accessMatrix = (
    <section className="panel-data overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-extrabold">ماتریس دسترسی</h2>
        <span className="text-[12px] text-muted-foreground">روی هر خانه بزنید تا سطح بعدی را بگیرد.</span>
        <span className="ms-auto flex flex-wrap gap-3 text-[11.5px]">{LEVELS.map((l, v) => <span key={l} className={cn("flex items-center gap-1", LEVEL_TONE[v])}><i className="size-2 rounded-full bg-current" />{l}</span>)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-[13px]">
          <thead><tr className="bg-muted/60 text-[12px] text-muted-foreground"><th className="px-5 py-2.5 text-start font-semibold">بخش</th>{ROLES.map((r) => <th key={r} className="px-2 py-2.5 text-center font-semibold">{r}<span className="num block text-[11px] font-normal">{toFa(users.filter((u) => u.role === r).length)} نفر</span></th>)}</tr></thead>
          <tbody>
            {AREAS.map(([k, l], i) => (
              <tr key={k} className="border-t border-border/70">
                <td className="px-5 py-2.5 font-bold">{l}</td>
                {ROLES.map((r) => {
                  const v = perms[r][i], locked = r === "مدیر مالی";
                  return (
                    <td key={r} className="px-2 py-2 text-center">
                      <button disabled={locked} onClick={() => setLevel(r, i, (v + 1) % 4)} aria-label={`${r}، ${l}: ${LEVELS[v]}`}
                        className={cn("inline-flex h-8 min-w-[104px] items-center justify-center gap-1.5 rounded-field border border-border px-2 text-[12px] font-bold transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-80", LEVEL_TONE[v], v === 0 && "border-dashed")}>
                        {locked ? <Lock className="size-3" /> : <i className="size-1.5 rounded-full bg-current" />}{LEVELS[v]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const addDialog = (
    <Dialog open={adding} onOpenChange={setAdding}>
      <DialogContent aria-describedby={undefined} className="w-[min(440px,calc(100vw-32px))] p-5">
        <DialogTitle className="text-[16px] font-extrabold">افزودن شرکت</DialogTitle>
        <label className="mt-4 flex flex-col gap-1.5"><span className="field-label">نام شرکت</span><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="مثلاً: تولیدی البرز صنعت" /></label>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAdding(false)}>انصراف</Button>
          <Button disabled={!name.trim()} onClick={() => { setList((x) => [...x, { id: `c${Date.now()}`, name: name.trim(), nid: "—", year: "۱۴۰۵", role: "مدیر مالی", docs: 0, color: "var(--ch-4)" }]); setName(""); setAdding(false); toast("شرکت جدید اضافه شد.", "success"); }}>افزودن</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (bento) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {me}
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="کاربران فعال" value={toFa(users.filter((u) => u.active).length)} unit={`از ${toFa(users.length)}`} icon={Users} tone="blue" progress={users.filter((u) => u.active).length / users.length} />
            <StatCard label="ورود دومرحله‌ای" value={toFa(users.filter((u) => u.twofa).length)} unit="نفر" icon={ShieldCheck} tone="teal" sub={no2fa.length ? `${toFa(no2fa.length)} نفر ندارند` : "همه دارند"} />
            <StatCard label="شرکت‌ها" value={toFa(list.length)} icon={Building2} tone="violet" sub={active.name} />
          </div>
        </div>
        {companies}
        {accessMatrix}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">{usersCard}{companyForm}</div>
        {security}
        {addDialog}
      </div>
    );
  }

  const body: Record<Section, React.ReactNode> = { me: <>{me}{companies}</>, companies, company: companyForm, users: usersCard, access: accessByRole, security };
  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav className="panel flex h-fit flex-col gap-1 p-2.5 lg:sticky lg:top-4" aria-label="بخش‌های حساب کاربری">
        <div className="flex items-center gap-3 px-2 pb-3 pt-1">
          <span className="grid size-10 place-items-center rounded-[12px] bg-primary-soft font-extrabold text-primary">س</span>
          <span className="min-w-0"><b className="block text-[13.5px]">سودابه زلفی خرم</b><span className="block truncate text-[11.5px] text-muted-foreground">{active.name}</span></span>
        </div>
        {SECTIONS.map(([k, l, I]) => (
          <button key={k} onClick={() => setSection(k)} aria-current={section === k ? "page" : undefined}
            className={cn("flex h-10 items-center gap-2.5 rounded-field px-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground", section === k && "bg-primary-soft font-bold text-primary hover:bg-primary-soft hover:text-primary")}>
            <I className="size-[18px]" variant={section === k ? "Bulk" : "Linear"} />{l}
            {k === "security" && no2fa.length > 0 && <span className="num ms-auto grid size-5 place-items-center rounded-full bg-warning-soft text-[10.5px] font-bold text-warning">{toFa(no2fa.length)}</span>}
          </button>
        ))}
      </nav>
      <div className="flex min-w-0 flex-col gap-4">
        {(no2fa.length > 0 || inactive.length > 0) && (
          <section className="hero flex flex-wrap items-center gap-3 p-4">
            <span className="grid size-9 place-items-center rounded-full bg-ai-soft text-ai-ink"><MagicStar className="size-5" variant="Bulk" /></span>
            <p className="num min-w-[200px] flex-1 text-[13px]">
              {no2fa.length > 0 && <><b>{no2fa.map((u) => u.name).join(" و ")}</b> هنوز ورود دومرحله‌ای ندارند. </>}
              {inactive.length > 0 && <>{toFa(inactive.length)} کاربر غیرفعال است.</>}
            </p>
            {no2fa.length > 0 && <Button size="sm" variant="ai" onClick={() => { setUsers((x) => x.map((u) => (u.active ? { ...u, twofa: true } : u))); toast("ورود دومرحله‌ای برای همه‌ی کاربران فعال روشن شد.", "success"); }}>روشن کردن برای همه</Button>}
            <Button size="sm" variant="ghost" onClick={() => setSection("security")}>بررسی</Button>
          </section>
        )}
        <div key={section} className="flex flex-col gap-4 animate-rise">{body[section]}</div>
      </div>
      {addDialog}
    </div>
  );
}
