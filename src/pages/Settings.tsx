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
import { Bell, Globe, Moon, Shield, Volume2, Eye, EyeOff, Lock, Settings as SettingsIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NotificationSettings from '@/components/settings/NotificationSettings';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    gradeAlerts: true,
    attendanceAlerts: true,
    messageAlerts: true,
    paymentReminders: true,
    theme: 'light',
    fontSize: 'medium',
    showProfile: true,
    showGrades: true,
    showAttendance: true,
    allowMessages: true,
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
    
    setPasswords({ current: '', new: '', confirm: '' });
    
    toast({
      title: getText("Password Changed", "تم تغيير كلمة المرور", "पासवर्ड बदल गया"),
      description: getText("Your password has been updated successfully.", "تم تحديث كلمة المرور الخاصة بك بنجاح.", "आपका पासवर्ड सफलतापूर्वक अपडेट हो गया।"),
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <SettingsIcon className="h-6 w-6" />
            </div>
            {getText('Settings', 'الإعدادات', 'सेटिंग्स')}
          </h1>
          <p className="text-white/80 mt-1">
            {getText('Customize your app preferences', 'تخصيص تفضيلات التطبيق', 'अपनी ऐप प्राथमिकताएं अनुकूलित करें')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className={`grid w-full grid-cols-4 bg-muted/50 rounded-xl p-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-background">
            {getText('General', 'عام', 'सामान्य')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-background">
            {getText('Notifications', 'الإشعارات', 'सूचनाएं')}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-lg data-[state=active]:bg-background">
            {getText('Privacy', 'الخصوصية', 'गोपनीयता')}
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background">
            {getText('Security', 'الأمان', 'सुरक्षा')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-sky-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {getText('General Settings', 'الإعدادات العامة', 'सामान्य सेटिंग्स')}
                </CardTitle>
                <CardDescription>
                  {getText('Customize your general preferences', 'تخصيص تفضيلاتك العامة', 'अपनी सामान्य प्राथमिकताएं अनुकूलित करें')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
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

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
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

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
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

                <Button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-primary to-sky-500 hover:from-primary/90 hover:to-sky-500/90">
                  {getText('Save Changes', 'حفظ التغييرات', 'परिवर्तन सहेजें')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <NotificationSettings />
          </motion.div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-500" />
                  {getText('Privacy Settings', 'إعدادات الخصوصية', 'गोपनीयता सेटिंग्स')}
                </CardTitle>
                <CardDescription>
                  {getText('Control who can see your information', 'التحكم في من يمكنه رؤية معلوماتك', 'नियंत्रित करें कि आपकी जानकारी कौन देख सकता है')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
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

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
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

                <Button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                  {getText('Save Privacy Settings', 'حفظ إعدادات الخصوصية', 'गोपनीयता सेटिंग्स सहेजें')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  {getText('Security', 'الأمان', 'सुरक्षा')}
                </CardTitle>
                <CardDescription>
                  {getText('Manage your password and security settings', 'إدارة كلمة المرور وإعدادات الأمان', 'अपना पासवर्ड और सुरक्षा सेटिंग्स प्रबंधित करें')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
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
                </div>

                <Button onClick={handleChangePassword} className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                  {getText('Change Password', 'تغيير كلمة المرور', 'पासवर्ड बदलें')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
