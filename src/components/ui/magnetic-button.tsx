import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useMagneticHover } from "@/hooks/use-magnetic-hover";
import { cn } from "@/lib/utils";

export interface MagneticButtonProps extends ButtonProps {
  magneticStrength?: number;
  magneticRadius?: number;
}

const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ className, magneticStrength = 0.3, magneticRadius = 120, ...props }, forwardedRef) => {
    const magneticRef = useMagneticHover({ 
      strength: magneticStrength, 
      radius: magneticRadius 
    });

    return (
      <Button
        ref={(node) => {
          // Handle both refs
          if (node) {
            (magneticRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          }
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        className={cn("transition-transform duration-300 ease-out", className)}
        {...props}
      />
    );
  }
);

MagneticButton.displayName = "MagneticButton";

export { MagneticButton };
