import * as React from "react";
import { AlertTriangle, Check, CircleDashed, Lock, ShieldCheck, X } from "@/components/icons";
import { useApp } from "@/lib/store";
import { kindLabel, type Doc } from "@/data/demo";
import { cn, group, tomanWords, toFa } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { balanceDoc, buildChecks, docBalanced, docNo, docTotal, VoucherEditor } from "./VoucherEditor";

/* The approval step as a form: every field of the voucher stays editable, the automatic checks sit next
   to the fields they are about, and the approver confirms what a machine cannot check. */
const CONFIRMS = [
  ["evidence", "مبلغ و تاریخ با مدرک پیوست می‌خواند"],
  ["party", "طرف حساب و حساب‌های ردیف‌ها درست است"],
  ["desc", "شرح سند برای حسابرس کافی است"],
] as const;

export function ReviewForm({ doc, setDoc, onApprove, onCancel, approveLabel, cancelLabel = "انصراف", note }: {
  doc: Doc; setDoc: (fn: (d: Doc) => Doc) => void; onApprove: () => void; onCancel: () => void; approveLabel: string; cancelLabel?: string; note?: string;
}) {
  const { docs, settings, toast } = useApp();
  const [dupOk, setDupOk] = React.useState(false);
  const [ok, setOk] = React.useState<string[]>([]);
  const checks = buildChecks(doc, docs, settings, dupOk, setDupOk, () => setDoc(balanceDoc), toast);
  const bad = checks.filter((c) => c.state === "bad");
  const total = docTotal(doc);
  const reviewed = checks.filter((c) => c.state === "ok").length + ok.length;
  const all = checks.length + CONFIRMS.length;
  const ready = docBalanced(doc) && !bad.length && ok.length === CONFIRMS.length;

  return (
    <div className="flex flex-col gap-4">
      <section className="panel flex flex-wrap items-center gap-4 p-5">
        <span className="grid size-12 place-items-center rounded-[14px] bg-primary-soft text-primary"><ShieldCheck className="size-6" variant="Bulk" /></span>
        <div className="min-w-[220px] flex-1">
          <h2 className="text-[17px] font-extrabold">بررسی و تأیید سند {docNo(doc.m, doc.seq)}</h2>
          <p className="num text-[12.5px] text-muted-foreground">{note ?? "همه‌ی خانه‌ها قابل ویرایش‌اند؛ هر تغییری پیش از تأیید دوباره بررسی می‌شود."}</p>
        </div>
        <div className="min-w-[160px]">
          <div className="num flex justify-between text-[12px] text-muted-foreground"><span>بررسی‌شده</span><b className="text-foreground">{toFa(reviewed)} از {toFa(all)}</b></div>
          <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full transition-[width]", ready ? "bg-success" : "bg-primary")} style={{ width: `${(reviewed / all) * 100}%` }} /></span>
        </div>
      </section>

      <VoucherEditor doc={doc} setDoc={setDoc} />

      <section className="panel grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-[15px] font-extrabold">بررسی خودکار</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {checks.map((c) => (
              <li key={c.id} className={cn("flex gap-2.5 rounded-field border p-3", c.state === "bad" ? "border-danger/40 bg-danger-soft/40" : c.state === "warn" ? "border-warning/40 bg-warning-soft/40" : "border-border bg-surface/60")}>
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", c.state === "ok" && "bg-success-soft text-success", c.state === "warn" && "bg-warning-soft text-warning", c.state === "bad" && "bg-danger-soft text-danger", c.state === "idle" && "bg-muted text-muted-foreground")}>
                  {c.state === "ok" ? <Check className="size-3.5" /> : c.state === "idle" ? <CircleDashed className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[13px]">{c.label}</b>
                  <span className="num block text-[12px] leading-5 text-muted-foreground">{c.note}</span>
                  {c.action && <button type="button" onClick={c.action.run} className="mt-0.5 text-[12px] font-bold text-primary underline-offset-4 hover:underline">{c.action.label}</button>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col">
          <h3 className="mb-3 text-[15px] font-extrabold">تأیید شما</h3>
          <div className="flex flex-col gap-2">
            {CONFIRMS.map(([k, l]) => (
              <label key={k} className={cn("flex cursor-pointer items-center gap-3 rounded-field border p-3 text-[13.5px] transition-colors", ok.includes(k) ? "border-success/40 bg-success-soft/40" : "border-border bg-surface/60 hover:border-primary/40")}>
                <Checkbox checked={ok.includes(k)} onCheckedChange={() => setOk((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))} />{l}
              </label>
            ))}
          </div>
          <dl className="num mt-4 grid grid-cols-2 gap-3 rounded-field bg-muted/50 p-4 text-[12.5px]">
            <div><dt className="text-muted-foreground">نوع</dt><dd className="font-bold">{kindLabel[doc.kind]}</dd></div>
            <div><dt className="text-muted-foreground">پیوست</dt><dd className="font-bold">{doc.attachments.length ? `${toFa(doc.attachments.length)} فایل` : "ندارد"}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">جمع سند</dt><dd><b className="text-[16px]">{group(total)}</b> ریال</dd><dd className="text-muted-foreground">{total ? tomanWords(total) : "—"}</dd></div>
          </dl>
        </div>
      </section>

      <div className="panel sticky bottom-3 z-10 flex flex-wrap items-center gap-3 p-4">
        <span className="num min-w-[200px] flex-1 text-[12.5px] text-muted-foreground">
          {ready ? <span className="flex items-center gap-1.5 font-bold text-success"><Check className="size-4" /> همه‌چیز آماده‌ی تأیید است</span>
            : bad.length ? `${toFa(bad.length)} مورد باید اصلاح شود: ${bad.map((b) => b.label).join("، ")}`
            : `${toFa(CONFIRMS.length - ok.length)} مورد را خودتان تأیید کنید`}
        </span>
        <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
        <Button disabled={!ready} onClick={onApprove}><Lock /> {approveLabel}</Button>
      </div>
    </div>
  );
}

/** The same form in a large dialog, for approving a saved document. */
export function ReviewDialog({ doc, open, onOpenChange, onApprove, approveLabel, note }: { doc: Doc; open: boolean; onOpenChange: (o: boolean) => void; onApprove: (d: Doc) => void; approveLabel: string; note?: string }) {
  const [draft, setDraft] = React.useState(doc);
  React.useEffect(() => { if (open) setDraft(doc); }, [open, doc]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="top-[4vh] max-h-[92vh] w-[min(1080px,calc(100vw-24px))] overflow-y-auto bg-background p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <DialogTitle className="text-[13px] font-bold text-muted-foreground">فرم تأیید</DialogTitle>
          <button aria-label="بستن" onClick={() => onOpenChange(false)} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>
        <ReviewForm doc={draft} setDoc={(fn) => setDraft(fn)} onCancel={() => onOpenChange(false)} onApprove={() => onApprove(draft)} approveLabel={approveLabel} note={note} />
      </DialogContent>
    </Dialog>
  );
}
