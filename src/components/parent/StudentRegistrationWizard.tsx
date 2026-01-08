import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, GraduationCap, Users, Heart, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function StudentRegistrationWizard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    firstNameAr: '',
    lastNameAr: '',
    dateOfBirth: '',
    gender: '',
    grade: '',
    class: '',
    nationality: '',
    bloodType: '',
    address: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    allergies: '',
  });

  useEffect(() => {
    loadParentData();
  }, [profile?.id]);

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

    const expectedRaw = data.expected_students_count;
    const expected = typeof expectedRaw === 'number' && expectedRaw > 0 ? expectedRaw : null;
    const registered = data.registered_students_count ?? 0;

    setTotalStudents(expected ?? 0);
    setRegisteredCount(registered);
    setCurrentStep(registered + 1);

    // Only mark complete when the expected count is known and fully reached.
    setAllCompleted(expected !== null && registered >= expected);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({ variant: 'destructive', title: language === 'en' ? 'First name is required' : 'الاسم الأول مطلوب' });
      return false;
    }
    if (!formData.lastName.trim()) {
      toast({ variant: 'destructive', title: language === 'en' ? 'Last name is required' : 'اسم العائلة مطلوب' });
      return false;
    }
    if (!formData.dateOfBirth) {
      toast({ variant: 'destructive', title: language === 'en' ? 'Date of birth is required' : 'تاريخ الميلاد مطلوب' });
      return false;
    }
    if (!formData.gender) {
      toast({ variant: 'destructive', title: language === 'en' ? 'Gender is required' : 'الجنس مطلوب' });
      return false;
    }
    if (!formData.grade) {
      toast({ variant: 'destructive', title: language === 'en' ? 'Grade is required' : 'الصف مطلوب' });
      return false;
    }
    return true;
  };

  const handleStudentSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-student-for-approval', {
        body: {
          ...formData,
          parentName: profile?.full_name,
          parentPhone: profile?.phone,
          parentEmail: profile?.email,
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to submit student');
      }

      toast({
        title: language === 'en' ? 'Success!' : 'نجح!',
        description: language === 'en' 
          ? 'Student submitted for approval successfully. Awaiting admin approval.'
          : 'تم إرسال بيانات الطالب للموافقة بنجاح. في انتظار موافقة الإدارة.',
      });

      // Navigate back to dashboard - student will show as "waiting for approval"
      navigate('/dashboard');
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

  const grades = ['KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div>
                <CardTitle className="text-2xl mb-2">
                  {totalStudents > 0
                    ? (language === 'en'
                        ? `Register Student ${currentStep} of ${totalStudents}`
                        : `تسجيل الطالب ${currentStep} من ${totalStudents}`)
                    : (language === 'en' ? 'Register Student' : 'تسجيل الطالب')}
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="basic" className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">{language === 'en' ? 'Basic' : 'أساسي'}</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">{language === 'en' ? 'Contact' : 'اتصال'}</span>
                </TabsTrigger>
                <TabsTrigger value="medical" className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">{language === 'en' ? 'Medical' : 'طبي'}</span>
                </TabsTrigger>
                <TabsTrigger value="review" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{language === 'en' ? 'Review' : 'مراجعة'}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'First Name (English) *' : 'الاسم الأول (إنجليزي) *'}</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={language === 'en' ? 'John' : 'أحمد'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Last Name (English) *' : 'اسم العائلة (إنجليزي) *'}</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={language === 'en' ? 'Doe' : 'محمد'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'First Name (Arabic)' : 'الاسم الأول (عربي)'}</Label>
                    <Input
                      value={formData.firstNameAr}
                      onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })}
                      placeholder="أحمد"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Last Name (Arabic)' : 'اسم العائلة (عربي)'}</Label>
                    <Input
                      value={formData.lastNameAr}
                      onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })}
                      placeholder="محمد"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Date of Birth *' : 'تاريخ الميلاد *'}</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Gender *' : 'الجنس *'}</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select' : 'اختر'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{language === 'en' ? 'Male' : 'ذكر'}</SelectItem>
                        <SelectItem value="female">{language === 'en' ? 'Female' : 'أنثى'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Nationality' : 'الجنسية'}</Label>
                    <Input
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder={language === 'en' ? 'Omani' : 'عماني'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Grade *' : 'الصف *'}</Label>
                    <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select grade' : 'اختر الصف'} />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Class' : 'الفصل'}</Label>
                    <Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select class' : 'اختر الفصل'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Blood Type' : 'فصيلة الدم'}</Label>
                    <Select value={formData.bloodType} onValueChange={(v) => setFormData({ ...formData, bloodType: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select' : 'اختر'} />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                          <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab('contact')}>
                    {language === 'en' ? 'Next' : 'التالي'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Student Phone' : 'هاتف الطالب'}</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+968 1234 5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Address' : 'العنوان'}</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={language === 'en' ? 'Home address' : 'عنوان المنزل'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Emergency Contact Name' : 'اسم جهة الاتصال الطارئة'}</Label>
                    <Input
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder={language === 'en' ? 'Contact name' : 'اسم جهة الاتصال'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Emergency Phone' : 'هاتف الطوارئ'}</Label>
                    <Input
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      placeholder="+968 1234 5678"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('basic')}>
                    {language === 'en' ? 'Previous' : 'السابق'}
                  </Button>
                  <Button onClick={() => setActiveTab('medical')}>
                    {language === 'en' ? 'Next' : 'التالي'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Medical Conditions' : 'الحالات الطبية'}</Label>
                    <Textarea
                      value={formData.medicalConditions}
                      onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                      placeholder={language === 'en' ? 'Any medical conditions we should know about...' : 'أي حالات طبية يجب أن نعرفها...'}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Allergies' : 'الحساسية'}</Label>
                    <Textarea
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder={language === 'en' ? 'Any known allergies...' : 'أي حساسية معروفة...'}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('contact')}>
                    {language === 'en' ? 'Previous' : 'السابق'}
                  </Button>
                  <Button onClick={() => setActiveTab('review')}>
                    {language === 'en' ? 'Review' : 'مراجعة'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold">{language === 'en' ? 'Review Information' : 'مراجعة المعلومات'}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">{language === 'en' ? 'Name:' : 'الاسم:'}</span></div>
                    <div>{formData.firstName} {formData.lastName}</div>
                    
                    {formData.firstNameAr && (
                      <>
                        <div><span className="text-muted-foreground">{language === 'en' ? 'Arabic Name:' : 'الاسم بالعربي:'}</span></div>
                        <div dir="rtl">{formData.firstNameAr} {formData.lastNameAr}</div>
                      </>
                    )}
                    
                    <div><span className="text-muted-foreground">{language === 'en' ? 'Date of Birth:' : 'تاريخ الميلاد:'}</span></div>
                    <div>{formData.dateOfBirth}</div>
                    
                    <div><span className="text-muted-foreground">{language === 'en' ? 'Gender:' : 'الجنس:'}</span></div>
                    <div>{formData.gender === 'male' ? (language === 'en' ? 'Male' : 'ذكر') : (language === 'en' ? 'Female' : 'أنثى')}</div>
                    
                    <div><span className="text-muted-foreground">{language === 'en' ? 'Grade:' : 'الصف:'}</span></div>
                    <div>{formData.grade} {formData.class && `- ${formData.class}`}</div>
                    
                    {formData.nationality && (
                      <>
                        <div><span className="text-muted-foreground">{language === 'en' ? 'Nationality:' : 'الجنسية:'}</span></div>
                        <div>{formData.nationality}</div>
                      </>
                    )}
                    
                    {formData.bloodType && (
                      <>
                        <div><span className="text-muted-foreground">{language === 'en' ? 'Blood Type:' : 'فصيلة الدم:'}</span></div>
                        <div>{formData.bloodType}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('medical')}>
                    {language === 'en' ? 'Previous' : 'السابق'}
                  </Button>
                  <Button onClick={handleStudentSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {language === 'en' ? 'Submit for Approval' : 'إرسال للموافقة'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
