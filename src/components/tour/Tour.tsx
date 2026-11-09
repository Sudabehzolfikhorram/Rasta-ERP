import * as React from "react";
import { ArrowLeft, ArrowRight, X } from "@/components/icons";
import { useApp, type Page } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn, toFa } from "@/lib/utils";

type Step = { target: string; title: string; body: string };

const steps: Partial<Record<Page, Step[]>> = {
  dashboard: [
    { target: "hero", title: "دستیار، بخش اصلی داشبورد", body: "بپرسید یا رویداد مالی را بنویسید. گفت‌وگوهای قبلی کنار همین بخش ذخیره می‌ماند." },
    { target: "kpis", title: "شاخص‌ها با توضیح", body: "روی نمودار بروید تا عدد هر روز را ببینید. نماد i نشان می‌دهد عدد از کدام اسناد آمده است." },
    { target: "inbox", title: "کارهای منتظر اقدام", body: "دستیار پیش‌نویس و هشدار آماده می‌کند. هر ردیف فقط یک تصمیم از شما می‌خواهد." },
    { target: "command", title: "دسترسی سریع", body: "Ctrl K را بزنید: بپرسید، به صفحه‌ای بروید یا سند را در یک جمله بنویسید." },
    { target: "nav", title: "منوی اصلی", body: "نشانگر را روی منو ببرید تا باز شود. «سند جدید» همیشه بالای منوست." },
  ],
  voucher: [
    { target: "entry", title: "سه روش ثبت", body: "بنویسید، با صدا بگویید یا مدرک را بارگذاری کنید. دستیار فقط اطلاعات ناقص را می‌پرسد." },
    { target: "rail", title: "خلاصه‌ی سند", body: "هر اطلاعاتی که دستیار تشخیص می‌دهد اینجا ثبت می‌شود. برای تغییر، روی همان مورد بزنید." },
    { target: "guard", title: "بررسی سند", body: "پیش از ثبت، تراز، حساب‌ها، تکراری‌بودن و پیوست کنترل می‌شود." },
    { target: "command", title: "دسترسی سریع", body: "از هر صفحه با Ctrl K می‌توانید سند جدید بسازید." },
  ],
};

export function Tour() {
  const { tour, setTour, page } = useApp();
  const list = (steps[page] ?? []).filter((s) => typeof document === "undefined" || document.querySelector(`[data-tour="${s.target}"]`));
  const [i, setI] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { if (tour) setI(0); }, [tour, page]);

  const step = list[i];
  const measure = React.useCallback(() => {
    if (!tour || !step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) { setRect(null); return; }
    setRect(el.getBoundingClientRect());
  }, [tour, step]);

  React.useLayoutEffect(() => {
    if (!tour || !step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > innerHeight - 40) el.scrollIntoView({ block: "center" });
    }
    measure();
    addEventListener("resize", measure);
    addEventListener("scroll", measure, true);
    return () => { removeEventListener("resize", measure); removeEventListener("scroll", measure, true); };
  }, [tour, step, measure]);

  React.useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTour(false);
      if (e.key === "ArrowLeft") setI((x) => Math.min(x + 1, list.length - 1));
      if (e.key === "ArrowRight") setI((x) => Math.max(x - 1, 0));
    };
    addEventListener("keydown", onKey);
    cardRef.current?.focus();
    return () => removeEventListener("keydown", onKey);
  }, [tour, list.length, setTour, i]);

  if (!tour || !step) return null;
  const pad = 8;
  const hole = rect ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  // Place the card below the target when there is room, otherwise above; clamp horizontally.
  const cardW = 340;
  let top = 0, left = 0;
  if (hole) {
    const below = hole.top + hole.height + 12;
    top = below + 190 < innerHeight ? below : Math.max(12, hole.top - 12 - 190);
    left = Math.min(Math.max(12, hole.left + hole.width - cardW), innerWidth - cardW - 12);
  }
  const last = i === list.length - 1;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="تور راهنما">
      {hole && (
        <div
          className="pointer-events-none absolute rounded-[calc(var(--radius)+6px)] transition-[top,left,width,height] duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ ...hole, boxShadow: "0 0 0 9999px rgb(14 31 51 / 0.42), 0 0 0 2px hsl(var(--ai) / 0.9)" }}
        />
      )}
      <button aria-label="بستن تور" className="absolute inset-0 cursor-default" onClick={() => setTour(false)} />
      <div
        ref={cardRef}
        tabIndex={-1}
        className="absolute w-[340px] rounded-3xl border border-border bg-popover p-5 shadow-lift outline-none transition-[top,left] duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
        style={hole ? { top, left } : { top: "30%", left: "calc(50% - 170px)" }}
      >
        <div className="flex items-center justify-between">
          <span className="num text-[12px] font-semibold text-ai-ink">{toFa(i + 1)} از {toFa(list.length)}</span>
          <button aria-label="رد کردن تور" onClick={() => setTour(false)} className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>
        <h3 className="mt-2 text-[16px] font-extrabold">{step.title}</h3>
        <p className="mt-1.5 text-[13.5px] leading-7 text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex gap-1" aria-hidden>
            {list.map((_, k) => <span key={k} className={cn("h-1.5 rounded-full bg-border transition-all", k === i ? "w-5 bg-ai" : "w-1.5")} />)}
          </div>
          <div className="ms-auto flex gap-2">
            {i > 0 && <Button size="sm" variant="ghost" onClick={() => setI(i - 1)}><ArrowRight /> قبلی</Button>}
            <Button size="sm" onClick={() => (last ? setTour(false) : setI(i + 1))}>{last ? "فهمیدم" : <>بعدی <ArrowLeft /></>}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
