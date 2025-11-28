import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class NativeAuthService {
  static async checkBiometricAvailability() {
    if (!Capacitor.isNativePlatform()) {
      return { isAvailable: false, error: 'Not running on native platform' };
    }

    try {
      const result = await NativeBiometric.isAvailable();
      return { isAvailable: result.isAvailable, biometryType: result.biometryType };
    } catch (error) {
      return { isAvailable: false, error };
    }
  }

  static async saveBiometricCredentials(email: string, password: string) {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: 'talebedu.app'
      });
    } catch (error) {
      console.error('Error saving biometric credentials:', error);
    }
  }

  static async authenticateWithBiometric(language: string = 'en') {
    if (!Capacitor.isNativePlatform()) {
      toast.error(language === 'en' ? 'Biometric authentication is only available on mobile devices' : 'المصادقة البيومترية متاحة فقط على الأجهزة المحمولة');
      return null;
    }

    try {
      // Verify biometric
      await NativeBiometric.verifyIdentity({
        reason: language === 'en' ? 'Sign in to TalebEdu' : 'تسجيل الدخول إلى TalebEdu',
        title: language === 'en' ? 'Authentication' : 'المصادقة',
        subtitle: language === 'en' ? 'Verify your identity' : 'تحقق من هويتك',
        description: language === 'en' ? 'Use your fingerprint or Face ID' : 'استخدم بصمتك أو Face ID'
      });

      // Get stored credentials
      const credentials = await NativeBiometric.getCredentials({
        server: 'talebedu.app'
      });

      if (credentials.username && credentials.password) {
        // Sign in with stored credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.username,
          password: credentials.password
        });

        if (error) throw error;
        return data;
      } else {
        toast.error(language === 'en' ? 'No saved credentials found. Please sign in manually first.' : 'لم يتم العثور على بيانات اعتماد محفوظة. يرجى تسجيل الدخول يدويًا أولاً.');
        return null;
      }
    } catch (error: any) {
      console.error('Biometric auth error:', error);
      
      // Handle specific error codes
      if (error.code === 'BiometricAuthFailed') {
        toast.error(language === 'en' ? 'Biometric authentication failed' : 'فشلت المصادقة البيومترية');
      } else if (error.code === 'UserCancel' || error.code === -128) {
        // User cancelled, do nothing
      } else if (error.code === 1 || error.errorMessage?.includes('KeychainError error 1')) {
        // No credentials stored - this is normal on first use
        toast.info(language === 'en' ? 'Please sign in manually first to enable biometric authentication' : 'يرجى تسجيل الدخول يدويًا أولاً لتمكين المصادقة البيومترية');
      } else {
        toast.error(language === 'en' ? 'Authentication error' : 'خطأ في المصادقة');
      }
      return null;
    }
  }

  static async hasSavedCredentials() {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const credentials = await NativeBiometric.getCredentials({
        server: 'talebedu.app'
      });
      return !!(credentials.username && credentials.password);
    } catch (error: any) {
      // KeychainError 1 means no credentials stored yet - this is normal
      if (error.code === 1 || error.errorMessage?.includes('KeychainError error 1')) {
        return false;
      }
      console.error('Error checking saved credentials:', error);
      return false;
    }
  }
}