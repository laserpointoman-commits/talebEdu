import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, dir, style, ...props }, ref) => {
  // Check if we're in RTL mode (Arabic)
  const isRTL = document.documentElement.dir === 'rtl';
  
  // For RTL mode, we want the field aligned right but text input as auto
  const textareaStyle = isRTL && dir !== 'ltr' ? {
    textAlign: 'right' as const,
    direction: 'ltr' as const,
    unicodeBidi: 'plaintext' as const,
    ...style
  } : style;
  
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      dir={dir}
      style={textareaStyle}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
