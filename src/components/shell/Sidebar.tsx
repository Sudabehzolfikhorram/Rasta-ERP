import { BarChart3, BookOpenText, House, Settings2, Sparkles } from "lucide-react";
import { useApp, type Page } from "@/lib/store";
import { cn, toFa } from "@/lib/utils";

const nav: { id: Page | "reports" | "settings"; label: string; icon: typeof House; badge?: number }[] = [
  { id: "dashboard", label: "امروز", icon: House, badge: 4 },
  { id: "voucher", label: "دفتر و اسناد", icon: BookOpenText },
  { id: "reports", label: "گزارش", icon: BarChart3 },
  { id: "settings", label: "تنظیمات", icon: Settings2 },
];

const agents = [
  { k: "ث", name: "ایجنت ثبت", note: "۲ پیش‌نویس" },
  { k: "ک", name: "ایجنت کنترل", note: "۲۳ بررسی" },
  { k: "ب", name: "بستن دوره", note: "٪۸۰" },
  { k: "ن", name: "نقدینگی", note: "فعال" },
  { k: "ت", name: "تقویم", note: "۲ مهلت" },
];

export function Sidebar() {
  const { page, go, toast } = useApp();
  return (
    <aside data-tour="nav" className="panel sticky top-5 hidden h-[calc(100vh-40px)] w-[232px] shrink-0 flex-col p-4 lg:flex">
      <div className="mb-7 flex items-center gap-2.5 px-2 pt-1">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-[17px] font-black text-primary-foreground">ر</span>
        <div className="leading-tight">
          <div className="text-[17px] font-extrabold">راستا</div>
          <div className="num text-[11px] text-muted-foreground">سال مالی ۱۴۰۵</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1" aria-label="منوی اصلی">
        {nav.map((n) => {
          const active = n.id === page;
          return (
            <button
              key={n.id}
              onClick={() => (n.id === "dashboard" || n.id === "voucher" ? go(n.id) : toast("این بخش در کانسپت بعدی ساخته می‌شود."))}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-full px-3.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-primary-soft font-bold text-primary hover:bg-primary-soft hover:text-primary",
              )}
            >
              <n.icon className="size-[18px]" strokeWidth={1.8} />
              {n.label}
              {n.badge ? <span className="ms-auto rounded-full bg-surface px-2 text-[11px] font-bold text-foreground shadow-soft">{toFa(n.badge)}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="mb-2 mt-8 flex items-center gap-1.5 px-3 text-[12px] font-semibold text-muted-foreground">
        <Sparkles className="size-3.5 text-ai" /> تیم ایجنت‌ها
      </div>
      <ul className="flex flex-col">
        {agents.map((a) => (
          <li key={a.k} className="flex h-9 items-center gap-2.5 px-3 text-[13px]">
            <span className="grid size-6 place-items-center rounded-lg bg-ai-soft text-[11px] font-bold text-ai-ink">{a.k}</span>
            {a.name}
            <span className="ms-auto text-[11.5px] text-muted-foreground">{a.note}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center gap-2.5 rounded-2xl bg-muted/70 p-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-surface text-[13px] font-bold shadow-soft">م</span>
        <div className="leading-tight">
          <div className="text-[13px] font-bold">مدیر کل</div>
          <div className="text-[11.5px] text-muted-foreground">داده‌ی نمونه</div>
        </div>
      </div>
    </aside>
  );
}
