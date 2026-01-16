import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTNvOHQ4bXQweWw0MmpzYm13eXN2OXNjIn0.HeLw4TQRBqMbTnlMjo4Bbw';

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

    try {
      m = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [58.4059, 23.588], // Oman center
        zoom: 12,
      });

      map.current = m;
      m.addControl(new mapboxgl.NavigationControl(), 'top-right');

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
        el.style.backgroundColor = '#10b981';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

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
      // Create custom bus marker with bounce animation
      const el = document.createElement('div');
      el.className = 'bus-marker';
      el.style.width = '50px';
      el.style.height = '50px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '4px solid white';
      el.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.5)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.animation = 'bounce 1s ease-in-out infinite';
      el.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 12h18"/><path d="M8 6V4"/><path d="M16 6V4"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></svg>';

      // Add bounce animation styles (once)
      if (!document.getElementById('bus-marker-bounce-style')) {
        const style = document.createElement('style');
        style.id = 'bus-marker-bounce-style';
        style.textContent = `
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `;
        document.head.appendChild(style);
      }

      busMarker.current = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(new mapboxgl.Popup().setText(language === 'ar' ? 'موقع الحافلة' : 'Bus Location'))
        .addTo(map.current);
    } else {
      busMarker.current.setLngLat([location.longitude, location.latitude]);
    }

    // Center map on bus
    map.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 14,
      duration: 2000,
    });

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
