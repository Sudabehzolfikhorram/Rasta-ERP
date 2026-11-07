import { CircleHelp, Search, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function Segmented<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: [T, string][]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-muted p-1 text-[12.5px]">
      {items.map(([v, l]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn("h-7 rounded-full px-3 font-semibold text-muted-foreground transition-colors", value === v && "bg-surface text-foreground shadow-soft")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Topbar() {
  const { page, unit, setUnit, concept, setConcept, openPalette, setTour } = useApp();
  return (
    <header className="flex flex-wrap items-center gap-3">
      <div className="min-w-[150px]">
        <h1 className="text-[22px] font-extrabold tracking-tight">{page === "dashboard" ? "صبح بخیر" : "ثبت سند حسابداری"}</h1>
        <p className="num text-[12.5px] text-muted-foreground">شنبه ۱۶ آبان ۱۴۰۵ · دوره‌ی آبان باز است</p>
      </div>

      <button
        data-tour="command"
        onClick={() => openPalette()}
        className="panel group flex h-11 min-w-[260px] flex-1 items-center gap-2.5 rounded-full px-4 text-start text-[13.5px] text-muted-foreground transition-shadow hover:shadow-lift"
      >
        <span className="ai-edge grid size-6 place-items-center rounded-full text-white"><Sparkles className="size-3.5" /></span>
        از راستا بپرسید یا دستور بدهید… مثلاً «مانده‌ی بانک‌ها»
        <Search className="ms-auto size-4 opacity-60" />
        <Kbd>Ctrl K</Kbd>
      </button>

      <div className="flex items-center gap-2">
        <Segmented label="واحد نمایش مبلغ" value={unit} onChange={setUnit} items={[["rial", "ریال"], ["toman", "تومان"]]} />
        <div data-tour="concept">
          <Segmented label="کانسپت طراحی" value={concept} onChange={setConcept} items={[["calm", "کانسپت آرام"], ["glass", "کانسپت شیشه"]]} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => setTour(true)} aria-label="تور راهنما" className="panel grid size-10 place-items-center rounded-full text-muted-foreground hover:text-foreground">
              <CircleHelp className="size-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>تور ۴۵ ثانیه‌ای همین صفحه</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
