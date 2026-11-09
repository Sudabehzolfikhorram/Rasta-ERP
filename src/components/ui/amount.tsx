import { cn, group, toEn, tomanWords } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Toman equivalent of a rial amount, as a short Persian line. */
export const tomanLine = (rial: number) => `معادل ${group(Math.round(rial / 10))} تومان`;

/* Every amount field in the system: typed and stored in rial. Under it, for reading ease,
   the same amount in toman, in digits and in Persian words. */
export function AmountInput({ value, onChange, label, className, inputClassName, autoFocus, hint = true, quiet, placeholder = "۰" }: {
  value: number; onChange: (rial: number) => void; label: string; className?: string; inputClassName?: string; autoFocus?: boolean; hint?: boolean; quiet?: boolean; placeholder?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div className="relative">
        <Input dir="ltr" inputMode="numeric" aria-label={label} autoFocus={autoFocus} placeholder={placeholder}
          value={value ? group(value) : ""}
          onChange={(e) => onChange(parseInt(toEn(e.target.value).replace(/[^\d]/g, "") || "0", 10))}
          className={cn("num pr-12 text-left font-bold", inputClassName)} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] text-muted-foreground">ریال</span>
      </div>
      {hint && (value ? (
        <span className="num flex min-w-0 flex-col text-[11.5px] leading-5" aria-live="polite">
          <span className="font-semibold text-primary">{group(Math.round(value / 10))} تومان</span>
          <span className="truncate text-muted-foreground" title={tomanWords(value)}>{tomanWords(value)}</span>
        </span>
      ) : !quiet && <span className="min-h-[16px] text-[11.5px] text-muted-foreground">مبلغ به ریال؛ معادل تومانی و به حروف این‌جا می‌آید</span>)}
    </div>
  );
}
