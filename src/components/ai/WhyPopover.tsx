import { ArrowLeft, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function WhyPopover({ title, line, parts }: { title: string; line: string; parts: readonly (readonly [string, string])[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="rounded-full border border-ai/25 bg-surface px-2.5 py-0.5 text-[11.5px] font-bold text-ai-ink transition-colors hover:bg-ai-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai">
          چرا؟
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px]">
        <div className="flex items-center gap-2 text-[12px] font-bold text-ai-ink">
          <span className="ai-edge grid size-5 place-items-center rounded-full text-white"><Sparkles className="size-3" /></span>
          ایجنت تحلیل‌گر · {title}
        </div>
        <p className="mt-2 text-[14.5px] font-semibold leading-7">{line}</p>
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {parts.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between px-3 py-2 text-[13px]">
              <span>{k}</span>
              <span className={`num font-bold ${v.startsWith("+") ? "text-success" : "text-danger"}`} dir="ltr">{v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11.5px] text-muted-foreground">بر اساس اسناد قطعی و تأییدشده‌ی آبان · داده‌ی آزمایشی</p>
        <Button size="sm" variant="soft" className="mt-3 w-full">دیدن اسناد مرتبط <ArrowLeft /></Button>
      </PopoverContent>
    </Popover>
  );
}
