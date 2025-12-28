import { useState, useEffect, useRef } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { 
  X,
  MapPin,
  Crosshair,
  Loader2,
  Navigation,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface LocationShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (latitude: number, longitude: number, address?: string) => void;
  isArabic?: boolean;
  colors: {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    divider: string;
  };
}

export function LocationShareSheet({
  open,
  onOpenChange,
  onLocationSelect,
  isArabic = false,
  colors
}: LocationShareSheetProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  useEffect(() => {
    if (open) {
      getCurrentLocation();
    } else {
      // Reset state when closed
      setLocation(null);
      setAccuracy(null);
      setAddress('');
      setError(null);
    }
  }, [open]);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError(t('Location not supported by your browser', 'الموقع غير مدعوم من متصفحك'));
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setAccuracy(accuracy);
        
        // Try to get address using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name) {
            setAddress(data.display_name);
          }
        } catch (e) {
          console.log('Could not fetch address');
        }
        
        setLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = t('Could not get your location', 'تعذر الحصول على موقعك');
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = t('Location access denied. Please enable location in your browser settings.', 'تم رفض الوصول للموقع. يرجى تفعيل الموقع في إعدادات المتصفح.');
        } else if (err.code === err.TIMEOUT) {
          errorMessage = t('Location request timed out', 'انتهت مهلة طلب الموقع');
        }
        setError(errorMessage);
        setLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleSendLocation = () => {
    if (location) {
      onLocationSelect(location.lat, location.lng, address);
      onOpenChange(false);
    }
  };

  const formatAccuracy = (meters: number) => {
    if (meters < 100) {
      return `±${Math.round(meters)}m`;
    } else if (meters < 1000) {
      return `±${Math.round(meters)}m`;
    } else {
      return `±${(meters / 1000).toFixed(1)}km`;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        className="border-0 max-h-[90vh]"
        style={{ backgroundColor: colors.bgSecondary }}
      >
        <DrawerHeader className="flex items-center justify-between border-b" style={{ borderColor: colors.divider }}>
          <DrawerTitle style={{ color: colors.textPrimary }}>
            {t('Share Location', 'مشاركة الموقع')}
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" style={{ color: colors.textSecondary }} />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="flex flex-col" style={{ minHeight: '60vh' }}>
          {/* Map Preview Area */}
          <div 
            ref={mapRef}
            className="relative flex-1 min-h-[300px] flex items-center justify-center"
            style={{ backgroundColor: colors.bgTertiary }}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: colors.accent }} />
                <p style={{ color: colors.textSecondary }}>
                  {t('Getting your location...', 'جاري الحصول على موقعك...')}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4 p-6 text-center">
                <div 
                  className="h-16 w-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                >
                  <MapPin className="h-8 w-8 text-red-500" />
                </div>
                <p style={{ color: colors.textSecondary }}>{error}</p>
                <Button
                  onClick={getCurrentLocation}
                  style={{ backgroundColor: colors.accent }}
                  className="text-white"
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  {t('Try Again', 'حاول مجدداً')}
                </Button>
              </div>
            ) : location ? (
              <div className="absolute inset-0">
                {/* Map iframe from OpenStreetMap */}
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  style={{ border: 0 }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.003},${location.lng + 0.005},${location.lat + 0.003}&layer=mapnik&marker=${location.lat},${location.lng}`}
                />
                
                {/* Accuracy indicator */}
                {accuracy && (
                  <div 
                    className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5"
                    style={{ backgroundColor: colors.bg, color: colors.textPrimary }}
                  >
                    <Navigation className="h-4 w-4" style={{ color: colors.accent }} />
                    {t('Accuracy', 'الدقة')}: {formatAccuracy(accuracy)}
                  </div>
                )}
                
                {/* Recenter button */}
                <Button
                  onClick={getCurrentLocation}
                  size="icon"
                  className="absolute bottom-3 right-3 h-12 w-12 rounded-full shadow-lg"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Crosshair className="h-5 w-5" style={{ color: colors.accent }} />
                </Button>
              </div>
            ) : null}
          </div>

          {/* Location Info & Send Button */}
          {location && !loading && (
            <div 
              className="p-4 space-y-4"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              {/* Address */}
              <div className="flex items-start gap-3">
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                >
                  <MapPin className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    {t('Your Current Location', 'موقعك الحالي')}
                  </p>
                  <p 
                    className="text-sm truncate"
                    style={{ color: colors.textSecondary }}
                  >
                    {address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                  </p>
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendLocation}
                className="w-full h-12 text-base font-medium text-white"
                style={{ backgroundColor: colors.accent }}
              >
                <Check className="h-5 w-5 mr-2" />
                {t('Send This Location', 'إرسال هذا الموقع')}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}