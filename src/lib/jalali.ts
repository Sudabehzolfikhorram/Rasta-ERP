import { toFa } from "./utils";

/** Minimal Jalali helpers for the 1405 fiscal year (demo scope).
 *  Anchor: 1 Farvardin 1405 = Saturday 21 March 2026. 1405 is not a leap year. */
export const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
export const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
export const WD_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export const monthLength = (m: number) => (m <= 6 ? 31 : m <= 11 ? 30 : 29);
const before = (m: number) => { let s = 0; for (let i = 1; i < m; i++) s += monthLength(i); return s; };
/** Day of year, 0-based */
export const dayIndex = (m: number, d: number) => before(m) + d - 1;
/** 0 = Saturday … 6 = Friday */
export const weekday = (m: number, d: number) => dayIndex(m, d) % 7;

export const TODAY = { m: 8, d: 17 } as const;
export const isToday = (m: number, d: number) => m === TODAY.m && d === TODAY.d;
export const diffDays = (m: number, d: number) => dayIndex(m, d) - dayIndex(TODAY.m, TODAY.d);

export const fmtDay = (m: number, d: number) => `${toFa(d)} ${MONTHS[m - 1]}`;
export const fmtFull = (m: number, d: number) => `${WEEKDAYS[weekday(m, d)]} ${toFa(d)} ${MONTHS[m - 1]} ۱۴۰۵`;
export const fmtNum = (m: number, d: number) => toFa(`1405/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`);

export function relDay(m: number, d: number) {
  const n = diffDays(m, d);
  if (n === 0) return "امروز";
  if (n === 1) return "فردا";
  if (n === -1) return "دیروز";
  return n > 0 ? `${toFa(n)} روز دیگر` : `${toFa(-n)} روز پیش`;
}
