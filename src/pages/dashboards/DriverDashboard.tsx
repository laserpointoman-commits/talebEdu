import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NFCScanner from "@/components/nfc/NFCScanner";
import { Bus, MapPin, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LogoLoader from "@/components/LogoLoader";
import { QuickActions } from "@/components/admin/QuickActions";

export default function DriverDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busData, setBusData] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [nextStop, setNextStop] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadDriverData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadDriverData = async () => {
    try {
      // Get driver info
      const { data: driver } = await supabase
        .from('drivers')
        .select('bus_id')
        .eq('profile_id', user?.id)
        .single();

      if (!driver || !driver.bus_id) {
        setLoading(false);
        return;
      }

      // Get bus info
      const { data: bus } = await supabase
        .from('buses')
        .select('*')
        .eq('id', driver.bus_id)
        .single();

      setBusData(bus);

      // Get route for this bus
      const { data: routeData } = await supabase
        .from('bus_routes')
        .select('*')
        .eq('bus_id', bus?.id)
        .eq('is_active', true)
        .single();

      setRoute(routeData);

      if (routeData?.stops && Array.isArray(routeData.stops)) {
        const stops = routeData.stops as any[];
        setNextStop(stops[0]?.name || '');
      }

      // Get students assigned to this bus
      const { data: assignments } = await supabase
        .from('student_bus_assignments')
        .select('*')
        .eq('bus_id', bus?.id);

      // Get today's boarding logs
      const today = new Date().toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('bus_boarding_logs')
        .select('*')
        .eq('bus_id', bus?.id)
        .gte('timestamp', `${today}T00:00:00`)
        .order('timestamp', { ascending: false });

      const studentsWithStatus = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('id', assignment.student_id)
            .single();

          const latestLog = logs?.find(log => log.student_id === studentData?.id);
          return {
            id: studentData?.id,
            name: `${studentData?.first_name} ${studentData?.last_name}`,
            nameAr: `${studentData?.first_name_ar || studentData?.first_name} ${studentData?.last_name_ar || studentData?.last_name}`,
            stop: assignment.pickup_stop || 'Not assigned',
            status: latestLog?.action === 'board' ? 'boarded' : 'waiting'
          };
        })
      );

      setStudents(studentsWithStatus);
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('driver_boarding_logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_boarding_logs'
        },
        () => {
          loadDriverData();
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

  const boardedCount = students.filter(s => s.status === 'boarded').length;

  return (
    <div className="space-y-6 p-6">
      {/* Quick Actions */}
      <QuickActions />
      
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'لوحة السائق' : 'Driver Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'إدارة رحلة الحافلة' : 'Manage your bus route'}
        </p>
      </div>

      {/* Bus Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'رقم الحافلة' : 'Bus Number'}
            </CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{busData?.bus_number || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الطلاب على متن الحافلة' : 'Students On Board'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boardedCount} / {students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'التوقف التالي' : 'Next Stop'}
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextStop || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      {/* NFC Scanner for Bus Boarding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <NFCScanner 
            scanType="bus_in"
            location={nextStop || 'Bus Stop'}
            onScanSuccess={(student) => {
              loadDriverData();
            }}
          />
        </div>

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'قائمة الطلاب' : 'Student List'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا يوجد طلاب مسجلون' : 'No students assigned'}
                </div>
              ) : (
                students.map((student, idx) => (
                  <div key={student.id || idx} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">
                        {language === 'ar' ? student.nameAr : student.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {student.stop}
                      </div>
                    </div>
                    {student.status === 'boarded' ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'على متن الحافلة' : 'Boarded'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {language === 'ar' ? 'في انتظار' : 'Waiting'}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button size="lg" className="h-16">
          <CheckCircle className="mr-2 h-5 w-5" />
          {language === 'ar' ? 'بدء الرحلة' : 'Start Trip'}
        </Button>
        <Button size="lg" variant="destructive" className="h-16">
          <AlertTriangle className="mr-2 h-5 w-5" />
          {language === 'ar' ? 'إبلاغ عن حالة طارئة' : 'Report Emergency'}
        </Button>
      </div>
    </div>
  );
}