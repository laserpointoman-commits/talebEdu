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
          .select('*, buses:bus_id(*)')
          .eq('parent_id', user.id);

        if (error) throw error;
        setChildren(data || []);
      } else if (effectiveRole === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('id, bus_id')
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

  const t = (en: string, ar: string, hi: string) => 
    language === 'ar' ? ar : language === 'hi' ? hi : en;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Bus className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t('Live Bus Tracking', 'تتبع الحافلة المباشر', 'लाइव बस ट्रैकिंग')}
            </h1>
            <p className="text-teal-100 text-sm">
              {t('Track bus location and student activity in real-time', 'تتبع موقع الحافلة ونشاط الطلاب مباشرة', 'वास्तविक समय में बस की स्थिति और छात्र गतिविधि ट्रैक करें')}
            </p>
          </div>
        </div>
      </div>

      {/* Admin/Driver/Developer View - All Buses on One Map */}
      {isAdminView && (
        <>
          {buses.length > 0 ? (
            <div className="space-y-6">
              {/* Single map showing all buses */}
              <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-400/20 to-cyan-500/20 flex items-center justify-center">
                      <Navigation className="h-4 w-4 text-teal-500" />
                    </div>
                    {t('All Buses Map', 'خريطة جميع الحافلات', 'सभी बसों का नक्शा')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AllBusesMap buses={busesForMap} />
                </CardContent>
              </Card>

              {/* Bus details grid */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  {t('Bus Details', 'تفاصيل الحافلات', 'बस विवरण')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buses.map((bus) => (
                    <motion.div
                      key={bus.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl h-full hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600" />
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-base">
                            <span className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-400/20 to-cyan-500/20 flex items-center justify-center">
                                <Bus className="h-4 w-4 text-teal-500" />
                              </div>
                              {t('Bus', 'حافلة', 'बस')} {bus.bus_number}
                            </span>
                            <Badge 
                              variant={activeTripBusIds.has(bus.id) ? 'default' : 'secondary'}
                              className={activeTripBusIds.has(bus.id) 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}
                            >
                              {activeTripBusIds.has(bus.id)
                                ? t('🟢 Active', '🟢 نشطة', '🟢 सक्रिय')
                                : t('🔴 Inactive', '🔴 غير نشطة', '🔴 निष्क्रिय')}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                          <BusInfoItem
                            icon={<Bus className="h-4 w-4" />}
                            label={t('Model', 'الموديل', 'मॉडल')}
                            value={bus.model || 'N/A'}
                          />
                          <BusInfoItem
                            icon={<MapPin className="h-4 w-4" />}
                            label={t('Route', 'المسار', 'मार्ग')}
                            value={
                              bus.bus_routes?.[0]
                                ? (language === 'ar' 
                                    ? bus.bus_routes[0].route_name_ar 
                                    : bus.bus_routes[0].route_name)
                                : t('Not assigned', 'غير محدد', 'असाइन नहीं किया गया')
                            }
                          />
                          <BusInfoItem
                            icon={<Clock className="h-4 w-4" />}
                            label={t('Capacity', 'السعة', 'क्षमता')}
                            value={`${bus.capacity} ${t('seats', 'مقعد', 'सीटें')}`}
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
                  {t('No buses registered', 'لا توجد حافلات مسجلة', 'कोई बस पंजीकृत नहीं')}
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

                {child.bus_id ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Navigation className="h-5 w-5" />
                          {t('Bus Location', 'موقع الحافلة', 'बस स्थान')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BusMap 
                          busId={child.bus_id}
                          studentLocation={child.home_latitude && child.home_longitude ? {
                            lat: child.home_latitude,
                            lng: child.home_longitude
                          } : undefined}
                        />
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <BoardingHistory studentId={child.id} busId={child.bus_id} />
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {t('Bus Information', 'معلومات الحافلة', 'बस जानकारी')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <BusInfoItem
                            icon={<Bus className="h-4 w-4" />}
                            label={t('Bus Number', 'رقم الحافلة', 'बस नंबर')}
                            value={child.buses?.bus_number || child.bus_id}
                          />
                          <BusInfoItem
                            icon={<MapPin className="h-4 w-4" />}
                            label={t('Current Stop', 'المحطة الحالية', 'वर्तमान स्टॉप')}
                            value={t('Loading...', 'جاري التحميل...', 'लोड हो रहा है...')}
                          />
                          <BusInfoItem
                            icon={<Clock className="h-4 w-4" />}
                            label={t('Estimated Arrival', 'الوقت المقدر للوصول', 'अनुमानित आगमन')}
                            value={t('Calculating...', 'جاري الحساب...', 'गणना हो रही है...')}
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
                            {t('No Bus Assigned', 'لا يوجد حافلة', 'कोई बस असाइन नहीं')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('This student has not been assigned to a bus yet', 'لم يتم تعيين حافلة لهذا الطالب بعد', 'इस छात्र को अभी तक कोई बस असाइन नहीं की गई है')}
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
                  {t('No children registered', 'لا يوجد أطفال مسجلين', 'कोई बच्चा पंजीकृत नहीं')}
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
                {t('Bus Location', 'موقع الحافلة', 'बस स्थान')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BusMap busId={studentData.bus_id || ''} />
            </CardContent>
          </Card>

          <BoardingHistory studentId={studentData.id} />
        </div>
      )}

      {effectiveRole === 'student' && !studentData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {t('No student data found', 'لا توجد بيانات طالب', 'कोई छात्र डेटा नहीं मिला')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}