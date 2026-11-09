import * as React from "react";
import { ArrowDownLeft, ArrowUpLeft, ArrowSwapVertical, FileText } from "@/components/icons";
import { useApp } from "@/lib/store";
import { accountBy, kindLabel, statusLabel, type Doc, type DocKind } from "@/data/demo";
import { cn, group, shortToman, toFa } from "@/lib/utils";
import { fmtDay } from "@/lib/jalali";
import { Badge } from "@/components/ui/badge";
import { Empty, statusTone } from "@/pages/Dashboard";
import { docNo } from "@/components/voucher/VoucherEditor";

/* Every document that touches one bank: receipts, payments, transfers and cheques.
   The amount is what moved in or out of that bank's accounts, so the list reads like a statement. */
type Row = { doc: Doc; amount: number; accounts: string[] };
const FILTERS: [string, string][] = [["all", "همه"], ["in", "دریافت"], ["out", "پرداخت"], ["transfer", "انتقال"], ["cheque", "چک"]];

export function useBankDocs(bankName: string): Row[] {
  const { docs } = useApp();
  const key = bankName.replace(/^بانک\s*/, "").replace(/‌ی$/, "");
  return React.useMemo(() => docs.map((d) => {
    const lines = d.lines.filter((l) => accountBy(l.account)?.name.includes(key));
    return { doc: d, amount: lines.reduce((x, l) => x + l.debit - l.credit, 0), accounts: [...new Set(lines.map((l) => accountBy(l.account)!.name.split("·")[1]?.trim() ?? ""))] };
  }).filter((r) => r.accounts.length).sort((a, b) => b.doc.m - a.doc.m || b.doc.d - a.doc.d), [docs, key]);
}

const pass = (f: string, r: Row) => f === "all" || (f === "in" ? r.amount > 0 && r.doc.kind !== "transfer" : f === "out" ? r.amount < 0 && r.doc.kind !== "transfer" : r.doc.kind === (f as DocKind));

export function BankDocs({ bankName, variant }: { bankName: string; variant: "table" | "feed" }) {
  const { openDoc } = useApp();
  const rows = useBankDocs(bankName);
  const [f, setF] = React.useState("all");
  const shown = rows.filter((r) => pass(f, r));
  const inSum = rows.filter((r) => r.amount > 0).reduce((x, r) => x + r.amount, 0);
  const outSum = rows.filter((r) => r.amount < 0).reduce((x, r) => x - r.amount, 0);

  const filters = (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="نوع سند">
      {FILTERS.map(([k, l]) => {
        const n = rows.filter((r) => pass(k, r)).length;
        return <button key={k} aria-pressed={f === k} onClick={() => setF(k)} className="chip h-8 text-[12.5px]">{l} <span className="num opacity-70">{toFa(n)}</span></button>;
      })}
    </div>
  );
  const empty = rows.length ? <Empty icon={FileText} title="سندی با این فیلتر نیست" text="فیلتر دیگری را امتحان کنید." /> : <Empty icon={FileText} title="هنوز سندی برای این بانک ثبت نشده" text="بعد از افتتاح حساب، دریافت و پرداخت‌های این بانک اینجا می‌آید." />;

  if (variant === "table") {
    return (
      <section className="panel flex min-w-0 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[15px] font-extrabold">اسناد این بانک</h3>
          <span className="num text-[12px] text-muted-foreground">ورودی {shortToman(inSum)} · خروجی {shortToman(outSum)}</span>
          <div className="ms-auto">{filters}</div>
        </div>
        {shown.length ? (
          <div className="overflow-x-auto rounded-field border border-border">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead><tr className="bg-muted/60 text-[12px] text-muted-foreground">
                <th className="px-4 py-2.5 text-start font-semibold">شماره</th><th className="px-2 py-2.5 text-start font-semibold">تاریخ</th><th className="px-2 py-2.5 text-start font-semibold">شرح</th>
                <th className="px-2 py-2.5 text-start font-semibold">نوع</th><th className="px-2 py-2.5 text-end font-semibold">ورود / خروج (ریال)</th><th className="px-4 py-2.5 text-start font-semibold">وضعیت</th>
              </tr></thead>
              <tbody>
                {shown.map(({ doc: d, amount, accounts }) => (
                  <tr key={d.id} onClick={() => openDoc(d.id)} className="cursor-pointer border-t border-border/70 hover:bg-muted/40">
                    <td className="num px-4 py-3 text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{docNo(d.m, d.seq)}</td>
                    <td className="num px-2 py-3">{fmtDay(d.m, d.d)}</td>
                    <td className="px-2 py-3"><button className="text-start font-semibold hover:text-primary" onClick={(e) => { e.stopPropagation(); openDoc(d.id); }}>{d.title}</button><span className="block text-[11.5px] text-muted-foreground">{accounts.join("، ")}</span></td>
                    <td className="px-2 py-3 text-muted-foreground">{kindLabel[d.kind]}</td>
                    <td className={cn("num px-2 py-3 text-end font-bold", amount > 0 ? "text-success" : amount < 0 ? "text-danger" : "")} dir="ltr" style={{ textAlign: "left" }}>{amount > 0 ? "+" : amount < 0 ? "−" : ""}{group(Math.abs(amount))}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : empty}
      </section>
    );
  }

  // «دستیار»: a statement-like feed with a money-in / money-out bar on top
  const max = Math.max(inSum, outSum, 1);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 px-1">
        <h3 className="text-[15px] font-extrabold">گردش اسناد <span className="num text-[12px] font-medium text-muted-foreground">{toFa(rows.length)}</span></h3>
        <div className="ms-auto">{filters}</div>
      </div>
      <div className="panel flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {([["ورودی", inSum, "bg-success", ArrowDownLeft], ["خروجی", outSum, "bg-danger", ArrowUpLeft]] as const).map(([l, v, c, I]) => (
            <div key={l}>
              <div className="num flex items-center justify-between text-[12.5px]"><span className="flex items-center gap-1.5 text-muted-foreground"><I className="size-4" />{l}</span><b>{shortToman(v)}</b></div>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", c)} style={{ width: `${(v / max) * 100}%` }} /></span>
            </div>
          ))}
        </div>
        {shown.length ? (
          <ol className="flex flex-col">
            {shown.map(({ doc: d, amount, accounts }) => {
              const I = d.kind === "transfer" ? ArrowSwapVertical : amount >= 0 ? ArrowDownLeft : ArrowUpLeft;
              return (
                <li key={d.id}>
                  <button onClick={() => openDoc(d.id)} className="flex w-full items-center gap-3 rounded-field px-2 py-2.5 text-start hover:bg-muted/60">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", amount >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}><I className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[13.5px]">{d.title}</b>
                      <span className="num block truncate text-[11.5px] text-muted-foreground">{fmtDay(d.m, d.d)} · {kindLabel[d.kind]} · {accounts.join("، ")} · {statusLabel[d.status]}</span>
                    </span>
                    <b className={cn("num shrink-0 text-[13.5px]", amount >= 0 ? "text-success" : "text-danger")} dir="ltr">{amount >= 0 ? "+" : "−"}{group(Math.abs(amount))}</b>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : empty}
      </div>
    </section>
  );
}
