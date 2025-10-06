import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NFCWriter from '@/components/admin/NFCWriter';
import { Tag } from 'lucide-react';

export default function NFCManagement() {
  const { language } = useLanguage();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Tag className="h-8 w-8" />
          {language === 'ar' ? 'إدارة NFC' : 'NFC Management'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'برمجة وإدارة بطاقات NFC'
            : 'Program and manage NFC tags'}
        </p>
      </div>

      <NFCWriter />
      
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'إرشادات استخدام NFC' : 'NFC Usage Instructions'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'كيفية استخدام نظام NFC في المدرسة'
              : 'How to use the NFC system in school'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-medium">
              {language === 'ar' ? 'للكتابة:' : 'For Writing:'}
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{language === 'ar' ? 'افتح تطبيق NFC على جهاز أندرويد' : 'Open NFC app on Android device'}</li>
              <li>{language === 'ar' ? 'أدخل معلومات المستخدم' : 'Enter user information'}</li>
              <li>{language === 'ar' ? 'ضع البطاقة بالقرب من الجهاز' : 'Hold tag near device'}</li>
            </ul>
          </div>
          
          <div className="text-sm space-y-2">
            <p className="font-medium">
              {language === 'ar' ? 'للقراءة:' : 'For Reading:'}
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{language === 'ar' ? 'تستخدم عبر جميع نقاط التفتيش' : 'Used across all checkpoints'}</li>
              <li>{language === 'ar' ? 'الحضور - مدخل المدرسة' : 'Attendance - School entrance'}</li>
              <li>{language === 'ar' ? 'الحافلة - صعود ونزول' : 'Bus - Boarding/Alighting'}</li>
              <li>{language === 'ar' ? 'المقصف - الدفع' : 'Canteen - Payment'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
