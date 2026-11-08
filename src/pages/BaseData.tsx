import * as React from "react";
import { Add, ArrowSwapVertical, Bank, Building2, Card, EmptyWallet, Lock, MoneyChange, PencilLine, Search, Trash2, type IconType } from "@/components/icons";
import { useApp } from "@/lib/store";
import { users } from "@/data/demo";
import { cn, group, toEn, toFa } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SimpleSelect } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Empty } from "./Dashboard";

/* ---------- data shapes from «اطلاعات پایه سیستم مالی» ---------- */
type BankType = "بانک" | "موسسه مالی و اعتباری" | "صندوق قرض‌الحسنه";
type BankRec = { id: string; code: string; name: string; name2: string; type: BankType; swift: string; desc: string; used: boolean };
type Branch = { id: string; bank: string; name: string; code: string; city: string; phone: string; address: string };
type Account = { id: string; bank: string; branch: string; name: string; no: string; type: string; cheque: boolean; books: { serial: string; sheets: number; used: number; box: string }[]; currency: string; template: string; tafsili: string; party: string };
type Box = { id: string; name: string; name2: string; place: string; cashier: string; desc: string; active: boolean; currency: string; opening: number };
type Rate = { id: string; cur: string; rate: number; date: string; inverse: boolean };

const seedBanks: BankRec[] = [
  { id: "b1", code: "۰۱۲", name: "بانک ملت", name2: "Bank Mellat", type: "بانک", swift: "BKMTIRTH", desc: "حساب‌های جاری و سپرده‌ی شرکت", used: true },
  { id: "b2", code: "۰۵۴", name: "بانک پارسیان", name2: "Parsian Bank", type: "بانک", swift: "PARSIRTH", desc: "", used: true },
  { id: "b3", code: "۰۱۷", name: "بانک ملی ایران", name2: "Bank Melli Iran", type: "بانک", swift: "MELIIRTH", desc: "", used: false },
  { id: "b4", code: "۰۷۵", name: "موسسه‌ی اعتباری ملل", name2: "Melal Credit Institution", type: "موسسه مالی و اعتباری", swift: "", desc: "", used: false },
  { id: "b5", code: "۰۸۰", name: "صندوق قرض‌الحسنه‌ی کارکنان", name2: "", type: "صندوق قرض‌الحسنه", swift: "", desc: "وام‌های کارکنان", used: false },
];
const seedBranches: Branch[] = [
  { id: "r1", bank: "b1", name: "شعبه‌ی ونک", code: "۱۰۲۴", city: "تهران", phone: "۰۲۱ ۸۸۶۵ ۴۴۲۰", address: "میدان ونک، خیابان ملاصدرا" },
  { id: "r2", bank: "b2", name: "شعبه‌ی ولیعصر", code: "۲۲۱۰", city: "تهران", phone: "۰۲۱ ۸۸۷۱ ۰۹۹۰", address: "خیابان ولیعصر، بالاتر از پارک ساعی" },
  { id: "r3", bank: "b3", name: "شعبه‌ی مرکزی", code: "۰۳۱۵", city: "اصفهان", phone: "۰۳۱ ۳۲۲۲ ۱۱۰۰", address: "خیابان چهارباغ عباسی" },
];
const seedAccounts: Account[] = [
  { id: "a1", bank: "b1", branch: "r1", name: "ملت جاری", no: "۸۸۲۰۴۴۱۰۹۲", type: "جاری", cheque: true, books: [{ serial: "۸۸۲۴۰۱", sheets: 25, used: 14, box: "x1" }], currency: "ریال", template: "BNK-01", tafsili: "۱۵۰۱۰۰۰۱", party: "—" },
  { id: "a2", bank: "b2", branch: "r2", name: "پارسیان جاری", no: "۴۴۱۰۲۲۰۰۷۸", type: "جاری", cheque: true, books: [{ serial: "۴۴۱۲۰۱", sheets: 50, used: 9, box: "x1" }], currency: "ریال", template: "BNK-02", tafsili: "۱۵۰۱۰۰۰۲", party: "—" },
  { id: "a3", bank: "b1", branch: "r1", name: "ملت سپرده‌ی کوتاه‌مدت", no: "۹۹۰۱۳۲۵۵۱۰", type: "سپرده‌ی کوتاه‌مدت", cheque: false, books: [], currency: "ریال", template: "BNK-03", tafsili: "۱۵۰۱۰۰۰۳", party: "—" },
];
const seedBoxes: Box[] = [
  { id: "x1", name: "صندوق مرکزی", name2: "Head office", place: "دفتر مرکزی، طبقه‌ی دوم", cashier: "رضا موسوی", desc: "", active: true, currency: "ریال", opening: 120_000_000 },
  { id: "x2", name: "تنخواه کارخانه", name2: "", place: "کارخانه‌ی شهرک صنعتی", cashier: "علی رضایی", desc: "هزینه‌های جاری کارخانه", active: true, currency: "ریال", opening: 45_000_000 },
];
const CURRENCIES: [string, string, string][] = [["ریال", "IRR", "ارز عملیاتی"], ["دلار آمریکا", "USD", ""], ["یورو", "EUR", ""], ["درهم امارات", "AED", ""]];
const seedRates: Rate[] = [
  { id: "t1", cur: "USD", rate: 1_065_000, date: "۱۷ آبان ۱۴۰۵", inverse: false },
  { id: "t2", cur: "EUR", rate: 1_148_000, date: "۱۷ آبان ۱۴۰۵", inverse: false },
  { id: "t3", cur: "AED", rate: 290_000, date: "۱۶ آبان ۱۴۰۵", inverse: false },
];

type Tab = "banks" | "branches" | "accounts" | "boxes" | "currency";
const TABS: [Tab, string, IconType][] = [["banks", "بانک‌ها", Bank], ["branches", "شعبه‌ها", Building2], ["accounts", "حساب‌های بانکی", Card], ["boxes", "صندوق‌ها", EmptyWallet], ["currency", "ارزها و نرخ‌ها", MoneyChange]];

/* ---------- small form parts ---------- */
const Field = ({ label, hint, error, children, wide }: { label: string; hint?: string; error?: string; children: React.ReactNode; wide?: boolean }) => (
  <label className={cn("flex flex-col gap-1.5", wide && "sm:col-span-2")}>
    <span className="field-label">{label}</span>
    {children}
    {error ? <span className="text-[11.5px] font-semibold text-danger">{error}</span> : hint ? <span className="num text-[11.5px] text-muted-foreground">{hint}</span> : null}
  </label>
);
function FormDialog({ open, onOpenChange, title, children, onSave, canSave }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode; onSave: () => void; canSave: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="top-[8vh] flex max-h-[84vh] w-[min(620px,calc(100vw-32px))] flex-col">
        <DialogTitle className="border-b border-border px-6 py-4 text-[16px] font-extrabold">{title}</DialogTitle>
        <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-3.5">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button disabled={!canSave} onClick={onSave}>ذخیره</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
const RowActions = ({ onEdit, onDelete, lockReason, label }: { onEdit: () => void; onDelete: () => void; lockReason?: string; label: string }) => (
  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
    <button onClick={onEdit} aria-label={`ویرایش ${label}`} className="grid size-8 place-items-center rounded-field text-muted-foreground hover:bg-muted hover:text-foreground"><PencilLine className="size-4" /></button>
    <button onClick={onDelete} disabled={!!lockReason} title={lockReason} aria-label={lockReason ? `${label}: ${lockReason}` : `حذف ${label}`} className="grid size-8 place-items-center rounded-field text-muted-foreground hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"><Trash2 className="size-4" /></button>
  </div>
);

/* ---------- page ---------- */
export function BaseData() {
  const { toast, baseTab } = useApp();
  const tab = (TABS.some((t) => t[0] === baseTab) ? baseTab : "banks") as Tab;
  const [banks, setBanks] = React.useState(seedBanks);
  const [branches, setBranches] = React.useState(seedBranches);
  const [accounts, setAccounts] = React.useState(seedAccounts);
  const [boxes, setBoxes] = React.useState(seedBoxes);
  const [rates, setRates] = React.useState(seedRates);
  const [q, setQ] = React.useState("");
  React.useEffect(() => setQ(""), [tab]);
  const [edit, setEdit] = React.useState<{ tab: Tab; id: string | null } | null>(null);
  const bankName = (id: string) => banks.find((b) => b.id === id)?.name ?? "—";
  const match = (...xs: string[]) => !q.trim() || xs.some((x) => x.includes(q.trim()));
  const addLabel: Record<Tab, string> = { banks: "تعریف بانک", branches: "تعریف شعبه", accounts: "افتتاح حساب بانکی", boxes: "تعریف صندوق", currency: "ثبت نرخ ارز" };

  const tables: Record<Tab, React.ReactNode> = {
    banks: (
      <DataTable caption="بانک‌ها" rowKey={(b) => b.id} rows={banks.filter((b) => match(b.name, b.name2, b.swift))} onRow={(b) => setEdit({ tab: "banks", id: b.id })}
        empty={<Empty icon={Bank} title="بانکی پیدا نشد" />}
        columns={[
          { key: "code", label: "کد", className: "w-16", render: (b) => <span className="font-bold text-muted-foreground">{b.code}</span> },
          { key: "name", label: "نام بانک", render: (b) => <span className="flex items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-field bg-primary-soft text-primary"><Bank className="size-4" variant="Bulk" /></span><span><b className="block">{b.name}</b>{b.name2 && <span dir="ltr" className="block text-[11.5px] text-muted-foreground">{b.name2}</span>}</span></span> },
          { key: "type", label: "نوع", hide: "md", render: (b) => <Badge tone={b.type === "بانک" ? "info" : "neutral"}>{b.type}</Badge> },
          { key: "swift", label: "کد سوئیفت", hide: "md", render: (b) => (b.swift ? <span dir="ltr" className="font-mono text-[12.5px]">{b.swift}</span> : <span className="text-muted-foreground">—</span>) },
          { key: "acc", label: "حساب‌ها", align: "center", hide: "sm", render: (b) => toFa(accounts.filter((a) => a.bank === b.id).length) },
          { key: "used", label: "وضعیت", hide: "sm", render: (b) => (b.used ? <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><Lock className="size-3.5" /> در حال استفاده</span> : <span className="text-[12px] text-muted-foreground">استفاده نشده</span>) },
          { key: "act", label: <span className="sr-only">کارها</span>, align: "end", render: (b) => <RowActions label={b.name} onEdit={() => setEdit({ tab: "banks", id: b.id })} lockReason={b.used ? "این بانک در حساب‌ها استفاده شده و حذف نمی‌شود" : undefined} onDelete={() => { setBanks((x) => x.filter((y) => y.id !== b.id)); toast(`«${b.name}» حذف شد.`); }} /> },
        ] as Column<BankRec>[]} />
    ),
    branches: (
      <DataTable caption="شعبه‌ها" rowKey={(r) => r.id} rows={branches.filter((r) => match(r.name, bankName(r.bank), r.city))} onRow={(r) => setEdit({ tab: "branches", id: r.id })}
        empty={<Empty icon={Building2} title="شعبه‌ای پیدا نشد" />}
        columns={[
          { key: "bank", label: "بانک", render: (r) => <b>{bankName(r.bank)}</b> },
          { key: "name", label: "شعبه", render: (r) => <span>{r.name} <span className="text-muted-foreground">· کد {r.code}</span></span> },
          { key: "city", label: "شهر", hide: "sm", render: (r) => r.city },
          { key: "phone", label: "تلفن", hide: "md", render: (r) => <span dir="ltr">{r.phone}</span> },
          { key: "addr", label: "نشانی", hide: "lg", className: "max-w-[260px]", render: (r) => <span className="block truncate text-muted-foreground">{r.address}</span> },
          { key: "act", label: <span className="sr-only">کارها</span>, align: "end", render: (r) => <RowActions label={r.name} onEdit={() => setEdit({ tab: "branches", id: r.id })} lockReason={accounts.some((a) => a.branch === r.id) ? "حساب بانکی به این شعبه وصل است" : undefined} onDelete={() => setBranches((x) => x.filter((y) => y.id !== r.id))} /> },
        ] as Column<Branch>[]} />
    ),
    accounts: (
      <DataTable caption="حساب‌های بانکی" rowKey={(a) => a.id} rows={accounts.filter((a) => match(a.name, a.no, bankName(a.bank)))} onRow={(a) => setEdit({ tab: "accounts", id: a.id })}
        empty={<Empty icon={Card} title="حسابی پیدا نشد" />}
        columns={[
          { key: "name", label: "حساب", render: (a) => <span><b className="block">{a.name}</b><span className="text-[11.5px] text-muted-foreground">{bankName(a.bank)} · {branches.find((r) => r.id === a.branch)?.name}</span></span> },
          { key: "no", label: "شماره‌ی حساب", hide: "sm", render: (a) => <span dir="ltr" className="font-semibold">{a.no}</span> },
          { key: "type", label: "نوع", hide: "md", render: (a) => a.type },
          { key: "cheque", label: "دسته‌چک", hide: "md", render: (a) => (a.cheque ? <span>{a.books.map((b) => <span key={b.serial} className="block text-[12px]">{toFa(b.sheets - b.used)} برگ باقی‌مانده از {toFa(b.sheets)}</span>)}</span> : <span className="text-muted-foreground">ندارد</span>) },
          { key: "taf", label: "کد تفصیلی", hide: "lg", render: (a) => a.tafsili },
          { key: "act", label: <span className="sr-only">کارها</span>, align: "end", render: (a) => <RowActions label={a.name} onEdit={() => setEdit({ tab: "accounts", id: a.id })} lockReason="حساب گردش دارد و فقط بسته می‌شود" onDelete={() => undefined} /> },
        ] as Column<Account>[]} />
    ),
    boxes: (
      <DataTable caption="صندوق‌ها" rowKey={(x) => x.id} rows={boxes.filter((x) => match(x.name, x.cashier, x.place))} onRow={(x) => setEdit({ tab: "boxes", id: x.id })}
        empty={<Empty icon={EmptyWallet} title="صندوقی پیدا نشد" />}
        columns={[
          { key: "name", label: "صندوق", render: (x) => <span><b className="block">{x.name}</b><span className="text-[11.5px] text-muted-foreground">{x.place}</span></span> },
          { key: "cashier", label: "صندوق‌دار", hide: "sm", render: (x) => x.cashier },
          { key: "cur", label: "ارز", hide: "md", render: (x) => x.currency },
          { key: "open", label: "موجودی اولیه", align: "end", hide: "sm", render: (x) => <b>{group(x.opening)} <span className="text-[11px] font-normal text-muted-foreground">ریال</span></b> },
          { key: "state", label: "وضعیت", render: (x) => <Badge tone={x.active ? "success" : "neutral"}>{x.active ? "فعال" : "غیرفعال"}</Badge> },
          { key: "act", label: <span className="sr-only">کارها</span>, align: "end", render: (x) => <RowActions label={x.name} onEdit={() => setEdit({ tab: "boxes", id: x.id })} onDelete={() => setBoxes((y) => y.filter((z) => z.id !== x.id))} lockReason={accounts.some((a) => a.books.some((b) => b.box === x.id)) ? "دسته‌چک در این صندوق نگهداری می‌شود" : undefined} /> },
        ] as Column<Box>[]} />
    ),
    currency: <CurrencyTab rates={rates} />,
  };

  const forms: Record<Tab, React.ReactNode> = {
    banks: <BankForm key={edit?.id ?? "new"} rec={banks.find((b) => b.id === edit?.id)} nextCode={toFa(String(81 + banks.length).padStart(3, "0"))}
      onSave={(b) => { setBanks((x) => (x.some((y) => y.id === b.id) ? x.map((y) => (y.id === b.id ? b : y)) : [...x, b])); setEdit(null); toast(`«${b.name}» ذخیره شد.`, "success"); }} onCancel={() => setEdit(null)} />,
    branches: <BranchForm key={edit?.id ?? "new"} rec={branches.find((r) => r.id === edit?.id)} banks={banks}
      onSave={(r) => { setBranches((x) => (x.some((y) => y.id === r.id) ? x.map((y) => (y.id === r.id ? r : y)) : [...x, r])); setEdit(null); toast(`«${r.name}» ذخیره شد.`, "success"); }} onCancel={() => setEdit(null)} />,
    accounts: <AccountForm key={edit?.id ?? "new"} rec={accounts.find((a) => a.id === edit?.id)} banks={banks} branches={branches} boxes={boxes} nextTafsili={toFa(15010001 + accounts.length)}
      onSave={(a) => { setAccounts((x) => (x.some((y) => y.id === a.id) ? x.map((y) => (y.id === a.id ? a : y)) : [...x, a])); setBanks((x) => x.map((b) => (b.id === a.bank ? { ...b, used: true } : b))); setEdit(null); toast(`حساب «${a.name}» ذخیره شد.`, "success"); }} onCancel={() => setEdit(null)} />,
    boxes: <BoxForm key={edit?.id ?? "new"} rec={boxes.find((x) => x.id === edit?.id)} rates={rates}
      onSave={(b) => { setBoxes((x) => (x.some((y) => y.id === b.id) ? x.map((y) => (y.id === b.id ? b : y)) : [...x, b])); setEdit(null); toast(`«${b.name}» ذخیره شد.`, "success"); }} onCancel={() => setEdit(null)} />,
    currency: <RateForm onSave={(r) => { setRates((x) => [r, ...x]); setEdit(null); toast("نرخ ارز ثبت شد.", "success"); }} onCancel={() => setEdit(null)} />,
  };

  // a few numbers on top of each section, so the page reads before the table does
  const tot = (xs: number[]) => xs.reduce((x, y) => x + y, 0);
  const stats: Record<Tab, [string, string, string?][]> = {
    banks: [["بانک‌ها و موسسه‌ها", toFa(banks.length)], ["در حال استفاده", toFa(banks.filter((b) => b.used).length), "نام و حذف قفل است"], ["بانک", toFa(banks.filter((b) => b.type === "بانک").length)], ["با کد سوئیفت", toFa(banks.filter((b) => b.swift).length)]],
    branches: [["شعبه‌ها", toFa(branches.length)], ["شهرها", toFa(new Set(branches.map((r) => r.city)).size)], ["بانک‌های دارای شعبه", toFa(new Set(branches.map((r) => r.bank)).size)], ["شعبه‌های با حساب", toFa(branches.filter((r) => accounts.some((a) => a.branch === r.id)).length)]],
    accounts: [["حساب‌های بانکی", toFa(accounts.length)], ["جاری با دسته‌چک", toFa(accounts.filter((a) => a.cheque).length)], ["برگ چک باقی‌مانده", toFa(tot(accounts.flatMap((a) => a.books.map((b) => b.sheets - b.used))))], ["سپرده", toFa(accounts.filter((a) => a.type.startsWith("سپرده")).length)]],
    boxes: [["صندوق‌ها", toFa(boxes.length)], ["فعال", toFa(boxes.filter((x) => x.active).length)], ["موجودی اولیه", group(tot(boxes.filter((x) => x.currency === "ریال").map((x) => x.opening))), "ریال"], ["صندوق‌داران", toFa(new Set(boxes.map((x) => x.cashier)).size)]],
    currency: [["نرخ‌های ثبت‌شده", toFa(rates.length)], ["ارزها", toFa(new Set(rates.map((r) => r.cur)).size)], ["آخرین ثبت", rates[0]?.date ?? "—"]],
  };
  const [, title, TitleIcon] = TABS.find((t) => t[0] === tab)!;

  return (
    <>
      <section className="panel flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-primary-soft text-primary"><TitleIcon className="size-6" variant="Bulk" /></span>
          <div className="min-w-[220px] flex-1">
            <p className="text-[12px] font-bold text-muted-foreground">اطلاعات پایه</p>
            <h2 className="text-[19px] font-extrabold">{title}</h2>
            <p className="mt-0.5 max-w-2xl text-[12.5px] text-muted-foreground">
              {{ banks: "بانکی که در حساب‌ها استفاده شده باشد، نامش ثابت می‌ماند و حذف نمی‌شود.", branches: "هر حساب بانکی به یک شعبه وصل است.", accounts: "حساب بانکی پس از تعریف بانک و شعبه افتتاح می‌شود؛ دسته‌چک و کد تفصیلی هم همین‌جاست.", boxes: "هر صندوق فیزیکی یک صندوق در سیستم دارد؛ دسته‌چک‌ها و چک‌های دریافتی هم در صندوق نگهداری می‌شوند.", currency: "نرخ هر ارز با تاریخ اثر ثبت می‌شود و در اسناد ارزی، آخرین نرخ پیش از تاریخ سند پیشنهاد می‌شود." }[tab]}
            </p>
          </div>
          <Button onClick={() => setEdit({ tab, id: null })}><Add /> {addLabel[tab]}</Button>
        </div>
        <dl className={cn("grid gap-3", stats[tab].length > 3 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3")}>
          {stats[tab].map(([l, v, sub]) => (
            <div key={l} className="rounded-field border border-border bg-surface/60 px-4 py-3">
              <dt className="text-[12px] text-muted-foreground">{l}</dt>
              <dd className="num mt-1 flex items-baseline gap-1.5"><b className="text-[20px] font-extrabold">{v}</b>{sub && <span className="text-[11.5px] text-muted-foreground">{sub}</span>}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel flex min-w-0 flex-col gap-4 p-5">
        {tab !== "currency" && (
          <label className="relative block max-w-sm">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`جست‌وجو در ${title}`} aria-label="جست‌وجو" className="ps-9" />
          </label>
        )}
        {tables[tab]}
      </section>
      {edit && forms[edit.tab]}
    </>
  );
}

/* ---------- forms ---------- */
function BankForm({ rec, nextCode, onSave, onCancel }: { rec?: BankRec; nextCode: string; onSave: (b: BankRec) => void; onCancel: () => void }) {
  const [b, setB] = React.useState<BankRec>(rec ?? { id: `b${Date.now()}`, code: nextCode, name: "", name2: "", type: "بانک", swift: "", desc: "", used: false });
  const swiftErr = b.swift && !/^[A-Za-z0-9]{8,11}$/.test(b.swift) ? "کد سوئیفت باید ۸ تا ۱۱ حرف یا عدد لاتین باشد." : "";
  return (
    <FormDialog open onOpenChange={(o) => !o && onCancel()} title={rec ? `ویرایش ${rec.name}` : "تعریف بانک"} canSave={!!b.name.trim() && !swiftErr} onSave={() => onSave({ ...b, name: b.name.trim() })}>
      <Field label="نام بانک" hint={b.used ? undefined : "الزامی"}>
        <div className="relative"><Input value={b.name} readOnly={b.used} onChange={(e) => setB({ ...b, name: e.target.value })} autoFocus={!rec} placeholder="مثلاً بانک تجارت" className={cn(b.used && "bg-muted/60 pe-9")} />{b.used && <Lock className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />}</div>
        {b.used && <span className="text-[11.5px] text-muted-foreground">این بانک در حساب‌ها استفاده شده و نامش تغییر نمی‌کند.</span>}
      </Field>
      <Field label="نام به زبان دوم"><Input dir="ltr" value={b.name2} onChange={(e) => setB({ ...b, name2: e.target.value })} className="text-left" /></Field>
      <Field label="نوع"><SimpleSelect label="نوع بانک" value={b.type} onChange={(v) => setB({ ...b, type: v as BankType })} options={[["بانک", "بانک"], ["موسسه مالی و اعتباری", "موسسه‌ی مالی و اعتباری"], ["صندوق قرض‌الحسنه", "صندوق قرض‌الحسنه"]]} /></Field>
      <Field label="کد بانک" hint="خودکار ساخته می‌شود"><Input value={b.code} readOnly className="num bg-muted/60" /></Field>
      <Field label="کد سوئیفت" error={swiftErr} hint="۸ تا ۱۱ کاراکتر"><Input dir="ltr" value={b.swift} maxLength={11} onChange={(e) => setB({ ...b, swift: e.target.value.toUpperCase() })} className="text-left font-mono" placeholder="BKMTIRTH" /></Field>
      <Field label="شرح" wide><Input value={b.desc} onChange={(e) => setB({ ...b, desc: e.target.value })} /></Field>
    </FormDialog>
  );
}

function BranchForm({ rec, banks, onSave, onCancel }: { rec?: Branch; banks: BankRec[]; onSave: (r: Branch) => void; onCancel: () => void }) {
  const [r, setR] = React.useState<Branch>(rec ?? { id: `r${Date.now()}`, bank: banks[0]?.id ?? "", name: "", code: "", city: "", phone: "", address: "" });
  return (
    <FormDialog open onOpenChange={(o) => !o && onCancel()} title={rec ? `ویرایش ${rec.name}` : "تعریف شعبه"} canSave={!!r.name.trim() && !!r.code.trim()} onSave={() => onSave(r)}>
      <Field label="بانک"><SimpleSelect label="بانک" value={r.bank} onChange={(v) => setR({ ...r, bank: v })} options={banks.map((b) => [b.id, b.name])} /></Field>
      <Field label="نام شعبه"><Input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} autoFocus={!rec} /></Field>
      <Field label="کد شعبه"><Input value={r.code} inputMode="numeric" onChange={(e) => setR({ ...r, code: toFa(toEn(e.target.value).replace(/\D/g, "")) })} className="num" /></Field>
      <Field label="شهر"><Input value={r.city} onChange={(e) => setR({ ...r, city: e.target.value })} /></Field>
      <Field label="تلفن"><Input value={r.phone} onChange={(e) => setR({ ...r, phone: e.target.value })} className="num" /></Field>
      <Field label="نشانی" wide><Input value={r.address} onChange={(e) => setR({ ...r, address: e.target.value })} /></Field>
    </FormDialog>
  );
}

function AccountForm({ rec, banks, branches, boxes, nextTafsili, onSave, onCancel }: { rec?: Account; banks: BankRec[]; branches: Branch[]; boxes: Box[]; nextTafsili: string; onSave: (a: Account) => void; onCancel: () => void }) {
  const [a, setA] = React.useState<Account>(rec ?? { id: `a${Date.now()}`, bank: banks[0]?.id ?? "", branch: "", name: "", no: "", type: "جاری", cheque: false, books: [], currency: "ریال", template: `BNK-${String(10 + Math.floor(Math.random() * 80))}`, tafsili: nextTafsili, party: "—" });
  const bankBranches = branches.filter((r) => r.bank === a.bank);
  const book = a.books[0] ?? { serial: "", sheets: 25, used: 0, box: boxes[0]?.id ?? "" };
  const setBook = (p: Partial<typeof book>) => setA({ ...a, books: [{ ...book, ...p }, ...a.books.slice(1)] });
  const branch = bankBranches.some((r) => r.id === a.branch) ? a.branch : bankBranches[0]?.id ?? "";
  return (
    <FormDialog open onOpenChange={(o) => !o && onCancel()} title={rec ? `ویرایش ${rec.name}` : "افتتاح حساب بانکی"} canSave={!!a.name.trim() && !!a.no.trim() && !!branch && (!a.cheque || !!book.serial)} onSave={() => onSave({ ...a, branch })}>
      <Field label="بانک"><SimpleSelect label="بانک" value={a.bank} onChange={(v) => setA({ ...a, bank: v, branch: "" })} options={banks.map((b) => [b.id, b.name])} /></Field>
      <Field label="شعبه" error={bankBranches.length ? undefined : "برای این بانک هنوز شعبه‌ای تعریف نشده است."}><SimpleSelect label="شعبه" value={branch} disabled={!bankBranches.length} onChange={(v) => setA({ ...a, branch: v })} options={bankBranches.map((r) => [r.id, `${r.name} · ${r.code}`])} /></Field>
      <Field label="نام حساب"><Input value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} placeholder="مثلاً ملت جاری" /></Field>
      <Field label="شماره‌ی حساب"><Input dir="ltr" value={a.no} inputMode="numeric" onChange={(e) => setA({ ...a, no: toFa(toEn(e.target.value).replace(/\D/g, "")) })} className="num text-left" /></Field>
      <Field label="نوع حساب"><SimpleSelect label="نوع حساب" value={a.type} onChange={(v) => setA({ ...a, type: v, cheque: v === "جاری" ? a.cheque : false })} options={[["جاری", "جاری"], ["سپرده‌ی کوتاه‌مدت", "سپرده‌ی کوتاه‌مدت"], ["سپرده‌ی بلندمدت", "سپرده‌ی بلندمدت"], ["قرض‌الحسنه", "قرض‌الحسنه"]]} /></Field>
      <label className="flex items-center gap-2.5 self-end pb-2.5 text-[13.5px] font-semibold"><Checkbox checked={a.cheque} disabled={a.type !== "جاری"} onCheckedChange={(v) => setA({ ...a, cheque: !!v })} /> حساب دسته‌چک دارد</label>
      {a.cheque && (
        <fieldset className="grid gap-4 rounded-field border border-border bg-muted/30 p-4 sm:col-span-2 sm:grid-cols-3">
          <legend className="px-1 text-[12.5px] font-bold">دسته‌چک</legend>
          <Field label="سریال اولین برگ"><Input value={book.serial} inputMode="numeric" onChange={(e) => setBook({ serial: toFa(toEn(e.target.value).replace(/\D/g, "")) })} className="num" /></Field>
          <Field label="تعداد برگ"><SimpleSelect label="تعداد برگ" value={String(book.sheets)} onChange={(v) => setBook({ sheets: +v })} options={[["10", "۱۰ برگ"], ["25", "۲۵ برگ"], ["50", "۵۰ برگ"], ["100", "۱۰۰ برگ"]]} /></Field>
          <Field label="صندوق نگهداری"><SimpleSelect label="صندوق" value={book.box} onChange={(v) => setBook({ box: v })} options={boxes.map((x) => [x.id, x.name])} /></Field>
        </fieldset>
      )}
      <fieldset className="grid gap-4 rounded-field border border-border p-4 sm:col-span-2 sm:grid-cols-2">
        <legend className="px-1 text-[12.5px] font-bold">اطلاعات تفصیلی حساب</legend>
        <Field label="ارز پیش‌فرض"><SimpleSelect label="ارز پیش‌فرض" value={a.currency} onChange={(v) => setA({ ...a, currency: v })} options={CURRENCIES.map(([n]) => [n, n])} /></Field>
        <Field label="الگوی سند خودکار" hint="خودکار ساخته می‌شود"><Input dir="ltr" value={a.template} readOnly className="bg-muted/60 text-left font-mono" /></Field>
        <Field label="کد تفصیلی حساب"><Input value={a.tafsili} readOnly className="num bg-muted/60" /></Field>
        <Field label="طرف حساب"><Input value={a.party} onChange={(e) => setA({ ...a, party: e.target.value })} /></Field>
      </fieldset>
    </FormDialog>
  );
}

function BoxForm({ rec, rates, onSave, onCancel }: { rec?: Box; rates: Rate[]; onSave: (b: Box) => void; onCancel: () => void }) {
  const [b, setB] = React.useState<Box>(rec ?? { id: `x${Date.now()}`, name: "", name2: "", place: "", cashier: users.find((u) => u.active)!.name, desc: "", active: true, currency: "ریال", opening: 0 });
  const code = CURRENCIES.find((c) => c[0] === b.currency)?.[1];
  const rate = code === "IRR" ? 1 : rates.find((r) => r.cur === code)?.rate ?? 0;
  return (
    <FormDialog open onOpenChange={(o) => !o && onCancel()} title={rec ? `ویرایش ${rec.name}` : "تعریف صندوق"} canSave={!!b.name.trim() && b.opening >= 0} onSave={() => onSave(b)}>
      <Field label="نام صندوق"><Input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} autoFocus={!rec} /></Field>
      <Field label="نام به زبان دوم"><Input dir="ltr" value={b.name2} onChange={(e) => setB({ ...b, name2: e.target.value })} className="text-left" /></Field>
      <Field label="محل فیزیکی"><Input value={b.place} onChange={(e) => setB({ ...b, place: e.target.value })} /></Field>
      <Field label="صندوق‌دار" hint="از میان کاربران فعال"><SimpleSelect label="صندوق‌دار" value={b.cashier} onChange={(v) => setB({ ...b, cashier: v })} options={users.filter((u) => u.active).map((u) => [u.name, `${u.name} · ${u.role}`])} /></Field>
      <Field label="ارز صندوق"><SimpleSelect label="ارز صندوق" value={b.currency} onChange={(v) => setB({ ...b, currency: v })} options={CURRENCIES.map(([n]) => [n, n])} /></Field>
      <Field label="موجودی اولیه" hint={rate && code !== "IRR" ? `معادل ${group(Math.round(b.opening * rate))} ریال با نرخ ${group(rate)}` : "صفر یا بیشتر"}>
        <Input dir="ltr" inputMode="numeric" value={group(b.opening)} onChange={(e) => setB({ ...b, opening: parseInt(toEn(e.target.value).replace(/\D/g, "") || "0", 10) })} className="num text-left font-bold" />
      </Field>
      <Field label="شرح" wide><Input value={b.desc} onChange={(e) => setB({ ...b, desc: e.target.value })} /></Field>
      <label className="flex items-center justify-between gap-3 rounded-field border border-border px-4 py-3 sm:col-span-2"><span className="text-[13.5px] font-semibold">صندوق فعال است</span><Switch checked={b.active} onCheckedChange={(v) => setB({ ...b, active: v })} aria-label="صندوق فعال" /></label>
    </FormDialog>
  );
}

function RateForm({ onSave, onCancel }: { onSave: (r: Rate) => void; onCancel: () => void }) {
  const [r, setR] = React.useState<Rate>({ id: `t${Date.now()}`, cur: "USD", rate: 0, date: "۱۷ آبان ۱۴۰۵", inverse: false });
  return (
    <FormDialog open onOpenChange={(o) => !o && onCancel()} title="ثبت نرخ ارز" canSave={r.rate > 0} onSave={() => onSave(r)}>
      <Field label="ارز"><SimpleSelect label="ارز" value={r.cur} onChange={(v) => setR({ ...r, cur: v })} options={CURRENCIES.slice(1).map(([n, c]) => [c, n])} /></Field>
      <Field label="تاریخ اثر"><Input value={r.date} onChange={(e) => setR({ ...r, date: e.target.value })} className="num" /></Field>
      <Field label="نرخ به ریال"><Input dir="ltr" inputMode="numeric" value={group(r.rate)} onChange={(e) => setR({ ...r, rate: parseInt(toEn(e.target.value).replace(/\D/g, "") || "0", 10) })} className="num text-left font-bold" autoFocus /></Field>
      <label className="flex items-center gap-2.5 self-end pb-2.5 text-[13.5px] font-semibold"><Checkbox checked={r.inverse} onCheckedChange={(v) => setR({ ...r, inverse: !!v })} /> نرخ معکوس است</label>
    </FormDialog>
  );
}

/** Rates list plus the three-field converter: fill any two of amount, rate and rial amount and the third is calculated. */
function CurrencyTab({ rates }: { rates: Rate[] }) {
  const [cur, setCur] = React.useState("USD");
  const latest = rates.find((r) => r.cur === cur);
  const [amount, setAmount] = React.useState(1000);
  const [rate, setRate] = React.useState(latest?.rate ?? 0);
  const [fixed, setFixed] = React.useState<"amount" | "rate" | "rial">("rial");
  React.useEffect(() => { setRate(rates.find((r) => r.cur === cur)?.rate ?? 0); }, [cur, rates]);
  const rial = Math.round(amount * rate);
  const num = (v: string) => parseInt(toEn(v).replace(/\D/g, "") || "0", 10);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <DataTable caption="نرخ ارزها" rowKey={(r) => r.id} rows={rates} dense
        columns={[
          { key: "cur", label: "ارز", render: (r) => { const c = CURRENCIES.find((x) => x[1] === r.cur)!; return <span className="flex items-center gap-2"><span dir="ltr" className="grid h-7 min-w-11 place-items-center rounded-md bg-muted px-1.5 text-[11.5px] font-bold">{r.cur}</span><b>{c[0]}</b></span>; } },
          { key: "rate", label: "نرخ به ریال", align: "end", render: (r) => <b>{r.inverse ? "−" : "+"} {group(r.rate)}</b> },
          { key: "date", label: "تاریخ اثر", hide: "sm", render: (r) => <span className="text-muted-foreground">{r.date}</span> },
        ] as Column<Rate>[]} />
      <div className="rounded-[calc(var(--r-field)+4px)] border border-border bg-surface/70 p-4">
        <div className="mb-3 flex items-center gap-2"><ArrowSwapVertical className="size-5 text-primary" variant="Bulk" /><b className="text-[14px]">محاسبه‌ی معادل ریالی</b></div>
        <div className="flex flex-col gap-3">
          <Field label="ارز"><SimpleSelect label="ارز محاسبه" value={cur} onChange={setCur} options={CURRENCIES.slice(1).map(([n, c]) => [c, n])} /></Field>
          <Field label="مبلغ"><Input dir="ltr" value={group(amount)} readOnly={fixed === "amount"} onChange={(e) => setAmount(num(e.target.value))} className="num text-left" /></Field>
          <Field label="نرخ"><Input dir="ltr" value={group(rate)} readOnly={fixed === "rate"} onChange={(e) => setRate(num(e.target.value))} className="num text-left" /></Field>
          <Field label="مبلغ به ارز عملیاتی (ریال)"><Input dir="ltr" value={group(rial)} readOnly={fixed === "rial"} onChange={(e) => { const v = num(e.target.value); if (fixed === "amount" && amount) setRate(Math.round(v / amount)); else if (rate) setAmount(Math.round(v / rate)); }} className={cn("num text-left font-bold", fixed === "rial" && "bg-muted/60")} /></Field>
          <Field label="عامل ثابت" hint="فیلدی که هنگام تغییر دو فیلد دیگر قفل می‌ماند"><SimpleSelect label="عامل ثابت" value={fixed} onChange={(v) => setFixed(v as typeof fixed)} options={[["rial", "مبلغ به ارز عملیاتی"], ["rate", "نرخ"], ["amount", "مبلغ"]]} /></Field>
        </div>
      </div>
    </div>
  );
}
