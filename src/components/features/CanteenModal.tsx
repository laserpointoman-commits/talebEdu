import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, AlertCircle, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CanteenModal() {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {t('feature.canteen')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">{language === 'en' ? 'Allergy Alert' : 'تنبيه الحساسية'}</p>
                <p className="text-muted-foreground">
                  {language === 'en' ? 'Sara is allergic to: Peanuts, Tree nuts' : 'سارة لديها حساسية من: الفول السوداني، المكسرات'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">{language === 'en' ? "Today's Purchases" : 'مشتريات اليوم'}</h3>
              {[
                { 
                  item: language === 'en' ? 'Chicken Sandwich' : 'ساندويتش دجاج', 
                  price: 2.50, 
                  time: '12:30 PM', 
                  safe: true 
                },
                { 
                  item: language === 'en' ? 'Apple Juice' : 'عصير تفاح', 
                  price: 1.00, 
                  time: '12:32 PM', 
                  safe: true 
                },
              ].map((purchase, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    {purchase.safe ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{purchase.item}</p>
                      <p className="text-xs text-muted-foreground">{purchase.time}</p>
                    </div>
                  </div>
                  <span className="font-medium">{t('common.currency')} {purchase.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">{language === 'en' ? 'Purchase Restrictions' : 'قيود الشراء'}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="destructive">{language === 'en' ? 'No Peanuts' : 'بدون فول سوداني'}</Badge>
                <Badge variant="destructive">{language === 'en' ? 'No Tree Nuts' : 'بدون مكسرات'}</Badge>
                <Badge variant="secondary">
                  {language === 'en' ? 'Max Daily: ' : 'الحد اليومي: '}{t('common.currency')} 5.00
                </Badge>
              </div>
            </div>

            <div className="bg-accent/5 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{language === 'en' ? "Today's Total" : 'إجمالي اليوم'}</span>
                <span className="font-bold text-lg">{t('common.currency')} 3.50</span>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              {language === 'en' ? 'View Full History' : 'عرض السجل الكامل'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}