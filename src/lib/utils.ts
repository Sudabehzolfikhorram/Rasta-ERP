import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FA = "۰۱۲۳۴۵۶۷۸۹";
export const toFa = (v: string | number) => String(v).replace(/\d/g, (d) => FA[+d]);
export const toEn = (v: string) =>
  v.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/** Group digits with the Persian thousands separator. */
export const group = (n: number) => toFa(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "٬"));

export type Unit = "rial" | "toman";
export const unitLabel = (u: Unit) => (u === "rial" ? "ریال" : "تومان");
/** Amounts are stored in rial; display converts. */
export const money = (rial: number, unit: Unit) => group(unit === "rial" ? rial : rial / 10);

/** Short form for KPIs: 48_250_000_000 rial -> ۴۸٫۲۵ میلیارد */
export function short(rial: number, unit: Unit) {
  const v = unit === "rial" ? rial : rial / 10;
  if (Math.abs(v) >= 1e9) return { n: toFa((v / 1e9).toFixed(2)).replace(".", "٫"), s: "میلیارد" };
  if (Math.abs(v) >= 1e6) return { n: toFa((v / 1e6).toFixed(1)).replace(".", "٫"), s: "میلیون" };
  return { n: group(v), s: "" };
}

/** Spell a rial amount in Persian words, compact (for the live rial preview). */
export function words(rial: number) {
  if (!rial) return "";
  const parts: string[] = [];
  const units: [number, string][] = [[1e12, "هزار میلیارد"], [1e9, "میلیارد"], [1e6, "میلیون"], [1e3, "هزار"]];
  let r = Math.round(rial);
  for (const [v, w] of units) {
    if (r >= v) { parts.push(`${group(Math.floor(r / v))} ${w}`); r %= v; }
  }
  if (r) parts.push(group(r));
  return parts.join(" و ") + " ریال";
}

/* ---------- Persian number words ---------- */
const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
function under1000(n: number) {
  const parts: string[] = [];
  const h = Math.floor(n / 100), r = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (r >= 10 && r < 20) parts.push(TEENS[r - 10]);
  else { if (Math.floor(r / 10)) parts.push(TENS[Math.floor(r / 10)]); if (r % 10) parts.push(ONES[r % 10]); }
  return parts.join(" و ");
}
/** 2_500_000 → «دو میلیون و پانصد هزار» */
export function numWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (!n) return "صفر";
  const scales: [number, string][] = [[1e12, "هزار میلیارد"], [1e9, "میلیارد"], [1e6, "میلیون"], [1e3, "هزار"], [1, ""]];
  const parts: string[] = [];
  for (const [v, w] of scales) {
    const k = Math.floor(n / v);
    if (k) { parts.push(`${k >= 1000 ? numWords(k) : under1000(k)}${w ? ` ${w}` : ""}`); n -= k * v; }
  }
  return parts.join(" و ");
}
/** A rial amount read out in toman words; a thousand billion toman is «همت». */
export function tomanWords(rial: number) {
  const t = Math.floor(rial / 10);
  if (!t) return "";
  if (t >= 1e12) {
    const h = Math.floor(t / 1e12), rest = t % 1e12;
    return `${numWords(h)} همت${rest ? ` و ${numWords(rest)}` : ""} تومان`;
  }
  return `${numWords(t)} تومان`;
}
/** Short toman figure for big totals, e.g. 14_000_000_000_000 rial → «۱٫۴ همت» */
export function shortToman(rial: number) {
  const t = rial / 10;
  if (t >= 1e12) return `${toFa((t / 1e12).toFixed(t >= 1e13 ? 0 : 1)).replace(".", "٫")} همت`;
  if (t >= 1e9) return `${toFa((t / 1e9).toFixed(1)).replace(".0", "").replace(".", "٫")} میلیارد تومان`;
  if (t >= 1e6) return `${toFa(Math.round(t / 1e6))} میلیون تومان`;
  return `${group(t)} تومان`;
}
