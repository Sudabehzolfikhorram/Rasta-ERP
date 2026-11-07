import * as React from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { accounts, type Account } from "@/data/demo";
import { cn, toFa } from "@/lib/utils";

const hints: [RegExp, string][] = [
  [/حمل|باربری|کرایه/, "6-601-700003"],
  [/کارمزد/, "6-602-700011"],
  [/اجاره/, "6-605-700020"],
  [/مارون/, "1-103-300014"],
  [/فولاد/, "1-103-300021"],
  [/تکین/, "3-301-500007"],
  [/صندوق|نقد/, "1-101-100010"],
];

export function suggestFor(desc: string): Account | undefined {
  const hit = hints.find(([re]) => re.test(desc));
  return hit ? accounts.find((a) => a.code === hit[1]) : undefined;
}

export const codeFa = (c: string) => toFa(c).split("-").join(" · ");

export function AccountPicker({ value, onChange, desc, invalid }: { value: string | null; onChange: (code: string) => void; desc: string; invalid?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [hi, setHi] = React.useState(0);
  const acc = accounts.find((a) => a.code === value);
  const suggestion = !value ? suggestFor(desc) : undefined;
  const list = accounts.filter((a) => !q || a.name.includes(q) || a.path.includes(q) || a.code.replace(/-/g, "").includes(q.replace(/\s/g, "")));
  const pick = (c: string) => { onChange(c); setOpen(false); setQ(""); };

  return (
    <div className="flex flex-col gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-xl border bg-surface px-3 text-start text-[13px] transition-[border-color,box-shadow] hover:border-ring/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
              invalid ? "border-danger/50" : "border-input",
            )}
          >
            {acc ? (
              <span className="min-w-0 flex-1 truncate"><b className="font-bold">{acc.name}</b> <span className="num text-muted-foreground">{codeFa(acc.code)}</span></span>
            ) : (
              <span className="flex-1 text-muted-foreground">انتخاب حساب</span>
            )}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-2" align="start">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => { setQ(e.target.value); setHi(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
                if (e.key === "Enter" && list[hi]) { e.preventDefault(); pick(list[hi].code); }
              }}
              placeholder="نام، کد یا گروه حساب"
              aria-label="جست‌وجوی حساب"
              className="h-10 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="mt-2 max-h-72 overflow-auto" role="listbox" aria-label="حساب‌ها">
            {list.map((a, i) => (
              <li key={a.code} role="option" aria-selected={i === hi}>
                <button onMouseEnter={() => setHi(i)} onClick={() => pick(a.code)} className={cn("flex w-full flex-col rounded-lg px-3 py-2 text-start", i === hi && "bg-primary-soft")}>
                  <span className="text-[13px] font-bold">{a.name}</span>
                  <span className="num text-[11.5px] text-muted-foreground">{codeFa(a.code)} · {a.path}</span>
                </button>
              </li>
            ))}
            {!list.length && <li className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">حسابی با این نام نیست. می‌توانید همین‌جا یک حساب تفصیلی تازه بسازید.</li>}
          </ul>
        </PopoverContent>
      </Popover>
      {suggestion && (
        <button onClick={() => onChange(suggestion.code)} className="flex items-center gap-1 self-start rounded-full bg-ai-soft px-2 py-0.5 text-[11.5px] font-semibold text-ai-ink hover:brightness-95">
          <Sparkles className="size-3" /> پیشنهاد: {suggestion.name}
        </button>
      )}
    </div>
  );
}
