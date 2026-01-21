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
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeBuses: 0,
    totalWalletBalance: 0,
    studentsChange: 0,
    teachersChange: 0
  });

  // Helper function for translations not in the central system
  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };

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
      {/* Header with gradient accent */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 via-primary to-sky-600 p-6 text-white">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold">
            {getText('Admin Dashboard', 'لوحة تحكم المسؤول', 'प्रशासक डैशबोर्ड')}
          </h2>
          <p className="text-white/80 mt-1">
            {getText('Real-time overview and system monitoring', 'نظرة عامة في الوقت الفعلي ومراقبة النظام', 'रियल-टाइम अवलोकन और सिस्टम मॉनिटरिंग')}
          </p>
        </div>
        <Badge className="absolute top-4 right-4 bg-white/20 text-white border-0 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
          {getText('Live', 'مباشر', 'लाइव')}
        </Badge>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* Quick Actions - At the top */}
      <QuickActions />

      {/* Stats Grid - Modern Card Design */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: getText('Total Students', 'إجمالي الطلاب', 'कुल छात्र'),
            value: stats.totalStudents,
            change: stats.studentsChange,
            icon: GraduationCap,
            iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
            iconColor: 'text-white',
          },
          {
            title: getText('Total Teachers', 'إجمالي المعلمين', 'कुल शिक्षक'),
            value: stats.totalTeachers,
            change: stats.teachersChange,
            icon: Users,
            iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
            iconColor: 'text-white',
          },
          {
            title: getText('Active Buses', 'الحافلات النشطة', 'सक्रिय बसें'),
            value: stats.activeBuses,
            subtitle: getText('Operational', 'قيد التشغيل', 'परिचालित'),
            icon: Bus,
            iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
            iconColor: 'text-white',
          },
          {
            title: getText('Total Wallet Balance', 'إجمالي رصيد المحفظة', 'कुल वॉलेट शेष'),
            value: `${stats.totalWalletBalance.toFixed(2)} OMR`,
            subtitle: getText('Combined balance', 'الرصيد الإجمالي', 'संयुक्त शेष'),
            icon: Wallet,
            iconBg: 'bg-gradient-to-br from-violet-400 to-violet-600',
            iconColor: 'text-white',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            whileHover={{ y: -4 }}
            className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            {/* Top accent bar */}
            <div className={cn("h-1", stat.iconBg)} />
            
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon with gradient */}
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", stat.iconBg)}>
                  <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-xl font-bold mt-0.5 text-foreground">{stat.value}</p>
                  {stat.change !== undefined && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      {stat.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {Math.abs(stat.change)}
                      </span>
                      <span className="ml-1">{getText('this month', 'هذا الشهر', 'इस महीने')}</span>
                    </div>
                  )}
                  {stat.subtitle && (
                    <div className="flex items-center text-xs mt-1">
                      <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                      <span className="text-emerald-600">{stat.subtitle}</span>
                    </div>
                  )}
                </div>
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
