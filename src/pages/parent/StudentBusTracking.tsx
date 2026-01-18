import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bus,
  MapPin,
  User,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import BoardingHistory from '@/components/tracking/BoardingHistory';
import BusMap from '@/components/tracking/BusMap';
import PageHeader from '@/components/layouts/PageHeader';

export default function StudentBusTracking() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [busAssignment, setBusAssignment] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [lastLocation, setLastLocation] = useState<any>(null);

  useEffect(() => {
    if (studentId && user) {
      loadData();
    }
  }, [studentId, user]);

  useEffect(() => {
    if (!studentId || !user || !busAssignment?.bus_id) return;
    const cleanup = setupRealtimeSubscription(busAssignment.bus_id);
    return cleanup;
  }, [busAssignment?.bus_id, studentId, user?.id]);

  const loadData = async () => {
    try {
      // Verify parent owns this student
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('parent_id', user?.id)
        .single();

      if (error || !studentData) {
        navigate('/dashboard');
        return;
      }

      setStudent(studentData);

      // Get bus assignment
      const { data: assignment } = await supabase
        .from('student_bus_assignments')
        .select(`
          *,
          buses(*, drivers(*))
        `)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      setBusAssignment(assignment);

      if (assignment?.bus_id) {
        // Check for active trip (robust against multiple rows)
        const today = new Date().toISOString().split('T')[0];
        const { data: trip } = await supabase
          .from('bus_trips')
          .select('*')
          .eq('bus_id', assignment.bus_id)
          .eq('status', 'in_progress')
          .gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setActiveTrip(trip);

        // Get last known location
        const { data: location } = await supabase
          .from('bus_locations')
          .select('*')
          .eq('bus_id', assignment.bus_id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        setLastLocation(location);
      } else {
        setActiveTrip(null);
        setLastLocation(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = (busId: string) => {
    const channel = supabase
      .channel(`bus-tracking-${busId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_trips',
          filter: `bus_id=eq.${busId}`,
        },
        () => {
          // When a trip starts/ends, refresh to show/hide the live map
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_locations',
          filter: `bus_id=eq.${busId}`,
        },
        (payload) => {
          if (payload.new) setLastLocation(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="h-12" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} />

      <div
        className="space-y-6 p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'تتبع حافلة المدرسة' : 'School Bus Tracking'}
            </h1>
            <p className="text-muted-foreground">{studentName}</p>
          </div>
        </div>

      {/* Trip Status */}
      <Card className={activeTrip ? 'border-green-500 bg-green-500/5' : ''}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                activeTrip ? 'bg-green-500/20' : 'bg-muted'
              }`}>
                <Bus className={`h-8 w-8 ${activeTrip ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {busAssignment?.buses?.bus_number || (language === 'ar' ? 'غير مسجل' : 'Not Assigned')}
                </h3>
                <p className="text-muted-foreground">
                  {activeTrip 
                    ? (language === 'ar' ? 'الرحلة نشطة' : 'Trip in Progress')
                    : (language === 'ar' ? 'لا توجد رحلة نشطة' : 'No Active Trip')}
                </p>
              </div>
            </div>
            <Badge variant={activeTrip ? 'default' : 'secondary'} className="text-lg px-4 py-2">
              {activeTrip 
                ? (language === 'ar' ? 'مباشر' : 'LIVE')
                : (language === 'ar' ? 'غير نشط' : 'INACTIVE')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Live Map */}
      {activeTrip && busAssignment?.bus_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {language === 'ar' ? 'الموقع المباشر' : 'Live Location'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[350px] relative">
              <BusMap 
                busId={busAssignment.bus_id}
                studentLocation={student?.home_latitude && student?.home_longitude ? {
                  lat: student.home_latitude,
                  lng: student.home_longitude
                } : undefined}
              />
              {/* Current stop overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-background/90 backdrop-blur p-4 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {activeTrip.current_stop || lastLocation?.current_stop || 
                        (language === 'ar' ? 'في الطريق' : 'On Route')}
                    </span>
                  </div>
                  {activeTrip.next_stop && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ar' ? 'التالي:' : 'Next:'} {activeTrip.next_stop}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Known Location (when no active trip) */}
      {!activeTrip && lastLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {language === 'ar' ? 'آخر موقع معروف' : 'Last Known Location'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {lastLocation.current_stop || (language === 'ar' ? 'غير معروف' : 'Unknown')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(lastLocation.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bus & Driver Info */}
      {busAssignment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                {language === 'ar' ? 'معلومات الحافلة' : 'Bus Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'رقم الحافلة' : 'Bus Number'}
                </span>
                <span className="font-medium">{busAssignment.buses?.bus_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'نقطة الصعود' : 'Pickup Point'}
                </span>
                <span className="font-medium">{busAssignment.pickup_stop || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'وقت الصعود' : 'Pickup Time'}
                </span>
                <span className="font-medium">{busAssignment.pickup_time || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {language === 'ar' ? 'معلومات السائق' : 'Driver Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {busAssignment.buses?.drivers ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الاسم' : 'Name'}
                    </span>
                    <span className="font-medium">
                      {busAssignment.buses.drivers.profile?.full_name || 'N/A'}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${busAssignment.buses.drivers.profile?.phone || ''}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {language === 'ar' ? 'اتصل بالسائق' : 'Call Driver'}
                    </a>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {language === 'ar' ? 'لم يتم تعيين سائق' : 'No driver assigned'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Boarding History - Past Week */}
      {studentId && (
        <BoardingHistory 
          studentId={studentId} 
          busId={busAssignment?.bus_id}
          daysToShow={7}
        />
      )}

      {/* No Assignment */}
      {!busAssignment && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {language === 'ar' ? 'لم يتم تسجيل الطالب في حافلة' : 'Student Not Assigned to Bus'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'يرجى التواصل مع الإدارة لتسجيل الطالب في خدمة النقل'
                : 'Please contact administration to register for bus service'}
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}