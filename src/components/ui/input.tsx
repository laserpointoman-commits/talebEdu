import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, dir, style, ...props }, ref) => {
    // Check if we're in RTL mode (Arabic)
    const isRTL = document.documentElement.dir === 'rtl';
    
    // Determine the styling based on RTL mode
    let inputStyle = { ...style };
    
    if (isRTL && !dir) {  // Only apply RTL styling if no explicit dir is set
      // In RTL mode, ALL fields should be right-aligned including email and date
      inputStyle = {
        textAlign: 'right' as const,
        direction: 'ltr' as const,
        unicodeBidi: 'plaintext' as const,
        ...style
      };
    } else if (dir === 'rtl') {
      // Explicitly RTL
      inputStyle = {
        direction: 'rtl' as const,
        textAlign: 'right' as const,
        ...style
      };
    } else if (dir === 'ltr') {
      // Explicitly LTR
      inputStyle = {
        direction: 'ltr' as const,
        textAlign: 'left' as const,
        ...style
      };
    }
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        dir={dir}
        style={inputStyle}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
