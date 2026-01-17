import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { School, Bus, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

export default function Devices() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);

  const devices = [
    {
      id: 'school-entrance',
      title: t('School Entrance Device', 'جهاز مدخل المدرسة', 'स्कूल प्रवेश उपकरण'),
      description: t(
        'NFC check-in/out system for school entrance. Tracks attendance and processes daily allowances.',
        'نظام تسجيل الدخول/الخروج NFC لمدخل المدرسة. يتتبع الحضور ويعالج البدلات اليومية.',
        'स्कूल प्रवेश के लिए NFC चेक-इन/आउट सिस्टम। उपस्थिति ट्रैक करता है और दैनिक भत्ते संसाधित करता है।'
      ),
      icon: School,
      route: '/dashboard/devices/school-entrance',
      color: 'from-primary/10 to-secondary/10'
    },
    {
      id: 'bus-device',
      title: t('Bus Tracking Device', 'جهاز تتبع الحافلة', 'बस ट्रैकिंग उपकरण'),
      description: t(
        'NFC system for buses to track student boarding and exit at different stops.',
        'نظام NFC للحافلات لتتبع صعود ونزول الطلاب في محطات مختلفة.',
        'विभिन्न स्टॉप पर छात्रों के चढ़ने और उतरने को ट्रैक करने के लिए बसों के लिए NFC सिस्टम।'
      ),
      icon: Bus,
      route: '/dashboard/devices/bus',
      color: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      id: 'admin',
      title: t('Device Management', 'إدارة الأجهزة', 'उपकरण प्रबंधन'),
      description: t(
        'Admin panel to manage all devices, view logs, and configure settings.',
        'لوحة الإدارة لإدارة جميع الأجهزة وعرض السجلات وتكوين الإعدادات.',
        'सभी उपकरणों को प्रबंधित करने, लॉग देखने और सेटिंग्स कॉन्फ़िगर करने के लिए एडमिन पैनल।'
      ),
      icon: Shield,
      route: '/dashboard',
      color: 'from-purple-500/10 to-pink-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t('Device Selection', 'اختيار الجهاز', 'उपकरण चयन')}
          </h1>
          <p className="text-muted-foreground">
            {t(
              'Choose a device interface to access NFC attendance and tracking systems',
              'اختر واجهة جهاز للوصول إلى أنظمة الحضور والتتبع NFC',
              'NFC उपस्थिति और ट्रैकिंग सिस्टम तक पहुंचने के लिए एक उपकरण इंटरफ़ेस चुनें'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const Icon = device.icon;
            return (
              <Card 
                key={device.id}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(device.route)}
              >
                <CardHeader>
                  <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${device.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-16 w-16 text-foreground/60" />
                  </div>
                  <CardTitle>{device.title}</CardTitle>
                  <CardDescription>{device.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    {t('Access Device', 'الوصول للجهاز', 'उपकरण एक्सेस करें')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-orange-700 dark:text-orange-400">
              ℹ️ {t('How It Works', 'كيف يعمل', 'यह कैसे काम करता है')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>{t('School Entrance Device:', 'جهاز مدخل المدرسة:', 'स्कूल प्रवेश उपकरण:')}</strong> {t(
                'Students tap their NFC cards when entering or leaving school. The system automatically records attendance, processes daily allowances on check-in, and sends notifications to parents.',
                'يقوم الطلاب بمسح بطاقات NFC عند الدخول أو الخروج من المدرسة. يسجل النظام الحضور تلقائياً ويعالج البدلات اليومية عند تسجيل الدخول ويرسل إشعارات للآباء.',
                'छात्र स्कूल में प्रवेश या निकलते समय अपने NFC कार्ड टैप करते हैं। सिस्टम स्वचालित रूप से उपस्थिति रिकॉर्ड करता है, चेक-इन पर दैनिक भत्ते संसाधित करता है, और माता-पिता को सूचनाएं भेजता है।'
              )}
            </p>
            <p>
              <strong>{t('Bus Device:', 'جهاز الحافلة:', 'बस उपकरण:')}</strong> {t(
                'Installed on school buses to track when students board or exit at various stops. Parents receive real-time notifications about their child\'s bus location and status.',
                'مثبت على الحافلات المدرسية لتتبع صعود أو نزول الطلاب في مختلف المحطات. يتلقى الآباء إشعارات فورية حول موقع وحالة حافلة طفلهم.',
                'छात्रों के विभिन्न स्टॉप पर चढ़ने या उतरने को ट्रैक करने के लिए स्कूल बसों पर स्थापित। माता-पिता को अपने बच्चे की बस स्थान और स्थिति के बारे में रियल-टाइम सूचनाएं प्राप्त होती हैं।'
              )}
            </p>
            <p>
              <strong>{t('Integration:', 'التكامل:', 'एकीकरण:')}</strong> {t(
                'All devices sync with the main system in real-time, updating student records, wallet balances, and sending notifications through the backend.',
                'تتزامن جميع الأجهزة مع النظام الرئيسي في الوقت الفعلي، وتحديث سجلات الطلاب وأرصدة المحفظة وإرسال الإشعارات عبر النظام.',
                'सभी उपकरण मुख्य सिस्टम के साथ रियल-टाइम में सिंक होते हैं, छात्र रिकॉर्ड, वॉलेट बैलेंस अपडेट करते हैं, और बैकएंड के माध्यम से सूचनाएं भेजते हैं।'
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}