import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import StudentRegistration from '@/components/features/StudentRegistration';

export default function StudentRegistrationWizard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('expected_students_count, registered_students_count')
      .eq('id', profile.id)
      .single();

    if (error) {
      console.error('Error loading parent data:', error);
      return;
    }

    setTotalStudents(data.expected_students_count || 0);
    setRegisteredCount(data.registered_students_count || 0);
    setCurrentStep((data.registered_students_count || 0) + 1);

    if (data.registered_students_count >= (data.expected_students_count || 0)) {
      setAllCompleted(true);
    }
  };

  const handleStudentSubmit = async (studentData: any) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-student-for-approval', {
        body: studentData,
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to submit student');
      }

      toast({
        title: language === 'en' ? 'Success!' : 'نجح!',
        description: language === 'en' 
          ? 'Student submitted for approval successfully'
          : 'تم إرسال بيانات الطالب للموافقة بنجاح',
      });

      await loadParentData();

      if (data.remainingSlots === 0) {
        setAllCompleted(true);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (allCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <CardTitle className="text-2xl">
              {language === 'en' ? 'All Students Registered!' : 'تم تسجيل جميع الطلاب!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {language === 'en'
                ? 'Your student registrations have been submitted for admin approval. You will receive notifications once they are approved.'
                : 'تم إرسال تسجيلات الطلاب للموافقة من قبل الإدارة. ستتلقى إشعارات بمجرد الموافقة عليها.'}
            </p>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              {language === 'en' ? 'Go to Dashboard' : 'الذهاب إلى لوحة التحكم'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = totalStudents > 0 ? ((currentStep - 1) / totalStudents) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div>
                <CardTitle className="text-2xl mb-2">
                  {language === 'en' 
                    ? `Register Student ${currentStep} of ${totalStudents}`
                    : `تسجيل الطالب ${currentStep} من ${totalStudents}`}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {language === 'en'
                    ? 'All students require admin approval before appearing in your dashboard'
                    : 'جميع الطلاب يتطلبون موافقة الإدارة قبل ظهورهم في لوحة التحكم الخاصة بك'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{language === 'en' ? 'Progress' : 'التقدم'}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {language === 'en' 
                  ? 'Student registration form will be integrated here'
                  : 'سيتم دمج نموذج تسجيل الطالب هنا'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
