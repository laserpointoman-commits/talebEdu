import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, DollarSign, FileText } from 'lucide-react';

export default function PaymentModal() {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('feature.payments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-accent/5 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('parent.totalFees')}</span>
                <span className="font-medium">{t('common.currency')} 5,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('parent.paid')}</span>
                <span className="font-medium text-success">{t('common.currency')} 3,500.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('parent.remaining')}</span>
                <span className="font-bold text-destructive">{t('common.currency')} 1,500.00</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="amount">{language === 'en' ? 'Amount to Pay' : 'المبلغ المطلوب دفعه'}</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="0.00" 
                  defaultValue="1500.00"
                  className="mt-1 number-display"
                  dir="ltr"
                />
              </div>

              <div>
                <Label htmlFor="card">{language === 'en' ? 'Card Number' : 'رقم البطاقة'}</Label>
                <Input 
                  id="card" 
                  type="text" 
                  placeholder={language === 'en' ? '1234 5678 9012 3456' : '1234 5678 9012 3456'}
                  className="mt-1"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expiry">{language === 'en' ? 'Expiry Date' : 'تاريخ الانتهاء'}</Label>
                  <Input 
                    id="expiry" 
                    type="text" 
                    placeholder={language === 'en' ? 'MM/YY' : 'شهر/سنة'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">{language === 'en' ? 'CVV' : 'رمز الأمان'}</Label>
                  <Input 
                    id="cvv" 
                    type="text" 
                    placeholder="123"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Process Payment' : 'معالجة الدفعة'}
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Invoice' : 'الفاتورة'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}