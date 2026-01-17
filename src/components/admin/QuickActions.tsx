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
  'bg-primary text-primary-foreground',
  'bg-success text-success-foreground',
  'bg-accent text-accent-foreground',
  'bg-warning text-warning-foreground',
  'bg-info text-info-foreground',
  'bg-destructive text-destructive-foreground',
  'bg-primary-dark text-primary-foreground',
  'bg-accent-dark text-accent-foreground',
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.03, 
        duration: 0.2,
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant="ghost"
        className={cn(
          "h-auto w-full flex-col gap-2 p-4 rounded-lg",
          "shadow-sm border border-transparent",
          "hover:shadow-md hover:border-border",
          "transition-all duration-200",
          colorClass
        )}
        onClick={onClick}
      >
        <div className="p-2.5 rounded-lg bg-white/20">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs text-center font-medium line-clamp-2">
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
