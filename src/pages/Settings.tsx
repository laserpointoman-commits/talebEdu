import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Bell, Globe, Moon, Shield, Smartphone, Volume2, Eye, EyeOff, Lock, Mail, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NotificationSettings from '@/components/settings/NotificationSettings';

const Settings = () => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    gradeAlerts: true,
    attendanceAlerts: true,
    messageAlerts: true,
    paymentReminders: true,
    
    // Appearance
    theme: 'light',
    fontSize: 'medium',
    
    // Privacy
    showProfile: true,
    showGrades: true,
    showAttendance: true,
    allowMessages: true,
    
    // Sound
    soundEnabled: true,
    soundVolume: 70,
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };

  const handleSaveSettings = () => {
    toast({
      title: getText("Settings Updated", "تم تحديث الإعدادات", "सेटिंग्स अपडेट हो गईं"),
      description: getText("Your preferences have been saved successfully.", "تم حفظ تفضيلاتك بنجاح.", "आपकी प्राथमिकताएं सफलतापूर्वक सहेजी गईं।"),
      variant: "success",
    });
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: getText("Password Mismatch", "عدم تطابق كلمة المرور", "पासवर्ड मेल नहीं खाता"),
        description: getText("New passwords do not match.", "كلمات المرور الجديدة غير متطابقة.", "नए पासवर्ड मेल नहीं खाते।"),
        variant: "destructive",
      });
      return;
    }
    
    // Reset form
    setPasswords({ current: '', new: '', confirm: '' });
    
    toast({
      title: getText("Password Changed", "تم تغيير كلمة المرور", "पासवर्ड बदल गया"),
      description: getText("Your password has been updated successfully.", "تم تحديث كلمة المرور الخاصة بك بنجاح.", "आपका पासवर्ड सफलतापूर्वक अपडेट हो गया।"),
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {getText('Settings', 'الإعدادات', 'सेटिंग्स')}
      </h1>

      <Tabs defaultValue="general" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className={`grid w-full grid-cols-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <TabsTrigger value="general">
            {getText('General', 'عام', 'सामान्य')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {getText('Notifications', 'الإشعارات', 'सूचनाएं')}
          </TabsTrigger>
          <TabsTrigger value="privacy">
            {getText('Privacy', 'الخصوصية', 'गोपनीयता')}
          </TabsTrigger>
          <TabsTrigger value="security">
            {getText('Security', 'الأمان', 'सुरक्षा')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {getText('General Settings', 'الإعدادات العامة', 'सामान्य सेटिंग्स')}
              </CardTitle>
              <CardDescription>
                {getText('Customize your general preferences', 'تخصيص تفضيلاتك العامة', 'अपनी सामान्य प्राथमिकताएं अनुकूलित करें')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('Language', 'اللغة', 'भाषा')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('Choose your preferred display language', 'اختر لغة العرض المفضلة', 'अपनी पसंदीदा प्रदर्शन भाषा चुनें')}
                  </p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {getText('Theme', 'المظهر', 'थीम')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('Choose between light and dark mode', 'اختر بين الوضع الفاتح والداكن', 'लाइट और डार्क मोड में से चुनें')}
                  </p>
                </div>
                <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{getText('Light', 'فاتح', 'लाइट')}</SelectItem>
                    <SelectItem value="dark">{getText('Dark', 'داكن', 'डार्क')}</SelectItem>
                    <SelectItem value="system">{getText('System', 'نظام', 'सिस्टम')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    {getText('Sound', 'الأصوات', 'ध्वनि')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('Enable application sounds', 'تفعيل أصوات التطبيق', 'एप्लिकेशन ध्वनियां सक्षम करें')}
                  </p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {getText('Privacy Settings', 'إعدادات الخصوصية', 'गोपनीयता सेटिंग्स')}
              </CardTitle>
              <CardDescription>
                {getText('Control who can see your information', 'التحكم في من يمكنه رؤية معلوماتك', 'नियंत्रित करें कि आपकी जानकारी कौन देख सकता है')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('Show Profile', 'إظهار الملف الشخصي', 'प्रोफ़ाइल दिखाएं')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('Allow others to view your profile', 'السماح للآخرين برؤية ملفك الشخصي', 'दूसरों को अपनी प्रोफ़ाइल देखने दें')}
                  </p>
                </div>
                <Switch
                  checked={settings.showProfile}
                  onCheckedChange={(checked) => setSettings({ ...settings, showProfile: checked })}
                />
              </div>

              {user?.role === 'student' && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{getText('Show Grades', 'إظهار الدرجات', 'ग्रेड दिखाएं')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {getText('Allow parents to see your grades', 'السماح للوالدين برؤية درجاتك', 'माता-पिता को आपके ग्रेड देखने दें')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.showGrades}
                      onCheckedChange={(checked) => setSettings({ ...settings, showGrades: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{getText('Show Attendance', 'إظهار الحضور', 'उपस्थिति दिखाएं')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {getText('Allow parents to see your attendance record', 'السماح للوالدين برؤية سجل حضورك', 'माता-पिता को आपका उपस्थिति रिकॉर्ड देखने दें')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.showAttendance}
                      onCheckedChange={(checked) => setSettings({ ...settings, showAttendance: checked })}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('Allow Messages', 'السماح بالرسائل', 'संदेशों की अनुमति दें')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('Allow others to send you messages', 'السماح للآخرين بإرسال رسائل إليك', 'दूसरों को आपको संदेश भेजने दें')}
                  </p>
                </div>
                <Switch
                  checked={settings.allowMessages}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowMessages: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {getText('Security', 'الأمان', 'सुरक्षा')}
              </CardTitle>
              <CardDescription>
                {getText('Manage your password and security settings', 'إدارة كلمة المرور وإعدادات الأمان', 'अपना पासवर्ड और सुरक्षा सेटिंग्स प्रबंधित करें')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {getText('Change Password', 'تغيير كلمة المرور', 'पासवर्ड बदलें')}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="current-password">
                    {getText('Current Password', 'كلمة المرور الحالية', 'वर्तमान पासवर्ड')}
                  </Label>
                  <div className="relative" dir="ltr">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder={getText('Enter current password', 'أدخل كلمة المرور الحالية', 'वर्तमान पासवर्ड दर्ज करें')}
                      className="pr-12"
                      dir="ltr"
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
                  <div className="relative" dir="ltr">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder={getText('Enter new password', 'أدخل كلمة المرور الجديدة', 'नया पासवर्ड दर्ज करें')}
                      className="pr-12"
                      dir="ltr"
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
                  <div className="relative" dir="ltr">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder={getText('Confirm new password', 'أكد كلمة المرور الجديدة', 'नए पासवर्ड की पुष्टि करें')}
                      className="pr-12"
                      dir="ltr"
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

                <Button onClick={handleChangePassword} className="w-full">
                  {getText('Change Password', 'تغيير كلمة المرور', 'पासवर्ड बदलें')}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    {getText('Login Sessions', 'جلسات تسجيل الدخول', 'लॉगिन सत्र')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getText('Last login: ', 'آخر تسجيل دخول: ', 'अंतिम लॉगिन: ')}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}>
          {getText('Save Settings', 'حفظ الإعدادات', 'सेटिंग्स सहेजें')}
        </Button>
      </div>
    </div>
  );
};

export default Settings;