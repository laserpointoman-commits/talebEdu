import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Scan, 
  GraduationCap, 
  Calendar, 
  MessageSquare, 
  Users,
  BookOpen,
  FileText,
  Award,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LogoLoader from "@/components/LogoLoader";
import { QuickActions } from "@/components/admin/QuickActions";

export default function TeacherDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    upcomingExams: 0,
    totalClasses: 0
  });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadTeacherData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadTeacherData = async () => {
    try {
      // Get teacher ID
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (!teacherData) {
        setLoading(false);
        return;
      }

      // Get classes taught by this teacher
      const { data: classes } = await supabase
        .from('classes')
        .select('*, students:students(count)')
        .eq('class_teacher_id', teacherData.id);

      const totalStudents = classes?.reduce((sum, c) => sum + (c.total_students || 0), 0) || 0;

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { count: attendanceCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('recorded_by', user?.id)
        .eq('status', 'present');

      // Get upcoming exams
      const { count: examsCount } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .gte('date', today);

      // Get today's schedule
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const { data: scheduleData } = await supabase
        .from('class_schedules')
        .select(`
          *,
          classes(name, grade, section)
        `)
        .eq('teacher_id', teacherData.id)
        .eq('day', dayOfWeek)
        .order('time', { ascending: true });

      setStats({
        totalStudents,
        todayAttendance: attendanceCount || 0,
        attendanceRate: totalStudents > 0 ? Math.round(((attendanceCount || 0) / totalStudents) * 100) : 0,
        upcomingExams: examsCount || 0,
        totalClasses: classes?.length || 0
      });

      setTodaySchedule(scheduleData || []);
    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        () => {
          loadTeacherData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
    };
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'لوحة المعلم' : language === 'hi' ? 'शिक्षक डैशबोर्ड' : 'Teacher Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'إدارة الفصول والطلاب' : language === 'hi' ? 'अपनी कक्षाओं और छात्रों का प्रबंधन करें' : 'Manage your classes and students'}
        </p>
      </div>

      {/* Quick Actions - At the top */}
      <QuickActions />

      {/* Stats Overview - Floating Icon Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: language === 'ar' ? 'إجمالي الطلاب' : language === 'hi' ? 'कुल छात्र' : 'Total Students',
            value: stats.totalStudents,
            subtitle: `${stats.totalClasses} ${language === 'ar' ? 'فصول' : language === 'hi' ? 'कक्षाएं' : 'classes'}`,
            icon: GraduationCap,
            iconColor: 'text-primary',
          },
          {
            title: language === 'ar' ? 'الحضور اليوم' : language === 'hi' ? 'आज की उपस्थिति' : "Today's Attendance",
            value: stats.todayAttendance,
            subtitle: `${stats.attendanceRate}% ${language === 'ar' ? 'معدل الحضور' : language === 'hi' ? 'उपस्थिति दर' : 'attendance rate'}`,
            subtitleColor: 'text-green-500',
            icon: Clock,
            iconColor: 'text-emerald-500',
          },
          {
            title: language === 'ar' ? 'الامتحانات القادمة' : language === 'hi' ? 'आगामी परीक्षाएं' : 'Upcoming Exams',
            value: stats.upcomingExams,
            subtitle: language === 'ar' ? 'قادمة' : language === 'hi' ? 'निर्धारित' : 'scheduled',
            icon: FileText,
            iconColor: 'text-amber-500',
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
              <div className="w-12 h-12 rounded-2xl bg-background shadow-lg shadow-foreground/5 flex items-center justify-center shrink-0">
                <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                <p className={cn("text-xs mt-1", stat.subtitleColor || 'text-muted-foreground')}>
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === 'ar' ? 'جدول اليوم' : language === 'hi' ? 'आज का शेड्यूल' : "Today's Schedule"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ar' ? 'لا توجد حصص اليوم' : language === 'hi' ? 'आज कोई कक्षा निर्धारित नहीं' : 'No classes scheduled for today'}
            </div>
          ) : (
            <div className="space-y-4">
              {todaySchedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-primary min-w-[120px]">{item.time}</div>
                    <div>
                      <div className="font-medium">
                        {language === 'ar' 
                          ? `الصف ${item.classes?.grade} ${item.classes?.section}`
                          : language === 'hi'
                          ? `कक्षा ${item.classes?.grade}${item.classes?.section}`
                          : `Class ${item.classes?.grade}${item.classes?.section}`}
                      </div>
                      <div className="text-sm text-muted-foreground">{item.subject}</div>
                      {item.room && (
                        <div className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'الغرفة:' : language === 'hi' ? 'कमरा:' : 'Room:'} {item.room}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard/classes')}>
                    {language === 'ar' ? 'عرض' : language === 'hi' ? 'देखें' : 'View'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
