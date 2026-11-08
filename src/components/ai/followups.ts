/* Next questions that follow from what was just asked and answered.
   Keyed by the answer's topic, so the chips under a conversation move with it. */
const NEXT: Record<string, string[]> = {
  banks: ["پیش‌بینی نقدینگی تا آخر آبان", "چرا نقدینگی بالا رفت؟", "چک‌های سررسید این هفته"],
  "why-cash": ["پیش‌بینی نقدینگی تا آخر آبان", "مانده‌ی مشتری‌های بدهکار", "هزینه‌های آبان به تفکیک"],
  forecast: ["چک‌های سررسید این هفته", "هزینه‌های آبان به تفکیک", "مانده‌ی بانک‌ها"],
  tb: ["هزینه‌های آبان به تفکیک", "مقایسه‌ی آبان با مهر", "اسناد منتظر تأیید"],
  expenses: ["مقایسه‌ی آبان با مهر", "تراز آزمایشی آبان", "پیش‌بینی نقدینگی تا آخر آبان"],
  compare: ["هزینه‌های آبان به تفکیک", "تراز آزمایشی آبان", "مانده‌ی مشتری‌های بدهکار"],
  statements: ["صورت‌حساب مهر مشتری‌های بدهکار را آماده کن", "پیش‌بینی نقدینگی تا آخر آبان", "مانده‌ی بانک‌ها"],
  cheque: ["مانده‌ی بانک‌ها", "پیش‌بینی نقدینگی تا آخر آبان", "اسناد منتظر تأیید"],
  pending: ["تراز آزمایشی آبان", "چک‌های سررسید این هفته", "هزینه‌های آبان به تفکیک"],
};
export const OPENERS = ["مانده‌ی بانک‌ها", "چرا نقدینگی بالا رفت؟", "اسناد منتظر تأیید", "چک تکین‌کو"];

/** Up to `n` follow-ups for the last answer's topic, leaving out what was already asked. */
export function followUps(topic: string | null | undefined, asked: string[], n = 3): string[] {
  const pool = (topic && NEXT[topic]) || OPENERS;
  const seen = new Set(asked.map((a) => a.trim()));
  const out = pool.filter((s) => !seen.has(s));
  for (const s of OPENERS) if (out.length < n && !seen.has(s) && !out.includes(s)) out.push(s);
  return out.slice(0, n);
}
