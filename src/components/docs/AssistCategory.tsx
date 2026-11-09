import * as React from "react";
import { ArrowDownLeft, ArrowUpLeft, Bank, CheckCheck, ChevronDown, Receipt1, ReceiptText, Search, Sparkles, X, type IconType } from "@/components/icons";
import { useApp } from "@/lib/store";
import { catFacet, catRows, docCats, type CatRow } from "@/data/demo";
import { group, short, shortToman, toEn, toFa } from "@/lib/utils";
import { diffDays, fmtDay, relDay, TODAY } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Orb } from "@/components/ai/Orb";
import { Empty } from "@/pages/Dashboard";

/* «دستیار» concept: every document category opens with a question, a short read-out of what matters,
   and a view shaped for that category (cheque due lanes, statement cards, a day-by-day feed). */

type Q = { kind?: string; state?: string; min?: number; when?: "today" | "week"; text?: string; label: string[] };
const PROMPTS: Record<string, { ph: string; chips: string[] }> = {
  treasury: { ph: "مثلاً «دریافت‌های بالای ۱ میلیارد ریال این هفته»", chips: ["دریافت‌های این هفته", "پرداخت‌های بالای ۱ میلیارد", "در انتظار سند"] },
  cheque: { ph: "مثلاً «چک‌های دریافتی که این هفته سررسید می‌شوند»", chips: ["سررسید امروز", "چک‌های دریافتی", "چک برگشتی"] },
  invoice: { ph: "مثلاً «فاکتورهای فروش تسویه‌نشده»", chips: ["فروش تسویه‌نشده", "خریدهای این هفته", "بالای ۲ میلیارد"] },
  bank: { ph: "مثلاً «صورت‌حساب‌هایی که مغایرت دارند»", chips: ["مغایرت دارد", "ملت", "تطبیق‌شده"] },
};

function parse(text: string, cat: string): Q {
  const t = toEn(text);
  const q: Q = { label: [] };
  const opt = catFacet[cat]?.options.find((o) => t.includes(o) || t.includes(o.replace("ی", "")));
  if (opt) { q.kind = opt; q.label.push(opt); }
  const states = [...new Set((catRows[cat] ?? []).map((r) => r.state))];
  const st = states.find((s) => t.includes(s) || (s.includes("مغایرت") && t.includes("مغایرت")) || (s.includes("برگشت") && t.includes("برگشت")));
  if (st) { q.state = st; q.label.push(st); }
  else if (/تسویه.?نشده/.test(t)) { q.state = "تسویه‌نشده"; q.label.push("تسویه‌نشده"); }
  const m = t.match(/(بالای|بیشتر از|بیش از)\s*(\d+(?:\.\d+)?)\s*(میلیارد|میلیون)?\s*(تومان|ریال)?/);
  if (m) { q.min = +m[2] * (m[3] === "میلیارد" ? 1e9 : m[3] === "میلیون" ? 1e6 : 1) * (m[4] === "تومان" ? 10 : 1); q.label.push(`بالای ${toFa(m[2])} ${m[3] ?? ""}`.trim()); }
  if (/امروز/.test(t) && !st) { q.when = "today"; q.label.push("امروز"); } else if (/هفته/.test(t)) { q.when = "week"; q.label.push("این هفته"); }
  if (!q.label.length && t.trim()) { q.text = text.trim(); q.label.push(`شامل «${text.trim()}»`); }
  return q;
}

const money = (r: number) => `${short(r, "rial").n} ${short(r, "rial").s}`;

export function AssistCategory({ cat }: { cat: string }) {
  const { toast, startVoucher } = useApp();
  const meta = docCats.find((c) => c.id === cat)!;
  const all = catRows[cat] ?? [];
  const p = PROMPTS[cat] ?? { ph: "چه چیزی را پیدا کنم؟", chips: [] };
  const [text, setText] = React.useState("");
  const [q, setQ] = React.useState<Q>({ label: [] });
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { setText(""); setQ({ label: [] }); }, [cat]);
  const run = (s = text) => { setText(s); setBusy(true); window.setTimeout(() => { setQ(parse(s, cat)); setBusy(false); }, 380); };
  const clear = () => { setText(""); setQ({ label: [] }); };
  const rows = all
    .filter((r) => !q.kind || r.kind === q.kind)
    .filter((r) => !q.state || r.state === q.state)
    .filter((r) => !q.min || r.rial > q.min)
    .filter((r) => !q.when || (q.when === "today" ? r.day === TODAY.d : Math.abs(r.day - TODAY.d) < 7))
    .filter((r) => !q.text || r.title.includes(q.text) || r.party.includes(q.text) || r.no.includes(toFa(q.text)));

  return (
    <div className="flex flex-col gap-4">
      <section className="hero p-5">
        <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex items-center gap-3">
          <Orb size={40} busy={busy} />
          <div className="relative min-w-0 flex-1">
            <Input value={text} onChange={(e) => setText(e.target.value)} aria-label={`پرسش درباره‌ی ${meta.label}`} placeholder={p.ph} className="h-12 pe-10 text-[14.5px]" />
            <Search className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button type="submit" className="h-11" disabled={!text.trim()}>بپرس</Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 ps-[52px]">
          {q.label.length ? (
            <>
              <span className="text-[12.5px] text-muted-foreground">فهمیدم:</span>
              {q.label.map((l) => <span key={l} className="num rounded-field bg-primary-soft px-2.5 py-1 text-[12px] font-bold text-primary">{l}</span>)}
              <span className="num text-[12.5px] text-muted-foreground">· {toFa(rows.length)} مورد</span>
              <button onClick={clear} className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"><X className="size-3.5" /> همه</button>
            </>
          ) : p.chips.map((s) => <button key={s} onClick={() => run(s)} className="chip h-7 bg-surface text-[12px]">{s}</button>)}
        </div>
      </section>

      {!q.label.length && <Insight cat={cat} rows={all} onAsk={run} onAct={(m) => (m === "voucher" ? startVoucher() : toast(m))} />}

      {rows.length === 0 ? (
        <div className="panel"><Empty icon={Search} title="موردی با این پرسش پیدا نشد" text="جمله را کوتاه‌تر کنید یا همه را ببینید." action={<Button size="sm" variant="soft" onClick={clear}>نمایش همه</Button>} /></div>
      ) : cat === "cheque" ? <ChequeLanes rows={rows} />
        : cat === "bank" ? <Statements rows={rows} onOpen={(r) => toast(`تطبیق «${r.title}» در نسخه‌ی بعد فعال می‌شود.`)} />
        : <>{cat === "treasury" && <FlowRiver rows={rows} />}<Feed rows={rows} cat={cat} onOpen={(r) => toast(`جزئیات «${r.title}» در نسخه‌ی بعد فعال می‌شود.`)} /></>}
    </div>
  );
}

/* one short read-out per category, with the next step as a button */
function Insight({ cat, rows, onAsk, onAct }: { cat: string; rows: CatRow[]; onAsk: (s: string) => void; onAct: (m: string) => void }) {
  const sum = (xs: CatRow[]) => xs.reduce((a, r) => a + r.rial, 0);
  let line = "", sub = "", btn: [string, () => void] | null = null, icon: IconType = Sparkles;
  if (cat === "treasury") {
    const inn = sum(rows.filter((r) => r.kind === "دریافت")), out = sum(rows.filter((r) => r.kind === "پرداخت"));
    const wait = rows.filter((r) => r.state === "در انتظار سند");
    line = `آبان ${money(inn)} ریال دریافت و ${money(out)} ریال پرداخت داشتید.`;
    sub = wait.length ? `${toFa(wait.length)} مورد هنوز سند حسابداری ندارد.` : "همه‌ی موارد سند دارند.";
    if (wait.length) btn = ["ساخت سند برای آن‌ها", () => onAct("voucher")];
  } else if (cat === "cheque") {
    const soon = rows.filter((r) => r.day >= TODAY.d && r.day - TODAY.d <= 7 && !/پاس|وصول‌شده/.test(r.state));
    const back = rows.filter((r) => r.state === "برگشتی");
    line = `${toFa(soon.length)} چک تا هفت روز آینده سررسید می‌شود، جمعاً ${money(sum(soon))} ریال.`;
    sub = back.length ? `چک ${back[0].party} برگشت خورده و پیگیری لازم دارد.` : "چک برگشتی ندارید.";
    if (back.length) btn = ["یادآوری پیگیری", () => onAct(`یادآوری پیگیری چک ${back[0].party} ساخته شد.`)];
    icon = Receipt1;
  } else if (cat === "invoice") {
    const open = rows.filter((r) => r.state === "تسویه‌نشده");
    line = `${toFa(open.length)} فاکتور تسویه‌نشده دارید به جمع ${money(sum(open))} ریال.`;
    const big = [...open].sort((a, b) => b.rial - a.rial)[0];
    sub = big ? `بزرگ‌ترینش «${big.title}» برای ${big.party} است.` : "";
    btn = ["فقط تسویه‌نشده‌ها", () => onAsk("تسویه‌نشده")];
    icon = ReceiptText;
  } else {
    const bad = rows.filter((r) => r.state.includes("مغایرت"));
    line = bad.length ? `${bad[0].party} ${bad[0].state} دارد؛ بقیه‌ی صورت‌حساب‌ها مرتب‌اند.` : "همه‌ی صورت‌حساب‌ها تطبیق شده‌اند.";
    sub = "تطبیق با دفتر هر شب خودکار انجام می‌شود.";
    if (bad.length) btn = ["دیدن مغایرت‌ها", () => onAsk("مغایرت")];
    icon = Bank;
  }
  const I = icon;
  return (
    <section className="panel flex flex-wrap items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-field bg-ai-soft text-ai"><I className="size-5" variant="Bulk" /></span>
      <div className="min-w-[220px] flex-1">
        <b className="num block text-[14px]">{line}</b>
        {sub && <p className="num text-[12.5px] text-muted-foreground">{sub}</p>}
      </div>
      {btn && <Button size="sm" variant="soft" onClick={btn[1]}>{btn[0]}</Button>}
    </section>
  );
}

/* treasury + invoices: day-by-day feed, money in and out read by direction */
/* treasury: money in above the line, money out below it, one column per day */
function FlowRiver({ rows }: { rows: CatRow[] }) {
  const days = Array.from({ length: 17 }, (_, i) => i + 1);
  const isIn = (r: CatRow) => r.kind === "دریافت";
  const inOf = (d: number) => rows.filter((r) => r.day === d && isIn(r)).reduce((a, r) => a + r.rial, 0);
  const outOf = (d: number) => rows.filter((r) => r.day === d && !isIn(r)).reduce((a, r) => a + r.rial, 0);
  const max = Math.max(...days.map((d) => Math.max(inOf(d), outOf(d))), 1);
  const tin = days.reduce((a, d) => a + inOf(d), 0), tout = days.reduce((a, d) => a + outOf(d), 0);
  return (
    <section className="panel p-5" aria-label="جریان دریافت و پرداخت آبان">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <b className="text-[15px]">جریان آبان</b>
        <span className="num text-[12.5px]"><i className="me-1.5 inline-block size-2 rounded-full bg-ch-2" />ورودی {shortToman(tin)}</span>
        <span className="num text-[12.5px]"><i className="me-1.5 inline-block size-2 rounded-full bg-ch-3" />خروجی {shortToman(tout)}</span>
        <span className="num ms-auto text-[12.5px] text-muted-foreground">خالص <b className="text-foreground" dir="ltr">{tin >= tout ? "+" : "−"}{shortToman(Math.abs(tin - tout))}</b></span>
      </div>
      <div className="mt-4 grid h-[150px] grid-rows-2 gap-px" dir="rtl">
        <div className="flex items-end gap-1.5 border-b border-border">{days.map((d) => <span key={d} title={`${fmtDay(8, d)}: ${group(inOf(d))} ریال`} className="flex-1 rounded-t-[4px] bg-ch-2/80 transition-[height]" style={{ height: `${(inOf(d) / max) * 100}%` }} />)}</div>
        <div className="flex items-start gap-1.5">{days.map((d) => <span key={d} title={`${fmtDay(8, d)}: ${group(outOf(d))} ریال`} className="flex-1 rounded-b-[4px] bg-ch-3/80" style={{ height: `${(outOf(d) / max) * 100}%` }} />)}</div>
      </div>
      <div className="num mt-1.5 flex justify-between text-[11px] text-muted-foreground"><span>۱ آبان</span><span>امروز، ۱۷ آبان</span></div>
    </section>
  );
}

function Feed({ rows, cat, onOpen }: { rows: CatRow[]; cat: string; onOpen: (r: CatRow) => void }) {
  const [limit, setLimit] = React.useState(8);
  React.useEffect(() => setLimit(8), [rows.length]);
  const shown = [...rows].sort((a, b) => b.day - a.day).slice(0, limit);
  const days = [...new Set(shown.map((r) => r.day))];
  const isIn = (r: CatRow) => r.kind === "دریافت" || r.kind === "فروش";
  return (
    <div className="flex flex-col gap-4">
      {days.map((d) => (
        <section key={d} className="flex flex-col gap-2">
          <h3 className="num flex items-baseline gap-2 px-1 text-[13px] font-extrabold">{fmtDay(8, d)}<span className="font-medium text-muted-foreground">{relDay(8, d)}</span></h3>
          <ul className="flex flex-col gap-2">
            {shown.filter((r) => r.day === d).map((r) => {
              const I = isIn(r) ? ArrowDownLeft : ArrowUpLeft;
              const c = isIn(r) ? "--ch-2" : "--ch-3";
              return (
                <li key={r.no}>
                  <button onClick={() => onOpen(r)} className="panel flex w-full flex-wrap items-center gap-3 p-3.5 text-start transition-shadow hover:shadow-lift sm:flex-nowrap">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[12px]" style={{ background: `hsl(var(${c}) / .14)`, color: `hsl(var(${c}))` }}><I className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[14px]">{r.title}</b>
                      <span className="num text-[12px] text-muted-foreground">{r.party} · {r.kind} · {r.no}</span>
                    </span>
                    <span className="num flex items-baseline gap-1 text-end">
                      <b dir="ltr" className="text-[15px]" style={{ color: `hsl(var(${c}))` }}>{isIn(r) ? "+" : "−"}{group(r.rial)}</b>
                      <span className="text-[11px] text-muted-foreground">ریال</span>
                    </span>
                    <Badge tone={r.tone}>{r.state}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {rows.length > limit && (
        <Button variant="outline" className="self-center" onClick={() => setLimit((x) => x + 8)}><ChevronDown /> {toFa(Math.min(8, rows.length - limit))} مورد دیگر{cat === "invoice" ? " فاکتور" : ""}</Button>
      )}
    </div>
  );
}

/* cheques: three lanes by due date, each cheque drawn like a cheque leaf */
function ChequeLanes({ rows }: { rows: CatRow[] }) {
  const lanes: [string, CatRow[], string][] = [
    ["گذشته", rows.filter((r) => r.day < TODAY.d), "--ch-6"],
    ["این هفته", rows.filter((r) => r.day >= TODAY.d && r.day - TODAY.d <= 7), "--warning"],
    ["بعدتر", rows.filter((r) => r.day - TODAY.d > 7), "--ch-1"],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {lanes.map(([title, xs, c]) => (
        <section key={title} className="panel flex flex-col gap-3 p-4">
          <h3 className="flex items-center gap-2 text-[14px] font-extrabold">
            <i className="size-2.5 rounded-full" style={{ background: `hsl(var(${c}))` }} />{title}
            <span className="num ms-auto text-[12px] font-semibold text-muted-foreground">{toFa(xs.length)} چک · {money(xs.reduce((a, r) => a + r.rial, 0))}</span>
          </h3>
          {xs.length ? xs.sort((a, b) => a.day - b.day).map((r) => {
            const inn = r.kind === "دریافتی";
            return (
              <article key={r.no} className="relative overflow-hidden rounded-[14px] border border-dashed p-3.5" style={{ borderColor: `hsl(var(${inn ? "--ch-2" : "--ch-3"}) / .45)`, background: `linear-gradient(135deg, hsl(var(${inn ? "--ch-2" : "--ch-3"}) / .1), transparent 70%)` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11.5px] font-bold" style={{ color: `hsl(var(${inn ? "--ch-2" : "--ch-3"}))` }}>{inn ? "دریافتی" : "پرداختی"}</span>
                  <span className="num font-mono text-[11.5px] text-muted-foreground" dir="ltr">№ {r.no}</span>
                </div>
                <b className="mt-1.5 block truncate text-[14px]">{r.party}</b>
                <div className="num mt-2 flex items-end justify-between gap-2">
                  <span><b className="text-[16px]">{group(r.rial)}</b> <span className="text-[11px] text-muted-foreground">ریال</span></span>
                  <span className="text-[11.5px] text-muted-foreground">{fmtDay(8, r.day)} · {diffDays(8, r.day) === 0 ? "امروز" : relDay(8, r.day)}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-border pt-2">
                  <Badge tone={r.tone}>{r.state}</Badge>
                  {r.state === "سررسید امروز" && <CheckCheck className="size-4 text-warning" aria-hidden />}
                </div>
              </article>
            );
          }) : <p className="py-6 text-center text-[12.5px] text-muted-foreground">چکی در این بازه نیست</p>}
        </section>
      ))}
    </div>
  );
}

/* bank statements: one card per statement with its reconciliation state */
function Statements({ rows, onOpen }: { rows: CatRow[]; onOpen: (r: CatRow) => void }) {
  const pct = (r: CatRow) => (r.tone === "success" ? 100 : r.tone === "info" ? 64 : 88);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((r) => {
        const v = pct(r);
        const c = r.tone === "success" ? "--success" : r.tone === "warning" ? "--warning" : "--ch-1";
        return (
          <button key={r.no} onClick={() => onOpen(r)} className="panel flex flex-col gap-3 p-4 text-start transition-shadow hover:shadow-lift">
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[12px] bg-primary-soft text-primary"><Bank className="size-5" variant="Bulk" /></span>
              <span className="min-w-0 flex-1"><b className="block truncate text-[14px]">{r.party}</b><span className="num text-[12px] text-muted-foreground">{r.title.replace(r.party, "").trim()}</span></span>
              <svg viewBox="0 0 36 36" className="size-11 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle cx="18" cy="18" r="15" fill="none" stroke={`hsl(var(${c}))`} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(v / 100) * 94.2} 94.2`} />
              </svg>
            </span>
            <span className="num flex items-center justify-between text-[12px] text-muted-foreground">
              <span>دریافت {fmtDay(8, r.day)}</span>
              <span className="font-bold" style={{ color: `hsl(var(${c}))` }}>{toFa(v)}٪ تطبیق</span>
            </span>
            <Badge tone={r.tone} className="w-fit">{r.state}</Badge>
          </button>
        );
      })}
    </div>
  );
}

