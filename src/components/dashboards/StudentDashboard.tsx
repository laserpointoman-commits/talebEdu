import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  Calendar,
  Award,
  ClipboardList,
  FileText,
  Wallet,
  Package,
  Users,
  MessageCircle,
  Home
} from 'lucide-react';

export default function StudentDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const allActions = [
    { 
      title: 'Social Feed',
      titleAr: 'المنشورات',
      icon: Home, 
      link: '/dashboard/social/feed',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      title: 'Friends',
      titleAr: 'الأصدقاء',
      icon: Users, 
      link: '/dashboard/social/friends',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    { 
      title: 'Messages',
      titleAr: 'الرسائل',
      icon: MessageCircle, 
      link: '/dashboard/social/friends',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    { 
      title: 'Schedule',
      titleAr: 'الجدول',
      icon: Calendar, 
      link: '/dashboard/schedule',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    { 
      title: 'Exams', 
      titleAr: 'الامتحانات',
      icon: ClipboardList, 
      link: '/dashboard/exams',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    { 
      title: 'Homework', 
      titleAr: 'الواجبات',
      icon: FileText, 
      link: '/dashboard/homework',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    { 
      title: 'Grades', 
      titleAr: 'الدرجات',
      icon: Award, 
      link: '/dashboard/grades',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      title: 'Wallet', 
      titleAr: 'المحفظة',
      icon: Wallet, 
      link: '/dashboard/wallet',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    { 
      title: 'Canteen', 
      titleAr: 'المقصف',
      icon: Package, 
      link: '/dashboard/canteen',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  const handleActionClick = (action: any) => {
    if (action.link) {
      navigate(action.link);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-3xl font-bold tracking-tight">
          {language === 'en' 
            ? `Welcome back, ${user?.email?.split('@')[0] || 'Student'}!` 
            : `مرحباً بعودتك، ${user?.email?.split('@')[0] || 'الطالب'}!`}
        </h2>
        <p className="text-xs md:text-base text-muted-foreground mb-3 md:mb-6">
          {language === 'en' 
            ? 'Your learning journey continues here' 
            : 'رحلتك التعليمية تستمر هنا'}
        </p>
      </div>

      {/* All Action Buttons */}
      <div>
        <h3 className="text-sm md:text-lg font-semibold mb-3 md:mb-4">
          {language === 'en' ? 'Quick Actions' : 'إجراءات سريعة'}
        </h3>
        <div className="grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {allActions.map((action, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group min-h-[100px] md:min-h-[120px]"
              onClick={() => handleActionClick(action)}
            >
              <CardContent className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 h-full">
                <div className={`p-3 md:p-4 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-5 w-5 md:h-6 md:w-6 ${action.color}`} />
                </div>
                <p className="text-xs md:text-sm font-medium text-center line-clamp-2">
                  {language === 'en' ? action.title : action.titleAr}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}