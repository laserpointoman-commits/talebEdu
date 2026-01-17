import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Globe, UserPlus, Loader2, CheckCircle } from 'lucide-react';
import HomeLocationMap from '@/components/features/HomeLocationMap';

export default function RegisterStudent() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [needsTransportation, setNeedsTransportation] = useState(false);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    first_name_ar: '',
    last_name: '',
    last_name_ar: '',
    date_of_birth: '',
    gender: '',
    grade: '',
    class: '',
    nationality: '',
    blood_type: '',
    address: '',
    phone: '',
    parent_phone: profile?.phone || '',
    parent_email: profile?.email || '',
    parent_name: profile?.full_name || '',
    medical_conditions: '',
    allergies: '',
    home_address: '',
    building_number: '',
    street_name: '',
    area: '',
    special_instructions: ''
  });

  const handleLocationSelect = (lat: number, lng: number) => {
    setHomeLocation({ lat, lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Generate student ID
      const studentId = `STD-${Date.now().toString().slice(-6)}`;
      const nfcId = `NFC-${Date.now().toString().slice(-9)}`;

      // Insert student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          student_id: studentId,
          nfc_id: nfcId,
          first_name: formData.first_name,
          first_name_ar: formData.first_name_ar,
          last_name: formData.last_name,
          last_name_ar: formData.last_name_ar,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          grade: formData.grade,
          class: formData.class,
          nationality: formData.nationality,
          blood_type: formData.blood_type,
          address: formData.address,
          phone: formData.phone,
          parent_id: user.id,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          parent_name: formData.parent_name,
          medical_conditions: formData.medical_conditions || null,
          allergies: formData.allergies || null,
          needs_transportation: needsTransportation,
          home_latitude: homeLocation?.lat || null,
          home_longitude: homeLocation?.lng || null,
          home_address: formData.home_address || null,
          building_number: formData.building_number || null,
          street_name: formData.street_name || null,
          area: formData.area || null,
          special_instructions: formData.special_instructions || null,
        })
        .select()
        .single();

      if (studentError) throw studentError;

          toast.success(
        language === 'en'
          ? 'Student registered successfully!'
          : language === 'hi'
          ? 'छात्र सफलतापूर्वक पंजीकृत!'
          : 'تم تسجيل الطالب بنجاح!'
      );

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('Error registering student:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to register student' : language === 'hi' ? 'छात्र पंजीकृत करने में विफल' : 'فشل تسجيل الطالب'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAnother = () => {
    setShowSuccessDialog(false);
    setFormData({
      first_name: '',
      first_name_ar: '',
      last_name: '',
      last_name_ar: '',
      date_of_birth: '',
      gender: '',
      grade: '',
      class: '',
      nationality: '',
      blood_type: '',
      address: '',
      phone: '',
      parent_phone: profile?.phone || '',
      parent_email: profile?.email || '',
      parent_name: profile?.full_name || '',
      medical_conditions: '',
      allergies: '',
      home_address: '',
      building_number: '',
      street_name: '',
      area: '',
      special_instructions: ''
    });
    setNeedsTransportation(false);
    setHomeLocation(null);
    setActiveTab('basic');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/talebedu-logo-blue.png" 
              alt="TalebEdu Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {language === 'en' ? 'Register Student' : language === 'hi' ? 'छात्र पंजीकरण' : 'تسجيل طالب'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Add your child to the system' : language === 'hi' ? 'अपने बच्चे को सिस्टम में जोड़ें' : 'أضف طفلك إلى النظام'}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'ar' : language === 'ar' ? 'hi' : 'en')}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'العربية' : language === 'ar' ? 'हिन्दी' : 'English'}
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {language === 'en' ? 'Student Information' : language === 'hi' ? 'छात्र जानकारी' : 'معلومات الطالب'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">
                    {language === 'en' ? 'Basic' : language === 'hi' ? 'बुनियादी' : 'أساسي'}
                  </TabsTrigger>
                  <TabsTrigger value="personal">
                    {language === 'en' ? 'Personal' : language === 'hi' ? 'व्यक्तिगत' : 'شخصي'}
                  </TabsTrigger>
                  <TabsTrigger value="parent">
                    {language === 'en' ? 'Parent' : language === 'hi' ? 'अभिभावक' : 'ولي الأمر'}
                  </TabsTrigger>
                  <TabsTrigger value="medical">
                    {language === 'en' ? 'Medical' : language === 'hi' ? 'चिकित्सा' : 'طبي'}
                  </TabsTrigger>
                  <TabsTrigger value="transport">
                    {language === 'en' ? 'Transport' : language === 'hi' ? 'परिवहन' : 'النقل'}
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'First Name (English)' : language === 'hi' ? 'पहला नाम (अंग्रेजी)' : 'الاسم الأول (English)'} *</Label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'First Name (Arabic)' : language === 'hi' ? 'पहला नाम (अरबी)' : 'الاسم الأول (عربي)'} *</Label>
                      <Input
                        value={formData.first_name_ar}
                        onChange={(e) => setFormData({ ...formData, first_name_ar: e.target.value })}
                        required
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Last Name (English)' : language === 'hi' ? 'अंतिम नाम (अंग्रेजी)' : 'اسم العائلة (English)'} *</Label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Last Name (Arabic)' : language === 'hi' ? 'अंतिम नाम (अरबी)' : 'اسم العائلة (عربي)'} *</Label>
                      <Input
                        value={formData.last_name_ar}
                        onChange={(e) => setFormData({ ...formData, last_name_ar: e.target.value })}
                        required
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Date of Birth' : language === 'hi' ? 'जन्म तिथि' : 'تاريخ الميلاد'} *</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Gender' : language === 'hi' ? 'लिंग' : 'الجنس'} *</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{language === 'en' ? 'Male' : language === 'hi' ? 'पुरुष' : 'ذكر'}</SelectItem>
                          <SelectItem value="female">{language === 'en' ? 'Female' : language === 'hi' ? 'महिला' : 'أنثى'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Grade' : language === 'hi' ? 'कक्षा' : 'الصف'} *</Label>
                      <Input
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Class' : language === 'hi' ? 'सेक्शन' : 'الفصل'}</Label>
                      <Input
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Personal Tab */}
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Nationality' : language === 'hi' ? 'राष्ट्रीयता' : 'الجنسية'}</Label>
                      <Input
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Blood Type' : language === 'hi' ? 'रक्त समूह' : 'فصيلة الدم'}</Label>
                      <Select value={formData.blood_type} onValueChange={(value) => setFormData({ ...formData, blood_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>{language === 'en' ? 'Address' : language === 'hi' ? 'पता' : 'العنوان'}</Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Phone' : language === 'hi' ? 'फोन' : 'الهاتف'}</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Parent/Guardian Tab */}
                <TabsContent value="parent" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Parent Name' : language === 'hi' ? 'अभिभावक का नाम' : 'اسم ولي الأمر'}</Label>
                      <Input
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Parent Email' : language === 'hi' ? 'अभिभावक ईमेल' : 'البريد الإلكتروني لولي الأمر'}</Label>
                      <Input
                        type="email"
                        value={formData.parent_email}
                        onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Parent Phone' : language === 'hi' ? 'अभिभावक फोन' : 'هاتف ولي الأمر'}</Label>
                      <Input
                        type="tel"
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Medical Tab */}
                <TabsContent value="medical" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Medical Conditions' : language === 'hi' ? 'चिकित्सा स्थितियां' : 'الحالات الطبية'}</Label>
                      <Textarea
                        value={formData.medical_conditions}
                        onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                        rows={4}
                        placeholder={language === 'en' ? 'Any medical conditions...' : language === 'hi' ? 'कोई चिकित्सा स्थिति...' : 'أي حالات طبية...'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Allergies' : language === 'hi' ? 'एलर्जी' : 'الحساسية'}</Label>
                      <Textarea
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        rows={4}
                        placeholder={language === 'en' ? 'Any allergies...' : language === 'hi' ? 'कोई एलर्जी...' : 'أي حساسية...'}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Transportation Tab */}
                <TabsContent value="transport" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>{language === 'en' ? 'Needs Transportation' : language === 'hi' ? 'परिवहन आवश्यक' : 'يحتاج نقل'}</Label>
                    <Switch checked={needsTransportation} onCheckedChange={setNeedsTransportation} />
                  </div>

                  {needsTransportation && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{language === 'en' ? 'Home Location' : language === 'hi' ? 'घर का स्थान' : 'موقع المنزل'}</Label>
                        <HomeLocationMap
                          onLocationSelect={handleLocationSelect}
                          language={language}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{language === 'en' ? 'Home Address' : language === 'hi' ? 'घर का पता' : 'عنوان المنزل'}</Label>
                          <Input
                            value={formData.home_address}
                            onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'en' ? 'Building Number' : language === 'hi' ? 'भवन संख्या' : 'رقم المبنى'}</Label>
                          <Input
                            value={formData.building_number}
                            onChange={(e) => setFormData({ ...formData, building_number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'en' ? 'Street Name' : language === 'hi' ? 'सड़क का नाम' : 'اسم الشارع'}</Label>
                          <Input
                            value={formData.street_name}
                            onChange={(e) => setFormData({ ...formData, street_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'en' ? 'Area' : language === 'hi' ? 'क्षेत्र' : 'المنطقة'}</Label>
                          <Input
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>{language === 'en' ? 'Special Instructions' : language === 'hi' ? 'विशेष निर्देश' : 'تعليمات خاصة'}</Label>
                          <Textarea
                            value={formData.special_instructions}
                            onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  {language === 'en' ? 'Cancel' : language === 'hi' ? 'रद्द करें' : 'إلغاء'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === 'en' ? 'Register Student' : language === 'hi' ? 'छात्र पंजीकृत करें' : 'تسجيل الطالب'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-center text-2xl">
              {language === 'en' ? 'Student Registered!' : language === 'hi' ? 'छात्र पंजीकृत!' : 'تم التسجيل بنجاح!'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {language === 'en' 
                ? 'The student has been successfully added to your account. What would you like to do next?'
                : language === 'hi'
                ? 'छात्र आपके खाते में सफलतापूर्वक जोड़ा गया है। आप आगे क्या करना चाहेंगे?'
                : 'تم إضافة الطالب بنجاح إلى حسابك. ماذا تريد أن تفعل بعد ذلك؟'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleRegisterAnother}
              className="flex-1"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {language === 'en' ? 'Register Another Student' : language === 'hi' ? 'एक और छात्र पंजीकृत करें' : 'تسجيل طالب آخر'}
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              {language === 'en' ? 'Go to Dashboard' : language === 'hi' ? 'डैशबोर्ड पर जाएं' : 'الذهاب إلى لوحة التحكم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
