import { Bank } from "@/components/icons";
import { cn } from "@/lib/utils";

/* Bank logos from the project's Figma library, on a white tile so they read in both themes.
   Sizes stay between 48 and 56px (size-12 by default, size-14 for page headers).
   A bank without a logo file keeps the generic bank glyph. */
const FILES: [RegExp, string][] = [[/ملت/, "mellat.png"], [/پارسیان/, "parsian.svg"], [/تجارت/, "tejarat.png"], [/صادرات/, "saderat.svg"], [/ملی/, "melli.png"]];
const base = import.meta.env.BASE_URL;

/** Brand base colour of a bank (CSS var name), close to the bank's own identity. */
const BRAND: [RegExp, string][] = [[/ملت/, "--bank-mellat"], [/پارسیان/, "--bank-parsian"], [/ملی/, "--bank-melli"], [/تجارت/, "--bank-tejarat"], [/صادرات/, "--bank-saderat"], [/سامان/, "--bank-saman"], [/پاسارگاد/, "--bank-pasargad"], [/سپه/, "--bank-sepah"]];
export const bankColor = (name: string) => BRAND.find(([r]) => r.test(name))?.[1] ?? "--ch-1";

export function BankLogo({ name, className, icon = "size-1/2" }: { name: string; className?: string; icon?: string }) {
  const f = FILES.find(([r]) => r.test(name))?.[1];
  return (
    <span className={cn("grid size-12 shrink-0 place-items-center overflow-hidden rounded-[14px]", f ? "bg-white p-2 ring-1 ring-black/5" : "bg-primary-soft text-primary", className)}>
      {f ? <img src={`${base}banks/${f}`} alt="" width={56} height={56} className="size-full object-contain" loading="lazy" /> : <Bank className={icon} variant="Bulk" />}
    </span>
  );
}
