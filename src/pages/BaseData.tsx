import * as React from "react";
import { BankLogo } from "@/components/ui/bank-logo";
import { ChartOfAccounts } from "@/components/coding/ChartOfAccounts";
import { BankDocs } from "@/components/docs/BankDocs";
import { Add, ChevronLeft, Hierarchy, Sparkles, X, ArrowLeft2, ArrowSwapVertical, Bank, Call, Category2, ChevronRight, Building2, CalendarCheck2, Card, EmptyWallet, Global, Location, Lock, MoneyChange, PencilLine, People, Receipt1, Search, TaskSquare, TickCircle, Trash2, Wallet3, type IconType } from "@/components/icons";
import { StatCard, type Tone } from "@/components/ui/stat";
import { useApp } from "@/lib/store";
import { users } from "@/data/demo";
import { cn, group, short, toEn, toFa } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AmountInput, tomanLine } from "@/components/ui/amount";
import { Orb } from "@/components/ai/Orb";
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
  { id: "b4", code: "۰۱۸", name: "بانک تجارت", name2: "Tejarat Bank", type: "بانک", swift: "BTEJIRTH", desc: "صورت‌حساب‌های ماهانه", used: false },
  { id: "b5", code: "۰۱۹", name: "بانک صادرات ایران", name2: "Bank Saderat Iran", type: "بانک", swift: "BSIRIRTH", desc: "", used: false },
];
const seedBranches: Branch[] = [
  { id: "r1", bank: "b1", name: "شعبه‌ی ونک", code: "۱۰۲۴", city: "تهران", phone: "۰۲۱ ۸۸۶۵ ۴۴۲۰", address: "میدان ونک، خیابان ملاصدرا" },
  { id: "r2", bank: "b2", name: "شعبه‌ی ولیعصر", code: "۲۲۱۰", city: "تهران", phone: "۰۲۱ ۸۸۷۱ ۰۹۹۰", address: "خیابان ولیعصر، بالاتر از پارک ساعی" },
  { id: "r3", bank: "b3", name: "شعبه‌ی مرکزی", code: "۰۳۱۵", city: "اصفهان", phone: "۰۳۱ ۳۲۲۲ ۱۱۰۰", address: "خیابان چهارباغ عباسی" },
  { id: "r4", bank: "b1", name: "شعبه‌ی میرداماد", code: "۱۱۸۷", city: "تهران", phone: "۰۲۱ ۲۲۲۵ ۶۱۴۰", address: "بلوار میرداماد، نبش کازرون" },
  { id: "r5", bank: "b1", name: "شعبه‌ی شهرک صنعتی", code: "۴۴۰۲", city: "اصفهان", phone: "۰۳۱ ۴۵۸۲ ۲۰۱۰", address: "شهرک صنعتی محمودآباد" },
];
const seedAccounts: Account[] = [
  { id: "a1", bank: "b1", branch: "r1", name: "ملت جاری", no: "۸۸۲۰۴۴۱۰۹۲", type: "جاری", cheque: true, books: [{ serial: "۸۸۲۴۰۱", sheets: 25, used: 14, box: "x1" }], currency: "ریال", template: "BNK-01", tafsili: "۱۵۰۱۰۰۰۱", party: "—" },
  { id: "a2", bank: "b2", branch: "r2", name: "پارسیان جاری", no: "۴۴۱۰۲۲۰۰۷۸", type: "جاری", cheque: true, books: [{ serial: "۴۴۱۲۰۱", sheets: 50, used: 9, box: "x1" }], currency: "ریال", template: "BNK-02", tafsili: "۱۵۰۱۰۰۰۲", party: "—" },
  { id: "a4", bank: "b1", branch: "r5", name: "ملت جاری کارخانه", no: "۸۸۲۰۹۹۱۳۰۴", type: "جاری", cheque: true, books: [{ serial: "۸۸۲۵۰۱", sheets: 50, used: 31, box: "x2" }], currency: "ریال", template: "BNK-04", tafsili: "۱۵۰۱۰۰۰۴", party: "—" },
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

/** Demo balances for the hub pages (rial). */
const BAL: Record<string, number> = { a1: 9_800_000_000, a2: 31_200_000_000, a3: 5_700_000_000, a4: 2_350_000_000 };

type Tab = "home" | "banks" | "branches" | "accounts" | "boxes" | "currency";
const TABS: [Tab, string, IconType][] = [["home", "نمای کلی", Category2], ["banks", "بانک‌ها", Bank], ["branches", "شعبه‌ها", Building2], ["accounts", "حساب‌های بانکی", Card], ["boxes", "صندوق‌ها", EmptyWallet], ["currency", "ارزها و نرخ‌ها", MoneyChange]];

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
  const { toast, baseTab, setBaseTab, concept } = useApp();
  const tab = (TABS.some((t) => t[0] === baseTab) ? baseTab : "home") as Tab;
  const [hub, setHub] = React.useState<string | null>(null);
  React.useEffect(() => setHub(null), [tab]);
  const [banks, setBanks] = React.useState(seedBanks);
  const [branches, setBranches] = React.useState(seedBranches);
  const [accounts, setAccounts] = React.useState(seedAccounts);
  const [boxes, setBoxes] = React.useState(seedBoxes);
  const [rates, setRates] = React.useState(seedRates);
  const [q, setQ] = React.useState("");
  React.useEffect(() => setQ(""), [tab]);
  const [edit, setEdit] = React.useState<{ tab: Tab; id: string | null; bank?: string } | null>(null);
  const bankName = (id: string) => banks.find((b) => b.id === id)?.name ?? "—";
  const match = (...xs: string[]) => !q.trim() || xs.some((x) => x.includes(q.trim()));
  const addLabel: Record<Tab, string> = { home: "تعریف بانک", banks: "تعریف بانک", branches: "تعریف شعبه", accounts: "افتتاح حساب بانکی", boxes: "تعریف صندوق", currency: "ثبت نرخ ارز" };

  const tables: Record<Tab, React.ReactNode> = {
    banks: (
      <DataTable caption="بانک‌ها" rowKey={(b) => b.id} rows={banks.filter((b) => match(b.name, b.name2, b.swift))} onRow={(b) => setHub(b.id)}
        empty={<Empty icon={Bank} title="بانکی پیدا نشد" />}
        columns={[
          { key: "code", label: "کد", className: "w-16", render: (b) => <span className="font-bold text-muted-foreground">{b.code}</span> },
          { key: "name", label: "نام بانک", render: (b) => <span className="flex items-center gap-2.5"><BankLogo name={b.name} /><span><b className="block">{b.name}</b>{b.name2 && <span dir="ltr" className="block text-[11.5px] text-muted-foreground">{b.name2}</span>}</span></span> },
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
    home: null,
  };

  const forms: Record<Tab, React.ReactNode> = {
    banks: <BankForm key={edit?.id ?? "new"} rec={banks.find((b) => b.id === edit?.id)} nextCode={toFa(String(81 + banks.length).padStart(3, "0"))}
      onSave={(b) => { setBanks((x) => (x.some((y) => y.id === b.id) ? x.map((y) => (y.id === b.id ? b : y)) : [...x, b])); setEdit(null); toast(`«${b.name}» ذخیره شد.`, "success"); }} onCancel={() => setEdit(null)} />,
    home: null,
    branches: <BranchForm key={edit?.id ?? "new"} rec={branches.find((r) => r.id === edit?.id)} bank={edit?.bank} banks={banks}
      onSave={(r) => { setBranches((x) => (x.some((y) => y.id === r.id) ? x.map((y) => (y.id === r.id ? r : y)) : [...x, r])); setEdit(null); toast(`«${r.name}» ذخیره شد.`, "success"); }} onCancel={() => setEdit(null)} />,
    accounts: <AccountForm key={edit?.id ?? "new"} rec={accounts.find((a) => a.id === edit?.id)} bank={edit?.bank} banks={banks} branches={branches} boxes={boxes} nextTafsili={toFa(15010001 + accounts.length)}
      onSave={(a) => { setAccounts((x) => (x.some((y) => y.id === a.id) ? x.map((y) => (y.id === a.id ? a : y)) : [...x, a])); setBanks((x) => x.map((b) => (b.id === a.bank ? { ...b, used: true } : b))); setEdit(null); toast(`حساب «${a.name}» ذخیره شد.`, "success"); }} onCancel={() => setEdit(null)} />,
    boxes: <BoxForm key={edit?.id ?? "new"} rec={boxes.find((x) => x.id === edit?.id)} rates={rates}
      onSave={(b) => { setBoxes((x) => (x.some((y) => y.id === b.id) ? x.map((y) => (y.id === b.id ? b : y)) : [...x, b])); setEdit(null); toast(`«${b.name}» ذخیره شد.`, "success"); }} onCancel={() => setEdit(null)} />,
    currency: <RateForm onSave={(r) => { setRates((x) => [r, ...x]); setEdit(null); toast("نرخ ارز ثبت شد.", "success"); }} onCancel={() => setEdit(null)} />,
  };

  // a few numbers on top of each section, so the page reads before the table does
  const tot = (xs: number[]) => xs.reduce((x, y) => x + y, 0);
  type S = { l: string; v: string; u?: string; sub?: string; i: IconType; t: Tone; p?: number };
  const usedBanks = banks.filter((b) => b.used).length;
  const sheetsLeft = tot(accounts.flatMap((a) => a.books.map((b) => b.sheets - b.used)));
  const sheetsAll = tot(accounts.flatMap((a) => a.books.map((b) => b.sheets)));
  const stats: Record<Tab, S[]> = {
    home: [
      { l: "بانک‌ها", v: toFa(banks.length), i: Bank, t: "blue", sub: `${toFa(usedBanks)} در حال استفاده` },
      { l: "حساب‌های بانکی", v: toFa(accounts.length), i: Card, t: "violet", sub: `در ${toFa(branches.length)} شعبه` },
      { l: "صندوق‌ها", v: toFa(boxes.length), i: EmptyWallet, t: "teal", sub: `${toFa(boxes.filter((x) => x.active).length)} فعال` },
      { l: "ارزهای دارای نرخ", v: toFa(new Set(rates.map((r) => r.cur)).size), i: MoneyChange, t: "sky", sub: `آخرین ثبت ${rates[0]?.date ?? "—"}` },
    ],
    banks: [
      { l: "بانک‌ها", v: toFa(banks.length), i: Bank, t: "blue", sub: `${toFa(usedBanks)} بانک در حال استفاده` },
      { l: "در حال استفاده", v: toFa(usedBanks), u: `از ${toFa(banks.length)}`, i: Lock, t: "violet", p: usedBanks / Math.max(banks.length, 1), sub: "نام و حذف قفل است" },
      { l: "شعبه‌ها", v: toFa(branches.length), i: Building2, t: "teal", sub: `در ${toFa(new Set(branches.map((r) => r.city)).size)} شهر` },
      { l: "با کد سوئیفت", v: toFa(banks.filter((b) => b.swift).length), i: Global, t: "sky", sub: "برای حواله‌ی ارزی" },
    ],
    branches: [
      { l: "شعبه‌ها", v: toFa(branches.length), i: Building2, t: "teal" },
      { l: "شهرها", v: toFa(new Set(branches.map((r) => r.city)).size), i: Location, t: "blue" },
      { l: "بانک‌های دارای شعبه", v: toFa(new Set(branches.map((r) => r.bank)).size), u: `از ${toFa(banks.length)}`, i: Bank, t: "violet", p: new Set(branches.map((r) => r.bank)).size / Math.max(banks.length, 1) },
      { l: "شعبه‌های دارای حساب", v: toFa(branches.filter((r) => accounts.some((a) => a.branch === r.id)).length), i: Card, t: "sky" },
    ],
    accounts: [
      { l: "حساب‌های بانکی", v: toFa(accounts.length), i: Card, t: "blue", sub: `${toFa(accounts.filter((a) => a.type.startsWith("سپرده")).length)} سپرده` },
      { l: "جاری با دسته‌چک", v: toFa(accounts.filter((a) => a.cheque).length), i: Receipt1, t: "violet" },
      { l: "برگ چک باقی‌مانده", v: toFa(sheetsLeft), u: `از ${toFa(sheetsAll)}`, i: TaskSquare, t: "teal", p: sheetsLeft / Math.max(sheetsAll, 1) },
      { l: "ارزها", v: toFa(new Set(accounts.map((a) => a.currency)).size), i: MoneyChange, t: "sky", sub: [...new Set(accounts.map((a) => a.currency))].join("، ") },
    ],
    boxes: [
      { l: "صندوق‌ها", v: toFa(boxes.length), i: EmptyWallet, t: "teal" },
      { l: "فعال", v: toFa(boxes.filter((x) => x.active).length), u: `از ${toFa(boxes.length)}`, i: TickCircle, t: "blue", p: boxes.filter((x) => x.active).length / Math.max(boxes.length, 1) },
      { l: "موجودی اولیه‌ی ریالی", v: group(tot(boxes.filter((x) => x.currency === "ریال").map((x) => x.opening))), u: "ریال", i: Wallet3, t: "violet" },
      { l: "صندوق‌داران", v: toFa(new Set(boxes.map((x) => x.cashier)).size), i: People, t: "sky" },
    ],
    currency: [
      { l: "نرخ‌های ثبت‌شده", v: toFa(rates.length), i: MoneyChange, t: "blue" },
      { l: "ارزها", v: toFa(new Set(rates.map((r) => r.cur)).size), i: Global, t: "teal" },
      { l: "آخرین ثبت", v: rates[0]?.date ?? "—", i: CalendarCheck2, t: "violet" },
    ],
  };
  const [, title, TitleIcon] = TABS.find((t) => t[0] === tab)!;

  const balOf = (ids: string[]) => ids.reduce((x, id) => x + (BAL[id] ?? 0), 0);
  const bankCard = (b: BankRec) => {
    const acc = accounts.filter((a) => a.bank === b.id);
    const br = branches.filter((r) => r.bank === b.id);
    return (
      <button key={b.id} onClick={() => setHub(b.id)} className="group flex flex-col gap-3 rounded-[calc(var(--r-field)+6px)] border border-border bg-surface/60 p-4 text-start transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/40">
        <span className="flex items-center gap-3">
          <BankLogo name={b.name} />
          <span className="min-w-0 flex-1"><b className="block truncate text-[14px]">{b.name}</b><span className="num text-[11.5px] text-muted-foreground">کد {b.code} · {b.type}</span></span>
          <ArrowLeft2 className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
        </span>
        <span className="num grid grid-cols-3 gap-2 text-center text-[11.5px] text-muted-foreground">
          <span className="rounded-[10px] bg-muted/60 py-1.5"><b className="block text-[15px] text-foreground">{toFa(br.length)}</b>شعبه</span>
          <span className="rounded-[10px] bg-muted/60 py-1.5"><b className="block text-[15px] text-foreground">{toFa(acc.length)}</b>حساب</span>
          <span className="rounded-[10px] bg-muted/60 py-1.5"><b className="block text-[15px] text-foreground">{acc.length ? short(balOf(acc.map((a) => a.id)), "rial").n : "—"}</b>{acc.length ? `${short(balOf(acc.map((a) => a.id)), "rial").s} ریال` : "مانده"}</span>
        </span>
      </button>
    );
  };
  const homeGrid = (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="panel p-5">
        <h3 className="mb-3 text-[15px] font-extrabold">بانک‌ها</h3>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{banks.map(bankCard)}</div>
      </section>
      <div className="flex flex-col gap-4">
        <section className="panel p-5">
          <h3 className="mb-3 text-[15px] font-extrabold">صندوق‌ها</h3>
          <ul className="flex flex-col gap-2">{boxes.map((x) => (
            <li key={x.id} className="flex items-center gap-3 rounded-field bg-muted/40 px-3 py-2.5">
              <EmptyWallet className="size-5 text-ch-2" variant="Bulk" />
              <span className="min-w-0 flex-1"><b className="block truncate text-[13px]">{x.name}</b><span className="text-[11.5px] text-muted-foreground">{x.cashier}</span></span>
              <b className="num text-[12.5px]">{group(x.opening)}</b>
            </li>))}</ul>
        </section>
        <section className="panel p-5">
          <h3 className="mb-3 text-[15px] font-extrabold">آخرین نرخ‌ها</h3>
          <ul className="flex flex-col gap-2">{rates.slice(0, 4).map((r) => (
            <li key={r.id} className="num flex items-center justify-between rounded-field bg-muted/40 px-3 py-2.5 text-[13px]"><span className="font-semibold">{CURRENCIES.find((c) => c[1] === r.cur)?.[0]}</span><b>{group(r.rate)} <span className="text-[11px] font-normal text-muted-foreground">ریال</span></b></li>))}</ul>
        </section>
      </div>
    </div>
  );

  if (baseTab === "coding") return <ChartOfAccounts />;
  if (concept === "assist") {
    return <AssistBase tab={tab} banks={banks} branches={branches} accounts={accounts} boxes={boxes} rates={rates} hub={hub} setHub={setHub}
      setEdit={setEdit} setTab={(t) => { setHub(null); setBaseTab(t); }} addLabel={addLabel[tab]} form={edit && forms[edit.tab]} />;
  }

  const hubBank = banks.find((b) => b.id === hub);
  if (hubBank) {
    const br = branches.filter((r) => r.bank === hubBank.id);
    const acc = accounts.filter((a) => a.bank === hubBank.id);
    const books = acc.flatMap((a) => a.books.map((b) => ({ ...b, acc: a })));
    const left = tot(books.map((b) => b.sheets - b.used)), all = tot(books.map((b) => b.sheets));
    const bal = balOf(acc.map((a) => a.id));
    return (
      <>
        <section className="panel flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-start gap-4">
            <BankLogo name={hubBank.name} className="size-14 rounded-[16px]" />
            <div className="min-w-[220px] flex-1">
              <button onClick={() => setHub(null)} className="flex items-center gap-1 text-[12px] font-bold text-muted-foreground hover:text-primary"><ChevronRight className="size-3.5" /> {tab === "home" ? "نمای کلی" : "بانک‌ها"}</button>
              <h2 className="mt-0.5 text-[20px] font-extrabold">{hubBank.name}</h2>
              <p className="num mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                <span>کد {hubBank.code}</span><span>{hubBank.type}</span>
                {hubBank.swift && <span dir="ltr" className="font-mono">{hubBank.swift}</span>}
                {hubBank.name2 && <span dir="ltr">{hubBank.name2}</span>}
                {hubBank.used && <span className="flex items-center gap-1"><Lock className="size-3.5" /> در حال استفاده</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEdit({ tab: "banks", id: hubBank.id })}><PencilLine /> ویرایش بانک</Button>
              <Button variant="outline" onClick={() => setEdit({ tab: "branches", id: null, bank: hubBank.id })}><Add /> شعبه‌ی جدید</Button>
              <Button onClick={() => setEdit({ tab: "accounts", id: null, bank: hubBank.id })}><Add /> افتتاح حساب</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="مانده‌ی حساب‌ها" value={acc.length ? short(bal, "rial").n : "—"} unit={acc.length ? `${short(bal, "rial").s} ریال` : undefined} icon={Wallet3} tone="blue" bars={acc.map((a) => BAL[a.id] ?? 0)} />
            <StatCard label="حساب‌ها" value={toFa(acc.length)} icon={Card} tone="violet" sub={[...new Set(acc.map((a) => a.type))].join("، ") || "حسابی ندارد"} />
            <StatCard label="شعبه‌ها" value={toFa(br.length)} icon={Building2} tone="teal" sub={[...new Set(br.map((r) => r.city))].join("، ") || "شعبه‌ای ندارد"} />
            <StatCard label="برگ چک باقی‌مانده" value={toFa(left)} unit={all ? `از ${toFa(all)}` : undefined} icon={Receipt1} tone="sky" progress={all ? left / all : undefined} />
          </div>
        </section>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="panel flex min-w-0 flex-col gap-3 p-5">
            <h3 className="text-[15px] font-extrabold">حساب‌های این بانک</h3>
            <DataTable caption="حساب‌ها" rowKey={(a) => a.id} rows={acc} onRow={(a) => setEdit({ tab: "accounts", id: a.id })} empty={<Empty icon={Card} title="حسابی در این بانک ندارید" />}
              columns={[
                { key: "name", label: "حساب", render: (a) => <span><b className="block">{a.name}</b><span className="text-[11.5px] text-muted-foreground">{branches.find((r) => r.id === a.branch)?.name} · {a.type}</span></span> },
                { key: "no", label: "شماره", hide: "md", render: (a) => <span dir="ltr">{a.no}</span> },
                { key: "bal", label: "مانده (ریال)", align: "end", render: (a) => <b>{group(BAL[a.id] ?? 0)}</b> },
              ] as Column<Account>[]} />
            {books.length > 0 && (
              <>
                <h3 className="mt-2 text-[15px] font-extrabold">دسته‌چک‌ها</h3>
                <ul className="grid gap-2 sm:grid-cols-2">{books.map((b) => (
                  <li key={b.serial} className="rounded-field border border-border bg-surface/60 p-3">
                    <div className="num flex items-center justify-between text-[12.5px]"><b>سری {b.serial}</b><span className="text-muted-foreground">{b.acc.name}</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-ch-1" style={{ width: `${(b.used / b.sheets) * 100}%` }} /></div>
                    <div className="num mt-1.5 flex justify-between text-[11.5px] text-muted-foreground"><span>{toFa(b.used)} برگ مصرف‌شده</span><span>{toFa(b.sheets - b.used)} برگ مانده · {boxes.find((x) => x.id === b.box)?.name}</span></div>
                  </li>))}</ul>
              </>
            )}
          </section>
          <section className="panel flex flex-col gap-3 p-5">
            <h3 className="text-[15px] font-extrabold">شعبه‌ها</h3>
            {br.length ? <ul className="flex flex-col gap-2">{br.map((r) => (
              <li key={r.id}>
                <button onClick={() => setEdit({ tab: "branches", id: r.id })} className="flex w-full items-start gap-3 rounded-field border border-border bg-surface/60 p-3 text-start hover:border-primary/40">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ch-2/15 text-ch-2"><Building2 className="size-[18px]" variant="Bulk" /></span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[13.5px]">{r.name} <span className="num text-[11.5px] font-normal text-muted-foreground">· کد {r.code}</span></b>
                    <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><Location className="size-3.5" />{r.city}، {r.address}</span>
                    <span className="num flex items-center gap-1 text-[12px] text-muted-foreground" dir="rtl"><Call className="size-3.5" />{r.phone} · {toFa(acc.filter((a) => a.branch === r.id).length)} حساب</span>
                  </span>
                </button>
              </li>))}</ul> : <Empty icon={Building2} title="شعبه‌ای تعریف نشده" />}
          </section>
        </div>
        <BankDocs bankName={hubBank.name} variant="table" />
        {edit && forms[edit.tab]}
      </>
    );
  }

  return (
    <>
      <section className="panel flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-primary-soft text-primary"><TitleIcon className="size-6" variant="Bulk" /></span>
          <div className="min-w-[220px] flex-1">
            <p className="text-[12px] font-bold text-muted-foreground">اطلاعات پایه</p>
            <h2 className="text-[19px] font-extrabold">{title}</h2>
            <p className="mt-0.5 max-w-2xl text-[12.5px] text-muted-foreground">
              {{ home: "همه‌ی اطلاعات پایه‌ی خزانه در یک نگاه. روی هر بانک بزنید تا شعبه‌ها، حساب‌ها و دسته‌چک‌هایش را ببینید.", banks: "بانکی که در حساب‌ها استفاده شده باشد، نامش ثابت می‌ماند و حذف نمی‌شود.", branches: "هر حساب بانکی به یک شعبه وصل است.", accounts: "حساب بانکی پس از تعریف بانک و شعبه افتتاح می‌شود؛ دسته‌چک و کد تفصیلی هم همین‌جاست.", boxes: "هر صندوق فیزیکی یک صندوق در سیستم دارد؛ دسته‌چک‌ها و چک‌های دریافتی هم در صندوق نگهداری می‌شوند.", currency: "نرخ هر ارز با تاریخ اثر ثبت می‌شود و در اسناد ارزی، آخرین نرخ پیش از تاریخ سند پیشنهاد می‌شود." }[tab]}
            </p>
          </div>
          {tab === "home" && <Button variant="outline" onClick={() => setBaseTab("coding")}><Hierarchy /> کدینگ حساب‌ها</Button>}
          <Button onClick={() => setEdit({ tab, id: null })}><Add /> {addLabel[tab]}</Button>
        </div>
        <div className={cn("grid gap-3", stats[tab].length > 3 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3")}>
          {stats[tab].map((x) => <StatCard key={x.l} label={x.l} value={x.v} unit={x.u} sub={x.sub} icon={x.i} tone={x.t} progress={x.p} />)}
        </div>
      </section>
      {tab === "home" ? homeGrid : (
      <section className="panel flex min-w-0 flex-col gap-4 p-5">
        {tab !== "currency" && (
          <label className="relative block max-w-sm">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`جست‌وجو در ${title}`} aria-label="جست‌وجو" className="ps-9" />
          </label>
        )}
        {tables[tab]}
      </section>
      )}
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

function BranchForm({ rec, bank, banks, onSave, onCancel }: { rec?: Branch; bank?: string; banks: BankRec[]; onSave: (r: Branch) => void; onCancel: () => void }) {
  const [r, setR] = React.useState<Branch>(rec ?? { id: `r${Date.now()}`, bank: bank ?? banks[0]?.id ?? "", name: "", code: "", city: "", phone: "", address: "" });
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

function AccountForm({ rec, bank, banks, branches, boxes, nextTafsili, onSave, onCancel }: { rec?: Account; bank?: string; banks: BankRec[]; branches: Branch[]; boxes: Box[]; nextTafsili: string; onSave: (a: Account) => void; onCancel: () => void }) {
  const [a, setA] = React.useState<Account>(rec ?? { id: `a${Date.now()}`, bank: bank ?? banks[0]?.id ?? "", branch: "", name: "", no: "", type: "جاری", cheque: false, books: [], currency: "ریال", template: `BNK-${String(10 + Math.floor(Math.random() * 80))}`, tafsili: nextTafsili, party: "—" });
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
      <Field label="موجودی اولیه" hint={rate && code !== "IRR" ? `معادل ${group(Math.round(b.opening * rate))} ریال با نرخ ${group(rate)}` : undefined}>
        {rate && code !== "IRR"
          ? <Input dir="ltr" inputMode="numeric" value={group(b.opening)} onChange={(e) => setB({ ...b, opening: parseInt(toEn(e.target.value).replace(/\D/g, "") || "0", 10) })} className="num text-left font-bold" />
          : <AmountInput label="موجودی اولیه به ریال" value={b.opening} onChange={(v) => setB({ ...b, opening: v })} />}
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
      <Field label="نرخ به ریال"><AmountInput label="نرخ به ریال" value={r.rate} onChange={(v) => setR({ ...r, rate: v })} autoFocus /></Field>
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
          <Field label="مبلغ به ارز عملیاتی (ریال)" hint={rial ? tomanLine(rial) : undefined}><Input dir="ltr" value={group(rial)} readOnly={fixed === "rial"} onChange={(e) => { const v = num(e.target.value); if (fixed === "amount" && amount) setRate(Math.round(v / amount)); else if (rate) setAmount(Math.round(v / rate)); }} className={cn("num text-left font-bold", fixed === "rial" && "bg-muted/60")} /></Field>
          <Field label="عامل ثابت" hint="فیلدی که هنگام تغییر دو فیلد دیگر قفل می‌ماند"><SimpleSelect label="عامل ثابت" value={fixed} onChange={(v) => setFixed(v as typeof fixed)} options={[["rial", "مبلغ به ارز عملیاتی"], ["rate", "نرخ"], ["amount", "مبلغ"]]} /></Field>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   «دستیار» concept: an explorer. A tree of every bank, branch, account and box on the side,
   a question box on top, and visual cards in place of tables.
   ===================================================================== */
const BANK_TONE: Record<string, string> = { b1: "--ch-1", b2: "--ch-3", b3: "--ch-2", b4: "--ch-4", b5: "--ch-6" };
const toneOf = (bank: string) => BANK_TONE[bank] ?? "--ch-5";
const amt = (r: number) => `${short(r, "rial").n} ${short(r, "rial").s}`;

type AssistProps = {
  tab: Tab; banks: BankRec[]; branches: Branch[]; accounts: Account[]; boxes: Box[]; rates: Rate[];
  hub: string | null; setHub: (id: string | null) => void;
  setEdit: (e: { tab: Tab; id: string | null; bank?: string }) => void;
  setTab: (t: Tab) => void; addLabel: string; form: React.ReactNode;
};

function AssistBase({ tab, banks, branches, accounts, boxes, rates, hub, setHub, setEdit, setTab, addLabel, form }: AssistProps) {
  const { setBaseTab } = useApp();
  const [open, setOpen] = React.useState<string[]>(["b1"]);
  const [ask, setAsk] = React.useState("");
  const [answer, setAnswer] = React.useState<{ text: string; ids?: string[] } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const bankName = (id: string) => banks.find((b) => b.id === id)?.name ?? "—";
  const balOf = (ids: string[]) => ids.reduce((x, id) => x + (BAL[id] ?? 0), 0);

  // a tiny rule-based reader: enough to show the idea of asking the base data a question
  const run = (s = ask) => {
    const t = s.trim(); if (!t) return;
    setAsk(t); setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      const bank = banks.find((b) => t.includes(b.name.replace("بانک ", "").replace("‌ی", "")) || t.includes(b.name));
      if (/دسته.?چک|چک/.test(t)) {
        const xs = accounts.filter((a) => a.cheque && (!bank || a.bank === bank.id));
        const left = xs.flatMap((a) => a.books).reduce((x, b) => x + b.sheets - b.used, 0);
        setTab("accounts"); setAnswer({ text: `${toFa(xs.length)} حساب${bank ? ` در ${bank.name}` : ""} دسته‌چک دارد و ${toFa(left)} برگ چک باقی مانده است.`, ids: xs.map((a) => a.id) });
      } else if (bank) {
        setHub(bank.id); setOpen((x) => [...new Set([...x, bank.id])]);
      } else if (/صندوق|تنخواه/.test(t)) {
        setTab("boxes"); setAnswer({ text: `${toFa(boxes.length)} صندوق دارید با موجودی اولیه‌ی ${amt(boxes.reduce((x, b) => x + b.opening, 0))} ریال.` });
      } else if (/نرخ|دلار|یورو|درهم|ارز/.test(t)) {
        setTab("currency"); setAnswer({ text: `آخرین نرخ دلار ${group(rates.find((r) => r.cur === "USD")?.rate ?? 0)} ریال است (${rates[0]?.date}).` });
      } else if (/شعبه|شهر/.test(t)) {
        setTab("branches"); setAnswer({ text: `${toFa(branches.length)} شعبه در ${toFa(new Set(branches.map((r) => r.city)).size)} شهر دارید.` });
      } else if (/مانده|موجودی|حساب/.test(t)) {
        setTab("accounts"); setAnswer({ text: `مانده‌ی همه‌ی حساب‌های بانکی ${amt(balOf(accounts.map((a) => a.id)))} ریال است؛ بیشترینش در ${bankName([...accounts].sort((a, b) => (BAL[b.id] ?? 0) - (BAL[a.id] ?? 0))[0].bank)}.` });
      } else setAnswer({ text: "این را هنوز بلد نیستم. مثلاً بپرسید «حساب‌های ملت با دسته‌چک» یا «نرخ دلار»." });
    }, 420);
  };

  const hubBank = banks.find((b) => b.id === hub);
  const accountCard = (a: Account) => {
    const c = toneOf(a.bank);
    const left = a.books.reduce((x, b) => x + b.sheets - b.used, 0), all = a.books.reduce((x, b) => x + b.sheets, 0);
    return (
      <button key={a.id} onClick={() => setEdit({ tab: "accounts", id: a.id })} className={cn("group relative isolate flex min-h-[168px] flex-col overflow-hidden rounded-[18px] p-4 text-start text-white shadow-soft transition-transform hover:-translate-y-0.5", answer?.ids && !answer.ids.includes(a.id) && "opacity-40")}
        style={{ background: `linear-gradient(135deg, hsl(var(${c})) 0%, hsl(var(${c}) / .78) 55%, hsl(var(${c}) / .6) 100%)` }}>
        <span aria-hidden className="absolute -end-10 -top-12 -z-10 size-40 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-16 -start-6 -z-10 size-40 rounded-full bg-white/10" />
        <span className="flex items-center gap-2.5 text-[12px] font-semibold text-white/85"><BankLogo name={bankName(a.bank)} className="ring-0 shadow-soft" />{bankName(a.bank)}<span className="ms-auto self-start rounded-full bg-white/20 px-2 py-0.5 text-[11px]">{a.type}</span></span>
        <b className="mt-2 text-[15px]">{a.name}</b>
        <span dir="ltr" className="num mt-1 text-end font-mono text-[14px] tracking-[0.12em] text-white/90">{a.no.replace(/(.{4})/g, "$1 ").trim()}</span>
        <span className="num mt-auto flex items-end justify-between gap-2 pt-3">
          <span><span className="block text-[11px] text-white/75">مانده</span><b className="text-[17px]">{group(BAL[a.id] ?? 0)}</b> <span className="text-[11px] text-white/75">ریال</span></span>
          {a.cheque && <span className="text-end text-[11px] text-white/80">{toFa(left)} از {toFa(all)} برگ<span className="mt-1 block h-1 w-20 overflow-hidden rounded-full bg-white/25"><i className="block h-full rounded-full bg-white" style={{ width: `${(left / Math.max(all, 1)) * 100}%` }} /></span></span>}
        </span>
      </button>
    );
  };

  const views: Record<Tab, React.ReactNode> = {
    home: (
      <>
        <section className="panel p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><Sparkles className="size-4 text-ai" /> خلاصه‌ی دستیار</h3>
          <ul className="num flex flex-col gap-2.5 text-[13.5px]">
            <li className="flex gap-2"><i className="mt-2 size-1.5 shrink-0 rounded-full bg-ch-1" />مانده‌ی کل حساب‌های بانکی <b>{amt(balOf(accounts.map((a) => a.id)))} ریال</b> است و {toFa(Math.round(((BAL.a2 ?? 0) / Math.max(balOf(accounts.map((a) => a.id)), 1)) * 100))}٪ آن در پارسیان جاری است.</li>
            {accounts.filter((a) => a.books.some((b) => b.used / b.sheets > 0.5)).slice(0, 1).map((a) => (
              <li key={a.id} className="flex gap-2"><i className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />دسته‌چک «{a.name}» بیش از نیمه مصرف شده؛ برای سفارش دسته‌چک بعدی وقت خوبی است.</li>
            ))}
            <li className="flex gap-2"><i className="mt-2 size-1.5 shrink-0 rounded-full bg-ch-2" />{toFa(banks.filter((b) => !b.used).length)} بانک تعریف شده ولی هنوز حسابی در آن‌ها ندارید.</li>
          </ul>
        </section>
        <section className="flex flex-col gap-3">
          <h3 className="px-1 text-[15px] font-extrabold">حساب‌های بانکی</h3>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{accounts.map(accountCard)}</div>
        </section>
      </>
    ),
    banks: (
      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {banks.map((b) => {
          const c = toneOf(b.id), acc = accounts.filter((a) => a.bank === b.id);
          return (
            <button key={b.id} onClick={() => setHub(b.id)} className="panel group flex flex-col overflow-hidden p-0 text-start transition-shadow hover:shadow-lift">
              <span className="flex items-center gap-3 p-4" style={{ background: `linear-gradient(135deg, hsl(var(${c}) / .18), transparent)` }}>
                <BankLogo name={b.name} />
                <span className="min-w-0 flex-1"><b className="block truncate text-[15px]">{b.name}</b><span className="num text-[11.5px] text-muted-foreground">کد {b.code} · {b.type}</span></span>
                {b.used && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground" title="در حساب‌ها استفاده شده؛ نامش ثابت می‌ماند و حذف نمی‌شود">در حال استفاده</span>}
              </span>
              <span className="num flex items-center justify-between gap-2 border-t border-border/70 px-4 py-3 text-[12.5px] text-muted-foreground">
                <span>{toFa(branches.filter((r) => r.bank === b.id).length)} شعبه · {toFa(acc.length)} حساب</span>
                <b className="text-foreground">{acc.length ? `${amt(balOf(acc.map((a) => a.id)))} ریال` : "—"}</b>
              </span>
            </button>
          );
        })}
      </div>
    ),
    branches: (
      <div className="flex flex-col gap-4">
        {[...new Set(branches.map((r) => r.city))].map((city) => (
          <section key={city} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 px-1 text-[14px] font-extrabold"><Location className="size-4 text-primary" variant="Bulk" />{city}<span className="num text-[12px] font-medium text-muted-foreground">{toFa(branches.filter((r) => r.city === city).length)} شعبه</span></h3>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {branches.filter((r) => r.city === city).map((r) => (
                <button key={r.id} onClick={() => setEdit({ tab: "branches", id: r.id })} className="panel flex flex-col gap-2 p-4 text-start transition-shadow hover:shadow-lift" style={{ boxShadow: `inset -3px 0 0 hsl(var(${toneOf(r.bank)}))` }}>
                  <span className="text-[11.5px] font-bold" style={{ color: `hsl(var(${toneOf(r.bank)}))` }}>{bankName(r.bank)}</span>
                  <b className="text-[14.5px]">{r.name} <span className="num text-[12px] font-normal text-muted-foreground">کد {r.code}</span></b>
                  <span className="text-[12px] text-muted-foreground">{r.address}</span>
                  <span className="num flex items-center gap-1 text-[12px] text-muted-foreground"><Call className="size-3.5" />{r.phone} · {toFa(accounts.filter((a) => a.branch === r.id).length)} حساب</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    ),
    accounts: <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{accounts.map(accountCard)}</div>,
    boxes: (
      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {boxes.map((x) => (
          <button key={x.id} onClick={() => setEdit({ tab: "boxes", id: x.id })} className="panel flex flex-col gap-3 p-4 text-start transition-shadow hover:shadow-lift">
            <span className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-[14px] bg-ch-2/15 text-ch-2"><EmptyWallet className="size-6" variant="Bulk" /></span>
              <span className="min-w-0 flex-1"><b className="block truncate text-[15px]">{x.name}</b><span className="text-[12px] text-muted-foreground">{x.place}</span></span>
              <Badge tone={x.active ? "success" : "neutral"}>{x.active ? "فعال" : "غیرفعال"}</Badge>
            </span>
            <span className="num flex items-end justify-between gap-2 rounded-field bg-muted/50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-[12.5px]"><span className="grid size-7 place-items-center rounded-full bg-primary-soft text-[12px] font-bold text-primary">{x.cashier[0]}</span>{x.cashier}</span>
              <span className="text-end"><b className="block text-[14px]">{group(x.opening)} <span className="text-[11px] font-normal text-muted-foreground">ریال</span></b><span className="text-[11px] text-muted-foreground">{tomanLine(x.opening)}</span></span>
            </span>
          </button>
        ))}
      </div>
    ),
    currency: (
      <>
        <div className="grid gap-3 sm:grid-cols-3">
          {CURRENCIES.slice(1).map(([n, code]) => {
            const r = rates.find((x) => x.cur === code);
            return (
              <div key={code} className="panel flex flex-col gap-2 p-4">
                <span className="flex items-center gap-2"><span dir="ltr" className="grid h-8 min-w-12 place-items-center rounded-[10px] bg-primary-soft px-2 text-[12px] font-extrabold text-primary">{code}</span><b className="text-[14px]">{n}</b></span>
                <b className="num text-[22px] font-extrabold tracking-tight">{r ? group(r.rate) : "—"} <span className="text-[12px] font-normal text-muted-foreground">ریال</span></b>
                <span className="num text-[12px] text-muted-foreground">{r ? `${tomanLine(r.rate)} · ${r.date}` : "نرخی ثبت نشده"}</span>
              </div>
            );
          })}
        </div>
        <section className="panel p-5"><CurrencyTab rates={rates} /></section>
      </>
    ),
  };

  return (
    <>
      <section className="hero p-5">
        <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex flex-wrap items-center gap-3">
          <Orb size={40} busy={busy} />
          <div className="relative min-w-[220px] flex-1">
            <Input value={ask} onChange={(e) => setAsk(e.target.value)} aria-label="پرسش از اطلاعات پایه" placeholder="از اطلاعات پایه بپرسید؛ مثلاً «حساب‌های ملت با دسته‌چک»" className="h-12 pe-10 text-[14.5px]" />
            <Search className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button type="submit" className="h-11" disabled={!ask.trim()}>بپرس</Button>
          <Button type="button" variant="outline" className="h-11" onClick={() => setEdit({ tab: tab === "home" ? "banks" : tab, id: null })}><Add /> {addLabel}</Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 ps-[52px]">
          {answer ? (
            <>
              <span className="num text-[13px] font-semibold">{answer.text}</span>
              <button onClick={() => { setAnswer(null); setAsk(""); }} className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"><X className="size-3.5" /> پاک کردن</button>
            </>
          ) : ["حساب‌های ملت با دسته‌چک", "مانده‌ی حساب‌ها", "نرخ دلار", "صندوق‌ها"].map((s) => <button key={s} onClick={() => run(s)} className="chip h-7 bg-surface text-[12px]">{s}</button>)}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="panel flex h-fit flex-col gap-1 p-3 lg:sticky lg:top-4" aria-label="درخت اطلاعات پایه">
          <button onClick={() => { setAnswer(null); setHub(null); setTab("home"); }} className={cn("flex h-9 items-center gap-2 rounded-field px-2.5 text-[13px] font-bold hover:bg-muted", tab === "home" && !hub && "bg-primary-soft text-primary hover:bg-primary-soft")}><Category2 className="size-4" variant={tab === "home" && !hub ? "Bulk" : "Linear"} /> نمای کلی</button>
          <p className="mt-2 px-2.5 text-[11.5px] font-bold text-muted-foreground">بانک‌ها</p>
          {banks.map((b) => {
            const isOpen = open.includes(b.id);
            const br = branches.filter((r) => r.bank === b.id);
            return (
              <div key={b.id}>
                <div className={cn("flex h-14 items-center rounded-field hover:bg-muted", hub === b.id && "bg-primary-soft text-primary hover:bg-primary-soft")}>
                  <button aria-label={isOpen ? `بستن ${b.name}` : `باز کردن ${b.name}`} aria-expanded={isOpen} onClick={() => setOpen((x) => (isOpen ? x.filter((y) => y !== b.id) : [...x, b.id]))} className="grid size-7 place-items-center text-muted-foreground" disabled={!br.length}>
                    {br.length ? <ChevronLeft className={cn("size-3.5 transition-transform", isOpen && "-rotate-90")} /> : <i className="size-1 rounded-full bg-border" />}
                  </button>
                  <button onClick={() => { setAnswer(null); setHub(b.id); }} className="flex min-w-0 flex-1 items-center gap-2 pe-2 text-start text-[13px] font-semibold">
                    <BankLogo name={b.name} className="rounded-[12px]" /><span className="truncate">{b.name}</span>
                    <span className="num ms-auto text-[11px] text-muted-foreground">{toFa(accounts.filter((a) => a.bank === b.id).length)}</span>
                  </button>
                </div>
                {isOpen && br.length > 0 && (
                  <ul className="ms-[18px] border-s border-border/80 ps-2">
                    {br.map((r) => (
                      <li key={r.id}>
                        <button onClick={() => setEdit({ tab: "branches", id: r.id })} className="flex h-8 w-full items-center gap-1.5 rounded-field px-2 text-[12.5px] text-muted-foreground hover:bg-muted hover:text-foreground"><Building2 className="size-3.5" />{r.name}</button>
                        {accounts.filter((a) => a.branch === r.id).map((a) => (
                          <button key={a.id} onClick={() => setEdit({ tab: "accounts", id: a.id })} className="ms-4 flex h-7 w-[calc(100%-1rem)] items-center gap-1.5 rounded-field px-2 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground"><Card className="size-3.5" /><span className="truncate">{a.name}</span></button>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          <div className="my-2 border-t border-border/70" />
          {([["branches", "شعبه‌ها", Building2, branches.length], ["accounts", "حساب‌های بانکی", Card, accounts.length], ["boxes", "صندوق‌ها", EmptyWallet, boxes.length], ["currency", "ارزها و نرخ‌ها", MoneyChange, rates.length]] as [Tab, string, IconType, number][]).map(([k, l, I, n]) => (
            <button key={k} onClick={() => { setAnswer(null); setHub(null); setTab(k); }} className={cn("flex h-9 items-center gap-2 rounded-field px-2.5 text-[13px] font-semibold hover:bg-muted", tab === k && !hub && "bg-primary-soft text-primary hover:bg-primary-soft")}>
              <I className="size-4" variant={tab === k && !hub ? "Bulk" : "Linear"} />{l}<span className="num ms-auto text-[11px] text-muted-foreground">{toFa(n)}</span>
            </button>
          ))}
          <div className="my-2 border-t border-border/70" />
          <button onClick={() => setBaseTab("coding")} className="flex h-9 items-center gap-2 rounded-field px-2.5 text-[13px] font-semibold hover:bg-muted"><Hierarchy className="size-4" />کدینگ حساب‌ها<span className="ms-auto text-[11px] text-muted-foreground">کل · معین · تفصیلی</span></button>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          {hubBank ? (() => {
            const c = toneOf(hubBank.id);
            const acc = accounts.filter((a) => a.bank === hubBank.id), br = branches.filter((r) => r.bank === hubBank.id);
            return (
              <>
                <section className="panel relative isolate overflow-hidden p-5">
                  <span aria-hidden className="absolute inset-0 -z-10" style={{ background: `linear-gradient(120deg, hsl(var(${c}) / .2), transparent 60%)` }} />
                  <div className="flex flex-wrap items-center gap-4">
                    <BankLogo name={hubBank.name} className="size-14 rounded-[16px]" />
                    <div className="min-w-[200px] flex-1">
                      <h2 className="text-[20px] font-extrabold">{hubBank.name}</h2>
                      <p className="num text-[12.5px] text-muted-foreground">کد {hubBank.code} · {hubBank.type}{hubBank.swift ? ` · ${hubBank.swift}` : ""}</p>
                    </div>
                    <div className="num text-end"><span className="block text-[12px] text-muted-foreground">مانده‌ی حساب‌ها</span><b className="text-[22px] font-extrabold">{acc.length ? amt(balOf(acc.map((a) => a.id))) : "—"}</b> <span className="text-[12px] text-muted-foreground">{acc.length ? "ریال" : ""}</span></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => setEdit({ tab: "accounts", id: null, bank: hubBank.id })}><Add /> افتتاح حساب</Button>
                    <Button variant="outline" onClick={() => setEdit({ tab: "branches", id: null, bank: hubBank.id })}><Add /> شعبه‌ی جدید</Button>
                    <Button variant="ghost" onClick={() => setEdit({ tab: "banks", id: hubBank.id })}><PencilLine /> ویرایش بانک</Button>
                  </div>
                </section>
                <section className="flex flex-col gap-3">
                  <h3 className="px-1 text-[15px] font-extrabold">حساب‌ها <span className="num text-[12px] font-medium text-muted-foreground">{toFa(acc.length)}</span></h3>
                  {acc.length ? <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{acc.map(accountCard)}</div> : <div className="panel"><Empty icon={Card} title="حسابی در این بانک ندارید" action={<Button size="sm" variant="soft" onClick={() => setEdit({ tab: "accounts", id: null, bank: hubBank.id })}>افتتاح حساب</Button>} /></div>}
                </section>
                <BankDocs bankName={hubBank.name} variant="feed" />
                <section className="flex flex-col gap-3">
                  <h3 className="px-1 text-[15px] font-extrabold">شعبه‌ها <span className="num text-[12px] font-medium text-muted-foreground">{toFa(br.length)}</span></h3>
                  {br.length ? (
                    <ol className="panel relative flex flex-col gap-0 p-4">
                      {br.map((r, i) => (
                        <li key={r.id} className="relative flex gap-3 pb-4 last:pb-0">
                          {i < br.length - 1 && <span aria-hidden className="absolute start-[15px] top-8 h-[calc(100%-24px)] w-px bg-border" />}
                          <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `hsl(var(${c}) / .16)`, color: `hsl(var(${c}))` }}><Building2 className="size-4" variant="Bulk" /></span>
                          <button onClick={() => setEdit({ tab: "branches", id: r.id })} className="min-w-0 flex-1 text-start">
                            <b className="block text-[14px]">{r.name} <span className="num text-[12px] font-normal text-muted-foreground">· {r.city} · کد {r.code}</span></b>
                            <span className="num block text-[12px] text-muted-foreground">{r.address} · {r.phone}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  ) : <div className="panel"><Empty icon={Building2} title="شعبه‌ای تعریف نشده" /></div>}
                </section>
              </>
            );
          })() : views[tab]}
        </div>
      </div>
      {form}
    </>
  );
}
