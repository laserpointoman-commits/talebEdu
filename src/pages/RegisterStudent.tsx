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
import { Globe, UserPlus, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
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
          : 'تم تسجيل الطالب بنجاح!'
      );

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('Error registering student:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to register student' : 'فشل تسجيل الطالب'));
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src="/src/assets/talebedu-logo-blue.png" 
              alt="TalebEdu Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {language === 'en' ? 'Register Student' : 'تسجيل طالب'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Add your child to the system' : 'أضف طفلك إلى النظام'}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {language === 'en' ? 'Student Information' : 'معلومات الطالب'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">
                    {language === 'en' ? 'Basic' : 'أساسي'}
                  </TabsTrigger>
                  <TabsTrigger value="personal">
                    {language === 'en' ? 'Personal' : 'شخصي'}
                  </TabsTrigger>
                  <TabsTrigger value="parent">
                    {language === 'en' ? 'Parent' : 'ولي الأمر'}
                  </TabsTrigger>
                  <TabsTrigger value="medical">
                    {language === 'en' ? 'Medical' : 'طبي'}
                  </TabsTrigger>
                  <TabsTrigger value="transport">
                    {language === 'en' ? 'Transport' : 'النقل'}
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'First Name (English)' : 'الاسم الأول (English)'} *</Label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'First Name (Arabic)' : 'الاسم الأول (عربي)'} *</Label>
                      <Input
                        value={formData.first_name_ar}
                        onChange={(e) => setFormData({ ...formData, first_name_ar: e.target.value })}
                        required
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Last Name (English)' : 'اسم العائلة (English)'} *</Label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Last Name (Arabic)' : 'اسم العائلة (عربي)'} *</Label>
                      <Input
                        value={formData.last_name_ar}
                        onChange={(e) => setFormData({ ...formData, last_name_ar: e.target.value })}
                        required
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Date of Birth' : 'تاريخ الميلاد'} *</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Gender' : 'الجنس'} *</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{language === 'en' ? 'Male' : 'ذكر'}</SelectItem>
                          <SelectItem value="female">{language === 'en' ? 'Female' : 'أنثى'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Grade' : 'الصف'} *</Label>
                      <Input
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Class' : 'الفصل'}</Label>
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
                      <Label>{language === 'en' ? 'Nationality' : 'الجنسية'}</Label>
                      <Input
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Blood Type' : 'فصيلة الدم'}</Label>
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
                      <Label>{language === 'en' ? 'Address' : 'العنوان'}</Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Phone' : 'الهاتف'}</Label>
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
                      <Label>{language === 'en' ? 'Parent Name' : 'اسم ولي الأمر'}</Label>
                      <Input
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Parent Email' : 'البريد الإلكتروني لولي الأمر'}</Label>
                      <Input
                        type="email"
                        value={formData.parent_email}
                        onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Parent Phone' : 'هاتف ولي الأمر'}</Label>
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
                      <Label>{language === 'en' ? 'Medical Conditions' : 'الحالات الطبية'}</Label>
                      <Textarea
                        value={formData.medical_conditions}
                        onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                        rows={4}
                        placeholder={language === 'en' ? 'Any medical conditions...' : 'أي حالات طبية...'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Allergies' : 'الحساسية'}</Label>
                      <Textarea
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        rows={4}
                        placeholder={language === 'en' ? 'Any allergies...' : 'أي حساسية...'}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Transportation Tab */}
                <TabsContent value="transport" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>{language === 'en' ? 'Needs Transportation' : 'يحتاج نقل'}</Label>
                    <Switch checked={needsTransportation} onCheckedChange={setNeedsTransportation} />
                  </div>

                  {needsTransportation && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{language === 'en' ? 'Home Location' : 'موقع المنزل'}</Label>
                        <HomeLocationMap
                          onLocationSelect={handleLocationSelect}
                          language={language}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{language === 'en' ? 'Home Address' : 'عنوان المنزل'}</Label>
                          <Input
                            value={formData.home_address}
                            onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'en' ? 'Building Number' : 'رقم المبنى'}</Label>
                          <Input
                            value={formData.building_number}
                            onChange={(e) => setFormData({ ...formData, building_number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'en' ? 'Street Name' : 'اسم الشارع'}</Label>
                          <Input
                            value={formData.street_name}
                            onChange={(e) => setFormData({ ...formData, street_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'en' ? 'Area' : 'المنطقة'}</Label>
                          <Input
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>{language === 'en' ? 'Special Instructions' : 'تعليمات خاصة'}</Label>
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
                  {language === 'en' ? 'Cancel' : 'إلغاء'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === 'en' ? 'Register Student' : 'تسجيل الطالب'}
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
              {language === 'en' ? 'Student Registered!' : 'تم التسجيل بنجاح!'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {language === 'en' 
                ? 'The student has been successfully added to your account. What would you like to do next?'
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
              {language === 'en' ? 'Register Another Student' : 'تسجيل طالب آخر'}
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              {language === 'en' ? 'Go to Dashboard' : 'الذهاب إلى لوحة التحكم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
