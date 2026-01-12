import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Bus, 
  Users, 
  CheckCircle, 
  Play, 
  Square,
  AlertTriangle,
  Scan,
  UserPlus,
  Search,
  Clock,
  ArrowUpFromLine,
  ArrowDownToLine,
  X,
  Hand,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LogoLoader from "@/components/LogoLoader";
import { nfcService, NFCData } from "@/services/nfcService";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StudentStatus {
  id: string;
  name: string;
  nameAr: string;
  class: string;
  nfcId: string;
  status: 'waiting' | 'boarded' | 'exited';
  boardTime?: string;
  exitTime?: string;
}

interface RecentScan {
  studentName: string;
  time: string;
  action: 'board' | 'exit';
}

type TripType = 'pickup' | 'dropoff';

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
  const [showTripSelection, setShowTripSelection] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState<TripType | null>(null);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmManual, setShowConfirmManual] = useState(false);
  const [selectedStudentForManual, setSelectedStudentForManual] = useState<StudentStatus | null>(null);
  const [processingManual, setProcessingManual] = useState(false);
  const scanningRef = useRef(false);

  useEffect(() => {
    if (user) {
      loadSupervisorData();
      const cleanup = setupRealtimeSubscriptions();
      return () => {
        cleanup();
        if (scanningRef.current) {
          nfcService.stopScanning();
        }
      };
    }
  }, [user]);

  const loadSupervisorData = async () => {
    try {
      let busId: string | null = null;
      let busInfo: any = null;

      const { data: supervisor } = await supabase
        .from('supervisors')
        .select('*, buses(*)')
        .eq('profile_id', user?.id)
        .single();

      if (supervisor?.bus_id && supervisor.buses) {
        busId = supervisor.bus_id;
        busInfo = supervisor.buses;
      }

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
        setSelectedTripType(activeTrip.trip_type === 'morning' ? 'pickup' : 'dropoff');
      }
    } catch (error) {
      console.error('Error loading supervisor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusStudents = async (busId: string) => {
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
  };

  const handleNfcScan = async (nfcData: NFCData) => {
    try {
      const student = students.find(s => s.nfcId === nfcData.id);
      
      if (!student) {
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

      const existingStudent = students.find(s => s.nfcId === nfcData.id);
      
      // Determine action based on current status (toggle: waiting→board, boarded→exit)
      let action: 'board' | 'exit';
      let newStatus: 'boarded' | 'exited';
      
      if (existingStudent?.status === 'exited') {
        // Already completed both scans
        toast.info(`${studentName} - ${language === 'ar' ? 'اكتمل التسجيل' : 'Already completed'}`, {
          duration: 1500,
          position: 'top-center'
        });
        return;
      } else if (existingStudent?.status === 'boarded') {
        // Second scan - exit
        action = 'exit';
        newStatus = 'exited';
      } else {
        // First scan - board
        action = 'board';
        newStatus = 'boarded';
      }

      await supabase.functions.invoke('record-bus-activity', {
        body: {
          studentNfcId: nfcData.id,
          busId: busData?.id,
          action: action,
          location: busData?.bus_number || 'Bus',
          nfc_verified: true,
          manual_entry: false
        }
      });

      const currentTime = new Date().toLocaleTimeString();
      setStudents(prev => prev.map(s => 
        s.nfcId === nfcData.id 
          ? { 
              ...s, 
              status: newStatus, 
              ...(action === 'board' ? { boardTime: currentTime } : { exitTime: currentTime })
            }
          : s
      ));

      setRecentScans(prev => [
        { studentName, time: currentTime, action },
        ...prev.slice(0, 9)
      ]);

      setLastScanned(studentName);
      setTimeout(() => setLastScanned(null), 2000);

      const actionText = action === 'board' 
        ? (language === 'ar' ? 'صعد' : 'Boarded')
        : (language === 'ar' ? 'نزل' : 'Exited');

      toast.success(`✓ ${studentName} - ${actionText}`, {
        duration: 1500,
        position: 'top-center'
      });

    } catch (error) {
      console.error('Error processing scan:', error);
    }
  };

  const confirmManualAttendance = async () => {
    if (!selectedStudentForManual) return;
    
    setProcessingManual(true);
    
    try {
      const studentName = language === 'ar' ? selectedStudentForManual.nameAr : selectedStudentForManual.name;
      
      // Determine action based on current status
      let action: 'board' | 'exit';
      let newStatus: 'boarded' | 'exited';
      
      if (selectedStudentForManual.status === 'boarded') {
        action = 'exit';
        newStatus = 'exited';
      } else {
        action = 'board';
        newStatus = 'boarded';
      }

      await supabase.functions.invoke('record-bus-activity', {
        body: {
          studentId: selectedStudentForManual.id,
          busId: busData?.id,
          action: action,
          location: busData?.bus_number || 'Bus',
          nfc_verified: false,
          manual_entry: true,
          manual_entry_by: user?.id
        }
      });

      const currentTime = new Date().toLocaleTimeString();
      setStudents(prev => prev.map(s => 
        s.id === selectedStudentForManual.id 
          ? { 
              ...s, 
              status: newStatus, 
              ...(action === 'board' ? { boardTime: currentTime } : { exitTime: currentTime })
            }
          : s
      ));

      setRecentScans(prev => [
        { studentName, time: currentTime, action },
        ...prev.slice(0, 9)
      ]);

      setLastScanned(studentName);
      setTimeout(() => setLastScanned(null), 2000);

      const actionText = action === 'board' 
        ? (language === 'ar' ? 'صعد' : 'Boarded')
        : (language === 'ar' ? 'نزل' : 'Exited');

      toast.success(`✓ ${studentName} - ${actionText}`, {
        duration: 2000,
        position: 'top-center'
      });

      setShowConfirmManual(false);
      setSelectedStudentForManual(null);
    } catch (error) {
      console.error('Error recording manual attendance:', error);
      toast.error(language === 'ar' ? 'فشل تسجيل الحضور' : 'Failed to record attendance');
    } finally {
      setProcessingManual(false);
    }
  };

  const initiateManualAttendance = (student: StudentStatus) => {
    setSelectedStudentForManual(student);
    setShowConfirmManual(true);
    setShowManualDialog(false);
  };

  const startTrip = async (tripType: TripType) => {
    if (!busData?.id) return;

    try {
      const { data: trip, error } = await supabase
        .from('bus_trips')
        .insert({
          bus_id: busData.id,
          supervisor_id: user?.id,
          trip_type: tripType === 'pickup' ? 'morning' : 'afternoon',
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentTrip(trip);
      setIsTripActive(true);
      setSelectedTripType(tripType);
      setShowTripSelection(false);
      
      // Reset students status for new trip
      setStudents(prev => prev.map(s => ({ ...s, status: 'waiting', scanTime: undefined })));
      setRecentScans([]);
      
      toast.success(language === 'ar' 
        ? (tripType === 'pickup' ? 'بدأت رحلة التوصيل للمدرسة' : 'بدأت رحلة العودة للمنزل')
        : (tripType === 'pickup' ? 'Pickup trip started' : 'Drop-off trip started'));
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
      setSelectedTripType(null);
      stopScanning();
      toast.success(language === 'ar' ? 'انتهت الرحلة' : 'Trip ended');
    } catch (error) {
      console.error('Error ending trip:', error);
      toast.error(language === 'ar' ? 'فشل إنهاء الرحلة' : 'Failed to end trip');
    }
  };

  const filteredStudents = students.filter(s => {
    const searchLower = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(searchLower) || 
           s.nameAr.includes(searchQuery) ||
           s.class.toLowerCase().includes(searchLower);
  });

  const waitingStudents = filteredStudents.filter(s => s.status === 'waiting');
  const boardedStudents = filteredStudents.filter(s => s.status === 'boarded');
  const exitedStudents = filteredStudents.filter(s => s.status === 'exited');

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  if (!busData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Bus className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">
          {language === 'ar' ? 'لم يتم تعيين حافلة' : 'No Bus Assigned'}
        </h2>
        <p className="text-muted-foreground text-center max-w-sm">
          {language === 'ar' 
            ? 'يرجى التواصل مع الإدارة لتعيين حافلة لك'
            : 'Please contact administration to assign a bus to you'}
        </p>
      </div>
    );
  }

  const completedCount = students.filter(s => s.status === 'exited').length;
  const onBusCount = students.filter(s => s.status === 'boarded').length;
  const totalStudents = students.length;
  const progressPercentage = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{busData.bus_number}</h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لوحة المشرف' : 'Supervisor'}
                </p>
              </div>
            </div>
            {isTripActive && (
              <Badge 
                className={`px-3 py-1.5 ${
                  selectedTripType === 'pickup' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {selectedTripType === 'pickup' 
                  ? (language === 'ar' ? '🏫 للمدرسة' : '🏫 Pickup')
                  : (language === 'ar' ? '🏠 للمنزل' : '🏠 Drop-off')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 pb-32">
        {/* Progress Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'اكتملوا' : 'Completed'}
                </p>
                <p className="text-2xl font-bold">
                  {completedCount} / {totalStudents}
                </p>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{onBusCount}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {language === 'ar' ? 'على متن' : 'On Bus'}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-muted-foreground">{waitingStudents.length}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {language === 'ar' ? 'انتظار' : 'Waiting'}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div 
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${totalStudents > 0 ? (onBusCount / totalStudents) * 100 : 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {language === 'ar' ? 'اكتمل' : 'Done'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {language === 'ar' ? 'على متن' : 'On Bus'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Trip Selection or Active Trip */}
        {!isTripActive ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">
                  {language === 'ar' ? 'ابدأ رحلة جديدة' : 'Start a New Trip'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'اختر نوع الرحلة للبدء' : 'Select trip type to begin'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  size="lg" 
                  className="h-24 flex-col gap-2 bg-blue-500 hover:bg-blue-600"
                  onClick={() => startTrip('pickup')}
                >
                  <ArrowUpFromLine className="h-8 w-8" />
                  <span className="text-sm font-medium">
                    {language === 'ar' ? 'توصيل للمدرسة' : 'Pickup'}
                  </span>
                </Button>
                <Button 
                  size="lg" 
                  className="h-24 flex-col gap-2 bg-orange-500 hover:bg-orange-600"
                  onClick={() => startTrip('dropoff')}
                >
                  <ArrowDownToLine className="h-8 w-8" />
                  <span className="text-sm font-medium">
                    {language === 'ar' ? 'توصيل للمنزل' : 'Drop-off'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Scanning Status */}
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-2 border-primary bg-primary/5">
                    <CardContent className="p-6 text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4"
                      >
                        <Scan className="h-10 w-10 text-primary" />
                      </motion.div>
                      <p className="font-semibold text-lg">
                        {language === 'ar' ? 'جاري المسح...' : 'Scanning...'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'ضع البطاقة بالقرب من الجهاز' : 'Hold card near device'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="not-scanning"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                        <Scan className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-muted-foreground">
                        {language === 'ar' ? 'اضغط لبدء المسح' : 'Tap to start scanning'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Last Scanned Popup */}
            <AnimatePresence>
              {lastScanned && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="fixed top-24 left-4 right-4 z-50"
                >
                  <Card className="bg-green-500 border-green-600 text-white shadow-lg">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{lastScanned}</p>
                        <p className="text-sm text-white/80">
                          {selectedTripType === 'pickup' 
                            ? (language === 'ar' ? 'صعد للحافلة' : 'Boarded')
                            : (language === 'ar' ? 'نزل من الحافلة' : 'Dropped off')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {!isScanning ? (
                <Button 
                  size="lg" 
                  className="h-14"
                  onClick={startContinuousScanning}
                >
                  <Scan className="mr-2 h-5 w-5" />
                  {language === 'ar' ? 'بدء المسح' : 'Start Scan'}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="h-14"
                  onClick={stopScanning}
                >
                  <Square className="mr-2 h-5 w-5" />
                  {language === 'ar' ? 'إيقاف' : 'Stop'}
                </Button>
              )}
              
              <Button 
                size="lg" 
                variant="outline"
                className="h-14"
                onClick={() => setShowManualDialog(true)}
              >
                <Hand className="mr-2 h-5 w-5" />
                {language === 'ar' ? 'يدوي' : 'Manual'}
              </Button>
            </div>
          </>
        )}

        {/* Students List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'ar' ? 'الطلاب' : 'Students'}
              </CardTitle>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px]">
                  {exitedStudents.length} {language === 'ar' ? 'اكتمل' : 'done'}
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-[10px]">
                  {boardedStudents.length} {language === 'ar' ? 'على متن' : 'on bus'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {waitingStudents.length} {language === 'ar' ? 'انتظار' : 'waiting'}
                </Badge>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={language === 'ar' ? 'بحث عن طالب...' : 'Search student...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {/* Exited Students (completed) */}
                {exitedStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {language === 'ar' ? student.nameAr : student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-600">
                        {language === 'ar' ? 'صعود' : 'In'}: {student.boardTime}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {language === 'ar' ? 'نزول' : 'Out'}: {student.exitTime}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Boarded Students (on bus) */}
                {boardedStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Bus className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {language === 'ar' ? student.nameAr : student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.class}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-medium">{student.boardTime}</p>
                        <Badge variant="outline" className="text-[10px] bg-green-500/20 text-green-700 border-green-300">
                          {language === 'ar' ? 'على متن' : 'On Bus'}
                        </Badge>
                      </div>
                      {isTripActive && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => initiateManualAttendance(student)}
                        >
                          <Hand className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {/* Waiting Students */}
                {waitingStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    className="p-3 rounded-xl bg-muted/50 border flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {language === 'ar' ? student.nameAr : student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.class}</p>
                    </div>
                    {isTripActive && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => initiateManualAttendance(student)}
                      >
                        <Hand className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
                
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery 
                      ? (language === 'ar' ? 'لا توجد نتائج' : 'No results found')
                      : (language === 'ar' ? 'لا يوجد طلاب' : 'No students')}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {language === 'ar' ? 'آخر المسحات' : 'Recent Scans'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentScans.slice(0, 5).map((scan, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      scan.action === 'board' ? 'bg-green-500/5' : 'bg-blue-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {scan.action === 'board' ? (
                        <ArrowUpFromLine className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownToLine className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm font-medium">{scan.studentName}</span>
                      <Badge variant="outline" className={`text-[10px] ${
                        scan.action === 'board' 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {scan.action === 'board' 
                          ? (language === 'ar' ? 'صعود' : 'In')
                          : (language === 'ar' ? 'نزول' : 'Out')}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{scan.time}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Action Bar */}
      {isTripActive && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t safe-area-inset-bottom">
          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="destructive" 
              className="flex-1 h-14"
              onClick={endTrip}
            >
              <Square className="mr-2 h-5 w-5" />
              {language === 'ar' ? 'إنهاء الرحلة' : 'End Trip'}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-4"
              onClick={() => toast.info(language === 'ar' ? 'جاري الإبلاغ...' : 'Reporting...')}
            >
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      )}

      {/* Manual Attendance Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {language === 'ar' ? 'تسجيل حضور يدوي' : 'Manual Attendance'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={language === 'ar' ? 'بحث عن طالب...' : 'Search student...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {waitingStudents.map((student) => (
                  <Button
                    key={student.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => initiateManualAttendance(student)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">
                          {language === 'ar' ? student.nameAr : student.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.class}</p>
                      </div>
                    </div>
                  </Button>
                ))}
                
                {waitingStudents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ar' ? 'جميع الطلاب تم تسجيلهم' : 'All students recorded'}
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-sm text-blue-700">
                {language === 'ar' 
                  ? 'ℹ️ استخدم هذا عندما ينسى الطالب بطاقته أو لا تعمل'
                  : 'ℹ️ Use this when student forgot or has non-working card'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Manual Attendance Dialog */}
      <Dialog open={showConfirmManual} onOpenChange={setShowConfirmManual}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {language === 'ar' ? 'تأكيد تسجيل الحضور' : 'Confirm Attendance'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudentForManual && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <p className="text-xl font-bold">
                  {language === 'ar' ? selectedStudentForManual.nameAr : selectedStudentForManual.name}
                </p>
                <p className="text-muted-foreground">{selectedStudentForManual.class}</p>
              </div>
              
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-sm text-amber-700 text-center">
                  {language === 'ar' 
                    ? '⚠️ سيتم تسجيل الحضور بدون تحقق NFC'
                    : '⚠️ Attendance will be recorded without NFC verification'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowConfirmManual(false);
                    setSelectedStudentForManual(null);
                  }}
                  disabled={processingManual}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={confirmManualAttendance}
                  disabled={processingManual}
                >
                  {processingManual ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {language === 'ar' ? 'تأكيد' : 'Confirm'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
