import { Mic, Square, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { useVoice } from "@/lib/voice";

type Voice = ReturnType<typeof useVoice>;

/** Live recording strip: real mic level, the words as they are recognised, stop and cancel. */
export function VoiceBar({ voice, className }: { voice: Voice; className?: string }) {
  return (
    <div className={cn("flex min-h-[52px] w-full items-center gap-3 rounded-[calc(var(--r-field)+2px)] bg-ai-soft/60 px-3 py-2 text-ai-ink", className)} aria-live="polite">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-danger text-white">
        <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" />
        <Mic className="relative size-4" />
      </span>
      <span className="flex h-7 shrink-0 items-center gap-[3px]" aria-hidden>
        {voice.levels.map((l, i) => <i key={i} className="block w-[3px] rounded-full bg-current transition-[height] duration-75" style={{ height: `${Math.round(l * 100)}%` }} />)}
      </span>
      {voice.test && <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-bold text-muted-foreground" title="میکروفون یا سرویس گفتار در دسترس نیست؛ یک جمله‌ی نمونه ضبط می‌شود">آزمایشی</span>}
      <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", voice.live ? "font-semibold text-foreground" : "text-muted-foreground")}>{voice.live || "بگویید؛ متن همین‌جا نوشته می‌شود…"}</span>
      <Button type="button" size="sm" variant="ghost" onClick={voice.cancel} aria-label="لغو ضبط"><X /></Button>
      <Button type="button" size="sm" onClick={voice.stop}><Square className="size-3.5" /> پایان</Button>
    </div>
  );
}

/** Mic button that starts recording. */
export function MicButton({ voice, className }: { voice: Voice; className?: string }) {
  return (
    <button type="button" aria-label="ضبط صدا" onClick={voice.start}
      className={cn("grid size-10 shrink-0 place-items-center rounded-field text-muted-foreground hover:bg-muted hover:text-foreground", className)}>
      <Mic className="size-5" />
    </button>
  );
}

/** Error line with an optional sample sentence, so the flow can still be tried. */
export function VoiceError({ voice, sample, onSample }: { voice: Voice; sample?: string; onSample?: (t: string) => void }) {
  if (!voice.error) return null;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground" role="status">
      <span>{voice.error}</span>
      {sample && onSample && <button type="button" className="font-bold text-primary hover:underline" onClick={() => { voice.clearError(); onSample(sample); }}>استفاده از جمله‌ی نمونه</button>}
    </p>
  );
}
