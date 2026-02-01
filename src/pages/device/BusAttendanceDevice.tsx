import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Bus, 
  Users, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  LogOut,
  Plus,
  Search,
  AlertTriangle,
  Play,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nfcService, NFCData } from '@/services/nfcService';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ScanFeedbackOverlay, type ScanFeedbackState } from '@/components/device/ScanFeedbackOverlay';
import { useBusLocationTracking } from '@/hooks/use-bus-location-tracking';
import { kioskService } from '@/services/kioskService';
import { KioskExitGesture } from '@/components/device/KioskExitGesture';
import { CallScreen } from '@/components/messenger/CallScreen';
import { callService } from '@/services/callService';

interface ScannedStudent {
  id: string;
  name: string;
  nameAr: string;
  class: string;
  scanTime: string;
  action: 'board' | 'exit';
  nfcVerified: boolean;
  latitude?: number;
  longitude?: number;
}

interface ManualEntry {
  studentId: string;
  studentName: string;
  nfcId: string;
}

export default function BusAttendanceDevice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const deviceId = searchParams.get('device') || '';
  
  const [session, setSession] = useState<any>(null);
  const [busData, setBusData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripDirection, setTripDirection] = useState<'to_school' | 'to_home'>('to_school');
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const scanningRef = useRef(false);

  const [feedback, setFeedback] = useState<ScanFeedbackState>({ open: false });
  const feedbackTimer = useRef<number | null>(null);

  const studentStatus = useRef<Map<string, 'board' | 'exit'>>(new Map());
  const shouldContinueLoop = useRef(false);

  const { isTracking } = useBusLocationTracking({ enabled: isTripActive, busId: busData?.id ?? null });

  const clearFeedbackLater = useCallback((ms: number) => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback({ open: false }), ms);
  }, []);

  const showSuccess = useCallback((title: string, subtitle?: string) => {
    setFeedback({ open: true, type: 'success', title, subtitle });
    clearFeedbackLater(650);
  }, [clearFeedbackLater]);

  const showError = useCallback((title: string, subtitle?: string) => {
    setFeedback({ open: true, type: 'error', title, subtitle });
    clearFeedbackLater(650);
  }, [clearFeedbackLater]);
  
  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<ManualEntry | null>(null);
  const [awaitingNfcConfirm, setAwaitingNfcConfirm] = useState(false);

  useEffect(() => {
    if (!deviceId) {
      navigate('/device/login?type=bus');
      return;
    }
    loadSession();
  }, [deviceId]);

  useEffect(() => {
    kioskService.startKiosk();
    return () => {
      // keep kiosk running unless user exits with PIN
    };
  }, []);

  const loadSession = async () => {
    try {
      const { data: sessionData } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'active')
        .single();

      if (!sessionData) {
        navigate('/device/login?type=bus');
        return;
      }

      setSession(sessionData);

      // Initialize call service for emergency calls from admin
      // Look up the profile_id from employees or teachers table using the session's nfc_id
      if (sessionData.nfc_id) {
        // Try employees first (drivers, supervisors)
        const { data: employee } = await supabase
          .from('employees')
          .select('profile_id')
          .eq('nfc_id', sessionData.nfc_id)
          .maybeSingle();
        
        if (employee?.profile_id) {
          console.log('[BusDevice] Initializing callService with employee profile_id:', employee.profile_id);
          callService.initialize(employee.profile_id).catch((e) => {
            console.warn('CallService init failed on device:', e);
          });
        } else {
          // Fallback: try teachers table
          const { data: teacher } = await supabase
            .from('teachers')
            .select('profile_id')
            .eq('nfc_id', sessionData.nfc_id)
            .maybeSingle();
            
          if (teacher?.profile_id) {
            console.log('[BusDevice] Initializing callService with teacher profile_id:', teacher.profile_id);
            callService.initialize(teacher.profile_id).catch((e) => {
              console.warn('CallService init failed on device:', e);
            });
          } else {
            console.warn('[BusDevice] Could not find profile_id for NFC:', sessionData.nfc_id);
          }
        }
      }

      // Get linked bus
      const { data: deviceConfig } = await supabase
        .from('device_configs')
        .select('*, buses(*)')
        .eq('device_id', deviceId)
        .single();

      if (deviceConfig?.linked_bus_id) {
        setBusData(deviceConfig.buses);
      }
    } catch (error) {
      navigate('/device/login?type=bus');
    }
  };

  const stopScanning = useCallback(() => {
    shouldContinueLoop.current = false;
    nfcService.stopScanning();
    setIsScanning(false);
    scanningRef.current = false;
  }, []);

  const continuousScanLoop = useCallback(async () => {
    while (shouldContinueLoop.current) {
      try {
        const nfcData = await nfcService.readOnce();
        if (!shouldContinueLoop.current) break;

        if (awaitingNfcConfirm && selectedStudent) {
          if (nfcData.id === selectedStudent.nfcId) {
            await recordAttendance(selectedStudent.studentId, selectedStudent.studentName, '', true);
            setSelectedStudent(null);
            setAwaitingNfcConfirm(false);
            setShowManualEntry(false);
            showSuccess(language === 'ar' ? 'تم التأكيد' : 'Confirmed', selectedStudent.studentName);
          } else {
            showError(language === 'ar' ? 'بطاقة خاطئة' : 'Wrong card');
          }
          await new Promise((r) => setTimeout(r, 120));
          continue;
        }

        await handleNfcScan(nfcData);
        await new Promise((r) => setTimeout(r, 120));
      } catch {
        // Keep scanning; very small backoff.
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }, [awaitingNfcConfirm, selectedStudent, language, showError, showSuccess]);

  const startContinuousScanning = useCallback(async () => {
    if (scanningRef.current) return;
    if (!isTripActive) {
      showError(language === 'ar' ? 'ابدأ الرحلة أولاً' : 'Start trip first');
      return;
    }
    setIsScanning(true);
    scanningRef.current = true;
    shouldContinueLoop.current = true;
    continuousScanLoop();
  }, [continuousScanLoop, isTripActive, language, showError]);

  // Build NFC ID candidates for matching (handles all CM30 NFC formats)
  const buildNfcCandidates = (rawId: string): string[] => {
    const cleaned = (rawId ?? '').replace(/\u0000/g, '').trim();
    const candidates: string[] = [];
    
    // Add original as-is (database stores exact match like NFC-STD-000000008)
    candidates.push(cleaned);
    candidates.push(cleaned.toUpperCase());
    candidates.push(cleaned.toLowerCase());

    // If it already starts with NFC-STD-, we have the correct format!
    if (cleaned.toUpperCase().startsWith('NFC-STD-')) {
      candidates.push(cleaned);
      // Also try different case variants
      candidates.push(cleaned.toUpperCase());
      candidates.push(cleaned.toLowerCase());
      // Extract numeric part after prefix for fallback matching
      const numericPart = cleaned.slice(8);
      candidates.push(numericPart);
      const numOnly = numericPart.replace(/^0+/, '');
      if (numOnly) {
        candidates.push(`NFC-STD-${numOnly.padStart(9, '0')}`);
      }
    }

    // Handle cases where stored/tag IDs include or omit the leading "NFC-".
    if (cleaned.toUpperCase().startsWith('NFC-')) {
      candidates.push(cleaned.slice(4));
    } else if (cleaned.toUpperCase().startsWith('STD-') || cleaned.toUpperCase().startsWith('TCH-')) {
      candidates.push(`NFC-${cleaned}`);
    }

    // If tag contains NFC + digits (e.g., "NFC779373"), try additional variants.
    const nfcDigitsMatch = cleaned.toUpperCase().match(/^NFC(\d+)$/);
    if (nfcDigitsMatch?.[1]) {
      const numericPart = nfcDigitsMatch[1];
      const padded = numericPart.padStart(9, '0');
      candidates.push(numericPart);
      candidates.push(`NFC-${numericPart}`);
      candidates.push(`NFC-${padded}`);
      candidates.push(`NFC-STD-${numericPart}`);
      candidates.push(`NFC-STD-${padded}`);
    }
    
    // If starts with FC (CM30 raw UID format), extract numeric part
    if (cleaned.toUpperCase().startsWith('FC')) {
      const numericPart = cleaned.slice(2);
      candidates.push(numericPart);
      
      // Student cards are stored as NFC-STD-XXXXXXXXX (9 digits padded)
      const padded9 = numericPart.padStart(9, '0');
      candidates.push(`NFC-STD-${padded9}`);
      candidates.push(`NFC-STD-${numericPart}`);
      candidates.push(`nfc-std-${padded9}`);
    }
    
    // If it's just numeric, try with prefixes
    if (/^\d+$/.test(cleaned)) {
      const padded9 = cleaned.padStart(9, '0');
      
      // Student formats
      candidates.push(`NFC-STD-${padded9}`);
      candidates.push(`NFC-STD-${cleaned}`);
    }
    
    // If it's hex (raw UID), convert to decimal and try
    if (/^[0-9A-Fa-f]+$/.test(cleaned) && cleaned.length >= 8) {
      try {
        const decimalVal = parseInt(cleaned, 16);
        const padded9 = String(decimalVal).padStart(9, '0');
        candidates.push(`NFC-STD-${padded9}`);
        candidates.push(`NFC-STD-${decimalVal}`);
      } catch {}
    }
    
    return [...new Set(candidates)];
  };

  const handleNfcScan = async (nfcData: NFCData) => {
    try {
      const candidates = buildNfcCandidates(nfcData.id);
      console.log('NFC scan - trying candidates:', candidates);
      
      // Find student by any matching NFC ID candidate (case-insensitive)
      // Try direct match first
      let { data: student, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, class, nfc_id')
        .in('nfc_id', candidates)
        .limit(1)
        .maybeSingle();
      
      // If not found, try case-insensitive search with ILIKE
      if (!student && !error) {
        for (const candidate of candidates) {
          const { data: foundStudent } = await supabase
            .from('students')
            .select('id, first_name, last_name, first_name_ar, last_name_ar, class, nfc_id')
            .ilike('nfc_id', candidate)
            .limit(1)
            .maybeSingle();
          
          if (foundStudent) {
            student = foundStudent;
            console.log('Found student with case-insensitive match:', candidate);
            break;
          }
        }
      }

      if (error || !student) {
        console.log('Student not found for candidates:', candidates);
        // Best-effort logging so we can see what CM30 returns in the wild.
        try {
          const nowIso = new Date().toISOString();
          await supabase.from('checkpoint_logs').insert({
            student_id: null,
            student_name: null,
            nfc_id: (nfcData.id ?? '').slice(0, 100) || null,
            timestamp: nowIso,
            type: 'unknown_card',
            location: busData?.bus_number ? `Bus ${busData.bus_number}` : 'Bus',
            device_id: deviceId,
            synced: true,
          });
        } catch {
          // ignore
        }

        try {
          await supabase.from('error_logs').insert({
            error_message: 'Student not found',
            error_type: 'nfc_student_lookup',
            function_name: 'BusAttendanceDevice',
            metadata: {
              device_id: deviceId,
              raw_id: nfcData.id,
              candidates,
              ts: new Date().toISOString(),
            },
          });
        } catch {
          // ignore
        }

        const scannedLabel = (nfcData.id ?? '').slice(0, 32);
        showError(
          language === 'ar' ? 'فشل المسح' : 'Scan failed',
          language === 'ar'
            ? 'الطالب غير موجود'
            : scannedLabel
              ? `Student not found: ${scannedLabel}`
              : 'Student not found'
        );
        return;
      }

      const studentName = `${student.first_name} ${student.last_name}`;
      const studentNameAr = `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`;

      await recordAttendance(student.id, studentName, studentNameAr, true);

    } catch (error) {
      console.error('Error processing scan:', error);
    }
  };

  const recordAttendance = async (studentId: string, name: string, nameAr: string, nfcVerified: boolean) => {
    try {
      const prev = studentStatus.current.get(studentId);
      const nextAction: 'board' | 'exit' = prev === 'board' ? 'exit' : 'board';

      // Get current GPS location if available
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 10000
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoError) {
        console.log('Could not get GPS location:', geoError);
      }

      // Record bus boarding - use snake_case for edge function parameters
      await supabase.functions.invoke('record-bus-activity', {
        body: {
          studentId,
          busId: busData?.id,
          action: nextAction,
          location: busData?.bus_number || 'Bus',
          deviceId,
          latitude,
          longitude,
          nfc_verified: nfcVerified,
          manual_entry: false
        }
      });

      studentStatus.current.set(studentId, nextAction);

      const now = new Date();
      const newStudent: ScannedStudent = {
        id: studentId,
        name,
        nameAr: nameAr || name,
        class: '',
        scanTime: now.toLocaleTimeString(),
        action: nextAction,
        nfcVerified,
        latitude,
        longitude
      };

      setScannedStudents(prev => [newStudent, ...prev]);
      setScanCount(prev => prev + 1);

      const displayName = language === 'ar' ? nameAr || name : name;
      setLastScanned(displayName);
      setTimeout(() => setLastScanned(null), 900);
      showSuccess(displayName, nextAction === 'board' ? (language === 'ar' ? 'صعد إلى الحافلة' : 'Boarded') : (language === 'ar' ? 'نزل من الحافلة' : 'Exited'));

    } catch (error) {
      console.error('Error recording attendance:', error);
      showError(language === 'ar' ? 'فشل' : 'Failed', language === 'ar' ? 'تعذر تسجيل الحضور' : 'Could not record');
    }
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, first_name_ar, last_name_ar, nfc_id, class')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,first_name_ar.ilike.%${query}%,last_name_ar.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data || []);
  };

  const handleManualSelect = (student: any) => {
    if (!student.nfc_id) {
      toast.error(language === 'ar' ? 'الطالب ليس لديه بطاقة NFC' : 'Student has no NFC card');
      return;
    }

    setSelectedStudent({
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      nfcId: student.nfc_id
    });
    setAwaitingNfcConfirm(true);
    toast.info(language === 'ar' ? 'امسح بطاقة الطالب للتأكيد' : 'Scan student card to confirm');
  };

  const handleLogout = async () => {
    // Require NFC scan to logout
    toast.info(language === 'ar' ? 'امسح بطاقتك للخروج' : 'Scan your card to logout');
    
    try {
      const nfcData = await nfcService.readOnce();
      
      // Build candidates for session NFC ID comparison
      const sessionCandidates = session?.nfc_id ? buildNfcCandidates(session.nfc_id) : [];
      const scannedCandidates = buildNfcCandidates(nfcData.id);
      const hasMatch = scannedCandidates.some(c => sessionCandidates.includes(c));
      
      if (!hasMatch) {
        toast.error(language === 'ar' ? 'يجب استخدام نفس البطاقة للخروج' : 'Must use same card for logout');
        return;
      }

      await supabase
        .from('device_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('device_id', deviceId)
        .eq('status', 'active');

      stopScanning();
      // Reset NFC service state so next login can scan fresh (await for clean state)
      try {
        await nfcService.reset();
      } catch {}
      navigate('/device/login?type=bus');
      toast.success(language === 'ar' ? 'تم تسجيل الخروج' : 'Logged out');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل الخروج' : 'Logout failed');
    }
  };

  const startTrip = async () => {
    if (!busData?.id) {
      showError(language === 'ar' ? 'لا توجد حافلة' : 'No bus linked', language === 'ar' ? 'اربط الجهاز بحافلة أولاً' : 'Link this device to a bus first');
      return;
    }

    try {
      // Create a trip record (so parent tracking sees it as active)
      await supabase
        .from('bus_trips')
        .insert({
          bus_id: busData.id,
          status: 'in_progress',
          trip_type: tripDirection === 'to_school' ? 'morning' : 'afternoon',
          started_at: new Date().toISOString(),
          driver_id: session?.session_type === 'bus_driver' ? session?.linked_user_id ?? null : null,
          supervisor_id: session?.session_type === 'bus_supervisor' ? session?.linked_user_id ?? null : null,
        });

      setIsTripActive(true);
      showSuccess(language === 'ar' ? 'بدأت الرحلة' : 'Trip started', tripDirection === 'to_school' ? (language === 'ar' ? 'إلى المدرسة' : 'To school') : (language === 'ar' ? 'إلى البيت' : 'To home'));
      // Auto start scanning
      await startContinuousScanning();
    } catch (e) {
      console.error('Start trip error:', e);
      showError(language === 'ar' ? 'فشل' : 'Failed', language === 'ar' ? 'تعذر بدء الرحلة' : 'Could not start trip');
    }
  };

  return (
    <KioskExitGesture
      onExit={() => {
        stopScanning();
        window.location.href = '/device/login?type=bus';
      }}
    >
      <div className="h-[100dvh] overflow-y-auto overscroll-none bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ WebkitOverflowScrolling: 'touch' }}>
        <ScanFeedbackOverlay state={feedback} />
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bus className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle>
                    {language === 'ar' ? 'حضور الحافلة' : 'Bus Attendance'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {busData?.bus_number || deviceId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {scanCount} {language === 'ar' ? 'طالب' : 'students'}
                </Badge>
                  <Badge variant={isTracking ? 'default' : 'secondary'} className="gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {isTracking ? (language === 'ar' ? 'GPS يعمل' : 'GPS on') : (language === 'ar' ? 'GPS' : 'GPS')}
                  </Badge>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Trip Setup */}
        {!isTripActive && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'اختر اتجاه الرحلة' : 'Choose trip direction'}
                    </div>
                    <div className="text-lg font-semibold">
                      {language === 'ar' ? 'المدرسة / البيت' : 'School / Home'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={tripDirection === 'to_school' ? 'default' : 'outline'}
                    className="h-14 text-lg"
                    onClick={() => setTripDirection('to_school')}
                  >
                    {language === 'ar' ? 'إلى المدرسة' : 'To School'}
                  </Button>
                  <Button
                    type="button"
                    variant={tripDirection === 'to_home' ? 'default' : 'outline'}
                    className="h-14 text-lg"
                    onClick={() => setTripDirection('to_home')}
                  >
                    {language === 'ar' ? 'إلى البيت' : 'To Home'}
                  </Button>
                </div>

                <Button onClick={startTrip} className="h-14 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  {language === 'ar' ? 'بدء الرحلة' : 'Start Trip'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanning Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <AnimatePresence mode="wait">
                {isScanning ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center p-8 rounded-lg bg-blue-500/10 border-2 border-blue-500 w-full"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex justify-center mb-4"
                    >
                      <Wifi className="h-16 w-16 text-blue-600" />
                    </motion.div>
                    <p className="font-semibold text-blue-700">
                      {language === 'ar' ? 'المسح المستمر نشط...' : 'Continuous scanning active...'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'جاهز لمسح بطاقات الطلاب' : 'Ready to scan student cards'}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inactive"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center p-8 rounded-lg bg-muted/50 w-full"
                  >
                    <WifiOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="font-semibold">
                      {language === 'ar' ? 'المسح غير نشط' : 'Scanner Inactive'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Last Scanned */}
              <AnimatePresence>
                {lastScanned && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full p-4 bg-green-500/20 rounded-lg border border-green-500 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-lg font-bold text-green-700">{lastScanned}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Control Buttons */}
              <div className="flex gap-4 w-full">
                {!isScanning ? (
                  <Button onClick={startContinuousScanning} className="flex-1 h-14 text-lg bg-blue-600 hover:bg-blue-700">
                    <Wifi className="mr-2 h-5 w-5" />
                    {language === 'ar' ? 'بدء المسح المستمر' : 'Start Continuous Scan'}
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="destructive" className="flex-1 h-14 text-lg">
                    <WifiOff className="mr-2 h-5 w-5" />
                    {language === 'ar' ? 'إيقاف المسح' : 'Stop Scanning'}
                  </Button>
                )}
                <Button variant="outline" className="h-14" onClick={() => setShowManualEntry(true)}>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanned Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === 'ar' ? 'الطلاب الممسوحون' : 'Scanned Students'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {scannedStudents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'ar' ? 'لا يوجد طلاب ممسوحون بعد' : 'No students scanned yet'}</p>
                  </div>
                ) : (
                  scannedStudents.map((student, idx) => (
                    <motion.div
                      key={`${student.id}-${idx}`}
                      initial={idx === 0 ? { opacity: 0, x: -20, backgroundColor: 'hsl(var(--primary) / 0.2)' } : { opacity: 1 }}
                      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                      className="p-3 rounded-lg border bg-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">
                            {language === 'ar' ? student.nameAr : student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.action === 'board' 
                              ? (language === 'ar' ? 'صعد' : 'Boarded')
                              : (language === 'ar' ? 'نزل' : 'Exited')
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.latitude && student.longitude && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const url = `https://www.google.com/maps?q=${student.latitude},${student.longitude}`;
                              window.open(url, '_blank');
                            }}
                            title={language === 'ar' ? 'فتح الموقع' : 'Open Location'}
                          >
                            <MapPin className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {!student.nfcVerified && (
                          <Badge variant="outline" className="text-orange-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'يدوي' : 'Manual'}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">{student.scanTime}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إضافة طالب يدوياً' : 'Add Student Manually'}
            </DialogTitle>
          </DialogHeader>
          
          {!awaitingNfcConfirm ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'ar' ? 'ابحث عن الطالب...' : 'Search student...'}
                  value={manualSearchQuery}
                  onChange={(e) => {
                    setManualSearchQuery(e.target.value);
                    searchStudents(e.target.value);
                  }}
                  className="pl-9"
                />
              </div>
              
              <ScrollArea className="h-[200px]">
                {searchResults.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => handleManualSelect(student)}
                  >
                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                    <p className="text-sm text-muted-foreground">{student.class}</p>
                  </div>
                ))}
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center p-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex justify-center mb-4"
              >
                <Wifi className="h-16 w-16 text-primary" />
              </motion.div>
              <p className="font-semibold mb-2">
                {language === 'ar' ? 'امسح بطاقة الطالب للتأكيد' : 'Scan student card to confirm'}
              </p>
              <p className="text-muted-foreground">{selectedStudent?.studentName}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setAwaitingNfcConfirm(false);
                  setSelectedStudent(null);
                }}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <CallScreen isArabic={language === 'ar'} />
      </div>
    </KioskExitGesture>
  );
}
