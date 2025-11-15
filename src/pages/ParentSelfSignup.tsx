import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Globe, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ParentSelfSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState<'language' | 'validating' | 'signup' | 'success'>('language');
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    fullNameAr: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    expectedStudentsCount: 1,
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Invalid Link' : 'رابط غير صالح',
        description: language === 'en' ? 'Registration token is missing' : 'رمز التسجيل مفقود',
      });
      navigate('/');
      return;
    }

    if (step === 'validating') {
      validateToken();
    }
  }, [step]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-registration-token', {
        body: { token },
      });

      if (error || !data.valid) {
        throw new Error(data?.error || 'Invalid token');
      }

      setTokenData(data);
      setFormData(prev => ({ ...prev, email: data.email }));
      setStep('signup');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Invalid Token' : 'رمز غير صالح',
        description: error.message,
      });
      navigate('/');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = language === 'en' ? 'Full name is required' : 'الاسم الكامل مطلوب';
    }
    if (!formData.email.trim()) {
      newErrors.email = language === 'en' ? 'Email is required' : 'البريد الإلكتروني مطلوب';
    }
    if (!formData.password) {
      newErrors.password = language === 'en' ? 'Password is required' : 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = language === 'en' ? 'Password must be at least 6 characters' : 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = language === 'en' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة';
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = language === 'en' ? 'You must accept the terms' : 'يجب عليك قبول الشروط';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parent-self-signup', {
        body: {
          token,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          fullNameAr: formData.fullNameAr,
          phone: formData.phone,
          expectedStudentsCount: formData.expectedStudentsCount,
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Signup failed');
      }

      setStep('success');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Signup Failed' : 'فشل التسجيل',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'language') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Globe className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Choose Your Language</CardTitle>
            <CardTitle className="text-2xl" dir="rtl">اختر لغتك</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full h-16 text-lg"
              onClick={() => {
                setLanguage('en');
                setStep('validating');
              }}
            >
              English
            </Button>
            <Button
              className="w-full h-16 text-lg"
              onClick={() => {
                setLanguage('ar');
                setStep('validating');
              }}
            >
              العربية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'Validating registration link...' : 'جاري التحقق من رابط التسجيل...'}
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <CardTitle>
              {language === 'en' ? 'Check Your Email!' : 'تحقق من بريدك الإلكتروني!'}
            </CardTitle>
            <CardDescription>
              {language === 'en'
                ? 'We sent a confirmation link to your email address. Please click the link to verify your account.'
                : 'لقد أرسلنا رابط تأكيد إلى عنوان بريدك الإلكتروني. يرجى النقر على الرابط للتحقق من حسابك.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {language === 'en'
                  ? "Can't find the email? Check your spam folder or "
                  : 'لا تجد البريد الإلكتروني؟ تحقق من مجلد البريد العشوائي أو '}
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>
                  {language === 'en' ? 'go to login' : 'انتقل إلى تسجيل الدخول'}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {language === 'en' ? 'Create Your Parent Account' : 'إنشاء حساب ولي الأمر'}
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? `You can register up to ${tokenData?.maxStudents || 1} student${(tokenData?.maxStudents || 1) > 1 ? 's' : ''}`
              : `يمكنك تسجيل حتى ${tokenData?.maxStudents || 1} طالب`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  {language === 'en' ? 'Full Name' : 'الاسم الكامل'} *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={language === 'en' ? 'John Doe' : 'أحمد محمد'}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullNameAr">
                  {language === 'en' ? 'Full Name (Arabic)' : 'الاسم الكامل (عربي)'}
                </Label>
                <Input
                  id="fullNameAr"
                  value={formData.fullNameAr}
                  onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                  placeholder="أحمد محمد"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {language === 'en' ? 'Email' : 'البريد الإلكتروني'} *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                {language === 'en' ? 'Phone Number' : 'رقم الهاتف'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+968 9123 4567"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === 'en' ? 'Password' : 'كلمة المرور'} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {language === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'} *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentsCount">
                {language === 'en' ? 'Number of Students' : 'عدد الطلاب'} *
              </Label>
              <Select
                value={formData.expectedStudentsCount.toString()}
                onValueChange={(value) => setFormData({ ...formData, expectedStudentsCount: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: tokenData?.maxStudents || 10 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {language === 'en' ? (num === 1 ? 'Student' : 'Students') : 'طالب'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {language === 'en'
                  ? 'I accept the terms and conditions'
                  : 'أوافق على الشروط والأحكام'}
              </label>
            </div>
            {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button
                onClick={handleSignup}
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'en' ? 'Create Account' : 'إنشاء الحساب'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
