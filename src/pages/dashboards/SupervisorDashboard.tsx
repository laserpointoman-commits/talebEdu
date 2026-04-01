import { useEffect, useState, useRef, useCallback } from "react";
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
  Search,
  Clock,
  ArrowUpFromLine,
  ArrowDownToLine,
  UserX,
  Loader2,
  ShieldAlert,
  X,
  GraduationCap,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LogoLoader from "@/components/LogoLoader";
import { nfcService, NFCData } from "@/services/nfcService";
import { useBusLocationTracking } from "@/hooks/use-bus-location-tracking";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StudentStatus {
  id: string;
  name: string;
  nameAr: string;
  class: string;
  nfcId: string;
  status: 'waiting' | 'boarded' | 'exited' | 'absent';
  boardTime?: string;
  exitTime?: string;
}

type TripType = 'pickup' | 'dropoff';

const NFC_SCAN_COOLDOWN_MS = 1800;

// Auto-detect trip type based on time of day
const getAutoTripType = (): TripType => {
  const hour = new Date().getHours();
  return hour < 12 ? 'pickup' : 'dropoff';
};

export default function SupervisorDashboard() {
  const { language } = useLanguage();
  const { user, session } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busData, setBusData] = useState<any>(null);
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<any>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [tripType, setTripType] = useState<TripType>(getAutoTripType());

  // Send live GPS while a trip is active
  useBusLocationTracking({ enabled: isTripActive, busId: busData?.id ?? null });
  const [searchQuery, setSearchQuery] = useState('');
  const [processingStudent, setProcessingStudent] = useState<string | null>(null);
  const [showEndTripWarning, setShowEndTripWarning] = useState(false);
  const [showAbsentConfirm, setShowAbsentConfirm] = useState(false);
  const [selectedStudentForAbsent, setSelectedStudentForAbsent] = useState<StudentStatus | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const scanningRef = useRef(false);
  const shouldContinueScanning = useRef(false);
  const locationWatchId = useRef<number | null>(null);
  const studentsRef = useRef<StudentStatus[]>([]);
  const processingStudentRef = useRef<string | null>(null);
  const lastNfcScanRef = useRef<{ id: string; scannedAt: number; status: StudentStatus['status'] } | null>(null);
  const currentTripRef = useRef<any>(null);
  const busIdRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(session?.access_token ?? null);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    currentTripRef.current = currentTrip;
  }, [currentTrip]);

  useEffect(() => {
    busIdRef.current = busData?.id ?? null;
  }, [busData]);

  useEffect(() => {
    accessTokenRef.current = session?.access_token ?? null;
  }, [session?.access_token]);

  useEffect(() => {
    let cancelled = false;

    const restoreAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        accessTokenRef.current = data.session?.access_token ?? session?.access_token ?? null;
        setAuthReady(true);
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        if (!cancelled) {
          accessTokenRef.current = session?.access_token ?? null;
          setAuthReady(true);
        }
      }
    };

    void restoreAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      accessTokenRef.current = nextSession?.access_token ?? null;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        setAuthReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [session?.access_token]);

  const wait = useCallback(async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

  const getAccessToken = useCallback(async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      if (accessTokenRef.current) {
        return accessTokenRef.current;
      }

      const { data } = await supabase.auth.getSession();
      accessTokenRef.current = data.session?.access_token ?? null;

      if (accessTokenRef.current) {
        return accessTokenRef.current;
      }

      await wait(120 * (attempt + 1));
    }

    throw new Error('Missing authentication session');
  }, [wait]);

  const getAuthHeaders = useCallback(async () => {
    const accessToken = await getAccessToken();

    return {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    };
  }, [getAccessToken]);

  const invokeFunctionWithSession = useCallback(
    async (functionName: string, body: Record<string, unknown>) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify(body),
        });

        const rawBody = await response.text();
        const data = rawBody ? JSON.parse(rawBody) : null;

        if (!response.ok) {
          return {
            data,
            error: new Error(
              (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
                ? data.error
                : `Request failed with status ${response.status}`,
            ),
          };
        }

        return { data, error: null };
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Request failed'),
        };
      }
    },
    [getAuthHeaders],
  );

  // Send GPS location to backend
  const sendLocationUpdate = useCallback(async (position: GeolocationPosition) => {
    if (!busData?.id || !isTripActive) return;
    
    try {
      const { error } = await invokeFunctionWithSession('update-bus-location', {
        busId: busData.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
      });
      
      if (error) {
        console.error('Error sending location:', error);
      } else {
        console.log('Location sent:', position.coords.latitude, position.coords.longitude);
      }
    } catch (err) {
      console.error('Failed to send location update:', err);
    }
  }, [busData?.id, invokeFunctionWithSession, isTripActive]);

  // Start GPS tracking when trip is active
  const startLocationTracking = useCallback(() => {
    if (locationWatchId.current !== null) return;
    
    if (!navigator.geolocation) {
      toast.error(language === 'ar' ? 'تتبع الموقع غير مدعوم' : 'Location tracking not supported');
      return;
    }

    setIsTrackingLocation(true);
    
    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => sendLocationUpdate(pos),
      (err) => console.error('Initial position error:', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch position continuously - only show toast once for errors
    let hasShownLocationError = false;
    locationWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        hasShownLocationError = false; // Reset on success
        sendLocationUpdate(pos);
      },
      (err) => {
        console.error('Location watch error:', err.code, err.message);
        // Only show toast once per error session
        if (!hasShownLocationError) {
          hasShownLocationError = true;
          // Don't show toast for timeout errors (code 3) - just log them
          if (err.code !== 3) {
            toast.error(language === 'ar' ? 'خطأ في تتبع الموقع' : 'Location tracking error');
          }
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 60000, // Increased timeout to reduce false errors
        maximumAge: 10000
      }
    );
    
    console.log('Location tracking started');
  }, [sendLocationUpdate, language]);

  // Stop GPS tracking
  const stopLocationTracking = useCallback(() => {
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
      setIsTrackingLocation(false);
      console.log('Location tracking stopped');
    }
  }, []);

  useEffect(() => {
    if (user && authReady) {
      loadSupervisorData();
      const cleanup = setupRealtimeSubscriptions();
      return () => {
        cleanup();
        shouldContinueScanning.current = false;
        scanningRef.current = false;
        stopLocationTracking();
      };
    }
  }, [authReady, user, stopLocationTracking]);

  // Start/stop location tracking based on trip status
  useEffect(() => {
    if (isTripActive && busData?.id) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [isTripActive, busData?.id, startLocationTracking, stopLocationTracking]);

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
      busIdRef.current = busId;

      const { data: activeTrip, error: activeTripError } = await supabase
        .from('bus_trips')
        .select('*')
        .eq('bus_id', busId)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeTripError) {
        console.warn('Active trip lookup error:', activeTripError);
      }

      if (activeTrip) {
        setCurrentTrip(activeTrip);
        currentTripRef.current = activeTrip;
        setIsTripActive(true);
        setTripType(activeTrip.trip_type === 'morning' ? 'pickup' : 'dropoff');
      } else {
        setCurrentTrip(null);
        currentTripRef.current = null;
        setIsTripActive(false);
      }

      await loadBusStudents(busId, activeTrip?.id ?? null);
    } catch (error) {
      console.error('Error loading supervisor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusStudents = async (busId: string, tripId?: string | null, options?: { silent?: boolean }) => {
    const { data, error: fnError } = await invokeFunctionWithSession('get-supervisor-bus-students', {
      busId,
      tripId: tripId ?? undefined,
    });

    if (fnError) {
      console.error('get-supervisor-bus-students failed:', fnError);
      if (!options?.silent) {
        toast.error(language === 'ar' ? 'تعذر تحميل الطلاب' : 'Failed to load students');
      }
      studentsRef.current = [];
      setStudents([]);
      return;
    }

    const nextStudents = (data?.students || []) as StudentStatus[];
    studentsRef.current = nextStudents;
    setStudents(nextStudents);
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('supervisor-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bus_boarding_logs'
      }, () => {
        if (busIdRef.current) {
          void loadBusStudents(busIdRef.current, currentTripRef.current?.id ?? null, { silent: true });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Continuous scanning using readOnce in a loop (iOS CoreNFC requires new session per scan)
  const startContinuousScanning = async () => {
    if (scanningRef.current) return;
    
    setIsScanning(true);
    scanningRef.current = true;
    shouldContinueScanning.current = true;
    setScanCount(0);

    toast.success(language === 'ar' ? 'بدأ المسح المستمر' : 'Continuous scanning started');

    // Start the continuous scanning loop
    continuousScanLoop();
  };

  const continuousScanLoop = async () => {
    while (shouldContinueScanning.current) {
      try {
        console.log('NFC: Starting new scan session...');
        const nfcData = await nfcService.readOnce();
        
        if (!shouldContinueScanning.current) break;
        
        if (nfcData) {
          setScanCount(prev => prev + 1);
          await handleNfcScan(nfcData);
        }
        
        // Small delay before next scan to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.log('NFC scan error or cancelled:', error?.message);
        
        // If user cancelled or error occurred, check if we should continue
        if (!shouldContinueScanning.current) break;
        
        // For timeouts or cancellations, just continue the loop
        if (error?.message?.includes('timeout') || error?.message?.includes('cancel')) {
          continue;
        }
        
        // For other errors, show toast but continue
        console.error('NFC scan error:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Cleanup when loop ends
    setIsScanning(false);
    scanningRef.current = false;
    console.log('NFC: Continuous scanning stopped');
  };

  const stopScanning = () => {
    shouldContinueScanning.current = false;
    scanningRef.current = false;
    setIsScanning(false);
    nfcService.stopScanning();
    toast.info(language === 'ar' ? 'توقف المسح' : 'Scanning stopped');
  };

  const handleNfcScan = async (nfcData: NFCData) => {
    const normalizedScanId = nfcData.id.trim().toLowerCase();
    const now = Date.now();

    const student = studentsRef.current.find(
      (s) => s.nfcId?.trim().toLowerCase() === normalizedScanId,
    );
    
    if (!student) {
      toast.error(language === 'ar' ? 'الطالب غير موجود' : 'Student not found');
      return;
    }

    const previousScan = lastNfcScanRef.current;

    if (
      previousScan?.id === normalizedScanId &&
      previousScan.status === student.status &&
      now - previousScan.scannedAt < NFC_SCAN_COOLDOWN_MS
    ) {
      console.log('Ignoring duplicate NFC scan', {
        nfcId: normalizedScanId,
        status: student.status,
        elapsedMs: now - previousScan.scannedAt,
      });
      return;
    }

    lastNfcScanRef.current = {
      id: normalizedScanId,
      scannedAt: now,
      status: student.status,
    };

    // Pass isNfcScan=true to indicate this came from an NFC scan
    await processStudentAction(student, undefined, true);
  };

  const processStudentAction = async (student: StudentStatus, action?: 'board' | 'exit' | 'absent', isNfcScan: boolean = false) => {
    if (processingStudentRef.current) return;

    if (!authReady) {
      toast.error(language === 'ar' ? 'يرجى الانتظار حتى يكتمل تسجيل الدخول' : 'Please wait for authentication to finish');
      if (isNfcScan) {
        lastNfcScanRef.current = null;
      }
      return;
    }

    if (!busData?.id) {
      toast.error(language === 'ar' ? 'بيانات الحافلة غير جاهزة' : 'Bus data is not ready yet');
      if (isNfcScan) {
        lastNfcScanRef.current = null;
      }
      return;
    }

    if (!currentTripRef.current?.id) {
      toast.error(language === 'ar' ? 'ابدأ الرحلة أولاً' : 'Start the trip first');
      if (isNfcScan) {
        lastNfcScanRef.current = null;
      }
      return;
    }

    const currentStudent = studentsRef.current.find((s) => s.id === student.id) ?? student;

    processingStudentRef.current = currentStudent.id;
    setProcessingStudent(student.id);

    try {
      // Determine action based on current status
      let finalAction: 'board' | 'exit' = action as any;

      if (!finalAction) {
        if (currentStudent.status === 'boarded') {
          finalAction = 'exit';
        } else {
          finalAction = 'board';
        }
      }

      let requestedAction: 'board' | 'exit' | 'auto' = isNfcScan && !action ? 'auto' : finalAction;
      const requestBody = {
        studentId: currentStudent.id,
        busId: busData.id,
        tripId: currentTripRef.current.id,
        action: requestedAction,
        location: busData?.bus_number || 'Bus',
        nfc_verified: isNfcScan,
        manual_entry: !isNfcScan,
        manual_entry_by: !isNfcScan ? user?.id : undefined,
      };

      let { data, error } = await invokeFunctionWithSession('record-bus-activity', requestBody);

      if ((error || data?.error) && isNfcScan) {
        console.warn('NFC record attempt failed, retrying once with refreshed state', {
          studentId: currentStudent.id,
          busId: busData.id,
          requestedAction,
          error,
          data,
        });

        await loadBusStudents(busData.id, currentTripRef.current?.id ?? null, { silent: true });

        const refreshedStudent = studentsRef.current.find((s) => s.id === currentStudent.id) ?? currentStudent;
        requestedAction = refreshedStudent.status === 'boarded' ? 'exit' : 'board';

        const retryResult = await invokeFunctionWithSession('record-bus-activity', {
          ...requestBody,
          action: requestedAction,
        });

        data = retryResult.data;
        error = retryResult.error;
      }

      if (error || data?.error) {
        const duplicateActionError = isNfcScan && typeof data?.error === 'string' && data.error.startsWith('Already ');

        if (duplicateActionError) {
          await loadBusStudents(busData.id, currentTripRef.current?.id ?? null, { silent: true });

          const refreshedStudent = studentsRef.current.find((s) => s.id === currentStudent.id);
          if (refreshedStudent?.status === 'boarded' || refreshedStudent?.status === 'exited') {
            const studentName = language === 'ar' ? refreshedStudent.nameAr : refreshedStudent.name;
            const duplicateActionText = refreshedStudent.status === 'exited'
              ? (language === 'ar' ? '✓ نزل' : '✓ Exited')
              : (language === 'ar' ? '✓ صعد' : '✓ Boarded');

            lastNfcScanRef.current = {
              id: refreshedStudent.nfcId.trim().toLowerCase(),
              scannedAt: Date.now(),
              status: refreshedStudent.status,
            };

            setLastScanned(studentName);
            setTimeout(() => setLastScanned(null), 2000);
            toast.success(`${studentName} - ${duplicateActionText}`, { duration: 1500 });
            return;
          }
        }

        console.error('Error recording bus activity', {
          studentId: currentStudent.id,
          busId: busData.id,
          requestedAction,
          isNfcScan,
          error,
          data,
        });
        throw new Error(data?.error || error?.message || 'Failed to record');
      }

      const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const studentName = language === 'ar' ? currentStudent.nameAr : currentStudent.name;
      const recordedAction: 'board' | 'exit' = data?.boarding?.action === 'exited' ? 'exit' : 'board';
      const newStatus: 'boarded' | 'exited' = recordedAction === 'exit' ? 'exited' : 'boarded';
      
      setStudents(prev => {
        const nextStudents = prev.map(s => 
          s.id === currentStudent.id
            ? {
                ...s,
                status: newStatus,
                ...(recordedAction === 'board'
                  ? { boardTime: currentTime }
                  : { exitTime: currentTime })
              }
            : s
        );

        studentsRef.current = nextStudents;
        return nextStudents;
      });

      setLastScanned(studentName);
      setTimeout(() => setLastScanned(null), 2000);

      const actionText = recordedAction === 'board' 
        ? (language === 'ar' ? '✓ صعد' : '✓ Boarded')
        : (language === 'ar' ? '✓ نزل' : '✓ Exited');

      lastNfcScanRef.current = {
        id: currentStudent.nfcId.trim().toLowerCase(),
        scannedAt: Date.now(),
        status: newStatus,
      };

      await loadBusStudents(busData.id, currentTripRef.current?.id ?? null, { silent: true });

      toast.success(`${studentName} - ${actionText}`, { duration: 1500 });

    } catch (error) {
      console.error('Error processing action:', error);
      if (isNfcScan) {
        lastNfcScanRef.current = null;
      }
      toast.error(language === 'ar' ? 'فشل التسجيل' : 'Failed to record');
      // Refresh to get correct state
      if (busData?.id) {
        void loadBusStudents(busData.id, currentTripRef.current?.id ?? null, { silent: true });
      }
    } finally {
      processingStudentRef.current = null;
      setProcessingStudent(null);
    }
  };

  const markStudentAbsent = async () => {
    if (!selectedStudentForAbsent) return;
    
    setProcessingStudent(selectedStudentForAbsent.id);

    try {
      const { data, error } = await invokeFunctionWithSession('mark-student-absent', {
        studentId: selectedStudentForAbsent.id,
        busId: busData?.id,
        tripType: tripType,
        supervisorId: user?.id,
      });

      if (error || data?.error) {
        throw new Error(data?.error || 'Failed to mark absent');
      }

      const studentName = language === 'ar' ? selectedStudentForAbsent.nameAr : selectedStudentForAbsent.name;
      
      setStudents(prev => prev.map(s => 
        s.id === selectedStudentForAbsent.id 
          ? { ...s, status: 'absent' }
          : s
      ));

      if (busData?.id) {
        await loadBusStudents(busData.id, currentTripRef.current?.id ?? null, { silent: true });
      }

      toast.warning(`${studentName} - ${language === 'ar' ? 'غائب' : 'Marked absent'}`, { duration: 2000 });

    } catch (error) {
      console.error('Error marking absent:', error);
      toast.error(language === 'ar' ? 'فشل تسجيل الغياب' : 'Failed to mark absent');
    } finally {
      setProcessingStudent(null);
      setShowAbsentConfirm(false);
      setSelectedStudentForAbsent(null);
    }
  };

  const startTrip = async (type: TripType) => {
    if (!busData?.id) return;

    try {
      await supabase
        .from('bus_trips')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('bus_id', busData.id)
        .eq('status', 'in_progress');

      const { data: trip, error } = await supabase
        .from('bus_trips')
        .insert({
          bus_id: busData.id,
          supervisor_id: user?.id,
          trip_type: type === 'pickup' ? 'morning' : 'afternoon',
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentTrip(trip);
      currentTripRef.current = trip;
      setIsTripActive(true);
      setTripType(type);
      
      // Reset students status for new trip
      setStudents(prev => {
        const nextStudents = prev.map((s): StudentStatus => ({
          ...s,
          status: 'waiting',
          boardTime: undefined,
          exitTime: undefined,
        }));
        studentsRef.current = nextStudents;
        return nextStudents;
      });
      
      toast.success(language === 'ar' 
        ? (type === 'pickup' ? 'بدأت رحلة التوصيل للمدرسة' : 'بدأت رحلة العودة للمنزل')
        : (type === 'pickup' ? 'Pickup trip started' : 'Drop-off trip started'));
    } catch (error) {
      console.error('Error starting trip:', error);
      toast.error(language === 'ar' ? 'فشل بدء الرحلة' : 'Failed to start trip');
    }
  };

  const attemptEndTrip = () => {
    const studentsOnBus = students.filter(s => s.status === 'boarded');
    if (studentsOnBus.length > 0) {
      // Block ending trip if students still on bus
      toast.error(
        language === 'ar' 
          ? `لا يمكن إنهاء الرحلة! لا يزال ${studentsOnBus.length} طالب على متن الحافلة`
          : `Cannot end trip! ${studentsOnBus.length} student(s) still on bus`
      );
      setShowEndTripWarning(true);
      return;
    }
    endTrip();
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
      currentTripRef.current = null;
      setIsTripActive(false);
      setTripType(getAutoTripType());
      stopScanning();
      setShowEndTripWarning(false);
      if (busData?.id) {
        void loadBusStudents(busData.id, null);
      }
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
  const absentStudents = filteredStudents.filter(s => s.status === 'absent');

  if (loading || !authReady) {
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

  const completedCount = exitedStudents.length + absentStudents.length;
  const onBusCount = boardedStudents.length;
  const totalStudents = students.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold">{busData.bus_number}</h1>
                {isTripActive && (
                  <div className="flex items-center gap-1.5">
                    <Badge 
                      variant="outline"
                      className={`text-[10px] ${
                        tripType === 'pickup' 
                          ? 'bg-blue-500/10 text-blue-600 border-blue-300' 
                          : 'bg-orange-500/10 text-orange-600 border-orange-300'
                      }`}
                    >
                      {tripType === 'pickup' 
                        ? (language === 'ar' ? '🏫 للمدرسة' : '🏫 To School')
                        : (language === 'ar' ? '🏠 للمنزل' : '🏠 To Home')}
                    </Badge>
                    {isTrackingLocation && (
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-300">
                        <MapPin className="h-2.5 w-2.5 mr-0.5 animate-pulse" />
                        GPS
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Stats */}
            {isTripActive && (
              <div className="flex gap-2">
                <div className="text-center px-2">
                  <p className="text-lg font-bold text-green-600">{onBusCount}</p>
                  <p className="text-[9px] text-muted-foreground">{language === 'ar' ? 'على متن' : 'On Bus'}</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-lg font-bold text-muted-foreground">{waitingStudents.length}</p>
                  <p className="text-[9px] text-muted-foreground">{language === 'ar' ? 'انتظار' : 'Waiting'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Last Scanned Popup */}
      <AnimatePresence>
        {lastScanned && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-4 right-4 z-50"
          >
            <Card className="bg-green-500 border-green-600 text-white shadow-xl">
              <CardContent className="p-3 flex items-center gap-3">
                <CheckCircle className="h-8 w-8" />
                <p className="font-bold text-lg">{lastScanned}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="p-4 space-y-4 pb-28">
        
        {/* Trip Selection */}
        {!isTripActive && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">
                  {language === 'ar' ? 'ابدأ رحلة جديدة' : 'Start Trip'}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  size="lg" 
                  className="h-20 flex-col gap-2 bg-blue-500 hover:bg-blue-600"
                  onClick={() => startTrip('pickup')}
                >
                  <ArrowUpFromLine className="h-6 w-6" />
                  <span className="text-sm">{language === 'ar' ? 'للمدرسة' : 'To School'}</span>
                </Button>
                <Button 
                  size="lg" 
                  className="h-20 flex-col gap-2 bg-orange-500 hover:bg-orange-600"
                  onClick={() => startTrip('dropoff')}
                >
                  <ArrowDownToLine className="h-6 w-6" />
                  <span className="text-sm">{language === 'ar' ? 'للمنزل' : 'To Home'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isTripActive && (
          <>
            {/* NFC Scanner Card with Visual Feedback */}
            <Card className={`transition-all ${isScanning ? 'border-primary border-2 bg-primary/5' : ''}`}>
              <CardContent className="p-4">
                {isScanning ? (
                  <div className="text-center space-y-3">
                    {/* Animated scanning indicator with rotating ring */}
                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                      {/* Rotating ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Second rotating ring (opposite direction) */}
                      <motion.div
                        className="absolute inset-2 rounded-full border-4 border-transparent border-b-primary/60 border-l-primary/20"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Static center with NFC icon */}
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scan className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-bold text-lg text-primary">
                        {language === 'ar' ? 'جاري المسح...' : 'Scanning...'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'ضع البطاقة للقراءة' : 'Hold card to scan'}
                      </p>
                      {scanCount > 0 && (
                        <Badge variant="secondary" className="mt-2">
                          {scanCount} {language === 'ar' ? 'تم مسحهم' : 'scanned'}
                        </Badge>
                      )}
                    </div>
                    
                    <Button 
                      size="lg" 
                      variant="destructive"
                      className="w-full h-12"
                      onClick={stopScanning}
                    >
                      <Square className="mr-2 h-5 w-5" />
                      {language === 'ar' ? 'إيقاف المسح' : 'Stop Scanning'}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full h-16 text-lg"
                    onClick={startContinuousScanning}
                  >
                    <Scan className="mr-3 h-6 w-6" />
                    {language === 'ar' ? 'اضغط لبدء المسح' : 'Tap to Start NFC Scan'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Students List */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'ar' ? 'الطلاب' : 'Students'} ({students.length})
                  </CardTitle>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    
                    {/* On Bus - Need to Exit */}
                    {boardedStudents.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                          <Bus className="h-3 w-3" />
                          {language === 'ar' ? 'على متن الحافلة' : 'On Bus'} ({boardedStudents.length})
                        </p>
                        {boardedStudents.map((student) => (
                          <StudentRow 
                            key={student.id}
                            student={student}
                            language={language}
                            onCheckOut={() => processStudentAction(student, 'exit')}
                            isProcessing={processingStudent === student.id}
                            variant="onbus"
                          />
                        ))}
                      </div>
                    )}

                    {/* Waiting - Need to Board or Mark Absent */}
                    {waitingStudents.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {language === 'ar' ? 'في انتظار' : 'Waiting'} ({waitingStudents.length})
                        </p>
                        {waitingStudents.map((student) => (
                          <StudentRow 
                            key={student.id}
                            student={student}
                            language={language}
                            onCheckIn={() => processStudentAction(student, 'board')}
                            onMarkAbsent={() => {
                              setSelectedStudentForAbsent(student);
                              setShowAbsentConfirm(true);
                            }}
                            isProcessing={processingStudent === student.id}
                            variant="waiting"
                          />
                        ))}
                      </div>
                    )}

                    {/* Completed */}
                    {exitedStudents.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {language === 'ar' ? 'اكتمل' : 'Completed'} ({exitedStudents.length})
                        </p>
                        {exitedStudents.map((student) => (
                          <StudentRow 
                            key={student.id}
                            student={student}
                            language={language}
                            variant="completed"
                          />
                        ))}
                      </div>
                    )}

                    {/* Absent */}
                    {absentStudents.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                          <UserX className="h-3 w-3" />
                          {language === 'ar' ? 'غائب' : 'Absent'} ({absentStudents.length})
                        </p>
                        {absentStudents.map((student) => (
                          <StudentRow 
                            key={student.id}
                            student={student}
                            language={language}
                            variant="absent"
                          />
                        ))}
                      </div>
                    )}

                    {filteredStudents.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'ar' ? 'لا توجد نتائج' : 'No results'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}

        {/* Students List - Always visible even when trip not active */}
        {!isTripActive && students.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === 'ar' ? 'طلاب الحافلة' : 'Bus Students'} ({students.length})
                </CardTitle>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {language === 'ar' ? student.nameAr : student.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.class}</p>
                      </div>
                      {student.nfcId && (
                        <Badge variant="outline" className="text-[10px]">
                          NFC
                        </Badge>
                      )}
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Action Bar */}
      {isTripActive && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t safe-area-inset-bottom">
          <Button 
            size="lg" 
            className={`w-full h-14 font-semibold text-white ${
              onBusCount > 0 
                ? 'bg-red-500 hover:bg-red-600 border-red-600' 
                : 'bg-green-500 hover:bg-green-600 border-green-600'
            }`}
            onClick={attemptEndTrip}
            disabled={onBusCount > 0}
          >
            <Square className="mr-2 h-5 w-5" />
            {onBusCount > 0 
              ? (language === 'ar' ? 'انتظر نزول الطلاب' : 'Wait for Students to Exit')
              : (language === 'ar' ? 'إنهاء الرحلة ✓' : 'End Trip ✓')
            }
            {onBusCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                {onBusCount} {language === 'ar' ? 'على متن' : 'on bus'}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* End Trip Warning Dialog */}
      <AlertDialog open={showEndTripWarning} onOpenChange={setShowEndTripWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {language === 'ar' ? 'تحذير!' : 'Warning!'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {language === 'ar' 
                ? `لا يزال هناك ${onBusCount} طالب على متن الحافلة. تأكد من نزول جميع الطلاب قبل إنهاء الرحلة.`
                : `There are still ${onBusCount} students on the bus. Make sure all students have exited before ending the trip.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'العودة' : 'Go Back'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={endTrip}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ar' ? 'إنهاء على أي حال' : 'End Anyway'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Absent Confirmation */}
      <AlertDialog open={showAbsentConfirm} onOpenChange={setShowAbsentConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              {language === 'ar' ? 'تسجيل غياب' : 'Mark as Absent'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStudentForAbsent && (
                <span className="text-base">
                  {language === 'ar' 
                    ? `هل تريد تسجيل ${selectedStudentForAbsent.nameAr} كغائب؟ سيتم إخطار ولي الأمر.`
                    : `Mark ${selectedStudentForAbsent.name} as absent? The parent will be notified.`}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedStudentForAbsent(null)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={markStudentAbsent}
              className="bg-red-500 hover:bg-red-600"
              disabled={processingStudent === selectedStudentForAbsent?.id}
            >
              {processingStudent === selectedStudentForAbsent?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                language === 'ar' ? 'تأكيد الغياب' : 'Confirm Absent'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Student Row Component
interface StudentRowProps {
  student: StudentStatus;
  language: string;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onMarkAbsent?: () => void;
  isProcessing?: boolean;
  variant: 'waiting' | 'onbus' | 'completed' | 'absent';
}

function StudentRow({ student, language, onCheckIn, onCheckOut, onMarkAbsent, isProcessing, variant }: StudentRowProps) {
  const getBgColor = () => {
    switch (variant) {
      case 'onbus': return 'bg-green-500/10 border-green-500/30';
      case 'completed': return 'bg-blue-500/10 border-blue-500/30';
      case 'absent': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-muted/50 border-muted';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'onbus': return <Bus className="h-4 w-4 text-green-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'absent': return <UserX className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-2 rounded-xl border p-3 ${getBgColor()}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
            {getIcon()}
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {language === 'ar' ? student.nameAr : student.name}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{student.class}</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:flex-nowrap sm:justify-end">
          {variant === 'waiting' && (
            <>
              <Button
                size="sm"
                className="h-8 flex-1 whitespace-nowrap bg-green-500 px-3 text-xs hover:bg-green-600 sm:flex-none"
                onClick={onCheckIn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <ArrowUpFromLine className="mr-1 h-3.5 w-3.5" />
                    {language === 'ar' ? 'صعود' : 'In'}
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 min-w-8 shrink-0 px-2 text-red-500 border-red-300 hover:bg-red-50"
                onClick={onMarkAbsent}
                disabled={isProcessing}
              >
                <UserX className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {variant === 'onbus' && (
            <Button
              size="sm"
              className="h-8 flex-1 whitespace-nowrap bg-blue-500 px-3 text-xs hover:bg-blue-600 sm:flex-none"
              onClick={onCheckOut}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <ArrowDownToLine className="mr-1 h-3.5 w-3.5" />
                  {language === 'ar' ? 'نزول' : 'Out'}
                </>
              )}
            </Button>
          )}

          {variant === 'completed' && (
            <div className="w-full text-right text-[10px] sm:w-auto">
              <p className="text-green-600">{student.boardTime}</p>
              <p className="font-medium text-blue-600">{student.exitTime}</p>
            </div>
          )}

          {variant === 'absent' && (
            <Badge variant="outline" className="border-red-300 bg-red-500/10 text-[10px] text-red-600">
              {language === 'ar' ? 'غائب' : 'Absent'}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
