import * as React from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  label: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
  /** hide below this breakpoint to keep phones readable */
  hide?: "sm" | "md" | "lg";
  render: (row: T, i: number) => React.ReactNode;
};
const hideCls = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };
const alignCls = { start: "text-start", end: "text-end", center: "text-center" };

/** Shared table: quiet header band, roomy rows, hover and selection tint, numbers in tabular digits. */
export function DataTable<T>({ columns, rows, rowKey, onRow, selected, empty, className, dense, caption }: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; onRow?: (r: T) => void; selected?: (r: T) => boolean;
  empty?: React.ReactNode; className?: string; dense?: boolean; caption?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[calc(var(--r-field)+4px)] border border-border bg-surface/70", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="bg-muted/60">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("whitespace-nowrap px-4 py-2.5 text-[12px] font-semibold text-muted-foreground first:ps-5 last:pe-5", alignCls[c.align ?? "start"], c.hide && hideCls[c.hide], c.className)}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={rowKey(r)} onClick={onRow ? () => onRow(r) : undefined}
                className={cn("border-t border-border/70 transition-colors", onRow && "cursor-pointer hover:bg-primary-soft/40", selected?.(r) && "bg-primary-soft/50")}>
                {columns.map((c) => (
                  <td key={c.key} className={cn("num px-4 first:ps-5 last:pe-5", dense ? "py-2.5" : "py-3.5", alignCls[c.align ?? "start"], c.hide && hideCls[c.hide], c.className)}>{c.render(r, i)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && empty}
    </div>
  );
}
