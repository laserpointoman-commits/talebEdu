import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NFCScanner from "@/components/nfc/NFCScanner";
import ManualAttendance from "@/components/features/ManualAttendance";
import { Users, CheckCircle, Clock, ArrowRight, ArrowLeft, UserPlus } from "lucide-react";

export default function SchoolAttendanceDashboard() {
  const { language } = useLanguage();
  const [scanMode, setScanMode] = useState<'in' | 'out'>('in');
  const [scannedStudents, setScannedStudents] = useState<any[]>([]);
  const [enteredCount, setEnteredCount] = useState(0);
  const [exitedCount, setExitedCount] = useState(0);
  const [isManualOpen, setIsManualOpen] = useState(false);

  const handleScanSuccess = (student: any) => {
    const scanData = {
      ...student,
      action: scanMode,
      time: new Date().toLocaleTimeString()
    };
    
    setScannedStudents(prev => [...prev, scanData]);
    
    if (scanMode === 'in') {
      setEnteredCount(prev => prev + 1);
    } else {
      setExitedCount(prev => prev + 1);
    }
  };

  const currentInSchool = enteredCount - exitedCount;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'لوحة تسجيل الحضور المدرسي' : 'School Attendance Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'مسح مستمر لتسجيل حضور الطلاب' : 'Continuous scanning for student attendance'}
          </p>
        </div>
        <Button onClick={() => setIsManualOpen(true)} size="lg">
          <UserPlus className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'تسجيل يدوي' : 'Manual Entry'}
        </Button>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3">
        <Button
          onClick={() => setScanMode('in')}
          variant={scanMode === 'in' ? 'default' : 'outline'}
          size="lg"
          className="flex-1"
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'دخول' : 'Entry'}
        </Button>
        <Button
          onClick={() => setScanMode('out')}
          variant={scanMode === 'out' ? 'default' : 'outline'}
          size="lg"
          className="flex-1"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'خروج' : 'Exit'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'في المدرسة' : 'In School'}
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentInSchool}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'دخول اليوم' : 'Entered Today'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{enteredCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'خروج اليوم' : 'Exited Today'}
            </CardTitle>
            <ArrowLeft className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{exitedCount}</div>
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
            <Badge variant={scanMode === 'in' ? 'default' : 'outline'}>
              {scanMode === 'in' 
                ? (language === 'ar' ? 'دخول' : 'Entry')
                : (language === 'ar' ? 'خروج' : 'Exit')
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
            scanType={scanMode === 'in' ? 'attendance_in' : 'attendance_out'}
            location={scanMode === 'in' ? 'Main Entrance - Entry' : 'Main Entrance - Exit'}
            onScanSuccess={handleScanSuccess}
          />
        </div>

        {/* Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {language === 'ar' ? 'سجل اليوم' : "Today's Log"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {scannedStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{language === 'ar' ? 'في انتظار المسح...' : 'Waiting for scans...'}</p>
                  <p className="text-sm mt-2">{language === 'ar' ? 'اضغط "بدء المسح" للبدء' : 'Press "Start Scanning" to begin'}</p>
                </div>
              ) : (
                scannedStudents.slice().reverse().map((student, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 rounded-lg border animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      student.action === 'in' 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-orange-500/5 border-orange-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {student.action === 'in' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowLeft className="h-5 w-5 text-orange-500" />
                      )}
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.action === 'in'
                            ? (language === 'ar' ? 'دخول' : 'Entered')
                            : (language === 'ar' ? 'خروج' : 'Exited')
                          }
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={student.action === 'in' ? 'text-green-500 border-green-500' : 'text-orange-500 border-orange-500'}
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
        scanType={scanMode === 'in' ? 'attendance_in' : 'attendance_out'}
        location="Main Entrance"
        onSuccess={handleScanSuccess}
      />
    </div>
  );
}