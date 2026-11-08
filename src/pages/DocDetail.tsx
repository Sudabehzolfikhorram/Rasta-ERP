import * as React from "react";
import { ArrowRight, Check, CheckCheck, FileImage, FileText, History, PencilLine, Printer, Send, Undo2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { accountBy, accounts, kindLabel, sourceLabel, statusLabel, type Doc, type DocEvent } from "@/data/demo";
import { cn, group, money, toEn, toFa, unitLabel } from "@/lib/utils";
import { fmtFull, MONTHS } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Orb } from "@/components/ai/Orb";
import { wordsToDigits } from "@/components/voucher/agent";
import { Attachments, docNo, docTotal, partyOf } from "@/components/voucher/VoucherEditor";
import { Empty, statusTone } from "@/pages/Dashboard";

/* ---------- the document assistant: understands a few edit requests and proposes a change ---------- */
type Proposal = { summary: string; apply: (d: Doc) => Doc; note: string };
function propose(text: string, d: Doc, limit: number): Proposal | string {
  const t = wordsToDigits(toEn(text)).replace(/[٬,]/g, "");
  const two = d.lines.length === 2;
  const amt = t.match(/مبلغ.*?(\d+(?:\.\d+)?)\s*(میلیارد|میلیون|هزار)?\s*(تومان|ریال)?/);
  if (amt) {
    if (!two) return "این سند بیش از دو ردیف دارد. مبلغ هر ردیف را از «ویرایش دستی» تغییر دهید.";
    const v = +amt[1] * (amt[2] === "میلیارد" ? 1e9 : amt[2] === "میلیون" ? 1e6 : amt[2] === "هزار" ? 1e3 : 1) * (amt[3] === "تومان" ? 10 : 1);
    return {
      summary: `مبلغ هر دو ردیف از ${group(docTotal(d))} به ${group(v)} ریال تغییر می‌کند.${v > limit && d.status === "posted" ? " چون از سقف تأیید بیشتر است، سند دوباره منتظر تأیید می‌ماند." : ""}`,
      apply: (x) => ({ ...x, lines: x.lines.map((l) => ({ ...l, debit: l.debit ? v : 0, credit: l.credit ? v : 0 })), status: v > limit ? "pending" : x.status }),
      note: "دستیار مبلغ را تغییر داد",
    };
  }
  const date = t.match(/تاریخ.*?(\d{1,2})\s*(مهر|آبان)/);
  if (date) {
    const m = MONTHS.indexOf(date[2]) + 1;
    if (m === 7) return "دوره‌ی مهر بسته شده است. تاریخ سند فقط می‌تواند در آبان باشد.";
    return { summary: `تاریخ سند از ${toFa(d.d)} ${MONTHS[d.m - 1]} به ${toFa(date[1])} ${date[2]} تغییر می‌کند.`, apply: (x) => ({ ...x, m, d: +date[1] }), note: "دستیار تاریخ را تغییر داد" };
  }
  const desc = text.match(/شرح\s*(?:را|سند را)?\s*(?:به\s*)?[«"]?([^«»"]+?)[»"]?\s*(?:کن|بگذار|تغییر بده)\s*$/);
  if (desc) {
    const v = desc[1].trim();
    return { summary: `شرح سند و ردیف‌ها «${v}» می‌شود.`, apply: (x) => ({ ...x, title: v, lines: x.lines.map((l) => ({ ...l, desc: v })) }), note: "دستیار شرح را تغییر داد" };
  }
  const bank = accounts.filter((a) => a.group === "cash").find((a) => t.includes(a.name.split(" ")[1] ?? "") && /بانک|حساب|صندوق/.test(t));
  if (bank) {
    const i = d.lines.findIndex((l) => accountBy(l.account)?.group === "cash");
    if (i < 0) return "در این سند ردیف بانکی پیدا نکردم.";
    return { summary: `حساب «${accountBy(d.lines[i].account)!.name}» به «${bank.name}» تغییر می‌کند.`, apply: (x) => ({ ...x, lines: x.lines.map((l, j) => (j === i ? { ...l, account: bank.code } : l)) }), note: "دستیار حساب بانکی را تغییر داد" };
  }
  return "این تغییر را متوجه نشدم. می‌توانید مبلغ، تاریخ، شرح یا حساب بانکی را بخواهید، یا از «ویرایش دستی» استفاده کنید.";
}

const SUGGEST = (d: Doc) => [
  `مبلغ را ${toFa(Math.round(docTotal(d) / 10 / 1e6 * 1.1))} میلیون تومان کن`,
  "تاریخ را ۱۵ آبان کن",
  "حساب بانک را ملت کن",
  `شرح را «${d.title} طی فاکتور ۲۲۰» کن`,
];

function DocAssistant({ doc, big }: { doc: Doc; big?: boolean }) {
  const { settings, saveDoc, startChat, addMsg, toast, startVoucher } = useApp();
  const [msgs, setMsgs] = React.useState<{ who: "me" | "ai"; text: string; p?: Proposal; state?: "open" | "done" | "skip" }[]>([
    { who: "ai", text: "اگر تغییری در این سند لازم است، به من بگویید تا انجام دهم. یا از «ویرایش دستی» خودتان تغییر دهید." },
  ]);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const chatId = React.useRef<string | null>(null);
  const end = React.useRef<HTMLLIElement>(null);
  React.useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs, busy]);

  const send = (t = text) => {
    const q = t.trim(); if (!q) return;
    setText("");
    setMsgs((m) => [...m, { who: "me", text: q }]);
    if (!chatId.current) chatId.current = startChat("doc", `سند ${docNo(doc.m, doc.seq)}: ${q}`); else addMsg(chatId.current, { who: "me", text: q });
    setBusy(true);
    setTimeout(() => {
      const r = propose(q, doc, settings.approvalLimit);
      const reply = typeof r === "string" ? r : `${r.summary} اعمال شود؟`;
      setMsgs((m) => [...m, typeof r === "string" ? { who: "ai", text: r } : { who: "ai", text: reply, p: r, state: "open" }]);
      addMsg(chatId.current!, { who: "ai", text: reply });
      setBusy(false);
    }, 800);
  };
  const decide = (i: number, ok: boolean) => {
    const m = msgs[i];
    if (ok && m.p) { saveDoc(m.p.apply(doc), m.p.note); toast("تغییر روی سند اعمال شد.", "ai"); }
    setMsgs((x) => x.map((y, j) => (j === i ? { ...y, state: ok ? "done" : "skip" } : y)));
  };

  return (
    <section className={cn("panel flex flex-col", big ? "min-h-[460px] p-5" : "p-4")} aria-label="دستیار سند">
      <div className="mb-3 flex items-center gap-2.5">
        <Orb size={big ? 36 : 28} busy={busy} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-extrabold">دستیار سند</h2>
          {big && <p className="text-[12px] text-muted-foreground">تغییر را بنویسید؛ پیش از اعمال، خلاصه‌اش را نشانتان می‌دهم.</p>}
        </div>
        <Button size="sm" variant="outline" onClick={() => startVoucher({ doc })}><PencilLine /> ویرایش دستی</Button>
      </div>
      <ol className={cn("flex flex-1 flex-col gap-3 overflow-y-auto pe-1", big ? "max-h-[420px]" : "max-h-[260px]")} aria-live="polite">
        {msgs.map((m, i) => (
          <li key={i} className={cn("flex items-start gap-2.5 animate-rise", m.who === "me" && "flex-row-reverse")}>
            {m.who === "ai" && <Orb size={22} />}
            <div className={cn("num max-w-[88%] rounded-[calc(var(--r-field)+4px)] px-3.5 py-2.5 text-[13px] leading-7", m.who === "me" ? "bg-primary text-primary-foreground" : "border border-border bg-surface")}>
              {m.text}
              {m.p && m.state === "open" && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="ai" onClick={() => decide(i, true)}><Check /> اعمال</Button>
                  <Button size="sm" variant="ghost" onClick={() => decide(i, false)}>انصراف</Button>
                </div>
              )}
              {m.state === "done" && <div className="mt-1 flex items-center gap-1 text-[12px] font-bold text-success"><Check className="size-3.5" /> اعمال شد</div>}
              {m.state === "skip" && <div className="mt-1 text-[12px] text-muted-foreground">لغو شد</div>}
            </div>
          </li>
        ))}
        {busy && <li className="flex items-center gap-2 text-[12.5px] text-muted-foreground"><Orb size={22} busy /> در حال بررسی…</li>}
        <li ref={end} aria-hidden />
      </ol>
      {msgs.length < 2 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGEST(doc).slice(0, big ? 4 : 2).map((s) => <button key={s} onClick={() => send(s)} className="chip h-auto min-h-7 py-1 text-start text-[12px]">{s}</button>)}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex items-center gap-1.5 rounded-[calc(var(--r-field)+2px)] border border-input bg-surface p-1 ps-3 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label="درخواست تغییر سند" placeholder="مثلاً: تاریخ را ۱۵ آبان کن" className="h-9 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground" />
        <Button type="submit" size="sm" variant="ai" disabled={!text.trim() || busy} aria-label="ارسال"><Send /></Button>
      </form>
    </section>
  );
}

function Timeline({ items }: { items: DocEvent[] }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><History className="size-4 text-muted-foreground" /> تاریخچه‌ی سند</h2>
      {items.length ? (
        <ol className="relative flex flex-col gap-4 ps-6">
          <span className="absolute bottom-1 start-[7px] top-1 w-px bg-border" aria-hidden />
          {[...items].reverse().map((h, i) => (
            <li key={i} className="relative">
              <span className={cn("absolute -start-6 top-1 size-[15px] rounded-full border-[3px] border-surface", h.tone === "ok" ? "bg-success" : h.tone === "warn" ? "bg-warning" : h.tone === "ai" ? "bg-ai" : "bg-muted-foreground")} />
              <div className="text-[13px] font-bold">{h.text}</div>
              <div className="num text-[12px] text-muted-foreground">{h.who} · {h.at}</div>
            </li>
          ))}
        </ol>
      ) : <Empty icon={History} title="تاریخچه‌ای ثبت نشده" />}
    </section>
  );
}

function Lines({ doc }: { doc: Doc }) {
  const { unit } = useApp();
  return (
    <section className="panel-data overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="border-b border-border text-[12px] text-muted-foreground">
              <th className="w-10 px-4 py-3 text-start font-semibold">ردیف</th>
              <th className="px-2 py-3 text-start font-semibold">حساب</th>
              <th className="px-2 py-3 text-end font-semibold">بدهکار</th>
              <th className="px-4 py-3 text-end font-semibold">بستانکار</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={l.id} className="border-b border-border/60 last:border-0">
                <td className="num px-4 py-3 text-muted-foreground">{toFa(i + 1)}</td>
                <td className="px-2 py-3">
                  <b className="block">{accountBy(l.account)?.name ?? "بدون حساب"}</b>
                  <span className="num block text-[12px] text-muted-foreground">{l.account ? toFa(l.account) : ""}{l.desc ? ` · ${l.desc}` : ""}</span>
                </td>
                <td className="num px-2 py-3 text-end font-bold">{l.debit ? money(l.debit, unit) : "—"}</td>
                <td className="num px-4 py-3 text-end font-bold">{l.credit ? money(l.credit, unit) : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-surface-2/80">
              <td colSpan={2} className="px-4 py-3 font-extrabold">جمع <span className="text-[12px] font-normal text-muted-foreground">({unitLabel(unit)})</span></td>
              <td className="num px-2 py-3 text-end font-extrabold">{money(docTotal(doc), unit)}</td>
              <td className="num px-4 py-3 text-end font-extrabold">{money(doc.lines.reduce((a, l) => a + l.credit, 0), unit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function DocDetail() {
  const { docs, docId, go, setDocStatus, toast, saveDoc, startVoucher, concept, settings, unit } = useApp();
  const doc = docs.find((d) => d.id === docId);
  if (!doc) {
    return <div className="panel"><Empty icon={FileText} title="این سند پیدا نشد" text="ممکن است حذف شده باشد یا نشانی آن اشتباه باشد." action={<Button size="sm" variant="soft" onClick={() => go("documents")}>بازگشت به اسناد</Button>} /></div>;
  }
  const no = docNo(doc.m, doc.seq);
  const total = docTotal(doc);
  const actions = (
    <div className="flex flex-wrap gap-2">
      {doc.status === "pending" && <Button variant="success" onClick={() => { setDocStatus([doc.id], "posted"); toast(`سند ${no} تأیید شد.`); }}><CheckCheck /> تأیید سند</Button>}
      {doc.status === "draft" && <Button onClick={() => { setDocStatus([doc.id], total > settings.approvalLimit ? "pending" : "posted", total > settings.approvalLimit ? "برای تأیید فرستاد" : "ثبت کرد"); toast(total > settings.approvalLimit ? `سند ${no} برای تأیید ارسال شد.` : `سند ${no} ثبت شد.`); }}><Send /> {total > settings.approvalLimit ? "ارسال برای تأیید" : "ثبت سند"}</Button>}
      <Button variant="outline" onClick={() => startVoucher({ doc })}><PencilLine /> ویرایش</Button>
      {doc.status === "pending" && <Button variant="ghost" onClick={() => { setDocStatus([doc.id], "draft", "برای اصلاح به پیش‌نویس برگرداند"); toast(`سند ${no} به پیش‌نویس برگشت.`); }}><Undo2 /> برگشت برای اصلاح</Button>}
      <Button variant="ghost" size="icon" aria-label="چاپ سند" onClick={() => window.print()}><Printer /></Button>
    </div>
  );
  const header = (
    <section className="panel p-5">
      <button onClick={() => go("documents")} className="no-print mb-3 flex items-center gap-1 text-[12.5px] font-bold text-muted-foreground hover:text-foreground"><ArrowRight className="size-4" /> اسناد</button>
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="num flex items-center gap-2 text-[12.5px] text-muted-foreground"><span dir="ltr">{no}</span><Badge tone={statusTone[doc.status]}>{statusLabel[doc.status]}</Badge></div>
          <h2 className="mt-1 text-[21px] font-extrabold">{doc.title}</h2>
          <p className="num mt-1 text-[12.5px] text-muted-foreground">{fmtFull(doc.m, doc.d)} · {kindLabel[doc.kind]} · {partyOf(doc)} · ثبت {sourceLabel[doc.source]} توسط {doc.by}</p>
        </div>
        <div className="text-end">
          <div className="text-[12px] text-muted-foreground">مبلغ سند</div>
          <div className="num text-[24px] font-extrabold">{money(total, unit)} <span className="text-[12px] font-medium text-muted-foreground">{unitLabel(unit)}</span></div>
        </div>
      </div>
      <div className="no-print mt-4 border-t border-border/70 pt-4">{actions}</div>
      {doc.status === "posted" && <p className="mt-3 text-[12px] text-muted-foreground">ویرایش سند تأییدشده در تاریخچه ثبت می‌شود و اگر مبلغ از سقف بیشتر شود، دوباره به تأیید نیاز دارد.</p>}
    </section>
  );
  const attachments = (
    <Attachments files={doc.attachments}
      onAdd={(n) => { saveDoc({ ...doc, attachments: [...new Set([...doc.attachments, ...n])] }, "پیوست اضافه کرد"); toast("پیوست اضافه شد."); }}
      onRemove={(n) => saveDoc({ ...doc, attachments: doc.attachments.filter((x) => x !== n) }, "پیوست را حذف کرد")} />
  );

  if (concept === "bento") {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">{header}<Lines doc={doc} />{attachments}</div>
        <aside className="no-print flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start"><DocAssistant doc={doc} /><Timeline items={doc.history ?? []} /></aside>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {header}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="no-print min-w-0"><DocAssistant doc={doc} big /></div>
        <div className="flex flex-col gap-4">
          <section className="panel p-5">
            <h2 className="mb-3 text-[15px] font-extrabold">ردیف‌های سند</h2>
            <ul className="divide-y divide-border rounded-field border border-border bg-surface/60">
              {doc.lines.map((l) => (
                <li key={l.id} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-3">
                  <b className="truncate text-[13.5px]">{accountBy(l.account)?.name ?? "بدون حساب"}</b>
                  <b className="num text-[13.5px]">{l.debit ? money(l.debit, unit) : money(l.credit, unit)}</b>
                  <span className="truncate text-[12px] text-muted-foreground">{l.desc}</span>
                  <span className={cn("text-[12px] font-semibold", l.debit ? "text-foreground" : "text-muted-foreground")}>{l.debit ? "بدهکار" : "بستانکار"}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {doc.attachments.length ? doc.attachments.map((a) => <span key={a} className="flex h-9 items-center gap-2 rounded-field border border-border px-3 text-[12.5px]">{/\.(jpe?g|png|webp)$/i.test(a) ? <FileImage className="size-4 text-primary" /> : <FileText className="size-4 text-primary" />}{a}</span>)
                : <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><X className="size-3.5" /> پیوست ندارد</span>}
            </div>
          </section>
          <Timeline items={doc.history ?? []} />
        </div>
      </div>
    </div>
  );
}
