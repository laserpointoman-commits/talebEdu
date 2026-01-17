import { useEffect, useState, memo, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { 
  Wallet, 
  GraduationCap, 
  TrendingUp,
  UserPlus,
  Clock,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LogoLoader from "@/components/LogoLoader";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Memoized child card for performance
const ChildCard = memo(({ 
  child, 
  language, 
  onClick 
}: { 
  child: any; 
  language: string; 
  onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileTap={{ scale: 0.98 }}
  >
    <GlassCard 
      className="cursor-pointer group"
      onClick={onClick}
      hover
    >
      <GlassCardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg font-semibold text-primary-foreground">
                {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success flex items-center justify-center border-2 border-card">
              <Sparkles className="h-2 w-2 text-white" />
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">
                {language === 'ar' 
                  ? `${child.first_name_ar || child.first_name} ${child.last_name_ar || child.last_name}`
                  : `${child.first_name} ${child.last_name}`}
              </h3>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded font-medium">
                {child.grade}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {language === 'ar' ? `الفصل: ${child.class}` : language === 'hi' ? `कक्षा: ${child.class}` : `Class: ${child.class}`}
            </p>
          </div>
          
          {/* Balance & Arrow */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {language === 'ar' ? 'الرصيد' : language === 'hi' ? 'शेष' : 'Balance'}
              </p>
              <p className="font-bold text-primary text-lg">
                {child.wallet_balance || 0}
              </p>
            </div>
            <div className="p-1.5 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  </motion.div>
));

ChildCard.displayName = 'ChildCard';

// Memoized pending card
const PendingStudentCard = memo(({ 
  student, 
  language 
}: { 
  student: any; 
  language: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <GlassCard className="border-warning/30 bg-warning/5">
      <GlassCardContent className="py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {language === 'ar' 
                ? `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`
                : `${student.first_name} ${student.last_name}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'في انتظار موافقة الإدارة' : language === 'hi' ? 'प्रशासन की स्वीकृति की प्रतीक्षा' : 'Waiting for admin approval'}
            </p>
          </div>
          <Badge variant="outline" className="border-warning/50 text-warning bg-warning/10 rounded">
            {language === 'ar' ? 'قيد المراجعة' : language === 'hi' ? 'लंबित' : 'Pending'}
          </Badge>
        </div>
      </GlassCardContent>
    </GlassCard>
  </motion.div>
));

PendingStudentCard.displayName = 'PendingStudentCard';

export default function ParentDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  const loadParentData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Parallel fetch for performance
      const [profileRes, studentsRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('students').select('*').eq('parent_id', user.id).eq('approval_status', 'approved'),
        supabase.from('students').select('*').eq('parent_id', user.id).eq('approval_status', 'pending').order('submitted_at', { ascending: false })
      ]);
      
      setProfile(profileRes.data);
      setPendingStudents(pendingRes.data || []);
      
      // Load wallet balances if there are students
      const approvedStudents = studentsRes.data || [];
      if (approvedStudents.length > 0) {
        const { data: walletsData } = await supabase
          .from('wallet_balances')
          .select('*')
          .in('user_id', approvedStudents.map(s => s.id));

        const studentsWithWallets = approvedStudents.map(student => ({
          ...student,
          wallet_balance: walletsData?.find(w => w.user_id === student.id)?.balance || 0
        }));

        setChildren(studentsWithWallets);
        setTotalBalance(walletsData?.reduce((sum, w) => sum + Number(w.balance || 0), 0) || 0);
      } else {
        setChildren([]);
        setTotalBalance(0);
      }
    } catch (error) {
      console.error('Error loading parent data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('parent-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students',
        filter: `parent_id=eq.${user.id}`
      }, () => {
        loadParentData();
        toast.success(language === 'ar' ? 'تم تحديث البيانات' : language === 'hi' ? 'डेटा अपडेट हुआ' : 'Data updated');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadParentData, language]);

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Welcome Header */}
      <motion.div 
        className="text-center md:text-start"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold">
          {language === 'ar' 
            ? `مرحباً${profile?.full_name ? `, ${profile.full_name}` : ''}` 
            : language === 'hi' 
            ? `स्वागत है${profile?.full_name ? `, ${profile.full_name}` : ''}`
            : `Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {language === 'ar' 
            ? 'إدارة حسابات أطفالك بسهولة'
            : language === 'hi'
            ? 'अपने बच्चों के खातों को आसानी से प्रबंधित करें'
            : 'Manage your children\'s accounts easily'}
        </p>
      </motion.div>

      {/* Wallet Card - Corporate Design */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="bg-primary text-primary-foreground">
          <GlassCardContent className="py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/15 rounded-lg">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">
                    {language === 'ar' ? 'إجمالي رصيد المحفظة' : language === 'hi' ? 'कुल वॉलेट बैलेंस' : 'Total Wallet Balance'}
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {totalBalance.toFixed(2)}
                    <span className="text-base font-normal opacity-80 ml-1">
                      {language === 'ar' ? 'ر.ع' : 'OMR'}
                    </span>
                  </p>
                </div>
              </div>
              <Button 
                size="sm"
                onClick={() => navigate('/dashboard/wallet')}
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <TrendingUp className="h-4 w-4" />
                {language === 'ar' ? 'شحن' : language === 'hi' ? 'टॉप अप' : 'Top Up'}
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* Section Header */}
      <motion.div 
        className="flex items-center justify-between pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold">
          {language === 'ar' ? 'أطفالي' : language === 'hi' ? 'मेरे बच्चे' : 'My Children'}
        </h2>
        {profile?.expected_students_count && profile.registered_students_count < profile.expected_students_count && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard/register-student')}
            className="text-primary gap-1"
          >
            <UserPlus className="h-4 w-4" />
            {language === 'ar' ? 'إضافة' : language === 'hi' ? 'जोड़ें' : 'Add'}
          </Button>
        )}
      </motion.div>

      {/* Pending Students */}
      {pendingStudents.length > 0 && (
        <div className="space-y-3">
          {pendingStudents.map((student) => (
            <PendingStudentCard 
              key={student.id} 
              student={student} 
              language={language} 
            />
          ))}
        </div>
      )}

      {/* Approved Children Cards */}
      <div className="space-y-3">
        {children.map((child, index) => (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
          >
            <ChildCard 
              child={child} 
              language={language} 
              onClick={() => navigate(`/student/${child.id}`)}
            />
          </motion.div>
        ))}

        {/* Empty State */}
        {children.length === 0 && pendingStudents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="border-dashed border-2 border-primary/20">
              <GlassCardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-5 bg-gradient-to-br from-primary/20 to-accent/10 rounded-3xl mb-5">
                  <GraduationCap className="h-14 w-14 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === 'ar' ? 'سجل طالبك الأول' : language === 'hi' ? 'अपने पहले छात्र को पंजीकृत करें' : 'Register Your First Student'}
                </h3>
                <p className="text-muted-foreground mb-6 text-center text-sm max-w-sm">
                  {language === 'ar' 
                    ? 'ابدأ بإضافة معلومات طفلك للوصول إلى جميع خدمات المدرسة'
                    : language === 'hi'
                    ? 'सभी स्कूल सेवाओं तक पहुंचने के लिए अपने बच्चे की जानकारी जोड़कर शुरू करें'
                    : 'Start by adding your child\'s information to access all school services'}
                </p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/dashboard/register-student')}
                  className="gap-2 shadow-lg"
                >
                  <UserPlus className="h-5 w-5" />
                  {language === 'ar' ? 'تسجيل طالب' : language === 'hi' ? 'छात्र पंजीकृत करें' : 'Register Student'}
                </Button>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
