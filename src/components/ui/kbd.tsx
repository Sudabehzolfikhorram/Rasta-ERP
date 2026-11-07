import { cn } from "@/lib/utils";
export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <kbd dir="ltr" className={cn("inline-flex h-5 items-center rounded-md border border-border bg-surface-2 px-1.5 font-sans text-[11px] font-medium text-muted-foreground", className)} {...props} />;
}
