import { toEn, toFa, group } from "@/lib/utils";
import { readFile } from "./agent";

/** What we could learn from a file the user picked. Text files and CSV bank statements are read for real;
 *  for images and PDFs the prototype reads size, pages and shape, and the field values come from the demo reader. */
export type Analysis = {
  name: string;
  kind: "image" | "pdf" | "sheet" | "text" | "other";
  url?: string;
  meta: string;            // "۱۲۸۰×۱۶۰۰ پیکسل · ۸۴۰ کیلوبایت"
  fields: [string, string][];
  text: string;            // the sentence we hand to the voucher agent
  rows?: { date: string; desc: string; amount: number }[]; // statement rows, when found
  note?: string;
};

const kb = (n: number) => (n > 1_048_576 ? `${toFa((n / 1_048_576).toFixed(1)).replace(".", "٫")} مگابایت` : `${toFa(Math.max(1, Math.round(n / 1024)))} کیلوبایت`);

function imageSize(url: string) {
  return new Promise<{ w: number; h: number } | null>((res) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => res(null);
    img.src = url;
  });
}

/** Amount column → number in rial. Accepts Persian digits and separators. */
const num = (s: string) => parseFloat(toEn(s).replace(/[^\d.-]/g, "")) || 0;

function parseCsv(text: string) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const sep = [",", ";", "\t"].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
  const head = lines[0].split(sep).map((h) => h.replace(/"/g, "").trim());
  const find = (re: RegExp) => head.findIndex((h) => re.test(h));
  const iDate = find(/تاریخ|date/i), iDesc = find(/شرح|توضیح|desc|narr/i);
  const iIn = find(/واریز|بستانکار|credit|deposit/i), iAmt = find(/مبلغ|amount/i);
  if (iIn < 0 && iAmt < 0) return null;
  const rows = lines.slice(1).map((l) => {
    const c = l.split(sep).map((x) => x.replace(/"/g, "").trim());
    return { date: c[iDate] ?? "", desc: c[iDesc] ?? c[0] ?? "", amount: num(c[iIn >= 0 ? iIn : iAmt] ?? "") };
  }).filter((r) => r.amount > 0);
  return rows.length ? rows : null;
}

export async function analyzeFile(f: File): Promise<Analysis> {
  const name = f.name;
  const lower = name.toLowerCase();
  const size = kb(f.size);
  const demo = readFile(name);

  if (f.type.startsWith("image/")) {
    const url = f.size > 64 ? URL.createObjectURL(f) : undefined;
    const dim = url ? await imageSize(url) : null;
    const wide = dim ? dim.w / dim.h > 1.8 : false;
    const cheque = /چک|cheque|check/i.test(name) || wide;
    const d = cheque ? readFile("چک") : demo;
    return {
      name, kind: "image", url,
      meta: dim ? `${toFa(dim.w)}×${toFa(dim.h)} پیکسل · ${size}` : size,
      fields: [[cheque ? "نوع سند" : "نوع مدرک", cheque ? "چک صیادی" : "فیش واریز"], ...d.fields],
      text: d.text,
    };
  }

  if (f.type === "application/pdf" || lower.endsWith(".pdf")) {
    let pages = 1;
    try {
      const raw = new TextDecoder("latin1").decode(await f.arrayBuffer());
      pages = Math.max(1, (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length);
    } catch { /* unreadable: keep one page */ }
    return { name, kind: "pdf", meta: `${toFa(pages)} صفحه · ${size}`, fields: [["نوع مدرک", "فاکتور یا رسید"], ...demo.fields], text: demo.text };
  }

  if (/\.(csv|txt|tsv)$/.test(lower) || f.type.startsWith("text/")) {
    const text = await f.text();
    const rows = /\.(csv|tsv)$/.test(lower) ? parseCsv(text) : null;
    if (rows) {
      const top = [...rows].sort((a, b) => b.amount - a.amount)[0];
      const sum = rows.reduce((a, r) => a + r.amount, 0);
      return {
        name, kind: "sheet", meta: `${toFa(rows.length)} تراکنش · ${size}`, rows,
        fields: [["تعداد واریز", toFa(rows.length)], ["جمع واریزها", `${group(sum)} ریال`], ["بزرگ‌ترین واریز", `${group(top.amount)} ریال`]],
        text: `${top.amount} ریال ${top.desc} واریز شد`,
        note: rows.length > 1 ? `از ${toFa(rows.length)} واریز، بزرگ‌ترین را برای این سند برداشتم. بقیه را می‌توانید جدا ثبت کنید.` : undefined,
      };
    }
    const sentence = text.replace(/\s+/g, " ").trim().slice(0, 220);
    return { name, kind: "text", meta: `${toFa(sentence.split(" ").length)} کلمه · ${size}`, fields: [["متن خوانده‌شده", sentence.length > 60 ? sentence.slice(0, 58) + "…" : sentence]], text: sentence || demo.text };
  }

  if (/\.(xlsx|xls)$/.test(lower)) {
    return { name, kind: "sheet", meta: size, fields: [["نوع مدرک", "صورت‌حساب بانک"], ...demo.fields], text: demo.text };
  }
  return { name, kind: "other", meta: size, fields: demo.fields, text: demo.text };
}

/** A sample receipt for people who just want to see the flow. */
export const sampleReceipt = () => new File(["demo"], "فیش-پارسیان-۰۹۱۲.jpg", { type: "image/jpeg" });
export const ACCEPT = "image/*,.pdf,.csv,.txt,.xlsx,.xls";
