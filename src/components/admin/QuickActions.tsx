import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import * as Icons from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  href: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

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
  const { profile } = useAuth();

  const userRole = profile?.role || 'student';
  
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['quick-actions', userRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('role', userRole)
        .eq('is_active', true)
        .order('display_order')
        .limit(8);
      
      if (error) throw error;
      return data as QuickAction[];
    }
  });

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Home;
    return Icon;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
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
      <CardHeader>
        <CardTitle>
          {t('dashboard.quickActions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action, index) => {
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
      </CardContent>
    </Card>
  );
}
