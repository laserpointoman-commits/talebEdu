import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const driverSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  nameAr: z.string().trim().min(1, 'Arabic name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().regex(/^\+968\s?\d{4}\s?\d{4}$/, 'Invalid phone number'),
  licenseNumber: z.string().trim().min(1, 'License number is required').max(50),
  busNumber: z.string().trim().min(1, 'Bus number is required').max(20),
  route: z.string().trim().min(1, 'Route is required').max(200),
  experience: z.string().min(1, 'Experience is required').max(50),
  emergencyContact: z.string().trim().regex(/^\+968\s?\d{4}\s?\d{4}$/, 'Invalid emergency contact'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

interface AddDriverFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDriverForm({ isOpen, onClose }: AddDriverFormProps) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    licenseNumber: '',
    busNumber: '',
    route: '',
    experience: '',
    emergencyContact: '',
    password: '',
  });

  const handleSubmit = () => {
    try {
      driverSchema.parse(formData);
      toast({
        title: t('common.save'),
        description: language === 'en' ? 'Driver profile created successfully' : 'تم إنشاء ملف السائق بنجاح',
      });
      onClose();
      setFormData({
        name: '',
        nameAr: '',
        email: '',
        phone: '',
        licenseNumber: '',
        busNumber: '',
        route: '',
        experience: '',
        emergencyContact: '',
        password: '',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: language === 'en' ? 'Validation Error' : 'خطأ في التحقق',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Add New Driver' : 'إضافة سائق جديد'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{language === 'en' ? 'Name *' : 'الاسم *'}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === 'en' ? "Ali Mohammed" : "علي محمد"}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="nameAr">{language === 'en' ? 'Name (Arabic) *' : 'الاسم (بالعربية) *'}</Label>
              <Input
                id="nameAr"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="علي محمد"
                dir="rtl"
                maxLength={100}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">{language === 'en' ? 'Email *' : 'البريد الإلكتروني *'}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={language === 'en' ? "driver@school.om" : "driver@school.om"}
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="password">{language === 'en' ? 'Password *' : 'كلمة المرور *'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={language === 'en' ? "Min 6 characters" : "6 أحرف على الأقل"}
                maxLength={100}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">{language === 'en' ? 'Phone *' : 'الهاتف *'}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+968 9123 4567"
              />
            </div>
            <div>
              <Label htmlFor="emergencyContact">{language === 'en' ? 'Emergency Contact *' : 'الاتصال الطارئ *'}</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="+968 9345 6789"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licenseNumber">{language === 'en' ? 'License Number *' : 'رقم الرخصة *'}</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="DL123456"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="busNumber">{language === 'en' ? 'Bus Number *' : 'رقم الحافلة *'}</Label>
              <Input
                id="busNumber"
                value={formData.busNumber}
                onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                placeholder="BUS-001"
                maxLength={20}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="route">{language === 'en' ? 'Route *' : 'المسار *'}</Label>
            <Input
              id="route"
              value={formData.route}
              onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              placeholder={language === 'en' ? "Al Khuwair - Ruwi - Al Seeb" : "الخوير - روي - السيب"}
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="experience">{language === 'en' ? 'Experience *' : 'الخبرة *'}</Label>
            <Input
              id="experience"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder={language === 'en' ? "5 years" : "5 سنوات"}
              maxLength={50}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}