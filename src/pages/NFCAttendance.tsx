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
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'تسجيل الحضور' : language === 'hi' ? 'उपस्थिति पंजीकरण' : 'Attendance Registration'}
            </h1>
            <p className="text-green-100 text-sm">
              {language === 'ar' ? 'مسح السوار الذكي لتسجيل الحضور' : language === 'hi' ? 'उपस्थिति दर्ज करने के लिए NFC रिस्टबैंड स्कैन करें' : 'Scan NFC wristband to mark attendance'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الطلاب' : language === 'hi' ? 'कुल छात्र' : 'Total Students'}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الحضور' : language === 'hi' ? 'उपस्थित' : 'Present'}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400/20 to-green-600/20 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.present}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.present / stats.total) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الغياب' : language === 'hi' ? 'अनुपस्थित' : 'Absent'}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-400/20 to-red-600/20 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
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
        <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-green-500" />
              </div>
              {language === 'ar' ? 'سجل اليوم' : language === 'hi' ? 'आज का लॉग' : "Today's Log"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {scannedStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{language === 'ar' ? 'لم يتم تسجيل أي حضور بعد' : language === 'hi' ? 'अभी तक कोई उपस्थिति दर्ज नहीं' : 'No attendance recorded yet'}</p>
                </div>
              ) : (
                scannedStudents.map((student, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-green-500/5 border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'ar' ? `الصف: ${student.class}` : language === 'hi' ? `कक्षा: ${student.class}` : `Class: ${student.class}`}
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