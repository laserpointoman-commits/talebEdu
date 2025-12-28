import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users, BookOpen, Download } from 'lucide-react';
import { toast } from 'sonner';
import LogoLoader from '@/components/LogoLoader';

interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  class: string;
}

export default function Schedule() {
  const { user, profile } = useAuth();
  const { t, language, dir } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, [user, profile, selectedDate]);

  const loadSchedule = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      const dayOfWeek = selectedDate 
        ? selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        : new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      let query = supabase
        .from('class_schedules')
        .select(`
          id,
          day,
          time,
          subject,
          room,
          classes (
            name,
            grade,
            section
          ),
          teachers (
            profiles (
              full_name,
              full_name_ar
            )
          )
        `)
        .eq('day', dayOfWeek)
        .order('time', { ascending: true });

      // If user is a student, filter by their class
      if (profile.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('class')
          .eq('profile_id', user.id)
          .single();

        if (studentData?.class) {
          const { data: classData } = await supabase
            .from('classes')
            .select('id')
            .eq('name', studentData.class)
            .single();

          if (classData) {
            query = query.eq('class_id', classData.id);
          }
        }
      }

      // If user is a teacher, filter by their assigned schedules
      if (profile.role === 'teacher') {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('profile_id', user.id)
          .single();

        if (teacherData) {
          query = query.eq('teacher_id', teacherData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: ScheduleItem[] = (data || []).map((item: any) => ({
        id: item.id,
        time: item.time || '00:00',
        subject: item.subject || 'Unknown',
        teacher: language === 'ar' 
          ? (item.teachers?.profiles?.full_name_ar || item.teachers?.profiles?.full_name || '-')
          : (item.teachers?.profiles?.full_name || '-'),
        room: item.room || '-',
        class: item.classes 
          ? `${item.classes.grade}-${item.classes.section}`
          : '-'
      }));

      setTodaySchedule(mapped);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadClassSchedule = () => {
    if (todaySchedule.length === 0) {
      toast.error(language === 'en' ? 'No schedule to download' : 'لا يوجد جدول للتنزيل');
      return;
    }

    const headers = language === 'en' 
      ? ['Time', 'Subject', 'Teacher', 'Room', 'Class']
      : ['الوقت', 'المادة', 'المدرس', 'القاعة', 'الصف'];
    
    const csvContent = [
      headers.join(','),
      ...todaySchedule.map(item => 
        [item.time, item.subject, item.teacher, item.room, item.class].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `class_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(language === 'en' ? 'Class schedule downloaded successfully' : 'تم تنزيل جدول الحصص بنجاح');
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.schedule')}</h2>
          <p className="text-muted-foreground">
            {t('schedule.manageSchedules')}
          </p>
        </div>
        <Button onClick={downloadClassSchedule} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('schedule.downloadSchedule')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('schedule.todaySchedule')}</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'en' ? 'No classes scheduled for this day' : 'لا توجد حصص مجدولة لهذا اليوم'}</p>
              </div>
            ) : (
              <div className="space-y-3" dir={dir}>
                {todaySchedule.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex items-center gap-4 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <div className="flex flex-col items-center">
                        <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-xs font-medium">{item.time.split(' - ')[0] || item.time}</span>
                        {item.time.includes(' - ') && (
                          <span className="text-xs text-muted-foreground">{item.time.split(' - ')[1]}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.subject}</p>
                        {item.teacher !== '-' && (
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {item.teacher}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.room}
                            </span>
                            {profile?.role === 'teacher' && item.class !== '-' && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {item.class}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{item.subject}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('common.calendar')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">
                {t('schedule.scheduleSummary')}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.classes')}</span>
                  <span className="font-medium">{todaySchedule.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.totalHours')}</span>
                  <span className="font-medium">
                    {todaySchedule.length > 0 ? `~${Math.round(todaySchedule.length * 0.75)} ${t('time.hrs')}` : '0'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
