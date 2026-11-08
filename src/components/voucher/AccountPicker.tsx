import * as React from "react";
import { ChevronDown, Search, Sparkles } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { accountBy, accounts, groups, type Account } from "@/data/demo";
import { cn, toFa } from "@/lib/utils";
import { expenseFor } from "./agent";

const partyHints: [RegExp, string][] = [[/مارون/, "1-103-300014"], [/فولاد/, "1-103-300021"], [/البرز/, "1-103-300030"], [/سیمان/, "1-103-300042"], [/تکین/, "3-301-500007"], [/آریا/, "3-301-500012"], [/صندوق/, "1-101-100010"], [/تنخواه/, "1-101-100020"]];
export function suggestFor(desc: string): Account | undefined {
  const code = partyHints.find(([re]) => re.test(desc))?.[1] ?? expenseFor(desc);
  return code ? accountBy(code) : undefined;
}

export const codeFa = (c: string) => toFa(c.replace(/-/g, ""));

const RECENT = ["1-101-100001", "1-101-100010", "6-601-700003"];

export function AccountPicker({ value, onChange, desc, invalid, className }: { value: string | null; onChange: (code: string) => void; desc: string; invalid?: boolean; className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [g, setG] = React.useState<string | null>(null);
  const [hi, setHi] = React.useState(0);
  const acc = accountBy(value);
  const suggestion = !value ? suggestFor(desc) : undefined;

  const match = (a: Account) => {
    if (g && a.group !== g) return false;
    if (!q) return true;
    const qq = q.replace(/\s/g, "");
    return a.name.includes(q) || a.code.replace(/-/g, "").includes(qq) || codeFa(a.code).includes(qq) || groups.find((x) => x.id === a.group)!.label.includes(q);
  };
  const list = accounts.filter(match);
  const sections = groups.map((gr) => ({ gr, items: list.filter((a) => a.group === gr.id) })).filter((s) => s.items.length);
  const flat = sections.flatMap((s) => s.items);
  const showTop = !q && !g;
  const top = showTop ? [...(suggestion ? [suggestion] : []), ...RECENT.map((c) => accountBy(c)!).filter((a) => a.code !== suggestion?.code)] : [];
  const nav = [...top, ...flat];
  const pick = (c: string) => { onChange(c); setOpen(false); setQ(""); setG(null); };

  const Item = ({ a, i, tag }: { a: Account; i: number; tag?: React.ReactNode }) => (
    <li role="option" aria-selected={i === hi}>
      <button onMouseEnter={() => setHi(i)} onClick={() => pick(a.code)} className={cn("flex h-10 w-full items-center gap-2 rounded-xl px-3 text-start text-[13px]", i === hi && "bg-primary-soft", a.code === value && "font-bold text-primary")}>
        {tag}
        <span className="min-w-0 flex-1 truncate">{a.name}</span>
        <span className="num text-[11px] text-muted-foreground" dir="ltr">{codeFa(a.code)}</span>
      </button>
    </li>
  );

  let idx = 0;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setHi(0); }}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border bg-surface px-3 text-start text-[13.5px] transition-[border-color,box-shadow] hover:border-ring/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
              invalid ? "border-danger/60" : "border-input",
            )}
          >
            {acc ? (
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <b className="truncate font-bold">{acc.name}</b>
                <span className="num truncate text-[11px] text-muted-foreground">{groups.find((x) => x.id === acc.group)?.label} · {codeFa(acc.code)}</span>
              </span>
            ) : (
              <span className="flex-1 text-muted-foreground">حساب را انتخاب کنید</span>
            )}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-2" align="start">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => { setQ(e.target.value); setHi(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, nav.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
                if (e.key === "Enter" && nav[hi]) { e.preventDefault(); pick(nav[hi].code); }
              }}
              placeholder="نام یا کد حساب"
              aria-label="جست‌وجوی حساب"
              className="h-10 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto pb-1" role="group" aria-label="گروه حساب">
            {groups.map((gr) => (
              <button key={gr.id} aria-pressed={g === gr.id} onClick={() => { setG(g === gr.id ? null : gr.id); setHi(0); }} className="chip h-7 shrink-0 px-2.5 text-[11.5px]">{gr.label}</button>
            ))}
          </div>
          <ul className="mt-1 max-h-72 overflow-auto" role="listbox" aria-label="حساب‌ها">
            {top.length > 0 && <li className="px-3 pb-1 pt-2 text-[11px] font-semibold text-muted-foreground">{suggestion ? "پیشنهاد و اخیر" : "اخیر"}</li>}
            {top.map((a) => <Item key={"t" + a.code} a={a} i={idx++} tag={a.code === suggestion?.code ? <Sparkles className="size-3.5 text-ai" /> : undefined} />)}
            {sections.map((s) => (
              <React.Fragment key={s.gr.id}>
                <li className="px-3 pb-1 pt-3 text-[11px] font-semibold text-muted-foreground">{s.gr.label}</li>
                {s.items.map((a) => <Item key={a.code} a={a} i={idx++} />)}
              </React.Fragment>
            ))}
            {!list.length && <li className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">حسابی پیدا نشد.</li>}
          </ul>
        </PopoverContent>
      </Popover>
      {suggestion && (
        <button onClick={() => onChange(suggestion.code)} className="flex items-center gap-1 self-start rounded-full bg-ai-soft px-2 py-0.5 text-[11.5px] font-semibold text-ai-ink hover:brightness-95">
          <Sparkles className="size-3" /> {suggestion.name}؟
        </button>
      )}
    </div>
  );
}
