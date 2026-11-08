import * as React from "react";
import type { Unit } from "./utils";
import { seedDocs, seedEvents, type CalEvent, type Doc } from "@/data/demo";

export type Concept = "assist" | "bento";
export type Page = "dashboard" | "voucher" | "documents" | "reports" | "calendar" | "settings";
export type Theme = "light" | "dark";
export type Pinned = { id: string; title: string; rows: [string, string][]; note: string };
type Toast = { id: number; text: string; tone?: "success" | "ai" };
export type Settings = { codeLen: [number, number, number]; approvalLimit: number; inputUnit: "toman" | "rial"; motion: boolean };

const PAGES: Page[] = ["dashboard", "voucher", "documents", "reports", "calendar", "settings"];

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
  /** what the voucher page should open with */
  voucherSeed: { text?: string; doc?: Doc; manual?: boolean; file?: boolean; n: number } | null;
  startVoucher: (seed?: { text?: string; doc?: Doc; manual?: boolean; file?: boolean }) => void;
  docs: Doc[]; saveDoc: (d: Doc) => void; setDocStatus: (ids: string[], s: Doc["status"]) => void; nextSeq: () => number;
  events: CalEvent[]; addEvent: (e: CalEvent) => void; toggleEvent: (id: string) => void;
  calDay: { m: number; d: number } | null; openCalendar: (day?: { m: number; d: number }) => void;
  reportSeed: string | null; openReport: (id: string) => void;
  settings: Settings; setSettings: (s: Partial<Settings>) => void;
};

const AppCtx = React.createContext<Ctx | null>(null);
export const useApp = () => React.useContext(AppCtx)!;

function readHash(): { concept: Concept; page: Page; theme: Theme } {
  const h = new URLSearchParams(location.hash.slice(1));
  const sys = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const t = h.get("theme");
  const p = h.get("page") as Page;
  return {
    theme: t === "dark" || t === "light" ? t : sys,
    concept: h.get("concept") === "bento" ? "bento" : "assist",
    page: PAGES.includes(p) ? p : "dashboard",
  };
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
  const [docs, setDocs] = React.useState<Doc[]>(seedDocs);
  const [events, setEvents] = React.useState<CalEvent[]>(seedEvents);
  const [calDay, setCalDay] = React.useState<Ctx["calDay"]>(null);
  const [reportSeed, setReportSeed] = React.useState<string | null>(null);
  const [settings, setSettingsState] = React.useState<Settings>({ codeLen: [1, 3, 6], approvalLimit: 500_000_000, inputUnit: "toman", motion: true });

  React.useEffect(() => {
    const el = document.documentElement;
    el.dataset.concept = concept;
    el.dataset.theme = theme;
    el.dataset.motion = settings.motion ? "on" : "off";
    el.style.colorScheme = theme;
    history.replaceState(null, "", `#concept=${concept}&theme=${theme}&page=${page}`);
  }, [concept, theme, page, settings.motion]);

  React.useEffect(() => {
    const onHash = () => { const h = readHash(); setPage(h.page); setConcept(h.concept); setTheme(h.theme); };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem("rasta-tour-v3") === "1"; } catch { /* storage blocked */ }
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
    if (!o) { try { localStorage.setItem("rasta-tour-v3", "1"); } catch { /* ignore */ } }
  }, []);

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
    saveDoc: (d) => setDocs((x) => [{ ...d, fresh: true }, ...x.filter((y) => y.id !== d.id).map((y) => ({ ...y, fresh: false }))]),
    setDocStatus: (ids, s) => setDocs((x) => x.map((y) => (ids.includes(y.id) ? { ...y, status: s } : y))),
    nextSeq: () => Math.max(...docs.map((d) => d.seq)) + 1,
    events,
    addEvent: (e) => setEvents((x) => [...x, e]),
    toggleEvent: (id) => setEvents((x) => x.map((e) => (e.id === id ? { ...e, done: !e.done } : e))),
    calDay, openCalendar: (day) => { setCalDay(day ?? null); go("calendar"); },
    reportSeed, openReport: (id) => { setReportSeed(id); go("reports"); },
    settings, setSettings: (s) => setSettingsState((x) => ({ ...x, ...s })),
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
