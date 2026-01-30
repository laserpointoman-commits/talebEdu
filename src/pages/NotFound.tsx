import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Auto-redirect to home after 3 seconds
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [location.pathname, navigate]);

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-2xl font-semibold">
          {t('Page Not Found', 'الصفحة غير موجودة', 'पृष्ठ नहीं मिला')}
        </p>
        <p className="text-muted-foreground">
          {t('Redirecting to home in 3 seconds...', 'إعادة التوجيه للرئيسية في 3 ثوانٍ...', '3 सेकंड में होम पर रीडायरेक्ट हो रहा है...')}
        </p>
        <Button onClick={() => navigate('/', { replace: true })} className="gap-2">
          <Home className="h-4 w-4" />
          {t('Go Home Now', 'الذهاب للرئيسية الآن', 'अभी होम जाएं')}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
