import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  GraduationCap, 
  MessageSquare, 
  TrendingUp,
  ArrowUpRight,
  UserPlus,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LogoLoader from "@/components/LogoLoader";

export default function ParentDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

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
        .eq('approval_status', 'approved');

      if (studentsError) throw studentsError;
      
      // Load pending students separately (waiting for admin approval)
      const { data: pendingData } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user?.id)
        .eq('approval_status', 'pending')
        .order('submitted_at', { ascending: false });
      
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

    } catch (error) {
      console.error('Error loading parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  const totalBalance = walletData.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center md:text-start">
        <h1 className="text-2xl md:text-3xl font-bold">
          {language === 'ar' 
            ? `مرحباً${profile?.full_name ? `, ${profile.full_name}` : ''}` 
            : `Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {language === 'ar' 
            ? 'إدارة حسابات أطفالك بسهولة'
            : 'Manage your children\'s accounts easily'}
        </p>
      </div>

      {/* Parent Wallet Card */}
      <Card className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-foreground/20 rounded-full">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">
                  {language === 'ar' ? 'إجمالي رصيد المحفظة' : 'Total Wallet Balance'}
                </p>
                <p className="text-3xl font-bold">
                  {totalBalance.toFixed(2)} <span className="text-lg font-normal opacity-80">{language === 'ar' ? 'ر.ع' : 'OMR'}</span>
                </p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/dashboard/wallet')}
              className="gap-2 shadow-md"
            >
              <TrendingUp className="h-4 w-4" />
              {language === 'ar' ? 'شحن' : 'Top Up'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messenger Quick Access */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary/50"
        onClick={() => navigate('/dashboard/messages')}
      >
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-full">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">
                  {language === 'ar' ? 'الرسائل' : 'Messages'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'تواصل مع المعلمين والإدارة' : 'Chat with teachers & administration'}
                </p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Section Title */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-semibold">
          {language === 'ar' ? 'أطفالي' : 'My Children'}
        </h2>
        {profile?.expected_students_count && profile.registered_students_count < profile.expected_students_count && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard/register-student')}
            className="text-primary"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {language === 'ar' ? 'إضافة' : 'Add'}
          </Button>
        )}
      </div>

      {/* Pending Students */}
      {pendingStudents.length > 0 && (
        <div className="space-y-3">
          {pendingStudents.map((student) => (
            <Card key={student.id} className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {language === 'ar' 
                        ? `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`
                        : `${student.first_name} ${student.last_name}`}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {language === 'ar' ? 'في انتظار موافقة الإدارة' : 'Waiting for admin approval'}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30">
                    {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approved Children Cards */}
      <div className="space-y-4">
        {children.map((child) => (
          <Card 
            key={child.id} 
            className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/30"
            onClick={() => navigate(`/student/${child.id}`)}
          >
            <CardContent className="py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">
                      {language === 'ar' 
                        ? `${child.first_name_ar || child.first_name} ${child.last_name_ar || child.last_name}`
                        : `${child.first_name} ${child.last_name}`}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {child.grade}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? `الفصل: ${child.class}` : `Class: ${child.class}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'الرصيد' : 'Balance'}
                  </p>
                  <p className="font-bold text-primary">
                    {child.wallet_balance || 0} {language === 'ar' ? 'ر.ع' : 'OMR'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {children.length === 0 && pendingStudents.length === 0 && (
          <Card className="bg-accent/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ar' ? 'سجل طالبك الأول' : 'Register Your First Student'}
              </h3>
              <p className="text-muted-foreground mb-6 text-center text-sm max-w-sm">
                {language === 'ar' 
                  ? 'ابدأ بإضافة معلومات طفلك للوصول إلى جميع خدمات المدرسة'
                  : 'Start by adding your child\'s information to access all school services'}
              </p>
              <Button size="lg" onClick={() => navigate('/dashboard/register-student')}>
                <UserPlus className="mr-2 h-5 w-5" />
                {language === 'ar' ? 'تسجيل طالب' : 'Register Student'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
