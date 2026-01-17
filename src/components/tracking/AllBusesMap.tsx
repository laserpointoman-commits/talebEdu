import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface BusInfo {
  id: string;
  bus_number: string;
  status?: string;
}

interface BusLocationData {
  bus_id: string;
  latitude: number;
  longitude: number;
  last_updated?: string;
}

interface AllBusesMapProps {
  buses: BusInfo[];
}

export default function AllBusesMap({ buses }: AllBusesMapProps) {
  const { language } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [busLocations, setBusLocations] = useState<Map<string, BusLocationData>>(new Map());
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
        zoom: 11,
      });

      map.current = m;
      m.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const onLoad = () => {
        setMapStatus('ready');
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

      // Add marker styles (pulse keyframes)
      if (!document.getElementById('all-buses-marker-style')) {
        const style = document.createElement('style');
        style.id = 'all-buses-marker-style';
        style.textContent = `
          @keyframes busPinPulse {
            0% { transform: scale(1); opacity: 0.55; }
            100% { transform: scale(1.7); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      return () => {
        window.removeEventListener('resize', handleWindowResize!);
        m?.off('load', onLoad);
        m?.off('error', onError);
        markers.current.forEach(marker => marker.remove());
        markers.current.clear();
        m?.remove();
        map.current = null;
      };
    } catch (err: any) {
      console.error('Map init error:', err);
      setMapStatus('error');
      setMapError(err?.message || 'Map failed to initialize');
      return;
    }
  }, []);

  // Load all bus locations
  useEffect(() => {
    loadAllBusLocations();
  }, [buses]);

  // Subscribe to real-time updates for all buses
  useEffect(() => {
    if (buses.length === 0) return;

    const channel = supabase
      .channel('all-bus-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_locations',
        },
        (payload) => {
          if (payload.new && 'bus_id' in payload.new && 'latitude' in payload.new && 'longitude' in payload.new) {
            const newLocation: BusLocationData = {
              bus_id: payload.new.bus_id as string,
              latitude: payload.new.latitude as number,
              longitude: payload.new.longitude as number,
              last_updated: payload.new.last_updated as string,
            };
            
            setBusLocations(prev => {
              const updated = new Map(prev);
              updated.set(newLocation.bus_id, newLocation);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buses]);

  // Update markers when locations change or buses load
  useEffect(() => {
    if (!map.current || mapStatus !== 'ready') return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidLocations = false;
    
    // Default location (Oman center) for buses without location data
    const defaultLocation = { latitude: 23.588, longitude: 58.4059 };

    buses.forEach((bus, index) => {
      const location = busLocations.get(bus.id);
      
      // Use actual location if available, otherwise use offset default location
      const displayLocation = location || {
        latitude: defaultLocation.latitude + (index * 0.008),
        longitude: defaultLocation.longitude + (index * 0.008),
      };
      
      hasValidLocations = true;
      bounds.extend([displayLocation.longitude, displayLocation.latitude]);
      
      if (!markers.current.has(bus.id)) {
        // Create new marker
        const el = createMarkerElement(bus);
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([displayLocation.longitude, displayLocation.latitude])
          .addTo(map.current!);
        markers.current.set(bus.id, marker);
      } else {
        // Update existing marker position
        markers.current.get(bus.id)?.setLngLat([displayLocation.longitude, displayLocation.latitude]);
      }
    });

    // Fit map to show all buses
    if (hasValidLocations && bounds.getNorthEast() && bounds.getSouthWest()) {
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
        duration: 1000,
      });
    }
  }, [busLocations, buses, mapStatus]);

  const loadAllBusLocations = async () => {
    if (buses.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('bus_locations')
        .select('*')
        .in('bus_id', buses.map(b => b.id))
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (data) {
        // Get latest location for each bus
        const latestLocations = new Map<string, BusLocationData>();
        data.forEach(loc => {
          if (!latestLocations.has(loc.bus_id)) {
            latestLocations.set(loc.bus_id, {
              bus_id: loc.bus_id,
              latitude: loc.latitude,
              longitude: loc.longitude,
              last_updated: loc.last_updated,
            });
          }
        });
        setBusLocations(latestLocations);
      }
    } catch (error) {
      console.error('Error loading bus locations:', error);
    }
  };

  const createMarkerElement = (bus: BusInfo) => {
    const container = document.createElement('div');
    container.className = 'bus-pin-container';
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.width = '44px';
    container.style.height = '44px';

    // Label (always visible above pin)
    const labelWrap = document.createElement('div');
    labelWrap.style.position = 'absolute';
    labelWrap.style.left = '50%';
    labelWrap.style.top = '-42px';
    labelWrap.style.transform = 'translateX(-50%)';
    labelWrap.style.zIndex = '10';
    labelWrap.style.pointerEvents = 'none';
    labelWrap.style.display = 'flex';
    labelWrap.style.flexDirection = 'column';
    labelWrap.style.alignItems = 'center';

    const label = document.createElement('div');
    label.className = 'bus-pin-label';
    label.textContent = `${language === 'ar' ? 'حافلة' : 'Bus'} ${bus.bus_number}`;
    label.style.background = 'hsl(var(--card))';
    label.style.color = 'hsl(var(--card-foreground))';
    label.style.padding = '6px 10px';
    label.style.borderRadius = '8px';
    label.style.fontSize = '13px';
    label.style.fontWeight = '700';
    label.style.whiteSpace = 'nowrap';
    label.style.border = '1px solid hsl(var(--border))';
    label.style.boxShadow = '0 6px 16px hsl(var(--foreground) / 0.18)';

    const arrow = document.createElement('div');
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '6px solid transparent';
    arrow.style.borderRight = '6px solid transparent';
    arrow.style.borderTop = '6px solid hsl(var(--card))';
    arrow.style.filter = 'drop-shadow(0 1px 0 hsl(var(--border)))';
    arrow.style.marginTop = '-1px';

    labelWrap.appendChild(label);
    labelWrap.appendChild(arrow);
    container.appendChild(labelWrap);

    // Bus pin with beautiful icon - create first so pulse can be positioned relative to it
    const pin = document.createElement('div');
    pin.className = 'bus-pin';
    pin.style.width = '48px';
    pin.style.height = '48px';
    pin.style.borderRadius = '9999px';
    pin.style.display = 'flex';
    pin.style.alignItems = 'center';
    pin.style.justifyContent = 'center';
    pin.style.border = '3px solid hsl(var(--background))';
    pin.style.boxShadow = bus.status === 'active' 
      ? '0 8px 24px hsl(var(--primary) / 0.35), 0 4px 8px hsl(var(--foreground) / 0.1)' 
      : '0 8px 24px hsla(0, 72%, 51%, 0.35), 0 4px 8px hsl(var(--foreground) / 0.1)';
    pin.style.background = bus.status === 'active' 
      ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))' 
      : 'linear-gradient(135deg, hsl(0, 72%, 51%), hsl(0, 72%, 45%))';
    pin.style.color = '#ffffff';
    pin.style.position = 'relative';
    pin.style.zIndex = '2';
    pin.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 11H6V6h12v5z"/>
      </svg>
    `;

    // Create a wrapper for pin and pulse to center them together
    const pinWrapper = document.createElement('div');
    pinWrapper.style.position = 'relative';
    pinWrapper.style.display = 'flex';
    pinWrapper.style.alignItems = 'center';
    pinWrapper.style.justifyContent = 'center';

    // Pulse effect for active buses - centered behind the pin
    if (bus.status === 'active') {
      const pulse = document.createElement('div');
      pulse.className = 'bus-pin-pulse';
      pulse.style.position = 'absolute';
      pulse.style.left = '50%';
      pulse.style.top = '50%';
      pulse.style.transform = 'translate(-50%, -50%)';
      pulse.style.width = '56px';
      pulse.style.height = '56px';
      pulse.style.borderRadius = '9999px';
      pulse.style.background = 'hsl(var(--primary) / 0.4)';
      pulse.style.animation = 'busPinPulse 2s ease-out infinite';
      pulse.style.zIndex = '1';
      pinWrapper.appendChild(pulse);
    }

    pinWrapper.appendChild(pin);
    container.appendChild(pinWrapper);
    return container;
  };

  const activeBusCount = Array.from(busLocations.values()).length;

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-xl overflow-hidden border bg-card">
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

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <div className="text-sm font-medium mb-1">
          {language === 'ar' ? 'الحافلات المتتبعة' : 'Tracking Buses'}
        </div>
        <div className="text-2xl font-bold text-primary">
          {activeBusCount} / {buses.length}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {language === 'ar' ? 'مواقع مباشرة' : 'Live locations'}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>{language === 'ar' ? 'نشطة' : 'Active'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>{language === 'ar' ? 'غير نشطة' : 'Inactive'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
