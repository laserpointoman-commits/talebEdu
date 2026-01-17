import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Bus, User, MapPin, Clock, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface BusInfo {
  id: string;
  bus_number: string;
  status?: string;
}

interface BusDetails {
  id: string;
  bus_number: string;
  model: string | null;
  capacity: number;
  year: number | null;
  status: string | null;
  driver_name: string | null;
  supervisor_name: string | null;
  student_count: number;
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
  const hasAutoFittedRef = useRef(false);
  const userInteractedRef = useRef(false);

  const busIdsKey = useMemo(() => {
    // Stable key so rerenders don't look like the bus list changed
    return buses
      .map((b) => b.id)
      .slice()
      .sort()
      .join('|');
  }, [buses]);

  const [busLocations, setBusLocations] = useState<Map<string, BusLocationData>>(new Map());
  const [activeBusIds, setActiveBusIds] = useState<Set<string>>(new Set());
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<BusDetails | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    setMapStatus('loading');
    setMapError(null);

    let m: mapboxgl.Map | null = null;
    let handleWindowResize: (() => void) | null = null;
    let onMoveStart: ((e: any) => void) | null = null;

    try {
      // Use language-specific tile URLs where available
      // For Arabic/Hindi, use standard OSM tiles (they show local names)
      // In future, we could use custom vector tiles with language switching
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

      // If the user moves the map, stop all auto-fit behavior
      onMoveStart = (e: any) => {
        if (e?.originalEvent) userInteractedRef.current = true;
      };
      m.on('movestart', onMoveStart);

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
        if (onMoveStart) m?.off('movestart', onMoveStart);
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

  // Load all bus locations + active trips
  useEffect(() => {
    // Allow auto-fit again only when the set of bus IDs changes
    hasAutoFittedRef.current = false;

    loadAllBusLocations();
    loadActiveTrips();
  }, [busIdsKey]);

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

  // Subscribe to real-time updates for trip status changes
  useEffect(() => {
    if (buses.length === 0) return;

    const channel = supabase
      .channel('all-bus-trips')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_trips',
        },
        () => {
          loadActiveTrips();
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

    // Remove markers for buses that are no longer in the list
    const currentBusIds = new Set(buses.map(b => b.id));
    markers.current.forEach((marker, busId) => {
      if (!currentBusIds.has(busId)) {
        marker.remove();
        markers.current.delete(busId);
      }
    });

    buses.forEach((bus) => {
      const location = busLocations.get(bus.id);

      // If we don't have a real location, don't place it on the map (prevents the diagonal "fake" line)
      if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
        const existing = markers.current.get(bus.id);
        if (existing) {
          existing.remove();
          markers.current.delete(bus.id);
        }
        return;
      }

      hasValidLocations = true;
      bounds.extend([location.longitude, location.latitude]);

      const isActiveBus = activeBusIds.has(bus.id);

      // If marker exists, update position; only recreate if active/inactive state changed
      const existing = markers.current.get(bus.id);
      if (existing) {
        const el = existing.getElement() as HTMLElement | null;
        const prevActive = el?.dataset?.active === 'true';
        existing.setLngLat([location.longitude, location.latitude]);

        if (prevActive === isActiveBus) return;

        existing.remove();
        markers.current.delete(bus.id);
      }

      const el = createMarkerElement(bus, isActiveBus);
      // anchor='bottom' places the GPS point at the bottom-center of the marker
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);
      markers.current.set(bus.id, marker);
    });

    // Auto-fit only once (otherwise the map keeps re-centering while you pinch/zoom)
    if (!userInteractedRef.current && !hasAutoFittedRef.current && hasValidLocations && bounds.getNorthEast() && bounds.getSouthWest()) {
      hasAutoFittedRef.current = true;
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
        duration: 600,
      });
    }
  }, [busLocations, buses, mapStatus, activeBusIds]);

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

  const loadActiveTrips = async () => {
    if (buses.length === 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bus_trips')
        .select('bus_id')
        .eq('status', 'in_progress')
        .gte('created_at', `${today}T00:00:00`);

      if (error) throw error;

      if (data) {
        const activeIds = new Set(data.map(t => t.bus_id));
        setActiveBusIds(activeIds);
      }
    } catch (error) {
      console.error('Error loading active trips:', error);
    }
  };

  const fetchBusDetails = async (busId: string) => {
    setLoadingDetails(true);
    try {
      // Fetch bus with driver and supervisor
      const { data: busData, error: busError } = await supabase
        .from('buses')
        .select(`
          id, bus_number, model, capacity, year, status,
          drivers!buses_driver_id_fkey(profiles(full_name)),
          profiles!buses_supervisor_id_fkey(full_name)
        `)
        .eq('id', busId)
        .single();

      if (busError) throw busError;

      // Count students assigned to this bus
      const { count: studentCount } = await supabase
        .from('student_bus_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('bus_id', busId);

      const details: BusDetails = {
        id: busData.id,
        bus_number: busData.bus_number,
        model: busData.model,
        capacity: busData.capacity,
        year: busData.year,
        status: busData.status,
        driver_name: (busData.drivers as any)?.profiles?.full_name || null,
        supervisor_name: (busData.profiles as any)?.full_name || null,
        student_count: studentCount || 0,
      };

      setSelectedBus(details);
      setIsSheetOpen(true);
    } catch (error) {
      console.error('Error fetching bus details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const createMarkerElement = (bus: BusInfo, isActive: boolean) => {
    // Container sized to hold the visible elements; anchor='bottom' places the GPS at bottom-center
    const container = document.createElement('div');
    container.className = 'bus-marker';
    container.dataset.busId = bus.id;
    container.dataset.active = isActive ? 'true' : 'false';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.cursor = 'pointer';

    container.addEventListener('click', () => {
      fetchBusDetails(bus.id);
    });

    // Label above pin
    const labelWrap = document.createElement('div');
    labelWrap.style.marginBottom = '6px';
    labelWrap.style.display = 'flex';
    labelWrap.style.flexDirection = 'column';
    labelWrap.style.alignItems = 'center';
    labelWrap.style.pointerEvents = 'none';

    const label = document.createElement('div');
    label.textContent = `${language === 'ar' ? 'حافلة' : language === 'hi' ? 'बस' : 'Bus'} ${bus.bus_number}`;
    label.style.background = 'hsl(var(--card))';
    label.style.color = 'hsl(var(--card-foreground))';
    label.style.padding = '5px 8px';
    label.style.borderRadius = '6px';
    label.style.fontSize = '12px';
    label.style.fontWeight = '700';
    label.style.whiteSpace = 'nowrap';
    label.style.border = '1px solid hsl(var(--border))';
    label.style.boxShadow = '0 4px 12px hsl(var(--foreground) / 0.15)';

    const labelArrow = document.createElement('div');
    labelArrow.style.width = '0';
    labelArrow.style.height = '0';
    labelArrow.style.borderLeft = '5px solid transparent';
    labelArrow.style.borderRight = '5px solid transparent';
    labelArrow.style.borderTop = '5px solid hsl(var(--card))';
    labelArrow.style.marginTop = '-1px';

    labelWrap.appendChild(label);
    labelWrap.appendChild(labelArrow);

    // Add inactive badge
    if (!isActive) {
      const tag = document.createElement('div');
      tag.textContent = language === 'ar' ? 'متوقفة' : language === 'hi' ? 'निष्क्रिय' : 'Inactive';
      tag.style.marginTop = '2px';
      tag.style.padding = '2px 5px';
      tag.style.borderRadius = '4px';
      tag.style.fontSize = '9px';
      tag.style.fontWeight = '600';
      tag.style.background = 'hsl(var(--destructive))';
      tag.style.color = '#fff';
      tag.style.textTransform = 'uppercase';
      labelWrap.appendChild(tag);
    }

    // Pin circle
    const pinSize = 36;
    const pinWrap = document.createElement('div');
    pinWrap.style.position = 'relative';
    pinWrap.style.width = `${pinSize}px`;
    pinWrap.style.height = `${pinSize}px`;

    if (isActive) {
      const pulse = document.createElement('div');
      pulse.style.position = 'absolute';
      pulse.style.inset = '-8px';
      pulse.style.borderRadius = '9999px';
      pulse.style.background = 'hsl(var(--primary) / 0.35)';
      pulse.style.animation = 'busPinPulse 2s ease-out infinite';
      pinWrap.appendChild(pulse);
    }

    const pin = document.createElement('div');
    pin.style.width = '100%';
    pin.style.height = '100%';
    pin.style.borderRadius = '9999px';
    pin.style.display = 'flex';
    pin.style.alignItems = 'center';
    pin.style.justifyContent = 'center';
    pin.style.background = isActive
      ? 'hsl(var(--primary))'
      : 'hsl(var(--destructive))';
    pin.style.color = '#fff';
    pin.style.border = '2px solid hsl(var(--background))';
    pin.style.boxShadow = '0 4px 12px hsl(var(--foreground) / 0.2)';
    pin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 11H6V6h12v5z"/></svg>`;
    pinWrap.appendChild(pin);

    // Pointer triangle
    const pointer = document.createElement('div');
    pointer.style.width = '0';
    pointer.style.height = '0';
    pointer.style.borderLeft = '6px solid transparent';
    pointer.style.borderRight = '6px solid transparent';
    pointer.style.borderTop = isActive
      ? '10px solid hsl(var(--primary))'
      : '10px solid hsl(var(--destructive))';
    pointer.style.marginTop = '-1px';

    container.appendChild(labelWrap);
    container.appendChild(pinWrap);
    container.appendChild(pointer);

    return container;
  };

  const activeBusCount = activeBusIds.size;

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-xl overflow-hidden border bg-card">
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

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <div className="text-sm font-medium mb-1">
          {language === 'ar' ? 'الرحلات النشطة' : language === 'hi' ? 'सक्रिय यात्राएं' : 'Active Trips'}
        </div>
        <div className="text-2xl font-bold text-primary">
          {activeBusCount} / {buses.length}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {language === 'ar' ? 'حافلات في الخدمة' : language === 'hi' ? 'सेवा में बसें' : 'Buses in service'}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>{language === 'ar' ? 'نشطة' : language === 'hi' ? 'सक्रिय' : 'Active'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>{language === 'ar' ? 'غير نشطة' : language === 'hi' ? 'निष्क्रिय' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Bus Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bus className="w-6 h-6 text-primary" />
              </div>
              <div className="text-start">
                <div className="text-xl font-bold">
                  {language === 'ar' ? 'حافلة' : language === 'hi' ? 'बस' : 'Bus'} {selectedBus?.bus_number}
                </div>
                {selectedBus?.model && (
                  <div className="text-sm text-muted-foreground font-normal">
                    {selectedBus.model}
                  </div>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : selectedBus && (
            <div className="space-y-4 pb-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeBusIds.has(selectedBus.id) 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {activeBusIds.has(selectedBus.id) 
                    ? (language === 'ar' ? '🟢 رحلة نشطة' : language === 'hi' ? '🟢 सक्रिय यात्रा' : '🟢 Active Trip')
                    : (language === 'ar' ? '🔴 لا توجد رحلة' : language === 'hi' ? '🔴 कोई सक्रिय यात्रा नहीं' : '🔴 No Active Trip')
                  }
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'السائق' : language === 'hi' ? 'ड्राइवर' : 'Driver'}</span>
                  </div>
                  <div className="font-semibold text-sm">
                    {selectedBus.driver_name || (language === 'ar' ? 'غير معين' : language === 'hi' ? 'असाइन नहीं' : 'Not Assigned')}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'المشرف' : language === 'hi' ? 'सुपरवाइज़र' : 'Supervisor'}</span>
                  </div>
                  <div className="font-semibold text-sm">
                    {selectedBus.supervisor_name || (language === 'ar' ? 'غير معين' : language === 'hi' ? 'असाइन नहीं' : 'Not Assigned')}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'الطلاب' : language === 'hi' ? 'छात्र' : 'Students'}</span>
                  </div>
                  <div className="font-semibold text-sm">
                    {selectedBus.student_count} / {selectedBus.capacity}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'سنة الصنع' : language === 'hi' ? 'वर्ष' : 'Year'}</span>
                  </div>
                  <div className="font-semibold text-sm">
                    {selectedBus.year || '-'}
                  </div>
                </div>
              </div>

              {/* Last Location Update */}
              {busLocations.has(selectedBus.id) && busLocations.get(selectedBus.id)?.last_updated && (
                <div className="bg-primary/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {language === 'ar' ? 'آخر تحديث للموقع' : language === 'hi' ? 'अंतिम स्थान अपडेट' : 'Last Location Update'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>
                      {format(new Date(busLocations.get(selectedBus.id)!.last_updated!), 'PPp')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
