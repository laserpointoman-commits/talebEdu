import { cn } from "@/lib/utils";

type Tone = "success" | "sky" | "warning" | "danger";

interface LiveBadgeProps {
  label?: string;
  tone?: Tone;
  className?: string;
}

/**
 * Small live indicator with a CSS-only pulsing dot.
 * Use for "real-time" / "online" / "tracking" states.
 */
export function LiveBadge({ label = "مباشر", tone = "success", className }: LiveBadgeProps) {
  const dotClass =
    tone === "sky"
      ? "is-sky"
      : tone === "warning"
        ? "is-warning"
        : tone === "danger"
          ? "is-danger"
          : "";

  const textClass =
    tone === "sky"
      ? "text-primary"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-success";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur",
        textClass,
        className,
      )}
    >
      <span className={cn("ui-live-dot", dotClass)} />
      <span className="leading-none">{label}</span>
    </span>
  );
}

export default LiveBadge;