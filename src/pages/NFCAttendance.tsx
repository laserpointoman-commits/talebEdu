import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NFCScanner from "@/components/nfc/NFCScanner";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

export default function NFCAttendance() {
  const { language } = useLanguage();
  const [scannedStudents, setScannedStudents] = useState<any[]>([]);

  const handleScanSuccess = (student: any) => {
    setScannedStudents(prev => [...prev, {
      ...student,
      time: new Date().toLocaleTimeString()
    }]);
  };

  const stats = {
    total: 35,
    present: scannedStudents.length,
    absent: 35 - scannedStudents.length
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'تسجيل الحضور' : 'Attendance Registration'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'مسح السوار الذكي لتسجيل الحضور' : 'Scan NFC wristband to mark attendance'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الطلاب' : 'Total Students'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <p className="text-xs text-muted-foreground">
              {((stats.present / stats.total) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الغياب' : 'Absent'}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.absent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner and List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NFC Scanner */}
        <div>
          <NFCScanner 
            scanType="attendance_in"
            location="Classroom 10-A"
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
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {scannedStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{language === 'ar' ? 'لم يتم تسجيل أي حضور بعد' : 'No attendance recorded yet'}</p>
                </div>
              ) : (
                scannedStudents.map((student, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-green-500/5 border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'ar' ? `الصف: ${student.class}` : `Class: ${student.class}`}
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