import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  GraduationCap,
  FileText,
  CreditCard,
  Bus,
  Clock,
  ShoppingBag,
  Store,
  Wallet,
  User,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  first_name_ar: string | null;
  last_name_ar: string | null;
  grade: string;
  class: string;
  profile_image: string | null;
  nfc_id: string | null;
}

interface FeatureCard {
  id: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

export default function StudentDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    if (studentId && user) {
      loadStudentData();
    }
  }, [studentId, user]);

  const loadStudentData = async () => {
    try {
      // Verify parent owns this student
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('parent_id', user?.id)
        .single();

      if (error || !studentData) {
        navigate('/dashboard');
        return;
      }

      setStudent(studentData);

      // Load wallet balance
      const { data: wallet } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', studentId)
        .single();
      
      setWalletBalance(wallet?.balance || 0);

      // Load today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1);

      if (attendance?.length) {
        setTodayAttendance(attendance[0]);
      }

    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const featureCards: FeatureCard[] = [
    {
      id: 'schedule',
      titleEn: 'Class Schedule',
      titleAr: 'جدول الحصص',
      descEn: 'View class timetable',
      descAr: 'عرض جدول الحصص',
      icon: Calendar,
      href: `/student/${studentId}/schedule`,
      color: 'bg-blue-500'
    },
    {
      id: 'grades',
      titleEn: 'Grades',
      titleAr: 'الدرجات',
      descEn: 'Academic performance',
      descAr: 'الأداء الأكاديمي',
      icon: GraduationCap,
      href: `/student/${studentId}/grades`,
      color: 'bg-purple-500'
    },
    {
      id: 'exams',
      titleEn: 'Exams',
      titleAr: 'الامتحانات',
      descEn: 'Exam schedule & results',
      descAr: 'جدول ونتائج الامتحانات',
      icon: FileText,
      href: `/student/${studentId}/exams`,
      color: 'bg-red-500'
    },
    {
      id: 'fees',
      titleEn: 'Fees',
      titleAr: 'الرسوم',
      descEn: 'Fee payment status',
      descAr: 'حالة دفع الرسوم',
      icon: CreditCard,
      href: `/student/${studentId}/fees`,
      color: 'bg-green-500'
    },
    {
      id: 'bus',
      titleEn: 'School Bus',
      titleAr: 'حافلة المدرسة',
      descEn: 'Track bus location',
      descAr: 'تتبع موقع الحافلة',
      icon: Bus,
      href: `/student/${studentId}/bus`,
      color: 'bg-orange-500'
    },
    {
      id: 'attendance',
      titleEn: 'Attendance',
      titleAr: 'الحضور',
      descEn: 'Attendance history',
      descAr: 'سجل الحضور',
      icon: Clock,
      href: `/student/${studentId}/attendance`,
      color: 'bg-teal-500'
    },
    {
      id: 'canteen',
      titleEn: 'Canteen',
      titleAr: 'المقصف',
      descEn: 'Manage canteen access',
      descAr: 'إدارة صلاحيات المقصف',
      icon: ShoppingBag,
      href: `/student/${studentId}/canteen`,
      color: 'bg-yellow-500'
    },
    {
      id: 'store',
      titleEn: 'School Store',
      titleAr: 'متجر المدرسة',
      descEn: 'Purchase uniforms & supplies',
      descAr: 'شراء الزي والمستلزمات',
      icon: Store,
      href: `/student/${studentId}/store`,
      color: 'bg-pink-500'
    },
    {
      id: 'wallet',
      titleEn: 'E-Wallet',
      titleAr: 'المحفظة الإلكترونية',
      descEn: 'Manage spending limits',
      descAr: 'إدارة حدود الإنفاق',
      icon: Wallet,
      href: `/student/${studentId}/wallet`,
      color: 'bg-indigo-500'
    }
  ];

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <User className="h-20 w-20 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold mb-2">
          {language === 'ar' ? 'الطالب غير موجود' : 'Student Not Found'}
        </h2>
        <Button onClick={() => navigate('/dashboard')}>
          {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
        </Button>
      </div>
    );
  }

  const studentName = language === 'ar' 
    ? `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`
    : `${student.first_name} ${student.last_name}`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{studentName}</h1>
          <p className="text-muted-foreground">
            {student.grade} - {student.class}
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              {student.profile_image ? (
                <img 
                  src={student.profile_image} 
                  alt={studentName}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الصف' : 'Grade'}
                </p>
                <p className="font-semibold">{student.grade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الفصل' : 'Class'}
                </p>
                <p className="font-semibold">{student.class}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'رصيد المحفظة' : 'Wallet Balance'}
                </p>
                <p className="font-semibold text-green-600">
                  {walletBalance.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الحضور اليوم' : "Today's Status"}
                </p>
                <Badge variant={todayAttendance ? 'default' : 'secondary'}>
                  {todayAttendance 
                    ? (language === 'ar' ? 'حاضر' : 'Present')
                    : (language === 'ar' ? 'غير مسجل' : 'Not Recorded')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {featureCards.map((feature) => (
          <Card 
            key={feature.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
            onClick={() => navigate(feature.href)}
          >
            <CardContent className="p-6">
              <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">
                {language === 'ar' ? feature.titleAr : feature.titleEn}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? feature.descAr : feature.descEn}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}