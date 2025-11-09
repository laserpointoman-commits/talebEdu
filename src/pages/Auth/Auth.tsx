import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, Globe, Eye, EyeOff, User, Phone, Users, BookOpen, CreditCard, Bus, ChevronRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import heroImage from '@/assets/hero-education.jpg';
import featureNFC from '@/assets/feature-nfc.jpg';
import featureTracking from '@/assets/feature-tracking.jpg';
import featureWallet from '@/assets/feature-wallet.jpg';

export default function Auth() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  
  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  
  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail.toLowerCase().trim(),
        password: signInPassword,
      });

      if (error) throw error;

      if (data.user) {
        toast.success(language === 'en' ? 'Welcome back!' : 'مرحباً بعودتك!');
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast.error(error.message || (language === 'en' ? 'Login failed' : 'فشل تسجيل الدخول'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!signUpFullName || !signUpEmail || !signUpPassword) {
        throw new Error(language === 'en' ? 'Please fill in all required fields' : 'يرجى ملء جميع الحقول المطلوبة');
      }

      if (signUpPassword.length < 6) {
        throw new Error(language === 'en' ? 'Password must be at least 6 characters' : 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail.toLowerCase().trim(),
        password: signUpPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signUpFullName,
            phone: signUpPhone,
          }
        }
      });

      if (error) throw error;

      toast.success(language === 'en' 
        ? 'Account created successfully! Please check your email to verify your account.' 
        : 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني.');
      
      // Switch to sign in tab
      setActiveTab('signin');
      setSignInEmail(signUpEmail);
    } catch (error: any) {
      toast.error(error.message || (language === 'en' ? 'Sign up failed' : 'فشل التسجيل'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error(language === 'en' ? 'Please enter your email' : 'الرجاء إدخال البريد الإلكتروني');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast.success(language === 'en' 
        ? 'Password reset link has been sent to your email' 
        : 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error(error.message || (language === 'en' ? 'Failed to send reset email' : 'فشل إرسال بريد إعادة التعيين'));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: CreditCard,
      titleEn: 'NFC Attendance',
      titleAr: 'حضور NFC',
      descEn: 'Contactless check-in system',
      descAr: 'نظام تسجيل حضور بدون تلامس',
      image: featureNFC
    },
    {
      icon: Bus,
      titleEn: 'Live Bus Tracking',
      titleAr: 'تتبع الحافلات مباشر',
      descEn: 'Real-time GPS location',
      descAr: 'موقع GPS فوري',
      image: featureTracking
    },
    {
      icon: BookOpen,
      titleEn: 'Digital Wallet',
      titleAr: 'محفظة رقمية',
      descEn: 'Cashless payments',
      descAr: 'مدفوعات بدون نقود',
      image: featureWallet
    },
  ];

  const benefits = [
    { en: 'Real-time attendance tracking', ar: 'تتبع الحضور الفوري' },
    { en: 'Secure digital payments', ar: 'مدفوعات رقمية آمنة' },
    { en: 'Parent-teacher communication', ar: 'تواصل بين الآباء والمعلمين' },
    { en: 'Academic performance monitoring', ar: 'مراقبة الأداء الأكاديمي' },
    { en: 'Bus tracking & safety', ar: 'تتبع الحافلات والسلامة' },
    { en: 'School store access', ar: 'الوصول إلى المتجر المدرسي' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--gradient-mesh)' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img 
                src="/src/assets/talebedu-logo-hq.png" 
                alt="TalebEdu Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-primary">TalebEdu</h1>
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'Smart School Management' : 'إدارة مدرسية ذكية'}
                </p>
              </div>
            </a>
            
            <Button
              variant="glass"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'العربية' : 'English'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-32 pb-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          {/* Left Side - Marketing Content */}
          <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-4">
              <Badge className="px-4 py-2" variant="secondary">
                {language === 'en' ? '🚀 The Future of Education' : '🚀 مستقبل التعليم'}
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                {language === 'en' ? (
                  <>Transform Your<br />School Experience</>
                ) : (
                  <>حوّل تجربة<br />مدرستك</>
                )}
              </h1>
              
              <p className="text-xl text-muted-foreground">
                {language === 'en' 
                  ? 'Complete school management platform with NFC attendance, live tracking, and digital payments - all in one place.'
                  : 'منصة إدارة مدرسية متكاملة مع حضور NFC، تتبع مباشر، ومدفوعات رقمية - كل شيء في مكان واحد.'
                }
              </p>
            </div>

            {/* Hero Image */}
            <div className="rounded-2xl overflow-hidden shadow-elegant hover-lift group">
              <img 
                src={heroImage} 
                alt="Education" 
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105" 
              />
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">
                {language === 'en' ? 'Why Choose TalebEdu?' : 'لماذا تختار طالب إدو؟'}
              </h3>
              <div className="grid gap-2">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-muted-foreground">
                      {language === 'en' ? benefit.en : benefit.ar}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <Card 
                  key={idx} 
                  className="overflow-hidden hover-lift group cursor-pointer animate-scale-in border-border/50"
                  style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                >
                  <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <feature.icon className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <h4 className="font-semibold text-sm">
                        {language === 'en' ? feature.titleEn : feature.titleAr}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'en' ? feature.descEn : feature.descAr}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Removed stats section */}
          </div>

          {/* Right Side - Auth Forms */}
          <div className="sticky top-32 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <CardGlass className="w-full shadow-glow border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">
                  {language === 'en' ? 'Welcome' : 'مرحباً'}
                </CardTitle>
                <CardDescription>
                  {language === 'en'
                    ? 'Sign in to your account or create a new one'
                    : 'سجل الدخول إلى حسابك أو أنشئ حساباً جديداً'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">
                      {language === 'en' ? 'Sign In' : 'تسجيل الدخول'}
                    </TabsTrigger>
                    <TabsTrigger value="signup">
                      {language === 'en' ? 'Sign Up' : 'إنشاء حساب'}
                    </TabsTrigger>
                  </TabsList>

                  {/* Sign In Form */}
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">
                          {language === 'en' ? 'Email' : 'البريد الإلكتروني'}
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder={language === 'en' ? 'your@email.com' : 'بريدك@الإلكتروني'}
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                            required
                            className="pl-10"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">
                          {language === 'en' ? 'Password' : 'كلمة المرور'}
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            type={showSignInPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signInPassword}
                            onChange={(e) => setSignInPassword(e.target.value)}
                            required
                            className="pl-10 pr-10"
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                          >
                            {showSignInPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full shadow-glow-soft" size="lg" disabled={loading}>
                        {loading
                          ? (language === 'en' ? 'Signing in...' : 'جارٍ تسجيل الدخول...')
                          : (language === 'en' ? 'Sign In' : 'تسجيل الدخول')}
                      </Button>

                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-primary hover:underline"
                        >
                          {language === 'en' ? 'Forgot Password?' : 'نسيت كلمة المرور؟'}
                        </button>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Sign Up Form */}
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">
                          {language === 'en' ? 'Full Name' : 'الاسم الكامل'} *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder={language === 'en' ? 'John Doe' : 'الاسم الكامل'}
                            value={signUpFullName}
                            onChange={(e) => setSignUpFullName(e.target.value)}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">
                          {language === 'en' ? 'Email' : 'البريد الإلكتروني'} *
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder={language === 'en' ? 'your@email.com' : 'بريدك@الإلكتروني'}
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            required
                            className="pl-10"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">
                          {language === 'en' ? 'Phone Number (Optional)' : 'رقم الهاتف (اختياري)'}
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder={language === 'en' ? '+968 1234 5678' : '+٩٦٨ ١٢٣٤ ٥٦٧٨'}
                            value={signUpPhone}
                            onChange={(e) => setSignUpPhone(e.target.value)}
                            className="pl-10"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">
                          {language === 'en' ? 'Password' : 'كلمة المرور'} *
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showSignUpPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            required
                            className="pl-10 pr-10"
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          >
                            {showSignUpPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' 
                            ? 'Must be at least 6 characters' 
                            : 'يجب أن تكون 6 أحرف على الأقل'}
                        </p>
                      </div>
                      
                      <Button type="submit" className="w-full shadow-glow-soft" size="lg" disabled={loading}>
                        {loading
                          ? (language === 'en' ? 'Creating Account...' : 'جارٍ إنشاء الحساب...')
                          : (language === 'en' ? 'Create Account' : 'إنشاء حساب')}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'By signing up, you agree to our Terms of Service and Privacy Policy' 
                      : 'بإنشاء حساب، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا'}
                  </p>
                </div>
              </CardContent>
            </CardGlass>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Reset Password' : 'إعادة تعيين كلمة المرور'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Enter your email and we\'ll send you a link to reset your password' 
                : 'أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">
                {language === 'en' ? 'Email' : 'البريد الإلكتروني'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="pl-10"
                  dir="ltr"
                  placeholder={language === 'en' ? 'your@email.com' : 'بريدك@الإلكتروني'}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? (language === 'en' ? 'Sending...' : 'جاري الإرسال...') 
                : (language === 'en' ? 'Send Reset Link' : 'إرسال رابط إعادة التعيين')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}