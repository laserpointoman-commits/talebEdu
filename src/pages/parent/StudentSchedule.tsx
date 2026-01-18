import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import PageHeader from '@/components/layouts/PageHeader';

interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  subject: string;
  room: string | null;
  teacher_name?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const DAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार'];

export default function StudentSchedule() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
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
        .select('*, classes(id, name)')
        .eq('id', studentId)
        .eq('parent_id', user?.id)
        .single();

      if (error || !studentData) {
        navigate('/dashboard');
        return;
      }

      setStudent(studentData);

      // Get class schedule
      if (studentData.class_id) {
        const { data: scheduleData } = await supabase
          .from('class_schedules')
          .select('*, teachers(profile_id, profiles(full_name))')
          .eq('class_id', studentData.class_id)
          .order('day')
          .order('time');

        const formattedSchedule = (scheduleData || []).map((item: any) => ({
          id: item.id,
          day: item.day,
          time: item.time,
          subject: item.subject,
          room: item.room,
          teacher_name: item.teachers?.profiles?.full_name
        }));

        setSchedule(formattedSchedule);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  const groupedSchedule = DAYS.reduce((acc, day) => {
    acc[day] = schedule.filter(s => s.day === day);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="h-12" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} />

      <div
        className="space-y-6 p-4 max-w-4xl mx-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold">
              {language === 'ar' ? 'جدول الحصص' : language === 'hi' ? 'कक्षा का शेड्यूल' : 'Class Schedule'}
            </h1>
            <p className="text-sm text-muted-foreground">{studentName}</p>
          </div>
        </div>

      {/* Schedule by Day */}
      <div className="space-y-4">
        {DAYS.map((day, index) => (
          <Card key={day}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {language === 'ar' ? DAYS_AR[index] : language === 'hi' ? DAYS_HI[index] : day}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {groupedSchedule[day]?.length > 0 ? (
                groupedSchedule[day].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[60px]">
                        <Clock className="h-3.5 w-3.5" />
                        {item.time}
                      </div>
                      <div>
                        <p className="font-medium">{item.subject}</p>
                        {item.teacher_name && (
                          <p className="text-xs text-muted-foreground">{item.teacher_name}</p>
                        )}
                      </div>
                    </div>
                    {item.room && (
                      <Badge variant="outline" className="text-xs">
                        {item.room}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === 'ar' ? 'لا توجد حصص' : language === 'hi' ? 'कोई कक्षा निर्धारित नहीं' : 'No classes scheduled'}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
}
