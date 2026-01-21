import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LogoLoader from '@/components/LogoLoader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Wallet, Users, Calendar, DollarSign, Clock, TrendingUp, FileText, Banknote } from 'lucide-react';
import PayrollManagement from '@/components/payroll/PayrollManagement';
import TeacherAttendance from '@/components/payroll/TeacherAttendance';
import LeaveRequests from '@/components/payroll/LeaveRequests';
import PayrollReports from '@/components/payroll/PayrollReports';
import TeacherPayrollView from '@/components/payroll/TeacherPayrollView';
import { getText } from '@/utils/i18n';
import { motion } from 'framer-motion';

export default function Payroll() {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const isRTL = language === 'ar';
  const [adminWallet, setAdminWallet] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    pendingPayments: 0,
    totalPayrollThisMonth: 0,
    averageAttendance: 0
  });

  const txt = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      const { data: walletData } = await supabase
        .from('admin_wallets')
        .select('balance')
        .single();
      
      if (walletData) {
        setAdminWallet(walletData.balance);
      }

      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('payroll_records')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'pending');

      const { data: payrollData } = await supabase
        .from('payroll_records')
        .select('net_salary')
        .gte('period_start', startOfMonth.toISOString())
        .lte('period_end', endOfMonth.toISOString());

      const totalPayroll = payrollData?.reduce((sum, record) => sum + (record.net_salary || 0), 0) || 0;

      const { data: attendanceData } = await supabase
        .from('teacher_attendance')
        .select('status')
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
        .in('status', ['present', 'late']);

      const { count: totalDays } = await supabase
        .from('teacher_attendance')
        .select('*', { count: 'exact', head: true })
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString());

      const avgAttendance = totalDays ? ((attendanceData?.length || 0) / totalDays) * 100 : 0;

      setStats({
        totalTeachers: teacherCount || 0,
        pendingPayments: pendingCount || 0,
        totalPayrollThisMonth: totalPayroll,
        averageAttendance: Math.round(avgAttendance)
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: txt('Error', 'خطأ', 'त्रुटि'),
        description: txt('Failed to load data', 'فشل في تحميل البيانات', 'डेटा लोड करने में विफल'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LogoLoader fullScreen={true} />;
  }

  if (profile?.role === 'teacher') {
    return <TeacherPayrollView />;
  }

  return (
    <div className={`p-4 md:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Banknote className="h-6 w-6" />
              </div>
              {txt('Payroll Management', 'إدارة الرواتب', 'पेरोल प्रबंधन')}
            </h1>
            <p className="text-white/80 mt-1">
              {txt('Manage teacher salaries, attendance, and payments', 'إدارة رواتب المعلمين والحضور والمدفوعات', 'शिक्षक वेतन, उपस्थिति और भुगतान प्रबंधित करें')}
            </p>
          </div>
          <Card className="bg-white/20 backdrop-blur-sm border-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">{txt('Admin Wallet', 'محفظة المسؤول', 'एडमिन वॉलेट')}</p>
                  <p className="text-2xl font-bold">
                    {adminWallet.toFixed(3)} OMR
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{txt('Total Teachers', 'إجمالي المعلمين', 'कुल शिक्षक')}</p>
                  <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{txt('Pending Payments', 'المدفوعات المعلقة', 'लंबित भुगतान')}</p>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{txt('Payroll This Month', 'رواتب هذا الشهر', 'इस महीने का पेरोल')}</p>
                  <p className="text-2xl font-bold">{stats.totalPayrollThisMonth.toFixed(3)}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{txt('Average Attendance', 'متوسط الحضور', 'औसत उपस्थिति')}</p>
                  <p className="text-2xl font-bold">{stats.averageAttendance}%</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
        <CardContent className="p-0">
          <Tabs defaultValue="payroll" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsList className={`grid grid-cols-4 w-full bg-muted/30 rounded-none border-b ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <TabsTrigger value="payroll" className="flex items-center gap-2 py-4 data-[state=active]:bg-background">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">{txt('Payroll', 'الرواتب', 'पेरोल')}</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2 py-4 data-[state=active]:bg-background">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{txt('Attendance', 'الحضور', 'उपस्थिति')}</span>
              </TabsTrigger>
              <TabsTrigger value="leaves" className="flex items-center gap-2 py-4 data-[state=active]:bg-background">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{txt('Leave', 'الإجازات', 'छुट्टी')}</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 py-4 data-[state=active]:bg-background">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">{txt('Reports', 'التقارير', 'रिपोर्ट')}</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-4 md:p-6">
              <TabsContent value="payroll" className="m-0">
                <PayrollManagement onWalletUpdate={fetchAdminData} />
              </TabsContent>

              <TabsContent value="attendance" className="m-0">
                <TeacherAttendance />
              </TabsContent>

              <TabsContent value="leaves" className="m-0">
                <LeaveRequests />
              </TabsContent>

              <TabsContent value="reports" className="m-0">
                <PayrollReports />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
