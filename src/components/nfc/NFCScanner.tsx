import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, User, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { nfcService, NFCData } from '@/services/nfcService';
import { motion, AnimatePresence } from 'framer-motion';

interface NFCScannerProps {
  scanType?: string;
  location?: string;
  onScanSuccess?: (student: any) => void;
}

export default function NFCScanner({ 
  scanType = 'attendance',
  location = 'Main Entrance',
  onScanSuccess
}: NFCScannerProps) {
  const { language } = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [isNFCSupported, setIsNFCSupported] = useState(false);

  useEffect(() => {
    setIsNFCSupported(nfcService.isSupported());
  }, []);

  const startScanning = async () => {
    setIsScanning(true);
    
    try {
      await nfcService.startScanning(async (nfcData: NFCData) => {
        await handleNFCScan(nfcData);
      });
      
      toast.success(language === 'ar' ? 'بدأ المسح' : 'Scanning started');
    } catch (error) {
      console.error('Error starting NFC scan:', error);
      setIsScanning(false);
      toast.error(language === 'ar' ? 'فشل بدء المسح' : 'Failed to start scanning');
    }
  };

  const stopScanning = () => {
    nfcService.stopScanning();
    setIsScanning(false);
    toast.info(language === 'ar' ? 'توقف المسح' : 'Scanning stopped');
  };

  const handleNFCScan = async (nfcData: NFCData) => {
    try {
      // Get full user data from database based on NFC data
      let userData;
      
      if (nfcData.type === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('nfc_id', nfcData.id)
          .single();
          
        if (error) throw error;
        userData = data;
      } else if (nfcData.type === 'teacher') {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('nfc_id', nfcData.id)
          .single();
          
        if (error) throw error;
        userData = data;
      }
      
      if (userData) {
        await handleScan(userData);
      } else {
        toast.error(language === 'ar' ? 'المستخدم غير موجود' : 'User not found');
      }
    } catch (error) {
      console.error('Error processing NFC scan:', error);
      toast.error(language === 'ar' ? 'فشل معالجة المسح' : 'Failed to process scan');
    }
  };

  const simulateScan = async () => {
    // Simulate NFC scan for testing (when real NFC is not available)
    const mockStudent = {
      id: `STU-${Math.floor(Math.random() * 10000).toString().padStart(6, '0')}`,
      name: 'Test Student',
      class: 'Grade 10-A',
      nfc_id: `NFC-${Math.random().toString(36).substring(7).toUpperCase()}`
    };

    await handleScan(mockStudent);
  };

  const handleScan = async (student: any) => {
    try {
      // Record the scan in checkpoint_logs
      const { error } = await supabase.from('checkpoint_logs').insert({
        student_id: student.id,
        student_name: student.name || `${student.first_name} ${student.last_name}`,
        nfc_id: student.nfc_id,
        type: scanType,
        location: location,
        timestamp: new Date().toISOString(),
        synced: true
      });

      if (error) throw error;

      setLastScanned(student.name || `${student.first_name} ${student.last_name}`);
      setScanCount(prev => prev + 1);
      
      toast.success(
        language === 'ar' 
          ? `تم تسجيل ${student.name || student.first_name}` 
          : `${student.name || student.first_name} scanned`
      );

      // Call the parent callback
      onScanSuccess?.(student);

      // Reset after 2 seconds
      setTimeout(() => {
        setLastScanned(null);
      }, 2000);

    } catch (error) {
      console.error('Error recording scan:', error);
      toast.error(language === 'ar' ? 'فشل تسجيل المسح' : 'Failed to record scan');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            {language === 'ar' ? 'ماسح NFC' : 'NFC Scanner'}
          </span>
          <Badge variant="outline">
            {scanCount} {language === 'ar' ? 'مسح' : 'scans'}
          </Badge>
        </CardTitle>
        <CardDescription>
          {location} - {scanType}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* NFC Status Indicator */}
        {!isNFCSupported && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-600 text-center">
              {language === 'ar' 
                ? 'NFC غير مدعوم - استخدام وضع المحاكاة'
                : 'NFC not supported - Using simulation mode'}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center p-8 rounded-lg bg-primary/5 border-2 border-primary"
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
                <Wifi className="h-16 w-16 text-primary" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'ar' ? 'في انتظار المسح...' : 'Waiting for scan...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'ضع سوار NFC بالقرب من الماسح' : 'Hold NFC wristband near scanner'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="inactive"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center p-8 rounded-lg bg-muted/50"
            >
              <div className="flex justify-center mb-4">
                <WifiOff className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'ar' ? 'المسح غير نشط' : 'Scanner Inactive'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'انقر على "بدء المسح" للمتابعة' : 'Click "Start Scanning" to begin'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last Scanned */}
        {lastScanned && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20"
          >
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">
                {language === 'ar' ? 'آخر مسح' : 'Last Scanned'}
              </p>
              <p className="text-sm text-muted-foreground">{lastScanned}</p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1" size="lg">
              {isNFCSupported ? (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'بدء المسح' : 'Start Scanning'}
                </>
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'بدء المسح' : 'Start Scanning'}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="flex-1" size="lg">
              <WifiOff className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إيقاف المسح' : 'Stop Scanning'}
            </Button>
          )}
          
          {/* Test button - only show in simulation mode */}
          {!isNFCSupported && (
            <Button 
              onClick={simulateScan} 
              variant="outline"
              size="lg"
            >
              {language === 'ar' ? 'اختبار' : 'Test'}
            </Button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'إجمالي المسح اليوم' : 'Total Scans Today'}
            </p>
            <p className="text-2xl font-bold">{scanCount}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'الموقع' : 'Location'}
            </p>
            <p className="text-sm font-medium truncate">{location}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
