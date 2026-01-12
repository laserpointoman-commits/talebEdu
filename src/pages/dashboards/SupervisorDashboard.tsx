import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bus, 
  Users, 
  MapPin, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  Play, 
  Square,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LogoLoader from "@/components/LogoLoader";
import { nfcService, NFCData } from "@/services/nfcService";
import { motion, AnimatePresence } from "framer-motion";

interface StudentStatus {
  id: string;
  name: string;
  nameAr: string;
  class: string;
  nfcId: string;
  status: 'waiting' | 'boarded' | 'exited';
  scanTime?: string;
}

interface RecentScan {
  studentName: string;
  time: string;
  action: string;
}

export default function SupervisorDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busData, setBusData] = useState<any>(null);
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    if (user) {
      loadSupervisorData();
      setupRealtimeSubscriptions();
    }
    return () => {
      if (scanningRef.current) {
        nfcService.stopScanning();
      }
    };
  }, [user]);

  const loadSupervisorData = async () => {
    try {
      let busId: string | null = null;
      let busInfo: any = null;

      // First check supervisors table
      const { data: supervisor } = await supabase
        .from('supervisors')
        .select('*, buses(*)')
        .eq('profile_id', user?.id)
        .single();

      if (supervisor?.bus_id && supervisor.buses) {
        busId = supervisor.bus_id;
        busInfo = supervisor.buses;
      }

      // If not found in supervisors table, check buses.supervisor_id
      if (!busId) {
        const { data: bus } = await supabase
          .from('buses')
          .select('*')
          .eq('supervisor_id', user?.id)
          .single();
        
        if (bus) {
          busId = bus.id;
          busInfo = bus;
        }
      }

      if (!busId || !busInfo) {
        setLoading(false);
        return;
      }

      setBusData(busInfo);
      await loadBusStudents(busId);

      // Check for active trip
      const today = new Date().toISOString().split('T')[0];
      const { data: activeTrip } = await supabase
        .from('bus_trips')
        .select('*')
        .eq('bus_id', busId)
        .eq('status', 'in_progress')
        .gte('created_at', `${today}T00:00:00`)
        .single();

      if (activeTrip) {
        setCurrentTrip(activeTrip);
        setIsTripActive(true);
      }
    } catch (error) {
      console.error('Error loading supervisor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusStudents = async (busId: string) => {
    // Always use edge function for supervisors to bypass RLS restrictions
    const { data, error: fnError } = await supabase.functions.invoke('get-supervisor-bus-students', {
      body: { busId }
    });

    if (fnError) {
      console.error('get-supervisor-bus-students failed:', fnError);
      toast.error(language === 'ar' ? 'تعذر تحميل الطلاب' : 'Failed to load students');
      setStudents([]);
      return;
    }

    setStudents((data?.students || []) as StudentStatus[]);
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('supervisor-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bus_boarding_logs'
      }, () => {
        if (busData?.id) {
          loadBusStudents(busData.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startContinuousScanning = async () => {
    setIsScanning(true);
    scanningRef.current = true;

    try {
      await nfcService.startScanning(async (nfcData: NFCData) => {
        await handleNfcScan(nfcData);
      });
      toast.success(language === 'ar' ? 'بدأ المسح المستمر' : 'Continuous scanning started');
    } catch (error) {
      console.error('Error starting NFC scan:', error);
      setIsScanning(false);
      scanningRef.current = false;
      toast.error(language === 'ar' ? 'فشل بدء المسح' : 'Failed to start scanning');
    }
  };

  const stopScanning = () => {
    nfcService.stopScanning();
    setIsScanning(false);
    scanningRef.current = false;
    toast.info(language === 'ar' ? 'توقف المسح' : 'Scanning stopped');
  };

  const handleNfcScan = async (nfcData: NFCData) => {
    try {
      // Find student by NFC ID
      const student = students.find(s => s.nfcId === nfcData.id);
      
      if (!student) {
        // Try to find in database
        const { data: dbStudent } = await supabase
          .from('students')
          .select('*')
          .eq('nfc_id', nfcData.id)
          .single();

        if (!dbStudent) {
          toast.error(language === 'ar' ? 'الطالب غير موجود' : 'Student not found', {
            duration: 1500
          });
          return;
        }
      }

      const studentName = student 
        ? (language === 'ar' ? student.nameAr : student.name)
        : 'Unknown Student';

      // Check if already scanned
      const existingStudent = students.find(s => s.nfcId === nfcData.id);
      if (existingStudent?.status === 'boarded') {
        toast.info(`${studentName} - ${language === 'ar' ? 'تم المسح مسبقاً' : 'Already scanned'}`, {
          duration: 1500,
          position: 'top-center'
        });
        return;
      }

      // Determine action (toggle between board/exit)
      const action = existingStudent?.status === 'exited' ? 'board' : 'board';

      // Record bus activity
      await supabase.functions.invoke('record-bus-activity', {
        body: {
          studentNfcId: nfcData.id,
          busId: busData?.id,
          action: action,
          location: busData?.bus_number || 'Bus'
        }
      });

      // Update local state immediately for fast UI feedback
      setStudents(prev => prev.map(s => 
        s.nfcId === nfcData.id 
          ? { ...s, status: 'boarded', scanTime: new Date().toLocaleTimeString() }
          : s
      ));

      // Add to recent scans
      setRecentScans(prev => [
        { studentName, time: new Date().toLocaleTimeString(), action },
        ...prev.slice(0, 9)
      ]);

      // Show quick confirmation
      setLastScanned(studentName);
      setTimeout(() => setLastScanned(null), 1500);

      toast.success(`✓ ${studentName}`, {
        duration: 1500,
        position: 'top-center'
      });

    } catch (error) {
      console.error('Error processing scan:', error);
    }
  };

  const startTrip = async () => {
    if (!busData?.id) return;

    try {
      const { data: trip, error } = await supabase
        .from('bus_trips')
        .insert({
          bus_id: busData.id,
          supervisor_id: user?.id,
          trip_type: new Date().getHours() < 12 ? 'morning' : 'afternoon',
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentTrip(trip);
      setIsTripActive(true);
      toast.success(language === 'ar' ? 'بدأت الرحلة' : 'Trip started');
    } catch (error) {
      console.error('Error starting trip:', error);
      toast.error(language === 'ar' ? 'فشل بدء الرحلة' : 'Failed to start trip');
    }
  };

  const endTrip = async () => {
    if (!currentTrip?.id) return;

    try {
      await supabase
        .from('bus_trips')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', currentTrip.id);

      setCurrentTrip(null);
      setIsTripActive(false);
      stopScanning();
      toast.success(language === 'ar' ? 'انتهت الرحلة' : 'Trip ended');
    } catch (error) {
      console.error('Error ending trip:', error);
      toast.error(language === 'ar' ? 'فشل إنهاء الرحلة' : 'Failed to end trip');
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  if (!busData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <Bus className="h-20 w-20 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold mb-2">
          {language === 'ar' ? 'لم يتم تعيين حافلة' : 'No Bus Assigned'}
        </h2>
        <p className="text-muted-foreground text-center">
          {language === 'ar' 
            ? 'يرجى التواصل مع الإدارة لتعيين حافلة لك'
            : 'Please contact administration to assign a bus to you'}
        </p>
      </div>
    );
  }

  const boardedCount = students.filter(s => s.status === 'boarded').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'لوحة المشرف' : 'Supervisor Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? `الحافلة ${busData.bus_number}` : `Bus ${busData.bus_number}`}
          </p>
        </div>
        <Badge variant={isTripActive ? "default" : "secondary"} className="text-lg px-4 py-2">
          {isTripActive 
            ? (language === 'ar' ? 'الرحلة نشطة' : 'Trip Active')
            : (language === 'ar' ? 'لا توجد رحلة' : 'No Active Trip')}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bus className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الحافلة' : 'Bus'}
                </p>
                <p className="text-xl font-bold">{busData.bus_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الطلاب' : 'Students'}
                </p>
                <p className="text-xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'على متن الحافلة' : 'Boarded'}
                </p>
                <p className="text-xl font-bold">{boardedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'في انتظار' : 'Waiting'}
                </p>
                <p className="text-xl font-bold">{students.length - boardedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isTripActive ? (
          <Button size="lg" className="h-16 text-lg" onClick={startTrip}>
            <Play className="mr-2 h-6 w-6" />
            {language === 'ar' ? 'بدء الرحلة' : 'Start Trip'}
          </Button>
        ) : (
          <Button size="lg" variant="destructive" className="h-16 text-lg" onClick={endTrip}>
            <Square className="mr-2 h-6 w-6" />
            {language === 'ar' ? 'إنهاء الرحلة' : 'End Trip'}
          </Button>
        )}
        
        {!isScanning ? (
          <Button 
            size="lg" 
            variant="outline" 
            className="h-16 text-lg"
            onClick={startContinuousScanning}
            disabled={!isTripActive}
          >
            <Wifi className="mr-2 h-6 w-6" />
            {language === 'ar' ? 'بدء مسح NFC' : 'Start NFC Scanning'}
          </Button>
        ) : (
          <Button 
            size="lg" 
            variant="secondary" 
            className="h-16 text-lg animate-pulse"
            onClick={stopScanning}
          >
            <WifiOff className="mr-2 h-6 w-6" />
            {language === 'ar' ? 'إيقاف المسح' : 'Stop Scanning'}
          </Button>
        )}
      </div>

      {/* Scanning Status */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-primary/10 rounded-lg border-2 border-primary text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex justify-center mb-2"
            >
              <Wifi className="h-12 w-12 text-primary" />
            </motion.div>
            <p className="font-semibold">
              {language === 'ar' ? 'في انتظار مسح NFC...' : 'Waiting for NFC scan...'}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'ضع سوار الطالب بالقرب من الماسح' : 'Hold student wristband near scanner'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Scanned */}
      <AnimatePresence>
        {lastScanned && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 bg-green-500/20 rounded-lg border border-green-500 text-center"
          >
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-700">{lastScanned}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === 'ar' ? 'قائمة الطلاب' : 'Student List'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ar' ? 'لا يوجد طلاب مسجلون' : 'No students assigned'}
                  </div>
                ) : (
                  students.map((student) => (
                    <motion.div
                      key={student.id}
                      layout
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        student.status === 'boarded' 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-muted/50'
                      }`}
                    >
                      <div>
                        <p className="font-medium">
                          {language === 'ar' ? student.nameAr : student.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{student.class}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.scanTime && (
                          <span className="text-xs text-muted-foreground">{student.scanTime}</span>
                        )}
                        <Badge variant={student.status === 'boarded' ? 'default' : 'outline'}>
                          {student.status === 'boarded' 
                            ? (language === 'ar' ? 'على متن' : 'Boarded')
                            : (language === 'ar' ? 'في انتظار' : 'Waiting')}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              {language === 'ar' ? 'آخر المسحات' : 'Recent Scans'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {recentScans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ar' ? 'لا توجد مسحات بعد' : 'No scans yet'}
                  </div>
                ) : (
                  recentScans.map((scan, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{scan.studentName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{scan.time}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Button */}
      <Button size="lg" variant="destructive" className="w-full h-16 text-lg">
        <AlertTriangle className="mr-2 h-6 w-6" />
        {language === 'ar' ? 'إبلاغ عن حالة طارئة' : 'Report Emergency'}
      </Button>
    </div>
  );
}