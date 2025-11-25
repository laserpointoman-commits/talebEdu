import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import appIcon from '@/assets/app-icon.png';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

export default function Auth() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  
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
        // Check user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('expected_students_count, registered_students_count, role')
          .eq('id', data.user.id)
          .single();

        // Check if parent needs to register students
        if (profile?.role === 'parent' && 
            profile.expected_students_count && 
            profile.registered_students_count < profile.expected_students_count) {
          toast.info(language === 'en' ? 'Please register your students' : 'يرجى تسجيل طلابك');
          navigate('/dashboard/register-student');
          return;
        }

        toast.success(language === 'en' ? 'Welcome back!' : 'مرحباً بعودتك!');
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast.error(error.message || (language === 'en' ? 'Login failed' : 'فشل تسجيل الدخول'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success(
        language === 'en'
          ? 'Password reset email sent! Check your inbox.'
          : 'تم إرسال رابط إعادة تعيين كلمة المرور! تحقق من بريدك الإلكتروني.'
      );
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error(error.message || (language === 'en' ? 'Failed to send reset email' : 'فشل إرسال البريد الإلكتروني'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
        />
      </div>

      {/* Top Actions - About Button & Language Switcher */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/presentation-sales')}
          className="gap-2 backdrop-blur-sm bg-background/80 hover:bg-background/90 border-border/50 hover:border-primary/50 transition-colors"
        >
          <Globe className="h-4 w-4" />
          {language === 'en' ? 'About' : 'حول'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="gap-2 backdrop-blur-sm bg-background/80 hover:bg-background/90 border-border/50"
        >
          <Globe className="h-4 w-4" />
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative mb-4">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(0, 127, 255, 0.3)",
                    "0 0 40px rgba(0, 127, 255, 0.5)",
                    "0 0 20px rgba(0, 127, 255, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 rounded-2xl"
              >
                <img src={appIcon} alt="TalebEdu Logo" className="h-20 w-20 object-contain" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              talebEdu
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'en' ? 'School Management System' : 'نظام إدارة المدرسة'}
            </p>
          </motion.div>

          {/* Sign In Card */}
          <Card className="backdrop-blur-xl bg-background/80 border-border/50 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">
                {language === 'en' ? 'Welcome Back' : 'مرحباً بعودتك'}
              </CardTitle>
              <CardDescription>
                {language === 'en' ? 'Sign in to continue to your account' : 'قم بتسجيل الدخول للمتابعة'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === 'en' ? 'Email' : 'البريد الإلكتروني'}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={language === 'en' ? 'Enter your email' : 'أدخل بريدك الإلكتروني'}
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {language === 'en' ? 'Password' : 'كلمة المرور'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showSignInPassword ? 'text' : 'password'}
                      placeholder={language === 'en' ? 'Enter your password' : 'أدخل كلمة المرور'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    {language === 'en' ? 'Forgot password?' : 'نسيت كلمة المرور؟'}
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? (language === 'en' ? 'Signing in...' : 'جاري تسجيل الدخول...') : (language === 'en' ? 'Sign In' : 'تسجيل الدخول')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
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
                ? 'Enter your email address and we will send you a link to reset your password.'
                : 'أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">
                {language === 'en' ? 'Email' : 'البريد الإلكتروني'}
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={language === 'en' ? 'Enter your email' : 'أدخل بريدك الإلكتروني'}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1"
              >
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (language === 'en' ? 'Sending...' : 'جاري الإرسال...') : (language === 'en' ? 'Send Reset Link' : 'إرسال الرابط')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
