import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Gradient Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] bg-[length:20px_20px]" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">
            {language === 'ar' ? 'لوحة السائق' : language === 'hi' ? 'ड्राइवर डैशबोर्ड' : 'Driver Dashboard'}
          </h1>
          <p className="mt-1 text-white/80 text-sm md:text-base">
            {language === 'ar' ? 'إدارة رحلة الحافلة' : language === 'hi' ? 'अपने बस मार्ग का प्रबंधन करें' : 'Manage your bus route'}
          </p>
        </div>
      </motion.div>

      {/* Quick Actions - At the top */}
      <QuickActions />

      {/* Bus Status - Modern Card Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: language === 'ar' ? 'رقم الحافلة' : language === 'hi' ? 'बस नंबर' : 'Bus Number',
            value: busData?.bus_number || 'N/A',
            icon: Bus,
            gradient: 'from-blue-500 to-sky-400',
          },
          {
            title: language === 'ar' ? 'الطلاب على متن الحافلة' : language === 'hi' ? 'बस में छात्र' : 'Students On Board',
            value: `${boardedCount} / ${students.length}`,
            icon: Users,
            gradient: 'from-emerald-500 to-green-400',
          },
          {
            title: language === 'ar' ? 'التوقف التالي' : language === 'hi' ? 'अगला स्टॉप' : 'Next Stop',
            value: nextStop || 'N/A',
            icon: MapPin,
            gradient: 'from-amber-500 to-orange-400',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="relative overflow-hidden bg-card rounded-2xl p-5 shadow-md hover:shadow-xl transition-all"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-xl font-bold mt-1">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
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
        <Card className="overflow-hidden rounded-2xl shadow-md">
          <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              {language === 'ar' ? 'قائمة الطلاب' : language === 'hi' ? 'छात्र सूची' : 'Student List'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا يوجد طلاب مسجلون' : language === 'hi' ? 'कोई छात्र असाइन नहीं' : 'No students assigned'}
                </div>
              ) : (
                students.map((student, idx) => (
                  <motion.div 
                    key={student.id || idx} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold">
                        {language === 'ar' ? student.nameAr : student.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {student.stop}
                      </div>
                    </div>
                    {student.status === 'boarded' ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'على متن الحافلة' : language === 'hi' ? 'बोर्ड किया' : 'Boarded'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-300 text-amber-600">
                        {language === 'ar' ? 'في انتظار' : language === 'hi' ? 'प्रतीक्षा में' : 'Waiting'}
                      </Badge>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button size="lg" className="h-16 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg">
          <CheckCircle className="mr-2 h-5 w-5" />
          {language === 'ar' ? 'بدء الرحلة' : language === 'hi' ? 'यात्रा शुरू करें' : 'Start Trip'}
        </Button>
        <Button size="lg" variant="destructive" className="h-16 shadow-lg">
          <AlertTriangle className="mr-2 h-5 w-5" />
          {language === 'ar' ? 'إبلاغ عن حالة طارئة' : language === 'hi' ? 'आपातकाल की रिपोर्ट करें' : 'Report Emergency'}
        </Button>
      </div>
    </div>
  );
}