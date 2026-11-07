import { CheckCircle2, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-5 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl border border-border bg-popover px-4 py-3 text-[13.5px] shadow-lift animate-in fade-in-0 slide-in-from-bottom-2">
          {t.tone === "ai" ? <Sparkles className="size-4 text-ai" /> : <CheckCircle2 className="size-4 text-success" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
