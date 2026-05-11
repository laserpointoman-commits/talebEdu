import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type Variant = "compact" | "standard" | "hero";
type Surface = "default" | "glass" | "editorial";

interface KPICardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number;            // percentage change, e.g. 12 or -3.4
  deltaLabel?: string;       // e.g. "vs أمس"
  icon?: ReactNode;
  variant?: Variant;
  surface?: Surface;
  className?: string;
  children?: ReactNode;       // optional sparkline / extra slot
}

/**
 * KPI card — used across Super Admin / School Admin dashboards.
 * Surface controls the visual personality (glass, editorial, default).
 */
export function KPICard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon,
  variant = "standard",
  surface = "default",
  className,
  children,
}: KPICardProps) {
  const sizes = {
    compact: { wrap: "p-3", value: "text-xl", label: "text-[11px]" },
    standard: { wrap: "p-4", value: "text-2xl", label: "text-xs" },
    hero: { wrap: "p-5", value: "text-4xl", label: "text-sm" },
  }[variant];

  const surfaceClass =
    surface === "glass"
      ? "ui-glass-card"
      : surface === "editorial"
        ? "rounded-2xl bg-card shadow-card"
        : "rounded-2xl border border-border bg-card shadow-card";

  const deltaTone =
    delta === undefined || delta === 0
      ? "text-muted-foreground"
      : delta > 0
        ? "text-success"
        : "text-destructive";

  const DeltaIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={cn(surfaceClass, "ui-hover-lift", sizes.wrap, className)}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("font-medium uppercase tracking-wide text-muted-foreground", sizes.label)}>
          {label}
        </span>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={cn("font-mono-tech font-semibold text-foreground", sizes.value)}>{value}</span>
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </div>
      {(delta !== undefined || deltaLabel) && (
        <div className={cn("mt-2 inline-flex items-center gap-1 text-[11px] font-medium", deltaTone)}>
          <DeltaIcon className="h-3 w-3" />
          {delta !== undefined && (
            <span className="font-mono-tech">
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          )}
          {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
        </div>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default KPICard;