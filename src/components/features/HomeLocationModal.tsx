import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, MapPin, Navigation, Save } from 'lucide-react';

export default function HomeLocationModal() {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {t('parent.setHomeLocation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-[300px] bg-accent/10 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <MapPin className="h-12 w-12 mx-auto text-primary" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'انقر على الخريطة لتحديد موقع منزلك' : language === 'hi' ? 'अपने घर का स्थान सेट करने के लिए मैप पर क्लिक करें' : 'Click on the map to set your home location'}
                </p>
                <Button variant="outline" size="sm">
                  <Navigation className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'استخدم الموقع الحالي' : language === 'hi' ? 'वर्तमान स्थान का उपयोग करें' : 'Use Current Location'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="address">{language === 'ar' ? 'العنوان' : language === 'hi' ? 'पता' : 'Address'}</Label>
                <Input 
                  id="address" 
                  type="text" 
                  placeholder={language === 'ar' ? 'أدخل عنوان منزلك' : language === 'hi' ? 'अपने घर का पता दर्ज करें' : 'Enter your home address'}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="building">{language === 'ar' ? 'المبنى/الفيلا' : language === 'hi' ? 'भवन/विला' : 'Building/Villa'}</Label>
                  <Input 
                    id="building" 
                    type="text" 
                    placeholder={language === 'ar' ? 'اسم أو رقم المبنى' : language === 'hi' ? 'भवन का नाम या नंबर' : 'Building name or number'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="area">{language === 'ar' ? 'المنطقة' : language === 'hi' ? 'क्षेत्र' : 'Area'}</Label>
                  <Input 
                    id="area" 
                    type="text" 
                    placeholder={language === 'ar' ? 'اسم المنطقة' : language === 'hi' ? 'क्षेत्र का नाम' : 'Area name'}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">{language === 'ar' ? 'تعليمات خاصة (اختياري)' : language === 'hi' ? 'विशेष निर्देश (वैकल्पिक)' : 'Special Instructions (Optional)'}</Label>
                <Input 
                  id="instructions" 
                  type="text" 
                  placeholder={language === 'ar' ? 'أي تعليمات خاصة للاستلام/التوصيل' : language === 'hi' ? 'कोई विशेष पिकअप/ड्रॉप निर्देश' : 'Any special pickup/drop instructions'}
                  className="mt-1"
                />
              </div>
            </div>

            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'حفظ الموقع' : language === 'hi' ? 'स्थान सहेजें' : 'Save Location'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}