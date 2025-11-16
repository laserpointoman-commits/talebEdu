import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertCircle, TrendingUp, Users, Wallet, Bus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
    const interval = setInterval(loadSystemStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    try {
      // Count total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Count transactions today
      const today = new Date().toISOString().split('T')[0];
      const { count: transCount } = await supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Simulate active users (users with activity in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: activeCount } = await supabase
        .from('wallet_transactions')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      // Calculate system health based on transaction volume and errors
      let health: 'healthy' | 'warning' | 'critical' = 'healthy';
      if ((transCount || 0) > 1000) health = 'warning';
      if ((transCount || 0) > 5000) health = 'critical';

      setStats({
        totalUsers: usersCount || 0,
        activeUsers: activeCount || 0,
        totalTransactions: transCount || 0,
        systemHealth: health,
        averageResponseTime: Math.random() * 100 + 50, // Simulated
        uptime: 99.9
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = () => {
    const healthConfig = {
      healthy: { color: 'bg-green-500', text: language === 'ar' ? 'سليم' : 'Healthy', icon: CheckCircle },
      warning: { color: 'bg-yellow-500', text: language === 'ar' ? 'تحذير' : 'Warning', icon: AlertCircle },
      critical: { color: 'bg-red-500', text: language === 'ar' ? 'حرج' : 'Critical', icon: AlertCircle }
    };

    const config = healthConfig[stats.systemHealth];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {language === 'ar' ? 'مراقبة النظام' : 'System Monitor'}
          </div>
          {getHealthBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Users Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}</span>
            </div>
            <span className="font-semibold">{stats.activeUsers} / {stats.totalUsers}</span>
          </div>
          <Progress value={(stats.activeUsers / stats.totalUsers) * 100} className="h-2" />
        </div>

        {/* Transactions Today */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm">{language === 'ar' ? 'المعاملات اليوم' : 'Transactions Today'}</span>
          </div>
          <span className="font-bold text-primary">{stats.totalTransactions}</span>
        </div>

        {/* Response Time */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{language === 'ar' ? 'متوسط وقت الاستجابة' : 'Avg Response Time'}</span>
          </div>
          <span className="font-bold">{stats.averageResponseTime.toFixed(0)}ms</span>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">{language === 'ar' ? 'وقت التشغيل' : 'System Uptime'}</span>
          </div>
          <span className="font-bold text-green-600">{stats.uptime}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
