import * as React from "react";
import { AlertTriangle, ArrowDownLeft, ArrowUpLeft, Bank, CheckCheck, ChevronDown, FileText, Wallet3, FileImage, FilePlus2, Keyboard, Mic, Paperclip, Search, Sparkles, X } from "@/components/icons";
import { useApp } from "@/lib/store";
import { accounts, catFacet, catRows, docCats, kindLabel, sourceLabel, statusLabel, type Doc, type DocKind, type DocStatus } from "@/data/demo";
import { DataTable, Pager, usePager } from "@/components/ui/data-table";
import { cn, money, short, toEn, toFa, unitLabel } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat";
import { dayIndex, diffDays, fmtDay, relDay } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SimpleSelect } from "@/components/ui/select";
import { Orb } from "@/components/ai/Orb";
import { docNo, docTotal, partyOf } from "@/components/voucher/VoucherEditor";
import { Empty, statusTone } from "@/pages/Dashboard";
import { AssistCategory } from "@/components/docs/AssistCategory";

const SourceIcon = ({ s }: { s: Doc["source"] }) => {
  const I = s === "ai" ? Sparkles : s === "voice" ? Mic : s === "file" ? FileImage : Keyboard;
  return <I className="size-3.5 text-muted-foreground" aria-hidden />;
};

type Tab = "all" | DocStatus;
type When = "all" | "week" | "today" | "custom";
const byDate = (a: Doc, b: Doc) => dayIndex(b.m, b.d) - dayIndex(a.m, a.d) || b.seq - a.seq;

/* ---------- advanced filter building blocks, shared by the register and the category lists ---------- */
/** A collapsible filter group that shows how many of its options are on and can clear itself. */
function FilterGroup({ title, on = 0, onClear, open: start = true, children }: { title: string; on?: number; onClear?: () => void; open?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(start);
  return (
    <div className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-1.5 text-start text-[12.5px] font-bold text-muted-foreground hover:text-foreground">
          <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", !open && "-rotate-90")} />{title}
          {on > 0 && <span className="num rounded-full bg-primary px-1.5 text-[10.5px] leading-[16px] text-primary-foreground">{toFa(on)}</span>}
        </button>
        {on > 0 && onClear && <button type="button" onClick={onClear} className="text-[11.5px] font-semibold text-primary hover:underline">پاک</button>}
      </div>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
function CheckList({ options, value, onChange, count }: { options: [string, string][]; value: string[]; onChange: (v: string[]) => void; count?: (k: string) => number }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(([k, l]) => (
        <label key={k} className="flex cursor-pointer items-center gap-2.5 text-[13px]">
          <Checkbox checked={value.includes(k)} onCheckedChange={() => onChange(value.includes(k) ? value.filter((y) => y !== k) : [...value, k])} /><span className="min-w-0 flex-1 truncate">{l}</span>
          {count && <span className="num text-[12px] text-muted-foreground">{toFa(count(k))}</span>}
        </label>
      ))}
    </div>
  );
}
/** Amount range typed in millions of the current unit. */
function AmountRange({ min, max, onChange, unit }: { min: string; max: string; onChange: (min: string, max: string) => void; unit: string }) {
  const f = (v: string) => toEn(v).replace(/[^\d.]/g, "");
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <Input value={toFa(min)} onChange={(e) => onChange(f(e.target.value), max)} placeholder="از" aria-label="کمترین مبلغ" inputMode="decimal" className="num h-9 text-[13px]" />
        <Input value={toFa(max)} onChange={(e) => onChange(min, f(e.target.value))} placeholder="تا" aria-label="بیشترین مبلغ" inputMode="decimal" className="num h-9 text-[13px]" />
      </div>
      <span className="text-[11px] text-muted-foreground">به میلیون {unit}</span>
    </div>
  );
}
const inAmount = (rial: number, min: string, max: string, unit: "rial" | "toman") => {
  const v = (unit === "toman" ? rial / 10 : rial) / 1e6;
  return (!min || v >= Number(min)) && (!max || v <= Number(max));
};


/* =====================================================================
   Concept 1 «دستیار»: ask for the documents you need; results are a day-by-day feed
   ===================================================================== */
type Parsed = { status?: DocStatus; kind?: DocKind; min?: number; party?: string; when?: When; text?: string; label: string[] };
function parseQuery(q: string): Parsed {
  const t = toEn(q);
  const p: Parsed = { label: [] };
  if (/منتظر|تأیید نشده|تایید نشده/.test(t)) { p.status = "pending"; p.label.push("منتظر تأیید"); }
  else if (/پیش.?نویس/.test(t)) { p.status = "draft"; p.label.push("پیش‌نویس"); }
  else if (/تأییدشده|تایید شده|ثبت.?شده/.test(t)) { p.status = "posted"; p.label.push("تأییدشده"); }
  const k = (Object.entries(kindLabel) as [DocKind, string][]).find(([, l]) => t.includes(l));
  if (k) { p.kind = k[0]; p.label.push(k[1]); }
  const m = t.match(/(بالای|بیشتر از|بیش از)\s*(\d+(?:\.\d+)?)\s*(میلیارد|میلیون)?\s*(تومان|ریال)?/);
  if (m) { p.min = +m[2] * (m[3] === "میلیارد" ? 1e9 : m[3] === "میلیون" ? 1e6 : 1) * (m[4] === "تومان" ? 10 : 1); p.label.push(`بالای ${toFa(m[2])} ${m[3] ?? ""} ${m[4] ?? "ریال"}`.replace(/\s+/g, " ")); }
  if (/امروز/.test(t)) { p.when = "today"; p.label.push("امروز"); } else if (/هفته/.test(t)) { p.when = "week"; p.label.push("۷ روز اخیر"); }
  const party = accounts.find((a) => a.group !== "exp" && t.includes(a.name.split(" ")[0]) && a.name.split(" ")[0].length > 2);
  if (party) { p.party = party.name.split(" ")[0]; p.label.push(party.name); }
  if (!p.label.length && t.trim()) { p.text = q.trim(); p.label.push(`شامل «${q.trim()}»`); }
  return p;
}

function AssistDocuments() {
  const { docs, setDocStatus, toast, unit, openDoc } = useApp();
  const [q, setQ] = React.useState("");
  const [applied, setApplied] = React.useState<Parsed>({ label: [] });
  const [thinking, setThinking] = React.useState(false);
  const pending = docs.filter((d) => d.status === "pending");
  const list = docs
    .filter((d) => !applied.status || d.status === applied.status)
    .filter((d) => !applied.kind || d.kind === applied.kind)
    .filter((d) => !applied.min || docTotal(d) > applied.min)
    .filter((d) => !applied.party || d.title.includes(applied.party) || partyOf(d).includes(applied.party))
    .filter((d) => !applied.when || (applied.when === "today" ? diffDays(d.m, d.d) === 0 : diffDays(d.m, d.d) > -7))
    .filter((d) => !applied.text || d.title.includes(applied.text) || docNo(d.m, d.seq).includes(toFa(applied.text)))
    .sort(byDate);
  const days = [...new Set(list.map((d) => `${d.m}-${d.d}`))];
  const run = (text = q) => { setQ(text); setThinking(true); setTimeout(() => { setApplied(parseQuery(text)); setThinking(false); }, 450); };

  return (
    <div className="flex flex-col gap-5">
      <section className="hero p-5">
        <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex items-center gap-3">
          <Orb size={40} busy={thinking} />
          <div className="relative min-w-0 flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} aria-label="جست‌وجوی اسناد" placeholder="کدام اسناد را می‌خواهید؟ مثلاً «پرداخت‌های بالای ۱۰۰ میلیون تومان این هفته»" className="h-12 pe-10 text-[14.5px]" />
            <Search className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button type="submit" className="h-11">جست‌وجو</Button>
          
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 ps-[52px]">
          {applied.label.length ? (
            <>
              <span className="text-[12.5px] text-muted-foreground">فیلتر:</span>
              {applied.label.map((l) => <span key={l} className="num rounded-field bg-primary-soft px-2.5 py-1 text-[12px] font-bold text-primary">{l}</span>)}
              <button onClick={() => { setQ(""); setApplied({ label: [] }); }} className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"><X className="size-3.5" /> پاک کردن</button>
            </>
          ) : ["اسناد منتظر تأیید", "پرداخت‌های این هفته", "دریافت‌های بالای ۲ میلیارد ریال", "پیش‌نویس‌ها"].map((s) => <button key={s} onClick={() => run(s)} className="chip h-7 bg-surface text-[12px]">{s}</button>)}
        </div>
      </section>

      {pending.length > 0 && !applied.label.length && (
        <section className="panel flex flex-wrap items-center gap-3 border-warning/30 p-4">
          <span className="grid size-9 place-items-center rounded-field bg-warning-soft text-warning"><CheckCheck className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <b className="num text-[14px]">{toFa(pending.length)} سند منتظر تأیید شماست</b>
            <p className="text-[12.5px] text-muted-foreground">هر سند را جدا باز کنید و با فرم بررسی تأیید کنید.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => run("اسناد منتظر تأیید")}>مشاهده‌ی موارد</Button>
        </section>
      )}

      {list.length ? days.map((key) => {
        const [m, d] = key.split("-").map(Number);
        const items = list.filter((x) => x.m === m && x.d === d);
        return (
          <section key={key} className="flex flex-col gap-2">
            <h3 className="num flex items-baseline gap-2 px-1 text-[13px] font-extrabold">{fmtDay(m, d)}<span className="font-medium text-muted-foreground">{relDay(m, d)}</span></h3>
            <ul className="panel-data divide-y divide-border/70 overflow-hidden">
              {items.map((x) => (
                <li key={x.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-primary-soft/30 sm:flex-nowrap", x.fresh && "animate-flash")}>
                  <button onClick={() => openDoc(x.id)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
                    <span className="grid size-9 shrink-0 place-items-center rounded-field bg-muted"><SourceIcon s={x.source} /></span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2"><b className="truncate text-[14px]">{x.title}</b>{x.attachments.length > 0 && <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-label="پیوست دارد" />}</span>
                      <span className="num block truncate text-[12px] text-muted-foreground">{docNo(x.m, x.seq)} · {kindLabel[x.kind]} · {partyOf(x)}</span>
                    </span>
                  </button>
                  <b className="num text-[14px]">{money(docTotal(x), unit)} <span className="text-[11px] font-normal text-muted-foreground">{unitLabel(unit)}</span></b>
                  <Badge tone={statusTone[x.status]}>{statusLabel[x.status]}</Badge>
                  {x.status === "pending" && <Button size="sm" variant="soft" onClick={() => { setDocStatus([x.id], "posted"); toast(`سند ${docNo(x.m, x.seq)} تأیید شد.`); }}>تأیید</Button>}
                </li>
              ))}
            </ul>
          </section>
        );
      }) : (
        <div className="panel"><Empty icon={Search} title="سندی با این مشخصات پیدا نشد" text="جمله را کوتاه‌تر کنید یا فیلتر را بردارید." action={<Button size="sm" variant="soft" onClick={() => { setQ(""); setApplied({ label: [] }); }}>نمایش همه‌ی اسناد</Button>} /></div>
      )}
    </div>
  );
}

/* =====================================================================
   Concept 2 «پیشخوان»: a dense register with filters and bulk actions
   ===================================================================== */
function BentoDocuments() {
  const { docs, setDocStatus, toast, unit, openDoc } = useApp();
  const [tab, setTab] = React.useState<Tab>("all");
  const [kinds, setKinds] = React.useState<DocKind[]>([]);
  const [when, setWhen] = React.useState<When>("all");
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState<string[]>([]);
  const [sources, setSources] = React.useState<string[]>([]);
  const [people, setPeople] = React.useState<string[]>([]);
  const [acc, setAcc] = React.useState("all");
  const [amt, setAmt] = React.useState<[string, string]>(["", ""]);
  const [range, setRange] = React.useState<[string, string]>(["", ""]);
  const [attach, setAttach] = React.useState<"any" | "yes" | "no">("any");
  const dates = [...new Set(docs.map((d) => dayIndex(d.m, d.d)))].sort((a, b) => a - b);
  const dateOf = (i: number) => { const d = docs.find((x) => dayIndex(x.m, x.d) === i)!; return fmtDay(d.m, d.d); };
  const usedAcc = [...new Set(docs.flatMap((d) => d.lines.map((l) => l.account)))].map((c) => accounts.find((a) => a.code === c)).filter(Boolean) as typeof accounts;

  const count = (s: Tab) => docs.filter((d) => s === "all" || d.status === s).length;
  const list = docs
    .filter((d) => tab === "all" || d.status === tab)
    .filter((d) => !kinds.length || kinds.includes(d.kind))
    .filter((d) => when !== "custom" ? when === "all" || (when === "today" ? diffDays(d.m, d.d) === 0 : diffDays(d.m, d.d) > -7) : (!range[0] || dayIndex(d.m, d.d) >= +range[0]) && (!range[1] || dayIndex(d.m, d.d) <= +range[1]))
    .filter((d) => !sources.length || sources.includes(d.source))
    .filter((d) => !people.length || people.includes(d.by))
    .filter((d) => acc === "all" || d.lines.some((l) => l.account === acc))
    .filter((d) => inAmount(docTotal(d), amt[0], amt[1], unit))
    .filter((d) => attach === "any" || (attach === "yes") === d.attachments.length > 0)
    .filter((d) => !q || d.title.includes(q) || partyOf(d).includes(q) || docNo(d.m, d.seq).includes(toFa(q)) || String(d.seq).includes(toEn(q)))
    .sort(byDate);
  const pendingSel = sel.filter((id) => docs.find((d) => d.id === id)?.status === "pending");
  const draftSel = sel.filter((id) => docs.find((d) => d.id === id)?.status === "draft");
  const allOn = list.length > 0 && list.every((d) => sel.includes(d.id));
  const someOn = list.some((d) => sel.includes(d.id));
  const sum = list.reduce((a, d) => a + docTotal(d), 0);
  const u = unitLabel(unit);
  const filtered = kinds.length > 0 || when !== "all" || !!q || sources.length > 0 || people.length > 0 || acc !== "all" || !!amt[0] || !!amt[1] || attach !== "any";
  const reset = () => { setTab("all"); setKinds([]); setWhen("all"); setQ(""); setSources([]); setPeople([]); setAcc("all"); setAmt(["", ""]); setRange(["", ""]); setAttach("any"); };
  const pg = usePager(list.length, 8);

  const tabs: [Tab, string][] = [["all", "همه"], ["pending", "منتظر تأیید"], ["draft", "پیش‌نویس"], ["posted", "تأییدشده"]];

  return (
    <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="panel flex h-fit flex-col gap-4 p-4 lg:sticky lg:top-4" aria-label="فیلتر اسناد">
        <div>
          <h3 className="mb-1.5 text-[12px] font-bold text-muted-foreground">وضعیت</h3>
          <div role="tablist" aria-label="وضعیت سند" className="flex flex-col gap-0.5">
            {tabs.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setSel([]); }}
                className={cn("flex h-9 items-center justify-between rounded-field px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", tab === k && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary")}>
                {l}<span className="num text-[12px]">{toFa(count(k))}</span>
              </button>
            ))}
          </div>
        </div>
        <FilterGroup title="نوع سند" on={kinds.length} onClear={() => setKinds([])}>
          <CheckList options={(Object.keys(kindLabel) as DocKind[]).map((k) => [k, kindLabel[k]])} value={kinds} onChange={(v) => setKinds(v as DocKind[])} count={(k) => docs.filter((d) => d.kind === k).length} />
        </FilterGroup>
        <FilterGroup title="تاریخ سند" on={when !== "all" ? 1 : 0} onClear={() => { setWhen("all"); setRange(["", ""]); }}>
          <div className="flex flex-wrap gap-1.5">
            {([["all", "همه"], ["week", "۷ روز اخیر"], ["today", "امروز"], ["custom", "بازه‌ی دلخواه"]] as [When, string][]).map(([k, l]) => (
              <button key={k} className="chip h-7" aria-pressed={when === k} onClick={() => setWhen(k)}>{l}</button>
            ))}
          </div>
          {when === "custom" && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <SimpleSelect label="از تاریخ" placeholder="از" value={range[0]} onChange={(v) => setRange([v, range[1]])} options={dates.map((i) => [String(i), dateOf(i)])} className="num h-9 text-[12.5px]" />
              <SimpleSelect label="تا تاریخ" placeholder="تا" value={range[1]} onChange={(v) => setRange([range[0], v])} options={dates.filter((i) => !range[0] || i >= +range[0]).map((i) => [String(i), dateOf(i)])} className="num h-9 text-[12.5px]" />
            </div>
          )}
        </FilterGroup>
        <FilterGroup title={`مبلغ سند`} on={amt[0] || amt[1] ? 1 : 0} onClear={() => setAmt(["", ""])}>
          <AmountRange min={amt[0]} max={amt[1]} onChange={(a, b) => setAmt([a, b])} unit={u} />
        </FilterGroup>
        <FilterGroup title="حساب یا بانک" on={acc !== "all" ? 1 : 0} onClear={() => setAcc("all")} open={false}>
          <SimpleSelect label="حساب" value={acc} onChange={setAcc} options={[["all", "همه‌ی حساب‌ها"], ...usedAcc.map((a) => [a.code, a.name] as [string, string])]} className="h-9 w-full text-[12.5px]" />
        </FilterGroup>
        <FilterGroup title="روش ثبت" on={sources.length} onClear={() => setSources([])} open={false}>
          <CheckList options={Object.entries(sourceLabel)} value={sources} onChange={setSources} count={(k) => docs.filter((d) => d.source === k).length} />
        </FilterGroup>
        <FilterGroup title="ثبت‌کننده" on={people.length} onClear={() => setPeople([])} open={false}>
          <CheckList options={[...new Set(docs.map((d) => d.by))].map((p) => [p, p])} value={people} onChange={setPeople} count={(k) => docs.filter((d) => d.by === k).length} />
        </FilterGroup>
        <FilterGroup title="پیوست" on={attach !== "any" ? 1 : 0} onClear={() => setAttach("any")} open={false}>
          <div className="flex flex-wrap gap-1.5">
            {([["any", "مهم نیست"], ["yes", "دارد"], ["no", "ندارد"]] as const).map(([k, l]) => <button key={k} className="chip h-7" aria-pressed={attach === k} onClick={() => setAttach(k)}>{l}</button>)}
          </div>
        </FilterGroup>
        {filtered && <button className="flex items-center gap-1 text-[12.5px] font-semibold text-primary" onClick={reset}><X className="size-3.5" />پاک کردن فیلترها</button>}
      </aside>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجوی شرح، طرف حساب یا شماره" aria-label="جست‌وجوی سند" className="h-10 pe-9" />
          </div>
          {sel.length > 0 && (
            <div className="ms-auto flex items-center gap-2 animate-rise">
              <span className="num text-[13px] text-muted-foreground">{toFa(sel.length)} انتخاب‌شده</span>
              {draftSel.length > 0 && <Button size="sm" variant="outline" onClick={() => { setDocStatus(draftSel, "pending"); setSel([]); toast(`${toFa(draftSel.length)} سند برای تأیید ارسال شد.`); }}>ارسال برای تأیید</Button>}
              {pendingSel.length > 0 && <Button size="sm" variant="success" onClick={() => { setDocStatus(pendingSel, "posted"); setSel([]); toast(`${toFa(pendingSel.length)} سند تأیید شد.`); }}><CheckCheck /> تأیید</Button>}
            </div>
          )}
        </div>

        <section className="panel-data overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-[12px] text-muted-foreground">
                  <th className="w-10 px-3 py-3"><Checkbox aria-label="انتخاب همه" checked={allOn ? true : someOn ? "indeterminate" : false} onCheckedChange={() => setSel(allOn ? [] : list.map((d) => d.id))} /></th>
                  <th className="px-2 py-3 text-start font-semibold">شماره</th>
                  <th className="px-2 py-3 text-start font-semibold">تاریخ</th>
                  <th className="px-2 py-3 text-start font-semibold">شرح</th>
                  <th className="px-2 py-3 text-start font-semibold">نوع</th>
                  <th className="px-2 py-3 text-end font-semibold">مبلغ ({u})</th>
                  <th className="px-2 py-3 text-start font-semibold">روش ثبت</th>
                  <th className="px-3 py-3 text-start font-semibold">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(pg.from, pg.to).map((d) => (
                  <tr key={d.id} onClick={() => openDoc(d.id)} className={cn("cursor-pointer border-b border-border/60 [&>td]:py-3.5 transition-colors last:border-0 hover:bg-primary-soft/40", d.fresh && "animate-flash", sel.includes(d.id) && "bg-primary-soft/50")}>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label={`انتخاب سند ${docNo(d.m, d.seq)}`} checked={sel.includes(d.id)} onCheckedChange={() => setSel((x) => (x.includes(d.id) ? x.filter((y) => y !== d.id) : [...x, d.id]))} />
                    </td>
                    <td className="num px-2 py-3 font-semibold" dir="ltr" style={{ textAlign: "right" }}>{docNo(d.m, d.seq)}</td>
                    <td className="num px-2 py-3 text-muted-foreground">{fmtDay(d.m, d.d)}</td>
                    <td className="max-w-[320px] px-2 py-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-bold">{d.title}</span>
                        {d.attachments.length > 0 && <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-label="پیوست دارد" />}
                        {d.fresh && <Badge tone="info">جدید</Badge>}
                      </div>
                      <div className="truncate text-[12px] text-muted-foreground">{partyOf(d)}</div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{kindLabel[d.kind]}</td>
                    <td className="num px-2 py-3 text-end font-bold">{money(docTotal(d), unit)}</td>
                    <td className="px-2 py-3"><span className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><SourceIcon s={d.source} />{sourceLabel[d.source]}</span></td>
                    <td className="px-3 py-3"><Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <Empty icon={Search} title="سندی با این فیلترها پیدا نشد" action={<Button size="sm" variant="soft" onClick={reset}>نمایش همه</Button>} />}
          </div>
          <Pager {...pg} total={list.length} />
          <div className="num flex items-center gap-4 border-t border-border bg-surface-2/80 px-4 py-3 text-[12.5px] text-muted-foreground">
            <span>{toFa(list.length)} سند</span>
            <span className="ms-auto">جمع: <b className="text-[14px] text-foreground">{money(sum, unit)}</b> {u}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Category strip + «سند جدید»: shared header for every document category. */
function DocHeader() {
  const { docCat, setDocCat, docs, startVoucher, concept } = useApp();
  if (concept === "assist") {
    // «دستیار»: a quiet title row with underline tabs; the question box below does the filtering
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-muted-foreground">اسناد</p>
            <h2 className="text-[20px] font-extrabold">{docCats.find((c) => c.id === docCat)?.label}</h2>
          </div>
          <Button variant="outline" onClick={() => startVoucher()}><FilePlus2 /> سند جدید با دستیار</Button>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-b border-border/80" aria-label="دسته‌های اسناد">
          {docCats.map((c) => (
            <button key={c.id} onClick={() => setDocCat(c.id)} aria-current={docCat === c.id ? "page" : undefined}
              className={cn("-mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent pb-2.5 pt-1 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground", docCat === c.id && "border-primary text-foreground")}>
              {c.short}<span className="num rounded-full bg-muted px-1.5 text-[11px]">{toFa(c.id === "acc" ? docs.length : c.count)}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <nav className="panel flex min-w-0 flex-1 gap-1 overflow-x-auto p-1.5" aria-label="دسته‌های اسناد">
        {docCats.map((c) => (
          <button key={c.id} onClick={() => setDocCat(c.id)} aria-current={docCat === c.id ? "page" : undefined}
            className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", docCat === c.id && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary")}>
            {c.label}<span className="num text-[11.5px] opacity-70">{toFa(c.id === "acc" ? docs.length : c.count)}</span>
          </button>
        ))}
      </nav>
      <Button className="h-12 px-5" onClick={() => startVoucher()}><FilePlus2 /> سند جدید</Button>
    </div>
  );
}

function CategoryList({ cat }: { cat: string }) {
  const { unit, toast } = useApp();
  const meta = docCats.find((c) => c.id === cat)!;
  const all = catRows[cat] ?? [];
  const facet = catFacet[cat];
  const [state, setState] = React.useState("all");
  const [kinds, setKinds] = React.useState<string[]>([]);
  const [when, setWhen] = React.useState<When>("all");
  const [q, setQ] = React.useState("");
  const [parties, setParties] = React.useState<string[]>([]);
  const [amt, setAmt] = React.useState<[string, string]>(["", ""]);
  const [range, setRange] = React.useState<[string, string]>(["", ""]);
  const states = [...new Set(all.map((r) => r.state))];
  const partyList = [...new Set(all.map((r) => r.party))];
  const days = [...new Set(all.map((r) => r.day))].sort((a, b) => a - b);
  const rows = all
    .filter((r) => state === "all" || r.state === state)
    .filter((r) => !kinds.length || kinds.includes(r.kind))
    .filter((r) => when !== "custom" ? when === "all" || (when === "today" ? diffDays(8, r.day) === 0 : Math.abs(diffDays(8, r.day)) < 7) : (!range[0] || r.day >= +range[0]) && (!range[1] || r.day <= +range[1]))
    .filter((r) => !parties.length || parties.includes(r.party))
    .filter((r) => !r.rial ? !amt[0] && !amt[1] : inAmount(r.rial, amt[0], amt[1], unit))
    .filter((r) => !q || r.title.includes(q) || r.party.includes(q) || r.no.includes(q))
    .sort((x, y) => y.day - x.day);
  const filtered = state !== "all" || kinds.length > 0 || when !== "all" || !!q || parties.length > 0 || !!amt[0] || !!amt[1];
  const sum = rows.reduce((a, r) => a + r.rial, 0);
  const tot = all.reduce((a, r) => a + r.rial, 0);
  const opts = facet?.options ?? [];
  const okN = all.filter((r) => r.tone === "success").length;
  const warnN = all.filter((r) => r.tone === "warning").length;
  const byFacet = opts.map((o) => all.filter((r) => r.kind === o).reduce((a, r) => a + (r.rial || 1), 0));
  return (
    <div className="flex flex-col gap-4">
    {cat === "treasury" ? (() => {
      const tin = all.filter((r) => r.kind === "دریافت").reduce((a, r) => a + r.rial, 0), tout = all.filter((r) => r.kind === "پرداخت").reduce((a, r) => a + r.rial, 0);
      return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="دریافت‌ها" value={short(tin, unit).n} unit={`${short(tin, unit).s} ${unitLabel(unit)}`} icon={ArrowDownLeft} tone="teal" sub={`${toFa(all.filter((r) => r.kind === "دریافت").length)} سند`} bars={all.filter((r) => r.kind === "دریافت").map((r) => r.rial)} />
          <StatCard label="پرداخت‌ها" value={short(tout, unit).n} unit={`${short(tout, unit).s} ${unitLabel(unit)}`} icon={ArrowUpLeft} tone="violet" sub={`${toFa(all.filter((r) => r.kind === "پرداخت").length)} سند`} bars={all.filter((r) => r.kind === "پرداخت").map((r) => r.rial)} />
          <StatCard label="خالص جریان" value={`${tin >= tout ? "+" : "−"}${short(Math.abs(tin - tout), unit).n}`} unit={`${short(Math.abs(tin - tout), unit).s} ${unitLabel(unit)}`} icon={Wallet3} tone="blue" progress={tin / Math.max(tin + tout, 1)} sub="سهم دریافت از کل گردش" />
          <StatCard label="در انتظار سند" value={toFa(warnN)} icon={AlertTriangle} tone="amber" sub="بدون سند حسابداری" />
        </div>
      );
    })() : (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label={meta.label} value={toFa(all.length)} unit="مورد" icon={FileText} tone="blue" sub={`آبان ۱۴۰۵`} />
      {tot > 0 ? <StatCard label="جمع مبالغ" value={short(tot, unit).n} unit={`${short(tot, unit).s} ${unitLabel(unit)}`} icon={Wallet3} tone="violet" bars={byFacet} sub={opts.join(" / ")} />
        : <StatCard label={facet?.label ?? "نوع"} value={toFa(opts.length)} icon={Bank} tone="violet" sub={opts.join("، ")} />}
      <StatCard label="انجام‌شده" value={toFa(okN)} unit={`از ${toFa(all.length)}`} icon={CheckCheck} tone="teal" progress={okN / Math.max(all.length, 1)} />
      <StatCard label="نیازمند پیگیری" value={toFa(warnN)} icon={AlertTriangle} tone="amber" sub={[...new Set(all.filter((r) => r.tone === "warning").map((r) => r.state))].join("، ") || "موردی نیست"} />
    </div>
    )}
    <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="panel flex h-fit flex-col gap-4 p-4 lg:sticky lg:top-4" aria-label={`فیلتر ${meta.label}`}>
        <div>
          <h3 className="mb-1.5 text-[12px] font-bold text-muted-foreground">وضعیت</h3>
          <div role="tablist" aria-label="وضعیت" className="flex flex-col gap-0.5">
            {[["all", "همه"], ...states.map((x) => [x, x])].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={state === k} onClick={() => setState(k)}
                className={cn("flex h-9 items-center justify-between rounded-field px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", state === k && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary")}>
                {l}<span className="num text-[12px]">{toFa(all.filter((r) => k === "all" || r.state === k).length)}</span>
              </button>
            ))}
          </div>
        </div>
        {facet && (
          <FilterGroup title={facet.label} on={kinds.length} onClear={() => setKinds([])}>
            <CheckList options={facet.options.map((k) => [k, k])} value={kinds} onChange={setKinds} count={(k) => all.filter((r) => r.kind === k).length} />
          </FilterGroup>
        )}
        <FilterGroup title={cat === "cheque" ? "سررسید" : "تاریخ"} on={when !== "all" ? 1 : 0} onClear={() => { setWhen("all"); setRange(["", ""]); }}>
          <div className="flex flex-wrap gap-1.5">
            {([["all", "کل آبان"], ["week", cat === "cheque" ? "۷ روز پیش و پس" : "۷ روز اخیر"], ["today", "امروز"], ["custom", "بازه‌ی دلخواه"]] as [When, string][]).map(([k, l]) => (
              <button key={k} className="chip h-7" aria-pressed={when === k} onClick={() => setWhen(k)}>{l}</button>
            ))}
          </div>
          {when === "custom" && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <SimpleSelect label="از تاریخ" placeholder="از" value={range[0]} onChange={(v) => setRange([v, range[1]])} options={days.map((d) => [String(d), fmtDay(8, d)])} className="num h-9 text-[12.5px]" />
              <SimpleSelect label="تا تاریخ" placeholder="تا" value={range[1]} onChange={(v) => setRange([range[0], v])} options={days.filter((d) => !range[0] || d >= +range[0]).map((d) => [String(d), fmtDay(8, d)])} className="num h-9 text-[12.5px]" />
            </div>
          )}
        </FilterGroup>
        {tot > 0 && (
          <FilterGroup title="مبلغ" on={amt[0] || amt[1] ? 1 : 0} onClear={() => setAmt(["", ""])}>
            <AmountRange min={amt[0]} max={amt[1]} onChange={(a, b) => setAmt([a, b])} unit={unitLabel(unit)} />
          </FilterGroup>
        )}
        {partyList.length > 1 && (
          <FilterGroup title="طرف حساب" on={parties.length} onClear={() => setParties([])} open={false}>
            <CheckList options={partyList.map((p) => [p, p])} value={parties} onChange={setParties} count={(k) => all.filter((r) => r.party === k).length} />
          </FilterGroup>
        )}
        {filtered && <button className="flex items-center gap-1 text-[12.5px] font-semibold text-primary" onClick={() => { setState("all"); setKinds([]); setWhen("all"); setQ(""); setParties([]); setAmt(["", ""]); setRange(["", ""]); }}><X className="size-3.5" />پاک کردن فیلترها</button>}
      </aside>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجوی شرح، طرف حساب یا شماره" aria-label={`جست‌وجو در ${meta.label}`} className="h-10 pe-9" />
          </div>
          <span className="num ms-auto text-[12.5px] text-muted-foreground">{toFa(rows.length)} مورد{sum ? ` · جمع ${money(sum, unit)} ${unitLabel(unit)}` : ""}</span>
        </div>
        <DataTable caption={meta.label} rowKey={(r) => r.no} rows={rows} pageSize={8} className="panel-data" onRow={(r) => toast(`جزئیات «${r.title}» در نسخه‌ی بعد فعال می‌شود.`)}
          empty={<Empty icon={Search} title="موردی با این فیلترها نیست" />}
          columns={[
            { key: "no", label: "شماره", className: "w-28", render: (r) => <span className="font-semibold">{r.no}</span> },
            { key: "title", label: "شرح", render: (r) => <span><b className="block">{r.title}</b><span className="text-[12px] text-muted-foreground">{r.party}</span></span> },
            { key: "kind", label: facet?.label ?? "نوع", hide: "md", render: (r) => <span className="text-muted-foreground">{r.kind}</span> },
            { key: "day", label: cat === "cheque" ? "سررسید" : "تاریخ", hide: "sm", render: (r) => <span className="text-muted-foreground">{fmtDay(8, r.day)}</span> },
            { key: "amt", label: `مبلغ (${unitLabel(unit)})`, align: "end", hide: "sm", render: (r) => (r.rial ? <b>{money(r.rial, unit)}</b> : <span className="text-muted-foreground">—</span>) },
            { key: "state", label: "وضعیت", render: (r) => <Badge tone={r.tone}>{r.state}</Badge> },
          ]} />
      </div>
    </div>
    </div>
  );
}

export function Documents() {
  const { concept, docCat } = useApp();
  return (
    <div className="flex flex-col gap-4">
      <DocHeader />
      {docCat !== "acc" ? (concept === "bento" ? <CategoryList cat={docCat} /> : <AssistCategory cat={docCat} />) : concept === "bento" ? <BentoDocuments /> : <AssistDocuments />}
    </div>
  );
}

