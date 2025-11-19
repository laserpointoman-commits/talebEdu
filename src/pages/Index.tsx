import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { ParallaxSection } from '@/components/animations/ParallaxSection';
import { StaggeredReveal, StaggerItem } from '@/components/animations/StaggeredReveal';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Bus, 
  ShoppingBag, 
  Users, 
  MessageSquare, 
  Calendar,
  Wallet,
  Bell,
  BookOpen,
  ScanLine,
  GraduationCap,
  BarChart3,
  Shield,
  Smartphone,
  Globe,
  ChevronRight,
  Check,
  Clock,
  MapPin,
  Heart,
  Star,
  Zap
} from 'lucide-react';
// Logo removed - using text-based logo instead

const Index = () => {
  const { isAuthenticated } = useAuth();
  const { language, setLanguage, t, dir } = useLanguage();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Only redirect to dashboard if user is on the index page and authenticated
    // Don't redirect if they're trying to access other pages like parent-registration
    if (isAuthenticated && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: ScanLine,
      titleEn: "NFC Wristband Attendance",
      titleAr: "حضور الطلاب عبر سوار NFC",
      descEn: "Automated student attendance tracking with NFC wristband technology",
      descAr: "تتبع حضور الطلاب تلقائياً باستخدام تقنية سوار NFC"
    },
    {
      icon: Bus,
      titleEn: "School Bus Tracking",
      titleAr: "تتبع الحافلة المدرسية",
      descEn: "Real-time GPS tracking of school buses for parent peace of mind",
      descAr: "تتبع موقع الحافلات المدرسية في الوقت الفعلي لطمأنة الأهل"
    },
    {
      icon: ShoppingBag,
      titleEn: "Canteen & Store",
      titleAr: "المقصف والمتجر",
      descEn: "Cashless purchases with automatic wallet deduction",
      descAr: "مشتريات بدون نقود مع خصم تلقائي من المحفظة"
    },
    {
      icon: Wallet,
      titleEn: "Digital Wallet",
      titleAr: "المحفظة الرقمية",
      descEn: "Secure student allowance management and transactions",
      descAr: "إدارة آمنة لمصروف الطالب والمعاملات المالية"
    },
    {
      icon: MessageSquare,
      titleEn: "In-App Communication",
      titleAr: "التواصل داخل التطبيق",
      descEn: "Direct messaging between parents, teachers, and students",
      descAr: "رسائل مباشرة بين الأهل والمعلمين والطلاب"
    },
    {
      icon: Calendar,
      titleEn: "Academic Calendar",
      titleAr: "التقويم الأكاديمي",
      descEn: "Exams, grades, and schedule management in one place",
      descAr: "الامتحانات والدرجات وجدول الحصص في مكان واحد"
    },
    {
      icon: BookOpen,
      titleEn: "Homework Tracking",
      titleAr: "متابعة الواجبات",
      descEn: "Digital homework assignments and submission tracking",
      descAr: "واجبات رقمية ومتابعة التسليم"
    },
    {
      icon: BarChart3,
      titleEn: "Performance Analytics",
      titleAr: "تحليل الأداء",
      descEn: "Comprehensive reports on student progress and grades",
      descAr: "تقارير شاملة عن تقدم الطالب والدرجات"
    },
    {
      icon: Bell,
      titleEn: "Smart Notifications",
      titleAr: "إشعارات ذكية",
      descEn: "Real-time alerts for important school updates",
      descAr: "تنبيهات فورية للتحديثات المدرسية المهمة"
    },
    {
      icon: Shield,
      titleEn: "Secure & Private",
      titleAr: "آمن وخاص",
      descEn: "Bank-level security for all transactions and data",
      descAr: "أمان بمستوى البنوك لجميع المعاملات والبيانات"
    }
  ];

  const userRoles = [
    {
      icon: Heart,
      titleEn: "Parent Portal",
      titleAr: "بوابة ولي الأمر",
      features: [
        { en: "Monitor wallet & transactions", ar: "مراقبة المحفظة والمعاملات" },
        { en: "Track student grades", ar: "متابعة درجات الطالب" },
        { en: "Real-time bus location", ar: "موقع الحافلة الآني" },
        { en: "Chat with teachers", ar: "محادثة المعلمين" }
      ]
    },
    {
      icon: GraduationCap,
      titleEn: "Teacher Panel",
      titleAr: "لوحة المعلم",
      features: [
        { en: "Post grades & exams", ar: "نشر الدرجات والامتحانات" },
        { en: "NFC attendance scan", ar: "مسح الحضور NFC" },
        { en: "Class management", ar: "إدارة الفصل" },
        { en: "Direct parent communication", ar: "تواصل مباشر مع الأهل" }
      ]
    },
    {
      icon: Shield,
      titleEn: "Admin Dashboard",
      titleAr: "لوحة المدير",
      features: [
        { en: "Complete system control", ar: "تحكم كامل بالنظام" },
        { en: "User management", ar: "إدارة المستخدمين" },
        { en: "Financial reports", ar: "التقارير المالية" },
        { en: "School-wide analytics", ar: "تحليلات شاملة" }
      ]
    },
    {
      icon: Bus,
      titleEn: "Driver Interface",
      titleAr: "واجهة السائق",
      features: [
        { en: "Route optimization", ar: "تحسين المسار" },
        { en: "Student pickup alerts", ar: "تنبيهات استلام الطلاب" },
        { en: "Real-time navigation", ar: "ملاحة فورية" },
        { en: "Incident reporting", ar: "الإبلاغ عن الحوادث" }
      ]
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${dir === 'rtl' ? 'font-cairo' : ''}`} dir={dir}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-light border-b border-border/30 shadow-glow-sm' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 127, 255, 0.1)' }}>
                <span className="text-3xl font-bold" style={{ color: '#007FFF' }}>t</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">TalebEdu</h1>
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'Smart School Management' : 'إدارة مدرسية ذكية'}
                </p>
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
      <section className="relative pt-32 pb-20 overflow-hidden">
        <ParallaxSection speed={-0.3}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        </ParallaxSection>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <ScrollReveal direction="down" delay={0.1}>
              <Badge className="px-4 py-2 text-sm" variant="secondary">
                <Zap className="h-4 w-4 mr-2" />
                {language === 'en' ? 'The Future of School Management' : 'مستقبل الإدارة المدرسية'}
              </Badge>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={0.2}>
              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                {language === 'en' ? (
                  <>Complete School Management<br />in Your Pocket</>
                ) : (
                  <>إدارة مدرسية متكاملة<br />في جيبك</>
                )}
              </h2>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={0.3}>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {language === 'en' 
                  ? 'Revolutionize your school with NFC attendance, real-time tracking, digital payments, and seamless communication - all in one platform.'
                  : 'أحدث ثورة في مدرستك مع حضور NFC، تتبع فوري، مدفوعات رقمية، وتواصل سلس - كل ذلك في منصة واحدة.'
                }
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-lg px-8">
                  {language === 'en' ? 'Get Started' : 'ابدأ الآن'}
                  <ChevronRight className={`h-5 w-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                  {language === 'en' ? 'Learn More' : 'اعرف المزيد'}
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <ParallaxSection speed={0.2}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        </ParallaxSection>
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center space-y-4 mb-16">
              <Badge variant="secondary" className="px-4 py-2">
                {language === 'en' ? 'Powerful Features' : 'مميزات قوية'}
              </Badge>
              <h3 className="text-4xl font-bold">
                {language === 'en' ? 'Everything You Need, One Platform' : 'كل ما تحتاجه، منصة واحدة'}
              </h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {language === 'en'
                  ? 'Built for modern schools with cutting-edge technology'
                  : 'مصمم للمدارس الحديثة بأحدث التقنيات'
                }
              </p>
            </div>
          </ScrollReveal>

          <StaggeredReveal staggerDelay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <StaggerItem key={idx}>
                  <Card className="glass hover:shadow-glow-sm transition-all duration-300 hover:-translate-y-1 border-border/30 hover:border-primary/30 h-full">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center mb-4 border border-primary/20">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">
                        {language === 'en' ? feature.titleEn : feature.titleAr}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {language === 'en' ? feature.descEn : feature.descAr}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </StaggerItem>
              ))}
            </div>
          </StaggeredReveal>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 relative overflow-hidden">
        <ParallaxSection speed={-0.2}>
          <div className="absolute inset-0 bg-gradient-to-tl from-accent/5 to-transparent" />
        </ParallaxSection>
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center space-y-4 mb-16">
              <Badge variant="secondary" className="px-4 py-2">
                {language === 'en' ? 'For Everyone' : 'للجميع'}
              </Badge>
              <h3 className="text-4xl font-bold">
                {language === 'en' ? 'Tailored for Every User' : 'مصمم لكل مستخدم'}
              </h3>
            </div>
          </ScrollReveal>

          <StaggeredReveal staggerDelay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {userRoles.map((role, idx) => (
                <StaggerItem key={idx}>
                  <Card className="glass border-border/30 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300 hover-lift h-full">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-glow-sm">
                          <role.icon className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl">
                          {language === 'en' ? role.titleEn : role.titleAr}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {role.features.map((feature, fIdx) => (
                          <motion.li 
                            key={fIdx} 
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: fIdx * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                              {language === 'en' ? feature.en : feature.ar}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </div>
          </StaggeredReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary animate-gradient" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
        <div className="container mx-auto px-4 text-center space-y-8 relative z-10">
          <ScrollReveal direction="scale" delay={0.2}>
            <div className="max-w-3xl mx-auto space-y-6 glass-heavy p-12 rounded-3xl border-border/30">
              <motion.h3 
                className="text-4xl md:text-5xl font-bold text-foreground"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                viewport={{ once: true }}
              >
                {language === 'en' ? 'Ready to Transform Your School?' : 'جاهز لتحويل مدرستك؟'}
              </motion.h3>
              <motion.p 
                className="text-xl text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                viewport={{ once: true }}
              >
                {language === 'en'
                  ? 'Join thousands of schools already using TalebEdu to create a better learning environment'
                  : 'انضم لآلاف المدارس التي تستخدم طالب إدو لخلق بيئة تعليمية أفضل'
                }
              </motion.p>
              <motion.div 
                className="flex flex-wrap gap-4 justify-center pt-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')} 
                  className="gap-2 text-lg px-8 shadow-glow-sm hover:shadow-glow"
                >
                  {language === 'en' ? 'Get Started' : 'ابدأ الآن'}
                  <ChevronRight className={`h-5 w-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 text-lg px-8 glass border-border/50 hover:border-primary/50 hover:shadow-glow-sm"
                >
                  <MessageSquare className="h-5 w-5" />
                  {language === 'en' ? 'Contact Sales' : 'اتصل بالمبيعات'}
                </Button>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30 glass-light">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 127, 255, 0.1)' }}>
                <span className="text-2xl font-bold" style={{ color: '#007FFF' }}>t</span>
              </div>
              <div>
                <div className="font-bold text-lg">TalebEdu</div>
                <div className="text-sm text-muted-foreground">
                  © 2025 {language === 'en' ? 'All rights reserved' : 'جميع الحقوق محفوظة'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
