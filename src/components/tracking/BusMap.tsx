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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [busId]);

  // Ensure the marker is placed even if the location loads before the map finishes initializing.
  // (Race condition: fetch resolves fast, map init resolves slower -> marker never created.)
  useEffect(() => {
    if (!busLocation) return;
    if (mapStatus !== 'ready') return;
    if (!map.current) return;
    updateBusMarker(busLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busLocation, mapStatus]);

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
          .setPopup(new mapboxgl.Popup().setText(language === 'ar' ? 'موقع الطالب' : language === 'hi' ? 'छात्र स्थान' : 'Student Location'))
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
      }
    } catch (error) {
      console.error('Error loading bus location:', error);
      toast.error(language === 'ar' ? 'فشل تحميل موقع الحافلة' : language === 'hi' ? 'बस स्थान लोड करने में विफल' : 'Failed to load bus location');
    }
  };

  const updateBusMarker = (location: { latitude: number; longitude: number }) => {
    if (!map.current) return;

    if (!busMarker.current) {
      // Root is zero-size; anchor='center' means GPS point is exactly at (0,0)
      const root = document.createElement('div');
      root.className = 'bus-marker-root';
      root.style.position = 'relative';
      root.style.width = '0';
      root.style.height = '0';

      // Visible marker positioned above the anchor point
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.left = '50%';
      wrapper.style.bottom = '0';
      wrapper.style.transform = 'translateX(-50%)';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';

      const pinSize = 36;
      const pinWrap = document.createElement('div');
      pinWrap.style.position = 'relative';
      pinWrap.style.width = `${pinSize}px`;
      pinWrap.style.height = `${pinSize}px`;

      const pulse = document.createElement('div');
      pulse.style.position = 'absolute';
      pulse.style.inset = '-8px';
      pulse.style.borderRadius = '9999px';
      pulse.style.background = 'hsl(var(--primary) / 0.35)';
      pulse.style.animation = 'busPinPulse 2s ease-out infinite';
      pinWrap.appendChild(pulse);

      const pin = document.createElement('div');
      pin.style.width = '100%';
      pin.style.height = '100%';
      pin.style.borderRadius = '9999px';
      pin.style.display = 'flex';
      pin.style.alignItems = 'center';
      pin.style.justifyContent = 'center';
      pin.style.background = 'hsl(var(--primary))';
      pin.style.color = '#fff';
      pin.style.border = '2px solid hsl(var(--background))';
      pin.style.boxShadow = '0 4px 12px hsl(var(--foreground) / 0.2)';
      pin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 11H6V6h12v5z"/></svg>`;
      pinWrap.appendChild(pin);

      const pointer = document.createElement('div');
      pointer.style.width = '0';
      pointer.style.height = '0';
      pointer.style.borderLeft = '6px solid transparent';
      pointer.style.borderRight = '6px solid transparent';
      pointer.style.borderTop = '10px solid hsl(var(--primary))';
      pointer.style.marginTop = '-1px';

      const dot = document.createElement('div');
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.borderRadius = '9999px';
      dot.style.background = 'hsl(var(--background))';
      dot.style.border = '2px solid hsl(var(--primary))';
      dot.style.boxShadow = '0 1px 3px hsl(var(--foreground) / 0.3)';
      dot.style.marginTop = '-1px';

      wrapper.appendChild(pinWrap);
      wrapper.appendChild(pointer);
      wrapper.appendChild(dot);
      root.appendChild(wrapper);

      // Add pulse animation keyframes if not present
      if (!document.getElementById('bus-marker-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'bus-marker-pulse-style';
        style.textContent = `
          @keyframes busPinPulse {
            0% { transform: scale(1); opacity: 0.55; }
            100% { transform: scale(1.7); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      busMarker.current = new mapboxgl.Marker({ element: root, anchor: 'center' })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(new mapboxgl.Popup().setText(language === 'ar' ? 'موقع الحافلة' : language === 'hi' ? 'बस स्थान' : 'Bus Location'))
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
                : language === 'hi'
                ? 'नक्शा लोड हो रहा है…'
                : 'Loading map…'
              : language === 'ar'
                ? `تعذر تحميل الخريطة: ${mapError || ''}`
                : language === 'hi'
                ? `नक्शा अनुपलब्ध: ${mapError || ''}`
                : `Map unavailable: ${mapError || ''}`}
          </div>
        </div>
      )}

      {busLocation && (
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="text-sm font-medium mb-1">{language === 'ar' ? 'آخر تحديث' : language === 'hi' ? 'अंतिम अपडेट' : 'Last Updated'}</div>
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : language === 'hi' ? 'hi-IN' : 'en-US')}
          </div>
        </div>
      )}
    </div>
  );
}
