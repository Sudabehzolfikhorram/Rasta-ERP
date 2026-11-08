import * as React from "react";
import { AppProvider, useApp } from "@/lib/store";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { CommandPalette } from "@/components/ai/CommandPalette";
import { Tour } from "@/components/tour/Tour";
import { Toasts } from "@/components/shell/Toasts";
import { Dashboard } from "@/pages/Dashboard";
import { Voucher } from "@/pages/Voucher";
import { Documents } from "@/pages/Documents";
import { Reports } from "@/pages/Reports";
import { Calendar } from "@/pages/Calendar";
import { Settings } from "@/pages/Settings";
import { Profile } from "@/pages/Profile";
import { DocDetail } from "@/pages/DocDetail";
import { Background } from "@/components/shell/Background";

function Shell() {
  const { page, openPalette, voucherSeed, reportSeed, calDay, docId, concept } = useApp();
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative mx-auto flex min-h-screen max-w-[1680px] gap-5 p-4 pb-24 md:pb-5 lg:p-5">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col gap-5">
          <Topbar />
          <div key={`${page}-${concept}`} className="flex min-w-0 flex-col gap-5 animate-rise">
            {page === "dashboard" && <Dashboard />}
            {page === "voucher" && <Voucher key={`${voucherSeed?.n ?? 0}-${concept}`} />}
            {page === "documents" && <Documents />}
            {page === "reports" && <Reports key={reportSeed ?? ""} />}
            {page === "calendar" && <Calendar key={calDay ? `${calDay.m}-${calDay.d}` : ""} />}
            {page === "doc" && <DocDetail key={docId ?? ""} />}
            {page === "settings" && <Settings />}
            {page === "profile" && <Profile />}
          </div>
        </main>
      </div>
      <CommandPalette />
      <Tour />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
