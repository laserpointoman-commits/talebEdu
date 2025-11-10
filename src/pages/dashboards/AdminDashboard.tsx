import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardGlass } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  GraduationCap, 
  Bus, 
  Wallet,
  TrendingUp,
  Settings,
  Shield,
  BarChart3,
  Clock,
  MailPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LogoLoader from "@/components/LogoLoader";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeBuses: 0,
    totalWalletBalance: 0,
    pendingInvitations: 0,
    studentsChange: 0,
    teachersChange: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Load teachers count
      const { count: teachersCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      // Load active buses count
      const { count: busesCount } = await supabase
        .from('buses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Load total wallet balance
      const { data: walletsData } = await supabase
        .from('wallet_balances')
        .select('balance');

      const totalBalance = walletsData?.reduce((sum, w) => sum + Number(w.balance || 0), 0) || 0;

      // Load recent activities from wallet transactions
      const { data: activities } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          profiles!wallet_transactions_user_id_fkey(full_name, full_name_ar)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Load pending invitations count
      const { count: pendingInvitationsCount } = await supabase
        .from('parent_registration_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('used', false)
        .gt('expires_at', new Date().toISOString());

      setStats({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        activeBuses: busesCount || 0,
        totalWalletBalance: totalBalance,
        pendingInvitations: pendingInvitationsCount || 0,
        studentsChange: 0,
        teachersChange: 0
      });

      setRecentActivities(activities || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to wallet transactions
    const walletChannel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions'
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    // Subscribe to students changes
    const studentsChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    // Subscribe to parent invitations changes
    const invitationsChannel = supabase
      .channel('invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parent_registration_tokens'
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(invitationsChannel);
    };
  };

  const quickActions = [
    {
      title: language === 'ar' ? 'إدارة المستخدمين' : 'User Management',
      desc: language === 'ar' ? 'إضافة وتعديل المستخدمين' : 'Add and manage users',
      icon: Users,
      onClick: () => navigate('/dashboard/admin/users')
    },
    {
      title: language === 'ar' ? 'دعوات أولياء الأمور' : 'Parent Invitations',
      desc: language === 'ar' ? 'إرسال وإدارة دعوات التسجيل' : 'Send and manage registration invites',
      icon: MailPlus,
      onClick: () => navigate('/dashboard/admin/parent-invitations'),
      badge: stats.pendingInvitations > 0 ? stats.pendingInvitations : undefined
    },
    {
      title: language === 'ar' ? 'الحافلات والسائقين' : 'Buses & Drivers',
      desc: language === 'ar' ? 'إدارة الحافلات والمسارات' : 'Manage buses and routes',
      icon: Bus,
      onClick: () => navigate('/dashboard/admin/buses')
    },
    {
      title: language === 'ar' ? 'التقارير المالية' : 'Financial Reports',
      desc: language === 'ar' ? 'عرض التقارير والإحصائيات' : 'View reports and analytics',
      icon: BarChart3,
      onClick: () => navigate('/dashboard/reports')
    },
    {
      title: language === 'ar' ? 'الإعدادات' : 'Settings',
      desc: language === 'ar' ? 'إعدادات النظام' : 'System settings',
      icon: Settings,
      onClick: () => navigate('/dashboard/settings')
    }
  ];

  const getActivityType = (type: string) => {
    switch (type) {
      case 'topup':
        return language === 'ar' ? 'شحن محفظة' : 'Wallet top-up';
      case 'payment':
        return language === 'ar' ? 'دفع' : 'Payment';
      case 'refund':
        return language === 'ar' ? 'استرجاع' : 'Refund';
      case 'transfer':
        return language === 'ar' ? 'تحويل' : 'Transfer';
      default:
        return type;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Just now';
    if (diffMins < 60) return `${diffMins} ${language === 'ar' ? 'دقيقة' : 'min'} ${language === 'ar' ? 'مضت' : 'ago'}`;
    if (diffHours < 24) return `${diffHours} ${language === 'ar' ? 'ساعة' : 'hour'} ${language === 'ar' ? 'مضت' : 'ago'}`;
    return `${diffDays} ${language === 'ar' ? 'يوم' : 'day'} ${language === 'ar' ? 'مضى' : 'ago'}`;
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'لوحة المدير' : 'Admin Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'نظرة شاملة على المدرسة' : 'Complete school overview'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardGlass className="hover-lift shadow-glow-soft animate-scale-in" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الطلاب' : 'Total Students'}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'طلاب مسجلين' : 'Registered students'}
            </p>
          </CardContent>
        </CardGlass>

        <CardGlass className="hover-lift shadow-glow-soft animate-scale-in" style={{ animationDelay: '50ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'المعلمين' : 'Teachers'}
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'معلمين نشطين' : 'Active teachers'}
            </p>
          </CardContent>
        </CardGlass>

        <CardGlass className="hover-lift shadow-glow-soft animate-scale-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الحافلات النشطة' : 'Active Buses'}
            </CardTitle>
            <Bus className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBuses}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'حافلات في الخدمة' : 'Buses in service'}
            </p>
          </CardContent>
        </CardGlass>

        <CardGlass className="hover-lift shadow-glow-soft animate-scale-in" style={{ animationDelay: '150ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'رصيد المحافظ' : 'Total Wallet Balance'}
            </CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWalletBalance.toFixed(3)} OMR</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'إجمالي الأرصدة' : 'Total balances'}
            </p>
          </CardContent>
        </CardGlass>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <CardGlass 
              key={idx}
              className="cursor-pointer hover-lift shadow-glow-soft transition-all duration-300 hover:scale-105 animate-scale-in"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={action.onClick}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 relative transition-transform hover:scale-110">
                  <action.icon className="h-6 w-6 text-primary" />
                  {action.badge && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      variant="destructive"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{action.desc}</p>
              </CardHeader>
            </CardGlass>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <CardGlass className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ar' ? 'لا توجد أنشطة حديثة' : 'No recent activity'}
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 hover-lift transition-all">
                  <div className="flex-1">
                    <div className="font-medium">{getActivityType(activity.type)}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? activity.profiles?.full_name_ar || activity.profiles?.full_name || 'مستخدم'
                        : activity.profiles?.full_name || 'User'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      {activity.amount >= 0 ? '+' : ''}{activity.amount.toFixed(3)} OMR
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimeAgo(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </CardGlass>
    </div>
  );
}
