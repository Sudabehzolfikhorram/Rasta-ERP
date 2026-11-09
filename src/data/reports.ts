// Synthetic report data, in billion rial.
export type Col = { key: string; label: string; num?: boolean };
export type Row = Record<string, string | number>;
export type ChartKind = "waterfall" | "treemap" | "aging" | "pair" | "rank" | "cash";
export type Report = { id: string; title: string; group: string; cols: Col[]; rows: Row[]; chart: ChartKind; note?: string };

const tbRaw: [string, number, number][] = [
  ["موجودی نقد و بانک", 61.05, 12.8],
  ["دریافتنی از مشتریان", 22.4, 9.6],
  ["چک‌های دریافتنی", 1.8, 0],
  ["پرداختنی به تأمین‌کنندگان", 4.0, 13.4],
  ["مالیات و بیمه", 0, 1.79],
  ["فروش و درآمد", 0, 18.9],
  ["هزینه‌ها", 15.75, 0],
];
const dr = tbRaw.reduce((a, r) => a + r[1], 0), cr = tbRaw.reduce((a, r) => a + r[2], 0);
const tb: [string, number, number][] = [...tbRaw, ["سرمایه و سود انباشته", 0, +(dr - cr).toFixed(2)]];

export const reports: Report[] = [
  {
    id: "pl", title: "سود و زیان", group: "صورت‌های مالی", chart: "waterfall",
    cols: [{ key: "item", label: "سرفصل" }, { key: "v", label: "مبلغ", num: true }, { key: "share", label: "نسبت به فروش ٪", num: true }],
    rows: [["فروش", 18.9], ["بهای تمام‌شده", -11.8], ["هزینه‌های اداری", -2.1], ["توزیع و فروش", -1.5], ["هزینه‌های مالی", -0.35]].map(([item, v]) => ({ item, v, share: +((Math.abs(+v) / 18.9) * 100).toFixed(1) })),
  },
  {
    id: "cf", title: "جریان نقد", group: "صورت‌های مالی", chart: "cash",
    cols: [{ key: "item", label: "سرفصل" }, { key: "in", label: "ورودی", num: true }, { key: "out", label: "خروجی", num: true }],
    rows: [{ item: "دریافت از مشتریان", in: 12.45, out: 0 }, { item: "پرداخت به تأمین‌کنندگان", in: 0, out: 4.0 }, { item: "حقوق و دستمزد", in: 0, out: 3.8 }, { item: "اجاره و هزینه‌های جاری", in: 0, out: 0.82 }, { item: "اقساط وام", in: 0, out: 0.85 }],
  },
  {
    id: "tb", title: "تراز آزمایشی", group: "دفاتر", chart: "rank",
    cols: [{ key: "item", label: "گروه حساب" }, { key: "dr", label: "گردش بدهکار", num: true }, { key: "cr", label: "گردش بستانکار", num: true }, { key: "bal", label: "مانده", num: true }],
    rows: tb.map(([item, d, c]) => ({ item, dr: d, cr: c, bal: +(d - c).toFixed(2) })),
    note: "جمع گردش بدهکار و بستانکار برابر است.",
  },
  {
    id: "banks", title: "مانده‌ی بانک‌ها", group: "دفاتر", chart: "rank",
    cols: [{ key: "item", label: "حساب" }, { key: "bal", label: "مانده", num: true }, { key: "chg", label: "تغییر این ماه", num: true }],
    rows: [{ item: "پارسیان · جاری ۴۴۱۰", bal: 31.2, chg: 6.4 }, { item: "ملت · جاری ۸۸۲۰", bal: 9.8, chg: -2.1 }, { item: "پارسیان · سپرده ۹۱۰۲", bal: 5.7, chg: -3.0 }, { item: "صندوق مرکزی", bal: 1.2, chg: -0.12 }, { item: "تنخواه دفتر مرکزی", bal: 0.35, chg: -0.05 }],
  },
  {
    id: "aging", title: "سنی مطالبات", group: "اشخاص", chart: "aging",
    cols: [{ key: "item", label: "مشتری" }, { key: "a", label: "جاری", num: true }, { key: "b", label: "۱ تا ۳۰ روز", num: true }, { key: "c", label: "۳۱ تا ۶۰ روز", num: true }, { key: "d", label: "بیش از ۶۰ روز", num: true }],
    rows: [{ item: "پخش البرز", a: 3.27, b: 1.2, c: 0, d: 0 }, { item: "فولاد مبارکه", a: 1.1, b: 0.9, c: 0.6, d: 0 }, { item: "پتروشیمی مارون", a: 2.0, b: 0, c: 0.45, d: 0.38 }, { item: "سیمان تهران", a: 0.6, b: 0.8, c: 0.4, d: 1.1 }],
  },
  {
    id: "statements", title: "صورت‌حساب مشتریان", group: "اشخاص", chart: "rank",
    cols: [{ key: "item", label: "مشتری" }, { key: "open", label: "مانده‌ی اول مهر", num: true }, { key: "sale", label: "فروش مهر", num: true }, { key: "paid", label: "دریافت مهر", num: true }, { key: "bal", label: "مانده", num: true }],
    rows: [{ item: "پخش البرز", open: 2.1, sale: 3.6, paid: 1.23, bal: 4.47 }, { item: "پتروشیمی مارون", open: 6.2, sale: 2.0, paid: 5.37, bal: 2.83 }, { item: "سیمان تهران", open: 1.9, sale: 1.4, paid: 0.4, bal: 2.9 }, { item: "فولاد مبارکه", open: 3.0, sale: 1.0, paid: 1.4, bal: 2.6 }],
  },
  {
    id: "expmix", title: "ترکیب هزینه‌ها", group: "هزینه‌ها", chart: "treemap",
    cols: [{ key: "item", label: "هزینه" }, { key: "v", label: "مبلغ", num: true }],
    rows: [{ item: "حقوق و دستمزد", v: 3.8 }, { item: "اجاره", v: 0.65 }, { item: "حمل‌ونقل", v: 0.6 }, { item: "کارمزد و مالی", v: 0.35 }, { item: "ملزومات اداری", v: 0.12 }, { item: "پذیرایی", v: 0.08 }, { item: "سایر", v: 0.2 }],
  },
  {
    id: "expcmp", title: "هزینه‌ها: آبان و مهر", group: "هزینه‌ها", chart: "pair",
    cols: [{ key: "item", label: "هزینه" }, { key: "a", label: "مهر", num: true }, { key: "b", label: "آبان", num: true }, { key: "chg", label: "تغییر ٪", num: true }],
    rows: [["حقوق و دستمزد", 3.7, 3.8], ["اجاره", 0.65, 0.65], ["حمل‌ونقل", 0.51, 0.6], ["کارمزد و مالی", 0.33, 0.35], ["ملزومات اداری", 0.09, 0.12], ["پذیرایی", 0.06, 0.08]].map(([item, a, b]) => ({ item, a, b, chg: +((((+b) - (+a)) / +a) * 100).toFixed(1) })),
  },
];

export const reportGroups = [...new Set(reports.map((r) => r.group))];
