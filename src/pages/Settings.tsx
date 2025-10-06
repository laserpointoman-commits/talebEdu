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

  const handleSaveSettings = () => {
    toast({
      title: language === 'en' ? "Settings Updated" : "تم تحديث الإعدادات",
      description: language === 'en' ? "Your preferences have been saved successfully." : "تم حفظ تفضيلاتك بنجاح.",
      variant: "success",
    });
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: language === 'en' ? "Password Mismatch" : "عدم تطابق كلمة المرور",
        description: language === 'en' ? "New passwords do not match." : "كلمات المرور الجديدة غير متطابقة.",
        variant: "destructive",
      });
      return;
    }
    
    // Reset form
    setPasswords({ current: '', new: '', confirm: '' });
    
    toast({
      title: language === 'en' ? "Password Changed" : "تم تغيير كلمة المرور",
      description: language === 'en' ? "Your password has been updated successfully." : "تم تحديث كلمة المرور الخاصة بك بنجاح.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {language === 'ar' ? 'الإعدادات' : 'Settings'}
      </h1>

      <Tabs defaultValue="general" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className={`grid w-full grid-cols-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <TabsTrigger value="general">
            {language === 'ar' ? 'عام' : 'General'}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </TabsTrigger>
          <TabsTrigger value="privacy">
            {language === 'ar' ? 'الخصوصية' : 'Privacy'}
          </TabsTrigger>
          <TabsTrigger value="security">
            {language === 'ar' ? 'الأمان' : 'Security'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تخصيص تفضيلاتك العامة' : 'Customize your general preferences'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === 'ar' ? 'اللغة' : 'Language'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'اختر لغة العرض المفضلة' : 'Choose your preferred display language'}
                  </p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {language === 'ar' ? 'المظهر' : 'Theme'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'اختر بين الوضع الفاتح والداكن' : 'Choose between light and dark mode'}
                  </p>
                </div>
                <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{language === 'ar' ? 'فاتح' : 'Light'}</SelectItem>
                    <SelectItem value="dark">{language === 'ar' ? 'داكن' : 'Dark'}</SelectItem>
                    <SelectItem value="system">{language === 'ar' ? 'نظام' : 'System'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    {language === 'ar' ? 'الأصوات' : 'Sound'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'تفعيل أصوات التطبيق' : 'Enable application sounds'}
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
                {language === 'ar' ? 'إعدادات الخصوصية' : 'Privacy Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'التحكم في من يمكنه رؤية معلوماتك' : 'Control who can see your information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === 'ar' ? 'إظهار الملف الشخصي' : 'Show Profile'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السماح للآخرين برؤية ملفك الشخصي' : 'Allow others to view your profile'}
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
                      <Label>{language === 'ar' ? 'إظهار الدرجات' : 'Show Grades'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'السماح للوالدين برؤية درجاتك' : 'Allow parents to see your grades'}
                      </p>
                    </div>
                    <Switch
                      checked={settings.showGrades}
                      onCheckedChange={(checked) => setSettings({ ...settings, showGrades: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{language === 'ar' ? 'إظهار الحضور' : 'Show Attendance'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'السماح للوالدين برؤية سجل حضورك' : 'Allow parents to see your attendance record'}
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
                  <Label>{language === 'ar' ? 'السماح بالرسائل' : 'Allow Messages'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السماح للآخرين بإرسال رسائل إليك' : 'Allow others to send you messages'}
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
                {language === 'ar' ? 'الأمان' : 'Security'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إدارة كلمة المرور وإعدادات الأمان' : 'Manage your password and security settings'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="current-password">
                    {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                  </Label>
                  <div className="relative" dir="ltr">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
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
                    {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                  </Label>
                  <div className="relative" dir="ltr">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
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
                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </Label>
                  <div className="relative" dir="ltr">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder={language === 'ar' ? 'أكد كلمة المرور الجديدة' : 'Confirm new password'}
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
                  {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    {language === 'ar' ? 'جلسات تسجيل الدخول' : 'Login Sessions'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'آخر تسجيل دخول: ' : 'Last login: '}
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
          {language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;