import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Bus, 
  GraduationCap, 
  MessageSquare, 
  Bell,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  ShoppingBag,
  MapPin,
  UserPlus,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LogoLoader from "@/components/LogoLoader";
import PendingStudentsList from "@/components/parent/PendingStudentsList";
import { QuickActions } from "@/components/admin/QuickActions";

export default function ParentDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadParentData();
      subscribeToUpdates();
    }
  }, [user]);

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('parent-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students',
        filter: `parent_id=eq.${user?.id}`
      }, () => {
        loadParentData();
        toast.success(language === 'ar' ? 'تم تحديث البيانات' : 'Data updated');
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notification_history',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        loadParentData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadParentData = async () => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      setProfile(profileData);

      // Load approved children only
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user?.id)
        .eq('visible_to_parent', true);

      if (studentsError) throw studentsError;
      
      // Load pending students separately
      const { data: pendingData } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user?.id)
        .eq('visible_to_parent', false);
      
      setPendingStudents(pendingData || []);
      
      // Load wallet balances separately
      const approvedStudentIds = studentsData?.map(s => s.id) || [];
      const { data: walletsData } = await supabase
        .from('wallet_balances')
        .select('*')
        .in('user_id', approvedStudentIds);

      // Merge wallet data with students
      const studentsWithWallets = studentsData?.map(student => ({
        ...student,
        wallet_balance: walletsData?.find(w => w.user_id === student.id)?.balance || 0
      })) || [];

      setChildren(studentsWithWallets);
      
      const totalBal = walletsData?.reduce((sum, w) => sum + Number(w.balance || 0), 0) || 0;
      setWalletData([{ balance: totalBal }]);

      // Load recent activity
      const today = new Date().toISOString().split('T')[0];
      
      if (approvedStudentIds.length > 0) {
        const { data: attendance } = await supabase
          .from('attendance_records')
          .select('*, students(first_name, last_name)')
          .in('student_id', approvedStudentIds)
          .eq('date', today)
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: busLogs } = await supabase
          .from('bus_boarding_logs')
          .select('*, students(first_name, last_name)')
          .in('student_id', approvedStudentIds)
          .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        const combined = [
          ...(attendance || []).map(a => ({
            id: a.id,
            type: 'attendance',
            student: `${(a.students as any)?.first_name} ${(a.students as any)?.last_name}`,
            action: a.type,
            location: a.location,
            time: new Date(a.created_at!).toLocaleTimeString()
          })),
          ...(busLogs || []).map(b => ({
            id: b.id,
            type: 'bus',
            student: `${(b.students as any)?.first_name} ${(b.students as any)?.last_name}`,
            action: b.action,
            location: b.location,
            time: new Date(b.created_at!).toLocaleTimeString()
          }))
        ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);

        setRecentActivity(combined);
      }

    } catch (error) {
      console.error('Error loading parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  const quickActions = [
    {
      icon: Bus,
      titleEn: "Track Bus",
      titleAr: "تتبع الحافلة",
      descEn: "Live location tracking",
      descAr: "تتبع الموقع المباشر",
      onClick: () => navigate('/dashboard/bus-tracking'),
      color: "text-blue-500"
    },
    {
      icon: GraduationCap,
      titleEn: "Grades",
      titleAr: "الدرجات",
      descEn: "View academic progress",
      descAr: "عرض التقدم الأكاديمي",
      onClick: () => navigate('/dashboard/grades'),
      color: "text-purple-500"
    },
    {
      icon: Calendar,
      titleEn: "Schedule",
      titleAr: "الجدول",
      descEn: "Class timetable",
      descAr: "جدول الحصص",
      onClick: () => navigate('/dashboard/schedule'),
      color: "text-green-500"
    },
    {
      icon: ShoppingBag,
      titleEn: "Canteen Controls",
      titleAr: "ضوابط المقصف",
      descEn: "Manage what your child can buy",
      descAr: "إدارة ما يمكن لطفلك شراؤه",
      onClick: () => navigate('/dashboard/canteen-controls'),
      color: "text-orange-500"
    },
    {
      icon: MessageSquare,
      titleEn: "Messages",
      titleAr: "الرسائل",
      descEn: "Chat with teachers",
      descAr: "محادثة المعلمين",
      onClick: () => navigate('/dashboard/messages'),
      color: "text-cyan-500"
    }
  ];

  const totalBalance = walletData.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'لوحة ولي الأمر' : 'Parent Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? `مرحباً بعودتك! إدارة ${children.length} ${children.length === 1 ? 'طفل معتمد' : 'أطفال معتمدين'}`
            : `Welcome back! Managing ${children.length} approved ${children.length === 1 ? 'child' : 'children'}`}
        </p>
      </div>

      {/* Quick Actions - At the top */}
      <QuickActions />

      {/* Pending Students Section */}
      {pendingStudents.length > 0 && (
        <PendingStudentsList 
          students={pendingStudents} 
          onRefresh={loadParentData}
        />
      )}

      {/* Children Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => (
          <Card key={child.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {language === 'ar' 
                      ? `${child.first_name_ar || child.first_name} ${child.last_name_ar || child.last_name}`
                      : `${child.first_name} ${child.last_name}`}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? `الصف: ${child.class}` : `Class: ${child.class}`}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{child.grade}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'رصيد المحفظة' : 'Wallet Balance'}
                </span>
                <span className="font-bold text-lg">
                  {child.wallet_balance || 0} {language === 'ar' ? 'ريال' : 'OMR'}
                </span>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate(`/student/${child.id}`)}
              >
                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Add Another Student Card */}
        {children.length > 0 && profile?.expected_students_count && profile.registered_students_count < profile.expected_students_count && (
          <Card className="border-dashed border-2 hover:border-primary hover:bg-accent/50 transition-all cursor-pointer" onClick={() => navigate('/dashboard/register-student')}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-primary mb-4" />
              <p className="font-semibold text-lg mb-2">
                {language === 'ar' ? 'تسجيل طالب آخر' : 'Register Another Student'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? `${profile.expected_students_count - profile.registered_students_count} متبقي`
                  : `${profile.expected_students_count - profile.registered_students_count} remaining`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {children.length === 0 && (
          <Card className="col-span-full bg-accent/30">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-20 w-20 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-2">
                {language === 'ar' 
                  ? pendingStudents.length > 0 ? 'طلابك قيد المراجعة' : 'سجل طالبك الأول'
                  : pendingStudents.length > 0 ? 'Your Students Under Review' : 'Register Your First Student'}
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {language === 'ar' 
                  ? pendingStudents.length > 0
                    ? 'طلابك قيد المراجعة من قبل الإدارة. سيظهرون هنا بعد الموافقة.'
                    : 'ابدأ بإضافة معلومات طفلك للوصول إلى جميع خدمات المدرسة'
                  : pendingStudents.length > 0
                    ? 'Your students are under review by administration. They will appear here after approval.'
                    : 'Start by adding your child\'s information to access all school services'}
              </p>
              {(!pendingStudents.length || (profile?.expected_students_count && profile.registered_students_count < profile.expected_students_count)) && (
                <Button size="lg" onClick={() => navigate('/dashboard/register-student')}>
                  <UserPlus className="mr-2 h-5 w-5" />
                  {language === 'ar' ? 'تسجيل طالب' : 'Register Student'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Total Balance Card - Compact */}
      {children.length > 0 && (
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6" />
                <div>
                  <p className="text-sm opacity-80">
                    {language === 'ar' ? 'إجمالي الرصيد' : 'Total Balance'}
                  </p>
                  <p className="text-2xl font-bold">
                    {totalBalance.toFixed(2)} {language === 'ar' ? 'ريال' : 'OMR'}
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate('/dashboard/wallet')}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {language === 'ar' ? 'شحن' : 'Top Up'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {language === 'ar' ? 'لا توجد أنشطة حديثة' : 'No recent activity'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}