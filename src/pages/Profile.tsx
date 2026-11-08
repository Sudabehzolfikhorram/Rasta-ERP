import * as React from "react";
import { Building2, Check, KeyRound, Mail, Phone, Plus, ShieldCheck, Users } from "@/components/icons";
import { useApp } from "@/lib/store";
import { companies as seed, users, type Company } from "@/data/demo";
import { cn, toFa } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function Field({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="field-label">{label}</span>
      <Input defaultValue={value} dir={ltr ? "ltr" : undefined} className={cn("num", ltr && "text-left")} />
    </label>
  );
}

export function Profile() {
  const { company, setCompany, toast, concept, go } = useApp();
  const [list, setList] = React.useState<Company[]>(seed);
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const active = list.find((c) => c.id === company) ?? list[0];

  const me = (
    <section className="panel edge-run flex flex-wrap items-center gap-4 p-5">
      <span className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-primary-soft text-[24px] font-extrabold text-primary">س</span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[19px] font-extrabold">سارا احمدی</h2>
        <p className="text-[13px] text-muted-foreground">مدیر مالی · {active.name}</p>
        <div className="num mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><Mail className="size-3.5" /><span dir="ltr">s.ahmadi@aria-gostar.ir</span></span>
          <span className="flex items-center gap-1.5"><Phone className="size-3.5" />۰۹۱۲ ۳۴۵ ۶۷۸۹</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" />ورود دومرحله‌ای فعال</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => toast("در نسخه‌ی نمونه تغییر رمز غیرفعال است.")}><KeyRound /> تغییر رمز</Button>
      </div>
    </section>
  );

  const companies = (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold"><Building2 className="size-4 text-muted-foreground" /> شرکت‌های من</h2>
        <Button size="sm" variant="soft" onClick={() => setAdding(true)}><Plus /> افزودن شرکت</Button>
      </div>
      <ul className={cn("grid gap-3", concept === "bento" ? "sm:grid-cols-2" : "")}>
        {list.map((c) => {
          const on = c.id === active.id;
          return (
            <li key={c.id} className={cn("flex items-center gap-3 rounded-field border p-3.5 transition-colors", on ? "border-primary/40 bg-primary-soft/40" : "border-border bg-surface/60")}>
              <span className="grid size-10 shrink-0 place-items-center rounded-field text-[15px] font-extrabold text-white" style={{ background: `hsl(${c.color})` }}>{c.name[0]}</span>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-[14px]">{c.name}</b>
                <span className="num block text-[12px] text-muted-foreground">شناسه‌ی ملی {c.nid}</span>
                <span className="num block text-[12px] text-muted-foreground">سال مالی {c.year} · {c.role} · {toFa(c.docs)} سند</span>
              </div>
              {on ? <Badge tone="success"><Check className="size-3" /> شرکت فعال</Badge>
                : <Button size="sm" variant="outline" onClick={() => { setCompany(c.id); toast(`وارد «${c.name}» شدید.`); }}>ورود</Button>}
            </li>
          );
        })}
      </ul>
    </section>
  );

  const companyForm = (
    <section className="panel p-5">
      <h2 className="mb-4 text-[15px] font-extrabold">اطلاعات شرکت فعال</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام شرکت" value={active.name} />
        <Field label="شناسه‌ی ملی" value={active.nid} />
        <Field label="کد اقتصادی" value="۴۱۱۱۴۷۸۹۶۵۲۳" />
        <Field label="تلفن" value="۰۲۱ ۸۸۷۷ ۶۶۵۵" />
        <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="field-label">نشانی</span><Input defaultValue="تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۲۱۴" /></label>
        <div className="flex flex-col gap-1.5"><span className="field-label">واحد پول پایه</span><span className="flex h-10 items-center rounded-field bg-muted/60 px-3.5 text-[13.5px] text-muted-foreground">ریال</span></div>
        <div className="flex flex-col gap-1.5"><span className="field-label">سال مالی جاری</span><span className="num flex h-10 items-center rounded-field bg-muted/60 px-3.5 text-[13.5px] text-muted-foreground">۱ فروردین تا ۲۹ اسفند {active.year}</span></div>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={() => toast("اطلاعات شرکت ذخیره شد.")}>ذخیره‌ی تغییرات</Button></div>
    </section>
  );

  const system = (
    <section className="panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><Users className="size-4 text-muted-foreground" /> کاربران و دسترسی</h2>
      <ul className="flex flex-col divide-y divide-border/70">
        {users.map((u) => (
          <li key={u.name} className="flex items-center gap-3 py-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-muted text-[12.5px] font-bold">{u.name[0]}</span>
            <span className="min-w-0 flex-1"><b className="block text-[13px]">{u.name}</b><span className="text-[12px] text-muted-foreground">{u.role}</span></span>
            <Badge tone={u.active ? "success" : "neutral"}>{u.active ? "فعال" : "غیرفعال"}</Badge>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => toast("دعوت‌نامه برای کاربر جدید آماده شد.")}><Plus /> دعوت کاربر</Button>
        <Button size="sm" variant="ghost" onClick={() => go("reports")}>گزارش فعالیت سیستم</Button>
      </div>
    </section>
  );

  return (
    <>
      {concept === "bento" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">{me}{companies}{companyForm}</div>
          <div className="flex min-w-0 flex-col gap-5">{system}</div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">{me}{companies}{companyForm}{system}</div>
      )}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent aria-describedby={undefined} className="w-[min(440px,calc(100vw-32px))] p-5">
          <DialogTitle className="text-[16px] font-extrabold">افزودن شرکت</DialogTitle>
          <label className="mt-4 flex flex-col gap-1.5"><span className="field-label">نام شرکت</span><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="مثلاً: تولیدی البرز صنعت" /></label>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>انصراف</Button>
            <Button disabled={!name.trim()} onClick={() => { setList((x) => [...x, { id: `c${Date.now()}`, name: name.trim(), nid: "—", year: "۱۴۰۵", role: "مدیر مالی", docs: 0, color: "var(--ch-4)" }]); setName(""); setAdding(false); toast("شرکت جدید اضافه شد."); }}>افزودن</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
