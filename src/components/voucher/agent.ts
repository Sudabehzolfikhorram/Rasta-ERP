import { accountBy, accounts, type DocKind, type DocLine } from "@/data/demo";
import { group, toEn, toFa } from "@/lib/utils";
import { TODAY } from "@/lib/jalali";

/* ---------- Persian number words → digits ("دوازده میلیون" → "12 میلیون") ---------- */
const ONES: Record<string, number> = { یک: 1, دو: 2, سه: 3, چهار: 4, پنج: 5, شش: 6, شیش: 6, هفت: 7, هشت: 8, نه: 9 };
const TEENS: Record<string, number> = { ده: 10, یازده: 11, دوازده: 12, سیزده: 13, چهارده: 14, پانزده: 15, پونزده: 15, شانزده: 16, شونزده: 16, هفده: 17, هجده: 18, هیجده: 18, نوزده: 19 };
const TENS: Record<string, number> = { بیست: 20, سی: 30, چهل: 40, پنجاه: 50, شصت: 60, هفتاد: 70, هشتاد: 80, نود: 90 };
const HUNDREDS: Record<string, number> = { صد: 100, یکصد: 100, دویست: 200, سیصد: 300, چهارصد: 400, پانصد: 500, پونصد: 500, ششصد: 600, هفتصد: 700, هشتصد: 800, نهصد: 900 };
const small = (w: string) => ONES[w] ?? TEENS[w] ?? TENS[w] ?? HUNDREDS[w];

export function wordsToDigits(s: string) {
  const parts = s.split(/(\s+)/);
  const out: string[] = [];
  let acc = 0, has = false;
  const flush = () => { if (has) { out.push(String(acc)); out.push(" "); acc = 0; has = false; } };
  for (let i = 0; i < parts.length; i++) {
    const w = parts[i];
    if (/^\s+$/.test(w)) { if (!has) out.push(w); continue; }
    const v = small(w);
    if (v !== undefined) { acc += v; has = true; continue; }
    if (w === "و" && has) continue;
    flush();
    out.push(w);
  }
  flush();
  return out.join("").replace(/\s+/g, " ").trim();
}

/* ---------- intent ---------- */
export type Slot = "kind" | "amount" | "unit" | "party" | "bank" | "expense" | "from" | "to" | "limit";
export type Draft = {
  kind: Exclude<DocKind, "general" | "cheque"> | null;
  amount: number | null;      // in rial
  rawAmount: number | null;   // as said, before unit
  unit: "toman" | "rial" | null;
  party: string | null;       // customer (receipt) or supplier (payment)
  bank: string | null;        // where money lands (receipt) or leaves (payment)
  bankOptions: string[];
  expense: string | null;     // payment reason
  from: string | null; to: string | null; // transfer
  day: { m: number; d: number };
  note: string;
  source: string;
  limitOk?: boolean;
};

const cashAccounts = accounts.filter((a) => a.group === "cash");
const customers = accounts.filter((a) => a.group === "ar");
const suppliers = accounts.filter((a) => a.group === "ap");
const expenses = accounts.filter((a) => a.group === "exp" || a.group === "loan");

const hints: [RegExp, string][] = [
  [/قسط|وام/, "3-310-530001"],
  [/حمل|باربری|کرایه|بارنامه/, "6-601-700003"],
  [/کارمزد/, "6-602-700011"],
  [/اجاره/, "6-605-700020"],
  [/حقوق|دستمزد/, "6-606-700030"],
  [/ملزومات|نوشت|کاغذ/, "6-607-700041"],
  [/پذیرایی|ناهار|شیرینی/, "6-607-700045"],
];
export const expenseFor = (t: string) => hints.find(([re]) => re.test(t))?.[1] ?? null;

function findBanks(t: string) {
  const hits: string[] = [];
  if (/صندوق/.test(t)) hits.push("1-101-100010");
  if (/تنخواه/.test(t)) hits.push("1-101-100020");
  for (const b of ["پارسیان", "ملت"]) {
    if (!t.includes(b)) continue;
    const opts = cashAccounts.filter((a) => a.name.includes(b));
    const exact = opts.find((a) => (a.name.match(/[۰-۹]{4}/)?.[0] ?? "x") && t.includes(toEn(a.name.match(/[۰-۹]{4}/)![0])));
    const byType = /سپرده/.test(t) ? opts.filter((a) => a.name.includes("سپرده")) : /جاری/.test(t) ? opts.filter((a) => a.name.includes("جاری")) : opts;
    hits.push(...(exact ? [exact.code] : byType.map((a) => a.code)));
  }
  return [...new Set(hits)];
}

export function understand(input: string, source = "متن"): Draft {
  const t = wordsToDigits(toEn(input)).replace(/[٬,]/g, "");
  const m = t.match(/(\d+(?:\.\d+)?)\s*(هزار میلیارد|میلیارد|میلیون|هزار)?\s*(تومان|تومن|ریال)?/);
  const base = m ? parseFloat(m[1]) : 0;
  const mult = m?.[2] === "هزار میلیارد" ? 1e12 : m?.[2] === "میلیارد" ? 1e9 : m?.[2] === "میلیون" ? 1e6 : m?.[2] === "هزار" ? 1e3 : 1;
  const raw = base ? base * mult : null;
  // everything is recorded in rial: a number without a unit is read as rial, «تومان» is converted
  const unit = m?.[3] && m[3] !== "ریال" ? "toman" : "rial";

  const receive = /واریز|دریافت|گرفتیم|رسید|وصول|آمد|اومد|داد(?!یم)/.test(t) && !/پرداخت|دادیم|خریدیم|خرید/.test(t);
  const transfer = /انتقال|جابه|منتقل/.test(t);
  const pay = !receive && !transfer && /پرداخت|دادیم|خرید|هزینه|کرایه|اجاره|کارمزد|حقوق/.test(t);
  const kind = transfer ? "transfer" : receive ? "receipt" : pay ? "payment" : null;

  const banks = findBanks(t);
  const customer = customers.find((a) => t.includes(a.name.split(" ")[0]) || t.includes(a.name));
  const supplier = suppliers.find((a) => t.includes(a.name.split(" ")[0]));
  const exp = expenseFor(t);

  const day = /دیروز/.test(t) ? { m: TODAY.m, d: TODAY.d - 1 } : (() => {
    const dm = t.match(/(\d{1,2})\s*(مهر|آبان)/);
    return dm ? { m: dm[2] === "مهر" ? 7 : 8, d: +dm[1] } : { m: TODAY.m, d: TODAY.d };
  })();

  const d: Draft = {
    kind, rawAmount: raw, unit, amount: raw && unit ? (unit === "toman" ? raw * 10 : raw) : null,
    party: kind === "receipt" ? customer?.code ?? null : kind === "payment" ? supplier?.code ?? null : null,
    bank: null, bankOptions: banks, expense: kind === "payment" ? exp : null,
    from: null, to: null, day, note: input.trim(), source,
  };
  if (kind === "transfer") {
    // "از سپرده به جاری" → order of appearance
    if (banks.length >= 2) { d.from = banks[0]; d.to = banks[1]; }
    const fromWord = t.match(/از\s+(سپرده|جاری|صندوق|ملت|پارسیان)/)?.[1];
    if (fromWord && banks.length >= 2) {
      const f = banks.find((c) => accountBy(c)!.name.includes(fromWord));
      if (f) { d.from = f; d.to = banks.find((c) => c !== f) ?? null; }
    }
  } else if (kind === "receipt" && /چک/.test(t)) {
    d.bank = "1-104-310001"; // a received cheque sits in "in collection" until it clears
  } else if (banks.length === 1) d.bank = banks[0];
  return d;
}

/** The next thing we must ask, or null when the draft is complete. */
export function nextSlot(d: Draft, limit: number): Slot | null {
  if (!d.kind) return "kind";
  if (!d.rawAmount) return "amount";
  if (d.kind === "receipt") { if (!d.party) return "party"; if (!d.bank) return "bank"; }
  if (d.kind === "payment") { if (!d.expense && !d.party) return "expense"; if (!d.bank) return "bank"; }
  if (d.kind === "transfer") { if (!d.from) return "from"; if (!d.to) return "to"; }
  if ((d.amount ?? 0) > limit && !d.limitOk) return "limit";
  return null;
}

export type Question = { slot: Slot; ask: string; hint?: string; options: { label: string; value: string; sub?: string }[]; input?: "amount" };

export function questionFor(slot: Slot, d: Draft, limit: number): Question {
  const opt = (a: { code: string; name: string }) => ({ label: a.name, value: a.code });
  switch (slot) {
    case "kind": return { slot, ask: "پول آمد یا رفت؟", options: [{ label: "پول آمد", value: "receipt", sub: "دریافت از مشتری یا هر شخص" }, { label: "پول رفت", value: "payment", sub: "پرداخت هزینه یا بدهی" }, { label: "جابه‌جایی بین حساب‌ها", value: "transfer", sub: "مثلاً از سپرده به جاری" }] };
    case "amount": return { slot, ask: "مبلغ چقدر بود؟", hint: "به ریال ثبت می‌شود؛ اگر تومان است بنویسید، مثلاً «۱۲۰ میلیون تومان»", options: [], input: "amount" };
    case "unit": return { slot, ask: `${toFa(group(d.rawAmount ?? 0))} به تومان است یا ریال؟`, hint: "سند به ریال ذخیره می‌شود", options: [{ label: "تومان", value: "toman", sub: `= ${group((d.rawAmount ?? 0) * 10)} ریال` }, { label: "ریال", value: "rial" }] };
    case "party": return { slot, ask: "از چه کسی؟", options: customers.map(opt) };
    case "bank": {
      const list = d.bankOptions.length > 1 ? cashAccounts.filter((a) => d.bankOptions.includes(a.code)) : cashAccounts;
      return { slot, ask: d.kind === "receipt" ? "به کدام حساب آمد؟" : "از کدام حساب رفت؟", hint: d.bankOptions.length > 1 ? "دو حساب با این نام دارید" : undefined, options: list.map(opt) };
    }
    case "expense": return { slot, ask: "بابت چه؟", options: [...expenses.map(opt), ...suppliers.map((a) => ({ ...opt(a), sub: "تأمین‌کننده" }))] };
    case "from": return { slot, ask: "از کدام حساب برداشته شد؟", options: cashAccounts.map(opt) };
    case "to": return { slot, ask: "به کدام حساب رفت؟", options: cashAccounts.filter((a) => a.code !== d.from).map(opt) };
    case "limit": return { slot, ask: "این مبلغ بیشتر از سقف تأیید است. بعد از ثبت، برای تأیید مدیر مالی می‌رود.", hint: `سقف فعلی ${toFa(group(limit))} ریال است`, options: [{ label: "ادامه بده", value: "ok" }, { label: "مبلغ را عوض می‌کنم", value: "edit" }] };
  }
}

export function answer(d: Draft, slot: Slot, value: string): Draft {
  switch (slot) {
    case "kind": return { ...d, kind: value as Draft["kind"] };
    case "amount": { const n = parseFloat(toEn(value).replace(/[^\d.]/g, "")); const w = toEn(value); const mult = /میلیارد/.test(w) ? 1e9 : /میلیون/.test(w) ? 1e6 : /هزار/.test(w) ? 1e3 : 1; const raw = n * mult; const toman = /تومان|تومن/.test(w); return { ...d, rawAmount: raw, unit: toman ? "toman" : "rial", amount: toman ? raw * 10 : raw }; }
    case "unit": return { ...d, unit: value as "toman" | "rial", amount: (d.rawAmount ?? 0) * (value === "toman" ? 10 : 1) };
    case "party": return { ...d, party: value };
    case "bank": return { ...d, bank: value };
    case "expense": return accountBy(value)?.group === "ap" ? { ...d, party: value } : { ...d, expense: value };
    case "from": return { ...d, from: value };
    case "to": return { ...d, to: value };
    case "limit": return value === "ok" ? { ...d, limitOk: true } : { ...d, rawAmount: null, amount: null, limitOk: false };
  }
}

/** What we understood so far, as short labelled facts for the live card. */
export function facts(d: Draft): { k: string; v: string | null }[] {
  const n = (c: string | null) => (c ? accountBy(c)?.name ?? null : null);
  const kindFa = d.kind === "receipt" ? "پول آمد" : d.kind === "payment" ? "پول رفت" : d.kind === "transfer" ? "جابه‌جایی" : null;
  const amt = d.amount ? `${toFa(group(d.amount))} ریال` : d.rawAmount ? `${toFa(group(d.rawAmount))} ؟` : null;
  const base = [{ k: "نوع", v: kindFa }, { k: "مبلغ", v: amt }];
  if (d.kind === "transfer") return [...base, { k: "از", v: n(d.from) }, { k: "به", v: n(d.to) }];
  if (d.kind === "payment") return [...base, { k: "بابت", v: n(d.expense) ?? n(d.party) }, { k: "از حساب", v: n(d.bank) }];
  return [...base, { k: "از طرف", v: n(d.party) }, { k: "به حساب", v: n(d.bank) }];
}

let lid = 5000;
export function linesFor(d: Draft): { title: string; lines: DocLine[] } {
  const a = d.amount ?? 0;
  const L = (account: string | null, desc: string, debit: number, credit: number): DocLine => ({ id: lid++, account, desc, debit, credit, ai: true });
  if (d.kind === "transfer") {
    const title = `انتقال از ${accountBy(d.from)?.name ?? ""} به ${accountBy(d.to)?.name ?? ""}`;
    return { title, lines: [L(d.to, "انتقال بین حساب‌ها", a, 0), L(d.from, "انتقال بین حساب‌ها", 0, a)] };
  }
  if (d.kind === "payment") {
    const dr = d.expense ?? d.party;
    const what = accountBy(dr)?.name ?? "";
    const title = d.expense ? `پرداخت ${what}` : `پرداخت به ${what}`;
    return { title, lines: [L(dr, title, a, 0), L(d.bank, title, 0, a)] };
  }
  const who = accountBy(d.party)?.name ?? "";
  const title = d.bank === "1-104-310001" ? `دریافت چک از ${who}` : `دریافت از ${who}`;
  return { title, lines: [L(d.bank, title, a, 0), L(d.party, title, 0, a)] };
}

/** Demo OCR: what we "read" from an uploaded receipt or cheque. */
export function readFile(name: string): { text: string; fields: [string, string][] } {
  if (/چک|cheque|check/i.test(name))
    return { text: "۱۸۰ میلیون تومان چک از سیمان تهران دریافت شد به بانک ملت", fields: [["شماره‌ی صیادی", "۱۴۰۵۰۸۴۴۰۱۷۷۲"], ["تاریخ سررسید", "۲۵ آذر ۱۴۰۵"], ["صادرکننده", "سیمان تهران"]] };
  return { text: "۵۰۰ میلیون تومان از پتروشیمی مارون به حساب پارسیان جاری ۴۴۱۰ واریز شد", fields: [["شماره‌ی پیگیری", "۷۷۲۰۴۱۹۹۳"], ["تاریخ واریز", "۱۶ آبان ۱۴۰۵"], ["واریزکننده", "پتروشیمی مارون"]] };
}
