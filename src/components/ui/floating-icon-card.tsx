import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingIconCardProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  value?: string | number;
  valueLabel?: string;
  iconColor?: string;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  delay?: number;
}

const iconColors = [
  'text-primary',
  'text-emerald-500',
  'text-amber-500',
  'text-rose-500',
  'text-blue-500',
  'text-violet-500',
  'text-cyan-500',
  'text-orange-500',
  'text-pink-500',
  'text-teal-500',
  'text-indigo-500',
];

export function FloatingIconCard({
  icon: Icon,
  title,
  description,
  value,
  valueLabel,
  iconColor,
  onClick,
  className,
  children,
  delay = 0,
}: FloatingIconCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.2 }}
      whileHover={onClick ? { y: -3 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl p-4 transition-shadow",
        onClick && "cursor-pointer hover:shadow-lg",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Floating Icon */}
        <div className="w-14 h-14 rounded-2xl bg-background shadow-lg shadow-foreground/5 flex items-center justify-center shrink-0">
          <Icon className={cn("h-7 w-7", iconColor || 'text-primary')} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          )}
          {value !== undefined && (
            <div className="mt-2">
              <span className="text-xl font-bold">{value}</span>
              {valueLabel && (
                <span className="text-xs text-muted-foreground ml-1">{valueLabel}</span>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function FloatingIconButton({
  icon: Icon,
  label,
  iconColor,
  onClick,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  iconColor?: string;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.03, duration: 0.2 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 cursor-pointer group"
    >
      <div className="w-16 h-16 rounded-2xl bg-card shadow-lg shadow-foreground/5 group-hover:shadow-xl group-hover:shadow-foreground/10 transition-shadow flex items-center justify-center">
        <Icon className={cn("h-8 w-8", iconColor || 'text-primary')} />
      </div>
      <span className="text-xs text-center font-medium text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2 max-w-[80px]">
        {label}
      </span>
    </motion.button>
  );
}

export function getIconColor(index: number): string {
  return iconColors[index % iconColors.length];
}
