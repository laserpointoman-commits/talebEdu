import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
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
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        .select('*', { count: 'exact', head: true });

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

      {/* Quick Actions - At the top */}
      <QuickActions />

      {/* Stats Grid - Floating Icon Design */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: language === 'en' ? 'Total Students' : 'إجمالي الطلاب',
            value: stats.totalStudents,
            change: stats.studentsChange,
            icon: GraduationCap,
            iconColor: 'text-primary',
          },
          {
            title: language === 'en' ? 'Total Teachers' : 'إجمالي المعلمين',
            value: stats.totalTeachers,
            change: stats.teachersChange,
            icon: Users,
            iconColor: 'text-emerald-500',
          },
          {
            title: language === 'en' ? 'Active Buses' : 'الحافلات النشطة',
            value: stats.activeBuses,
            subtitle: language === 'en' ? 'Operational' : 'قيد التشغيل',
            icon: Bus,
            iconColor: 'text-amber-500',
          },
          {
            title: language === 'en' ? 'Total Wallet Balance' : 'إجمالي رصيد المحفظة',
            value: `${stats.totalWalletBalance.toFixed(2)} OMR`,
            subtitle: language === 'en' ? 'Combined balance' : 'الرصيد الإجمالي',
            icon: Wallet,
            iconColor: 'text-violet-500',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="bg-card rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-3">
              {/* Floating Icon */}
              <div className="w-12 h-12 rounded-2xl bg-background shadow-lg shadow-foreground/5 flex items-center justify-center shrink-0">
                <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                {stat.change !== undefined && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={stat.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(stat.change)}
                    </span>
                    <span className="ml-1">{language === 'en' ? 'this month' : 'هذا الشهر'}</span>
                  </div>
                )}
                {stat.subtitle && (
                  <div className="flex items-center text-xs mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">{stat.subtitle}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Monitor and Activity Feed */}
      <div className="grid gap-6 md:grid-cols-2">
        <SystemMonitor />
        <ActivityFeed />
      </div>
    </div>
  );
}
