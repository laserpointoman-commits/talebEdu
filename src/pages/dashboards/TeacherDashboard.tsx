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
    <div className="space-y-6 p-4 md:p-6">
      {/* Gradient Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-primary to-sky-600 p-6 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] bg-[length:20px_20px]" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">
            {language === 'ar' ? 'لوحة المعلم' : language === 'hi' ? 'शिक्षक डैशबोर्ड' : 'Teacher Dashboard'}
          </h1>
          <p className="mt-1 text-white/80 text-sm md:text-base">
            {language === 'ar' ? 'إدارة الفصول والطلاب' : language === 'hi' ? 'अपनी कक्षाओं और छात्रों का प्रबंधन करें' : 'Manage your classes and students'}
          </p>
        </div>
      </motion.div>

      {/* Quick Actions - At the top */}
      <QuickActions />

      {/* Stats Overview - Modern Card Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: language === 'ar' ? 'إجمالي الطلاب' : language === 'hi' ? 'कुल छात्र' : 'Total Students',
            value: stats.totalStudents,
            subtitle: `${stats.totalClasses} ${language === 'ar' ? 'فصول' : language === 'hi' ? 'कक्षाएं' : 'classes'}`,
            icon: GraduationCap,
            gradient: 'from-blue-500 to-sky-400',
          },
          {
            title: language === 'ar' ? 'الحضور اليوم' : language === 'hi' ? 'आज की उपस्थिति' : "Today's Attendance",
            value: stats.todayAttendance,
            subtitle: `${stats.attendanceRate}% ${language === 'ar' ? 'معدل الحضور' : language === 'hi' ? 'उपस्थिति दर' : 'attendance rate'}`,
            subtitleColor: 'text-emerald-500',
            icon: Clock,
            gradient: 'from-emerald-500 to-green-400',
          },
          {
            title: language === 'ar' ? 'الامتحانات القادمة' : language === 'hi' ? 'आगामी परीक्षाएं' : 'Upcoming Exams',
            value: stats.upcomingExams,
            subtitle: language === 'ar' ? 'قادمة' : language === 'hi' ? 'निर्धारित' : 'scheduled',
            icon: FileText,
            gradient: 'from-amber-500 to-orange-400',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="relative overflow-hidden bg-card rounded-2xl p-5 shadow-md hover:shadow-xl transition-all group"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className={cn("text-xs mt-1", stat.subtitleColor || 'text-muted-foreground')}>
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card className="overflow-hidden rounded-2xl shadow-md">
        <div className="h-1 bg-gradient-to-r from-sky-400 via-primary to-sky-600" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            {language === 'ar' ? 'جدول اليوم' : language === 'hi' ? 'आज का शेड्यूल' : "Today's Schedule"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{language === 'ar' ? 'لا توجد حصص اليوم' : language === 'hi' ? 'आज कोई कक्षा निर्धारित नहीं' : 'No classes scheduled for today'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((item, idx) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-primary min-w-[100px] bg-primary/10 px-3 py-1.5 rounded-lg text-center">
                      {item.time}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {language === 'ar' 
                          ? `الصف ${item.classes?.grade} ${item.classes?.section}`
                          : language === 'hi'
                          ? `कक्षा ${item.classes?.grade}${item.classes?.section}`
                          : `Class ${item.classes?.grade}${item.classes?.section}`}
                      </div>
                      <div className="text-sm text-muted-foreground">{item.subject}</div>
                      {item.room && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {language === 'ar' ? 'الغرفة:' : language === 'hi' ? 'कमरा:' : 'Room:'} {item.room}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/classes')} className="group-hover:bg-primary group-hover:text-primary-foreground">
                    {language === 'ar' ? 'عرض' : language === 'hi' ? 'देखें' : 'View'}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
