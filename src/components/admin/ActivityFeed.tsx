import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Wallet, 
  User, 
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: string;
  description: string;
  description_ar: string;
  user_name: string;
  user_name_ar: string;
  amount?: number;
  created_at: string;
  category: string;
}

export function ActivityFeed() {
  const { language } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    subscribeToActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select(`
          id,
          type,
          amount,
          description,
          description_ar,
          created_at,
          profiles!wallet_transactions_user_id_fkey(full_name, full_name_ar)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: attendance } = await supabase
        .from('attendance_records')
        .select(`
          id,
          type,
          status,
          created_at,
          students(first_name, last_name, first_name_ar, last_name_ar)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedActivities: Activity[] = [];

      transactions?.forEach(t => {
        formattedActivities.push({
          id: t.id,
          type: t.type,
          description: t.description,
          description_ar: t.description_ar,
          user_name: (t.profiles as any)?.full_name || 'Unknown',
          user_name_ar: (t.profiles as any)?.full_name_ar || 'غير معروف',
          amount: t.amount,
          created_at: t.created_at,
          category: 'wallet'
        });
      });

      attendance?.forEach(a => {
        const student = a.students as any;
        formattedActivities.push({
          id: a.id,
          type: 'attendance',
          description: `${student?.first_name} ${student?.last_name} - ${a.status}`,
          description_ar: `${student?.first_name_ar} ${student?.last_name_ar} - ${a.status}`,
          user_name: `${student?.first_name} ${student?.last_name}`,
          user_name_ar: `${student?.first_name_ar} ${student?.last_name_ar}`,
          created_at: a.created_at,
          category: 'attendance'
        });
      });

      formattedActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(formattedActivities.slice(0, 15));
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToActivities = () => {
    const channel = supabase
      .channel('activities-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions' },
        () => loadActivities()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        () => loadActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActivityConfig = (category: string, type: string) => {
    if (category === 'wallet') {
      const isIncoming = type.includes('top_up') || type === 'deposit' || type === 'transfer_in';
      return {
        icon: isIncoming ? ArrowDownRight : ArrowUpRight,
        iconBg: isIncoming ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-amber-400 to-amber-600',
        accentColor: isIncoming ? 'border-l-emerald-500' : 'border-l-amber-500'
      };
    }
    return {
      icon: GraduationCap,
      iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
      accentColor: 'border-l-sky-500'
    };
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header with gradient */}
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
      
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-lg">
            {language === 'ar' ? 'النشاطات الأخيرة' : 'Recent Activity'}
          </h3>
        </div>

        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-3">
            {activities.map((activity) => {
              const config = getActivityConfig(activity.category, activity.type);
              const Icon = config.icon;
              
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 border-l-4 transition-all hover:bg-muted/50",
                    config.accentColor
                  )}
                >
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", config.iconBg)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {language === 'ar' ? activity.user_name_ar : activity.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {language === 'ar' ? activity.description_ar : activity.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(activity.created_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  {activity.amount && (
                    <Badge 
                      className={cn(
                        "shrink-0",
                        activity.type.includes('top_up') || activity.type === 'deposit' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      )}
                    >
                      {activity.type.includes('top_up') || activity.type === 'deposit' ? '+' : '-'}
                      {Math.abs(activity.amount).toFixed(2)}
                    </Badge>
                  )}
                </div>
              );
            })}

            {activities.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>{language === 'ar' ? 'لا توجد أنشطة حديثة' : 'No recent activities'}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}