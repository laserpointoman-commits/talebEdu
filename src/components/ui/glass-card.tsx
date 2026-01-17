import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: "default" | "subtle" | "intense" | "gradient";
  hover?: boolean;
  glow?: boolean;
  children?: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", hover = true, glow = false, children, ...props }, ref) => {
    const variants = {
      default: "bg-card/90 backdrop-blur-md border border-border/40 shadow-md",
      subtle: "bg-card/80 backdrop-blur-sm border border-border/30 shadow-sm",
      intense: "bg-card/95 backdrop-blur-lg border border-border/50 shadow-lg",
      gradient: "bg-gradient-to-br from-card/90 via-card/85 to-card/80 backdrop-blur-md border border-border/40 shadow-md",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl",
          variants[variant],
          hover && "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20",
          glow && "shadow-glow-sm hover:shadow-glow",
          className
        )}
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";

interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const GlassCardHeader = React.forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-5", className)}
      {...props}
    />
  )
);
GlassCardHeader.displayName = "GlassCardHeader";

interface GlassCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const GlassCardTitle = React.forwardRef<HTMLParagraphElement, GlassCardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
GlassCardTitle.displayName = "GlassCardTitle";

interface GlassCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const GlassCardContent = React.forwardRef<HTMLDivElement, GlassCardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  )
);
GlassCardContent.displayName = "GlassCardContent";

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent };
