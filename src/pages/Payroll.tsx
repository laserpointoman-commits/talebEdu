import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LogoLoader from '@/components/LogoLoader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Wallet, Users, Calendar, DollarSign, Clock, TrendingUp, FileText, Bell } from 'lucide-react';
import PayrollManagement from '@/components/payroll/PayrollManagement';
import TeacherAttendance from '@/components/payroll/TeacherAttendance';
import LeaveRequests from '@/components/payroll/LeaveRequests';
import PayrollReports from '@/components/payroll/PayrollReports';
import TeacherPayrollView from '@/components/payroll/TeacherPayrollView';
import { format } from 'date-fns';

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

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      // Fetch admin wallet balance
      const { data: walletData } = await supabase
        .from('admin_wallets')
        .select('balance')
        .single();
      
      if (walletData) {
        setAdminWallet(walletData.balance);
      }

      // Fetch statistics
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Total teachers
      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      // Pending payments
      const { count: pendingCount } = await supabase
        .from('payroll_records')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'pending');

      // Total payroll this month
      const { data: payrollData } = await supabase
        .from('payroll_records')
        .select('net_salary')
        .gte('period_start', startOfMonth.toISOString())
        .lte('period_end', endOfMonth.toISOString());

      const totalPayroll = payrollData?.reduce((sum, record) => sum + (record.net_salary || 0), 0) || 0;

      // Average attendance
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
        title: t('error'),
        description: t('Failed to load data'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LogoLoader fullScreen={true} />
    );
  }

  // Teacher view
  if (profile?.role === 'teacher') {
    return <TeacherPayrollView />;
  }

  // Admin view
  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('Payroll Management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('Manage teacher salaries, attendance, and payments')}
          </p>
        </div>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Admin Wallet')}</p>
                <p className="text-2xl font-bold text-primary">
                  {adminWallet.toFixed(3)} OMR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Total Teachers')}</p>
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Pending Payments')}</p>
                <p className="text-2xl font-bold">{stats.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Payroll This Month')}</p>
                <p className="text-2xl font-bold">{stats.totalPayrollThisMonth.toFixed(3)} OMR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Average Attendance')}</p>
                <p className="text-2xl font-bold">{stats.averageAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="payroll" className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className={`grid grid-cols-4 w-full max-w-2xl ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {t('Payroll')}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('Attendance')}
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('Leave Requests')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('Reports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <PayrollManagement onWalletUpdate={fetchAdminData} />
        </TabsContent>

        <TabsContent value="attendance">
          <TeacherAttendance />
        </TabsContent>

        <TabsContent value="leaves">
          <LeaveRequests />
        </TabsContent>

        <TabsContent value="reports">
          <PayrollReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}