import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إضافة طالب جديد' : 'Add New Student'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
