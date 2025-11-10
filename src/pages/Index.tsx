import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe, ChevronRight } from 'lucide-react';
import HeroSection from '@/components/landing/HeroSection';
import BentoGrid from '@/components/landing/BentoGrid';
import AnimatedStats from '@/components/landing/AnimatedStats';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const { language, setLanguage, t, dir } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect to dashboard if user is on the index page and authenticated
    if (isAuthenticated && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className={`min-h-screen bg-background ${dir === 'rtl' ? 'font-cairo' : ''}`} dir={dir}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10">
                <span className="text-2xl font-bold text-primary">t</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TalebEdu</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="gap-2"
              >
                <Globe className="h-4 w-4" />
                {language === 'en' ? 'العربية' : 'English'}
              </Button>
              
              <Button onClick={() => navigate('/auth')} className="gap-2">
                {t('login')}
                <ChevronRight className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Bento Grid Features */}
      <BentoGrid />

      {/* Animated Stats */}
      <AnimatedStats />

      {/* CTA Section - Immersive */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              background: 'linear-gradient(135deg, hsl(211 100% 50%), hsl(186 76% 52%), hsl(199 89% 48%))',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 8s ease infinite'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-4xl text-center">
          <div className="glass p-12 rounded-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              {language === 'en' ? 'Ready to Transform Your School?' : 'جاهز لتحويل مدرستك؟'}
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {language === 'en'
                ? 'Join thousands of schools already using TalebEdu to create a better learning environment'
                : 'انضم لآلاف المدارس التي تستخدم طالب إدو لخلق بيئة تعليمية أفضل'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="text-lg px-10 py-6 h-auto group"
              >
                {language === 'en' ? 'Get Started Free' : 'ابدأ مجانًا'}
                <ChevronRight className={`w-5 h-5 transition-transform group-hover:${dir === 'rtl' ? '-translate-x-1' : 'translate-x-1'}`} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 h-auto"
              >
                {language === 'en' ? 'Contact Sales' : 'اتصل بالمبيعات'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10">
                <span className="text-2xl font-bold text-primary">t</span>
              </div>
              <div>
                <div className="font-bold text-lg">TalebEdu</div>
                <div className="text-sm text-muted-foreground">
                  © 2025 {language === 'en' ? 'All rights reserved' : 'جميع الحقوق محفوظة'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                {language === 'en' ? 'Privacy' : 'الخصوصية'}
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                {language === 'en' ? 'Terms' : 'الشروط'}
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                {language === 'en' ? 'Support' : 'الدعم'}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
