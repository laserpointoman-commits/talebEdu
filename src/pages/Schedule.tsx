import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users, BookOpen, Download, Calendar as CalendarIcon } from 'lucide-react';
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
        ? selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
        : new Date().toLocaleDateString('en-US', { weekday: 'long' });

      // If user is a parent, get their children's class IDs
      let childClassIds: string[] = [];
      if (profile.role === 'parent') {
        const { data: children } = await supabase
          .from('students')
          .select('class_id, first_name, last_name')
          .eq('parent_id', user.id)
          .eq('approval_status', 'approved')
          .not('class_id', 'is', null);

        if (children && children.length > 0) {
          childClassIds = children.map(c => c.class_id).filter(Boolean) as string[];
        }
      }

      // If user is a student, get their class_id
      let studentClassId: string | null = null;
      if (profile.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('class_id')
          .eq('profile_id', user.id)
          .single();

        studentClassId = studentData?.class_id || null;
      }

      // Build the query
      let query = supabase
        .from('class_schedules')
        .select(`
          id,
          day,
          time,
          subject,
          room,
          class_id,
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

      // Filter by role
      if (profile.role === 'student' && studentClassId) {
        query = query.eq('class_id', studentClassId);
      } else if (profile.role === 'parent' && childClassIds.length > 0) {
        query = query.in('class_id', childClassIds);
      } else if (profile.role === 'teacher') {
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

  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };

  const downloadClassSchedule = () => {
    if (todaySchedule.length === 0) {
      toast.error(getText('No schedule to download', 'لا يوجد جدول للتنزيل', 'डाउनलोड करने के लिए कोई शेड्यूल नहीं'));
      return;
    }

    const headers = getText(
      'Time,Subject,Teacher,Room,Class',
      'الوقت,المادة,المدرس,القاعة,الصف',
      'समय,विषय,शिक्षक,कमरा,कक्षा'
    ).split(',');
    
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

    toast.success(getText('Class schedule downloaded successfully', 'تم تنزيل جدول الحصص بنجاح', 'कक्षा का शेड्यूल सफलतापूर्वक डाउनलोड हो गया'));
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] bg-[length:20px_20px]" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{t('dashboard.schedule')}</h2>
            <p className="mt-1 text-white/80 text-sm md:text-base">
              {t('schedule.manageSchedules')}
            </p>
          </div>
          <Button onClick={downloadClassSchedule} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Download className="h-4 w-4 mr-2" />
            {t('schedule.downloadSchedule')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden rounded-2xl shadow-md">
          <div className="h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              {t('schedule.todaySchedule')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>{getText('No classes scheduled for this day', 'لا توجد حصص مجدولة لهذا اليوم', 'इस दिन के लिए कोई कक्षा निर्धारित नहीं है')}</p>
              </div>
            ) : (
              <div className="space-y-3" dir={dir}>
                {todaySchedule.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                    <div className={`flex items-center gap-4 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <div className="flex flex-col items-center bg-primary/10 px-3 py-2 rounded-lg min-w-[80px]">
                        <Clock className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xs font-semibold text-primary">{item.time.split(' - ')[0] || item.time}</span>
                        {item.time.includes(' - ') && (
                          <span className="text-xs text-muted-foreground">{item.time.split(' - ')[1]}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.subject}</p>
                        {item.teacher !== '-' && (
                          <div className="flex items-center gap-4 mt-1 flex-wrap">
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
                    <Badge variant="outline" className="border-violet-300 text-violet-600">{item.subject}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl shadow-md">
          <div className="h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-white" />
              </div>
              {t('common.calendar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-lg border"
            />
            <div className="mt-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-xl">
              <p className="text-sm font-semibold mb-3">
                {t('schedule.scheduleSummary')}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.classes')}</span>
                  <span className="font-bold text-primary">{todaySchedule.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.totalHours')}</span>
                  <span className="font-bold text-primary">
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
