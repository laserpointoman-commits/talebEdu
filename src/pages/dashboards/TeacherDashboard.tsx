import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardGlass } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const quickActions = [
    {
      icon: Scan,
      titleEn: "NFC Attendance",
      titleAr: "مسح الحضور",
      descEn: "Mark attendance with NFC",
      descAr: "تسجيل الحضور بالسوار الذكي",
      onClick: () => navigate('/dashboard/nfc-attendance'),
      color: "text-blue-500"
    },
    {
      icon: Award,
      titleEn: "Post Grades",
      titleAr: "رفع الدرجات",
      descEn: "Enter student grades",
      descAr: "إدخال درجات الطلاب",
      onClick: () => navigate('/dashboard/grades'),
      color: "text-green-500"
    },
    {
      icon: Calendar,
      titleEn: "Exams",
      titleAr: "الامتحانات",
      descEn: "Manage exams schedule",
      descAr: "إدارة جدول الامتحانات",
      onClick: () => navigate('/dashboard/exams'),
      color: "text-purple-500"
    },
    {
      icon: BookOpen,
      titleEn: "Homework",
      titleAr: "الواجبات",
      descEn: "Assign homework",
      descAr: "تعيين واجبات",
      onClick: () => navigate('/dashboard/homework'),
      color: "text-orange-500"
    },
    {
      icon: Users,
      titleEn: "My Classes",
      titleAr: "فصولي",
      descEn: "View class lists",
      descAr: "عرض قوائم الفصول",
      onClick: () => navigate('/dashboard/classes'),
      color: "text-cyan-500"
    },
    {
      icon: MessageSquare,
      titleEn: "Messages",
      titleAr: "الرسائل",
      descEn: "Chat with parents",
      descAr: "محادثة أولياء الأمور",
      onClick: () => navigate('/dashboard/messages'),
      color: "text-pink-500"
    }
  ];

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'لوحة المعلم' : 'Teacher Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'إدارة الفصول والطلاب' : 'Manage your classes and students'}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardGlass className="hover-lift shadow-glow-soft animate-scale-in" style={{ animationDelay: '0ms' }}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              {language === 'ar' ? 'إجمالي الطلاب' : 'Total Students'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
            <p className="text-sm text-muted-foreground">
              {stats.totalClasses} {language === 'ar' ? 'فصول' : 'classes'}
            </p>
          </CardContent>
        </CardGlass>

        <CardGlass className="hover-lift shadow-glow-soft animate-scale-in" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {language === 'ar' ? 'الحضور اليوم' : "Today's Attendance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayAttendance}</div>
            <p className="text-sm text-green-500">
              {stats.attendanceRate}% {language === 'ar' ? 'معدل الحضور' : 'attendance rate'}
            </p>
          </CardContent>
        </CardGlass>

        <CardGlass className="hover-lift shadow-glow-soft animate-scale-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {language === 'ar' ? 'الامتحانات القادمة' : 'Upcoming Exams'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.upcomingExams}</div>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'قادمة' : 'scheduled'}
            </p>
          </CardContent>
        </CardGlass>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <CardGlass 
              key={idx}
              className="cursor-pointer hover-lift shadow-glow-soft transition-all duration-300 hover:scale-105 animate-scale-in"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={action.onClick}
            >
              <CardHeader>
                <div className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 ${action.color} transition-transform hover:scale-110`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">
                  {language === 'ar' ? action.titleAr : action.titleEn}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? action.descAr : action.descEn}
                </CardDescription>
              </CardHeader>
            </CardGlass>
          ))}
        </div>
      </div>

      {/* Today's Schedule */}
      <CardGlass className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === 'ar' ? 'جدول اليوم' : "Today's Schedule"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ar' ? 'لا توجد حصص اليوم' : 'No classes scheduled for today'}
            </div>
          ) : (
            <div className="space-y-4">
              {todaySchedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 hover-lift transition-all">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-primary min-w-[120px]">{item.time}</div>
                    <div>
                      <div className="font-medium">
                        {language === 'ar' 
                          ? `الصف ${item.classes?.grade} ${item.classes?.section}`
                          : `Class ${item.classes?.grade}${item.classes?.section}`}
                      </div>
                      <div className="text-sm text-muted-foreground">{item.subject}</div>
                      {item.room && (
                        <div className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'الغرفة:' : 'Room:'} {item.room}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard/classes')}>
                    {language === 'ar' ? 'عرض' : 'View'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </CardGlass>
    </div>
  );
}
