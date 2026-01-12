import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'الملف الشخصي' : 'My Profile'}
        </h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            {language === 'ar' ? 'تعديل' : 'Edit Profile'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="default" className="gap-2">
              <Save className="h-4 w-4" />
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-gradient-primary text-white text-3xl">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{profile?.full_name || user?.email}</h3>
                <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1">
              <Tabs defaultValue="personal" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <TabsList className={`grid w-full grid-cols-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <TabsTrigger value="personal">
                    {language === 'ar' ? 'معلومات شخصية' : 'Personal Info'}
                  </TabsTrigger>
                  <TabsTrigger value="role">
                    {language === 'ar' ? 'معلومات الدور' : 'Role Info'}
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    {language === 'ar' ? 'الأمان' : 'Security'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {language === 'ar' ? 'الاسم' : 'Name'}
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
                        {language === 'ar' ? 'الاسم بالعربية' : 'Name in Arabic'}
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
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
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
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
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
                        {language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
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
                        {language === 'ar' ? 'العنوان' : 'Address'}
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
                          <Label>{language === 'ar' ? 'رقم الموظف' : 'Employee ID'}</Label>
                          <Input value={roleInfo.employeeId} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'القسم' : 'Department'}</Label>
                          <Input value={roleInfo.department} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'المواد' : 'Subjects'}</Label>
                          <Input value={roleInfo.subjects?.join(', ')} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'الفصول' : 'Classes'}</Label>
                          <Input value={roleInfo.classes?.join(', ')} disabled />
                        </div>
                      </>
                    )}

                    {profile?.role === 'student' && (
                      <>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'رقم الطالب' : 'Student ID'}</Label>
                          <Input value={roleInfo.studentId} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'الفصل' : 'Class'}</Label>
                          <Input value={roleInfo.class} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'رقم الجلوس' : 'Roll Number'}</Label>
                          <Input value={roleInfo.rollNumber} disabled type="number" />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'ولي الأمر' : 'Parent Name'}</Label>
                          <Input value={roleInfo.parentName} disabled />
                        </div>
                      </>
                    )}

                    {profile?.role === 'parent' && (
                      <>
                        <div className="space-y-2 md:col-span-2">
                          <Label>{language === 'ar' ? 'الأطفال' : 'Children'}</Label>
                          {roleInfo.children?.map((child, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-muted/30">
                              <p className="font-medium">{child.name}</p>
                              <p className="text-sm text-muted-foreground">
                                <span className="number-display">{language === 'en' ? 'Class' : 'الفصل'}: {child.class} | {language === 'en' ? 'ID' : 'المعرف'}: {child.studentId}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'رقم الطوارئ' : 'Emergency Contact'}</Label>
                          <Input value={roleInfo.emergencyContact} disabled type="tel" />
                        </div>
                      </>
                    )}

                    {profile?.role === 'driver' && (
                      <>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'رقم الحافلة' : 'Bus Number'}</Label>
                          <Input value={roleInfo.busNumber} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'المسار' : 'Route'}</Label>
                          <Input value={roleInfo.route} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'رقم الرخصة' : 'License Number'}</Label>
                          <Input value={roleInfo.licenseNumber} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'ar' ? 'عدد الطلاب' : 'Students Count'}</Label>
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
                      {language === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">
                        {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
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
                        {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
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
                        {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          placeholder={language === 'ar' ? 'أكد كلمة المرور الجديدة' : 'Confirm new password'}
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
                      {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                    </Button>
                  </div>

                  {/* NFC PIN Section - Staff Only */}
                  {isStaff && (
                    <div className="mt-8 pt-6 border-t space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          {language === 'ar' ? 'رمز PIN للبطاقة' : 'NFC Card PIN'}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hasPinSet 
                          ? (language === 'ar' ? 'لديك رمز PIN مُعد. يمكنك تغييره أدناه.' : 'You have a PIN set. You can change it below.')
                          : (language === 'ar' ? 'أنشئ رمز PIN للدخول السريع ببطاقة NFC' : 'Create a PIN for quick NFC card login')
                        }
                      </p>
                      <div className="flex flex-col items-center space-y-4">
                        <div className="space-y-2 w-full">
                          <Label>{language === 'ar' ? 'رمز PIN جديد' : 'New PIN'}</Label>
                          <div className="flex justify-center">
                            <InputOTP maxLength={4} value={nfcPin} onChange={setNfcPin}>
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                                <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                                <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                                <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                        <div className="space-y-2 w-full">
                          <Label>{language === 'ar' ? 'تأكيد رمز PIN' : 'Confirm PIN'}</Label>
                          <div className="flex justify-center">
                            <InputOTP maxLength={4} value={confirmNfcPin} onChange={setConfirmNfcPin}>
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                                <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                                <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                                <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                        <Button 
                          className="w-full gap-2"
                          disabled={nfcPin.length !== 4 || confirmNfcPin.length !== 4 || pinLoading}
                          onClick={async () => {
                            if (nfcPin !== confirmNfcPin) {
                              toast({ title: language === 'ar' ? 'الرمزان غير متطابقين' : 'PINs do not match', variant: 'destructive' });
                              return;
                            }
                            setPinLoading(true);
                            try {
                              const { data, error } = await supabase.functions.invoke('set-nfc-pin', {
                                body: { pin: nfcPin, email: user?.email }
                              });
                              if (error || !data.success) throw new Error(data?.error || 'Failed');
                              toast({ title: language === 'ar' ? 'تم حفظ رمز PIN' : 'PIN saved successfully' });
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
                            ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                            : hasPinSet 
                              ? (language === 'ar' ? 'تغيير رمز PIN' : 'Change PIN')
                              : (language === 'ar' ? 'إنشاء رمز PIN' : 'Create PIN')
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