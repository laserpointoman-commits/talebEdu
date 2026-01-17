import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { MapPin, Locate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HomeLocationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  language?: 'en' | 'ar' | 'hi';
}

export default function HomeLocationMap({
  onLocationSelect,
  initialLat = 23.588,
  initialLng = 58.3829,
  language = 'en',
}: HomeLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const { toast } = useToast();

  const getTranslation = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };

  const t = {
    getCurrentLocation: getTranslation('Use Current Location', 'استخدام الموقع الحالي', 'वर्तमान स्थान का उपयोग करें'),
    selectLocation: getTranslation('Click on map to select location', 'انقر على الخريطة لتحديد الموقع', 'स्थान चुनने के लिए मानचित्र पर क्लिक करें'),
    locationError: getTranslation('Unable to get location', 'تعذر الحصول على الموقع', 'स्थान प्राप्त करने में असमर्थ'),
    locationSuccess: getTranslation('Location set', 'تم تحديد الموقع', 'स्थान सेट किया गया'),
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const osmRasterStyle: any = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    };

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: osmRasterStyle,
      center: [initialLng, initialLat],
      zoom: 13,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add initial marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: 'hsl(var(--primary))',
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    // Update coordinates when marker is dragged
    marker.current.on('dragend', () => {
      const lngLat = marker.current!.getLngLat();
      setCoordinates({ lat: lngLat.lat, lng: lngLat.lng });
      onLocationSelect(lngLat.lat, lngLat.lng);
    });

    // Add click handler to move marker
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      setCoordinates({ lat, lng });
      onLocationSelect(lat, lng);
    });

    // Ensure correct sizing (helps when mounted inside dialogs/transitions)
    requestAnimationFrame(() => map.current?.resize());

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t.locationError,
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        onLocationSelect(latitude, longitude);

        // Move map and marker to current location
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
        });
        marker.current?.setLngLat([longitude, latitude]);

        toast({
          title: t.locationSuccess,
          description: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        });
      },
      (error) => {
        toast({
          title: t.locationError,
          description: error.message,
          variant: 'destructive',
        });
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className={language === 'ar' ? 'text-right' : ''}>
            {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} className="gap-2">
          <Locate className="h-4 w-4" />
          {t.getCurrentLocation}
        </Button>
      </div>

      <div ref={mapContainer} className="w-full h-[400px] rounded-lg border shadow-sm" />

      <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>{t.selectLocation}</p>
    </div>
  );
}
