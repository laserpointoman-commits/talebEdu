import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NFCWriter from '@/components/admin/NFCWriter';
import { Tag } from 'lucide-react';
import { getText } from '@/utils/i18n';

export default function NFCManagement() {
  const { language } = useLanguage();
  const t = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Tag className="h-8 w-8" />
          {t('NFC Management', 'إدارة NFC', 'NFC प्रबंधन')}
        </h1>
        <p className="text-muted-foreground">
          {t('Program and manage NFC tags', 'برمجة وإدارة بطاقات NFC', 'NFC टैग प्रोग्राम और प्रबंधित करें')}
        </p>
      </div>

      <NFCWriter />
      
      <Card>
        <CardHeader>
          <CardTitle>
            {t('NFC Usage Instructions', 'إرشادات استخدام NFC', 'NFC उपयोग निर्देश')}
          </CardTitle>
          <CardDescription>
            {t('How to use the NFC system in school', 'كيفية استخدام نظام NFC في المدرسة', 'स्कूल में NFC सिस्टम का उपयोग कैसे करें')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-medium">
              {t('For Writing:', 'للكتابة:', 'लिखने के लिए:')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t('Open NFC app on Android device', 'افتح تطبيق NFC على جهاز أندرويد', 'Android डिवाइस पर NFC ऐप खोलें')}</li>
              <li>{t('Enter user information', 'أدخل معلومات المستخدم', 'उपयोगकर्ता जानकारी दर्ज करें')}</li>
              <li>{t('Hold tag near device', 'ضع البطاقة بالقرب من الجهاز', 'टैग को डिवाइस के पास रखें')}</li>
            </ul>
          </div>
          
          <div className="text-sm space-y-2">
            <p className="font-medium">
              {t('For Reading:', 'للقراءة:', 'पढ़ने के लिए:')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t('Used across all checkpoints', 'تستخدم عبر جميع نقاط التفتيش', 'सभी चेकपॉइंट्स पर उपयोग किया जाता है')}</li>
              <li>{t('Attendance - School entrance', 'الحضور - مدخل المدرسة', 'उपस्थिति - स्कूल प्रवेश द्वार')}</li>
              <li>{t('Bus - Boarding/Alighting', 'الحافلة - صعود ونزول', 'बस - चढ़ना/उतरना')}</li>
              <li>{t('Canteen - Payment', 'المقصف - الدفع', 'कैंटीन - भुगतान')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
