import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const src = (name: string, dark: boolean) => `${import.meta.env.BASE_URL}brand/${name}${dark ? "-light" : ""}.png`;

/** Rasta brand: the emblem and the wordmark from the brand file. In dark mode a light tint keeps both readable. */
export function Logo({ part, className }: { part: "emblem" | "wordmark"; className?: string }) {
  const { theme } = useApp();
  return <img src={src(part, theme === "dark")} alt={part === "wordmark" ? "راستا" : ""} aria-hidden={part === "emblem" || undefined} draggable={false} className={cn("select-none object-contain", className)} />;
}
