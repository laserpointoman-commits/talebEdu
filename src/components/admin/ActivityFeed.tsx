import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Wallet, 
  User, 
  Bus, 
  ShoppingBag, 
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

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
      // Load recent wallet transactions
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

      // Load recent attendance records
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

      // Combine and format activities
      const formattedActivities: Activity[] = [];

      // Add transactions
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

      // Add attendance
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

      // Sort by date
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions'
        },
        () => loadActivities()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records'
        },
        () => loadActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActivityIcon = (category: string, type: string) => {
    if (category === 'wallet') {
      if (type.includes('top_up') || type === 'deposit' || type === 'transfer_in') {
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      }
      return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
    }
    if (category === 'attendance') {
      return <GraduationCap className="h-4 w-4 text-blue-500" />;
    }
    return <User className="h-4 w-4" />;
  };

  const getActivityColor = (category: string, type: string) => {
    if (category === 'wallet') {
      if (type.includes('top_up') || type === 'deposit' || type === 'transfer_in') {
        return 'border-l-4 border-green-500';
      }
      return 'border-l-4 border-orange-500';
    }
    return 'border-l-4 border-blue-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {language === 'ar' ? 'النشاطات الأخيرة' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors ${getActivityColor(activity.category, activity.type)}`}
              >
                <div className="p-2 rounded-full bg-muted">
                  {getActivityIcon(activity.category, activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {language === 'ar' ? activity.user_name_ar : activity.user_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {language === 'ar' ? activity.description_ar : activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                {activity.amount && (
                  <div className="text-right">
                    <Badge variant={activity.type.includes('top_up') || activity.type === 'deposit' ? 'default' : 'secondary'}>
                      {activity.type.includes('top_up') || activity.type === 'deposit' ? '+' : '-'}
                      {Math.abs(activity.amount).toFixed(2)} OMR
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
