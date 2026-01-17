import { useCallback, useEffect, useRef, useState } from 'react';
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

  // Load all bus locations + active trips
  useEffect(() => {
    // Allow auto-fit again when the bus list changes, but don't keep re-centering on every location update
    hasAutoFittedRef.current = false;

    loadAllBusLocations();
    loadActiveTrips();
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
      
      const isActiveBus = activeBusIds.has(bus.id);
      
      // Remove existing marker to recreate with correct status
      if (markers.current.has(bus.id)) {
        markers.current.get(bus.id)?.remove();
        markers.current.delete(bus.id);
      }
      
      // Create marker with active trip status
      const el = createMarkerElement(bus, isActiveBus);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([displayLocation.longitude, displayLocation.latitude])
        .addTo(map.current!);
      markers.current.set(bus.id, marker);
    });

    // Auto-fit only once (otherwise the map keeps re-centering while you pinch/zoom)
    if (!hasAutoFittedRef.current && hasValidLocations && bounds.getNorthEast() && bounds.getSouthWest()) {
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

  const createMarkerElement = (bus: BusInfo, hasLiveLocation: boolean) => {
    const isActive = hasLiveLocation;
    const container = document.createElement('div');
    container.className = 'bus-pin-container';
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.cursor = 'pointer';

    // Add click handler
    container.addEventListener('click', () => {
      fetchBusDetails(bus.id);
    });

    // Label (always visible above pin)
    const labelWrap = document.createElement('div');
    labelWrap.style.position = 'absolute';
    labelWrap.style.left = '50%';
    labelWrap.style.bottom = '100%';
    labelWrap.style.transform = 'translateX(-50%)';
    labelWrap.style.marginBottom = '8px';
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

    // Create a wrapper for pin and pulse - fixed size for proper centering
    const pinWrapper = document.createElement('div');
    pinWrapper.style.position = 'relative';
    pinWrapper.style.width = '56px';
    pinWrapper.style.height = '56px';
    pinWrapper.style.display = 'flex';
    pinWrapper.style.alignItems = 'center';
    pinWrapper.style.justifyContent = 'center';

    // Pulse effect for active buses - absolutely centered
    if (isActive) {
      const pulse = document.createElement('div');
      pulse.className = 'bus-pin-pulse';
      pulse.style.position = 'absolute';
      pulse.style.left = '0';
      pulse.style.top = '0';
      pulse.style.right = '0';
      pulse.style.bottom = '0';
      pulse.style.borderRadius = '9999px';
      pulse.style.background = 'hsl(var(--primary) / 0.4)';
      pulse.style.animation = 'busPinPulse 2s ease-out infinite';
      pulse.style.zIndex = '1';
      pinWrapper.appendChild(pulse);
    }

    // Bus pin with beautiful icon
    const pin = document.createElement('div');
    pin.className = 'bus-pin';
    pin.style.width = '44px';
    pin.style.height = '44px';
    pin.style.borderRadius = '9999px';
    pin.style.display = 'flex';
    pin.style.alignItems = 'center';
    pin.style.justifyContent = 'center';
    pin.style.border = '3px solid hsl(var(--background))';
    pin.style.boxShadow = isActive 
      ? '0 8px 24px hsl(var(--primary) / 0.35), 0 4px 8px hsl(var(--foreground) / 0.1)' 
      : '0 8px 24px hsla(0, 72%, 51%, 0.35), 0 4px 8px hsl(var(--foreground) / 0.1)';
    pin.style.background = isActive 
      ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))' 
      : 'linear-gradient(135deg, hsl(0, 72%, 51%), hsl(0, 72%, 45%))';
    pin.style.color = '#ffffff';
    pin.style.position = 'relative';
    pin.style.zIndex = '2';
    pin.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 11H6V6h12v5z"/>
      </svg>
    `;

    pinWrapper.appendChild(pin);
    
    // Pin pointer/anchor at the bottom - this is the exact GPS location
    const pointer = document.createElement('div');
    pointer.style.width = '0';
    pointer.style.height = '0';
    pointer.style.borderLeft = '8px solid transparent';
    pointer.style.borderRight = '8px solid transparent';
    pointer.style.borderTop = isActive 
      ? '12px solid hsl(var(--primary))' 
      : '12px solid hsl(0, 72%, 51%)';
    pointer.style.marginTop = '-2px';
    pointer.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
    
    container.appendChild(pinWrapper);
    container.appendChild(pointer);

    // Add "Inactive" badge inside the label for inactive buses (so it doesn't affect anchor)
    if (!isActive) {
      const inactiveTag = document.createElement('div');
      inactiveTag.className = 'bus-inactive-tag';
      inactiveTag.textContent = language === 'ar' ? 'متوقفة' : 'Inactive';
      inactiveTag.style.marginTop = '2px';
      inactiveTag.style.padding = '2px 6px';
      inactiveTag.style.borderRadius = '4px';
      inactiveTag.style.fontSize = '9px';
      inactiveTag.style.fontWeight = '600';
      inactiveTag.style.background = 'hsl(0, 72%, 51%)';
      inactiveTag.style.color = '#ffffff';
      inactiveTag.style.textTransform = 'uppercase';
      inactiveTag.style.letterSpacing = '0.5px';
      labelWrap.appendChild(inactiveTag);
    }

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
          {language === 'ar' ? 'الرحلات النشطة' : 'Active Trips'}
        </div>
        <div className="text-2xl font-bold text-primary">
          {activeBusCount} / {buses.length}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {language === 'ar' ? 'حافلات في الخدمة' : 'Buses in service'}
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
                  {language === 'ar' ? 'حافلة' : 'Bus'} {selectedBus?.bus_number}
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
                    ? (language === 'ar' ? '🟢 رحلة نشطة' : '🟢 Active Trip')
                    : (language === 'ar' ? '🔴 لا توجد رحلة' : '🔴 No Active Trip')
                  }
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'السائق' : 'Driver'}</span>
                  </div>
                  <div className="font-semibold text-sm">
                    {selectedBus.driver_name || (language === 'ar' ? 'غير معين' : 'Not Assigned')}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'المشرف' : 'Supervisor'}</span>
                  </div>
                  <div className="font-semibold text-sm">
                    {selectedBus.supervisor_name || (language === 'ar' ? 'غير معين' : 'Not Assigned')}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'الطلاب' : 'Students'}</span>
                  </div>
                  <div className="font-semibold text-sm">
                    {selectedBus.student_count} / {selectedBus.capacity}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'سنة الصنع' : 'Year'}</span>
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
                      {language === 'ar' ? 'آخر تحديث للموقع' : 'Last Location Update'}
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
