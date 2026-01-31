import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import PageHeader from '@/components/layouts/PageHeader';

export default function CreateAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const t = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);

  const createAdminAccount = async () => {
    if (!email || !password) {
      toast({
        title: t('Error', 'خطأ', 'त्रुटि'),
        description: t('Please enter both email and password', 'يرجى إدخال البريد الإلكتروني وكلمة المرور', 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
            full_name: 'Admin User'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Update the profile to admin role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        toast({
          title: t('Success!', 'نجاح!', 'सफलता!'),
          description: t(
            `Admin account created! Email: ${email}, Password: ${password}. You can now login.`,
            `تم إنشاء حساب المسؤول! البريد: ${email}، كلمة المرور: ${password}. يمكنك الآن تسجيل الدخول.`,
            `एडमिन अकाउंट बनाया गया! ईमेल: ${email}, पासवर्ड: ${password}. अब आप लॉगिन कर सकते हैं।`
          )
        });

        // Clear form
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({
        title: t('Error', 'خطأ', 'त्रुटि'),
        description: error.message || t('Failed to create admin account', 'فشل في إنشاء حساب المسؤول', 'एडमिन अकाउंट बनाने में विफल'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PageHeader title={t('Create Admin', 'إنشاء مسؤول', 'एडमिन बनाएं')} />
      <div className="pt-16 pb-8 px-4 flex items-center justify-center min-h-[calc(100dvh-3rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('Create Admin Account', 'إنشاء حساب المسؤول', 'एडमिन अकाउंट बनाएं')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder={t('Enter admin email', 'أدخل بريد المسؤول', 'एडमिन ईमेल दर्ज करें')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder={t('Enter password', 'أدخل كلمة المرور', 'पासवर्ड दर्ज करें')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button 
              onClick={createAdminAccount} 
              disabled={loading}
              className="w-full"
            >
              {loading ? t('Creating...', 'جاري الإنشاء...', 'बना रहा है...') : t('Create Admin Account', 'إنشاء حساب المسؤول', 'एडमिन अकाउंट बनाएं')}
            </Button>
            <div className="text-sm text-muted-foreground">
              <p>{t('Suggested credentials:', 'بيانات مقترحة:', 'सुझाए गए क्रेडेंशियल्स:')}</p>
              <p>{t('Email:', 'البريد:', 'ईमेल:')} admin2@talebedu.com</p>
              <p>{t('Password:', 'كلمة المرور:', 'पासवर्ड:')} Admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}