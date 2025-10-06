import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useStudents } from '@/contexts/StudentsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  WifiIcon, 
  WifiOffIcon, 
  CreditCard,
  Bus,
  MapPin,
  Users,
  Navigation,
  UserCheck,
  UserX
} from 'lucide-react';

interface BusRecord {
  studentId: string;
  studentName: string;
  action: 'board' | 'exit';
  timestamp: Date;
  location?: string;
  homeStop?: string;
}

export default function BusDevice() {
  const { language } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [busNumber, setBusNumber] = useState('BUS-101');
  const [routeId, setRouteId] = useState('ROUTE-A');
  const [currentStop, setCurrentStop] = useState('School Main Gate');
  const [lastScanned, setLastScanned] = useState<BusRecord | null>(null);
  const [onboardStudents, setOnboardStudents] = useState<BusRecord[]>([]);
  const [deviceId] = useState(`BUS-${Date.now().toString().slice(-6)}`);
  const { getStudent } = useStudents();

  // Mock route stops
  const routeStops = [
    'School Main Gate',
    'Al Salam Street',
    'City Center',
    'Park Avenue',
    'Marina District',
    'Beach Road'
  ];

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

      // Check if student is already onboard
      const isOnboard = onboardStudents.some(r => r.studentId === student.id);
      const action: 'board' | 'exit' = isOnboard ? 'exit' : 'board';
      
      const record: BusRecord = {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        action,
        timestamp: new Date(),
        location: currentStop,
        homeStop: 'Marina District' // In real app, this would come from student profile
      };

      // Process bus attendance
      await processBusAttendance(record);
      
      // Send notification to parent
      await sendBusNotification(student.id, action, currentStop);
      
      setLastScanned(record);
      
      if (action === 'board') {
        setOnboardStudents(prev => [...prev, record]);
      } else {
        setOnboardStudents(prev => prev.filter(r => r.studentId !== student.id));
      }
      
      toast({
        title: action === 'board' ? "Student Boarded" : "Student Exited",
        description: `${student.firstName} ${student.lastName} has ${action === 'board' ? 'boarded' : 'exited'} the bus at ${currentStop}`,
      });
      
    } catch (error) {
      toast({
        title: language === 'en' ? "Error" : "خطأ",
        description: language === 'en' ? "Failed to process bus attendance" : "فشل في معالجة حضور الحافلة",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const processBusAttendance = async (record: BusRecord) => {
    // In production, this would call Supabase edge function
    console.log('Processing bus attendance:', record);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const sendBusNotification = async (studentId: string, action: 'board' | 'exit', location: string) => {
    // In production, this would call Supabase edge function
    console.log('Sending bus notification:', studentId, action, location);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Device Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bus className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle>{language === 'en' ? 'Bus Tracking System' : 'نظام تتبع الحافلة'}</CardTitle>
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

        {/* Bus Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="busNumber">{language === 'en' ? 'Bus Number' : 'رقم الحافلة'}</Label>
                <Input 
                  id="busNumber"
                  value={busNumber} 
                  onChange={(e) => setBusNumber(e.target.value)}
                  placeholder={language === 'en' ? 'Enter bus number' : 'أدخل رقم الحافلة'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routeId">{language === 'en' ? 'Route' : 'المسار'}</Label>
                <Input 
                  id="routeId"
                  value={routeId} 
                  onChange={(e) => setRouteId(e.target.value)}
                  placeholder={language === 'en' ? 'Enter route ID' : 'أدخل معرف المسار'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStop">{language === 'en' ? 'Current Stop' : 'المحطة الحالية'}</Label>
                <select 
                  id="currentStop"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={currentStop} 
                  onChange={(e) => setCurrentStop(e.target.value)}
                >
                  {routeStops.map(stop => (
                    <option key={stop} value={stop}>{stop}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Students Onboard: {onboardStudents.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Current Location: {currentStop}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NFC Scanner */}
        <Card className="border-2 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-48 h-48 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 flex items-center justify-center">
                <div className={`absolute inset-4 rounded-full ${isScanning ? 'animate-pulse bg-blue-200 dark:bg-blue-800/20' : 'bg-background'} flex items-center justify-center`}>
                  <CreditCard className={`h-16 w-16 ${isScanning ? 'text-blue-600 animate-pulse' : 'text-muted-foreground'}`} />
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
                variant="default"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Simulate NFC Scan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Scanned */}
        {lastScanned && (
          <Card className={`border-2 ${lastScanned.action === 'board' ? 'border-green-500/50 bg-green-50/5' : 'border-orange-500/50 bg-orange-50/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {lastScanned.action === 'board' ? (
                    <UserCheck className="h-8 w-8 text-green-500" />
                  ) : (
                    <UserX className="h-8 w-8 text-orange-500" />
                  )}
                  <div>
                    <p className="font-semibold">{lastScanned.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lastScanned.action === 'board' ? 'Boarded' : 'Exited'} at {lastScanned.location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lastScanned.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Onboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              {language === 'en' ? `Students Currently Onboard (${onboardStudents.length})` : `الطلاب على متن الحافلة (${onboardStudents.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onboardStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">{language === 'en' ? 'No students onboard' : 'لا يوجد طلاب على متن الحافلة'}</p>
              ) : (
                onboardStudents.map((record, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{record.studentName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Boarded at {record.location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
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