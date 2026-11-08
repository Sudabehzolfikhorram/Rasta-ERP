import { CircleHelp, Moon, Search, Sparkles, Sun } from "lucide-react";
import { useApp, type Page } from "@/lib/store";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { fmtFull, TODAY } from "@/lib/jalali";

export function Segmented<T extends string>({ value, onChange, items, label, className }: { value: T; onChange: (v: T) => void; items: [T, string][]; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex rounded-full bg-muted/80 p-1 text-[12.5px]", className)}>
      {items.map(([v, l]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn("h-7 whitespace-nowrap rounded-full px-3 font-semibold text-muted-foreground transition-colors hover:text-foreground", value === v && "bg-surface text-foreground shadow-soft")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

const titles: Record<Page, string> = {
  dashboard: "سلام سارا",
  voucher: "سند تازه",
  documents: "اسناد",
  reports: "گزارش‌ها",
  calendar: "تقویم مالی",
  settings: "تنظیمات",
};

export function Topbar() {
  const { page, unit, setUnit, concept, setConcept, theme, setTheme, openPalette, setTour } = useApp();
  const hasTour = page === "dashboard" || page === "voucher";
  return (
    <header className="no-print flex flex-wrap items-center gap-3">
      <div className="min-w-[160px]">
        <h1 className="text-[22px] font-extrabold tracking-tight">{titles[page]}</h1>
        <p className="num text-[12.5px] text-muted-foreground">{fmtFull(TODAY.m, TODAY.d)} · آبان باز است</p>
      </div>

      <button
        data-tour="command"
        onClick={() => openPalette()}
        className="panel group flex h-11 min-w-[240px] flex-1 items-center gap-2.5 rounded-full px-4 text-start text-[13.5px] text-muted-foreground transition-shadow hover:shadow-lift"
      >
        <span className="ai-edge grid size-6 place-items-center rounded-full text-white"><Sparkles className="size-3.5" /></span>
        بپرسید یا بگویید چه کنم
        <Search className="ms-auto size-4 opacity-60" />
        <Kbd className="hidden sm:inline-flex">Ctrl K</Kbd>
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="واحد نمایش مبلغ" value={unit} onChange={setUnit} items={[["rial", "ریال"], ["toman", "تومان"]]} />
        <div data-tour="concept">
          <Segmented label="کانسپت" value={concept} onChange={setConcept} items={[["assist", "دستیار"], ["bento", "پیشخوان"]]} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "حالت روشن" : "حالت تیره"}
              className="panel grid size-10 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{theme === "dark" ? "حالت روشن" : "حالت تیره"}</TooltipContent>
        </Tooltip>
        {hasTour && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setTour(true)} aria-label="راهنمای این صفحه" className="panel grid size-10 place-items-center rounded-full text-muted-foreground hover:text-foreground">
                <CircleHelp className="size-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent>راهنمای این صفحه</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
