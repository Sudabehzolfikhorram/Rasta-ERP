// All figures are synthetic demo data for the design concept.
export type Account = { code: string; name: string; path: string; nature: "بدهکار" | "بستانکار" };

export const accounts: Account[] = [
  { code: "1-101-100001", name: "بانک پارسیان · جاری ۴۴۱۰", path: "دارایی‌های جاری › موجودی نقد و بانک", nature: "بدهکار" },
  { code: "1-101-100003", name: "بانک پارسیان · سپرده ۹۱۰۲", path: "دارایی‌های جاری › موجودی نقد و بانک", nature: "بدهکار" },
  { code: "1-101-100002", name: "بانک ملت · جاری ۸۸۲۰", path: "دارایی‌های جاری › موجودی نقد و بانک", nature: "بدهکار" },
  { code: "1-101-100010", name: "صندوق مرکزی", path: "دارایی‌های جاری › موجودی نقد و بانک", nature: "بدهکار" },
  { code: "1-103-300014", name: "پتروشیمی مارون", path: "دارایی‌های جاری › حساب‌های دریافتنی تجاری", nature: "بدهکار" },
  { code: "1-103-300021", name: "فولاد مبارکه", path: "دارایی‌های جاری › حساب‌های دریافتنی تجاری", nature: "بدهکار" },
  { code: "3-301-500007", name: "تکین‌کو", path: "بدهی‌های جاری › حساب‌های پرداختنی تجاری", nature: "بستانکار" },
  { code: "6-601-700003", name: "هزینه حمل‌ونقل", path: "هزینه‌های عملیاتی › هزینه‌های توزیع", nature: "بدهکار" },
  { code: "6-602-700011", name: "کارمزد خدمات بانکی", path: "هزینه‌های عملیاتی › هزینه‌های مالی", nature: "بدهکار" },
  { code: "6-605-700020", name: "هزینه اجاره دفتر مرکزی", path: "هزینه‌های عملیاتی › هزینه‌های اداری", nature: "بدهکار" },
  { code: "4-401-600001", name: "فروش محصولات", path: "درآمدها › درآمد عملیاتی", nature: "بستانکار" },
];

export const kpis = [
  { id: "cash", label: "نقد و بانک", rial: 48_250_000_000, delta: "+۶٪", deltaNote: "از دیروز", good: true,
    series: [31, 33, 32, 36, 35, 41, 44, 46, 48],
    why: { line: "۶٪ افزایش، بیشترش از دریافت پتروشیمی مارون.", parts: [["دریافت پتروشیمی مارون", "+۵۰۰ میلیون"], ["پرداخت حقوق آبان", "−۱۸۰ میلیون"], ["کارمزد بانکی", "−۱٫۲ میلیون"]] } },
  { id: "ar", label: "دریافتنی‌ها", rial: 12_800_000_000, delta: "−۲٪", deltaNote: "این هفته", good: false,
    series: [15, 14.6, 14.1, 13.9, 13.5, 13.4, 13.0, 12.9, 12.8],
    why: { line: "دو مشتری بزرگ بخشی از بدهی‌شان را پرداختند.", parts: [["پتروشیمی مارون", "−۵۰۰ میلیون"], ["فولاد مبارکه", "+۲۴۰ میلیون"]] } },
  { id: "ap", label: "پرداختنی‌ها", rial: 9_400_000_000, delta: "−۴٪", deltaNote: "این هفته", good: true,
    series: [10.4, 10.2, 10.1, 9.9, 9.8, 9.7, 9.6, 9.5, 9.4],
    why: { line: "تسویه‌ی بخشی از بدهی تکین‌کو.", parts: [["تکین‌کو", "−۴۰۰ میلیون"]] } },
  { id: "pl", label: "سود آبان تا امروز", rial: 3_150_000_000, delta: "+۱۱٪", deltaNote: "نسبت به مهر", good: true,
    series: [1.1, 1.4, 1.6, 1.9, 2.2, 2.5, 2.7, 2.9, 3.15],
    why: { line: "فروش بیشتر شد و هزینه‌ی حمل ۱۸٪ بالا رفت.", parts: [["فروش محصولات", "+۹۰۰ میلیون"], ["هزینه حمل‌ونقل", "−۹۲ میلیون"]] } },
] as const;

export type TimelineItem = { time: string; title: string; who: "human" | "agent"; source: string; state: "done" | "today" | "soon" | "open" };
export const today: TimelineItem[] = [
  { time: "۰۹:۳۰", title: "جلسه‌ی بودجه‌ی زمستان", who: "human", source: "یادآوری شما", state: "done" },
  { time: "۱۱:۰۰", title: "سررسید چک تکین‌کو · ۱٫۲ میلیارد ریال", who: "agent", source: "ایجنت تقویم", state: "today" },
  { time: "۱۴:۰۰", title: "مهلت ارسال لیست بیمه‌ی مهر", who: "agent", source: "ایجنت تقویم · چک‌لیست آماده است", state: "soon" },
  { time: "۱۶:۰۰", title: "پیگیری مانده‌ی بانک ملت", who: "human", source: "یادآوری شما", state: "open" },
];

export type InboxItem = { id: string; agent: string; title: string; detail: string; primary: string; secondary?: string; confidence?: string; kind: "draft" | "check" | "approve" | "close" };
export const inbox: InboxItem[] = [
  { id: "d1", agent: "ایجنت ثبت · از عکس فیش", title: "پیش‌نویس دریافت از پتروشیمی مارون", detail: "۵۰۰٬۰۰۰٬۰۰۰ ریال به بانک پارسیان", primary: "بازبینی پیش‌نویس", confidence: "۹۶٪", kind: "draft" },
  { id: "c1", agent: "ایجنت کنترل", title: "احتمال ثبت تکراری", detail: "سند ۰۰۴۱ با سند ۰۰۳۸ هم مبلغ است و هم تاریخ.", primary: "مقایسه", secondary: "تکراری نیست", kind: "check" },
  { id: "a1", agent: "صف تأیید", title: "۱۲ سند منتظر تأیید", detail: "۱۰ سند از همه‌ی کنترل‌ها سالم گذشته‌اند و ۲ سند هشدار دارند.", primary: "تأیید ۱۰ سند سالم", secondary: "دیدن هشدارها", kind: "approve" },
  { id: "p1", agent: "ایجنت بستن دوره", title: "آبان ۸۰٪ آماده‌ی بستن است", detail: "۳ کار مانده: ۲ پیش‌نویس باز و ۱ مغایرت بانکی.", primary: "دیدن کارهای مانده", kind: "close" },
];

export const week = [
  { d: "ج", n: "۱۵" }, { d: "ش", n: "۱۶", today: true }, { d: "ی", n: "۱۷", dot: true }, { d: "د", n: "۱۸" },
  { d: "س", n: "۱۹", dot: true }, { d: "چ", n: "۲۰" }, { d: "پ", n: "۲۱" },
];

// 30-day cash: actual (first 12 points) then agent forecast.
export const cashActual = [38, 39.5, 39, 41, 40.2, 42.8, 43.1, 42.4, 44.9, 46.1, 47.2, 48.25];
export const cashForecast = [48.25, 47.6, 49.1, 50.3, 48.8, 45.9, 44.2, 46.5, 48.7, 50.9, 52.4, 53.1];
