import { ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  className?: string;     // applied to td
  headerClassName?: string;
  align?: "start" | "center" | "end";
  mono?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterFn?: (row: T, query: string) => boolean;
  emptyState?: ReactNode;
  className?: string;
  density?: "compact" | "comfortable";
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
}

/**
 * Lightweight, dependency-free data table:
 * - Sortable columns
 * - Optional client-side search
 * - Sticky header
 * - Tabular-nums for numeric columns
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchable = false,
  searchPlaceholder = "بحث...",
  filterFn,
  emptyState,
  className,
  density = "compact",
  stickyHeader = true,
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const filtered = useMemo(() => {
    if (!query || !searchable) return rows;
    if (filterFn) return rows.filter((r) => filterFn(r, query));
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = c.sortValue ? c.sortValue(r) : c.accessor(r);
        return String(v ?? "").toLowerCase().includes(q);
      }),
    );
  }, [rows, query, columns, filterFn, searchable]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const sortFn = col.sortValue;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sortFn(a);
      const bv = sortFn(b);
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }, [filtered, sort, columns]);

  const cellPad = density === "compact" ? "px-3 py-2" : "px-4 py-3";

  function toggleSort(key: string, sortable?: boolean) {
    if (!sortable) return;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-card overflow-hidden", className)}>
      {searchable && (
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <span className="text-[11px] font-mono-tech text-muted-foreground">{sorted.length}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            <tr className="bg-muted/50 text-muted-foreground">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const Icon = !active ? ChevronsUpDown : sort?.dir === "asc" ? ChevronUp : ChevronDown;
                const align =
                  c.align === "center" ? "text-center" : c.align === "end" ? "text-end" : "text-start";
                return (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key, c.sortable)}
                    className={cn(
                      cellPad,
                      align,
                      "text-[11px] font-semibold uppercase tracking-wider",
                      c.sortable && "cursor-pointer select-none hover:text-foreground",
                      c.headerClassName,
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable && <Icon className="h-3 w-3 opacity-60" />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyState ?? "لا توجد بيانات"}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-t border-border/40 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/40",
                  )}
                >
                  {columns.map((c) => {
                    const align =
                      c.align === "center" ? "text-center" : c.align === "end" ? "text-end" : "text-start";
                    return (
                      <td
                        key={c.key}
                        className={cn(
                          cellPad,
                          align,
                          "text-foreground/90",
                          c.mono && "font-mono-tech",
                          c.className,
                        )}
                      >
                        {c.accessor(row)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;