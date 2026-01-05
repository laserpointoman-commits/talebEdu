import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nfcService, NFCData } from '@/services/nfcService';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface ScannedStudent {
  id: string;
  name: string;
  nameAr: string;
  class: string;
  scanTime: string;
  action: 'check_in' | 'check_out';
  nfcVerified: boolean;
}

interface ManualEntry {
  studentId: string;
  studentName: string;
  nfcId: string;
}

export default function SchoolAttendanceDevice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const deviceId = searchParams.get('device') || '';
  
  const [session, setSession] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [checkOutCount, setCheckOutCount] = useState(0);
  const scanningRef = useRef(false);
  
  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<ManualEntry | null>(null);
  const [awaitingNfcConfirm, setAwaitingNfcConfirm] = useState(false);

  useEffect(() => {
    if (!deviceId) {
      navigate('/device/login?type=school_gate');
      return;
    }
    loadSession();
    loadTodayRecords();
  }, [deviceId]);

  const loadSession = async () => {
    try {
      const { data: sessionData } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'active')
        .single();

      if (!sessionData) {
        navigate('/device/login?type=school_gate');
        return;
      }

      setSession(sessionData);
    } catch (error) {
      navigate('/device/login?type=school_gate');
    }
  };

  const loadTodayRecords = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: records } = await supabase
      .from('attendance_records')
      .select('*, students(first_name, last_name, first_name_ar, last_name_ar, class)')
      .gte('date', today)
      .order('created_at', { ascending: false })
      .limit(50);

    if (records) {
      const mapped: ScannedStudent[] = records.map((r: any) => ({
        id: r.student_id,
        name: `${r.students?.first_name || ''} ${r.students?.last_name || ''}`,
        nameAr: `${r.students?.first_name_ar || r.students?.first_name || ''} ${r.students?.last_name_ar || r.students?.last_name || ''}`,
        class: r.students?.class || '',
        scanTime: new Date(r.created_at).toLocaleTimeString(),
        action: r.type === 'entry' ? 'check_in' : 'check_out',
        nfcVerified: r.nfc_verified || false
      }));
      
      setScannedStudents(mapped);
      setCheckInCount(records.filter((r: any) => r.type === 'entry').length);
      setCheckOutCount(records.filter((r: any) => r.type === 'exit').length);
    }
  };

  const startContinuousScanning = async () => {
    setIsScanning(true);
    scanningRef.current = true;

    try {
      await nfcService.startScanning(async (nfcData: NFCData) => {
        if (awaitingNfcConfirm && selectedStudent) {
          if (nfcData.id === selectedStudent.nfcId) {
            await recordAttendance(selectedStudent.studentId, selectedStudent.studentName, '', true);
            setSelectedStudent(null);
            setAwaitingNfcConfirm(false);
            setShowManualEntry(false);
            toast.success(language === 'ar' ? 'تم تأكيد الحضور' : 'Attendance confirmed');
          } else {
            toast.error(language === 'ar' ? 'بطاقة غير صحيحة' : 'Wrong card');
          }
          return;
        }

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

  const handleNfcScan = async (nfcData: NFCData) => {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, class, nfc_id')
        .eq('nfc_id', nfcData.id)
        .single();

      if (error || !student) {
        toast.error(language === 'ar' ? 'الطالب غير موجود' : 'Student not found', { duration: 1500 });
        return;
      }

      const studentName = `${student.first_name} ${student.last_name}`;
      const studentNameAr = `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`;

      // Check last action for this student today
      const today = new Date().toISOString().split('T')[0];
      const { data: lastRecord } = await supabase
        .from('attendance_records')
        .select('type')
        .eq('student_id', student.id)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const action = lastRecord?.type === 'entry' ? 'check_out' : 'check_in';

      await recordAttendance(student.id, studentName, studentNameAr, true, action);

    } catch (error) {
      console.error('Error processing scan:', error);
    }
  };

  const recordAttendance = async (studentId: string, name: string, nameAr: string, nfcVerified: boolean, action: 'check_in' | 'check_out' = 'check_in') => {
    try {
      await supabase.functions.invoke('record-attendance', {
        body: {
          studentId,
          deviceId,
          location: 'School Gate',
          action,
          nfcVerified
        }
      });

      const now = new Date();
      const newStudent: ScannedStudent = {
        id: studentId,
        name,
        nameAr: nameAr || name,
        class: '',
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

      setLastScanned(language === 'ar' ? nameAr || name : name);
      setTimeout(() => setLastScanned(null), 1500);

      toast.success(`${action === 'check_in' ? '✓' : '←'} ${language === 'ar' ? nameAr || name : name}`, { duration: 1500 });

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
    toast.info(language === 'ar' ? 'امسح بطاقتك للخروج' : 'Scan your card to logout');
    
    try {
      const nfcData = await nfcService.readOnce();
      
      if (nfcData.id !== session?.nfc_id) {
        toast.error(language === 'ar' ? 'يجب استخدام نفس البطاقة للخروج' : 'Must use same card for logout');
        return;
      }

      await supabase
        .from('device_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('device_id', deviceId)
        .eq('status', 'active');

      stopScanning();
      navigate('/device/login?type=school_gate');
      toast.success(language === 'ar' ? 'تم تسجيل الخروج' : 'Logged out');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل الخروج' : 'Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <School className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>
                    {language === 'ar' ? 'حضور المدرسة' : 'School Attendance'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{deviceId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <LogIn className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{checkInCount}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'دخول' : 'Check-ins'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <LogOut className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{checkOutCount}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'خروج' : 'Check-outs'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

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
                    className="text-center p-8 rounded-lg bg-primary/10 border-2 border-primary w-full"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex justify-center mb-4"
                    >
                      <Wifi className="h-16 w-16 text-primary" />
                    </motion.div>
                    <p className="font-semibold">
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
                  <Button onClick={startContinuousScanning} className="flex-1 h-14 text-lg">
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
              <Clock className="h-5 w-5" />
              {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
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
                      key={`${student.id}-${student.scanTime}`}
                      initial={idx === 0 ? { opacity: 0, x: -20, backgroundColor: 'hsl(var(--primary) / 0.2)' } : { opacity: 1 }}
                      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                      className="p-3 rounded-lg border bg-card flex items-center justify-between"
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
                          <Badge variant="outline" className="text-orange-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'يدوي' : 'Manual'}
                          </Badge>
                        )}
                        <Badge variant={student.action === 'check_in' ? 'default' : 'secondary'}>
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
    </div>
  );
}