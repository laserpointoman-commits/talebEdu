import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useQuickActionPreferences } from '@/hooks/use-quick-action-preferences';
import { CustomizeQuickActionsDialog } from './CustomizeQuickActionsDialog';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const iconColors = [
  'text-primary',
  'text-emerald-500',
  'text-amber-500',
  'text-rose-500',
  'text-blue-500',
  'text-violet-500',
  'text-cyan-500',
  'text-orange-500',
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
  const colorClass = iconColors[index % iconColors.length];
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.03, 
        duration: 0.2,
      }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 cursor-pointer group"
    >
      {/* Floating icon with shadow */}
      <div 
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          "bg-card shadow-lg shadow-foreground/5",
          "group-hover:shadow-xl group-hover:shadow-foreground/10",
          "transition-shadow duration-200"
        )}
      >
        <Icon className={cn("h-6 w-6", colorClass)} />
      </div>
      {/* Label below */}
      <span className="text-xs text-center font-medium text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2 max-w-[80px]">
        {t(action.title)}
      </span>
    </motion.button>
  );
});

QuickActionButton.displayName = 'QuickActionButton';

export const QuickActions = memo(function QuickActions() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { visibleActions, isLoading } = useQuickActionPreferences();

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex justify-end mb-3">
          <CustomizeQuickActionsDialog />
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3">
              <div className="w-12 h-12 bg-muted animate-pulse rounded-2xl" />
              <div className="w-12 h-3 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex justify-end mb-2">
        <CustomizeQuickActionsDialog />
      </div>
      {visibleActions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Icons.LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{t('No quick actions visible')}</p>
          <p className="text-sm mt-1">{t('Click Customize to show actions')}</p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
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
    </div>
  );
});
