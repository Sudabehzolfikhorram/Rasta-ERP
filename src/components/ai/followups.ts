/* Next questions that follow from what was just asked and answered.
   Keyed by the answer's topic, so the few chips under a conversation move with it.
   Each one is written the way a finance manager would actually ask it. */
const Q = {
  banks: "الان در هر بانک چقدر موجودی داریم؟",
  why: "چرا نقدینگی این هفته بالا رفت؟",
  forecast: "تا آخر آبان چقدر پول در حساب‌ها می‌ماند؟",
  cheques: "چه چک‌هایی این هفته سررسید می‌شوند؟",
  debtors: "کدام مشتری‌ها هنوز بدهکارند؟",
  expenses: "هزینه‌های آبان صرف چه چیزهایی شد؟",
  compare: "آبان را با مهر مقایسه کن",
  tb: "تراز آزمایشی آبان را نشان بده",
  pending: "کدام سندها منتظر تأیید من است؟",
  takin: "چک امروز تکین‌کو را چه کنم؟",
};
const NEXT: Record<string, string[]> = {
  banks: [Q.forecast, Q.why, Q.cheques],
  "why-cash": [Q.forecast, Q.debtors, Q.expenses],
  forecast: [Q.cheques, Q.expenses, Q.banks],
  tb: [Q.expenses, Q.compare, Q.pending],
  expenses: [Q.compare, Q.tb, Q.forecast],
  compare: [Q.expenses, Q.tb, Q.debtors],
  statements: [Q.cheques, Q.forecast, Q.banks],
  cheque: [Q.banks, Q.forecast, Q.pending],
  pending: [Q.tb, Q.cheques, Q.expenses],
};
export const OPENERS = [Q.banks, Q.pending, Q.why, Q.takin];

/** Up to `n` follow-ups for the last answer's topic, leaving out what was already asked. */
export function followUps(topic: string | null | undefined, asked: string[], n = 3): string[] {
  const pool = (topic && NEXT[topic]) || OPENERS;
  const seen = new Set(asked.map((a) => a.trim()));
  const out = pool.filter((s) => !seen.has(s));
  for (const s of OPENERS) if (out.length < n && !seen.has(s) && !out.includes(s)) out.push(s);
  return out.slice(0, n);
}
