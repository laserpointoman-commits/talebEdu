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
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import LogoLoader from "@/components/LogoLoader";

export default function ParentDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadParentData();
    }
  }, [user]);

  const loadParentData = async () => {
    try {
      // Load children using OLD database structure
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user?.id);

      if (studentsError) throw studentsError;
      
      // Load wallet balances separately
      const studentIds = studentsData?.map(s => s.id) || [];
      const { data: walletsData } = await supabase
        .from('wallet_balances')
        .select('*')
        .in('user_id', studentIds);

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

  const quickActions = [
    {
      icon: Wallet,
      titleEn: "Top Up Wallet",
      titleAr: "شحن المحفظة",
      descEn: "Add money to student wallet",
      descAr: "إضافة أموال لمحفظة الطالب",
      onClick: () => navigate('/dashboard/wallet'),
      color: "text-green-500"
    },
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
      color: "text-orange-500"
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
          {language === 'ar' ? 'مرحباً بعودتك!' : 'Welcome back!'}
        </p>
      </div>

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

        {children.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد بيانات طلاب' : 'No students linked'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {language === 'ar' ? 'إجمالي الرصيد' : 'Total Balance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">
            {totalBalance.toFixed(2)} {language === 'ar' ? 'ريال' : 'OMR'}
          </div>
          <p className="text-primary-foreground/80">
            {language === 'ar' 
              ? `${children.length} ${children.length === 1 ? 'طالب' : 'طلاب'}`
              : `${children.length} ${children.length === 1 ? 'student' : 'students'}`}
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <Card 
              key={idx} 
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={action.onClick}
            >
              <CardHeader>
                <div className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">
                  {language === 'ar' ? action.titleAr : action.titleEn}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? action.descAr : action.descEn}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

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