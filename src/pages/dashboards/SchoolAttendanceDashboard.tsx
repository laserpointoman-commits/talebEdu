import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NFCScanner from "@/components/nfc/NFCScanner";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SchoolAttendanceDashboard() {
  const { language } = useLanguage();
  const [scannedStudents, setScannedStudents] = useState<any[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);

  const handleScanSuccess = (student: any) => {
    setScannedStudents(prev => [...prev, {
      ...student,
      time: new Date().toLocaleTimeString()
    }]);
    setTodayTotal(prev => prev + 1);
  };

  const stats = {
    total: todayTotal,
    present: scannedStudents.filter(s => s.type === 'attendance_in').length,
    absent: todayTotal - scannedStudents.length
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'لوحة تسجيل الحضور المدرسي' : 'School Attendance Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'مسح مستمر لتسجيل حضور الطلاب' : 'Continuous scanning for student attendance'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي المسح اليوم' : 'Total Scans Today'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTotal}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الحضور' : 'Present'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الحالة' : 'Status'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-green-500 border-green-500">
              {language === 'ar' ? 'نشط' : 'Active'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Scanner and List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NFC Scanner - Continuous Mode */}
        <div>
          <NFCScanner 
            scanType="attendance_in"
            location="Main Entrance"
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
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-green-500/5 border-green-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'ar' ? `الصف: ${student.class || 'غير محدد'}` : `Class: ${student.class || 'N/A'}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500">
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