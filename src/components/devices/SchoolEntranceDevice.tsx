import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useStudents } from '@/contexts/StudentsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  WifiIcon, 
  WifiOffIcon, 
  CreditCard,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  School
} from 'lucide-react';

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  action: 'check_in' | 'check_out';
  timestamp: Date;
  allowanceProcessed?: boolean;
}

export default function SchoolEntranceDevice() {
  const { language } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<AttendanceRecord | null>(null);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [deviceId] = useState(`SCH-${Date.now().toString().slice(-6)}`);
  const { getStudent } = useStudents();

  // Simulate NFC scanning
  const simulateNfcScan = async (nfcId: string) => {
    setIsScanning(true);
    
    try {
      // Find student by NFC ID
      const student = getStudent(nfcId); // In real app, this would query by NFC
      
      if (!student) {
        toast({
          title: "Unknown Card",
          description: "This NFC card is not registered",
          variant: "destructive"
        });
        setIsScanning(false);
        return;
      }

      // Determine if check-in or check-out
      const existingRecord = todayRecords.find(r => r.studentId === student.id && r.action === 'check_in');
      const action: 'check_in' | 'check_out' = existingRecord ? 'check_out' : 'check_in';
      
      const record: AttendanceRecord = {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        action,
        timestamp: new Date(),
        allowanceProcessed: action === 'check_in'
      };

      // Process attendance
      await processAttendance(record);
      
      // Process daily allowance if checking in
      if (action === 'check_in') {
        await processDailyAllowance(student.id);
      }
      
      // Send notification to parent
      await sendNotification(student.id, action);
      
      setLastScanned(record);
      setTodayRecords(prev => [...prev, record]);
      
      toast({
        title: action === 'check_in' ? "Check-In Successful" : "Check-Out Successful",
        description: `${student.firstName} ${student.lastName} has ${action === 'check_in' ? 'entered' : 'left'} the school`,
      });
      
    } catch (error) {
      toast({
        title: language === 'en' ? "Error" : "خطأ",
        description: language === 'en' ? "Failed to process attendance" : "فشل في معالجة الحضور",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const processAttendance = async (record: AttendanceRecord) => {
    // In production, this would call Supabase edge function
    console.log('Processing attendance:', record);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const processDailyAllowance = async (studentId: string) => {
    // In production, this would call Supabase edge function
    console.log('Processing daily allowance for:', studentId);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  const sendNotification = async (studentId: string, action: 'check_in' | 'check_out') => {
    // In production, this would call Supabase edge function
    console.log('Sending notification for:', studentId, action);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
  };

  // Simulate periodic connection check
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1); // 90% online
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Mock NFC scanning for testing
  const mockScanStudent = () => {
    // Simulate scanning a student's NFC card
    const mockNfcIds = ['NFC123456', 'NFC789012', 'NFC345678'];
    const randomNfc = mockNfcIds[Math.floor(Math.random() * mockNfcIds.length)];
    simulateNfcScan(randomNfc);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Device Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <School className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{language === 'en' ? 'School Entrance System' : 'نظام دخول المدرسة'}</CardTitle>
                  <p className="text-sm text-muted-foreground">{language === 'en' ? 'Device ID' : 'معرف الجهاز'}: {deviceId}</p>
                </div>
              </div>
              <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
                {isOnline ? <WifiIcon className="h-3 w-3" /> : <WifiOffIcon className="h-3 w-3" />}
                {isOnline ? (language === 'en' ? 'Online' : 'متصل') : (language === 'en' ? 'Offline' : 'غير متصل')}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* NFC Scanner */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-48 h-48 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <div className={`absolute inset-4 rounded-full ${isScanning ? 'animate-pulse bg-primary/20' : 'bg-background'} flex items-center justify-center`}>
                  <CreditCard className={`h-16 w-16 ${isScanning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {isScanning ? 'Scanning...' : 'Ready to Scan'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Place student NFC card on the reader
                </p>
              </div>

              {/* Test Button */}
              <Button 
                onClick={mockScanStudent} 
                disabled={isScanning}
                className="w-full max-w-xs"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Simulate NFC Scan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Scanned */}
        {lastScanned && (
          <Card className={`border-2 ${lastScanned.action === 'check_in' ? 'border-green-500/50 bg-green-50/5' : 'border-orange-500/50 bg-orange-50/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {lastScanned.action === 'check_in' ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-orange-500" />
                  )}
                  <div>
                    <p className="font-semibold">{lastScanned.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lastScanned.action === 'check_in' ? 'Checked In' : 'Checked Out'} at {lastScanned.timestamp.toLocaleTimeString()}
                    </p>
                    {lastScanned.allowanceProcessed && (
                      <Badge variant="secondary" className="mt-1">
                        Daily Allowance Added
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Records */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? "Today's Activity" : 'نشاط اليوم'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">{language === 'en' ? 'No records yet today' : 'لا توجد سجلات اليوم'}</p>
              ) : (
                todayRecords.slice(-5).reverse().map((record, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      {record.action === 'check_in' ? (
                        <LogIn className="h-4 w-4 text-green-500" />
                      ) : (
                        <LogOut className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm">{record.studentName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {record.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}