import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

/**
 * Light/Dark theme toggle. Persists in localStorage and toggles the `dark` class on <html>.
 */
export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
      className={cn(
        "rounded-full text-foreground/70 hover:text-foreground transition-colors",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        className,
      )}
    >
      {isDark ? <Sun className="h-[1.1rem] w-[1.1rem]" /> : <Moon className="h-[1.1rem] w-[1.1rem]" />}
    </Button>
  );
}

export default ThemeToggle;