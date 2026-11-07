import * as React from "react";
import type { Unit } from "./utils";

export type Concept = "calm" | "glass";
export type Page = "dashboard" | "voucher";
export type Pinned = { id: string; title: string; rows: [string, string][]; note: string };
type Toast = { id: number; text: string; tone?: "success" | "ai" };

type Ctx = {
  concept: Concept; setConcept: (c: Concept) => void;
  page: Page; go: (p: Page) => void;
  unit: Unit; setUnit: (u: Unit) => void;
  paletteOpen: boolean; setPaletteOpen: (o: boolean) => void;
  paletteSeed: string; openPalette: (seed?: string) => void;
  tour: boolean; setTour: (o: boolean) => void;
  pinned: Pinned[]; pin: (p: Pinned) => void; unpin: (id: string) => void;
  toasts: Toast[]; toast: (text: string, tone?: Toast["tone"]) => void;
  voucherSeed: string | null; startVoucher: (sentence?: string) => void;
};

const AppCtx = React.createContext<Ctx | null>(null);
export const useApp = () => React.useContext(AppCtx)!;

function readHash(): { concept: Concept; page: Page } {
  const h = new URLSearchParams(location.hash.slice(1));
  return {
    concept: h.get("concept") === "glass" ? "glass" : "calm",
    page: h.get("page") === "voucher" ? "voucher" : "dashboard",
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const init = readHash();
  const [concept, setConcept] = React.useState<Concept>(init.concept);
  const [page, setPage] = React.useState<Page>(init.page);
  const [unit, setUnit] = React.useState<Unit>("rial");
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [paletteSeed, setPaletteSeed] = React.useState("");
  const [tour, setTour] = React.useState(false);
  const [pinned, setPinned] = React.useState<Pinned[]>([]);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [voucherSeed, setVoucherSeed] = React.useState<string | null>(null);

  React.useEffect(() => {
    document.documentElement.dataset.concept = concept;
    history.replaceState(null, "", `#concept=${concept}&page=${page}`);
  }, [concept, page]);

  React.useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem("rasta-tour-seen") === "1"; } catch { /* storage blocked */ }
    if (!seen) setTimeout(() => setTour(true), 600);
  }, []);

  const toast = React.useCallback((text: string, tone?: Toast["tone"]) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const value: Ctx = {
    concept, setConcept,
    page, go: (p) => { setPage(p); window.scrollTo({ top: 0 }); },
    unit, setUnit,
    paletteOpen, setPaletteOpen,
    paletteSeed, openPalette: (seed = "") => { setPaletteSeed(seed); setPaletteOpen(true); },
    tour, setTour: (o) => { setTour(o); if (!o) { try { localStorage.setItem("rasta-tour-seen", "1"); } catch { /* ignore */ } } },
    pinned, pin: (p) => setPinned((x) => (x.some((y) => y.id === p.id) ? x : [p, ...x])), unpin: (id) => setPinned((x) => x.filter((y) => y.id !== id)),
    toasts, toast,
    voucherSeed, startVoucher: (s) => { setVoucherSeed(s ?? ""); setPage("voucher"); window.scrollTo({ top: 0 }); },
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
