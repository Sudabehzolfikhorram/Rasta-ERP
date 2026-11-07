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
