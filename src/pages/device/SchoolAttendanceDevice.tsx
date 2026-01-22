import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  School, 
  Users, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  LogOut,
  LogIn,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nfcService, NFCData } from '@/services/nfcService';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
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
  action: 'check_in' | 'check_out';
  nfcVerified: boolean;
}

interface StudentData {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  first_name_ar: string | null;
  last_name_ar: string | null;
  class: string;
  nfc_id: string | null;
  parent_id: string | null;
}

type ScanMode = 'entrance' | 'exit';

export default function SchoolAttendanceDevice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const deviceId = searchParams.get('device') || 'SCHOOL-GATE-001';
  
  const [session, setSession] = useState<any>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('entrance');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [checkOutCount, setCheckOutCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scanningRef = useRef(false);
  
  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classStudents, setClassStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alreadyScannedToday, setAlreadyScannedToday] = useState<Set<string>>(new Set());

  // Keep screen awake
  useEffect(() => {
    KeepAwake.keepAwake().catch(console.error);
    return () => {
      KeepAwake.allowSleep().catch(console.error);
    };
  }, []);

  useEffect(() => {
    kioskService.startKiosk();
  }, []);

  // Initialize call service for emergency calls from admin
  useEffect(() => {
    const initCallService = async () => {
      try {
        // Check for active device session
        const { data: sessionData } = await supabase
          .from('device_sessions')
          .select('*')
          .eq('device_id', deviceId)
          .eq('status', 'active')
          .maybeSingle();

        if (sessionData?.nfc_id) {
          setSession(sessionData);
          
          // Try employees first (school gate operators)
          const { data: employee } = await supabase
            .from('employees')
            .select('profile_id')
            .eq('nfc_id', sessionData.nfc_id)
            .maybeSingle();
          
          if (employee?.profile_id) {
            console.log('[SchoolDevice] Initializing callService with employee profile_id:', employee.profile_id);
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
              console.log('[SchoolDevice] Initializing callService with teacher profile_id:', teacher.profile_id);
              callService.initialize(teacher.profile_id).catch((e) => {
                console.warn('CallService init failed on device:', e);
              });
            } else {
              console.warn('[SchoolDevice] Could not find profile_id for NFC:', sessionData.nfc_id);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing call service:', error);
      }
    };

    initCallService();
  }, [deviceId]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load today's records on mount
  useEffect(() => {
    loadTodayRecords();
    loadClasses();
    
    // Set up realtime subscription for attendance records
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
        },
        () => {
          loadTodayRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade, section')
        .order('grade', { ascending: true })
        .order('section', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name, first_name_ar, last_name_ar, class, nfc_id, parent_id')
        .eq('class', classId)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setClassStudents(data || []);
    } catch (error) {
      console.error('Error fetching class students:', error);
    }
  };

  const loadTodayRecords = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*, students(first_name, last_name, first_name_ar, last_name_ar, class)')
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (records) {
        const mapped: ScannedStudent[] = records.map((r: any) => ({
          id: r.student_id,
          name: `${r.students?.first_name || ''} ${r.students?.last_name || ''}`,
          nameAr: `${r.students?.first_name_ar || r.students?.first_name || ''} ${r.students?.last_name_ar || r.students?.last_name || ''}`,
          class: r.students?.class || '',
          scanTime: new Date(r.created_at).toLocaleTimeString(),
          action: r.type === 'entry' || r.type === 'check_in' ? 'check_in' : 'check_out',
          nfcVerified: r.nfc_verified || r.method === 'nfc'
        }));
        
        setScannedStudents(mapped);
        setCheckInCount(records.filter((r: any) => r.type === 'entry' || r.type === 'check_in').length);
        setCheckOutCount(records.filter((r: any) => r.type === 'exit' || r.type === 'check_out').length);

        // Track already scanned students for "already scanned" feedback
        const scannedIds = new Set<string>();
        records.forEach((r: any) => {
          if (r.student_id) {
            scannedIds.add(`${r.student_id}-${r.type}`);
          }
        });
        setAlreadyScannedToday(scannedIds);
      }
    } catch (error) {
      console.error('Error loading today records:', error);
    }
  };

  const triggerHapticFeedback = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.log('Haptics not available');
    }
  };

  const startScanning = async () => {
    setIsScanning(true);
    scanningRef.current = true;

    try {
      await nfcService.startScanning(async (nfcData: NFCData) => {
        await handleNfcScan(nfcData);
      });
      toast.success(language === 'ar' ? 'بدأ المسح المستمر' : 'Continuous scanning started');
    } catch (error) {
      console.error('Error starting scan:', error);
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

  // Build NFC ID candidates for matching - handles all CM30 NFC formats
  const buildNfcCandidates = (rawId: string): string[] => {
    const cleaned = (rawId ?? '').replace(/\u0000/g, '').trim();
    const candidates: string[] = [];
    
    // Add original as-is (database might store exact match like NFC-STD-000000008)
    candidates.push(cleaned);
    candidates.push(cleaned.toUpperCase());
    candidates.push(cleaned.toLowerCase());

    // If it already starts with NFC-STD-, also try without prefix variants
    if (cleaned.toUpperCase().startsWith('NFC-STD-')) {
      candidates.push(cleaned);
      // Extract numeric part after prefix
      const numericPart = cleaned.slice(8);
      candidates.push(numericPart);
      // Add with different padding
      const numOnly = numericPart.replace(/^0+/, '');
      if (numOnly) {
        candidates.push(`NFC-STD-${numOnly.padStart(9, '0')}`);
      }
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
    
    // If it's just numeric (raw decimal from some readers)
    if (/^\d+$/.test(cleaned)) {
      const padded9 = cleaned.padStart(9, '0');
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
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Build candidates to match various NFC ID formats
      const candidates = buildNfcCandidates(nfcData.id);
      console.log('School NFC scan - trying candidates:', candidates);
      
      // Find student by any matching NFC ID candidate
      const { data: student, error } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name, first_name_ar, last_name_ar, class, nfc_id, parent_id')
        .in('nfc_id', candidates)
        .limit(1)
        .maybeSingle();

      if (error || !student) {
        console.log('Student not found for candidates:', candidates);
        // Persist what the scanner actually returned so we can debug CM30 format mismatches.
        // This runs best-effort and must never block scanning.
        try {
          const nowIso = new Date().toISOString();
          await supabase.from('checkpoint_logs').insert({
            student_id: null,
            student_name: null,
            nfc_id: (nfcData.id ?? '').slice(0, 100) || null,
            timestamp: nowIso,
            type: 'unknown_card',
            location: 'School Gate',
            device_id: deviceId,
            synced: true,
          });
        } catch (e) {
          // ignore
        }

        try {
          await supabase.from('error_logs').insert({
            error_message: 'Student not found',
            error_type: 'nfc_student_lookup',
            function_name: 'SchoolAttendanceDevice',
            metadata: {
              device_id: deviceId,
              raw_id: nfcData.id,
              candidates,
              scan_mode: scanMode,
              ts: new Date().toISOString(),
            },
          });
        } catch {
          // ignore
        }

        const scannedLabel = (nfcData.id ?? '').slice(0, 32);
        toast.error(
          language === 'ar'
            ? 'الطالب غير موجود'
            : scannedLabel
              ? `Student not found: ${scannedLabel}`
              : 'Student not found',
          { duration: 2200 }
        );
        setIsProcessing(false);
        return;
      }

      const action = scanMode === 'entrance' ? 'check_in' : 'check_out';
      
      // Check if already scanned with same action today
      const scanKey = `${student.id}-${action === 'check_in' ? 'entry' : 'exit'}`;
      if (alreadyScannedToday.has(scanKey)) {
        toast.warning(
          language === 'ar' 
            ? `${student.first_name_ar || student.first_name} تم تسجيله مسبقاً` 
            : `${student.first_name} already recorded`,
          { duration: 1500 }
        );
        await triggerHapticFeedback();
        setIsProcessing(false);
        return;
      }

      await recordAttendance(student, action, true);
      
    } catch (error) {
      console.error('Error processing scan:', error);
      toast.error(language === 'ar' ? 'فشل معالجة المسح' : 'Failed to process scan');
    } finally {
      setIsProcessing(false);
    }
  };

  const recordAttendance = async (
    student: StudentData, 
    action: 'check_in' | 'check_out', 
    nfcVerified: boolean
  ) => {
    const studentName = `${student.first_name} ${student.last_name}`;
    const studentNameAr = `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    try {
      // Record in attendance_records table
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          student_id: student.id,
          date: today,
          time: time,
          type: action === 'check_in' ? 'entry' : 'exit',
          status: 'present',
          method: nfcVerified ? 'nfc' : 'manual',
          location: 'School Gate',
          nfc_verified: nfcVerified,
          manual_entry: !nfcVerified,
          recorded_by: deviceId
        });

      if (attendanceError) throw attendanceError;

      // Also record in checkpoint_logs for tracking
      await supabase.from('checkpoint_logs').insert({
        student_id: student.id,
        student_name: studentName.slice(0, 200),
        nfc_id: student.nfc_id?.slice(0, 100) || student.student_id,
        type: action === 'check_in' ? 'attendance_in' : 'attendance_out',
        location: 'School Gate',
        timestamp: now.toISOString(),
        device_id: deviceId,
        synced: true
      });

      // Send parent notification
      if (student.parent_id) {
        try {
          await supabase.functions.invoke('send-parent-notification', {
            body: {
              parentId: student.parent_id,
              studentId: student.id,
              type: action === 'check_in' ? 'student_checkin' : 'student_checkout',
              title: action === 'check_in' 
                ? (language === 'ar' ? 'دخول الطالب' : 'Student Checked In')
                : (language === 'ar' ? 'خروج الطالب' : 'Student Checked Out'),
              message: action === 'check_in'
                ? `${studentName} has arrived at school`
                : `${studentName} has left school`,
              data: {
                location: 'School Gate',
                action: action,
                timestamp: now.toISOString()
              }
            }
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      // Process daily allowance on check-in
      if (action === 'check_in') {
        try {
          await supabase.functions.invoke('process-daily-allowance', {
            body: { studentId: student.id }
          });
        } catch (allowanceError) {
          console.error('Error processing allowance:', allowanceError);
        }
      }

      // Update local state
      const newStudent: ScannedStudent = {
        id: student.id,
        name: studentName,
        nameAr: studentNameAr,
        class: student.class || '',
        scanTime: now.toLocaleTimeString(),
        action,
        nfcVerified
      };

      setScannedStudents(prev => [newStudent, ...prev]);
      
      if (action === 'check_in') {
        setCheckInCount(prev => prev + 1);
      } else {
        setCheckOutCount(prev => prev + 1);
      }

      // Mark as scanned
      setAlreadyScannedToday(prev => {
        const newSet = new Set(prev);
        newSet.add(`${student.id}-${action === 'check_in' ? 'entry' : 'exit'}`);
        return newSet;
      });

      // Show success feedback
      setLastScanned(language === 'ar' ? studentNameAr : studentName);
      await triggerHapticFeedback();
      
      toast.success(
        `${action === 'check_in' ? '✓' : '←'} ${language === 'ar' ? studentNameAr : studentName}`,
        { duration: 1500 }
      );

      setTimeout(() => setLastScanned(null), 2000);

    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error(language === 'ar' ? 'فشل تسجيل الحضور' : 'Failed to record attendance');
    }
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name, first_name_ar, last_name_ar, class, nfc_id, parent_id')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,first_name_ar.ilike.%${query}%,last_name_ar.ilike.%${query}%,student_id.ilike.%${query}%`)
        .limit(15);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching students:', error);
    }
  };

  const handleManualAttendance = async (student: StudentData) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const action = scanMode === 'entrance' ? 'check_in' : 'check_out';
    
    // Check if already recorded
    const scanKey = `${student.id}-${action === 'check_in' ? 'entry' : 'exit'}`;
    if (alreadyScannedToday.has(scanKey)) {
      toast.warning(
        language === 'ar' 
          ? `${student.first_name_ar || student.first_name} تم تسجيله مسبقاً` 
          : `${student.first_name} already recorded`,
        { duration: 1500 }
      );
      setIsProcessing(false);
      return;
    }

    await recordAttendance(student, action, false);
    
    // Close dialog and reset
    setShowManualEntry(false);
    setManualSearchQuery('');
    setSearchResults([]);
    setSelectedClass('');
    setClassStudents([]);
    setSelectedStudent(null);
    setIsProcessing(false);
  };

  const handleLogout = async () => {
    stopScanning();
    // Reset NFC service so next login can scan fresh
    try {
      await nfcService.reset();
    } catch {}
    navigate('/device/login?type=school_gate');
    toast.success(language === 'ar' ? 'تم تسجيل الخروج' : 'Logged out');
  };

  return (
    <KioskExitGesture
      onExit={() => {
        stopScanning();
        window.location.href = '/device/login?type=school_gate';
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <School className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-xl">
                    {language === 'ar' ? 'حضور المدرسة' : 'School Attendance'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentTime.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? (language === 'ar' ? 'متصل' : 'Online') : (language === 'ar' ? 'غير متصل' : 'Offline')}
                </Badge>
                <LanguageSwitcher />
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Mode Selector - Big touch-friendly buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => { setScanMode('entrance'); if (isScanning) { stopScanning(); } }}
            variant={scanMode === 'entrance' ? 'default' : 'outline'}
            size="lg"
            className={`h-20 text-xl font-bold ${scanMode === 'entrance' ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <LogIn className="h-8 w-8 mr-3" />
            {language === 'ar' ? 'دخول' : 'Entrance'}
          </Button>
          <Button
            onClick={() => { setScanMode('exit'); if (isScanning) { stopScanning(); } }}
            variant={scanMode === 'exit' ? 'default' : 'outline'}
            size="lg"
            className={`h-20 text-xl font-bold ${scanMode === 'exit' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
          >
            <LogOut className="h-8 w-8 mr-3" />
            {language === 'ar' ? 'خروج' : 'Exit'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{checkInCount - checkOutCount}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'في المدرسة' : 'In School'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <LogIn className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{checkInCount}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'دخول' : 'Entries'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <LogOut className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{checkOutCount}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'خروج' : 'Exits'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scanning Area */}
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
                    className={`text-center p-8 rounded-lg w-full border-2 ${
                      scanMode === 'entrance' 
                        ? 'bg-green-500/10 border-green-500' 
                        : 'bg-orange-500/10 border-orange-500'
                    }`}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex justify-center mb-4"
                    >
                      <Wifi className={`h-20 w-20 ${scanMode === 'entrance' ? 'text-green-500' : 'text-orange-500'}`} />
                    </motion.div>
                    <p className="text-xl font-bold mb-1">
                      {scanMode === 'entrance' 
                        ? (language === 'ar' ? 'مسح الدخول نشط...' : 'Entry Scanning Active...')
                        : (language === 'ar' ? 'مسح الخروج نشط...' : 'Exit Scanning Active...')
                      }
                    </p>
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'ضع بطاقة الطالب بالقرب من الجهاز' : 'Hold student card near device'}
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
                    <WifiOff className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-bold mb-1">
                      {language === 'ar' ? 'المسح متوقف' : 'Scanner Inactive'}
                    </p>
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'اضغط على زر البدء' : 'Press start button to begin'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Last Scanned Highlight */}
              <AnimatePresence>
                {lastScanned && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className={`w-full p-5 rounded-lg border-2 text-center ${
                      scanMode === 'entrance'
                        ? 'bg-green-500/20 border-green-500'
                        : 'bg-orange-500/20 border-orange-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className={`h-8 w-8 ${scanMode === 'entrance' ? 'text-green-600' : 'text-orange-600'}`} />
                      <span className={`text-2xl font-bold ${scanMode === 'entrance' ? 'text-green-700' : 'text-orange-700'}`}>
                        {lastScanned}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Control Buttons */}
              <div className="flex gap-4 w-full">
                {!isScanning ? (
                  <Button 
                    onClick={startScanning} 
                    className={`flex-1 h-16 text-xl ${
                      scanMode === 'entrance' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    <Wifi className="mr-2 h-6 w-6" />
                    {scanMode === 'entrance'
                      ? (language === 'ar' ? 'بدء مسح الدخول' : 'Start Entry Scan')
                      : (language === 'ar' ? 'بدء مسح الخروج' : 'Start Exit Scan')
                    }
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="destructive" className="flex-1 h-16 text-xl">
                    <WifiOff className="mr-2 h-6 w-6" />
                    {language === 'ar' ? 'إيقاف المسح' : 'Stop Scanning'}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="h-16 px-6" 
                  onClick={() => setShowManualEntry(true)}
                >
                  <UserPlus className="h-6 w-6" />
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 px-6" 
                  onClick={loadTodayRecords}
                >
                  <RefreshCw className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
              <Badge variant="outline" className="ml-auto">
                {scannedStudents.length} {language === 'ar' ? 'سجل' : 'records'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {scannedStudents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'ar' ? 'لا توجد سجلات اليوم' : 'No records today'}</p>
                  </div>
                ) : (
                  scannedStudents.map((student, idx) => (
                    <motion.div
                      key={`${student.id}-${student.scanTime}-${idx}`}
                      initial={idx === 0 ? { opacity: 0, x: -20, backgroundColor: 'hsl(var(--primary) / 0.2)' } : { opacity: 1 }}
                      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                      transition={{ duration: 0.3 }}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        student.action === 'check_in' 
                          ? 'bg-green-500/5 border-green-500/20' 
                          : 'bg-orange-500/5 border-orange-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {student.action === 'check_in' ? (
                          <LogIn className="h-5 w-5 text-green-500" />
                        ) : (
                          <LogOut className="h-5 w-5 text-orange-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {language === 'ar' ? student.nameAr : student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!student.nfcVerified && (
                          <Badge variant="outline" className="text-orange-500 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'يدوي' : 'Manual'}
                          </Badge>
                        )}
                        <Badge 
                          variant={student.action === 'check_in' ? 'default' : 'secondary'}
                          className={student.action === 'check_in' ? 'bg-green-600' : 'bg-orange-600'}
                        >
                          {student.action === 'check_in' 
                            ? (language === 'ar' ? 'دخول' : 'IN') 
                            : (language === 'ar' ? 'خروج' : 'OUT')}
                        </Badge>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {language === 'ar' ? 'تسجيل حضور يدوي' : 'Manual Attendance'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Current Mode Indicator */}
            <div className={`p-3 rounded-lg text-center ${
              scanMode === 'entrance' ? 'bg-green-500/10 text-green-700' : 'bg-orange-500/10 text-orange-700'
            }`}>
              <p className="font-medium">
                {scanMode === 'entrance' 
                  ? (language === 'ar' ? 'تسجيل دخول' : 'Recording Entry')
                  : (language === 'ar' ? 'تسجيل خروج' : 'Recording Exit')
                }
              </p>
            </div>

            {/* Search by Name */}
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'البحث بالاسم' : 'Search by Name'}</Label>
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
              
              {searchResults.length > 0 && (
                <ScrollArea className="h-[150px] border rounded-lg">
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handleManualAttendance(student)}
                    >
                      <p className="font-medium">
                        {language === 'ar' 
                          ? `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`
                          : `${student.first_name} ${student.last_name}`
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">{student.class} - {student.student_id}</p>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {language === 'ar' ? 'أو' : 'OR'}
                </span>
              </div>
            </div>

            {/* Search by Class */}
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'البحث بالفصل' : 'Search by Class'}</Label>
              <Select 
                value={selectedClass} 
                onValueChange={(value) => {
                  setSelectedClass(value);
                  loadClassStudents(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر الفصل' : 'Select class'} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade} - {cls.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {classStudents.length > 0 && (
                <ScrollArea className="h-[150px] border rounded-lg">
                  {classStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handleManualAttendance(student)}
                    >
                      <p className="font-medium">
                        {language === 'ar' 
                          ? `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`
                          : `${student.first_name} ${student.last_name}`
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">{student.student_id}</p>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualEntry(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CallScreen isArabic={language === 'ar'} />
      </div>
    </KioskExitGesture>
  );
}
