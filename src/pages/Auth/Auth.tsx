import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, Globe, Eye, EyeOff, Users, CreditCard, Wifi, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { motion, AnimatePresence } from 'framer-motion';
import { nfcService } from '@/services/nfcService';

type LoginType = 'parent' | 'staff';

interface NfcUserInfo {
  email: string;
  name: string;
  nameAr?: string;
  role: string;
  profileId: string;
  hasPinSet: boolean;
  nfcId: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<LoginType>('parent');
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  
  // Staff NFC Login
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcUserInfo, setNfcUserInfo] = useState<NfcUserInfo | null>(null);
  
  // PIN Dialogs
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showSetupPinDialog, setShowSetupPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');
  
  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    // Reset NFC service on auth page load (important after logout for iOS)
    // Fire-and-forget since this is just a cleanup on page load
    nfcService.reset().catch(() => {});
    
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

  const handleNfcLogin = async () => {
    setIsNfcScanning(true);
    
    try {
      const nfcData = await nfcService.readOnce();
      console.log('NFC Data received:', nfcData);
      
      // Get the NFC ID from the scanned card
      let nfcId = nfcData.id;
      
      // If there's additional data with email, use that for lookup
      const additionalData = nfcData.additionalData as { email?: string; entityId?: string } | undefined;
      
      // Check if user exists and get their PIN status
      const { data: checkResult, error: checkError } = await supabase.functions.invoke('check-nfc-pin-status', {
        body: { 
          nfcId: nfcId,
          email: additionalData?.email 
        }
      });

      if (checkError) {
        console.error('Check PIN status error:', checkError);
        toast.error(language === 'ar' ? 'فشل التحقق من البطاقة' : 'Failed to verify card');
        return;
      }

      // Backend returns 200 with { found:false } for unknown cards.
      if (!checkResult?.found) {
        toast.error(language === 'ar' ? 'بطاقة غير معروفة' : 'Unknown card');
        return;
      }

      if (!checkResult.isStaff) {
        toast.error(language === 'ar' ? 'تسجيل NFC متاح للموظفين فقط' : 'NFC login is only for staff');
        return;
      }

      // Store user info for PIN dialogs
      setNfcUserInfo({
        email: checkResult.email,
        name: checkResult.name,
        nameAr: checkResult.nameAr,
        role: checkResult.role,
        profileId: checkResult.profileId,
        hasPinSet: checkResult.hasPinSet,
        nfcId: nfcId
      });

      if (!checkResult.hasPinSet) {
        // First time - need to set up PIN
        setShowSetupPinDialog(true);
        setPinStep('create');
        setNewPin('');
        setConfirmPin('');
      } else {
        // Has PIN - show PIN entry dialog
        setShowPinDialog(true);
        setPin('');
      }

    } catch (error) {
      console.error('NFC login error:', error);
      toast.error(language === 'ar' ? 'فشل قراءة البطاقة' : 'Card scan failed');
    } finally {
      setIsNfcScanning(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4 || !nfcUserInfo) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('nfc-pin-login', {
        body: {
          nfcId: nfcUserInfo.nfcId,
          pin: pin,
          email: nfcUserInfo.email
        }
      });

      if (error) {
        console.error('PIN login error:', error);
        toast.error(language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed');
        setPin('');
        return;
      }

      if (data.error) {
        if (data.error === 'Incorrect PIN') {
          toast.error(language === 'ar' ? 'رمز PIN غير صحيح' : 'Incorrect PIN');
        } else {
          toast.error(data.error);
        }
        setPin('');
        return;
      }

      if (data.success && data.session) {
        // Set the session in Supabase client
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        if (setSessionError) {
          console.error('Set session error:', setSessionError);
          toast.error(language === 'ar' ? 'فشل إنشاء الجلسة' : 'Failed to create session');
          return;
        }

        toast.success(language === 'ar' ? 'مرحباً بك!' : 'Welcome!');
        setShowPinDialog(false);
        setNfcUserInfo(null);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('PIN submit error:', error);
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPin = async () => {
    if (pinStep === 'create') {
      if (newPin.length !== 4) {
        toast.error(language === 'ar' ? 'يجب أن يكون الرمز 4 أرقام' : 'PIN must be 4 digits');
        return;
      }
      setPinStep('confirm');
      return;
    }

    // Confirm step
    if (confirmPin !== newPin) {
      toast.error(language === 'ar' ? 'الرمزان غير متطابقين' : 'PINs do not match');
      setConfirmPin('');
      return;
    }

    if (!nfcUserInfo) return;

    setLoading(true);
    try {
      // Set the PIN
      const { data: setResult, error: setError } = await supabase.functions.invoke('set-nfc-pin', {
        body: {
          pin: newPin,
          email: nfcUserInfo.email,
          profileId: nfcUserInfo.profileId
        }
      });

      if (setError || !setResult.success) {
        toast.error(language === 'ar' ? 'فشل حفظ الرمز' : 'Failed to save PIN');
        return;
      }

      toast.success(language === 'ar' ? 'تم إنشاء رمز PIN بنجاح!' : 'PIN created successfully!');
      
      // Now login with the new PIN
      const { data: loginData, error: loginError } = await supabase.functions.invoke('nfc-pin-login', {
        body: {
          nfcId: nfcUserInfo.nfcId,
          pin: newPin,
          email: nfcUserInfo.email
        }
      });

      if (loginError || !loginData.success) {
        toast.error(language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed');
        return;
      }

      // Set the session
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: loginData.session.access_token,
        refresh_token: loginData.session.refresh_token
      });

      if (setSessionError) {
        console.error('Set session error:', setSessionError);
        toast.error(language === 'ar' ? 'فشل إنشاء الجلسة' : 'Failed to create session');
        return;
      }

      setShowSetupPinDialog(false);
      setNfcUserInfo(null);
      window.location.href = '/dashboard';

    } catch (error) {
      console.error('Setup PIN error:', error);
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
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
    // On native Android we lock document scrolling globally (to keep dashboard scrolling stable),
    // so the Auth page must provide its own scroll container.
    <div className="h-[100dvh] w-full relative overflow-y-auto overscroll-none bg-background">
      {/* Simple Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      {/* Top Actions - Language Switcher */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="gap-2 bg-card hover:bg-secondary border-border"
        >
          <Globe className="h-4 w-4" />
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4">
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
              <div className="p-4 rounded-2xl bg-primary shadow-lg">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-primary">
              talebEdu
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'en' ? 'School Management System' : 'نظام إدارة المدرسة'}
            </p>
          </motion.div>

          {/* Sign In Card */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">
                {language === 'en' ? 'Welcome Back' : 'مرحباً بعودتك'}
              </CardTitle>
              <CardDescription>
                {language === 'en' ? 'Sign in to continue to your account' : 'قم بتسجيل الدخول للمتابعة'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Login Type Tabs */}
              <Tabs value={loginType} onValueChange={(v) => setLoginType(v as LoginType)} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="parent" className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    {language === 'en' ? 'Parent/Student' : 'ولي أمر/طالب'}
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="gap-2">
                    <Users className="h-4 w-4" />
                    {language === 'en' ? 'Staff' : 'موظفين'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="parent">
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
                </TabsContent>

                <TabsContent value="staff">
                  <div className="space-y-4">
                    {/* NFC Login Option */}
                    <div className="text-center p-6 rounded-lg bg-muted/50 border-2 border-dashed">
                      <AnimatePresence mode="wait">
                        {isNfcScanning ? (
                          <motion.div
                            key="scanning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="flex justify-center mb-4"
                            >
                              <Wifi className="h-12 w-12 text-primary" />
                            </motion.div>
                            <p className="text-sm font-medium">
                              {language === 'ar' ? 'امسح بطاقتك...' : 'Scan your card...'}
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="ready"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">
                              {language === 'ar' ? 'سجل دخولك ببطاقة NFC + رمز PIN' : 'Login with NFC Card + PIN'}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleNfcLogin}
                              disabled={isNfcScanning}
                              className="gap-2"
                            >
                              <CreditCard className="h-4 w-4" />
                              {language === 'ar' ? 'مسح البطاقة' : 'Scan Card'}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {language === 'ar' ? 'أو استخدم كلمة المرور' : 'OR use password'}
                        </span>
                      </div>
                    </div>

                    {/* Email Login for Staff */}
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="staff-email">
                          {language === 'en' ? 'Email' : 'البريد الإلكتروني'}
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="staff-email"
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
                        <Label htmlFor="staff-password">
                          {language === 'en' ? 'Password' : 'كلمة المرور'}
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="staff-password"
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
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                        disabled={loading}
                      >
                        {loading ? (language === 'en' ? 'Signing in...' : 'جاري تسجيل الدخول...') : (language === 'en' ? 'Sign In' : 'تسجيل الدخول')}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enter PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={(open) => { setShowPinDialog(open); if (!open) setPin(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <KeyRound className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'أدخل رمز PIN' : 'Enter PIN'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {nfcUserInfo && (
                <span className="block font-medium text-foreground mt-2">
                  {language === 'ar' ? `مرحباً، ${nfcUserInfo.nameAr || nfcUserInfo.name}` : `Welcome, ${nfcUserInfo.name}`}
                </span>
              )}
              {language === 'ar' ? 'أدخل رمز PIN المكون من 4 أرقام' : 'Enter your 4-digit PIN'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-4">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={(value) => {
                setPin(value);
                if (value.length === 4) {
                  setTimeout(() => handlePinSubmit(), 100);
                }
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-14 h-14 text-2xl" mask />
                <InputOTPSlot index={1} className="w-14 h-14 text-2xl" mask />
                <InputOTPSlot index={2} className="w-14 h-14 text-2xl" mask />
                <InputOTPSlot index={3} className="w-14 h-14 text-2xl" mask />
              </InputOTPGroup>
            </InputOTP>
            <Button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4 || loading}
              className="w-full"
            >
              {loading ? (language === 'ar' ? 'جاري التحقق...' : 'Verifying...') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Setup PIN Dialog */}
      <Dialog open={showSetupPinDialog} onOpenChange={(open) => { 
        setShowSetupPinDialog(open); 
        if (!open) { setNewPin(''); setConfirmPin(''); setPinStep('create'); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <KeyRound className="h-5 w-5 text-primary" />
              {pinStep === 'create' 
                ? (language === 'ar' ? 'إنشاء رمز PIN' : 'Create PIN')
                : (language === 'ar' ? 'تأكيد رمز PIN' : 'Confirm PIN')
              }
            </DialogTitle>
            <DialogDescription className="text-center">
              {nfcUserInfo && (
                <span className="block font-medium text-foreground mt-2">
                  {language === 'ar' ? `مرحباً، ${nfcUserInfo.nameAr || nfcUserInfo.name}` : `Welcome, ${nfcUserInfo.name}`}
                </span>
              )}
              {pinStep === 'create'
                ? (language === 'ar' ? 'أنشئ رمز PIN مكون من 4 أرقام للدخول السريع' : 'Create a 4-digit PIN for quick login')
                : (language === 'ar' ? 'أعد إدخال رمز PIN للتأكيد' : 'Re-enter your PIN to confirm')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-4">
            {pinStep === 'create' ? (
              <InputOTP
                maxLength={4}
                value={newPin}
                onChange={setNewPin}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-14 h-14 text-2xl" mask />
                  <InputOTPSlot index={1} className="w-14 h-14 text-2xl" mask />
                  <InputOTPSlot index={2} className="w-14 h-14 text-2xl" mask />
                  <InputOTPSlot index={3} className="w-14 h-14 text-2xl" mask />
                </InputOTPGroup>
              </InputOTP>
            ) : (
              <InputOTP
                maxLength={4}
                value={confirmPin}
                onChange={setConfirmPin}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-14 h-14 text-2xl" mask />
                  <InputOTPSlot index={1} className="w-14 h-14 text-2xl" mask />
                  <InputOTPSlot index={2} className="w-14 h-14 text-2xl" mask />
                  <InputOTPSlot index={3} className="w-14 h-14 text-2xl" mask />
                </InputOTPGroup>
              </InputOTP>
            )}
            <div className="flex gap-2 w-full">
              {pinStep === 'confirm' && (
                <Button
                  variant="outline"
                  onClick={() => { setPinStep('create'); setConfirmPin(''); }}
                  className="flex-1"
                >
                  {language === 'ar' ? 'رجوع' : 'Back'}
                </Button>
              )}
              <Button
                onClick={handleSetupPin}
                disabled={(pinStep === 'create' ? newPin.length !== 4 : confirmPin.length !== 4) || loading}
                className="flex-1"
              >
                {loading 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                  : pinStep === 'create'
                    ? (language === 'ar' ? 'التالي' : 'Next')
                    : (language === 'ar' ? 'تأكيد وتسجيل الدخول' : 'Confirm & Sign In')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
