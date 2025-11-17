import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { QuickActions } from '@/components/admin/QuickActions';

export default function StudentDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

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

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}