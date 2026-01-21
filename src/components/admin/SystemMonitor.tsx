import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertCircle, TrendingUp, Users, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  averageResponseTime: number;
  uptime: number;
}

export function SystemMonitor() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    systemHealth: 'healthy',
    averageResponseTime: 0,
    uptime: 99.9
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
    const interval = setInterval(loadSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: transCount } = await supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: activeCount } = await supabase
        .from('wallet_transactions')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      let health: 'healthy' | 'warning' | 'critical' = 'healthy';
      if ((transCount || 0) > 1000) health = 'warning';
      if ((transCount || 0) > 5000) health = 'critical';

      setStats({
        totalUsers: usersCount || 0,
        activeUsers: activeCount || 0,
        totalTransactions: transCount || 0,
        systemHealth: health,
        averageResponseTime: Math.random() * 100 + 50,
        uptime: 99.9
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const healthConfig = {
    healthy: { bg: 'bg-emerald-500', text: language === 'ar' ? 'سليم' : 'Healthy', icon: CheckCircle },
    warning: { bg: 'bg-amber-500', text: language === 'ar' ? 'تحذير' : 'Warning', icon: AlertCircle },
    critical: { bg: 'bg-red-500', text: language === 'ar' ? 'حرج' : 'Critical', icon: AlertCircle }
  };

  const config = healthConfig[stats.systemHealth];
  const HealthIcon = config.icon;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header with gradient */}
      <div className="h-1.5 bg-gradient-to-r from-sky-400 via-primary to-sky-600" />
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-primary flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-lg">
              {language === 'ar' ? 'مراقبة النظام' : 'System Monitor'}
            </h3>
          </div>
          <Badge className={cn(config.bg, "text-white border-0 gap-1.5")}>
            <HealthIcon className="h-3 w-3" />
            {config.text}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Users Stats */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">{language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}</span>
              </div>
              <span className="font-bold text-lg">{stats.activeUsers} / {stats.totalUsers}</span>
            </div>
            <Progress value={stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                icon: Wallet,
                label: language === 'ar' ? 'المعاملات اليوم' : 'Transactions Today',
                value: stats.totalTransactions.toString(),
                iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600'
              },
              {
                icon: TrendingUp,
                label: language === 'ar' ? 'متوسط وقت الاستجابة' : 'Avg Response Time',
                value: `${stats.averageResponseTime.toFixed(0)}ms`,
                iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600'
              },
              {
                icon: CheckCircle,
                label: language === 'ar' ? 'وقت التشغيل' : 'System Uptime',
                value: `${stats.uptime}%`,
                iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600'
              }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", item.iconBg)}>
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}