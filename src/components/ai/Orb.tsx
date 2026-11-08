import { cn } from "@/lib/utils";

/** The AI mark: a frosted glass bead with a slowly turning iridescent rim. `busy` speeds it up while work runs. */
export function Orb({ size = 28, busy, className, label }: { size?: number; busy?: boolean; className?: string; label?: string }) {
  return (
    <span
      className={cn("orb", className)}
      data-busy={busy ? "true" : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ width: size, height: size, ["--orb-rim" as string]: `${Math.max(1.5, size / 22)}px` }}
    >
      <span className="core" />
    </span>
  );
}
