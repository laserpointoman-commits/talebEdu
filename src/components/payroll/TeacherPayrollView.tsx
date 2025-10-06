import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LogoLoader from '@/components/LogoLoader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Wallet from '@/components/features/Wallet';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Calendar, DollarSign, Clock, FileText, Bell } from 'lucide-react';

export default function TeacherPayrollView() {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const isRTL = language === 'ar';
  const [teacherData, setTeacherData] = useState<any>(null);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, [profile]);

  const fetchTeacherData = async () => {
    if (!profile) return;

    try {
      // Get teacher record
      const { data: teacher } = await supabase
        .from('teachers')
        .select('*, payroll_config!payroll_config_teacher_id_fkey(*)')
        .eq('profile_id', profile.id)
        .single();

      if (teacher) {
        setTeacherData(teacher);

        // Fetch payroll records
        const { data: records } = await supabase
          .from('payroll_records')
          .select('*')
          .eq('teacher_id', teacher.id)
          .order('period_start', { ascending: false });
        setPayrollRecords(records || []);

        // Fetch recent attendance
        const { data: attendanceData } = await supabase
          .from('teacher_attendance')
          .select('*')
          .eq('teacher_id', teacher.id)
          .order('date', { ascending: false })
          .limit(30);
        setAttendance(attendanceData || []);

        // Fetch notifications
        const { data: notifs } = await supabase
          .from('payroll_notifications')
          .select('*')
          .eq('teacher_id', teacher.id)
          .order('created_at', { ascending: false });
        setNotifications(notifs || []);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    await supabase
      .from('payroll_notifications')
      .update({ is_read: true })
      .eq('id', id);
    fetchTeacherData();
  };

  if (loading) {
    return (
      <LogoLoader fullScreen={true} />
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('My Payroll')}</h1>
        <p className="text-muted-foreground mt-1">{t('View your salary, attendance, and payment history')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Monthly Salary')}</p>
                <p className="text-2xl font-bold">
                  {teacherData?.payroll_config?.[0]?.base_salary || 0} OMR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Days Present This Month')}</p>
                <p className="text-2xl font-bold">
                  {attendance.filter(a => a.status === 'present' && new Date(a.date).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Unread Notifications')}</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => !n.is_read).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wallet" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="wallet">{t('Wallet')}</TabsTrigger>
          <TabsTrigger value="payslips">{t('Payslips')}</TabsTrigger>
          <TabsTrigger value="attendance">{t('Attendance')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('Notifications')}</TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <Wallet />
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle>{t('Payment History')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Period')}</TableHead>
                    <TableHead>{t('Net Salary')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Payment Date')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.period_start), 'MMM yyyy')}</TableCell>
                      <TableCell>{record.net_salary} OMR</TableCell>
                      <TableCell>
                        <Badge variant={record.payment_status === 'paid' ? 'secondary' : 'default'}>
                          {t(record.payment_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.payment_date ? format(new Date(record.payment_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          {t('Download')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>{t('My Attendance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Date')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Check In')}</TableHead>
                    <TableHead>{t('Check Out')}</TableHead>
                    <TableHead>{t('Total Hours')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge>{t(record.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        {record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        {record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell>{record.total_hours ? `${record.total_hours} hrs` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('Notifications')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border ${!notif.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                    onClick={() => !notif.is_read && markNotificationRead(notif.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{notif.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}