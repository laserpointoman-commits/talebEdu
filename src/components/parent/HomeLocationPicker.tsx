import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface HomeLocationPickerProps {
  value: {
    latitude?: number;
    longitude?: number;
    area?: string;
    areaAr?: string;
    address?: string;
  };
  onChange: (location: {
    latitude: number;
    longitude: number;
    area: string;
    areaAr: string;
    address: string;
  }) => void;
}

// Muscat areas with coordinates
const muscatAreas = [
  { name: 'Al Khuwair', nameAr: 'الخوير', lat: 23.5880, lng: 58.3829 },
  { name: 'Al Seeb', nameAr: 'السيب', lat: 23.6742, lng: 58.1892 },
  { name: 'Al Ghubra', nameAr: 'الغبرة', lat: 23.6102, lng: 58.4183 },
  { name: 'Qurum', nameAr: 'القرم', lat: 23.5957, lng: 58.4056 },
  { name: 'Ruwi', nameAr: 'روي', lat: 23.5661, lng: 58.5483 },
  { name: 'Madinat Al Sultan Qaboos', nameAr: 'مدينة السلطان قابوس', lat: 23.6214, lng: 58.3962 },
  { name: 'Bausher', nameAr: 'بوشر', lat: 23.6356, lng: 58.4125 },
  { name: 'Al Wadi Al Kabir', nameAr: 'الوادي الكبير', lat: 23.5532, lng: 58.5234 },
  { name: 'Al Mawaleh', nameAr: 'الموالح', lat: 23.5778, lng: 58.3512 },
  { name: 'Azaiba', nameAr: 'العذيبة', lat: 23.5450, lng: 58.3456 },
  { name: 'Muttrah', nameAr: 'مطرح', lat: 23.6100, lng: 58.5600 },
  { name: 'Al Hail', nameAr: 'الحيل', lat: 23.6850, lng: 58.2300 },
  { name: 'Darsait', nameAr: 'دارسيت', lat: 23.5520, lng: 58.5234 },
  { name: 'Al Athaiba', nameAr: 'العذيبة', lat: 23.5950, lng: 58.3234 },
  { name: 'Al Amerat', nameAr: 'العامرات', lat: 23.6300, lng: 58.5100 },
  { name: 'Shatti Al Qurum', nameAr: 'شاطئ القرم', lat: 23.5880, lng: 58.3950 },
  { name: 'Wadi Adai', nameAr: 'وادي عدي', lat: 23.6456, lng: 58.4678 },
  { name: 'Al Khoudh', nameAr: 'الخوض', lat: 23.6078, lng: 58.2456 },
  { name: 'Al Ansab', nameAr: 'الأنصب', lat: 23.5234, lng: 58.3678 },
  { name: 'Mabellah', nameAr: 'المعبيلة', lat: 23.6567, lng: 58.1456 },
  { name: 'Al Misfah', nameAr: 'المسفاة', lat: 23.6234, lng: 58.4456 },
];

export default function HomeLocationPicker({ value, onChange }: HomeLocationPickerProps) {
  const { language } = useLanguage();
  const [selectedArea, setSelectedArea] = useState<string>(value.area || '');
  const [address, setAddress] = useState<string>(value.address || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (value.area) {
      setSelectedArea(value.area);
    }
    if (value.address) {
      setAddress(value.address);
    }
  }, [value]);

  const handleAreaChange = (areaName: string) => {
    const area = muscatAreas.find(a => a.name === areaName);
    if (area) {
      setSelectedArea(areaName);
      onChange({
        latitude: area.lat,
        longitude: area.lng,
        area: area.name,
        areaAr: area.nameAr,
        address: address || `${area.name}, Muscat`,
      });
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    const area = muscatAreas.find(a => a.name === selectedArea);
    if (area) {
      onChange({
        latitude: area.lat,
        longitude: area.lng,
        area: area.name,
        areaAr: area.nameAr,
        address: newAddress,
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Geolocation is not supported' : 'تحديد الموقع غير مدعوم',
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Find nearest area
        let nearestArea = muscatAreas[0];
        let minDistance = Infinity;
        
        muscatAreas.forEach(area => {
          const distance = Math.sqrt(
            Math.pow(area.lat - latitude, 2) + Math.pow(area.lng - longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestArea = area;
          }
        });
        
        setSelectedArea(nearestArea.name);
        onChange({
          latitude,
          longitude,
          area: nearestArea.name,
          areaAr: nearestArea.nameAr,
          address: address || `${nearestArea.name}, Muscat`,
        });
        
        toast({
          title: language === 'en' ? 'Location Found' : 'تم تحديد الموقع',
          description: language === 'en' 
            ? `Nearest area: ${nearestArea.name}` 
            : `أقرب منطقة: ${nearestArea.nameAr}`,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          variant: 'destructive',
          title: language === 'en' ? 'Error' : 'خطأ',
          description: language === 'en' ? 'Could not get your location' : 'لا يمكن تحديد موقعك',
        });
        setIsGettingLocation(false);
      }
    );
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {language === 'en' ? 'Home Location (for Bus Route)' : 'موقع المنزل (لمسار الحافلة)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === 'en' ? 'Area' : 'المنطقة'}</Label>
            <Select value={selectedArea} onValueChange={handleAreaChange}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'en' ? 'Select your area' : 'اختر منطقتك'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {muscatAreas.map((area) => (
                  <SelectItem key={area.name} value={area.name}>
                    {language === 'en' ? area.name : area.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{language === 'en' ? 'Street / Building' : 'الشارع / المبنى'}</Label>
            <Input
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder={language === 'en' ? 'Building 42, Street 18' : 'مبنى 42، شارع 18'}
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
        >
          <Navigation className={`h-4 w-4 mr-2 ${isGettingLocation ? 'animate-spin' : ''}`} />
          {isGettingLocation
            ? (language === 'en' ? 'Getting Location...' : 'جاري تحديد الموقع...')
            : (language === 'en' ? 'Use Current Location' : 'استخدم الموقع الحالي')}
        </Button>

        {value.latitude && value.longitude && (
          <p className="text-xs text-muted-foreground text-center">
            📍 {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}