import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Key, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function QuickPasswordReset() {
  const { language } = useLanguage();
  const [email, setEmail] = useState('info@talebedu.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const resetPassword = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('quick-password-reset', {
        body: { email }
      });

      if (error) throw error;

      setResult(data);
      toast.success(language === 'ar' ? 'تم إعادة تعيين كلمة المرور!' : 'Password Reset!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {language === 'ar' ? 'إعادة تعيين كلمة المرور السريعة' : 'Quick Password Reset'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'إعادة تعيين كلمة مرور المستخدم إلى Parent123!' 
              : 'Reset user password to Parent123!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <Button 
            onClick={resetPassword} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
          </Button>

          {result && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="font-semibold">
                    {language === 'ar' ? 'تم بنجاح!' : 'Success!'}
                  </p>
                  <p><strong>{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> {result.email}</p>
                  <p><strong>{language === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}</strong> {result.password}</p>
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="text-sm font-mono">
                      {result.email} / {result.password}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
