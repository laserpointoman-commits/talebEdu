import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface AttendanceRecord {
  id: string;
  date: string;
  time: string;
  status: string;
  type: string;
  location: string | null;
}

export default function StudentAttendance() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (studentId && user) {
      loadData();
    }
  }, [studentId, user]);

  const loadData = async () => {
    try {
      // Verify parent owns this student
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('parent_id', user?.id)
        .single();

      if (error || !studentData) {
        navigate('/dashboard');
        return;
      }

      setStudent(studentData);

      // Get attendance records for last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
      
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      setAttendance(attendanceData || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  // Calculate stats
  const presentDays = new Set(attendance.filter(a => a.status === 'present').map(a => a.date)).size;
  const absentDays = new Set(attendance.filter(a => a.status === 'absent').map(a => a.date)).size;
  const lateDays = new Set(attendance.filter(a => a.status === 'late').map(a => a.date)).size;
  const totalDays = presentDays + absentDays + lateDays;
  const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100) : 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'absent': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'late': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return { label: language === 'ar' ? 'حاضر' : 'Present', variant: 'default' as const };
      case 'absent': return { label: language === 'ar' ? 'غائب' : 'Absent', variant: 'destructive' as const };
      case 'late': return { label: language === 'ar' ? 'متأخر' : 'Late', variant: 'secondary' as const };
      default: return { label: status, variant: 'outline' as const };
    }
  };

  // Group by date
  const groupedAttendance = attendance.reduce((acc, record) => {
    if (!acc[record.date]) acc[record.date] = [];
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'سجل الحضور' : 'Attendance'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'نسبة الحضور (30 يوم)' : 'Attendance Rate (30 days)'}
              </p>
              <p className="text-3xl font-bold text-primary">
                {attendanceRate.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{presentDays}</p>
              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'حاضر' : 'Present'}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{lateDays}</p>
              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'متأخر' : 'Late'}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{absentDays}</p>
              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'غائب' : 'Absent'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <div className="space-y-3">
        <h2 className="font-semibold">
          {language === 'ar' ? 'السجل اليومي' : 'Daily Records'}
        </h2>
        
        {Object.keys(groupedAttendance).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد سجلات حضور' : 'No attendance records'}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedAttendance).map(([date, records]) => (
            <Card key={date}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {records.map((record) => {
                  const status = getStatusBadge(record.status);
                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <p className="font-medium capitalize">{record.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.time} {record.location && `• ${record.location}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
