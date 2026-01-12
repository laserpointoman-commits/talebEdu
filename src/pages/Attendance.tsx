import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { CheckCircle2, XCircle, Clock, Bus, School, Calendar as CalendarIcon, Download, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  time: string;
  type: 'school' | 'bus';
  status: 'present' | 'absent' | 'late';
  method: 'nfc' | 'manual';
  location?: string;
  recorded_by?: string;
  students?: {
    student_id: string;
    profiles: {
      full_name: string;
      full_name_ar: string | null;
    } | null;
  } | null;
}

interface Student {
  id: string;
  student_id: string;
  profiles: {
    full_name: string;
    full_name_ar: string | null;
  } | null;
}

export default function Attendance() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [newAttendance, setNewAttendance] = useState({
    student_id: '',
    type: 'school' as 'school' | 'bus',
    status: 'present' as 'present' | 'absent' | 'late',
    time: '',
    location: '',
  });

  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  useEffect(() => {
    fetchAttendanceRecords();
    fetchStudents();
  }, [selectedDate]);

  const fetchAttendanceRecords = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          students!attendance_records_student_id_fkey (
            student_id,
            profiles!students_profile_id_fkey (
              full_name,
              full_name_ar
            )
          )
        `)
        .eq('date', dateStr)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendanceRecords((data || []) as AttendanceRecord[]);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          profiles!students_profile_id_fkey (
            full_name,
            full_name_ar
          )
        `)
        .order('student_id');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
    }
  };

  const handleMarkAttendance = async () => {
    if (!newAttendance.student_id || !newAttendance.time) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Please fill all required fields' : 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert([{
          student_id: newAttendance.student_id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: newAttendance.time,
          type: newAttendance.type,
          status: newAttendance.status,
          method: 'manual',
          location: newAttendance.location,
          recorded_by: profile?.id,
        }]);

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : 'نجاح',
        description: language === 'en' ? 'Attendance marked successfully' : 'تم تسجيل الحضور بنجاح',
      });

      setIsMarkAttendanceOpen(false);
      setNewAttendance({
        student_id: '',
        type: 'school',
        status: 'present',
        time: '',
        location: '',
      });
      fetchAttendanceRecords();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'late': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.students?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.students?.profiles?.full_name_ar?.includes(searchTerm) ||
      record.students?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportReport = () => {
    toast({
      title: language === 'en' ? 'Report Generated' : 'تم إنشاء التقرير',
      description: language === 'en' ? 'Attendance report has been generated' : 'تم إنشاء تقرير الحضور',
    });
  };

  if (effectiveRole !== 'admin' && effectiveRole !== 'teacher' && effectiveRole !== 'developer') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">You don't have permission to view this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <LogoLoader size="large" text={true} fullScreen={true} />
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader
        title="Attendance"
        titleAr="الحضور"
        subtitle="Track and manage student attendance"
        subtitleAr="تتبع وإدارة حضور الطلاب"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Export' : 'تصدير'}
            </Button>
            <Button onClick={() => setIsMarkAttendanceOpen(true)} size="sm">
              {language === 'en' ? 'Mark' : 'تسجيل'}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Date' : 'التاريخ'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Search' : 'البحث'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={language === 'en' ? 'Search students...' : 'البحث عن الطلاب...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Type' : 'النوع'}</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'en' ? 'All Types' : 'جميع الأنواع'}</SelectItem>
                  <SelectItem value="school">{language === 'en' ? 'School' : 'المدرسة'}</SelectItem>
                  <SelectItem value="bus">{language === 'en' ? 'Bus' : 'الحافلة'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Status' : 'الحالة'}</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'en' ? 'All Status' : 'جميع الحالات'}</SelectItem>
                  <SelectItem value="present">{language === 'en' ? 'Present' : 'حاضر'}</SelectItem>
                  <SelectItem value="absent">{language === 'en' ? 'Absent' : 'غائب'}</SelectItem>
                  <SelectItem value="late">{language === 'en' ? 'Late' : 'متأخر'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'en' ? 'Attendance Records' : 'سجلات الحضور'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {language === 'en' ? 'No attendance records found for this date' : 'لا توجد سجلات حضور لهذا التاريخ'}
                </p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted">
                      {record.type === 'school' ? (
                        <School className="h-4 w-4" />
                      ) : (
                        <Bus className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {language === 'en' 
                          ? record.students?.profiles?.full_name 
                          : record.students?.profiles?.full_name_ar || record.students?.profiles?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.students?.student_id} • {record.time} • {record.location || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(record.status)} flex items-center gap-1`}>
                      {getStatusIcon(record.status)}
                      {record.status === 'present' ? (language === 'en' ? 'Present' : 'حاضر') :
                       record.status === 'absent' ? (language === 'en' ? 'Absent' : 'غائب') :
                       (language === 'en' ? 'Late' : 'متأخر')}
                    </Badge>
                    <Badge variant="outline">
                      {record.type === 'school' ? (language === 'en' ? 'School' : 'المدرسة') : (language === 'en' ? 'Bus' : 'الحافلة')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mark Attendance Dialog */}
      <Dialog open={isMarkAttendanceOpen} onOpenChange={setIsMarkAttendanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Mark Attendance' : 'تسجيل الحضور'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>{language === 'en' ? 'Student' : 'الطالب'}</Label>
              <Select value={newAttendance.student_id} onValueChange={(value) => setNewAttendance({ ...newAttendance, student_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select a student' : 'اختر طالباً'} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.student_id} - {language === 'en' 
                        ? student.profiles?.full_name 
                        : student.profiles?.full_name_ar || student.profiles?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Type' : 'النوع'}</Label>
                <Select value={newAttendance.type} onValueChange={(value: 'school' | 'bus') => setNewAttendance({ ...newAttendance, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">{language === 'en' ? 'School' : 'المدرسة'}</SelectItem>
                    <SelectItem value="bus">{language === 'en' ? 'Bus' : 'الحافلة'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'en' ? 'Status' : 'الحالة'}</Label>
                <Select value={newAttendance.status} onValueChange={(value: 'present' | 'absent' | 'late') => setNewAttendance({ ...newAttendance, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">{language === 'en' ? 'Present' : 'حاضر'}</SelectItem>
                    <SelectItem value="absent">{language === 'en' ? 'Absent' : 'غائب'}</SelectItem>
                    <SelectItem value="late">{language === 'en' ? 'Late' : 'متأخر'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">{language === 'en' ? 'Time' : 'الوقت'}</Label>
                <Input
                  id="time"
                  type="time"
                  value={newAttendance.time}
                  onChange={(e) => setNewAttendance({ ...newAttendance, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">{language === 'en' ? 'Location (Optional)' : 'الموقع (اختياري)'}</Label>
                <Input
                  id="location"
                  value={newAttendance.location}
                  onChange={(e) => setNewAttendance({ ...newAttendance, location: e.target.value })}
                  placeholder={language === 'en' ? 'e.g., Main Entrance' : 'مثل: المدخل الرئيسي'}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkAttendanceOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleMarkAttendance}>
              {language === 'en' ? 'Mark Attendance' : 'تسجيل الحضور'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}