import { NativeBiometric } from 'capacitor-native-biometric';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
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
      }
    } catch (error: any) {
      console.error('Biometric auth error:', error);
      if (error.code === 'BiometricAuthFailed') {
        toast.error(language === 'en' ? 'Biometric authentication failed' : 'فشلت المصادقة البيومترية');
      } else if (error.code === 'UserCancel') {
        // User cancelled, do nothing
      } else {
        toast.error(language === 'en' ? 'Authentication error' : 'خطأ في المصادقة');
      }
      return null;
    }
  }

  static async scanNFCCard(language: string = 'en') {
    if (!Capacitor.isNativePlatform()) {
      toast.error(language === 'en' ? 'NFC scanning is only available on mobile devices' : 'مسح NFC متاح فقط على الأجهزة المحمولة');
      return null;
    }

    try {
      // Request camera permissions
      await BarcodeScanner.checkPermission({ force: true });

      // Start scanning
      document.body.classList.add('scanner-active');
      const result = await BarcodeScanner.startScan();
      document.body.classList.remove('scanner-active');

      if (result.hasContent) {
        // The scanned content is the NFC ID
        const nfcId = result.content;
        
        // Look up user by NFC ID
        const { data: profiles, error } = await supabase
          .from('students')
          .select('profile_id')
          .eq('nfc_id', nfcId)
          .single();

        if (error || !profiles) {
          toast.error(language === 'en' ? 'NFC card not found' : 'بطاقة NFC غير موجودة');
          return null;
        }

        // For demo purposes, we'll use a special NFC authentication method
        // In production, you'd implement proper NFC-based auth
        toast.info(language === 'en' ? 'NFC authentication requires admin setup' : 'مصادقة NFC تتطلب إعداد المسؤول');
        return null;
      }
    } catch (error) {
      console.error('NFC scan error:', error);
      toast.error(language === 'en' ? 'Failed to scan NFC card' : 'فشل مسح بطاقة NFC');
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
    } catch {
      return false;
    }
  }
}