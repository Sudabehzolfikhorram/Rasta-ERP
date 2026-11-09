import { Bank } from "@/components/icons";
import { cn } from "@/lib/utils";

/* Bank logos (from the MIT-licensed react-iranian-bank-logo set) on a white tile, so they read in both themes.
   A bank without a logo file keeps the generic bank glyph. */
const FILES: [RegExp, string][] = [[/ملت/, "mellat"], [/پارسیان/, "parsian"], [/ملی/, "melli"]];
const base = import.meta.env.BASE_URL;

export function BankLogo({ name, className, icon = "size-1/2" }: { name: string; className?: string; icon?: string }) {
  const f = FILES.find(([r]) => r.test(name))?.[1];
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-[12px]", f ? "bg-white p-[14%] ring-1 ring-black/5" : "bg-primary-soft text-primary", className)}>
      {f ? <img src={`${base}banks/${f}.svg`} alt="" className="size-full object-contain" loading="lazy" /> : <Bank className={icon} variant="Bulk" />}
    </span>
  );
}
