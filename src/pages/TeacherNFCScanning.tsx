import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  User, 
  Clock,
  Search,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nfcService, NFCData } from '@/services/nfcService';
import { motion, AnimatePresence } from 'framer-motion';

interface ScannedStudent {
  id: string;
  name: string;
  nameAr: string;
  class: string;
  scanTime: string;
  timestamp: Date;
}

export default function TeacherNFCScanning() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    nfcService.isSupportedAsync().then(setNfcSupported);
    
    return () => {
      if (scanningRef.current) {
        nfcService.stopScanning();
      }
    };
  }, []);

  const startScanning = async () => {
    setIsScanning(true);
    scanningRef.current = true;

    try {
      await nfcService.startScanning(async (nfcData: NFCData) => {
        await handleNfcScan(nfcData);
      });
      toast.success(language === 'ar' ? 'بدأ المسح' : 'Scanning started');
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
      // Check if already scanned today
      const existingStudent = scannedStudents.find(s => {
        const studentNfcId = s.id; // We stored the student id, need to check by NFC
        return false; // Will check properly below
      });

      // Find student by NFC ID
      const { data: student, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, class, nfc_id')
        .eq('nfc_id', nfcData.id)
        .single();

      if (error || !student) {
        toast.error(language === 'ar' ? 'الطالب غير موجود' : 'Student not found', {
          duration: 1500,
          position: 'top-center'
        });
        return;
      }

      const studentName = `${student.first_name} ${student.last_name}`;
      const studentNameAr = `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`;

      // Check if already scanned
      const alreadyScanned = scannedStudents.some(s => s.id === student.id);
      if (alreadyScanned) {
        setLastScanned(language === 'ar' ? `${studentNameAr} - تم المسح مسبقاً` : `${studentName} - Already scanned`);
        setTimeout(() => setLastScanned(null), 1500);
        return;
      }

      // Record attendance
      await supabase.functions.invoke('record-attendance', {
        body: {
          studentNfcId: nfcData.id,
          deviceId: `TEACHER-${user?.id}`,
          location: 'Classroom',
          action: 'check_in'
        }
      });

      const now = new Date();
      const newStudent: ScannedStudent = {
        id: student.id,
        name: studentName,
        nameAr: studentNameAr,
        class: student.class || '',
        scanTime: now.toLocaleTimeString(),
        timestamp: now
      };

      // Add to scanned list (newest first)
      setScannedStudents(prev => [newStudent, ...prev]);
      setScanCount(prev => prev + 1);

      // Show quick confirmation
      setLastScanned(language === 'ar' ? studentNameAr : studentName);
      setTimeout(() => setLastScanned(null), 1500);

      toast.success(`✓ ${language === 'ar' ? studentNameAr : studentName}`, {
        duration: 1500,
        position: 'top-center'
      });

    } catch (error) {
      console.error('Error processing scan:', error);
      toast.error(language === 'ar' ? 'فشل معالجة المسح' : 'Failed to process scan');
    }
  };

  const resetScans = () => {
    setScannedStudents([]);
    setScanCount(0);
    toast.info(language === 'ar' ? 'تم مسح القائمة' : 'List cleared');
  };

  const filteredStudents = scannedStudents.filter(s => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(query) || 
           s.nameAr.includes(query) ||
           s.class.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'مسح حضور الطلاب' : 'Student Attendance Scan'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'مسح NFC لتسجيل الحضور' : 'NFC scanning for attendance'}
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {scanCount} {language === 'ar' ? 'طالب' : 'students'}
        </Badge>
      </div>

      {/* NFC Status */}
      {nfcSupported === false && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-orange-600 text-center">
            {language === 'ar' 
              ? 'NFC غير مدعوم على هذا الجهاز - وضع المحاكاة'
              : 'NFC not supported on this device - Simulation mode'}
          </p>
        </div>
      )}

      {/* Scanning Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Scanning Animation */}
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
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="flex justify-center mb-4"
                  >
                    <Wifi className="h-20 w-20 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">
                    {language === 'ar' ? 'في انتظار المسح...' : 'Waiting for scan...'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'ضع سوار NFC بالقرب من الماسح' : 'Hold NFC wristband near scanner'}
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
                  <h3 className="text-xl font-semibold mb-2">
                    {language === 'ar' ? 'المسح غير نشط' : 'Scanner Inactive'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'انقر على "بدء المسح" للمتابعة' : 'Click "Start Scanning" to begin'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Last Scanned Confirmation */}
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
                <Button onClick={startScanning} className="flex-1 h-14 text-lg">
                  <Wifi className="mr-2 h-5 w-5" />
                  {language === 'ar' ? 'بدء المسح' : 'Start Scanning'}
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="destructive" className="flex-1 h-14 text-lg">
                  <WifiOff className="mr-2 h-5 w-5" />
                  {language === 'ar' ? 'إيقاف المسح' : 'Stop Scanning'}
                </Button>
              )}
              <Button onClick={resetScans} variant="outline" className="h-14">
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanned Students List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {language === 'ar' ? 'الطلاب الممسوحون' : 'Scanned Students'}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === 'ar' ? 'لا يوجد طلاب ممسوحون بعد' : 'No students scanned yet'}</p>
                </div>
              ) : (
                filteredStudents.map((student, idx) => (
                  <motion.div
                    key={student.id}
                    initial={idx === 0 ? { opacity: 0, x: -20, backgroundColor: 'hsl(var(--primary) / 0.2)' } : { opacity: 1 }}
                    animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                    transition={{ duration: 0.3 }}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {language === 'ar' ? student.nameAr : student.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{student.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{student.scanTime}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}