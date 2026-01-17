import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { QuickActions } from '@/components/admin/QuickActions';

export default function StudentDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Quick Actions - At the top */}
      <QuickActions />

      <div>
        <h2 className="text-xl md:text-3xl font-bold tracking-tight">
          {language === 'ar' 
            ? `مرحباً بعودتك، ${user?.email?.split('@')[0] || 'الطالب'}!`
            : language === 'hi'
            ? `वापसी पर स्वागत है, ${user?.email?.split('@')[0] || 'छात्र'}!`
            : `Welcome back, ${user?.email?.split('@')[0] || 'Student'}!`}
        </h2>
        <p className="text-xs md:text-base text-muted-foreground mb-3 md:mb-6">
          {language === 'ar' 
            ? 'رحلتك التعليمية تستمر هنا' 
            : language === 'hi'
            ? 'आपकी सीखने की यात्रा यहाँ जारी है'
            : 'Your learning journey continues here'}
        </p>
      </div>
    </div>
  );
}