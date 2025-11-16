import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { NativeAuthService } from '@/services/nativeAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fingerprint, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function BiometricGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, [user, authLoading]);

  const checkBiometric = async () => {
    // Don't check biometric on auth pages
    const authPaths = ['/auth', '/register', '/parent-registration', '/register-student'];
    if (authPaths.includes(location.pathname)) {
      setIsVerified(true);
      setIsChecking(false);
      return;
    }

    // On web or if auth is still loading, skip biometric
    if (!Capacitor.isNativePlatform() || authLoading) {
      setIsVerified(true);
      setIsChecking(false);
      return;
    }

    try {
      // Check if biometric is available
      const availability = await NativeAuthService.checkBiometricAvailability();
      setHasBiometric(availability.isAvailable);

      if (!availability.isAvailable) {
        // No biometric available, allow access
        setIsVerified(true);
        setIsChecking(false);
        return;
      }

      // Check if user has saved credentials
      const hasSaved = await NativeAuthService.hasSavedCredentials();
      
      if (user || hasSaved) {
        // User is logged in or has saved credentials, require biometric
        setIsChecking(false);
        // Don't automatically prompt - wait for user interaction
      } else {
        // No user and no saved credentials, allow access
        setIsVerified(true);
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Error checking biometric:', error);
      // On error, allow access
      setIsVerified(true);
      setIsChecking(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await NativeAuthService.authenticateWithBiometric(language);
      
      if (result) {
        setIsVerified(true);
        toast.success(language === 'en' ? 'Authentication successful' : 'تم التحقق بنجاح');
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
    }
  };

  const handleUsePassword = () => {
    navigate('/auth');
  };

  // Show loading state
  if (isChecking || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="animate-pulse">
          <Lock className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  // Show biometric prompt if not verified
  if (!isVerified && hasBiometric && Capacitor.isNativePlatform()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Fingerprint className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {language === 'en' ? 'Unlock TalebEdu' : 'فتح TalebEdu'}
            </CardTitle>
            <CardDescription>
              {language === 'en' 
                ? 'Verify your identity to continue' 
                : 'تحقق من هويتك للمتابعة'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleBiometricAuth}
              className="w-full"
              size="lg"
            >
              <Fingerprint className="h-5 w-5 mr-2" />
              {language === 'en' ? 'Use Biometric' : 'استخدام البيومترية'}
            </Button>
            
            <Button
              onClick={handleUsePassword}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              {language === 'en' ? 'Use Password Instead' : 'استخدام كلمة المرور'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
