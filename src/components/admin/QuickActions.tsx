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
  'from-blue-500 to-indigo-600 text-white shadow-[0_4px_20px_hsl(220,90%,50%,0.4)]',
  'from-emerald-500 to-teal-600 text-white shadow-[0_4px_20px_hsl(160,84%,40%,0.4)]',
  'from-purple-500 to-fuchsia-600 text-white shadow-[0_4px_20px_hsl(280,85%,55%,0.4)]',
  'from-amber-500 to-orange-600 text-white shadow-[0_4px_20px_hsl(40,90%,50%,0.4)]',
  'from-cyan-500 to-blue-600 text-white shadow-[0_4px_20px_hsl(190,85%,45%,0.4)]',
  'from-rose-500 to-pink-600 text-white shadow-[0_4px_20px_hsl(350,80%,55%,0.4)]',
  'from-indigo-500 to-violet-600 text-white shadow-[0_4px_20px_hsl(250,85%,55%,0.4)]',
  'from-teal-500 to-emerald-600 text-white shadow-[0_4px_20px_hsl(170,80%,40%,0.4)]',
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
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.06, 
        duration: 0.3,
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        className={cn(
          "h-auto w-full flex-col gap-3 p-5 rounded-3xl",
          "bg-gradient-to-br",
          "border-0",
          "hover:brightness-110",
          "transition-all duration-300",
          colorClass
        )}
        onClick={onClick}
      >
        <div className="p-3.5 rounded-2xl bg-white/25 backdrop-blur-sm">
          <Icon className="h-7 w-7" />
        </div>
        <span className="text-xs text-center font-semibold line-clamp-2 drop-shadow-sm">
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
