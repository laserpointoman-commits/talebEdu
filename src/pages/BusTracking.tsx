import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bus, Clock, AlertCircle, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import LogoLoader from "@/components/LogoLoader";
import BusMap from "@/components/tracking/BusMap";
import AllBusesMap from "@/components/tracking/AllBusesMap";
import BoardingHistory from "@/components/tracking/BoardingHistory";
import BusInfoItem from "@/components/tracking/BusInfoItem";
import { useActiveBusTrips } from "@/hooks/use-active-bus-trips";

export default function BusTracking() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);
  const { activeBusIds: activeTripBusIds } = useActiveBusTrips(buses.map((b) => b.id));

  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  useEffect(() => {
    loadData();
  }, [user, profile]);

  const loadData = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      // Admin/driver/developer view - load all buses
      if (effectiveRole === 'admin' || effectiveRole === 'driver' || effectiveRole === 'developer') {
        const { data, error } = await supabase
          .from('buses')
          .select(`
            *,
            drivers:driver_id(id, profile_id, profiles:profile_id(full_name)),
            bus_routes!bus_routes_bus_id_fkey(id, route_name, route_name_ar)
          `)
          .order('bus_number');

        if (error) throw error;
        setBuses(data || []);
      } else if (effectiveRole === 'parent') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id);

        if (error) throw error;
        setChildren(data || []);
      } else if (effectiveRole === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', user.id)
          .single();

        if (error) throw error;
        setStudentData(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Admin and driver roles can view all buses
  const isAdminView = effectiveRole === 'admin' || effectiveRole === 'driver' || effectiveRole === 'developer';

  const busesForMap = useMemo(
    () => buses.map((b) => ({ id: b.id, bus_number: b.bus_number, status: b.status })),
    [buses]
  );

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bus className="h-8 w-8 text-primary" />
          {language === 'ar' ? 'تتبع الحافلة المباشر' : 'Live Bus Tracking'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'تتبع موقع الحافلة ونشاط الطلاب مباشرة' : 'Track bus location and student activity in real-time'}
        </p>
      </div>

      {/* Admin/Driver/Developer View - All Buses on One Map */}
      {isAdminView && (
        <>
          {buses.length > 0 ? (
            <div className="space-y-6">
              {/* Single map showing all buses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    {language === 'ar' ? 'خريطة جميع الحافلات' : 'All Buses Map'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AllBusesMap buses={busesForMap} />
                </CardContent>
              </Card>

              {/* Bus details grid */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  {language === 'ar' ? 'تفاصيل الحافلات' : 'Bus Details'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buses.map((bus) => (
                    <motion.div
                      key={bus.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-base">
                            <span className="flex items-center gap-2">
                              <Bus className="h-4 w-4 text-primary" />
                              {language === 'ar' ? 'حافلة' : 'Bus'} {bus.bus_number}
                            </span>
                            <Badge 
                              variant={activeTripBusIds.has(bus.id) ? 'default' : 'secondary'}
                              className="capitalize text-xs"
                            >
                              {activeTripBusIds.has(bus.id)
                                ? (language === 'ar' ? '🟢 رحلة نشطة' : '🟢 Active Trip')
                                : (language === 'ar' ? '🔴 لا توجد رحلة' : '🔴 No Active Trip')}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                          <BusInfoItem
                            icon={<Bus className="h-4 w-4" />}
                            label={language === 'ar' ? 'الموديل' : 'Model'}
                            value={bus.model || 'N/A'}
                          />
                          <BusInfoItem
                            icon={<MapPin className="h-4 w-4" />}
                            label={language === 'ar' ? 'المسار' : 'Route'}
                            value={
                              bus.bus_routes?.[0]
                                ? (language === 'ar' 
                                    ? bus.bus_routes[0].route_name_ar 
                                    : bus.bus_routes[0].route_name)
                                : (language === 'ar' ? 'غير محدد' : 'Not assigned')
                            }
                          />
                          <BusInfoItem
                            icon={<Clock className="h-4 w-4" />}
                            label={language === 'ar' ? 'السعة' : 'Capacity'}
                            value={`${bus.capacity} ${language === 'ar' ? 'مقعد' : 'seats'}`}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  {language === 'ar' ? 'لا توجد حافلات مسجلة' : 'No buses registered'}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {effectiveRole === 'parent' && (
        <>
          {children.length > 0 ? (
            children.map((child) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{child.first_name} {child.last_name}</span>
                      <Badge variant="outline" className="text-sm">
                        {child.class || 'N/A'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {child.bus_route_id ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Navigation className="h-5 w-5" />
                          {language === 'ar' ? 'موقع الحافلة' : 'Bus Location'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BusMap 
                          busId={child.bus_route_id}
                          studentLocation={child.home_latitude && child.home_longitude ? {
                            lat: child.home_latitude,
                            lng: child.home_longitude
                          } : undefined}
                        />
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <BoardingHistory studentId={child.id} busId={child.bus_route_id} />
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {language === 'ar' ? 'معلومات الحافلة' : 'Bus Information'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <BusInfoItem
                            icon={<Bus className="h-4 w-4" />}
                            label={language === 'ar' ? 'رقم الحافلة' : 'Bus Number'}
                            value={child.bus_route_id}
                          />
                          <BusInfoItem
                            icon={<MapPin className="h-4 w-4" />}
                            label={language === 'ar' ? 'المحطة الحالية' : 'Current Stop'}
                            value={language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                          />
                          <BusInfoItem
                            icon={<Clock className="h-4 w-4" />}
                            label={language === 'ar' ? 'الوقت المقدر للوصول' : 'Estimated Arrival'}
                            value={language === 'ar' ? 'جاري الحساب...' : 'Calculating...'}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">
                            {language === 'ar' ? 'لا يوجد حافلة' : 'No Bus Assigned'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'ar' 
                              ? 'لم يتم تعيين حافلة لهذا الطالب بعد'
                              : 'This student has not been assigned to a bus yet'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  {language === 'ar' ? 'لا يوجد أطفال مسجلين' : 'No children registered'}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {effectiveRole === 'student' && studentData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                {language === 'ar' ? 'موقع الحافلة' : 'Bus Location'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BusMap busId={studentData.bus_route_id || ''} />
            </CardContent>
          </Card>

          <BoardingHistory studentId={studentData.id} />
        </div>
      )}

      {effectiveRole === 'student' && !studentData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {language === 'ar' ? 'لا توجد بيانات طالب' : 'No student data found'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}