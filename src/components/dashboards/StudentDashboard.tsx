import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { QuickActions } from '@/components/admin/QuickActions';
import { motion } from 'framer-motion';

export default function StudentDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] bg-[length:20px_20px]" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {language === 'ar' 
              ? `مرحباً بعودتك، ${user?.email?.split('@')[0] || 'الطالب'}!`
              : language === 'hi'
              ? `वापसी पर स्वागत है, ${user?.email?.split('@')[0] || 'छात्र'}!`
              : `Welcome back, ${user?.email?.split('@')[0] || 'Student'}!`}
          </h2>
          <p className="mt-1 text-white/80 text-sm md:text-base">
            {language === 'ar' 
              ? 'رحلتك التعليمية تستمر هنا' 
              : language === 'hi'
              ? 'आपकी सीखने की यात्रा यहाँ जारी है'
              : 'Your learning journey continues here'}
          </p>
        </div>
      </motion.div>

      {/* Quick Actions - At the top */}
      <QuickActions />
    </div>
  );
}