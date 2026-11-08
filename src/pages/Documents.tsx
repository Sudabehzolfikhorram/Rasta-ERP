import * as React from "react";
import { CheckCheck, FileImage, FilePlus2, Keyboard, Mic, Paperclip, PencilLine, Search, Sparkles, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { accountBy, kindLabel, sourceLabel, statusLabel, type Doc, type DocKind, type DocStatus } from "@/data/demo";
import { cn, group, money, toFa, unitLabel } from "@/lib/utils";
import { diffDays, fmtDay, fmtFull, TODAY } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { docNo, docTotal, partyOf } from "@/components/voucher/VoucherEditor";

const statusTone: Record<DocStatus, "neutral" | "warning" | "success"> = { draft: "neutral", pending: "warning", posted: "success" };
const SourceIcon = ({ s }: { s: Doc["source"] }) => {
  const I = s === "ai" ? Sparkles : s === "voice" ? Mic : s === "file" ? FileImage : Keyboard;
  return <I className={cn("size-3.5", s === "manual" ? "text-muted-foreground" : "text-ai")} aria-hidden />;
};

type Tab = "all" | DocStatus;
type When = "all" | "week" | "today";

export function Documents() {
  const { docs, setDocStatus, startVoucher, toast, unit } = useApp();
  const [tab, setTab] = React.useState<Tab>("all");
  const [kinds, setKinds] = React.useState<DocKind[]>([]);
  const [when, setWhen] = React.useState<When>("all");
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState<Doc | null>(null);

  const count = (s: Tab) => docs.filter((d) => s === "all" || d.status === s).length;
  const list = docs
    .filter((d) => tab === "all" || d.status === tab)
    .filter((d) => !kinds.length || kinds.includes(d.kind))
    .filter((d) => when === "all" || (when === "today" ? diffDays(d.m, d.d) === 0 : diffDays(d.m, d.d) > -7))
    .filter((d) => !q || d.title.includes(q) || partyOf(d).includes(q) || docNo(d.m, d.seq).includes(toFa(q)) || String(d.seq).includes(q))
    .sort((a, b) => (b.m * 100 + b.d) - (a.m * 100 + a.d) || b.seq - a.seq);
  const pendingSel = sel.filter((id) => docs.find((d) => d.id === id)?.status === "pending");
  const allOn = list.length > 0 && list.every((d) => sel.includes(d.id));
  const sum = list.reduce((a, d) => a + docTotal(d), 0);
  const u = unitLabel(unit);

  const approve = (ids: string[]) => {
    setDocStatus(ids, "posted");
    setSel((s) => s.filter((x) => !ids.includes(x)));
    toast(`${toFa(ids.length)} سند تأیید شد.`);
  };

  const tabs: [Tab, string][] = [["all", "همه"], ["pending", "منتظر تأیید"], ["draft", "پیش‌نویس"], ["posted", "ثبت‌شده"]];

  return (
    <div className="flex flex-col gap-4">
      <section className="panel flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="وضعیت سند" className="flex flex-wrap gap-1 rounded-full bg-muted/80 p-1">
            {tabs.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setSel([]); }}
                className={cn("flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground", tab === k && "bg-surface text-foreground shadow-soft")}>
                {l}<span className={cn("num rounded-full px-1.5 text-[11px]", tab === k ? "bg-primary-soft text-primary" : "bg-surface/70")}>{toFa(count(k))}</span>
              </button>
            ))}
          </div>
          <div className="relative ms-auto min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="شرح، طرف حساب یا شماره" aria-label="جست‌وجوی سند" className="h-10 rounded-full pe-9" />
          </div>
          <Button onClick={() => startVoucher()}><FilePlus2 /> سند تازه</Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(kindLabel) as DocKind[]).map((k) => (
            <button key={k} className="chip h-7" aria-pressed={kinds.includes(k)} onClick={() => setKinds((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))}>{kindLabel[k]}</button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          {([["all", "کل آبان"], ["week", "۷ روز اخیر"], ["today", "امروز"]] as [When, string][]).map(([k, l]) => (
            <button key={k} className="chip h-7" aria-pressed={when === k} onClick={() => setWhen(k)}>{l}</button>
          ))}
          {(kinds.length > 0 || when !== "all" || q) && (
            <button className="ms-1 flex items-center gap-1 text-[12px] font-semibold text-primary" onClick={() => { setKinds([]); setWhen("all"); setQ(""); }}><X className="size-3.5" />پاک کردن فیلترها</button>
          )}
        </div>
      </section>

      {pendingSel.length > 0 && (
        <div className="panel flex items-center gap-3 px-4 py-2.5 animate-rise">
          <span className="num text-[13px]"><b>{toFa(pendingSel.length)}</b> سند منتظر تأیید انتخاب شده</span>
          <Button size="sm" variant="success" className="ms-auto" onClick={() => approve(pendingSel)}><CheckCheck /> تأیید</Button>
        </div>
      )}

      <section className="panel-data overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-[12px] text-muted-foreground">
                <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="انتخاب همه" checked={allOn} onChange={() => setSel(allOn ? [] : list.map((d) => d.id))} className="size-4 accent-[hsl(var(--primary))]" /></th>
                <th className="px-2 py-3 text-start font-semibold">شماره</th>
                <th className="px-2 py-3 text-start font-semibold">تاریخ</th>
                <th className="px-2 py-3 text-start font-semibold">شرح</th>
                <th className="px-2 py-3 text-start font-semibold">نوع</th>
                <th className="px-2 py-3 text-start font-semibold">مبلغ ({u})</th>
                <th className="px-2 py-3 text-start font-semibold">ثبت</th>
                <th className="px-3 py-3 text-start font-semibold">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} onClick={() => setOpen(d)} className={cn("cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-primary-soft/40", d.fresh && "animate-flash", sel.includes(d.id) && "bg-primary-soft/50")}>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label={`انتخاب سند ${docNo(d.m, d.seq)}`} checked={sel.includes(d.id)} onChange={() => setSel((x) => (x.includes(d.id) ? x.filter((y) => y !== d.id) : [...x, d.id]))} className="size-4 accent-[hsl(var(--primary))]" />
                  </td>
                  <td className="num px-2 py-3 font-semibold" dir="ltr" style={{ textAlign: "right" }}>{docNo(d.m, d.seq)}</td>
                  <td className="num px-2 py-3 text-muted-foreground">{fmtDay(d.m, d.d)}</td>
                  <td className="max-w-[320px] px-2 py-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold">{d.title}</span>
                      {d.attachments.length > 0 && <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-label="پیوست دارد" />}
                      {d.fresh && <Badge tone="ai">تازه</Badge>}
                    </div>
                    <div className="truncate text-[12px] text-muted-foreground">{partyOf(d)}</div>
                  </td>
                  <td className="px-2 py-3"><span className="rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-semibold text-muted-foreground">{kindLabel[d.kind]}</span></td>
                  <td className="num px-2 py-3 font-bold">{money(docTotal(d), unit)}</td>
                  <td className="px-2 py-3"><span className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><SourceIcon s={d.source} />{sourceLabel[d.source]}</span></td>
                  <td className="px-3 py-3"><Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Search className="size-6 text-muted-foreground" />
              <b className="text-[14px]">سندی با این فیلترها نیست</b>
              <button className="text-[13px] font-semibold text-primary" onClick={() => { setTab("all"); setKinds([]); setWhen("all"); setQ(""); }}>نمایش همه</button>
            </div>
          )}
        </div>
        <div className="num flex items-center gap-4 border-t border-border bg-surface-2/80 px-4 py-3 text-[12.5px] text-muted-foreground">
          <span>{toFa(list.length)} سند</span>
          <span className="ms-auto">جمع: <b className="text-[14px] text-foreground">{money(sum, unit)}</b> {u}</span>
        </div>
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {open && (
          <DialogContent aria-describedby={undefined} className="bottom-4 left-4 top-4 w-[min(560px,calc(100vw-32px))] translate-x-0 overflow-y-auto data-[state=open]:slide-in-from-left-4 data-[state=open]:slide-in-from-top-0">
            <div className="flex items-start gap-3 border-b border-border p-5">
              <div className="min-w-0 flex-1">
                <div className="num text-[12px] text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{docNo(open.m, open.seq)}</div>
                <DialogTitle className="mt-0.5 text-[18px] font-extrabold">{open.title}</DialogTitle>
                <div className="num mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
                  <Badge tone={statusTone[open.status]}>{statusLabel[open.status]}</Badge>
                  {fmtFull(open.m, open.d)} · {kindLabel[open.kind]} · {sourceLabel[open.source]} · {open.by}
                </div>
              </div>
              <button aria-label="بستن" onClick={() => setOpen(null)} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="p-5">
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {open.lines.map((l) => (
                  <li key={l.id} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-3">
                    <b className="truncate text-[13.5px]">{accountBy(l.account)?.name ?? "بدون حساب"}</b>
                    <b className={cn("num text-[13.5px]", l.credit ? "text-muted-foreground" : "")}>{l.debit ? `${money(l.debit, unit)} بد` : `${money(l.credit, unit)} بس`}</b>
                    <span className="truncate text-[12px] text-muted-foreground">{l.desc}</span>
                  </li>
                ))}
              </ul>
              <div className="num mt-3 flex justify-between px-1 text-[13px]"><span className="text-muted-foreground">جمع</span><b>{group(unit === "rial" ? docTotal(open) : docTotal(open) / 10)} {u}</b></div>
              <h4 className="mt-5 text-[13px] font-bold">پیوست‌ها</h4>
              {open.attachments.length ? (
                <div className="mt-2 flex flex-wrap gap-2">{open.attachments.map((a) => <span key={a} className="flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-[12.5px]"><FileImage className="size-4 text-primary" />{a}</span>)}</div>
              ) : <p className="mt-1 text-[12.5px] text-muted-foreground">پیوستی ندارد.</p>}
              <div className="mt-6 flex flex-wrap gap-2">
                {open.status === "pending" && <Button variant="success" onClick={() => { approve([open.id]); setOpen(null); }}><CheckCheck /> تأیید</Button>}
                {open.status !== "posted" && <Button variant="outline" onClick={() => { const d = open; setOpen(null); startVoucher({ doc: d }); }}><PencilLine /> ویرایش</Button>}
                {open.status === "posted" && <p className="text-[12.5px] text-muted-foreground">سند ثبت‌شده فقط با سند اصلاحی تغییر می‌کند.</p>}
              </div>
              {open.m === TODAY.m && <p className="num mt-4 text-[11.5px] text-muted-foreground">ساخته شده در {fmtDay(open.m, open.d)}</p>}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
