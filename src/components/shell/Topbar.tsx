import { Bell, BellOff, CalendarClock, CheckCheck, CircleHelp, LogOut, Moon, Search, Settings2, ShieldCheck, Sun, UserRound } from "@/components/icons";
import { useApp, type NotifKind, type Page } from "@/lib/store";
import { companies } from "@/data/demo";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Orb } from "@/components/ai/Orb";
import { Logo } from "./Logo";
import { cn, toFa } from "@/lib/utils";

export function Segmented<T extends string>({ value, onChange, items, label, className }: { value: T; onChange: (v: T) => void; items: [T, string][]; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex rounded-[calc(var(--r-field)+4px)] bg-muted/80 p-1 text-[12.5px]", className)}>
      {items.map(([v, l]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn("h-7 whitespace-nowrap rounded-field px-3 font-semibold text-muted-foreground transition-colors hover:text-foreground", value === v && "bg-surface text-foreground shadow-soft")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

const titles: Record<Page, [string, string?]> = {
  dashboard: ["داشبورد"],
  voucher: ["سند جدید", "ثبت سند حسابداری"],
  documents: ["اسناد"],
  doc: ["جزئیات سند"],
  reports: ["گزارش‌ها"],
  calendar: ["تقویم مالی"],
  settings: ["تنظیمات"],
  profile: ["حساب کاربری و شرکت‌ها"],
  assistant: ["دستیار هوشمند", "گفت‌وگو، گزارش و ثبت سند با دستیار"],
  basedata: ["اطلاعات پایه", "بانک‌ها، حساب‌ها، صندوق‌ها و ارزها"],
};

const notifIcon: Record<NotifKind, typeof Bell> = { approve: CheckCheck, due: CalendarClock, ai: ShieldCheck, system: Settings2 };

function Notifications() {
  const { notifs, readNotif, go, openDoc } = useApp();
  const unread = notifs.filter((n) => !n.read).length;
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button aria-label={unread ? `اعلان‌ها، ${toFa(unread)} خوانده‌نشده` : "اعلان‌ها"} className="panel relative grid size-10 place-items-center rounded-field text-muted-foreground hover:text-foreground">
              <Bell className="size-[18px]" />
              {unread > 0 && <span className="num absolute -end-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{toFa(unread)}</span>}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>اعلان‌ها</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <b className="text-[14px]">اعلان‌ها</b>
          {unread > 0 && <button onClick={() => readNotif()} className="text-[12px] font-bold text-primary hover:underline">خواندن همه</button>}
        </div>
        {notifs.length ? (
          <ul className="max-h-[360px] overflow-auto py-1">
            {notifs.map((n) => {
              const I = notifIcon[n.kind];
              return (
                <li key={n.id}>
                  <button onClick={() => { readNotif(n.id); if (n.doc) openDoc(n.doc); else if (n.page) go(n.page); }}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-start transition-colors hover:bg-muted/70">
                    <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-field", n.kind === "approve" ? "bg-warning-soft text-warning" : n.kind === "due" ? "bg-info-soft text-info" : n.kind === "ai" ? "bg-ai-soft text-ai-ink" : "bg-muted text-muted-foreground")}><I className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[13px]", n.read ? "font-medium text-muted-foreground" : "font-bold")}>{n.title}</span>
                      <span className="num block truncate text-[12px] text-muted-foreground">{n.detail}</span>
                      <span className="num block text-[11px] text-muted-foreground">{n.when}</span>
                    </span>
                    {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="خوانده‌نشده" />}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground"><BellOff className="size-6" /><b className="text-[13px] text-foreground">اعلانی ندارید</b></div>
        )}
        <button onClick={() => go("settings")} className="w-full border-t border-border px-4 py-2.5 text-start text-[12.5px] font-semibold text-muted-foreground hover:text-foreground">تنظیم اعلان‌ها</button>
      </PopoverContent>
    </Popover>
  );
}

function ProfileMenu() {
  const { go, company, toast } = useApp();
  const c = companies.find((x) => x.id === company)!;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label="حساب کاربری" className="panel flex h-10 items-center gap-2 rounded-field pe-3 ps-1">
          <span className="grid size-8 place-items-center rounded-[calc(var(--r-field)-2px)] bg-primary-soft text-[13px] font-extrabold text-primary">س</span>
          <span className="hidden max-w-[120px] truncate text-[12.5px] font-bold lg:block">{c.name}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        <div className="px-3 py-2.5">
          <b className="block text-[14px]">سارا احمدی</b>
          <span className="text-[12px] text-muted-foreground">مدیر مالی · {c.name}</span>
        </div>
        <div className="my-1 h-px bg-border" />
        <button onClick={() => go("profile")} className="flex w-full items-center gap-2.5 rounded-field px-3 py-2 text-[13px] hover:bg-muted"><UserRound className="size-4 text-muted-foreground" /> حساب کاربری و شرکت‌ها</button>
        <button onClick={() => go("settings")} className="flex w-full items-center gap-2.5 rounded-field px-3 py-2 text-[13px] hover:bg-muted"><Settings2 className="size-4 text-muted-foreground" /> تنظیمات سیستم</button>
        <div className="my-1 h-px bg-border" />
        <button onClick={() => toast("در نسخه‌ی نمونه خروج غیرفعال است.")} className="flex w-full items-center gap-2.5 rounded-field px-3 py-2 text-[13px] text-danger hover:bg-danger-soft"><LogOut className="size-4" /> خروج</button>
      </PopoverContent>
    </Popover>
  );
}

export function Topbar() {
  const { page, unit, setUnit, concept, setConcept, theme, setTheme, openPalette, setTour } = useApp();
  const hasTour = page === "dashboard" || page === "voucher";
  const [title] = titles[page];
  return (
    <header className="no-print flex flex-wrap items-center gap-3">
      <div className="flex w-full items-center gap-2 md:hidden">
        <Logo part="emblem" className="size-8" />
        <Logo part="wordmark" className="h-5 w-auto" />
      </div>
      <h1 className="sr-only">{title}</h1>

      <button
        data-tour="command"
        onClick={() => openPalette()}
        className="panel group flex h-11 min-w-[240px] flex-1 items-center gap-2.5 rounded-[calc(var(--r-field)+2px)] px-3 text-start text-[13.5px] text-muted-foreground transition-shadow hover:shadow-lift"
      >
        <Orb size={24} />
        از دستیار بپرسید یا دستور بدهید
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
              className="panel grid size-10 place-items-center rounded-field text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{theme === "dark" ? "حالت روشن" : "حالت تیره"}</TooltipContent>
        </Tooltip>
        {hasTour && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setTour(true)} aria-label="راهنمای این صفحه" className="panel grid size-10 place-items-center rounded-field text-muted-foreground hover:text-foreground">
                <CircleHelp className="size-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent>راهنمای این صفحه</TooltipContent>
          </Tooltip>
        )}
        <Notifications />
        <ProfileMenu />
      </div>
    </header>
  );
}
