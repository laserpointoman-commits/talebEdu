import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddStudentDialog({ open, onOpenChange, onSuccess }: AddStudentDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    firstNameAr: "",
    lastNameAr: "",
    studentId: "",
    nfcId: "",
    grade: "",
    class: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    bloodType: "",
    address: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalConditions: "",
    allergies: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let profileId = null;

      // Create user account if checkbox is checked
      if (createAccount) {
        if (!formData.email || !formData.password) {
          throw new Error(language === 'ar' ? 'البريد الإلكتروني وكلمة المرور مطلوبان لإنشاء حساب' : 'Email and password are required to create account');
        }

        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: `${formData.firstName} ${formData.lastName}`,
            role: 'student'
          }
        });

        if (error) throw error;
        profileId = data.user_id;
      }

      // Create student record
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          first_name_ar: formData.firstNameAr || null,
          last_name_ar: formData.lastNameAr || null,
          student_id: formData.studentId,
          nfc_id: formData.nfcId,
          grade: formData.grade,
          class: formData.class,
          date_of_birth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          nationality: formData.nationality || null,
          blood_type: formData.bloodType || null,
          address: formData.address || null,
          phone: formData.phone || null,
          parent_name: formData.parentName || null,
          parent_phone: formData.parentPhone || null,
          parent_email: formData.parentEmail || null,
          emergency_contact: formData.emergencyContact || null,
          emergency_phone: formData.emergencyPhone || null,
          medical_conditions: formData.medicalConditions || null,
          allergies: formData.allergies || null,
          profile_id: profileId,
          status: 'active'
        });

      if (studentError) throw studentError;

      toast({
        title: language === 'ar' ? 'تم بنجاح' : 'Success',
        description: language === 'ar' 
          ? `تم ${createAccount ? 'إنشاء الحساب وتسجيل' : 'تسجيل'} الطالب بنجاح`
          : `Student ${createAccount ? 'account created and registered' : 'registered'} successfully`
      });

      setFormData({
        firstName: "",
        lastName: "",
        firstNameAr: "",
        lastNameAr: "",
        studentId: "",
        nfcId: "",
        grade: "",
        class: "",
        dateOfBirth: "",
        gender: "",
        nationality: "",
        bloodType: "",
        address: "",
        phone: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalConditions: "",
        allergies: "",
        email: "",
        password: "",
      });
      setCreateAccount(false);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إضافة طالب جديد' : 'Add New Student'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">
                {language === 'ar' ? 'معلومات أساسية' : 'Basic Info'}
              </TabsTrigger>
              <TabsTrigger value="personal">
                {language === 'ar' ? 'معلومات شخصية' : 'Personal'}
              </TabsTrigger>
              <TabsTrigger value="parent">
                {language === 'ar' ? 'ولي الأمر' : 'Parent/Guardian'}
              </TabsTrigger>
              <TabsTrigger value="medical">
                {language === 'ar' ? 'معلومات طبية' : 'Medical'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الاسم الأول' : 'First Name'} *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اسم العائلة' : 'Last Name'} *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الاسم الأول (عربي)' : 'First Name (Arabic)'}</Label>
                  <Input
                    value={formData.firstNameAr}
                    onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اسم العائلة (عربي)' : 'Last Name (Arabic)'}</Label>
                  <Input
                    value={formData.lastNameAr}
                    onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'رقم الطالب' : 'Student ID'} *</Label>
                  <Input
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'رقم NFC' : 'NFC ID'} *</Label>
                  <Input
                    value={formData.nfcId}
                    onChange={(e) => setFormData({ ...formData, nfcId: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الصف' : 'Grade'} *</Label>
                  <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={g.toString()}>
                          {language === 'ar' ? `الصف ${g}` : `Grade ${g}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الفصل' : 'Class'} *</Label>
                  <Input
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: أ' : 'e.g., A'}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الجنس' : 'Gender'}</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{language === 'ar' ? 'ذكر' : 'Male'}</SelectItem>
                      <SelectItem value="female">{language === 'ar' ? 'أنثى' : 'Female'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الجنسية' : 'Nationality'}</Label>
                  <Input
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'فصيلة الدم' : 'Blood Type'}</Label>
                  <Select value={formData.bloodType} onValueChange={(value) => setFormData({ ...formData, bloodType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>{language === 'ar' ? 'العنوان' : 'Address'}</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parent" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اسم ولي الأمر' : 'Parent/Guardian Name'}</Label>
                  <Input
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'هاتف ولي الأمر' : 'Parent Phone'}</Label>
                  <Input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>{language === 'ar' ? 'بريد ولي الأمر' : 'Parent Email'}</Label>
                  <Input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'جهة الاتصال للطوارئ' : 'Emergency Contact Name'}</Label>
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'هاتف الطوارئ' : 'Emergency Phone'}</Label>
                  <Input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="medical" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الحالات الطبية' : 'Medical Conditions'}</Label>
                  <Textarea
                    value={formData.medicalConditions}
                    onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                    placeholder={language === 'ar' ? 'أي حالات طبية مزمنة أو خاصة' : 'Any chronic or special medical conditions'}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الحساسية' : 'Allergies'}</Label>
                  <Textarea
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder={language === 'ar' ? 'أي حساسية غذائية أو دوائية' : 'Any food or medicine allergies'}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="createAccount"
              checked={createAccount}
              onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
            />
            <Label htmlFor="createAccount" className="cursor-pointer">
              {language === 'ar' ? 'إنشاء حساب مستخدم للطالب' : 'Create user account for student'}
            </Label>
          </div>

          {createAccount && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={createAccount}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'كلمة المرور' : 'Password'} *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={createAccount}
                  minLength={6}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
