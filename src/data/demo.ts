import { fmtDay } from "@/lib/jalali";
// All figures are synthetic demo data for the design concept.

export type AccountGroup = { id: string; label: string; path: string };
export type Account = { code: string; name: string; group: string; nature: "بدهکار" | "بستانکار" };

export const groups: AccountGroup[] = [
  { id: "cash", label: "بانک و صندوق", path: "دارایی‌های جاری › موجودی نقد" },
  { id: "ar", label: "مشتریان", path: "دارایی‌های جاری › دریافتنی‌های تجاری" },
  { id: "notes", label: "چک‌های دریافتنی", path: "دارایی‌های جاری › اسناد دریافتنی" },
  { id: "ap", label: "تأمین‌کنندگان", path: "بدهی‌های جاری › پرداختنی‌های تجاری" },
  { id: "tax", label: "مالیات و بیمه", path: "بدهی‌های جاری › مالیات و بیمه‌ی پرداختنی" },
  { id: "loan", label: "وام و تسهیلات", path: "بدهی‌ها › تسهیلات مالی" },
  { id: "rev", label: "درآمد", path: "درآمدهای عملیاتی" },
  { id: "exp", label: "هزینه‌ها", path: "هزینه‌های عملیاتی" },
];

export const accounts: Account[] = [
  { code: "1-101-100001", name: "بانک پارسیان · جاری ۴۴۱۰", group: "cash", nature: "بدهکار" },
  { code: "1-101-100003", name: "بانک پارسیان · سپرده ۹۱۰۲", group: "cash", nature: "بدهکار" },
  { code: "1-101-100002", name: "بانک ملت · جاری ۸۸۲۰", group: "cash", nature: "بدهکار" },
  { code: "1-101-100010", name: "صندوق مرکزی", group: "cash", nature: "بدهکار" },
  { code: "1-101-100020", name: "تنخواه دفتر مرکزی", group: "cash", nature: "بدهکار" },
  { code: "1-103-300014", name: "پتروشیمی مارون", group: "ar", nature: "بدهکار" },
  { code: "1-103-300021", name: "فولاد مبارکه", group: "ar", nature: "بدهکار" },
  { code: "1-103-300030", name: "پخش البرز", group: "ar", nature: "بدهکار" },
  { code: "1-103-300042", name: "سیمان تهران", group: "ar", nature: "بدهکار" },
  { code: "1-104-310001", name: "چک‌های در جریان وصول", group: "notes", nature: "بدهکار" },
  { code: "3-301-500007", name: "تکین‌کو", group: "ap", nature: "بستانکار" },
  { code: "3-301-500012", name: "حمل‌ونقل آریا", group: "ap", nature: "بستانکار" },
  { code: "3-301-500019", name: "کاغذ و بسته‌بندی نوین", group: "ap", nature: "بستانکار" },
  { code: "3-305-520001", name: "مالیات بر ارزش افزوده", group: "tax", nature: "بستانکار" },
  { code: "3-305-520002", name: "حق بیمه‌ی پرداختنی", group: "tax", nature: "بستانکار" },
  { code: "3-305-520003", name: "مالیات حقوق", group: "tax", nature: "بستانکار" },
  { code: "3-310-530001", name: "تسهیلات بانک ملت", group: "loan", nature: "بستانکار" },
  { code: "4-401-600001", name: "فروش محصولات", group: "rev", nature: "بستانکار" },
  { code: "4-401-600002", name: "درآمد خدمات", group: "rev", nature: "بستانکار" },
  { code: "6-601-700003", name: "هزینه‌ی حمل‌ونقل", group: "exp", nature: "بدهکار" },
  { code: "6-602-700011", name: "کارمزد بانکی", group: "exp", nature: "بدهکار" },
  { code: "6-605-700020", name: "اجاره‌ی دفتر مرکزی", group: "exp", nature: "بدهکار" },
  { code: "6-606-700030", name: "حقوق و دستمزد", group: "exp", nature: "بدهکار" },
  { code: "6-607-700041", name: "ملزومات اداری", group: "exp", nature: "بدهکار" },
  { code: "6-607-700045", name: "پذیرایی و تشریفات", group: "exp", nature: "بدهکار" },
];

export const accountBy = (code: string | null | undefined) => accounts.find((a) => a.code === code);
export const groupOf = (code: string) => groups.find((g) => g.id === accountBy(code)?.group);

/* ---------- documents ---------- */
export type DocStatus = "draft" | "pending" | "posted";
export type DocKind = "receipt" | "payment" | "transfer" | "cheque" | "general";
export type DocSource = "ai" | "voice" | "file" | "manual";
export type DocLine = { id: number; account: string | null; desc: string; debit: number; credit: number; ai?: boolean };
export type Doc = {
  id: string; seq: number; m: number; d: number; title: string; kind: DocKind; status: DocStatus; source: DocSource;
  lines: DocLine[]; attachments: string[]; by: string; fresh?: boolean; history?: DocEvent[];
};
export type DocEvent = { at: string; who: string; text: string; tone?: "ai" | "ok" | "warn" };

export const kindLabel: Record<DocKind, string> = { receipt: "دریافت", payment: "پرداخت", transfer: "انتقال", cheque: "چک", general: "عمومی" };
export const statusLabel: Record<DocStatus, string> = { draft: "پیش‌نویس", pending: "منتظر تأیید", posted: "تأییدشده" };
export const sourceLabel: Record<DocSource, string> = { ai: "دستیار", voice: "پیام صوتی", file: "از فایل", manual: "دستی" };

let lid = 1000;
const L = (account: string, desc: string, debit: number, credit = 0): DocLine => ({ id: lid++, account, desc, debit, credit });
const pair = (dr: string, cr: string, amount: number, desc: string) => [L(dr, desc, amount), L(cr, desc, 0, amount)];

export const seedDocs: Doc[] = [
  { id: "d42", seq: 42, m: 8, d: 16, title: "دریافت از فولاد مبارکه", kind: "receipt", status: "pending", source: "file", by: "سارا احمدی", attachments: ["فیش-واریز-۰۹۱۲.jpg"], lines: pair("1-101-100002", "1-103-300021", 2_400_000_000, "دریافت از فولاد مبارکه") },
  { id: "d41", seq: 41, m: 8, d: 16, title: "کارمزد خدمات بانکی آبان", kind: "payment", status: "pending", source: "ai", by: "دستیار راستا", attachments: [], lines: pair("6-602-700011", "1-101-100001", 12_000_000, "کارمزد خدمات بانکی") },
  { id: "d40", seq: 40, m: 8, d: 15, title: "کرایه‌ی حمل بار به اصفهان", kind: "payment", status: "posted", source: "voice", by: "علی رضایی", attachments: ["بارنامه-۳۳۱.pdf"], lines: pair("6-601-700003", "1-101-100010", 120_000_000, "کرایه‌ی حمل بار") },
  { id: "d39", seq: 39, m: 8, d: 15, title: "انتقال از سپرده به جاری پارسیان", kind: "transfer", status: "posted", source: "manual", by: "سارا احمدی", attachments: [], lines: pair("1-101-100001", "1-101-100003", 3_000_000_000, "انتقال بین حساب‌ها") },
  { id: "d38", seq: 38, m: 8, d: 14, title: "دریافت از پتروشیمی مارون", kind: "receipt", status: "posted", source: "file", by: "دستیار راستا", attachments: ["فیش-پارسیان-۷۷۲۰.jpg"], lines: pair("1-101-100001", "1-103-300014", 5_000_000_000, "دریافت از پتروشیمی مارون") },
  { id: "d37", seq: 37, m: 8, d: 13, title: "فروش محصولات به پخش البرز", kind: "general", status: "posted", source: "manual", by: "علی رضایی", attachments: ["فاکتور-۱۰۴۲.pdf"], lines: [L("1-103-300030", "فروش طی فاکتور ۱۰۴۲", 3_270_000_000), L("4-401-600001", "فروش طی فاکتور ۱۰۴۲", 0, 3_000_000_000), L("3-305-520001", "ارزش افزوده‌ی فاکتور ۱۰۴۲", 0, 270_000_000)] },
  { id: "d36", seq: 36, m: 8, d: 12, title: "اجاره‌ی دفتر مرکزی آبان", kind: "payment", status: "posted", source: "ai", by: "دستیار راستا", attachments: [], lines: pair("6-605-700020", "1-101-100002", 650_000_000, "اجاره‌ی دفتر مرکزی") },
  { id: "d35", seq: 35, m: 8, d: 10, title: "چک دریافتی سیمان تهران", kind: "cheque", status: "posted", source: "file", by: "سارا احمدی", attachments: ["چک-صیادی-۴۴۰۱.jpg"], lines: pair("1-104-310001", "1-103-300042", 1_800_000_000, "دریافت چک صیادی ۴۴۰۱") },
  { id: "d34", seq: 34, m: 8, d: 9, title: "خرید ملزومات اداری", kind: "payment", status: "draft", source: "manual", by: "علی رضایی", attachments: [], lines: pair("6-607-700041", "1-101-100020", 38_500_000, "خرید ملزومات اداری") },
  { id: "d33", seq: 33, m: 8, d: 8, title: "پرداخت به تکین‌کو", kind: "payment", status: "posted", source: "ai", by: "دستیار راستا", attachments: [], lines: pair("3-301-500007", "1-101-100001", 4_000_000_000, "تسویه‌ی بخشی از بدهی تکین‌کو") },
  { id: "d32", seq: 32, m: 8, d: 5, title: "قسط وام بانک ملت", kind: "payment", status: "posted", source: "manual", by: "سارا احمدی", attachments: [], lines: pair("3-310-530001", "1-101-100002", 850_000_000, "قسط وام") },
  { id: "d31", seq: 31, m: 8, d: 3, title: "پذیرایی جلسه‌ی هیئت‌مدیره", kind: "payment", status: "draft", source: "voice", by: "علی رضایی", attachments: [], lines: pair("6-607-700045", "1-101-100020", 9_200_000, "پذیرایی جلسه") },
];

/* ---------- KPIs (series = last 30 days) ---------- */
const wave = (start: number, end: number, n = 30, wob = 0.04, seed = 1) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const ease = t * t * (3 - 2 * t);
    return +(start + (end - start) * ease + Math.sin(i * 1.7 + seed) * wob * Math.abs(end - start + 1)).toFixed(2);
  });

export const kpis = [
  { id: "cash", label: "موجودی نقد و بانک", rial: 48_250_000_000, delta: 6.2, good: true, today: "امروز ۵ میلیارد آمد", series: wave(36, 48.25, 30, 0.05, 1),
    why: { line: "بیشترِ افزایش از دریافت پتروشیمی مارون است.", parts: [["دریافت پتروشیمی مارون", "+۵ میلیارد"], ["پرداخت به تکین‌کو", "−۴ میلیارد"], ["کارمزد بانکی", "−۱۲ میلیون"]] } },
  { id: "ar", label: "حساب‌های دریافتنی", rial: 12_800_000_000, delta: -2.1, good: false, today: "این هفته ۵۰۰ میلیون کم شد", series: wave(15.2, 12.8, 30, 0.06, 2),
    why: { line: "دو مشتری بزرگ بخشی از بدهی‌شان را دادند.", parts: [["پتروشیمی مارون", "−۵ میلیارد"], ["پخش البرز", "+۳٫۲ میلیارد"]] } },
  { id: "ap", label: "حساب‌های پرداختنی", rial: 9_400_000_000, delta: -4.0, good: true, today: "این ماه ۴ میلیارد کم شد", series: wave(13.4, 9.4, 30, 0.04, 3),
    why: { line: "بخشی از بدهی تکین‌کو تسویه شد.", parts: [["تکین‌کو", "−۴ میلیارد"]] } },
  { id: "pl", label: "سود خالص آبان", rial: 3_150_000_000, delta: 11.0, good: true, today: "امروز ۲۱۰ میلیون بیشتر شد", series: wave(0.2, 3.15, 30, 0.03, 4),
    why: { line: "فروش بیشتر شد و هزینه‌ی حمل ۱۸٪ بالا رفت.", parts: [["فروش محصولات", "+۹۰۰ میلیون"], ["هزینه‌ی حمل‌ونقل", "−۹۲ میلیون"]] } },
] as const;

/* ---------- decisions waiting for the user ---------- */
export type InboxItem = { id: string; kind: "draft" | "check" | "approve" | "close"; title: string; detail: string; primary: string; secondary?: string };
export const inbox: InboxItem[] = [
  { id: "i1", kind: "draft", title: "پیش‌نویس دریافت از پتروشیمی مارون", detail: "از عکس فیش · ۵۰۰ میلیون تومان به پارسیان", primary: "بازبینی" },
  { id: "i2", kind: "approve", title: "۲ سند منتظر تأیید شما", detail: "هر دو از بررسی‌ها سالم گذشته‌اند", primary: "دیدن و تأیید" },
  { id: "i3", kind: "check", title: "احتمال ثبت تکراری", detail: "سند ۰۴۱ با سند ۰۳۶ هم‌مبلغ و هم‌تاریخ است", primary: "مقایسه", secondary: "تکراری نیست" },
  { id: "i4", kind: "close", title: "آبان ۸۰٪ آماده‌ی بستن است", detail: "۳ کار مانده: ۲ پیش‌نویس و ۱ مغایرت بانکی", primary: "کارهای مانده" },
];

/* ---------- cash: 12 days back + 12 days forecast (billion rial) ---------- */
export const cashActual = [38, 39.5, 39, 41, 40.2, 42.8, 43.1, 42.4, 44.9, 46.1, 47.2, 48.25];
export const cashForecast = [48.25, 47.6, 49.1, 50.3, 48.8, 45.9, 44.2, 46.5, 48.7, 50.9, 52.4, 53.1];

/* ---------- calendar ---------- */
/** Built-in categories plus any the user adds from the reminder form. */
export type EventCat = string;
export type CalEvent = { id: string; m: number; d: number; time?: string; title: string; cat: EventCat; amount?: number; done?: boolean; auto?: boolean; note?: string };

export const catMeta: Record<EventCat, { label: string; color: string; custom?: boolean }> = {
  tax: { label: "مالیات و بیمه", color: "var(--ch-5)" },
  cheque: { label: "چک", color: "var(--ch-1)" },
  loan: { label: "وام و قسط", color: "var(--ch-3)" },
  close: { label: "پایان دوره", color: "var(--ch-2)" },
  cash: { label: "نقدینگی", color: "var(--ch-4)" },
  reminder: { label: "یادآوری‌های من", color: "var(--ch-6)" },
};
export const CAT_SWATCHES = ["var(--ch-1)", "var(--ch-2)", "var(--ch-3)", "var(--ch-4)", "var(--ch-5)", "var(--ch-6)"];

export const seedEvents: CalEvent[] = [
  { id: "e1", m: 7, d: 15, title: "اظهارنامه‌ی ارزش افزوده‌ی تابستان", cat: "tax", done: true, auto: true },
  { id: "e2", m: 7, d: 30, title: "لیست بیمه‌ی شهریور", cat: "tax", done: true, auto: true },
  { id: "e3", m: 7, d: 30, title: "مالیات حقوق شهریور", cat: "tax", done: true, auto: true },
  { id: "e4", m: 8, d: 5, title: "قسط وام بانک ملت", cat: "loan", amount: 850_000_000, done: true, auto: true },
  { id: "e5", m: 8, d: 10, title: "وصول چک سیمان تهران", cat: "cheque", amount: 1_800_000_000, done: true, auto: true },
  { id: "e6", m: 8, d: 12, title: "اجاره‌ی دفتر مرکزی", cat: "reminder", amount: 650_000_000, done: true },
  { id: "e7", m: 8, d: 17, time: "۰۹:۳۰", title: "جلسه‌ی بودجه‌ی زمستان", cat: "reminder", done: true },
  { id: "e8", m: 8, d: 17, time: "۱۱:۰۰", title: "سررسید چک تکین‌کو", cat: "cheque", amount: 1_200_000_000, auto: true, note: "موجودی بانک ملت کافی است" },
  { id: "e9", m: 8, d: 17, time: "۱۶:۰۰", title: "پیگیری مانده‌ی بانک ملت", cat: "reminder" },
  { id: "e10", m: 8, d: 19, time: "۱۰:۰۰", title: "جلسه با حسابرس", cat: "reminder" },
  { id: "e11", m: 8, d: 22, title: "کمترین موجودی نقد این ماه", cat: "cash", amount: 44_200_000_000, auto: true, note: "حقوق و بیمه هم‌زمان پرداخت می‌شوند" },
  { id: "e12", m: 8, d: 25, title: "وصول چک پخش البرز", cat: "cheque", amount: 950_000_000, auto: true },
  { id: "e13", m: 8, d: 28, title: "پرداخت حقوق آبان", cat: "close", amount: 3_800_000_000, auto: true },
  { id: "e14", m: 8, d: 30, title: "لیست بیمه‌ی مهر", cat: "tax", amount: 1_100_000_000, auto: true, note: "چک‌لیست آماده است" },
  { id: "e15", m: 8, d: 30, title: "مالیات حقوق مهر", cat: "tax", amount: 420_000_000, auto: true },
  { id: "e16", m: 8, d: 30, title: "پایان دوره‌ی مالی آبان", cat: "close", auto: true },
  { id: "e17", m: 9, d: 5, title: "قسط وام بانک ملت", cat: "loan", amount: 850_000_000, auto: true },
  { id: "e18", m: 9, d: 12, title: "سررسید ضمانت‌نامه‌ی حسن انجام کار", cat: "loan", auto: true },
  { id: "e19", m: 9, d: 30, title: "لیست بیمه‌ی آبان", cat: "tax", auto: true },
  { id: "e20", m: 9, d: 30, title: "مالیات حقوق آبان", cat: "tax", auto: true },
  { id: "e21", m: 10, d: 5, title: "قسط وام بانک ملت", cat: "loan", amount: 850_000_000, auto: true },
  { id: "e22", m: 10, d: 15, title: "اظهارنامه‌ی ارزش افزوده‌ی پاییز", cat: "tax", auto: true },
];

/** A believable trail for the seed documents: who made it, how, and what happened next. */
export function seedHistory(d: Doc): DocEvent[] {
  const day = fmtDay(d.m, d.d);
  const how = d.source === "file" ? "از روی فایل پیوست ساخته شد" : d.source === "voice" ? "از پیام صوتی ساخته شد" : d.source === "ai" ? "دستیار پیش‌نویس را ساخت" : "به‌صورت دستی وارد شد";
  const h: DocEvent[] = [{ at: `${day} · ۰۹:۱۲`, who: d.by, text: how, tone: d.source === "manual" ? undefined : "ai" }];
  h.push({ at: `${day} · ۰۹:۱۳`, who: "بررسی سند", text: "تراز، حساب‌ها و تکراری‌بودن بررسی شد", tone: "ok" });
  if (d.status !== "draft") h.push({ at: `${day} · ۰۹:۱۵`, who: d.by, text: d.status === "pending" ? "برای تأیید مدیر مالی فرستاده شد" : "ثبت شد" , tone: d.status === "pending" ? "warn" : "ok" });
  if (d.status === "posted" && d.lines[0].debit >= 500_000_000) h.push({ at: `${day} · ۱۱:۴۰`, who: "سارا احمدی", text: "تأیید کرد", tone: "ok" });
  return h;
}

/* ---------- people, companies, notifications ---------- */
export const users = [
  { name: "سارا احمدی", role: "مدیر مالی", docs: 18, last: "همین حالا", active: true },
  { name: "علی رضایی", role: "حسابدار", docs: 27, last: "۲۰ دقیقه پیش", active: true },
  { name: "مریم کاظمی", role: "حسابدار", docs: 14, last: "دیروز", active: true },
  { name: "رضا موسوی", role: "خزانه‌دار", docs: 9, last: "۲ روز پیش", active: true },
  { name: "نگار صادقی", role: "حسابرس داخلی", docs: 0, last: "۵ روز پیش", active: false },
];
export type Company = { id: string; name: string; nid: string; year: string; role: string; docs: number; color: string };
export const companies: Company[] = [
  { id: "c1", name: "صنایع آریا گستر", nid: "۱۰۱۰۳۲۸۴۵۷۱", year: "۱۴۰۵", role: "مدیر مالی", docs: 312, color: "var(--ch-1)" },
  { id: "c2", name: "بازرگانی نوین پارس", nid: "۱۴۰۰۶۹۱۲۳۰۸", year: "۱۴۰۵", role: "مدیر مالی", docs: 128, color: "var(--ch-2)" },
  { id: "c3", name: "پخش سپهر شرق", nid: "۱۰۸۶۱۷۷۴۹۲۳", year: "۱۴۰۴", role: "ناظر", docs: 941, color: "var(--ch-3)" },
];

/* official holidays shown on the calendar (Fridays are added by the grid) */
export const holidays: { m: number; d: number; title: string }[] = [
  { m: 8, d: 22, title: "شهادت حضرت فاطمه (س)" },
  { m: 10, d: 2, title: "ولادت امام علی (ع)" },
  { m: 10, d: 16, title: "مبعث حضرت رسول (ص)" },
];

/** Document categories shown as a submenu under «اسناد». Only accounting vouchers have a working detail flow in this prototype. */
export type DocCat = { id: string; label: string; short: string; count: number };
export const docCats: DocCat[] = [
  { id: "acc", label: "اسناد حسابداری", short: "حسابداری", count: 0 },
  { id: "treasury", label: "اسناد دریافت و پرداخت", short: "دریافت و پرداخت", count: 12 },
  { id: "cheque", label: "چک‌ها", short: "چک‌ها", count: 9 },
  { id: "invoice", label: "فاکتورهای خرید و فروش", short: "فاکتورها", count: 10 },
  { id: "bank", label: "صورت‌حساب‌های بانکی", short: "صورت‌حساب بانکی", count: 5 },
];
/** Sample rows for the categories that only show a list. `kind` feeds each category's own filter. */
export type CatRow = { no: string; title: string; party: string; kind: string; day: number; rial: number; state: string; tone: "success" | "warning" | "neutral" | "info" };
export const catFacet: Record<string, { label: string; options: string[] }> = {
  treasury: { label: "نوع", options: ["دریافت", "پرداخت"] },
  cheque: { label: "نوع چک", options: ["دریافتی", "پرداختی"] },
  invoice: { label: "نوع فاکتور", options: ["فروش", "خرید"] },
  bank: { label: "بانک", options: ["ملت", "پارسیان", "تجارت", "ملی"] },
};
const R = (no: string, title: string, party: string, kind: string, day: number, rial: number, state: string, tone: CatRow["tone"]): CatRow => ({ no, title, party, kind, day, rial, state, tone });
export const catRows: Record<string, CatRow[]> = {
  treasury: [
    R("د-۲۱۴", "دریافت از پتروشیمی مارون", "پتروشیمی مارون", "دریافت", 16, 5_000_000_000, "وصول‌شده", "success"),
    R("د-۲۱۵", "دریافت از فولاد مبارکه", "فولاد مبارکه", "دریافت", 16, 2_400_000_000, "در انتظار سند", "warning"),
    R("پ-۱۸۸", "پرداخت به تکین‌کو", "تکین‌کو", "پرداخت", 15, 4_000_000_000, "پرداخت‌شده", "success"),
    R("پ-۱۸۹", "پرداخت اجاره‌ی دفتر مرکزی", "موسوی", "پرداخت", 12, 650_000_000, "پرداخت‌شده", "success"),
    R("د-۲۱۳", "دریافت از پخش البرز", "پخش البرز", "دریافت", 11, 1_320_000_000, "وصول‌شده", "success"),
    R("پ-۱۸۷", "پرداخت حقوق مهر", "کارکنان", "پرداخت", 10, 3_800_000_000, "پرداخت‌شده", "success"),
    R("پ-۱۸۶", "پرداخت بیمه‌ی تأمین اجتماعی", "سازمان تأمین اجتماعی", "پرداخت", 9, 920_000_000, "پرداخت‌شده", "success"),
    R("د-۲۱۲", "دریافت از سیمان تهران", "سیمان تهران", "دریافت", 8, 780_000_000, "وصول‌شده", "success"),
    R("پ-۱۸۵", "پرداخت کرایه‌ی حمل", "باربری ایران‌پیما", "پرداخت", 7, 120_000_000, "در انتظار سند", "warning"),
    R("د-۲۱۱", "دریافت پیش‌پرداخت صنایع نوید", "صنایع نوید", "دریافت", 5, 600_000_000, "وصول‌شده", "success"),
    R("پ-۱۸۴", "پرداخت قبض برق کارخانه", "توانیر", "پرداخت", 4, 210_000_000, "پرداخت‌شده", "success"),
    R("پ-۱۸۳", "پرداخت مالیات بر ارزش افزوده", "سازمان امور مالیاتی", "پرداخت", 2, 1_150_000_000, "پرداخت‌شده", "success"),
  ],
  cheque: [
    R("۸۸۲۴۱۰", "چک پرداختی تکین‌کو", "تکین‌کو", "پرداختی", 17, 1_200_000_000, "سررسید امروز", "warning"),
    R("۴۴۱۲۰۹", "چک دریافتی پخش البرز", "پخش البرز", "دریافتی", 25, 950_000_000, "در جریان وصول", "info"),
    R("۳۲۰۱۷۷", "چک دریافتی سیمان تهران", "سیمان تهران", "دریافتی", 10, 780_000_000, "وصول‌شده", "success"),
    R("۸۸۲۴۱۱", "چک پرداختی باربری ایران‌پیما", "باربری ایران‌پیما", "پرداختی", 28, 340_000_000, "در جریان", "info"),
    R("۵۱۰۳۲۲", "چک دریافتی صنایع نوید", "صنایع نوید", "دریافتی", 20, 1_500_000_000, "در جریان وصول", "info"),
    R("۲۹۰۸۸۴", "چک دریافتی پارس‌کالا", "پارس‌کالا", "دریافتی", 6, 410_000_000, "برگشتی", "warning"),
    R("۸۸۲۴۰۹", "چک پرداختی اجاره", "موسوی", "پرداختی", 1, 650_000_000, "پاس‌شده", "success"),
    R("۶۶۷۱۰۵", "چک دریافتی فولاد مبارکه", "فولاد مبارکه", "دریافتی", 29, 2_100_000_000, "در جریان وصول", "info"),
    R("۸۸۲۴۱۲", "چک پرداختی مواد اولیه", "فولاد مبارکه", "پرداختی", 30, 1_800_000_000, "در جریان", "info"),
  ],
  invoice: [
    R("ف-۹۰۲", "فروش ورق فولادی", "صنایع نوید", "فروش", 14, 3_150_000_000, "تسویه‌نشده", "warning"),
    R("خ-۴۱۱", "خرید مواد اولیه", "فولاد مبارکه", "خرید", 9, 2_200_000_000, "تسویه‌شده", "success"),
    R("ف-۹۰۱", "فروش پروفیل", "پخش البرز", "فروش", 12, 1_320_000_000, "تسویه‌شده", "success"),
    R("ف-۹۰۰", "فروش لوله‌ی گالوانیزه", "پارس‌کالا", "فروش", 8, 860_000_000, "تسویه‌نشده", "warning"),
    R("خ-۴۱۰", "خرید قطعات یدکی", "تکین‌کو", "خرید", 7, 480_000_000, "تسویه‌نشده", "warning"),
    R("ف-۸۹۹", "فروش ورق رنگی", "سیمان تهران", "فروش", 5, 990_000_000, "تسویه‌شده", "success"),
    R("خ-۴۰۹", "خرید روغن صنعتی", "نفت پارس", "خرید", 4, 150_000_000, "تسویه‌شده", "success"),
    R("ف-۸۹۸", "فروش میلگرد", "صنایع نوید", "فروش", 3, 2_700_000_000, "تسویه‌شده", "success"),
    R("خ-۴۰۸", "خرید ملزومات اداری", "لوازم‌التحریر مهر", "خرید", 2, 45_000_000, "تسویه‌شده", "success"),
    R("ف-۸۹۷", "فروش ورق فولادی", "فولاد کاوه", "فروش", 1, 1_640_000_000, "تسویه‌نشده", "warning"),
  ],
  bank: [
    R("ملت-۰۸", "صورت‌حساب بانک ملت آبان", "بانک ملت", "ملت", 17, 0, "۲ مغایرت", "warning"),
    R("پارسیان-۰۸", "صورت‌حساب بانک پارسیان آبان", "بانک پارسیان", "پارسیان", 16, 0, "تطبیق‌شده", "success"),
    R("تجارت-۰۸", "صورت‌حساب بانک تجارت آبان", "بانک تجارت", "تجارت", 15, 0, "در حال تطبیق", "info"),
    R("ملت-۰۷", "صورت‌حساب بانک ملت مهر", "بانک ملت", "ملت", 1, 0, "تطبیق‌شده", "success"),
    R("پارسیان-۰۷", "صورت‌حساب بانک پارسیان مهر", "بانک پارسیان", "پارسیان", 1, 0, "تطبیق‌شده", "success"),
  ],
};

/** Base-data sections; each one is its own page under «اطلاعات پایه». */
export const baseSections: { id: string; label: string }[] = [
  { id: "home", label: "نمای کلی" }, { id: "banks", label: "بانک‌ها" }, { id: "branches", label: "شعبه‌ها" }, { id: "accounts", label: "حساب‌های بانکی" },
  { id: "boxes", label: "صندوق‌ها" }, { id: "currency", label: "ارزها و نرخ‌ها" },
];
