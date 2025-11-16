import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  GraduationCap, 
  Bus, 
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LogoLoader from "@/components/LogoLoader";
import { Badge } from "@/components/ui/badge";
import { SystemMonitor } from "@/components/admin/SystemMonitor";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { QuickActions } from "@/components/admin/QuickActions";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeBuses: 0,
    totalWalletBalance: 0,
    studentsChange: 0,
    teachersChange: 0
  });

  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      const { count: teachersCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      const { count: busesCount } = await supabase
        .from('buses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: walletsData } = await supabase
        .from('wallet_balances')
        .select('balance');

      const totalBalance = walletsData?.reduce((sum, w) => sum + Number(w.balance || 0), 0) || 0;

      setStats({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        activeBuses: busesCount || 0,
        totalWalletBalance: totalBalance,
        studentsChange: 0,
        teachersChange: 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const walletChannel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions'
        },
        () => loadDashboardData()
      )
      .subscribe();

    const studentsChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        () => loadDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(studentsChannel);
    };
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'en' ? 'Admin Dashboard' : 'لوحة تحكم المسؤول'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Real-time overview and system monitoring' : 'نظرة عامة في الوقت الفعلي ومراقبة النظام'}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {language === 'ar' ? 'مباشر' : 'Live'} •
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Total Students' : 'إجمالي الطلاب'}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.studentsChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stats.studentsChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(stats.studentsChange)}
              </span>
              <span className="ml-1">{language === 'en' ? 'this month' : 'هذا الشهر'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Total Teachers' : 'إجمالي المعلمين'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.teachersChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stats.teachersChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(stats.teachersChange)}
              </span>
              <span className="ml-1">{language === 'en' ? 'this month' : 'هذا الشهر'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Active Buses' : 'الحافلات النشطة'}
            </CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBuses}</div>
            <p className="text-xs text-green-600 mt-1">
              {language === 'en' ? 'Operational' : 'قيد التشغيل'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Total Wallet Balance' : 'إجمالي رصيد المحفظة'}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWalletBalance.toFixed(2)} OMR</div>
            <div className="flex items-center text-xs mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">{language === 'en' ? 'Combined balance' : 'الرصيد الإجمالي'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* System Monitor and Activity Feed */}
      <div className="grid gap-6 md:grid-cols-2">
        <SystemMonitor />
        <ActivityFeed />
      </div>
    </div>
  );
}
