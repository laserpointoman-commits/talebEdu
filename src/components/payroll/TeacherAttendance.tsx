import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LogoLoader from '@/components/LogoLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Clock, Calendar, UserCheck, UserX, Edit, Wifi, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TeacherAttendance() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [attendance, setAttendance] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    status: 'present',
    check_in_time: '',
    check_out_time: '',
    notes: ''
  });
  const [nfcCode, setNfcCode] = useState('');
  const [isNfcMode, setIsNfcMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      // Fetch teachers
      const { data: teachersData } = await supabase
        .from('teachers')
        .select(`
          *,
          profile:profiles!teachers_profile_id_fkey(*)
        `);

      // Fetch attendance for selected date
      const { data: attendanceData } = await supabase
        .from('teacher_attendance')
        .select(`
          *,
          teacher:teachers!teacher_attendance_teacher_id_fkey(
            *,
            profile:profiles!teachers_profile_id_fkey(*)
          )
        `)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'));

      setTeachers(teachersData || []);
      setAttendance(attendanceData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('error'),
        description: t('Failed to load attendance data'),
        variant: 'destructive'
      });
    }
  };

  const markAttendance = async () => {
    if (!selectedTeacher) return;

    setLoading(true);
    try {
      const attendanceDate = format(selectedDate, 'yyyy-MM-dd');
      const existingAttendance = attendance.find(
        a => a.teacher_id === selectedTeacher.id && a.date === attendanceDate
      );

      let checkIn = null, checkOut = null, totalHours = null;
      
      if (attendanceForm.check_in_time) {
        checkIn = `${attendanceDate}T${attendanceForm.check_in_time}:00`;
      }
      if (attendanceForm.check_out_time) {
        checkOut = `${attendanceDate}T${attendanceForm.check_out_time}:00`;
      }
      
      if (checkIn && checkOut) {
        const inTime = new Date(checkIn);
        const outTime = new Date(checkOut);
        totalHours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
      }

      const data = {
        teacher_id: selectedTeacher.id,
        date: attendanceDate,
        status: attendanceForm.status,
        check_in_time: checkIn,
        check_out_time: checkOut,
        total_hours: totalHours,
        check_in_method: 'manual',
        notes: attendanceForm.notes
      };

      if (existingAttendance) {
        await supabase
          .from('teacher_attendance')
          .update(data)
          .eq('id', existingAttendance.id);
      } else {
        await supabase
          .from('teacher_attendance')
          .insert(data);
      }

      toast({
        title: t('Success'),
        description: t('Attendance marked successfully')
      });
      
      setShowMarkDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: t('error'),
        description: t('Failed to mark attendance'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openMarkDialog = (teacher: any) => {
    setSelectedTeacher(teacher);
    const existingAttendance = attendance.find(a => a.teacher_id === teacher.id);
    
    if (existingAttendance) {
      setAttendanceForm({
        status: existingAttendance.status,
        check_in_time: existingAttendance.check_in_time 
          ? format(new Date(existingAttendance.check_in_time), 'HH:mm')
          : '',
        check_out_time: existingAttendance.check_out_time
          ? format(new Date(existingAttendance.check_out_time), 'HH:mm')
          : '',
        notes: existingAttendance.notes || ''
      });
    } else {
      setAttendanceForm({
        status: 'present',
        check_in_time: '',
        check_out_time: '',
        notes: ''
      });
    }
    
    setShowMarkDialog(true);
  };

  const handleNfcAttendance = async () => {
    if (!nfcCode.trim()) {
      toast({
        title: t('error'),
        description: language === 'en' ? 'Please enter NFC code' : 'يرجى إدخال رمز NFC',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Find teacher by NFC code
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*, profiles(*)')
        .eq('nfc_id', nfcCode.trim())
        .single();

      if (teacherError || !teacher) {
        toast({
          title: t('error'),
          description: language === 'en' ? 'Invalid NFC code' : 'رمز NFC غير صالح',
          variant: 'destructive'
        });
        return;
      }

      // Check if already marked attendance today
      const { data: existingAttendance } = await supabase
        .from('teacher_attendance')
        .select('*')
        .eq('teacher_id', teacher.id)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .single();

      const now = new Date();
      const timeString = format(now, 'HH:mm:ss');

      if (existingAttendance) {
        // Update check-out time
        await supabase
          .from('teacher_attendance')
          .update({
            check_out_time: now.toISOString(),
            total_hours: existingAttendance.check_in_time 
              ? parseFloat(((now.getTime() - new Date(existingAttendance.check_in_time).getTime()) / (1000 * 60 * 60)).toFixed(2))
              : 0,
            updated_at: now.toISOString()
          })
          .eq('id', existingAttendance.id);

        toast({
          title: t('Success'),
          description: `${language === 'en' ? 'Check-out recorded for' : 'تم تسجيل الخروج لـ'} ${teacher.profiles?.full_name}`,
        });
      } else {
        // Mark check-in
        const status = now.getHours() > 8 ? 'late' : 'present';
        
        await supabase
          .from('teacher_attendance')
          .insert({
            teacher_id: teacher.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            status,
            check_in_time: now.toISOString(),
            check_in_method: 'nfc',
            location: 'School Entrance'
          });

        toast({
          title: t('Success'),
          description: `${language === 'en' ? 'Check-in recorded for' : 'تم تسجيل الحضور لـ'} ${teacher.profiles?.full_name}`,
        });
      }

      setNfcCode('');
      fetchData();
    } catch (error) {
      console.error('Error processing NFC attendance:', error);
      toast({
        title: t('error'),
        description: t('Failed to process attendance'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      present: 'success',
      absent: 'destructive',
      late: 'warning',
      'half-day': 'secondary',
      vacation: 'outline',
      'sick-leave': 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{t(status)}</Badge>;
  };

  const getAttendanceSummary = () => {
    const present = attendance.filter(a => ['present', 'late'].includes(a.status)).length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const leave = attendance.filter(a => ['vacation', 'sick-leave'].includes(a.status)).length;
    
    return { present, absent, leave, total: teachers.length };
  };

  const summary = getAttendanceSummary();

  return (
    <div className="space-y-6">
      {/* NFC Attendance Tab */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">
            {language === 'en' ? 'Manual Attendance' : 'الحضور اليدوي'}
          </TabsTrigger>
          <TabsTrigger value="nfc">
            <Wifi className="mr-2 h-4 w-4" />
            {language === 'en' ? 'NFC Attendance' : 'الحضور بـ NFC'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nfc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {language === 'en' ? 'Quick NFC Attendance' : 'الحضور السريع بـ NFC'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={language === 'en' ? 'Scan or enter NFC code...' : 'امسح أو أدخل رمز NFC...'}
                    value={nfcCode}
                    onChange={(e) => setNfcCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleNfcAttendance();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleNfcAttendance} 
                    disabled={loading}
                    className="min-w-[120px]"
                  >
                    {loading ? (
                      <div className="inline-flex">
                        <LogoLoader size="small" text={false} />
                      </div>
                    ) : (
                      <>
                        <Wifi className="mr-2 h-4 w-4" />
                        {language === 'en' ? 'Check In/Out' : 'تسجيل دخول/خروج'}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Place the NFC card near the reader or type the NFC code manually' 
                    : 'ضع بطاقة NFC بالقرب من القارئ أو اكتب رمز NFC يدويًا'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          {/* Date Selector and Summary */}
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex gap-4 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Present')}</p>
                  <p className="text-xl font-bold">{summary.present}/{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Absent')}</p>
                  <p className="text-xl font-bold">{summary.absent}/{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('On Leave')}</p>
                  <p className="text-xl font-bold">{summary.leave}/{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Teacher Attendance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Teacher')}</TableHead>
                <TableHead>{t('Employee ID')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Check In')}</TableHead>
                <TableHead>{t('Check Out')}</TableHead>
                <TableHead>{t('Total Hours')}</TableHead>
                <TableHead>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => {
                const record = attendance.find(a => a.teacher_id === teacher.id);
                return (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.profile?.full_name}</TableCell>
                    <TableCell>{teacher.employee_id}</TableCell>
                    <TableCell>
                      {record ? getStatusBadge(record.status) : <Badge variant="outline">{t('Not Marked')}</Badge>}
                    </TableCell>
                    <TableCell>
                      {record?.check_in_time 
                        ? format(new Date(record.check_in_time), 'HH:mm')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {record?.check_out_time 
                        ? format(new Date(record.check_out_time), 'HH:mm')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {record?.total_hours 
                        ? `${record.total_hours.toFixed(2)} hrs`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMarkDialog(teacher)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {record ? t('Edit') : t('Mark')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mark Attendance Dialog */}
      <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Mark Attendance')}</DialogTitle>
            <DialogDescription>
              {t('Mark attendance for')} {selectedTeacher?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('Status')}</Label>
              <Select
                value={attendanceForm.status}
                onValueChange={(value) => setAttendanceForm({...attendanceForm, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">{t('Present')}</SelectItem>
                  <SelectItem value="absent">{t('Absent')}</SelectItem>
                  <SelectItem value="late">{t('Late')}</SelectItem>
                  <SelectItem value="half-day">{t('Half Day')}</SelectItem>
                  <SelectItem value="vacation">{t('Vacation')}</SelectItem>
                  <SelectItem value="sick-leave">{t('Sick Leave')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('Check In Time')}</Label>
              <Input
                type="time"
                value={attendanceForm.check_in_time}
                onChange={(e) => setAttendanceForm({...attendanceForm, check_in_time: e.target.value})}
              />
            </div>
            <div>
              <Label>{t('Check Out Time')}</Label>
              <Input
                type="time"
                value={attendanceForm.check_out_time}
                onChange={(e) => setAttendanceForm({...attendanceForm, check_out_time: e.target.value})}
              />
            </div>
            <div>
              <Label>{t('Notes')}</Label>
              <Input
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                placeholder={t('Optional notes')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={markAttendance} disabled={loading}>
              {loading ? t('Saving...') : t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TabsContent>
    </Tabs>
    </div>
  );
}