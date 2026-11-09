import * as React from "react";
import { Add, ChevronDown, ChevronLeft, Hierarchy, MagicStar, PencilLine, Search, Trash2, X, Check } from "@/components/icons";
import { useApp } from "@/lib/store";
import { accounts as demoAccounts } from "@/data/demo";
import { cn, toEn, toFa } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* Chart of accounts (کدینگ حساب‌ها) in exactly three levels:
   کل (1 digit) › معین (3 digits, starts with its کل) › تفصیلی (6 to 9 digits).
   Nothing can be added under a تفصیلی, so the tree never grows a fourth level. */

export type Level = 0 | 1 | 2;
export type Nature = "بدهکار" | "بستانکار";
export type CNode = { id: string; level: Level; code: string; name: string; parent: string | null; nature: Nature };

export const LEVEL: Record<Level, { name: string; digits: string }> = { 0: { name: "کل", digits: "۱ رقم" }, 1: { name: "معین", digits: "۳ رقم" }, 2: { name: "تفصیلی", digits: "۶ تا ۹ رقم" } };

const KOL: [string, string, Nature][] = [["1", "دارایی‌های جاری", "بدهکار"], ["2", "دارایی‌های غیرجاری", "بدهکار"], ["3", "بدهی‌های جاری", "بستانکار"], ["4", "درآمدها", "بستانکار"], ["5", "حقوق صاحبان سهام", "بستانکار"], ["6", "هزینه‌ها", "بدهکار"]];
const MOEIN: [string, string][] = [
  ["101", "موجودی نقد و بانک"], ["103", "حساب‌های دریافتنی تجاری"], ["104", "اسناد دریافتنی"],
  ["201", "دارایی‌های ثابت مشهود"], ["202", "استهلاک انباشته"],
  ["301", "حساب‌های پرداختنی تجاری"], ["305", "مالیات و بیمه‌ی پرداختنی"], ["310", "تسهیلات مالی دریافتی"],
  ["401", "درآمد عملیاتی"], ["501", "سرمایه"], ["502", "سود انباشته"],
  ["601", "هزینه‌های توزیع و فروش"], ["602", "هزینه‌های مالی"], ["605", "هزینه‌ی اجاره"], ["606", "هزینه‌های پرسنلی"], ["607", "هزینه‌های اداری"],
];
const EXTRA: [string, string, string][] = [["201", "200001", "ساختمان دفتر مرکزی"], ["201", "200002", "وسایل نقلیه"], ["201", "200003", "اثاثه و منصوبات"], ["202", "210001", "استهلاک انباشته‌ی ساختمان"], ["501", "500001", "سرمایه‌ی ثبت‌شده"], ["502", "510001", "سود انباشته‌ی سال‌های قبل"]];

function seed(): CNode[] {
  const out: CNode[] = KOL.map(([c, n, nat]) => ({ id: `k${c}`, level: 0, code: c, name: n, parent: null, nature: nat }));
  MOEIN.forEach(([c, n]) => out.push({ id: `m${c}`, level: 1, code: c, name: n, parent: `k${c[0]}`, nature: out.find((k) => k.code === c[0])!.nature }));
  demoAccounts.forEach((a) => { const [, m, t] = a.code.split("-"); out.push({ id: `t${m}${t}`, level: 2, code: t, name: a.name, parent: `m${m}`, nature: a.nature }); });
  EXTRA.forEach(([m, t, n]) => out.push({ id: `t${m}${t}`, level: 2, code: t, name: n, parent: `m${m}`, nature: out.find((x) => x.id === `m${m}`)!.nature }));
  return out;
}

/** State and rules shared by both designs. */
function useChart() {
  const { docs, settings, toast } = useApp();
  const [nodes, setNodes] = React.useState<CNode[]>(seed);
  const by = (id: string | null) => nodes.find((n) => n.id === id);
  const kids = (id: string | null) => nodes.filter((n) => n.parent === id).sort((a, b) => a.code.localeCompare(b.code));
  const fullCode = (n: CNode): string => { const p = by(n.parent); return p ? `${fullCode(p)}-${n.code}` : n.code; };
  /** What people read: کل «1», معین «101», تفصیلی «101 · 100001» (a معین already starts with its کل digit). */
  const showCode = (n: CNode): string => (n.level === 2 ? `${by(n.parent)?.code ?? ""}-${n.code}` : n.code);
  const used = (n: CNode): boolean => n.level === 2 ? docs.some((d) => d.lines.some((l) => l.account === fullCode(n))) : kids(n.id).some(used);
  const tafLen = settings.codeLen[2];

  const nextCode = (parent: CNode | null): string => {
    if (!parent) { for (let i = 1; i <= 9; i++) if (!kids(null).some((k) => k.code === String(i))) return String(i); return ""; }
    const sib = kids(parent.id).map((k) => parseInt(k.code, 10));
    if (parent.level === 0) { const max = sib.length ? Math.max(...sib) : parseInt(`${parent.code}00`, 10); return max % 100 === 99 ? "" : String(max + 1); }
    if (sib.length) return String(Math.max(...sib) + 1).padStart(tafLen, "0");
    return `${parent.code.slice(-1)}${"0".repeat(Math.max(tafLen - 2, 0))}1`;
  };
  /** Why a code cannot be used, or null. */
  const codeError = (level: Level, code: string, parent: CNode | null, self?: string): string | null => {
    if (!/^\d+$/.test(code)) return "فقط رقم";
    if (level === 0 && (code.length !== 1 || code === "0")) return "کد کل یک رقم از ۱ تا ۹ است";
    if (level === 1 && code.length !== 3) return "کد معین سه رقم است";
    if (level === 1 && parent && code[0] !== parent.code) return `کد معین با ${toFa(parent.code)} شروع می‌شود`;
    if (level === 2 && (code.length < 6 || code.length > 9)) return "کد تفصیلی بین ۶ تا ۹ رقم است";
    const clash = level === 1 ? nodes.find((n) => n.level === 1 && n.code === code && n.id !== self) : kids(parent?.id ?? null).find((n) => n.code === code && n.id !== self);
    return clash ? `این کد برای «${clash.name}» است` : null;
  };
  const lockOf = (n: CNode): string | null => used(n) ? "در اسناد استفاده شده؛ حذف نمی‌شود" : kids(n.id).length ? `${toFa(kids(n.id).length)} زیرحساب دارد؛ اول آن‌ها را حذف کنید` : null;

  const add = (parent: CNode | null, name: string, code: string) => {
    const level = (parent ? parent.level + 1 : 0) as Level;
    const n: CNode = { id: `n${Date.now()}`, level, code, name, parent: parent?.id ?? null, nature: parent?.nature ?? "بدهکار" };
    setNodes((x) => [...x, n]); toast(`${LEVEL[level].name} «${name}» با کد ${toFa(code)} اضافه شد.`, "success"); return n;
  };
  const update = (id: string, patch: Partial<CNode>) => {
    setNodes((x) => x.map((n) => (n.id === id ? { ...n, ...patch } : patch.nature && n.parent === id ? { ...n, nature: patch.nature } : n)));
    toast("حساب ذخیره شد.", "success");
  };
  const remove = (n: CNode) => { setNodes((x) => x.filter((y) => y.id !== n.id)); toast(`«${n.name}» حذف شد.`); };
  const count = (l: Level) => nodes.filter((n) => n.level === l).length;
  return { nodes, by, kids, fullCode, showCode, used, nextCode, codeError, lockOf, add, update, remove, count, tafLen };
}
type Chart = ReturnType<typeof useChart>;

const digits = (v: string) => toEn(v).replace(/[^\d]/g, "");
const codeFa = (c: string) => toFa(c).replace(/-/g, " - ");

/** Name + code fields used inline in both designs. */
function NodeForm({ chart, level, parent, node, onDone, compact }: { chart: Chart; level: Level; parent: CNode | null; node?: CNode; onDone: (n?: CNode) => void; compact?: boolean }) {
  const [name, setName] = React.useState(node?.name ?? "");
  const [code, setCode] = React.useState(node?.code ?? chart.nextCode(parent));
  const err = chart.codeError(level, code, parent, node?.id);
  const prefix = parent && level === 2 ? `${parent.code}-` : "";
  const save = () => {
    if (err || !name.trim()) return;
    if (node) { chart.update(node.id, { name: name.trim(), code }); onDone(node); } else onDone(chart.add(parent, name.trim(), code));
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className={cn("flex flex-wrap items-start gap-2", compact && "flex-nowrap")}
      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onDone(); } }}>
      <div className="flex flex-col gap-1">
        <div className={cn("flex h-9 items-center overflow-hidden rounded-field border bg-surface focus-within:ring-4 focus-within:ring-ring/15", err ? "border-danger" : "border-input focus-within:border-ring")} dir="ltr">
          {prefix && <span className="num ps-2.5 text-[12.5px] text-muted-foreground">{codeFa(prefix)}</span>}
          <input aria-label={`کد ${LEVEL[level].name}`} value={toFa(code)} onChange={(e) => setCode(digits(e.target.value).slice(0, level === 0 ? 1 : level === 1 ? 3 : 9))}
            className="num h-full bg-transparent px-2 text-[13px] font-bold outline-none" style={{ width: `${Math.max(code.length, 1) + 3}ch` }} />
        </div>
        {err && <span className="text-[11px] text-danger">{err}</span>}
      </div>
      <Input autoFocus aria-label={`نام ${LEVEL[level].name}`} value={name} onChange={(e) => setName(e.target.value)} placeholder={`نام ${LEVEL[level].name}`} className="h-9 min-w-[140px] flex-1 text-[13px]" />
      <Button type="submit" size="icon" className="size-9" aria-label="ذخیره" disabled={!!err || !name.trim()}><Check className="size-4" /></Button>
      <Button type="button" size="icon" variant="outline" className="size-9" aria-label="انصراف" onClick={() => onDone()}><X className="size-4" /></Button>
    </form>
  );
}

/** Two-step delete. An account that is used in documents or still has sub-accounts cannot be deleted:
    rows simply show no delete button, and the detail panel says why. */
function DeleteBtn({ chart, n, className, explain }: { chart: Chart; n: CNode; className?: string; explain?: boolean }) {
  const [ask, setAsk] = React.useState(false);
  const lock = chart.lockOf(n);
  if (lock && !explain) return null;
  if (ask) return (
    <span className="flex items-center gap-1 text-[12px]">
      <span className="font-semibold text-danger">حذف شود؟</span>
      <button type="button" className="rounded-md px-2 py-1 font-bold text-danger hover:bg-danger-soft" onClick={() => chart.remove(n)}>بله</button>
      <button type="button" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted" onClick={() => setAsk(false)}>نه</button>
    </span>
  );
  if (lock) return <Button variant="outline" disabled className={className} title={lock}><Trash2 /> حذف نمی‌شود</Button>;
  return (
    <button type="button" aria-label={`حذف ${n.name}`} title="حذف" onClick={() => setAsk(true)}
      className={cn("grid size-8 place-items-center rounded-[9px] text-muted-foreground hover:bg-danger-soft hover:text-danger", className)}>
      <Trash2 className="size-3.5" />
    </button>
  );
}

/** Small marker for accounts that already appear in documents. */
const UsedTag = ({ chart, n }: { chart: Chart; n: CNode }) => (n.level === 2 && chart.used(n) ? <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-bold text-muted-foreground" title="این حساب در اسناد آمده و حذف نمی‌شود">در سند</span> : null);

/* ================= «پیشخوان»: a three-lane code map ================= 
   One lane per level. Picking a کل fills the معین lane, picking a معین fills the تفصیلی lane,
   and the strip on top spells out the full code being built, segment by segment. */
const LANE_TINT: Record<Level, string> = { 0: "--ch-1", 1: "--ch-2", 2: "--ch-3" };

function BentoTree({ chart, q }: { chart: Chart; q: string }) {
  const [kol, setKol] = React.useState<string | null>("k1");
  const [moein, setMoein] = React.useState<string | null>("m101");
  const [taf, setTaf] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState<Level | null>(null);
  const hit = (n: CNode): boolean => !q || n.name.includes(q) || chart.showCode(n).includes(toEn(q)) || chart.kids(n.id).some(hit);
  const K = chart.by(kol) ?? null, M = chart.by(moein) ?? null, T = chart.by(taf) ?? null;
  const pick = (n: CNode) => {
    setEditing(null); setAdding(null);
    if (n.level === 0) { setKol(n.id); setMoein(null); setTaf(null); }
    else if (n.level === 1) { setMoein(n.id); setTaf(null); }
    else setTaf(n.id);
  };
  const lanes: { level: Level; parent: CNode | null; items: CNode[]; sel: string | null }[] = [
    { level: 0, parent: null, items: chart.kids(null).filter(hit), sel: kol },
    { level: 1, parent: K, items: K ? chart.kids(K.id).filter(hit) : [], sel: moein },
    { level: 2, parent: M, items: M ? chart.kids(M.id).filter(hit) : [], sel: taf },
  ];
  const segs: [Level, CNode | null, number][] = [[0, K, 1], [1, M, 3], [2, T, T?.code.length ?? chart.tafLen]];

  return (
    <div className="flex flex-col gap-4">
      <section className="panel flex flex-wrap items-center gap-x-8 gap-y-4 p-5" aria-label="ساختار کد">
        <div className="min-w-[200px] flex-1">
          <span className="block text-[11.5px] text-muted-foreground">{T ? "حساب انتخاب‌شده" : M ? "یک تفصیلی انتخاب کنید" : K ? "یک معین انتخاب کنید" : "یک حساب کل انتخاب کنید"}</span>
          <b className="mt-0.5 block text-[16px]">{(T ?? M ?? K)?.name ?? "هنوز حسابی انتخاب نشده"}</b>
          {K && <span className="mt-1 block text-[12px] text-muted-foreground">{[K, M, T].filter(Boolean).map((x) => x!.name).join(" › ")}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2" dir="ltr">
          {segs.map(([l, n, len], i) => (
            <React.Fragment key={l}>
              {i > 0 && <ChevronLeft className="size-4 rotate-180 text-muted-foreground/50" aria-hidden />}
              <div className={cn("flex flex-col gap-1.5 rounded-[14px] p-2 transition-colors", n ? "bg-muted/40" : "bg-muted/25")}>
                <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground" dir="rtl">
                  <i className="size-2 rounded-full" style={{ background: `hsl(var(${LANE_TINT[l]}))`, opacity: n ? 1 : 0.4 }} />{LEVEL[l].name}<span className="num font-medium opacity-70">{LEVEL[l].digits}</span>
                </span>
                <span className="flex justify-center gap-1">
                  {Array.from({ length: len }, (_, j) => {
                    const ch = n?.code[j];
                    return <span key={j} className={cn("num grid h-10 w-8 place-items-center rounded-[9px] text-[18px] font-extrabold transition-colors", ch ? "text-white shadow-soft" : "bg-surface ring-1 ring-inset ring-border/80")} style={ch ? { background: `hsl(var(${LANE_TINT[l]}))` } : undefined}>{ch ? toFa(ch) : ""}</span>;
                  })}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
        {lanes.map(({ level, parent, items, sel }) => {
          const tint = LANE_TINT[level];
          const ready = level === 0 || !!parent;
          return (
            <section key={level} className="panel flex min-w-0 flex-col p-3" aria-label={`ستون ${LEVEL[level].name}`}>
              <header className="flex items-center gap-2 px-2 pb-3 pt-1">
                <span className="size-2.5 rounded-full" style={{ background: `hsl(var(${tint}))` }} />
                <b className="text-[14px]">{LEVEL[level].name}</b>
                <span className="num text-[11.5px] text-muted-foreground">{LEVEL[level].digits}</span>
                <span className="num ms-auto rounded-md bg-muted px-1.5 text-[11.5px] font-bold text-muted-foreground">{toFa(items.length)}</span>
              </header>
              {!ready ? (
                <p className="m-auto px-4 py-10 text-center text-[12.5px] text-muted-foreground">برای دیدن {LEVEL[level].name}‌ها، اول از ستون قبل یک حساب انتخاب کنید.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {items.map((n) => {
                    const on = n.id === sel;
                    if (editing === n.id) return <li key={n.id} className="rounded-[12px] border border-primary/50 bg-surface p-2.5"><NodeForm chart={chart} level={level} parent={parent} node={n} onDone={() => setEditing(null)} /></li>;
                    return (
                      <li key={n.id} className="group relative">
                        <button type="button" onClick={() => pick(n)} aria-current={on ? "true" : undefined}
                          className={cn("flex min-h-[48px] w-full items-center gap-3 rounded-[12px] border px-3 py-2 pe-[76px] text-start transition-colors", on ? "border-transparent" : "border-transparent hover:bg-muted/60")}
                          style={on ? { background: `hsl(var(${tint}) / .12)`, boxShadow: `inset -3px 0 0 hsl(var(${tint}))` } : undefined}>
                          <span className="num shrink-0 text-[13px] font-extrabold" style={{ color: `hsl(var(${tint}))` }} dir="ltr">{toFa(n.code)}</span>
                          <span className="min-w-0 flex-1">
                            <b className="block truncate text-[13px]">{n.name}</b>
                            {level < 2 && <span className="num block text-[11px] text-muted-foreground">{toFa(chart.kids(n.id).length)} {LEVEL[(level + 1) as Level].name}</span>}
                          </span>
                          <UsedTag chart={chart} n={n} />
                        </button>
                        <span className="absolute end-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
                          <button type="button" aria-label={`ویرایش ${n.name}`} title="ویرایش" onClick={() => setEditing(n.id)} className="grid size-8 place-items-center rounded-[9px] text-muted-foreground hover:bg-primary-soft hover:text-primary"><PencilLine className="size-3.5" /></button>
                          <DeleteBtn chart={chart} n={n} />
                        </span>
                      </li>
                    );
                  })}
                  {!items.length && <li className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">{q ? "در این ستون چیزی پیدا نشد." : `هنوز ${LEVEL[level].name}ی ندارد.`}</li>}
                  <li className="mt-1">
                    {adding === level ? (
                      <div className="rounded-[12px] border border-dashed p-2.5" style={{ borderColor: `hsl(var(${tint}) / .6)` }}>
                        <span className="mb-2 block text-[12px] font-bold" style={{ color: `hsl(var(${tint}))` }}>{LEVEL[level].name} جدید{parent ? ` در «${parent.name}»` : ""}</span>
                        <NodeForm chart={chart} level={level} parent={parent} onDone={(n) => { setAdding(null); if (n) pick(n); }} />
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setEditing(null); setAdding(level); }} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-border text-[12.5px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                        <Add className="size-4" style={{ color: `hsl(var(${tint}))` }} /> {LEVEL[level].name} جدید{parent ? ` در «${parent.name}»` : ""}
                      </button>
                    )}
                  </li>
                </ul>
              )}
            </section>
          );
        })}
      </div>
      {T && (
        <p className="num flex flex-wrap items-center gap-2 px-1 text-[12.5px] text-muted-foreground">
          <Hierarchy className="size-4" /> تفصیلی آخرین سطح است و زیرحساب نمی‌گیرد. {chart.lockOf(T) ? `«${T.name}» ${chart.lockOf(T)}.` : `«${T.name}» هنوز در سندی نیامده و حذف‌شدنی است.`}
        </p>
      )}
    </div>
  );
}

/* ================= «دستیار»: an outline tree with an inspector and a placement helper ================= */
function AssistTree({ chart, q }: { chart: Chart; q: string }) {
  const [open, setOpen] = React.useState<string[]>(["k1", "m101", "k6"]);
  const [sel, setSel] = React.useState<string>("m101");
  const [mode, setMode] = React.useState<"view" | "edit" | "add">("view");
  const [ask, setAsk] = React.useState("");
  const [tip, setTip] = React.useState<{ text: string; parent?: CNode } | null>(null);
  const [rowEdit, setRowEdit] = React.useState<string | null>(null);
  const [rowAdd, setRowAdd] = React.useState<string | null>(null); // parent id, or "root"
  const node = chart.by(sel) ?? chart.kids(null)[0];
  const startAdd = (p: CNode | null) => { setRowEdit(null); setRowAdd(p?.id ?? "root"); if (p) setOpen((x) => [...new Set([...x, p.id])]); };
  const indent = (depth: number) => ({ paddingInlineStart: depth * 22 + 6 });
  const guides = (depth: number) => Array.from({ length: depth }, (_, i) => <span key={i} aria-hidden className="absolute inset-y-0 w-px bg-border" style={{ insetInlineStart: i * 22 + 17 }} />);
  const formRow = (depth: number, level: Level, parent: CNode | null, n?: CNode) => (
    <li className="relative py-1.5 pe-2" style={indent(depth)}>
      {guides(depth)}
      <div className="relative ms-7 rounded-field border border-primary/40 bg-surface p-2">
        <span className="mb-1.5 block text-[11.5px] font-bold text-primary">{n ? `ویرایش ${LEVEL[level].name}` : `${LEVEL[level].name} جدید${parent ? ` در «${parent.name}»` : ""}`}</span>
        <NodeForm chart={chart} level={level} parent={parent} node={n} onDone={(x) => { setRowEdit(null); setRowAdd(null); if (x) { setSel(x.id); setMode("view"); } }} />
      </div>
    </li>
  );
  const hit = (n: CNode): boolean => !q || n.name.includes(q) || chart.showCode(n).includes(toEn(q)) || chart.kids(n.id).some(hit);

  // a few rules that show the idea: say what the account is, get where it belongs and its next code
  const place = (t = ask) => {
    const s = t.trim(); if (!s) return;
    const rules: [RegExp, string][] = [[/بانک|سپرده|جاری/, "m101"], [/صندوق|تنخواه/, "m101"], [/مشتری|شرکت|فروش به/, "m103"], [/چک/, "m104"], [/خودرو|ساختمان|اثاثه|ماشین|زمین/, "m201"], [/تأمین|فروشنده|پیمانکار/, "m301"], [/مالیات|بیمه|عوارض/, "m305"], [/وام|تسهیلات/, "m310"], [/حقوق|دستمزد|پاداش|اضافه.?کار/, "m606"], [/اجاره/, "m605"], [/حمل|بازاریابی|تبلیغ/, "m601"], [/کارمزد|بهره/, "m602"], [/ملزومات|آب|برق|تلفن|اینترنت|پذیرایی/, "m607"]];
    const id = rules.find(([r]) => r.test(s))?.[1];
    const p = id ? chart.by(id) : undefined;
    if (!p) { setTip({ text: "جای مشخصی پیدا نکردم. نوع حساب را دقیق‌تر بنویسید، مثلاً «بانک تجارت» یا «هزینه‌ی اینترنت»." }); return; }
    setOpen((x) => [...new Set([...x, p.parent!, p.id])]); setSel(p.id); setMode("view");
    setTip({ text: `«${s}» یک تفصیلی زیر ${chart.by(p.parent)?.name} › ${p.name} است. کد پیشنهادی: ${codeFa(`${p.code}-${chart.nextCode(p)}`)}`, parent: p });
  };

  const line = (n: CNode, depth: number): React.ReactNode => {
    const kids = chart.kids(n.id).filter(hit);
    const o = !!q || open.includes(n.id);
    const on = node?.id === n.id;
    const parentNode = chart.by(n.parent) ?? null;
    const childLevel = (n.level + 1) as Level;
    return (
      <li key={n.id} role="treeitem" aria-expanded={n.level < 2 ? o : undefined} aria-selected={on}>
        {rowEdit === n.id ? <ul>{formRow(depth, n.level, parentNode, n)}</ul> : (
          <div className={cn("group relative flex h-10 items-center gap-2 rounded-field pe-2 text-[13px] transition-colors hover:bg-muted/70", on && "bg-primary-soft text-primary hover:bg-primary-soft")} style={indent(depth)}>
            {guides(depth)}
            {n.level < 2 ? (
              <button aria-label={o ? `بستن ${n.name}` : `باز کردن ${n.name}`} onClick={() => setOpen((x) => (o ? x.filter((y) => y !== n.id) : [...x, n.id]))} className="relative z-10 grid size-6 place-items-center rounded-md bg-inherit text-muted-foreground hover:text-foreground">
                <ChevronDown className={cn("size-3.5 transition-transform", !o && "rotate-90")} />
              </button>
            ) : <span className="relative z-10 grid size-6 place-items-center"><i className="size-1.5 rounded-full bg-current opacity-40" /></span>}
            <button onClick={() => { setSel(n.id); setMode("view"); }} className="flex min-w-0 flex-1 items-center gap-2.5 text-start">
              <span className={cn("num shrink-0 tabular-nums text-muted-foreground", on && "text-primary", n.level === 0 && "font-extrabold text-foreground")} dir="ltr">{codeFa(chart.showCode(n))}</span>
              <span className={cn("truncate", n.level === 0 ? "font-extrabold" : n.level === 1 ? "font-bold" : "")}>{n.name}</span>
              <UsedTag chart={chart} n={n} />
            </button>
            <span className="flex items-center gap-0.5 text-muted-foreground opacity-100 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
              {n.level < 2 && <button type="button" aria-label={`افزودن ${LEVEL[childLevel].name} در ${n.name}`} title={`${LEVEL[childLevel].name} جدید`} onClick={() => startAdd(n)} className="grid size-8 place-items-center rounded-[9px] hover:bg-primary-soft hover:text-primary"><Add className="size-4" /></button>}
              <button type="button" aria-label={`ویرایش ${n.name}`} title="ویرایش" onClick={() => { setRowAdd(null); setRowEdit(n.id); }} className="grid size-8 place-items-center rounded-[9px] hover:bg-primary-soft hover:text-primary"><PencilLine className="size-3.5" /></button>
              <DeleteBtn chart={chart} n={n} />
            </span>
            <span className={cn("hidden w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-[10.5px] font-bold sm:inline", n.level === 0 ? "bg-ch-1/15 text-ch-1" : n.level === 1 ? "bg-ch-2/15 text-ch-2" : "bg-muted text-muted-foreground")}>{LEVEL[n.level].name}</span>
          </div>
        )}
        {n.level < 2 && o && (
          <ul role="group">
            {kids.map((k) => line(k, depth + 1))}
            {rowAdd === n.id ? formRow(depth + 1, childLevel, n) : !q && (
              <li style={indent(depth + 1)} className="relative">
                {guides(depth + 1)}
                <button type="button" onClick={() => startAdd(n)} className="ms-7 flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-semibold text-muted-foreground/80 hover:bg-muted/60 hover:text-primary">
                  <Add className="size-3.5" /> {LEVEL[childLevel].name} جدید
                </button>
              </li>
            )}
          </ul>
        )}
      </li>
    );
  };

  const parent = node ? chart.by(node.parent) ?? null : null;
  const path = node ? [chart.by(parent?.parent ?? null), parent, node].filter(Boolean) as CNode[] : [];
  return (
    <div className="flex flex-col gap-4">
      <section className="hero p-4">
        <form onSubmit={(e) => { e.preventDefault(); place(); }} className="flex flex-wrap items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-ai-soft text-ai-ink"><MagicStar className="size-5" variant="Bulk" /></span>
          <label className="min-w-[220px] flex-1">
            <span className="block text-[12px] font-bold text-muted-foreground">حساب تازه را کجا بگذارم؟</span>
            <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="مثلاً «بانک تجارت شعبه ونک» یا «هزینه‌ی اینترنت»" className="h-8 w-full bg-transparent text-[14px] font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground" />
          </label>
          <Button type="submit" variant="ai" disabled={!ask.trim()}>پیشنهاد جا و کد</Button>
        </form>
        {tip && (
          <div className="num mt-3 flex flex-wrap items-center gap-2 rounded-field bg-surface/80 px-3 py-2 text-[13px]">
            <span className="min-w-0 flex-1">{tip.text}</span>
            {tip.parent && <Button size="sm" onClick={() => { setSel(tip.parent!.id); setMode("add"); setTip(null); }}><Add /> همین‌جا بساز</Button>}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="panel min-w-0 p-3">
          <div className="flex items-center justify-between px-2 pb-2 text-[11.5px] font-bold text-muted-foreground"><span>کد و نام حساب</span><span className="hidden sm:inline">روی هر ردیف: افزودن زیرحساب، ویرایش، حذف</span></div>
          <ul role="tree" aria-label="درخت کدینگ" className="flex flex-col">{chart.kids(null).filter(hit).map((k) => line(k, 0))}{rowAdd === "root" && formRow(0, 0, null)}</ul>
          <button onClick={() => startAdd(null)} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-field border border-dashed border-border text-[13px] font-bold text-muted-foreground hover:border-primary/50 hover:text-primary"><Add className="size-4" /> حساب کل جدید</button>
        </section>

        <aside className="panel flex h-fit flex-col gap-4 p-5 lg:sticky lg:top-4" aria-label="جزئیات حساب">
          {mode === "add" ? (() => {
            const p = sel ? node : null;
            const level = (p ? p.level + 1 : 0) as Level;
            return (
              <>
                <div><Badge tone="info">{LEVEL[level].name} جدید</Badge><h3 className="mt-2 text-[16px] font-extrabold">{p ? `زیر «${p.name}»` : "در بالاترین سطح"}</h3>
                  <p className="text-[12.5px] text-muted-foreground">کد {LEVEL[level].name} {LEVEL[level].digits} است؛ کد بعدی را پیشنهاد کرده‌ایم.</p></div>
                <NodeForm chart={chart} level={level} parent={p} onDone={(n) => { setMode("view"); if (n) { setSel(n.id); if (p) setOpen((x) => [...new Set([...x, p.id])]); } }} />
              </>
            );
          })() : node && (
            <>
              <nav aria-label="مسیر حساب" className="flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground">
                {path.map((p, i) => <span key={p.id} className="flex items-center gap-1">{i > 0 && <span aria-hidden>›</span>}<button onClick={() => setSel(p.id)} className={cn("hover:text-primary", p.id === node.id && "font-bold text-foreground")}>{p.name}</button></span>)}
              </nav>
              {mode === "edit" ? <NodeForm chart={chart} level={node.level} parent={parent} node={node} onDone={() => setMode("view")} /> : (
                <div>
                  <span className="num text-[28px] font-extrabold leading-none text-primary" dir="ltr">{codeFa(chart.showCode(node))}</span>
                  <h3 className="mt-1 text-[18px] font-extrabold">{node.name}</h3>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-3 rounded-field bg-muted/50 p-3.5 text-[12.5px]">
                <div><dt className="text-muted-foreground">سطح</dt><dd className="font-bold">{LEVEL[node.level].name}، {LEVEL[node.level].digits}</dd></div>
                <div><dt className="text-muted-foreground">زیرحساب</dt><dd className="num font-bold">{node.level < 2 ? toFa(chart.kids(node.id).length) : "ندارد"}</dd></div>
                <div className="col-span-2"><dt className="mb-1 text-muted-foreground">ماهیت</dt><dd>
                  {node.level === 0 ? (
                    <div className="inline-flex rounded-full bg-surface p-0.5" role="radiogroup" aria-label="ماهیت حساب">
                      {(["بدهکار", "بستانکار"] as Nature[]).map((v) => <button key={v} role="radio" aria-checked={node.nature === v} onClick={() => node.nature !== v && chart.update(node.id, { nature: v })} className={cn("h-7 rounded-full px-3 text-[12px] font-bold", node.nature === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{v}</button>)}
                    </div>
                  ) : <b>{node.nature} <span className="font-normal text-muted-foreground">(از حساب کل)</span></b>}
                </dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">کاربرد</dt><dd className="font-bold">{chart.used(node) ? "در اسناد امسال استفاده شده" : "هنوز در سندی نیامده"}</dd></div>
              </dl>
              <div className="flex flex-wrap items-center gap-2">
                {mode !== "edit" && <Button variant="outline" onClick={() => setMode("edit")}><PencilLine /> ویرایش</Button>}
                {node.level < 2 && <Button onClick={() => setMode("add")}><Add /> {LEVEL[(node.level + 1) as Level].name} جدید</Button>}
                <DeleteBtn chart={chart} n={node} explain className="ms-auto" />
              </div>
              {node.level === 2 && <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Hierarchy className="size-4" /> تفصیلی آخرین سطح است و زیرحساب نمی‌گیرد.</p>}
              {chart.lockOf(node) && <p className="text-[12px] text-muted-foreground">{chart.lockOf(node)}.</p>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export function ChartOfAccounts() {
  const { concept } = useApp();
  const chart = useChart();
  const [q, setQ] = React.useState("");
  const bento = concept === "bento";
  const stats: [Level, string][] = [[0, "ch-1"], [1, "ch-2"], [2, "ch-3"]];
  return (
    <div className="flex flex-col gap-4">
      <section className="panel flex flex-wrap items-center gap-4 p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-primary-soft text-primary"><Hierarchy className="size-6" variant="Bulk" /></span>
        <div className="min-w-[200px] flex-1">
          <p className="text-[12px] font-bold text-muted-foreground">اطلاعات پایه</p>
          <h2 className="text-[19px] font-extrabold">کدینگ حساب‌ها</h2>
          <p className="text-[12.5px] text-muted-foreground">سه سطح: کل (۱ رقم)، معین (۳ رقم) و تفصیلی (۶ تا ۹ رقم، فعلاً {toFa(chart.tafLen)} رقم). حسابی که در سند آمده حذف نمی‌شود.</p>
        </div>
        <div className="flex gap-2">
          {stats.map(([l, c]) => (
            <div key={l} className="min-w-[78px] rounded-field bg-muted/50 px-3 py-2 text-center">
              <b className="num block text-[18px]" style={{ color: `hsl(var(--${c}))` }}>{toFa(chart.count(l))}</b>
              <span className="text-[11.5px] text-muted-foreground">{LEVEL[l].name}</span>
            </div>
          ))}
        </div>
        <label className="relative block w-full max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجوی نام یا کد حساب" aria-label="جست‌وجو در کدینگ" className="ps-9" />
        </label>
      </section>
      {bento ? <BentoTree chart={chart} q={q.trim()} /> : <AssistTree chart={chart} q={q.trim()} />}
    </div>
  );
}
