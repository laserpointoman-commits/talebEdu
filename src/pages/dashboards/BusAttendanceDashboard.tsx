import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NFCScanner from "@/components/nfc/NFCScanner";
import ManualAttendance from "@/components/features/ManualAttendance";
import { Bus, UserCheck, UserX, Clock, ArrowRight, ArrowLeft, UserPlus, Wifi, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function BusAttendanceDashboard() {
  const { language } = useLanguage();
  const [scanMode, setScanMode] = useState<'board' | 'alight'>('board');
  const [scannedStudents, setScannedStudents] = useState<any[]>([]);
  const [boardedCount, setBoardedCount] = useState(0);
  const [alightedCount, setAlightedCount] = useState(0);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [busNumber, setBusNumber] = useState('Bus 1'); // TODO: Make configurable

  // Keep screen awake for kiosk mode
  useEffect(() => {
    KeepAwake.keepAwake().catch(console.error);
    return () => {
      KeepAwake.allowSleep().catch(console.error);
    };
  }, []);

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

  const handleScanSuccess = async (student: any) => {
    const scanData = {
      ...student,
      action: scanMode,
      time: new Date().toLocaleTimeString()
    };
    
    setScannedStudents(prev => [...prev, scanData]);
    
    if (scanMode === 'board') {
      setBoardedCount(prev => prev + 1);
    } else {
      setAlightedCount(prev => prev + 1);
    }

    // Haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.log('Haptics not available');
    }
  };

  const currentOnBus = boardedCount - alightedCount;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Device Info Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-3">
            <Bus className="h-10 w-10" />
            {busNumber}
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            {currentTime.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isOnline ? "default" : "destructive"} className="text-lg px-4 py-2">
            <Wifi className="h-5 w-5 mr-2" />
            {isOnline ? (language === 'ar' ? 'متصل' : 'Online') : (language === 'ar' ? 'غير متصل' : 'Offline')}
          </Badge>
          <Button variant="ghost" size="icon" className="h-12 w-12">
            <Settings2 className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mode Selector - Large buttons for touch */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => setScanMode('board')}
          variant={scanMode === 'board' ? 'default' : 'outline'}
          size="lg"
          className="h-20 text-2xl"
        >
          <ArrowRight className="h-8 w-8 mr-3" />
          {language === 'ar' ? 'صعود' : 'Boarding'}
        </Button>
        <Button
          onClick={() => setScanMode('alight')}
          variant={scanMode === 'alight' ? 'default' : 'outline'}
          size="lg"
          className="h-20 text-2xl"
        >
          <ArrowLeft className="h-8 w-8 mr-3" />
          {language === 'ar' ? 'نزول' : 'Alighting'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'على متن الحافلة' : 'On Bus'}
            </CardTitle>
            <Bus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentOnBus}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'صعود اليوم' : 'Boarded Today'}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{boardedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'نزول اليوم' : 'Alighted Today'}
            </CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{alightedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الوضع الحالي' : 'Current Mode'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={scanMode === 'board' ? 'default' : 'outline'}>
              {scanMode === 'board' 
                ? (language === 'ar' ? 'صعود' : 'Boarding')
                : (language === 'ar' ? 'نزول' : 'Alighting')
              }
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Scanner and List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NFC Scanner - Continuous Mode */}
        <div>
          <NFCScanner 
            scanType={scanMode === 'board' ? 'bus_in' : 'bus_out'}
            location={scanMode === 'board' ? 'Bus Stop - Boarding' : 'Bus Stop - Alighting'}
            onScanSuccess={handleScanSuccess}
          />
        </div>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {language === 'ar' ? 'سجل النشاط' : "Activity Log"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {scannedStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{language === 'ar' ? 'في انتظار المسح...' : 'Waiting for scans...'}</p>
                  <p className="text-sm mt-2">{language === 'ar' ? 'اضغط "بدء المسح" للبدء' : 'Press "Start Scanning" to begin'}</p>
                </div>
              ) : (
                scannedStudents.slice().reverse().map((student, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 rounded-lg border animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      student.action === 'board' 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-orange-500/5 border-orange-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {student.action === 'board' ? (
                        <UserCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <UserX className="h-5 w-5 text-orange-500" />
                      )}
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.action === 'board'
                            ? (language === 'ar' ? 'صعود' : 'Boarded')
                            : (language === 'ar' ? 'نزول' : 'Alighted')
                          }
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={student.action === 'board' ? 'text-green-500 border-green-500' : 'text-orange-500 border-orange-500'}
                    >
                      {student.time}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Attendance Dialog */}
      <ManualAttendance
        open={isManualOpen}
        onOpenChange={setIsManualOpen}
        scanType={scanMode === 'board' ? 'bus_in' : 'bus_out'}
        location={scanMode === 'board' ? 'Bus Stop - Boarding' : 'Bus Stop - Alighting'}
        onSuccess={handleScanSuccess}
      />
    </div>
  );
}