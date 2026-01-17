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

      // Add marker label styles
      if (!document.getElementById('all-buses-marker-style')) {
        const style = document.createElement('style');
        style.id = 'all-buses-marker-style';
        style.textContent = `
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .bus-pin-container {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .bus-pin-label {
            position: absolute;
            top: -28px;
            background: hsl(var(--card));
            color: hsl(var(--card-foreground));
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 8px hsl(var(--foreground) / 0.15);
            border: 1px solid hsl(var(--border));
          }
          .bus-pin-label::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid hsl(var(--card));
          }
          .bus-pin {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: hsl(var(--primary));
            border: 3px solid hsl(var(--background));
            box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: hsl(var(--primary-foreground));
            position: relative;
            z-index: 2;
          }
          .bus-pin-inactive {
            background: hsl(var(--muted));
            color: hsl(var(--muted-foreground));
          }
          .bus-pin-pulse {
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: hsl(var(--primary) / 0.4);
            animation: pulse-ring 2s ease-out infinite;
            z-index: 1;
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

  // Update markers when locations change
  useEffect(() => {
    if (!map.current || mapStatus !== 'ready') return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidLocations = false;

    buses.forEach(bus => {
      const location = busLocations.get(bus.id);
      
      if (location) {
        hasValidLocations = true;
        bounds.extend([location.longitude, location.latitude]);
        
        if (!markers.current.has(bus.id)) {
          // Create new marker
          const el = createMarkerElement(bus);
          const marker = new mapboxgl.Marker(el)
            .setLngLat([location.longitude, location.latitude])
            .addTo(map.current!);
          markers.current.set(bus.id, marker);
        } else {
          // Update existing marker position
          markers.current.get(bus.id)?.setLngLat([location.longitude, location.latitude]);
        }
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

    // Label with bus name/number
    const label = document.createElement('div');
    label.className = 'bus-pin-label';
    label.textContent = `${language === 'ar' ? 'حافلة' : 'Bus'} ${bus.bus_number}`;
    container.appendChild(label);

    // Pulse effect for active buses
    if (bus.status === 'active') {
      const pulse = document.createElement('div');
      pulse.className = 'bus-pin-pulse';
      container.appendChild(pulse);
    }

    // Bus pin
    const pin = document.createElement('div');
    pin.className = `bus-pin ${bus.status !== 'active' ? 'bus-pin-inactive' : ''}`;
    pin.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="6" width="18" height="13" rx="2"/>
        <path d="M3 12h18"/>
        <path d="M8 6V4"/>
        <path d="M16 6V4"/>
        <circle cx="7" cy="17" r="1"/>
        <circle cx="17" cy="17" r="1"/>
      </svg>
    `;
    container.appendChild(pin);

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
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span>{language === 'ar' ? 'غير نشطة' : 'Inactive'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
