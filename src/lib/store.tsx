import * as React from "react";
import type { Unit } from "./utils";
import { companies, seedDocs, seedEvents, seedHistory, type CalEvent, type Doc, type DocEvent } from "@/data/demo";

export type Concept = "assist" | "bento";
export type Page = "dashboard" | "voucher" | "documents" | "doc" | "reports" | "calendar" | "settings" | "profile" | "assistant" | "basedata";
export type Theme = "light" | "dark";
export type Pinned = { id: string; title: string; rows: [string, string][]; note: string };
type Toast = { id: number; text: string; tone?: "success" | "ai" };
export type NotifKind = "approve" | "due" | "ai" | "system";
export type Channel = "app" | "email" | "sms";
export type Settings = {
  codeLen: [number, number, number]; approvalLimit: number; inputUnit: "toman" | "rial"; motion: boolean;
  calendars: { gregorian: boolean; hijri: boolean; holidays: boolean; weekStart: "sat" | "sun" };
  fiscalStart: number;
  reminders: { lead: number; digest: string; tax: boolean; cheque: boolean; loan: boolean; close: boolean };
  notify: Record<NotifKind, Record<Channel, boolean>>;
};

export type ChatMsg = { who: "me" | "ai"; text: string };
export type Chat = { id: string; title: string; when: string; scope: "home" | "reports" | "doc"; msgs: ChatMsg[] };
export type Notif = { id: string; kind: NotifKind; title: string; detail: string; when: string; read?: boolean; doc?: string; page?: Page };

const PAGES: Page[] = ["dashboard", "voucher", "documents", "doc", "reports", "calendar", "settings", "profile", "assistant", "basedata"];

export type WidgetDef = { id: string; title: string; desc: string };
export const WIDGETS: Record<Concept, WidgetDef[]> = {
  assist: [
    { id: "kpis", title: "شاخص‌های اصلی", desc: "نقد و بانک، دریافتنی، پرداختنی و سود با روند ۳۰ روز" },
    { id: "decisions", title: "کارهای منتظر اقدام", desc: "اسنادی که تأیید یا بررسی شما را لازم دارند" },
    { id: "agenda", title: "برنامه‌ی این هفته", desc: "سررسیدها و یادآوری‌های هفت روز پیش رو" },
    { id: "recent", title: "آخرین اسناد", desc: "پنج سند آخر با وضعیت و مبلغ" },
    { id: "cash", title: "پیش‌بینی نقدینگی", desc: "موجودی واقعی و پیش‌بینی ۲ هفته‌ی آینده" },
    { id: "approvals", title: "وضعیت اسناد آبان", desc: "سهم اسناد تأییدشده، منتظر و پیش‌نویس" },
    { id: "close", title: "چک‌لیست پایان دوره", desc: "کارهای باقی‌مانده برای بستن آبان" },
  ],
  bento: [
    { id: "stats", title: "شاخص‌های مالی", desc: "چهار کارت با هدف، مقایسه و روند" },
    { id: "cash", title: "موجودی نقد و بانک", desc: "موجودی واقعی و پیش‌بینی ۲ هفته‌ی آینده" },
    { id: "month", title: "تقویم آبان", desc: "روزهای سررسید و تعطیلات ماه" },
    { id: "flow", title: "گردش نقدی آبان", desc: "از موجودی اول ماه تا امروز، قدم‌به‌قدم" },
    { id: "spend", title: "ترکیب هزینه‌ها", desc: "سهم هر هزینه از کل هزینه‌های آبان" },
    { id: "aging", title: "سنی مطالبات", desc: "مطالبات هر مشتری بر اساس روزهای گذشته" },
    { id: "heat", title: "فعالیت ثبت سند", desc: "تعداد سند در هر روز هفته و هر هفته" },
    { id: "approvals", title: "وضعیت اسناد آبان", desc: "سهم اسناد تأییدشده، منتظر و پیش‌نویس" },
    { id: "recent", title: "آخرین اسناد", desc: "پنج سند آخر با وضعیت و مبلغ" },
    { id: "close", title: "چک‌لیست پایان دوره", desc: "کارهای باقی‌مانده برای بستن آبان" },
    { id: "decisions", title: "کارهای منتظر اقدام", desc: "اسنادی که تأیید یا بررسی شما را لازم دارند" },
  ],
};
const DEFAULT_WIDGETS: Record<Concept, string[]> = {
  assist: ["kpis", "decisions", "agenda", "recent", "cash"],
  bento: ["stats", "cash", "month", "flow", "spend", "aging", "recent", "approvals", "heat"],
};

const seedChats: Chat[] = [
  { id: "c-3", title: "چرا نقدینگی این هفته بالا رفت؟", when: "امروز ۰۸:۴۲", scope: "home", msgs: [
    { who: "me", text: "چرا نقدینگی این هفته بالا رفت؟" },
    { who: "ai", text: "بیشترِ افزایش از دریافت ۵ میلیارد ریالی پتروشیمی مارون است. در مقابل ۴ میلیارد به تکین‌کو پرداخت شد." },
  ] },
  { id: "c-2", title: "صورت‌حساب مهر برای مشتری‌های بدهکار", when: "دیروز", scope: "reports", msgs: [
    { who: "me", text: "صورت‌حساب مهر را آماده کن و برای مشتری‌های بدهکار بفرست" },
    { who: "ai", text: "صورت‌حساب ۴ مشتری ساخته و با ایمیل و پیامک فرستاده شد." },
  ] },
  { id: "c-1", title: "اجاره‌ی دفتر مرکزی آبان", when: "۱۲ آبان", scope: "home", msgs: [
    { who: "me", text: "اجاره‌ی آبان را از حساب ملت پرداخت کردیم" },
    { who: "ai", text: "سند پرداخت اجاره به مبلغ ۶۵۰ میلیون ریال ساخته و ثبت شد." },
  ] },
];

const seedNotifs: Notif[] = [
  { id: "n1", kind: "approve", title: "۲ سند منتظر تأیید شماست", detail: "دریافت از فولاد مبارکه و کارمزد بانکی", when: "۱۰ دقیقه پیش", page: "documents" },
  { id: "n2", kind: "due", title: "سررسید چک تکین‌کو امروز است", detail: "۱٫۲ میلیارد ریال از بانک ملت", when: "امروز ۰۸:۰۰", page: "calendar" },
  { id: "n3", kind: "ai", title: "احتمال ثبت تکراری", detail: "سند ۰۴۱ با سند ۰۳۶ هم‌مبلغ است", when: "دیروز", doc: "d41" },
  { id: "n4", kind: "system", title: "پشتیبان‌گیری شبانه انجام شد", detail: "همه‌ی داده‌های آبان ذخیره شد", when: "دیروز ۲۳:۰۰", read: true },
];

type Ctx = {
  concept: Concept; setConcept: (c: Concept) => void;
  theme: Theme; setTheme: (t: Theme) => void;
  page: Page; go: (p: Page) => void;
  unit: Unit; setUnit: (u: Unit) => void;
  paletteOpen: boolean; setPaletteOpen: (o: boolean) => void;
  paletteSeed: string; openPalette: (seed?: string) => void;
  tour: boolean; setTour: (o: boolean) => void;
  pinned: Pinned[]; pin: (p: Pinned) => void; unpin: (id: string) => void;
  toasts: Toast[]; toast: (text: string, tone?: Toast["tone"]) => void;
  voucherSeed: { text?: string; doc?: Doc; manual?: boolean; file?: File; n: number } | null;
  startVoucher: (seed?: { text?: string; doc?: Doc; manual?: boolean; file?: File }) => void;
  docs: Doc[]; saveDoc: (d: Doc, note?: string) => void; setDocStatus: (ids: string[], s: Doc["status"], note?: string) => void; nextSeq: () => number;
  docId: string | null; openDoc: (id: string) => void;
  events: CalEvent[]; addEvent: (e: CalEvent) => void; toggleEvent: (id: string) => void; removeEvent: (id: string) => void;
  calDay: { m: number; d: number } | null; openCalendar: (day?: { m: number; d: number }) => void;
  reportSeed: string | null; openReport: (id: string) => void;
  settings: Settings; setSettings: (s: Partial<Settings>) => void;
  chats: Chat[]; startChat: (scope: Chat["scope"], first: string) => string; addMsg: (id: string, m: ChatMsg) => void; removeChat: (id: string) => void;
  notifs: Notif[]; readNotif: (id?: string) => void;
  company: string; setCompany: (id: string) => void;
  widgets: string[]; setWidgets: (w: string[]) => void;
  chatSeed: { id?: string; ask?: string; n: number } | null; openAssistant: (seed?: { id?: string; ask?: string }) => void;
  docCat: string; setDocCat: (c: string) => void;
  baseTab: string; setBaseTab: (t: string) => void;
};

const AppCtx = React.createContext<Ctx | null>(null);
export const useApp = () => React.useContext(AppCtx)!;

function readHash(): { concept: Concept; page: Page; theme: Theme; doc: string | null } {
  const h = new URLSearchParams(location.hash.slice(1));
  const sys = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const t = h.get("theme");
  const p = h.get("page") as Page;
  const doc = h.get("doc");
  return {
    theme: t === "dark" || t === "light" ? t : sys,
    concept: h.get("concept") === "bento" ? "bento" : "assist",
    page: PAGES.includes(p) && (p !== "doc" || doc) ? p : "dashboard",
    doc,
  };
}

const now = () => { const d = new Date(); return `امروز ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`.replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[+c]); };
const stamp = () => `۱۷ آبان · ${now().replace("امروز ", "")}`;

function loadWidgets(): Record<Concept, string[]> {
  try {
    const raw = JSON.parse(localStorage.getItem("rasta-widgets-v5") ?? "null");
    if (raw && Array.isArray(raw.assist) && Array.isArray(raw.bento)) return raw;
  } catch { /* storage blocked */ }
  return DEFAULT_WIDGETS;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const init = React.useMemo(readHash, []);
  const [concept, setConcept] = React.useState<Concept>(init.concept);
  const [page, setPage] = React.useState<Page>(init.page);
  const [theme, setTheme] = React.useState<Theme>(init.theme);
  const [unit, setUnit] = React.useState<Unit>("rial");
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [paletteSeed, setPaletteSeed] = React.useState("");
  const [tour, setTourState] = React.useState(false);
  const [pinned, setPinned] = React.useState<Pinned[]>([]);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [voucherSeed, setVoucherSeed] = React.useState<Ctx["voucherSeed"]>(null);
  const [docs, setDocs] = React.useState<Doc[]>(() => seedDocs.map((d) => ({ ...d, history: seedHistory(d) })));
  const [docId, setDocId] = React.useState<string | null>(init.doc);
  const [chatSeed, setChatSeed] = React.useState<{ id?: string; ask?: string; n: number } | null>(null);
  const [docCat, setDocCat] = React.useState("acc");
  const [baseTab, setBaseTab] = React.useState("home");
  const [events, setEvents] = React.useState<CalEvent[]>(seedEvents);
  const [calDay, setCalDay] = React.useState<Ctx["calDay"]>(null);
  const [reportSeed, setReportSeed] = React.useState<string | null>(null);
  const [chats, setChats] = React.useState<Chat[]>(seedChats);
  const [notifs, setNotifs] = React.useState<Notif[]>(seedNotifs);
  const [company, setCompany] = React.useState(companies[0].id);
  const [widgetMap, setWidgetMap] = React.useState(loadWidgets);
  const [settings, setSettingsState] = React.useState<Settings>({
    codeLen: [1, 3, 6], approvalLimit: 500_000_000, inputUnit: "toman", motion: true,
    calendars: { gregorian: true, hijri: false, holidays: true, weekStart: "sat" },
    fiscalStart: 1,
    reminders: { lead: 1, digest: "۰۸:۰۰", tax: true, cheque: true, loan: true, close: true },
    notify: {
      approve: { app: true, email: true, sms: false },
      due: { app: true, email: false, sms: true },
      ai: { app: true, email: false, sms: false },
      system: { app: true, email: true, sms: false },
    },
  });

  React.useEffect(() => {
    const el = document.documentElement;
    el.dataset.concept = concept;
    el.dataset.theme = theme;
    el.dataset.motion = settings.motion ? "on" : "off";
    el.style.colorScheme = theme;
    history.replaceState(null, "", `#concept=${concept}&theme=${theme}&page=${page}${page === "doc" && docId ? `&doc=${docId}` : ""}`);
  }, [concept, theme, page, docId, settings.motion]);

  React.useEffect(() => {
    const onHash = () => { const h = readHash(); setPage(h.page); setConcept(h.concept); setTheme(h.theme); if (h.doc) setDocId(h.doc); };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem("rasta-tour-v4") === "1"; } catch { /* storage blocked */ }
    if (!seen && init.page === "dashboard") { const t = setTimeout(() => setTourState(true), 900); return () => clearTimeout(t); }
  }, [init.page]);

  const toast = React.useCallback((text: string, tone?: Toast["tone"]) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const go = React.useCallback((p: Page) => { setPage(p); window.scrollTo({ top: 0 }); }, []);
  const openPalette = React.useCallback((seed = "") => { setPaletteSeed(seed); setPaletteOpen(true); }, []);
  const setTour = React.useCallback((o: boolean) => {
    setTourState(o);
    if (!o) { try { localStorage.setItem("rasta-tour-v4", "1"); } catch { /* ignore */ } }
  }, []);

  const log = (d: Doc, e: Omit<DocEvent, "at">): Doc => ({ ...d, history: [...(d.history ?? []), { at: stamp(), ...e }] });

  const value: Ctx = {
    concept, setConcept,
    theme, setTheme,
    page, go,
    unit, setUnit,
    paletteOpen, setPaletteOpen,
    paletteSeed, openPalette,
    tour, setTour,
    pinned, pin: (p) => setPinned((x) => (x.some((y) => y.id === p.id) ? x : [p, ...x])), unpin: (id) => setPinned((x) => x.filter((y) => y.id !== id)),
    toasts, toast,
    voucherSeed,
    startVoucher: (s) => { setVoucherSeed({ ...(s ?? {}), n: Date.now() }); go("voucher"); },
    docs,
    saveDoc: (d, note) => setDocs((x) => {
      const old = x.find((y) => y.id === d.id);
      const base = { ...d, history: old?.history ?? d.history ?? [] };
      const text = note ?? (old ? "ویرایش شد" : d.status === "draft" ? "پیش‌نویس ذخیره شد" : d.status === "pending" ? "ثبت شد و برای تأیید رفت" : "ثبت شد");
      const next = log(base, { who: "سارا احمدی", text, tone: d.status === "pending" ? "warn" : "ok" });
      return old ? x.map((y) => (y.id === d.id ? { ...next, fresh: true } : { ...y, fresh: false })) : [{ ...next, fresh: true }, ...x.map((y) => ({ ...y, fresh: false }))];
    }),
    setDocStatus: (ids, s, note) => setDocs((x) => x.map((y) => (ids.includes(y.id) ? log({ ...y, status: s }, { who: "سارا احمدی", text: note ?? (s === "posted" ? "تأیید کرد" : s === "draft" ? "به پیش‌نویس برگرداند" : "برای تأیید فرستاد"), tone: s === "posted" ? "ok" : "warn" }) : y))),
    nextSeq: () => Math.max(...docs.map((d) => d.seq)) + 1,
    docId, openDoc: (id) => { setDocId(id); go("doc"); },
    events,
    addEvent: (e) => setEvents((x) => [...x, e]),
    toggleEvent: (id) => setEvents((x) => x.map((e) => (e.id === id ? { ...e, done: !e.done } : e))),
    removeEvent: (id) => setEvents((x) => x.filter((e) => e.id !== id)),
    calDay, openCalendar: (day) => { setCalDay(day ?? null); go("calendar"); },
    reportSeed, openReport: (id) => { setReportSeed(id); go("reports"); },
    settings, setSettings: (s) => setSettingsState((x) => ({ ...x, ...s })),
    chats,
    startChat: (scope, first) => {
      const id = `c${Date.now()}`;
      setChats((x) => [{ id, scope, title: first.length > 46 ? first.slice(0, 44) + "…" : first, when: now(), msgs: [{ who: "me", text: first }] }, ...x]);
      return id;
    },
    addMsg: (id, m) => setChats((x) => x.map((c) => (c.id === id ? { ...c, msgs: [...c.msgs, m] } : c))),
    removeChat: (id) => setChats((x) => x.filter((c) => c.id !== id)),
    notifs, readNotif: (id) => setNotifs((x) => x.map((n) => (!id || n.id === id ? { ...n, read: true } : n))),
    company, setCompany,
    chatSeed, openAssistant: (seed) => { setChatSeed({ ...(seed ?? {}), n: Date.now() }); go("assistant"); },
    docCat, setDocCat: (c) => { setDocCat(c); go("documents"); },
    baseTab, setBaseTab: (t) => { setBaseTab(t); go("basedata"); },
    widgets: widgetMap[concept],
    setWidgets: (w) => setWidgetMap((m) => {
      const next = { ...m, [concept]: w };
      try { localStorage.setItem("rasta-widgets-v5", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    }),
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export { DEFAULT_WIDGETS };
