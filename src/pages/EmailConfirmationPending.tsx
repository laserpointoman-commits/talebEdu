import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function EmailConfirmationPending() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('No email found');
      }

      // Trigger resend of confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Email Sent!' : language === 'hi' ? 'ईमेल भेजा गया!' : 'تم إرسال البريد!',
        description: language === 'en' 
          ? 'Confirmation email has been resent. Please check your inbox.'
          : language === 'hi'
          ? 'पुष्टिकरण ईमेल फिर से भेजा गया है। कृपया अपना इनबॉक्स जांचें।'
          : 'تم إعادة إرسال بريد التأكيد. يرجى التحقق من صندوق الوارد الخاص بك.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <CardTitle className="text-2xl">
            {language === 'en' ? 'Check Your Email' : language === 'hi' ? 'अपना ईमेल जांचें' : 'تحقق من بريدك الإلكتروني'}
          </CardTitle>
          <CardDescription className="text-base">
            {language === 'en'
              ? 'We sent a confirmation link to your email address'
              : language === 'hi'
              ? 'हमने आपके ईमेल पते पर एक पुष्टिकरण लिंक भेजा है'
              : 'لقد أرسلنا رابط تأكيد إلى عنوان بريدك الإلكتروني'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">
                  {language === 'en' ? 'Step 1: Check your email' : language === 'hi' ? 'चरण 1: अपना ईमेल जांचें' : 'الخطوة 1: تحقق من بريدك الإلكتروني'}
                </p>
                <p className="text-muted-foreground">
                  {language === 'en'
                    ? 'Look for an email from TalebEdu in your inbox'
                    : language === 'hi'
                    ? 'अपने इनबॉक्स में TalebEdu से ईमेल खोजें'
                    : 'ابحث عن بريد إلكتروني من TalebEdu في صندوق الوارد الخاص بك'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">
                  {language === 'en' ? 'Step 2: Click the link' : language === 'hi' ? 'चरण 2: लिंक पर क्लिक करें' : 'الخطوة 2: انقر على الرابط'}
                </p>
                <p className="text-muted-foreground">
                  {language === 'en'
                    ? 'Click the confirmation button in the email to verify your account'
                    : language === 'hi'
                    ? 'अपने अकाउंट को सत्यापित करने के लिए ईमेल में पुष्टिकरण बटन पर क्लिक करें'
                    : 'انقر على زر التأكيد في البريد الإلكتروني للتحقق من حسابك'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">
                  {language === 'en' ? 'Step 3: Start registering students' : language === 'hi' ? 'चरण 3: छात्रों का पंजीकरण शुरू करें' : 'الخطوة 3: ابدأ تسجيل الطلاب'}
                </p>
                <p className="text-muted-foreground">
                  {language === 'en'
                    ? "After confirmation, you'll be able to register your students"
                    : language === 'hi'
                    ? 'पुष्टि के बाद, आप अपने छात्रों को पंजीकृत कर सकेंगे'
                    : 'بعد التأكيد، ستتمكن من تسجيل طلابك'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              {language === 'en' ? "Didn't receive the email?" : language === 'hi' ? 'ईमेल नहीं मिला?' : 'لم تستلم البريد الإلكتروني؟'}
            </p>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resending}
            >
              {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Resend Confirmation Email' : language === 'hi' ? 'पुष्टिकरण ईमेल फिर से भेजें' : 'إعادة إرسال بريد التأكيد'}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              {language === 'en' ? 'Go to Login' : language === 'hi' ? 'लॉगिन पर जाएं' : 'الذهاب لتسجيل الدخول'}
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-4 border-t">
            {language === 'en'
              ? '💡 Tip: Check your spam folder if you don\'t see the email'
              : language === 'hi'
              ? '💡 सुझाव: अगर ईमेल नहीं दिखे तो स्पैम फोल्डर जांचें'
              : '💡 نصيحة: تحقق من مجلد البريد العشوائي إذا لم تجد البريد الإلكتروني'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
