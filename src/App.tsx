import * as React from "react";
import { AppProvider, useApp } from "@/lib/store";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { CommandPalette } from "@/components/ai/CommandPalette";
import { Tour } from "@/components/tour/Tour";
import { Toasts } from "@/components/shell/Toasts";
import { Dashboard } from "@/pages/Dashboard";
import { Voucher } from "@/pages/Voucher";

function Shell() {
  const { page, openPalette } = useApp();
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  return (
    <div className="field min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 p-4 lg:p-5">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col gap-5">
          <Topbar />
          {page === "dashboard" ? <Dashboard /> : <Voucher />}
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
