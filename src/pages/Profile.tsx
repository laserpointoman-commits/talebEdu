import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Camera, Shield, Key, Eye, EyeOff, CreditCard } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Profile = () => {
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: profile?.full_name || '',
    nameAr: profile?.full_name_ar || '',
    email: user?.email || '',
    phone: profile?.phone || '+971 50 123 4567',
    address: profile?.address || '123 School Street, Dubai, UAE',
    dateOfBirth: '1990-01-15',
    joinDate: '2020-09-01',
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // NFC PIN state
  const [nfcPin, setNfcPin] = useState('');
  const [confirmNfcPin, setConfirmNfcPin] = useState('');
  const [hasPinSet, setHasPinSet] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Check if user is staff and has PIN set
  useEffect(() => {
    const checkPinStatus = async () => {
      if (!user?.email) return;
      
      const staffRoles = ['admin', 'teacher', 'driver', 'supervisor', 'finance', 'canteen', 'school_attendance'];
      setIsStaff(staffRoles.includes(profile?.role || ''));
      
      if (staffRoles.includes(profile?.role || '')) {
        const { data } = await supabase
          .from('profiles')
          .select('nfc_pin_hash')
          .eq('id', user.id)
          .single();
        
        setHasPinSet(!!data?.nfc_pin_hash);
      }
    };
    checkPinStatus();
  }, [user, profile]);

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: language === 'en' ? "Profile Updated" : "تم تحديث الملف الشخصي",
      description: language === 'en' ? "Your profile has been successfully updated." : "تم تحديث ملفك الشخصي بنجاح.",
      variant: "success",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData({
      name: profile?.full_name || '',
      nameAr: profile?.full_name_ar || '',
      email: user?.email || '',
      phone: profile?.phone || '+971 50 123 4567',
      address: '123 School Street, Dubai, UAE',
      dateOfBirth: '1990-01-15',
      joinDate: '2020-09-01',
    });
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      setPasswords({ current: '', new: '', confirm: '' });
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleSpecificInfo = () => {
    switch (profile?.role) {
      case 'teacher':
        return {
          subjects: ['Mathematics', 'Physics'],
          classes: ['10A', '10B', '11A'],
          employeeId: 'TCH-2024-001',
          department: 'Science Department',
        };
      case 'student':
        return {
          studentId: 'STD-2024-1234',
          class: '10A',
          rollNumber: '15',
          parentName: 'Mohammed Ali',
          parentPhone: '+971 50 987 6543',
        };
      case 'parent':
        return {
          children: [
            { name: 'Sara Ahmed', class: '10A', studentId: 'STD-2024-1234' },
            { name: 'Ali Ahmed', class: '7B', studentId: 'STD-2024-1235' },
          ],
          emergencyContact: '+971 50 111 2222',
        };
      case 'driver':
        return {
          busNumber: 'BUS-15',
          route: 'Route A - Downtown',
          licenseNumber: 'DRV-2024-789',
          studentsCount: 32,
        };
      default:
        return {};
    }
  };

  const roleInfo = getRoleSpecificInfo();

  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {getText('My Profile', 'الملف الشخصي', 'मेरी प्रोफ़ाइल')}
              </h1>
              <p className="text-violet-100 text-sm">{profile?.full_name || user?.email}</p>
            </div>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0">
              <Edit className="h-4 w-4" />
              {getText('Edit Profile', 'تعديل', 'प्रोफ़ाइल संपादित करें')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0">
                <Save className="h-4 w-4" />
                {getText('Save', 'حفظ', 'सहेजें')}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                <X className="h-4 w-4" />
                {getText('Cancel', 'إلغاء', 'रद्द करें')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600" />
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 ring-4 ring-violet-100 dark:ring-violet-900/30">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-3xl">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 bg-violet-500 hover:bg-violet-600 text-white"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{profile?.full_name || user?.email}</h3>
                <Badge className="capitalize bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">{profile?.role}</Badge>
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1">
              <Tabs defaultValue="personal" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <TabsList className={`grid w-full grid-cols-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <TabsTrigger value="personal">
                    {getText('Personal Info', 'معلومات شخصية', 'व्यक्तिगत जानकारी')}
                  </TabsTrigger>
                  <TabsTrigger value="role">
                    {getText('Role Info', 'معلومات الدور', 'भूमिका जानकारी')}
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    {getText('Security', 'الأمان', 'सुरक्षा')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {getText('Name', 'الاسم', 'नाम')}
                      </Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameAr">
                        {getText('Name in Arabic', 'الاسم بالعربية', 'अरबी में नाम')}
                      </Label>
                      <Input
                        id="nameAr"
                        value={profileData.nameAr}
                        onChange={(e) => setProfileData({ ...profileData, nameAr: e.target.value })}
                        disabled={!isEditing}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {getText('Email', 'البريد الإلكتروني', 'ईमेल')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {getText('Phone', 'رقم الهاتف', 'फ़ोन')}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">
                        {getText('Date of Birth', 'تاريخ الميلاد', 'जन्म तिथि')}
                      </Label>
                      <Input
                        id="dob"
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        {getText('Address', 'العنوان', 'पता')}
                      </Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="role" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile?.role === 'teacher' && (
                      <>
                        <div className="space-y-2">
                          <Label>{getText('Employee ID', 'رقم الموظف', 'कर्मचारी आईडी')}</Label>
                          <Input value={roleInfo.employeeId} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Department', 'القسم', 'विभाग')}</Label>
                          <Input value={roleInfo.department} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Subjects', 'المواد', 'विषय')}</Label>
                          <Input value={roleInfo.subjects?.join(', ')} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Classes', 'الفصول', 'कक्षाएं')}</Label>
                          <Input value={roleInfo.classes?.join(', ')} disabled />
                        </div>
                      </>
                    )}

                    {profile?.role === 'student' && (
                      <>
                        <div className="space-y-2">
                          <Label>{getText('Student ID', 'رقم الطالب', 'छात्र आईडी')}</Label>
                          <Input value={roleInfo.studentId} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Class', 'الفصل', 'कक्षा')}</Label>
                          <Input value={roleInfo.class} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Roll Number', 'رقم الجلوس', 'रोल नंबर')}</Label>
                          <Input value={roleInfo.rollNumber} disabled type="number" />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Parent Name', 'ولي الأمر', 'अभिभावक का नाम')}</Label>
                          <Input value={roleInfo.parentName} disabled />
                        </div>
                      </>
                    )}

                    {profile?.role === 'parent' && (
                      <>
                        <div className="space-y-2 md:col-span-2">
                          <Label>{getText('Children', 'الأطفال', 'बच्चे')}</Label>
                          {roleInfo.children?.map((child, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-muted/30">
                              <p className="font-medium">{child.name}</p>
                              <p className="text-sm text-muted-foreground">
                                <span className="number-display">{getText('Class', 'الفصل', 'कक्षा')}: {child.class} | {getText('ID', 'المعرف', 'आईडी')}: {child.studentId}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Emergency Contact', 'رقم الطوارئ', 'आपातकालीन संपर्क')}</Label>
                          <Input value={roleInfo.emergencyContact} disabled type="tel" />
                        </div>
                      </>
                    )}

                    {profile?.role === 'driver' && (
                      <>
                        <div className="space-y-2">
                          <Label>{getText('Bus Number', 'رقم الحافلة', 'बस नंबर')}</Label>
                          <Input value={roleInfo.busNumber} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Route', 'المسار', 'मार्ग')}</Label>
                          <Input value={roleInfo.route} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('License Number', 'رقم الرخصة', 'लाइसेंस नंबर')}</Label>
                          <Input value={roleInfo.licenseNumber} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{getText('Students Count', 'عدد الطلاب', 'छात्रों की संख्या')}</Label>
                          <Input value={roleInfo.studentsCount} disabled type="number" />
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {getText('Security Settings', 'إعدادات الأمان', 'सुरक्षा सेटिंग्स')}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">
                        {getText('Current Password', 'كلمة المرور الحالية', 'वर्तमान पासवर्ड')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          placeholder={getText('Enter current password', 'أدخل كلمة المرور الحالية', 'वर्तमान पासवर्ड दर्ज करें')}
                          className="pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
                          onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">
                        {getText('New Password', 'كلمة المرور الجديدة', 'नया पासवर्ड')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          placeholder={getText('Enter new password', 'أدخل كلمة المرور الجديدة', 'नया पासवर्ड दर्ज करें')}
                          className="pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        {getText('Confirm Password', 'تأكيد كلمة المرور', 'पासवर्ड की पुष्टि करें')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          placeholder={getText('Confirm new password', 'أكد كلمة المرور الجديدة', 'नए पासवर्ड की पुष्टि करें')}
                          className="pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <Button onClick={handleChangePassword} className="w-full gap-2">
                      <Key className="h-4 w-4" />
                      {getText('Change Password', 'تغيير كلمة المرور', 'पासवर्ड बदलें')}
                    </Button>
                  </div>

                  {/* NFC PIN Section - Staff Only */}
                  {isStaff && (
                    <div className="mt-8 pt-6 border-t space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          {getText('NFC Card PIN', 'رمز PIN للبطاقة', 'NFC कार्ड पिन')}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hasPinSet 
                          ? getText('You have a PIN set. You can change it below.', 'لديك رمز PIN مُعد. يمكنك تغييره أدناه.', 'आपके पास पिन सेट है। आप इसे नीचे बदल सकते हैं।')
                          : getText('Create a PIN for quick NFC card login', 'أنشئ رمز PIN للدخول السريع ببطاقة NFC', 'त्वरित NFC कार्ड लॉगिन के लिए पिन बनाएं')
                        }
                      </p>
                      <div className="flex flex-col items-center space-y-4">
                        <div className="space-y-2 w-full">
                          <Label>{getText('New PIN', 'رمز PIN جديد', 'नया पिन')}</Label>
                          <div className="flex justify-center">
                            <InputOTP maxLength={4} value={nfcPin} onChange={setNfcPin}>
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-12 h-12 text-xl" mask />
                                <InputOTPSlot index={1} className="w-12 h-12 text-xl" mask />
                                <InputOTPSlot index={2} className="w-12 h-12 text-xl" mask />
                                <InputOTPSlot index={3} className="w-12 h-12 text-xl" mask />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                        <div className="space-y-2 w-full">
                          <Label>{getText('Confirm PIN', 'تأكيد رمز PIN', 'पिन की पुष्टि करें')}</Label>
                          <div className="flex justify-center">
                            <InputOTP maxLength={4} value={confirmNfcPin} onChange={setConfirmNfcPin}>
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-12 h-12 text-xl" mask />
                                <InputOTPSlot index={1} className="w-12 h-12 text-xl" mask />
                                <InputOTPSlot index={2} className="w-12 h-12 text-xl" mask />
                                <InputOTPSlot index={3} className="w-12 h-12 text-xl" mask />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                        <Button 
                          className="w-full gap-2"
                          disabled={nfcPin.length !== 4 || confirmNfcPin.length !== 4 || pinLoading}
                          onClick={async () => {
                            if (nfcPin !== confirmNfcPin) {
                              toast({ title: getText('PINs do not match', 'الرمزان غير متطابقين', 'पिन मेल नहीं खाते'), variant: 'destructive' });
                              return;
                            }
                            setPinLoading(true);
                            try {
                              const { data, error } = await supabase.functions.invoke('set-nfc-pin', {
                                body: { pin: nfcPin, email: user?.email }
                              });
                              if (error || !data.success) throw new Error(data?.error || 'Failed');
                              toast({ title: getText('PIN saved successfully', 'تم حفظ رمز PIN', 'पिन सफलतापूर्वक सहेजा गया') });
                              setNfcPin('');
                              setConfirmNfcPin('');
                              setHasPinSet(true);
                            } catch (e: any) {
                              toast({ title: e.message, variant: 'destructive' });
                            } finally {
                              setPinLoading(false);
                            }
                          }}
                        >
                          <CreditCard className="h-4 w-4" />
                          {pinLoading 
                            ? getText('Saving...', 'جاري الحفظ...', 'सहेज रहा है...')
                            : hasPinSet 
                              ? getText('Change PIN', 'تغيير رمز PIN', 'पिन बदलें')
                              : getText('Create PIN', 'إنشاء رمز PIN', 'पिन बनाएं')
                          }
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;