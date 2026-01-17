import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// Using OpenStreetMap raster tiles for the base map (no token required).

interface BusMapProps {
  busId: string;
  studentLocation?: { lat: number; lng: number };
}

export default function BusMap({ busId, studentLocation }: BusMapProps) {
  const { language } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const busMarker = useRef<mapboxgl.Marker | null>(null);
  const studentMarker = useRef<mapboxgl.Marker | null>(null);
  const userInteractedRef = useRef(false);
  const hasAutoCenteredRef = useRef(false);

  const [busLocation, setBusLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    setMapStatus('loading');
    setMapError(null);

    let m: mapboxgl.Map | null = null;
    let handleWindowResize: (() => void) | null = null;
    let onMoveStart: ((e: any) => void) | null = null;

    try {
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

      m = new mapboxgl.Map({
        container: mapContainer.current,
        style: osmRasterStyle,
        center: [58.4059, 23.588], // Oman center
        zoom: 12,
      });

      map.current = m;
      m.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // If the user moves the map, stop auto-follow
      onMoveStart = (e: any) => {
        if (e?.originalEvent) userInteractedRef.current = true;
      };
      m.on('movestart', onMoveStart);

      const onLoad = () => {
        setMapStatus('ready');

        // PageTransition uses transforms; Mapbox often needs an explicit resize after animations.
        requestAnimationFrame(() => m?.resize());
        setTimeout(() => m?.resize(), 450);
      };

      const onError = (e: any) => {
        console.error('Map error:', e?.error || e);
        setMapStatus('error');
        setMapError(e?.error?.message || 'Map failed to load');
      };

      m.on('load', onLoad);
      m.on('error', onError);

      handleWindowResize = () => m?.resize();
      window.addEventListener('resize', handleWindowResize);

      return () => {
        window.removeEventListener('resize', handleWindowResize!);
        m?.off('load', onLoad);
        m?.off('error', onError);
        if (onMoveStart) m?.off('movestart', onMoveStart);
        m?.remove();
        map.current = null;
        busMarker.current = null;
        studentMarker.current = null;
      };
    } catch (err: any) {
      console.error('Map init error:', err);
      setMapStatus('error');
      setMapError(err?.message || 'Map failed to initialize');
      return;
    }
  }, []);

  // Load initial bus location
  useEffect(() => {
    userInteractedRef.current = false;
    hasAutoCenteredRef.current = false;
    loadBusLocation();
  }, [busId]);

  // Subscribe to real-time location updates
  useEffect(() => {
    const channel = supabase
      .channel(`bus-location-${busId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_locations',
          filter: `bus_id=eq.${busId}`,
        },
        (payload) => {
          if (payload.new && 'latitude' in payload.new && 'longitude' in payload.new) {
            const newLocation = {
              latitude: payload.new.latitude as number,
              longitude: payload.new.longitude as number,
            };
            setBusLocation(newLocation);
            updateBusMarker(newLocation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [busId]);

  // Update student marker when location changes
  useEffect(() => {
    if (studentLocation && map.current) {
      if (!studentMarker.current) {
        const el = document.createElement('div');
        el.className = 'student-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'hsl(var(--success))';
        el.style.border = '3px solid hsl(var(--background))';
        el.style.boxShadow = '0 2px 6px hsl(var(--foreground) / 0.25)';
        studentMarker.current = new mapboxgl.Marker(el)
          .setLngLat([studentLocation.lng, studentLocation.lat])
          .setPopup(new mapboxgl.Popup().setText(language === 'ar' ? 'موقع الطالب' : 'Student Location'))
          .addTo(map.current);
      } else {
        studentMarker.current.setLngLat([studentLocation.lng, studentLocation.lat]);
      }
    }
  }, [studentLocation, language]);

  const loadBusLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_locations')
        .select('*')
        .eq('bus_id', busId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const location = {
          latitude: data.latitude,
          longitude: data.longitude,
        };
        setBusLocation(location);
        updateBusMarker(location);
      }
    } catch (error) {
      console.error('Error loading bus location:', error);
      toast.error(language === 'ar' ? 'فشل تحميل موقع الحافلة' : 'Failed to load bus location');
    }
  };

  const updateBusMarker = (location: { latitude: number; longitude: number }) => {
    if (!map.current) return;

    if (!busMarker.current) {
      // Custom pin that shows an exact anchor point (no bouncing/moving)
      const container = document.createElement('div');
      container.className = 'bus-marker';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';

      const pin = document.createElement('div');
      pin.style.width = '44px';
      pin.style.height = '44px';
      pin.style.borderRadius = '9999px';
      pin.style.display = 'flex';
      pin.style.alignItems = 'center';
      pin.style.justifyContent = 'center';
      pin.style.background = 'hsl(var(--primary))';
      pin.style.color = 'hsl(var(--primary-foreground))';
      pin.style.border = '3px solid hsl(var(--background))';
      pin.style.boxShadow = '0 8px 24px hsl(var(--primary) / 0.35), 0 4px 8px hsl(var(--foreground) / 0.1)';
      pin.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 12h18"/><path d="M8 6V4"/><path d="M16 6V4"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></svg>';

      const pointer = document.createElement('div');
      pointer.style.width = '0';
      pointer.style.height = '0';
      pointer.style.borderLeft = '8px solid transparent';
      pointer.style.borderRight = '8px solid transparent';
      pointer.style.borderTop = '12px solid hsl(var(--primary))';
      pointer.style.marginTop = '-2px';
      pointer.style.filter = 'drop-shadow(0 2px 4px hsl(var(--foreground) / 0.25))';

      // Precise dot = exact GPS coordinate (bottom center of marker)
      const dot = document.createElement('div');
      dot.style.width = '12px';
      dot.style.height = '12px';
      dot.style.borderRadius = '9999px';
      dot.style.background = 'hsl(var(--background))';
      dot.style.border = '2px solid hsl(var(--primary))';
      dot.style.boxShadow = '0 1px 3px hsl(var(--foreground) / 0.35)';
      dot.style.marginTop = '-2px';

      container.appendChild(pin);
      container.appendChild(pointer);
      container.appendChild(dot);

      busMarker.current = new mapboxgl.Marker({ element: container, anchor: 'bottom', offset: [0, 6] })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(new mapboxgl.Popup().setText(language === 'ar' ? 'موقع الحافلة' : 'Bus Location'))
        .addTo(map.current);
    } else {
      busMarker.current.setLngLat([location.longitude, location.latitude]);
    }

    // Follow the bus until the user manually moves the map
    if (!userInteractedRef.current) {
      const duration = hasAutoCenteredRef.current ? 800 : 0;
      hasAutoCenteredRef.current = true;

      map.current.easeTo({
        center: [location.longitude, location.latitude],
        zoom: Math.max(map.current.getZoom(), 14),
        duration,
      });
    }

    // If the map was initialized while hidden/transforming, force a resize
    setTimeout(() => map.current?.resize(), 0);
  };

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />

      {mapStatus !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="max-w-xs text-center text-sm text-muted-foreground px-6">
            {mapStatus === 'loading'
              ? language === 'ar'
                ? 'جاري تحميل الخريطة…'
                : 'Loading map…'
              : language === 'ar'
                ? `تعذر تحميل الخريطة: ${mapError || ''}`
                : `Map unavailable: ${mapError || ''}`}
          </div>
        </div>
      )}

      {busLocation && (
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="text-sm font-medium mb-1">{language === 'ar' ? 'آخر تحديث' : 'Last Updated'}</div>
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
        </div>
      )}
    </div>
  );
}
