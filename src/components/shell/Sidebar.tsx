import { Bank, BarChart3, CalendarDays, Files, House, MagicStar, Settings2, type IconType } from "@/components/icons";
import { useApp, type Page } from "@/lib/store";
import { baseSections, docCats } from "@/data/demo";
import { cn, toFa } from "@/lib/utils";
import { TODAY } from "@/lib/jalali";
import { Logo } from "./Logo";

type Item = { id: Page; label: string; icon: IconType; count?: number };
const reveal = "whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100";

export function Sidebar() {
  const { page, go, docs, events, docCat, setDocCat, baseTab, setBaseTab, openAssistant } = useApp();
  const pending = docs.filter((d) => d.status === "pending").length;
  const todayLeft = events.filter((e) => e.m === TODAY.m && e.d === TODAY.d && !e.done).length;
  const items: Item[] = [
    { id: "dashboard", label: "داشبورد", icon: House },
    { id: "assistant", label: "دستیار هوشمند", icon: MagicStar },
    { id: "documents", label: "اسناد", icon: Files, count: pending },
    { id: "reports", label: "گزارش‌ها", icon: BarChart3 },
    { id: "calendar", label: "تقویم", icon: CalendarDays, count: todayLeft },
    { id: "basedata", label: "اطلاعات پایه", icon: Bank },
  ];
  const isActive = (id: Page) => id === page || (id === "documents" && (page === "doc" || page === "voucher"));

  const navBtn = (n: Item) => {
    const active = isActive(n.id);
    return (
      <button
        onClick={() => (n.id === "assistant" ? openAssistant() : go(n.id))}
        aria-current={active ? "page" : undefined}
        aria-label={n.label}
        className={cn(
          "relative flex h-11 w-full items-center gap-3 rounded-field px-3 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground",
          active && "bg-primary-soft font-bold text-primary hover:bg-primary-soft hover:text-primary",
        )}
      >
        <n.icon className="size-[22px] shrink-0" variant={active ? "Bulk" : "Linear"} />
        <span className={reveal}>{n.label}</span>
        {n.count ? (
          <span className="num absolute start-7 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground transition-all group-hover/rail:static group-hover/rail:ms-auto group-hover/rail:h-5 group-hover/rail:min-w-5 group-focus-within/rail:static group-focus-within/rail:ms-auto">
            {toFa(n.count)}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <>
      {/* desktop: a slim rail that opens over the page on hover or keyboard focus */}
      <div className="hidden w-[68px] shrink-0 md:block" aria-hidden />
      <aside
        data-tour="nav"
        className="group/rail panel fixed bottom-4 start-4 top-4 z-40 hidden w-[68px] flex-col overflow-y-auto overflow-x-hidden px-2.5 py-4 transition-[width,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:w-[240px] hover:shadow-lift focus-within:w-[240px] md:flex"
        aria-label="منوی اصلی"
      >
        <button onClick={() => go("dashboard")} className="mb-6 flex items-center gap-3 rounded-field text-start" aria-label="راستا، داشبورد">
          <span className="grid size-12 shrink-0 place-items-center"><Logo part="emblem" className="size-8" /></span>
          <span className={cn(reveal, "leading-tight")}>
            <b className="block text-[17px] font-extrabold">راستا</b>
            <span className="num block text-[11.5px] text-muted-foreground">سال مالی ۱۴۰۵</span>
          </span>
        </button>
        <nav className="flex flex-col gap-1">
          {items.map((n) => (
            <div key={n.id}>
              {navBtn(n)}
              {n.id === "documents" && (
                <ul className="ms-[22px] mt-0.5 hidden flex-col border-s border-border ps-2 group-hover/rail:flex group-focus-within/rail:flex" aria-label="دسته‌های اسناد">
                  {docCats.map((c) => {
                    const on = page === "documents" && docCat === c.id;
                    return (
                      <li key={c.id}>
                        <button onClick={() => setDocCat(c.id)} aria-current={on ? "page" : undefined}
                          className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-start text-[12.5px] text-muted-foreground hover:bg-muted/80 hover:text-foreground", on && "font-bold text-primary")}>
                          <span className="truncate">{c.short}</span>
                          <span className="num ms-auto text-[11px]">{toFa(c.id === "acc" ? docs.length : c.count)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {n.id === "basedata" && (
                <ul className="ms-[22px] mt-0.5 hidden flex-col border-s border-border ps-2 group-hover/rail:flex group-focus-within/rail:flex" aria-label="بخش‌های اطلاعات پایه">
                  {baseSections.map((c) => {
                    const on = page === "basedata" && baseTab === c.id;
                    return (
                      <li key={c.id}>
                        <button onClick={() => setBaseTab(c.id)} aria-current={on ? "page" : undefined}
                          className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-start text-[12.5px] text-muted-foreground hover:bg-muted/80 hover:text-foreground", on && "font-bold text-primary")}>
                          <span className="truncate">{c.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 pt-4">
          {navBtn({ id: "settings", label: "تنظیمات", icon: Settings2 })}
          <button onClick={() => go("profile")} aria-label="حساب کاربری" className={cn("mt-2 flex items-center gap-3 rounded-field px-1.5 py-1 text-start hover:bg-muted/70", page === "profile" && "bg-primary-soft")}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-[12.5px] font-bold shadow-soft">س</span>
            <div className={cn(reveal, "leading-tight")}>
              <div className="text-[13px] font-bold">سارا احمدی</div>
              <div className="text-[11.5px] text-muted-foreground">مدیر مالی</div>
            </div>
          </button>
        </div>
      </aside>

      {/* phones: bottom bar */}
      <nav aria-label="منوی اصلی" className="panel fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full px-2 py-1.5 md:hidden">
        {[items[0], items[2], items[1], items[3], items[4]].map((n) => {
          const active = isActive(n.id);
          return (
            <button key={n.id} onClick={() => (n.id === "assistant" ? openAssistant() : go(n.id))} aria-label={n.label} aria-current={active ? "page" : undefined}
              className={cn("grid size-11 place-items-center rounded-full text-muted-foreground", active && "bg-primary-soft text-primary", n.id === "assistant" && "ai-edge text-white")}>
              <n.icon className="size-[22px]" variant={active || n.id === "assistant" ? "Bulk" : "Linear"} />
            </button>
          );
        })}
      </nav>
    </>
  );
}
