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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Clock, Bus, School, Calendar as CalendarIcon, Download, Search, Users, UserCheck, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
        title: getText('Error', 'خطأ', 'त्रुटि'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
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
        title: getText('Error', 'خطأ', 'त्रुटि'),
        description: getText('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة', 'कृपया सभी आवश्यक फ़ील्ड भरें'),
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
        title: getText('Success', 'نجاح', 'सफलता'),
        description: getText('Attendance marked successfully', 'تم تسجيل الحضور بنجاح', 'उपस्थिति सफलतापूर्वक दर्ज की गई'),
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
        title: getText('Error', 'خطأ', 'त्रुटि'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
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
      title: getText('Report Generated', 'تم إنشاء التقرير', 'रिपोर्ट बनाई गई'),
      description: getText('Attendance report has been generated', 'تم إنشاء تقرير الحضور', 'उपस्थिति रिपोर्ट बनाई गई'),
    });
  };

  // Calculate stats
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;

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
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-primary to-sky-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserCheck className="h-6 w-6" />
              </div>
              {getText('Attendance', 'الحضور', 'उपस्थिति')}
            </h1>
            <p className="text-white/80 mt-1">
              {getText('Track and manage student attendance', 'تتبع وإدارة حضور الطلاب', 'छात्र उपस्थिति ट्रैक और प्रबंधित करें')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportReport} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Download className="h-4 w-4 mr-2" />
              {getText('Export', 'تصدير', 'निर्यात')}
            </Button>
            <Button onClick={() => setIsMarkAttendanceOpen(true)} size="sm" className="bg-white text-primary hover:bg-white/90">
              {getText('Mark Attendance', 'تسجيل الحضور', 'उपस्थिति दर्ज करें')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-sky-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{getText('Total', 'الإجمالي', 'कुल')}</p>
                  <p className="text-2xl font-bold">{filteredRecords.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-sky-500/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{getText('Present', 'حاضر', 'उपस्थित')}</p>
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{getText('Absent', 'غائب', 'अनुपस्थित')}</p>
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{getText('Late', 'متأخر', 'देर से')}</p>
                  <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-sky-500 to-primary" />
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <Label>{getText('Date', 'التاريخ', 'तारीख')}</Label>
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
            <div className="space-y-2 md:col-span-2">
              <Label>{getText('Search', 'البحث', 'खोजें')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={getText('Search students...', 'البحث عن الطلاب...', 'छात्रों को खोजें...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{getText('Type', 'النوع', 'प्रकार')}</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getText('All Types', 'جميع الأنواع', 'सभी प्रकार')}</SelectItem>
                  <SelectItem value="school">{getText('School', 'المدرسة', 'स्कूल')}</SelectItem>
                  <SelectItem value="bus">{getText('Bus', 'الحافلة', 'बस')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{getText('Status', 'الحالة', 'स्थिति')}</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getText('All Status', 'جميع الحالات', 'सभी स्थिति')}</SelectItem>
                  <SelectItem value="present">{getText('Present', 'حاضر', 'उपस्थित')}</SelectItem>
                  <SelectItem value="absent">{getText('Absent', 'غائب', 'अनुपस्थित')}</SelectItem>
                  <SelectItem value="late">{getText('Late', 'متأخر', 'देर से')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-sky-400 via-primary to-sky-600" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {getText('Attendance Records', 'سجلات الحضور', 'उपस्थिति रिकॉर्ड')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {getText('No attendance records found for this date', 'لا توجد سجلات حضور لهذا التاريخ', 'इस तारीख के लिए कोई उपस्थिति रिकॉर्ड नहीं मिला')}
                </p>
              </div>
            ) : (
              filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      record.type === 'school' 
                        ? 'bg-gradient-to-br from-primary/10 to-sky-500/10' 
                        : 'bg-gradient-to-br from-orange-500/10 to-amber-500/10'
                    )}>
                      {record.type === 'school' ? (
                        <School className="h-5 w-5 text-primary" />
                      ) : (
                        <Bus className="h-5 w-5 text-orange-500" />
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
                      {record.status === 'present' ? getText('Present', 'حاضر', 'उपस्थित') :
                       record.status === 'absent' ? getText('Absent', 'غائب', 'अनुपस्थित') :
                       getText('Late', 'متأخر', 'देर से')}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {record.type === 'school' ? getText('School', 'المدرسة', 'स्कूल') : getText('Bus', 'الحافلة', 'बस')}
                    </Badge>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mark Attendance Dialog */}
      <Dialog open={isMarkAttendanceOpen} onOpenChange={setIsMarkAttendanceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              {getText('Mark Attendance', 'تسجيل الحضور', 'उपस्थिति दर्ज करें')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>{getText('Student', 'الطالب', 'छात्र')}</Label>
              <Select value={newAttendance.student_id} onValueChange={(value) => setNewAttendance({ ...newAttendance, student_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={getText('Select a student', 'اختر طالباً', 'एक छात्र चुनें')} />
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
                <Label>{getText('Type', 'النوع', 'प्रकार')}</Label>
                <Select value={newAttendance.type} onValueChange={(value: 'school' | 'bus') => setNewAttendance({ ...newAttendance, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">{getText('School', 'المدرسة', 'स्कूल')}</SelectItem>
                    <SelectItem value="bus">{getText('Bus', 'الحافلة', 'बस')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{getText('Status', 'الحالة', 'स्थिति')}</Label>
                <Select value={newAttendance.status} onValueChange={(value: 'present' | 'absent' | 'late') => setNewAttendance({ ...newAttendance, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">{getText('Present', 'حاضر', 'उपस्थित')}</SelectItem>
                    <SelectItem value="absent">{getText('Absent', 'غائب', 'अनुपस्थित')}</SelectItem>
                    <SelectItem value="late">{getText('Late', 'متأخر', 'देर से')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{getText('Time', 'الوقت', 'समय')}</Label>
                <Input
                  type="time"
                  value={newAttendance.time}
                  onChange={(e) => setNewAttendance({ ...newAttendance, time: e.target.value })}
                />
              </div>
              <div>
                <Label>{getText('Location', 'الموقع', 'स्थान')}</Label>
                <Input
                  placeholder={getText('e.g., Main Gate', 'مثال: البوابة الرئيسية', 'जैसे, मुख्य द्वार')}
                  value={newAttendance.location}
                  onChange={(e) => setNewAttendance({ ...newAttendance, location: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkAttendanceOpen(false)}>
              {getText('Cancel', 'إلغاء', 'रद्द करें')}
            </Button>
            <Button onClick={handleMarkAttendance} className="bg-gradient-to-r from-primary to-sky-500 hover:from-primary/90 hover:to-sky-500/90">
              {getText('Save', 'حفظ', 'सहेजें')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
