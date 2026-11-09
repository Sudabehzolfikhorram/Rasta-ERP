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
export function DataTable<T>({ columns, rows: all, rowKey, onRow, selected, empty, className, dense, caption, pageSize = 8 }: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; onRow?: (r: T) => void; selected?: (r: T) => boolean;
  empty?: React.ReactNode; className?: string; dense?: boolean; caption?: string; pageSize?: number;
}) {
  const pg = usePager(all.length, pageSize);
  const rows = all.slice(pg.from, pg.to);
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
      {!all.length && empty}
      <Pager {...pg} total={all.length} />
    </div>
  );
}

/** Page state that snaps back to the first page when the filtered row count changes. */
export function usePager(total: number, size: number) {
  const [page, setPage] = React.useState(0);
  const pages = Math.max(1, Math.ceil(total / size));
  React.useEffect(() => { setPage(0); }, [total]);
  const p = Math.min(page, pages - 1);
  return { page: p, pages, setPage, from: p * size, to: Math.min(total, (p + 1) * size) };
}

const fa = (n: number) => n.toLocaleString("fa-IR");
/** Footer pager: range text, previous/next and page numbers. Hidden when everything fits on one page. */
export function Pager({ page, pages, setPage, from, to, total }: { page: number; pages: number; setPage: (p: number) => void; from: number; to: number; total: number }) {
  if (pages < 2) return null;
  const nums = Array.from({ length: pages }, (_, i) => i).filter((i) => i === 0 || i === pages - 1 || Math.abs(i - page) <= 1);
  const btn = "grid h-8 min-w-8 place-items-center rounded-[10px] px-2 text-[12.5px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav className="flex flex-wrap items-center gap-2 border-t border-border/70 bg-muted/30 px-4 py-2.5" aria-label="صفحه‌بندی">
      <span className="text-[12px] text-muted-foreground">نمایش {fa(from + 1)} تا {fa(to)} از {fa(total)}</span>
      <div className="ms-auto flex items-center gap-1">
        <button className={cn(btn, "text-muted-foreground hover:bg-muted")} disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="صفحه‌ی قبل">قبلی</button>
        {nums.map((n, i) => (
          <React.Fragment key={n}>
            {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
            <button className={cn(btn, n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} aria-current={n === page ? "page" : undefined} onClick={() => setPage(n)}>{fa(n + 1)}</button>
          </React.Fragment>
        ))}
        <button className={cn(btn, "text-muted-foreground hover:bg-muted")} disabled={page === pages - 1} onClick={() => setPage(page + 1)} aria-label="صفحه‌ی بعد">بعدی</button>
      </div>
    </nav>
  );
}
