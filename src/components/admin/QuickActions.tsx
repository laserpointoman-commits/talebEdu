import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuickActionPreferences } from '@/hooks/use-quick-action-preferences';
import { CustomizeQuickActionsDialog } from './CustomizeQuickActionsDialog';
import * as Icons from 'lucide-react';

const colorClasses = [
  'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  'text-green-600 bg-green-100 dark:bg-green-900/20',
  'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
  'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
  'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
  'text-red-600 bg-red-100 dark:bg-red-900/20',
  'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
];

export function QuickActions() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { visibleActions, isLoading } = useQuickActionPreferences();

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Home;
    return Icon;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          <CustomizeQuickActionsDialog />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>
          {t('dashboard.quickActions')}
        </CardTitle>
        <CustomizeQuickActionsDialog />
      </CardHeader>
      <CardContent>
        {visibleActions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('No quick actions visible')}</p>
            <p className="text-sm mt-2">{t('Click Customize to show actions')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {visibleActions.map((action, index) => {
              const Icon = getIconComponent(action.icon);
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 hover:scale-105 transition-transform"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`p-3 rounded-lg ${colorClasses[index % colorClasses.length]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-center">{t(action.title)}</span>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
