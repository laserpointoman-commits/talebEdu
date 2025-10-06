import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NFCScanner from "@/components/nfc/NFCScanner";
import { Bus, UserCheck, UserX, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BusAttendanceDashboard() {
  const { language } = useLanguage();
  const [scanMode, setScanMode] = useState<'board' | 'alight'>('board');
  const [scannedStudents, setScannedStudents] = useState<any[]>([]);
  const [boardedCount, setBoardedCount] = useState(0);
  const [alightedCount, setAlightedCount] = useState(0);

  const handleScanSuccess = (student: any) => {
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
  };

  const currentOnBus = boardedCount - alightedCount;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'لوحة حضور الحافلة' : 'Bus Attendance Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'مسح مستمر لركوب ونزول الطلاب' : 'Continuous scanning for boarding and alighting'}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3">
        <Button
          onClick={() => setScanMode('board')}
          variant={scanMode === 'board' ? 'default' : 'outline'}
          size="lg"
          className="flex-1"
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'صعود' : 'Boarding'}
        </Button>
        <Button
          onClick={() => setScanMode('alight')}
          variant={scanMode === 'alight' ? 'default' : 'outline'}
          size="lg"
          className="flex-1"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
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
    </div>
  );
}