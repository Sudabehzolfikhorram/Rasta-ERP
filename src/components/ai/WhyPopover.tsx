import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, Info } from "@/components/icons";
import { Orb } from "@/components/ai/Orb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function WhyPopover({ title, line, parts, className }: { title: string; line: string; parts: readonly (readonly [string, string])[]; className?: string }) {
  const { go } = useApp();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label={`توضیح تغییر ${title}`} title="این عدد از کجا آمد؟" className={cn("grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-ai-soft hover:text-ai-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai", className)}>
          <Info className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[330px]">
        <div className="flex items-center gap-2 text-[12px] font-bold text-ai-ink">
          <Orb size={20} />
          {title}
        </div>
        <p className="mt-2 text-[14.5px] font-semibold leading-7">{line}</p>
        <ul className="mt-3 divide-y divide-border rounded-field border border-border">
          {parts.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between px-3 py-2 text-[13px]">
              <span>{k}</span>
              <span className={cn("num inline-flex items-center gap-0.5 font-bold", v.startsWith("+") ? "text-success" : "text-danger")}>
                {v.startsWith("+") ? <ArrowUpLeft className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}{v.replace(/^[+−-]/, "")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11.5px] text-muted-foreground">از اسناد تأییدشده‌ی آبان</p>
        <Button size="sm" variant="soft" className="mt-3 w-full" onClick={() => go("documents")}>اسناد مرتبط <ArrowLeft /></Button>
      </PopoverContent>
    </Popover>
  );
}
