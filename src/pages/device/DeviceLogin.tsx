import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  LogIn, 
  Bus, 
  School, 
  Wifi, 
  Globe,
  User,
  Lock,
  LogOut,
  KeyRound
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nfcService, NFCData } from '@/services/nfcService';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { kioskService } from '@/services/kioskService';
import { KioskExitGesture } from '@/components/device/KioskExitGesture';

type DeviceType = 'bus' | 'school_gate';

interface DeviceSession {
  deviceId: string;
  nfcId: string;
  sessionType: string;
  userName?: string;
  busNumber?: string;
}

export default function DeviceLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  
  const deviceType = (searchParams.get('type') as DeviceType) || 'bus';
  const deviceId = searchParams.get('device') || `DEV-${Date.now()}`;
  
  const [loginMethod, setLoginMethod] = useState<'nfc' | 'account'>('nfc');
  const [isScanning, setIsScanning] = useState(false);
  const [session, setSession] = useState<DeviceSession | null>(null);
  const [loading, setLoading] = useState(false);

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pendingNfc, setPendingNfc] = useState<{ nfcId: string; email: string } | null>(null);
  
  // Account login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const allowedRoles = useMemo(() => new Set(['driver', 'supervisor']), []);

  useEffect(() => {
    checkExistingSession();
  }, [deviceId]);

  useEffect(() => {
    // Enter kiosk mode on Android CM30
    kioskService.startKiosk();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'active')
        .single();

      if (data) {
        // Get user info
        const { data: employee } = await supabase
          .from('employees')
          .select('*, profiles(full_name)')
          .eq('nfc_id', data.nfc_id)
          .single();

        setSession({
          deviceId: data.device_id,
          nfcId: data.nfc_id,
          sessionType: data.session_type,
          userName: (employee?.profiles as any)?.full_name || 'Unknown'
        });
      }
    } catch (error) {
      // No active session
    }
  };

  const beginNfcPinLogin = async (nfcData: NFCData) => {
    setIsScanning(false);
    setLoading(true);
    try {
      const nfcId = nfcData.id;
      const { data: checkResult, error: checkError } = await supabase.functions.invoke('check-nfc-pin-status', {
        body: { nfcId }
      });

      if (checkError) throw checkError;
      if (!checkResult?.found) {
        toast.error(language === 'ar' ? 'بطاقة غير معروفة' : 'Unknown card');
        return;
      }

      if (!allowedRoles.has(checkResult.role)) {
        toast.error(language === 'ar' ? 'هذا الجهاز للسائق/المشرف فقط' : 'This device is for Driver/Supervisor only');
        return;
      }

      if (!checkResult.hasPinSet) {
        toast.error(language === 'ar' ? 'الرجاء إنشاء PIN من صفحة الموظفين أولاً' : 'Please set up your PIN on the staff login page first');
        return;
      }

      setPendingNfc({ nfcId, email: checkResult.email });
      setPin('');
      setPinDialogOpen(true);
    } catch (e: any) {
      console.error('NFC PIN begin error:', e);
      toast.error(language === 'ar' ? 'فشل قراءة البطاقة' : 'Card scan failed');
    } finally {
      setLoading(false);
    }
  };

  const completeNfcPinLogin = async () => {
    if (!pendingNfc || pin.length !== 4) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('nfc-pin-login', {
        body: {
          nfcId: pendingNfc.nfcId,
          pin,
          email: pendingNfc.email,
        }
      });
      if (error) throw error;
      if (!data?.success || !data?.session) {
        toast.error(language === 'ar' ? 'PIN غير صحيح' : 'Incorrect PIN');
        setPin('');
        return;
      }

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (setSessionError) throw setSessionError;

      // Fetch role to set session_type
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('email', pendingNfc.email)
        .maybeSingle();

      const role = (profile as any)?.role as string | undefined;
      const fullName = (profile as any)?.full_name as string | undefined;
      const sessionType = deviceType === 'bus'
        ? (role === 'driver' ? 'bus_driver' : 'bus_supervisor')
        : 'school_gate';

      const { error: sessionError } = await supabase
        .from('device_sessions')
        .insert({ device_id: deviceId, nfc_id: pendingNfc.nfcId, session_type: sessionType, status: 'active' });

      if (sessionError) throw sessionError;

      setSession({ deviceId, nfcId: pendingNfc.nfcId, sessionType, userName: fullName });
      setPinDialogOpen(false);
      setPendingNfc(null);

      if (deviceType === 'bus') navigate(`/device/bus-attendance?device=${deviceId}`);
      else navigate(`/device/school-attendance?device=${deviceId}`);
    } catch (e: any) {
      console.error('NFC PIN login error:', e);
      toast.error(language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', authData.user.id)
        .single();

      if (!allowedRoles.has((profile as any)?.role)) {
        toast.error(language === 'ar' ? 'هذا الجهاز للسائق/المشرف فقط' : 'This device is for Driver/Supervisor only');
        await supabase.auth.signOut();
        return;
      }

      // Fetch NFC id from staff tables (auto-detect)
      // NOTE: this backend stores staff NFC mapping in employees (and teachers for teacher-only cards).
      const { data: employee } = await supabase
        .from('employees')
        .select('nfc_id')
        .eq('profile_id', authData.user.id)
        .maybeSingle();
      const { data: teacher } = await supabase
        .from('teachers')
        .select('nfc_id')
        .eq('profile_id', authData.user.id)
        .maybeSingle();

      const nfcId = (employee as any)?.nfc_id || (teacher as any)?.nfc_id;
      if (!nfcId) {
        toast.error(language === 'ar' ? 'لم يتم ربط بطاقة NFC بهذا الحساب' : 'No NFC card linked to this account');
        await supabase.auth.signOut();
        return;
      }

      const role = (profile as any)?.role as string;
      const sessionType = deviceType === 'bus'
        ? (role === 'driver' ? 'bus_driver' : 'bus_supervisor')
        : 'school_gate';

      await supabase
        .from('device_sessions')
        .insert({ device_id: deviceId, nfc_id: nfcId, session_type: sessionType, status: 'active' });

      setSession({ deviceId, nfcId, sessionType, userName: (profile as any)?.full_name });

      toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful');

      if (deviceType === 'bus') {
        navigate(`/device/bus-attendance?device=${deviceId}`);
      } else {
        navigate(`/device/school-attendance?device=${deviceId}`);
      }

    } catch (error: any) {
      console.error('Account login error:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  // Build NFC ID candidates for matching (same logic as backend)
  const buildNfcCandidates = (rawId: string): string[] => {
    const cleaned = (rawId ?? '').replace(/\u0000/g, '').trim().toUpperCase();
    const candidates: string[] = [cleaned];

    // Handle cases where stored/tag IDs include or omit the leading "NFC-".
    if (cleaned.startsWith('NFC-')) {
      candidates.push(cleaned.slice(4));
    } else if (cleaned.startsWith('STD-') || cleaned.startsWith('TCH-')) {
      candidates.push(`NFC-${cleaned}`);
    }
    
    if (cleaned.startsWith('FC')) {
      const numericPart = cleaned.slice(2);
      candidates.push(numericPart);
      const padded = numericPart.padStart(9, '0');
      candidates.push(`NFC-${padded}`);
      candidates.push(`TCH-${padded}`);
      candidates.push(`NFC-${numericPart}`);
      candidates.push(`TCH-${numericPart}`);
    }
    
    if (/^\d+$/.test(cleaned)) {
      const padded = cleaned.padStart(9, '0');
      candidates.push(`NFC-${padded}`);
      candidates.push(`TCH-${padded}`);
      candidates.push(`NFC-${cleaned}`);
      candidates.push(`TCH-${cleaned}`);
    }
    
    candidates.push(...candidates.map(c => c.toLowerCase()));
    return [...new Set(candidates)];
  };

  const handleLogout = async (requireNfc: boolean = true) => {
    if (requireNfc && session) {
      // Require NFC scan to confirm logout
      setIsScanning(true);
      toast.info(language === 'ar' ? 'امسح بطاقتك لتأكيد الخروج' : 'Scan your card to confirm logout');
      
      try {
        const nfcData = await nfcService.readOnce();
        
        // Build candidates for both scanned and session NFC IDs
        const sessionCandidates = buildNfcCandidates(session.nfcId);
        const scannedCandidates = buildNfcCandidates(nfcData.id);
        const hasMatch = scannedCandidates.some(c => sessionCandidates.includes(c));
        
        if (!hasMatch) {
          toast.error(language === 'ar' ? 'يجب استخدام نفس البطاقة للخروج' : 'Must use same card for logout');
          setIsScanning(false);
          return;
        }
      } catch (error) {
        toast.error(language === 'ar' ? 'فشل مسح البطاقة' : 'Card scan failed');
        setIsScanning(false);
        return;
      }
      setIsScanning(false);
    }

    try {
      await supabase
        .from('device_sessions')
        .update({ 
          status: 'ended', 
          ended_at: new Date().toISOString() 
        })
        .eq('device_id', deviceId)
        .eq('status', 'active');

      await supabase.auth.signOut();
      // Reset NFC service so next login can scan fresh (await for clean state)
      try {
        await nfcService.reset();
      } catch {}
      setSession(null);
      toast.success(language === 'ar' ? 'تم تسجيل الخروج' : 'Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const startNfcScan = async () => {
    setIsScanning(true);
    try {
      const nfcData = await nfcService.readOnce();
      await beginNfcPinLogin(nfcData);
    } catch (error) {
      console.error('NFC scan error:', error);
      toast.error(language === 'ar' ? 'فشل مسح البطاقة' : 'Card scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  // If already logged in, show session info with logout option
  if (session) {
    return (
      <KioskExitGesture onExit={() => (window.location.href = '/landing')}>
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-end mb-2">
              <LanguageSwitcher />
            </div>
            <Badge variant="secondary" className="w-fit mx-auto mb-4">
              {language === 'ar' ? 'جلسة نشطة' : 'Active Session'}
            </Badge>
            <CardTitle className="text-2xl">
              {session.userName || (language === 'ar' ? 'مستخدم' : 'User')}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? `نوع الجهاز: ${deviceType === 'bus' ? 'حافلة' : 'بوابة المدرسة'}` : `Device: ${deviceType === 'bus' ? 'Bus' : 'School Gate'}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full h-14 text-lg"
              onClick={() => {
                if (deviceType === 'bus') {
                  navigate(`/device/bus-attendance?device=${deviceId}`);
                } else {
                  navigate(`/device/school-attendance?device=${deviceId}`);
                }
              }}
            >
              {deviceType === 'bus' ? <Bus className="mr-2 h-5 w-5" /> : <School className="mr-2 h-5 w-5" />}
              {language === 'ar' ? 'متابعة' : 'Continue'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-14 text-lg"
              onClick={() => handleLogout(true)}
              disabled={isScanning}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {isScanning 
                ? (language === 'ar' ? 'امسح بطاقتك...' : 'Scan your card...')
                : (language === 'ar' ? 'تسجيل الخروج' : 'Logout')}
            </Button>
          </CardContent>
        </Card>
        </div>
      </KioskExitGesture>
    );
  }

  return (
    <KioskExitGesture onExit={() => (window.location.href = '/landing')}>
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-end mb-2">
            <LanguageSwitcher />
          </div>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {deviceType === 'bus' ? <Bus className="h-8 w-8 text-primary" /> : <School className="h-8 w-8 text-primary" />}
          </div>
          <CardTitle className="text-2xl">
            {deviceType === 'bus' 
              ? (language === 'ar' ? 'نظام حضور الحافلة' : 'Bus Attendance System')
              : (language === 'ar' ? 'نظام حضور المدرسة' : 'School Attendance System')}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'سجل دخولك للبدء' : 'Login to start'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as 'nfc' | 'account')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="nfc" className="gap-2">
                <CreditCard className="h-4 w-4" />
                {language === 'ar' ? 'بطاقة NFC' : 'NFC Card'}
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-2">
                <User className="h-4 w-4" />
                {language === 'ar' ? 'حساب' : 'Account'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nfc" className="space-y-4">
              <AnimatePresence mode="wait">
                {isScanning ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center p-8 rounded-lg bg-primary/10 border-2 border-primary"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex justify-center mb-4"
                    >
                      <Wifi className="h-16 w-16 text-primary" />
                    </motion.div>
                    <p className="font-semibold">
                      {language === 'ar' ? 'امسح بطاقتك...' : 'Scan your card...'}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center p-8 rounded-lg bg-muted/50"
                  >
                    <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'اضغط للمسح' : 'Tap to scan'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                onClick={startNfcScan} 
                disabled={isScanning || loading}
                className="w-full h-14 text-lg"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {isScanning 
                  ? (language === 'ar' ? 'جاري المسح...' : 'Scanning...') 
                  : (language === 'ar' ? 'مسح بطاقة NFC' : 'Scan NFC Card')}
              </Button>

              <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5" />
                      {language === 'ar' ? 'أدخل رمز PIN' : 'Enter PIN'}
                    </DialogTitle>
                    <DialogDescription>
                      {language === 'ar'
                        ? 'رمز PIN مكون من 4 أرقام'
                        : '4-digit PIN'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex justify-center" dir="ltr">
                    <InputOTP
                      maxLength={4}
                      value={pin}
                      onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} mask />
                        <InputOTPSlot index={1} mask />
                        <InputOTPSlot index={2} mask />
                        <InputOTPSlot index={3} mask />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    className="mt-4 w-full h-12"
                    onClick={completeNfcPinLogin}
                    disabled={loading || pin.length !== 4}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Button>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="account">
              <form onSubmit={handleAccountLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-14 text-lg">
                  <LogIn className="mr-2 h-5 w-5" />
                  {loading 
                    ? (language === 'ar' ? 'جاري الدخول...' : 'Logging in...') 
                    : (language === 'ar' ? 'تسجيل الدخول' : 'Login')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </KioskExitGesture>
  );
}

