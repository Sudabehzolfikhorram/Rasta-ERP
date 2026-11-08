import { BarChart3, CalendarDays, FilePlus2, Files, House, Settings2 } from "lucide-react";
import { useApp, type Page } from "@/lib/store";
import { cn, toFa } from "@/lib/utils";
import { TODAY } from "@/lib/jalali";

type Item = { id: Page; label: string; icon: typeof House; count?: number };

export function Sidebar() {
  const { page, go, startVoucher, docs, events } = useApp();
  const pending = docs.filter((d) => d.status === "pending").length;
  const todayLeft = events.filter((e) => e.m === TODAY.m && e.d === TODAY.d && !e.done).length;
  const items: Item[] = [
    { id: "dashboard", label: "امروز", icon: House },
    { id: "documents", label: "اسناد", icon: Files, count: pending },
    { id: "reports", label: "گزارش‌ها", icon: BarChart3 },
    { id: "calendar", label: "تقویم", icon: CalendarDays, count: todayLeft },
  ];

  const NavBtn = ({ n }: { n: Item }) => {
    const active = n.id === page;
    return (
      <button
        onClick={() => go(n.id)}
        aria-current={active ? "page" : undefined}
        aria-label={n.label}
        className={cn(
          "relative flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground",
          active && "bg-primary-soft font-bold text-primary hover:bg-primary-soft hover:text-primary",
        )}
      >
        <n.icon className="size-5 shrink-0" strokeWidth={1.8} />
        <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">{n.label}</span>
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
        className="group/rail panel fixed bottom-4 start-4 top-4 z-40 hidden w-[68px] flex-col overflow-hidden px-2.5 py-4 transition-[width,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:w-[232px] hover:shadow-lift focus-within:w-[232px] md:flex"
        aria-label="منوی اصلی"
      >
        <div className="mb-6 flex items-center gap-3 px-1">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-[18px] font-black text-primary-foreground">ر</span>
          <div className="whitespace-nowrap leading-tight opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
            <div className="text-[16px] font-extrabold">راستا</div>
            <div className="num text-[11.5px] text-muted-foreground">سال مالی ۱۴۰۵</div>
          </div>
        </div>
        <button
          onClick={() => startVoucher()}
          aria-label="سند تازه"
          className={cn("ai-edge mb-4 flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-[14px] font-bold text-white shadow-soft transition-[filter] hover:brightness-110", page === "voucher" && "ring-2 ring-ai/40 ring-offset-2 ring-offset-transparent")}
        >
          <FilePlus2 className="size-5 shrink-0" strokeWidth={1.9} />
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">سند تازه</span>
        </button>
        <nav className="flex flex-col gap-1">
          {items.map((n) => <NavBtn key={n.id} n={n} />)}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <NavBtn n={{ id: "settings", label: "تنظیمات", icon: Settings2 }} />
          <div className="mt-2 flex items-center gap-3 px-1.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-[12.5px] font-bold shadow-soft">س</span>
            <div className="whitespace-nowrap leading-tight opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
              <div className="text-[13px] font-bold">سارا احمدی</div>
              <div className="text-[11.5px] text-muted-foreground">مدیر مالی</div>
            </div>
          </div>
        </div>
      </aside>

      {/* phones: bottom bar */}
      <nav aria-label="منوی اصلی" className="panel fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full px-2 py-1.5 md:hidden">
        {[items[0], items[1], { id: "voucher" as Page, label: "سند تازه", icon: FilePlus2 }, items[2], items[3]].map((n) => (
          <button key={n.id} onClick={() => (n.id === "voucher" ? startVoucher() : go(n.id))} aria-label={n.label} aria-current={page === n.id ? "page" : undefined}
            className={cn("grid size-11 place-items-center rounded-full text-muted-foreground", page === n.id && "bg-primary-soft text-primary", n.id === "voucher" && "ai-edge text-white")}>
            <n.icon className="size-5" />
          </button>
        ))}
      </nav>
    </>
  );
}
