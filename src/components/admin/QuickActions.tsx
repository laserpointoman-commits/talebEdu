import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuickActionPreferences } from '@/hooks/use-quick-action-preferences';
import { CustomizeQuickActionsDialog } from './CustomizeQuickActionsDialog';
import { GlassCard, GlassCardContent, GlassCardHeader } from '@/components/ui/glass-card';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const colorClasses = [
  'from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400',
  'from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400',
  'from-purple-500/20 to-purple-600/10 text-purple-600 dark:text-purple-400',
  'from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400',
  'from-cyan-500/20 to-cyan-600/10 text-cyan-600 dark:text-cyan-400',
  'from-rose-500/20 to-rose-600/10 text-rose-600 dark:text-rose-400',
  'from-indigo-500/20 to-indigo-600/10 text-indigo-600 dark:text-indigo-400',
  'from-teal-500/20 to-teal-600/10 text-teal-600 dark:text-teal-400',
];

const QuickActionButton = memo(({ 
  action, 
  index, 
  onClick, 
  t 
}: { 
  action: any; 
  index: number; 
  onClick: () => void;
  t: (key: string) => string;
}) => {
  const Icon = (Icons as any)[action.icon] || Icons.Home;
  const colorClass = colorClasses[index % colorClasses.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <Button
        variant="ghost"
        className={cn(
          "h-auto w-full flex-col gap-2 p-4 rounded-2xl",
          "bg-gradient-to-br backdrop-blur-sm",
          "border border-white/20 dark:border-white/10",
          "hover:scale-105 hover:shadow-lg active:scale-95",
          "transition-all duration-200",
          colorClass
        )}
        onClick={onClick}
      >
        <div className="p-3 rounded-xl bg-white/50 dark:bg-white/10 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-xs text-center font-medium text-foreground/80 line-clamp-2">
          {t(action.title)}
        </span>
      </Button>
    </motion.div>
  );
});

QuickActionButton.displayName = 'QuickActionButton';

export const QuickActions = memo(function QuickActions() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { visibleActions, isLoading } = useQuickActionPreferences();

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <CustomizeQuickActionsDialog />
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="h-24 bg-muted/50 animate-pulse rounded-2xl" 
              />
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="subtle">
      <GlassCardHeader className="flex flex-row items-center justify-end space-y-0 pb-3">
        <CustomizeQuickActionsDialog />
      </GlassCardHeader>
      <GlassCardContent>
        {visibleActions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icons.LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{t('No quick actions visible')}</p>
            <p className="text-sm mt-1">{t('Click Customize to show actions')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {visibleActions.map((action, index) => (
              <QuickActionButton
                key={action.id}
                action={action}
                index={index}
                onClick={() => navigate(action.href)}
                t={t}
              />
            ))}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
});
