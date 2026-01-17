import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/hooks/use-toast';
import LogoLoader from '@/components/LogoLoader';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  User, 
  MapPin,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  room: string | null;
}

interface Teacher {
  id: string;
  employee_id: string;
  profiles: {
    full_name: string;
    full_name_ar: string | null;
  } | null;
}

interface ScheduleEntry {
  id: string;
  class_id: string;
  day: string;
  time: string;
  subject: string;
  teacher_id: string | null;
  room: string | null;
  classes?: ClassInfo;
  teachers?: Teacher;
}

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const WORK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const DEFAULT_TIME_SLOTS = [
  '07:00', '07:30', '07:45', '08:00', '08:30', '09:00', '09:15', '09:30',
  '10:00', '10:30', '11:00', '11:15', '11:30', '12:00', '12:30', '12:45',
  '13:00', '13:30', '14:00', '14:15', '14:30'
];

export default function WeeklyScheduleManager() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);
  const [conflicts, setConflicts] = useState<{ type: 'teacher' | 'room'; details: ScheduleEntry }[]>([]);
  const [pendingAction, setPendingAction] = useState<'add' | 'update' | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    class_id: '',
    day: '',
    time: '',
    subject: '',
    teacher_id: '',
    room: '',
  });

  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  // Dynamically extract unique time slots from schedules
  const timeSlots = useMemo(() => {
    const scheduleTimes = schedules.map(s => s.time);
    const allTimes = [...new Set([...DEFAULT_TIME_SLOTS, ...scheduleTimes])];
    // Sort times chronologically
    return allTimes.sort((a, b) => {
      const timeA = a.split(' - ')[0] || a;
      const timeB = b.split(' - ')[0] || b;
      return timeA.localeCompare(timeB);
    });
  }, [schedules]);

  // Extract unique subjects from schedules
  const subjects = useMemo(() => {
    const defaultSubjects = [
      'Mathematics', 'Arabic', 'English', 'Science', 'Islamic Studies',
      'Social Studies', 'Physical Education', 'Art', 'Music', 'Computer Science',
      'Physics', 'Chemistry', 'Biology', 'History', 'Geography',
      'رياضيات', 'اللغة العربية', 'اللغة الإنجليزية', 'العلوم', 'التربية الإسلامية',
      'الدراسات الاجتماعية', 'التربية الرياضية', 'الفنون', 'الموسيقى', 'الحاسوب'
    ];
    const scheduleSubjects = schedules.map(s => s.subject);
    return [...new Set([...defaultSubjects, ...scheduleSubjects])];
  }, [schedules]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all schedules with class and teacher info
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('class_schedules')
        .select(`
          *,
          classes (
            id,
            name,
            grade,
            section,
            room
          ),
          teachers (
            id,
            employee_id,
            profiles (
              full_name,
              full_name_ar
            )
          )
        `)
        .order('time', { ascending: true });

      if (schedulesError) throw schedulesError;
      setSchedules(schedulesData || []);

      // Fetch all classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, grade, section, room')
        .order('grade', { ascending: true });

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Fetch all teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select(`
          id,
          employee_id,
          profiles (
            full_name,
            full_name_ar
          )
        `)
        .order('created_at', { ascending: false });

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check for conflicts (teacher or room double-booking)
  const checkConflicts = useCallback((
    day: string, 
    time: string, 
    teacherId: string | null, 
    room: string | null,
    excludeId?: string
  ) => {
    const foundConflicts: { type: 'teacher' | 'room'; details: ScheduleEntry }[] = [];
    
    schedules.forEach(schedule => {
      // Skip the current schedule when editing
      if (excludeId && schedule.id === excludeId) return;
      
      // Check if same day and time
      if (schedule.day === day && schedule.time === time) {
        // Check teacher conflict
        if (teacherId && schedule.teacher_id === teacherId) {
          foundConflicts.push({ type: 'teacher', details: schedule });
        }
        // Check room conflict
        if (room && schedule.room && schedule.room.toLowerCase() === room.toLowerCase()) {
          foundConflicts.push({ type: 'room', details: schedule });
        }
      }
    });
    
    return foundConflicts;
  }, [schedules]);

  const handleAddSchedule = async (force = false) => {
    if (!formData.class_id || !formData.day || !formData.time || !formData.subject) {
      toast({
        title: language === 'en' ? 'Missing Fields' : language === 'hi' ? 'गुम फ़ील्ड' : 'حقول مفقودة',
        description: language === 'en' ? 'Please fill all required fields' : language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    // Check for conflicts if not forcing
    if (!force) {
      const foundConflicts = checkConflicts(
        formData.day, 
        formData.time, 
        formData.teacher_id || null, 
        formData.room || null
      );
      
      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setPendingAction('add');
        setIsConflictDialogOpen(true);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('class_schedules')
        .insert([{
          class_id: formData.class_id,
          day: formData.day,
          time: formData.time,
          subject: formData.subject,
          teacher_id: formData.teacher_id || null,
          room: formData.room || null,
        }]);

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Schedule entry added successfully' : language === 'hi' ? 'शेड्यूल प्रविष्टि सफलतापूर्वक जोड़ी गई' : 'تم إضافة الجدول بنجاح',
      });

      setIsAddDialogOpen(false);
      setIsConflictDialogOpen(false);
      setPendingAction(null);
      setConflicts([]);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSchedule = async (force = false) => {
    if (!selectedSchedule) return;

    // Check for conflicts if not forcing
    if (!force) {
      const foundConflicts = checkConflicts(
        formData.day, 
        formData.time, 
        formData.teacher_id || null, 
        formData.room || null,
        selectedSchedule.id
      );
      
      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setPendingAction('update');
        setIsConflictDialogOpen(true);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('class_schedules')
        .update({
          class_id: formData.class_id,
          day: formData.day,
          time: formData.time,
          subject: formData.subject,
          teacher_id: formData.teacher_id || null,
          room: formData.room || null,
        })
        .eq('id', selectedSchedule.id);

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Schedule updated successfully' : language === 'hi' ? 'शेड्यूल सफलतापूर्वक अपडेट किया गया' : 'تم تحديث الجدول بنجاح',
      });

      setIsEditDialogOpen(false);
      setIsConflictDialogOpen(false);
      setPendingAction(null);
      setConflicts([]);
      setSelectedSchedule(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleForceAction = () => {
    if (pendingAction === 'add') {
      handleAddSchedule(true);
    } else if (pendingAction === 'update') {
      handleUpdateSchedule(true);
    }
  };

  const cancelConflictAction = () => {
    setIsConflictDialogOpen(false);
    setConflicts([]);
    setPendingAction(null);
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    try {
      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', selectedSchedule.id);

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Schedule entry deleted' : language === 'hi' ? 'शेड्यूल प्रविष्टि हटाई गई' : 'تم حذف الجدول',
      });

      setIsDeleteDialogOpen(false);
      setSelectedSchedule(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (schedule: ScheduleEntry) => {
    setSelectedSchedule(schedule);
    setFormData({
      class_id: schedule.class_id,
      day: schedule.day,
      time: schedule.time,
      subject: schedule.subject,
      teacher_id: schedule.teacher_id || '',
      room: schedule.room || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (schedule: ScheduleEntry) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      class_id: '',
      day: '',
      time: '',
      subject: '',
      teacher_id: '',
      room: '',
    });
  };

  const filteredSchedules = selectedClass === 'all' 
    ? schedules 
    : schedules.filter(s => s.class_id === selectedClass);

  const getSchedulesByDayAndTime = (day: string, time: string) => {
    return filteredSchedules.filter(s => s.day === day && s.time === time);
  };

  // Get unique times from filtered schedules for grid display
  const gridTimeSlots = useMemo(() => {
    const times = [...new Set(filteredSchedules.map(s => s.time))];
    return times.sort((a, b) => {
      const timeA = a.split(' - ')[0] || a;
      const timeB = b.split(' - ')[0] || b;
      return timeA.localeCompare(timeB);
    });
  }, [filteredSchedules]);

  const exportSchedule = () => {
    const headers = ['Day', 'Time', 'Class', 'Subject', 'Teacher', 'Room'];
    const rows = filteredSchedules.map(s => [
      s.day,
      s.time,
      s.classes ? `${s.classes.grade}-${s.classes.section}` : '',
      s.subject,
      s.teachers?.profiles?.full_name || '',
      s.room || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `weekly_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: language === 'en' ? 'Exported' : language === 'hi' ? 'निर्यात किया गया' : 'تم التصدير',
      description: language === 'en' ? 'Schedule exported successfully' : language === 'hi' ? 'शेड्यूल सफलतापूर्वक निर्यात किया गया' : 'تم تصدير الجدول بنجاح',
    });
  };

  const printSchedule = () => {
    const selectedClassName = selectedClass === 'all' 
      ? (language === 'en' ? 'All Classes' : language === 'hi' ? 'सभी कक्षाएं' : 'جميع الصفوف')
      : classes.find(c => c.id === selectedClass)?.name || '';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: language === 'en' ? 'Please allow popups' : language === 'hi' ? 'कृपया पॉपअप की अनुमति दें' : 'يرجى السماح بالنوافذ المنبثقة',
        variant: 'destructive',
      });
      return;
    }

    const getDayName = (day: string) => {
      const index = DAYS_EN.indexOf(day);
      return language === 'ar' ? DAYS_AR[index] : language === 'hi' ? DAYS_HI[index] : day;
    };

    const printContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${language === 'en' ? 'Weekly Schedule' : language === 'hi' ? 'साप्ताहिक शेड्यूल' : 'الجدول الأسبوعي'} - ${selectedClassName}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 9px;
            line-height: 1.3;
            color: #1a1a1a;
            background: white;
            direction: ${language === 'ar' ? 'rtl' : 'ltr'};
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #3b82f6;
          }
          .header h1 {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 4px;
          }
          .header .subtitle {
            font-size: 12px;
            color: #6b7280;
          }
          .header .date {
            font-size: 10px;
            color: #9ca3af;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 4px 3px;
            text-align: center;
            vertical-align: top;
          }
          th {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            font-weight: 600;
            font-size: 10px;
            padding: 8px 4px;
          }
          th:first-child {
            width: 60px;
          }
          .time-cell {
            background: #f8fafc;
            font-weight: 600;
            font-size: 8px;
            color: #475569;
          }
          .schedule-item {
            background: #eff6ff;
            border-radius: 4px;
            padding: 3px;
            margin: 1px;
            text-align: ${language === 'ar' ? 'right' : 'left'};
          }
          .schedule-item .subject {
            font-weight: 600;
            color: #1e40af;
            font-size: 8px;
            margin-bottom: 1px;
          }
          .schedule-item .class-name {
            font-size: 7px;
            color: #3b82f6;
            margin-bottom: 1px;
          }
          .schedule-item .teacher {
            font-size: 7px;
            color: #6b7280;
          }
          .schedule-item .room {
            font-size: 6px;
            color: #9ca3af;
          }
          .empty-cell {
            background: #fafafa;
          }
          .footer {
            margin-top: 12px;
            text-align: center;
            font-size: 8px;
            color: #9ca3af;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${language === 'en' ? 'Weekly Class Schedule' : language === 'hi' ? 'साप्ताहिक कक्षा शेड्यूल' : 'الجدول الأسبوعي للحصص'}</h1>
          <div class="subtitle">${selectedClassName}</div>
          <div class="date">${new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>${language === 'en' ? 'Time' : language === 'hi' ? 'समय' : 'الوقت'}</th>
              ${WORK_DAYS.map(day => `<th>${getDayName(day)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${gridTimeSlots.map(time => `
              <tr>
                <td class="time-cell">${time}</td>
                ${WORK_DAYS.map(day => {
                  const daySchedules = getSchedulesByDayAndTime(day, time);
                  if (daySchedules.length === 0) {
                    return '<td class="empty-cell"></td>';
                  }
                  return `<td>${daySchedules.map(s => `
                    <div class="schedule-item">
                      <div class="subject">${s.subject}</div>
                      <div class="class-name">${s.classes?.name || `${s.classes?.grade}-${s.classes?.section}`}</div>
                      ${s.teachers?.profiles?.full_name ? `<div class="teacher">${language === 'ar' && s.teachers?.profiles?.full_name_ar ? s.teachers.profiles.full_name_ar : s.teachers.profiles.full_name}</div>` : ''}
                      ${s.room ? `<div class="room">${s.room}</div>` : ''}
                    </div>
                  `).join('')}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          ${language === 'en' ? 'Generated by talebEdu School Management System' : language === 'hi' ? 'talebEdu स्कूल मैनेजमेंट सिस्टम द्वारा जनरेट' : 'تم إنشاؤه بواسطة نظام إدارة المدرسة talebEdu'}
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (effectiveRole !== 'admin' && effectiveRole !== 'developer') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">
          {language === 'en' ? "You don't have permission to view this page" : language === 'hi' ? 'आपको इस पृष्ठ को देखने की अनुमति नहीं है' : 'ليس لديك إذن لعرض هذه الصفحة'}
        </p>
      </div>
    );
  }

  if (loading) {
    return <LogoLoader size="large" text={true} fullScreen={true} />;
  }

  const ScheduleForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'en' ? 'Class' : language === 'hi' ? 'कक्षा' : 'الصف'} *</Label>
          <Select value={formData.class_id} onValueChange={(v) => setFormData(prev => ({ ...prev, class_id: v }))}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'en' ? 'Select class' : language === 'hi' ? 'कक्षा चुनें' : 'اختر الصف'} />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.grade}-{c.section})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{language === 'en' ? 'Day' : language === 'hi' ? 'दिन' : 'اليوم'} *</Label>
          <Select value={formData.day} onValueChange={(v) => setFormData(prev => ({ ...prev, day: v }))}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'en' ? 'Select day' : language === 'hi' ? 'दिन चुनें' : 'اختر اليوم'} />
            </SelectTrigger>
            <SelectContent>
              {WORK_DAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {language === 'en' ? day : language === 'hi' ? DAYS_HI[DAYS_EN.indexOf(day)] : DAYS_AR[DAYS_EN.indexOf(day)]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'en' ? 'Time' : language === 'hi' ? 'समय' : 'الوقت'} *</Label>
          <Input
            type="text"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            placeholder={language === 'en' ? 'e.g., 08:30 or 08:30 - 09:15' : language === 'hi' ? 'जैसे, 08:30' : 'مثال: 08:30'}
            list="time-suggestions"
          />
          <datalist id="time-suggestions">
            {timeSlots.map(time => (
              <option key={time} value={time} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label>{language === 'en' ? 'Subject' : language === 'hi' ? 'विषय' : 'المادة'} *</Label>
          <Input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder={language === 'en' ? 'Enter subject name' : language === 'hi' ? 'विषय का नाम दर्ज करें' : 'أدخل اسم المادة'}
            list="subject-suggestions"
          />
          <datalist id="subject-suggestions">
            {subjects.map(subject => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'en' ? 'Teacher' : language === 'hi' ? 'शिक्षक' : 'المعلم'}</Label>
          <Select 
            value={formData.teacher_id || 'none'} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, teacher_id: v === 'none' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'en' ? 'Select teacher' : language === 'hi' ? 'शिक्षक चुनें' : 'اختر المعلم'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {language === 'en' ? 'No teacher assigned' : language === 'hi' ? 'कोई शिक्षक नियुक्त नहीं' : 'لم يتم تعيين معلم'}
              </SelectItem>
              {teachers.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {language === 'ar' && t.profiles?.full_name_ar 
                    ? t.profiles.full_name_ar 
                    : t.profiles?.full_name || t.employee_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{language === 'en' ? 'Room' : language === 'hi' ? 'कमरा' : 'الغرفة'}</Label>
          <Input
            value={formData.room}
            onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
            placeholder={language === 'en' ? 'e.g., Room 101' : language === 'hi' ? 'जैसे, कमरा 101' : 'مثال: غرفة 101'}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader
        title="Weekly Schedule"
        titleAr="الجدول الأسبوعي"
        titleHi="साप्ताहिक शेड्यूल"
        subtitle="View and manage class schedules across all classes"
        subtitleAr="عرض وإدارة جداول الحصص لجميع الصفوف"
        subtitleHi="सभी कक्षाओं के शेड्यूल देखें और प्रबंधित करें"
      />

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={language === 'en' ? 'Filter by class' : language === 'hi' ? 'कक्षा द्वारा फ़िल्टर करें' : 'تصفية حسب الصف'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'en' ? 'All Classes' : language === 'hi' ? 'सभी कक्षाएं' : 'جميع الصفوف'}
                </SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.grade}-{c.section})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
            <TabsList className="grid grid-cols-2 w-[160px]">
              <TabsTrigger value="grid">{language === 'en' ? 'Grid' : language === 'hi' ? 'ग्रिड' : 'شبكة'}</TabsTrigger>
              <TabsTrigger value="list">{language === 'en' ? 'List' : language === 'hi' ? 'सूची' : 'قائمة'}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Refresh' : language === 'hi' ? 'रिफ्रेश' : 'تحديث'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportSchedule}>
            <Download className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Export' : language === 'hi' ? 'निर्यात' : 'تصدير'}
          </Button>
          <Button variant="outline" size="sm" onClick={printSchedule}>
            <Printer className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Print A4' : language === 'hi' ? 'A4 प्रिंट' : 'طباعة A4'}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Schedule' : language === 'hi' ? 'शेड्यूल जोड़ें' : 'إضافة جدول'}
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <Card>
          <CardContent className="p-0">
            {gridTimeSlots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'en' ? 'No schedules found' : language === 'hi' ? 'कोई शेड्यूल नहीं मिला' : 'لم يتم العثور على جداول'}</p>
                <p className="text-sm mt-1">
                  {language === 'en' 
                    ? 'Add schedules from the Classes page or click "Add Schedule" above' 
                    : language === 'hi'
                    ? 'कक्षाएं पेज से शेड्यूल जोड़ें या ऊपर "शेड्यूल जोड़ें" क्लिक करें'
                    : 'أضف جداول من صفحة الصفوف أو اضغط "إضافة جدول" أعلاه'}
                </p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Add First Schedule' : language === 'hi' ? 'पहला शेड्यूल जोड़ें' : 'إضافة أول جدول'}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-3 text-left font-medium w-[120px]">
                        {language === 'en' ? 'Time' : language === 'hi' ? 'समय' : 'الوقت'}
                      </th>
                      {WORK_DAYS.map((day) => (
                        <th key={day} className="border p-3 text-center font-medium">
                          {language === 'en' ? day : language === 'hi' ? DAYS_HI[DAYS_EN.indexOf(day)] : DAYS_AR[DAYS_EN.indexOf(day)]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gridTimeSlots.map(time => (
                      <tr key={time}>
                        <td className="border p-2 font-medium text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </div>
                        </td>
                        {WORK_DAYS.map(day => {
                          const daySchedules = getSchedulesByDayAndTime(day, time);
                          return (
                            <td key={`${day}-${time}`} className="border p-1 align-top min-h-[80px]">
                              <div className="space-y-1">
                                {daySchedules.map(schedule => (
                                  <div
                                    key={schedule.id}
                                    className="group relative p-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer text-xs"
                                    onClick={() => openEditDialog(schedule)}
                                  >
                                    <div className="font-medium text-primary truncate">
                                      {schedule.subject}
                                    </div>
                                    <div className="text-muted-foreground truncate">
                                      {schedule.classes?.name || `${schedule.classes?.grade}-${schedule.classes?.section}`}
                                    </div>
                                    {schedule.teachers?.profiles?.full_name && (
                                      <div className="text-muted-foreground truncate flex items-center gap-1">
                                        <User className="h-2.5 w-2.5" />
                                        {schedule.teachers.profiles.full_name}
                                      </div>
                                    )}
                                    {schedule.room && (
                                      <div className="text-muted-foreground truncate flex items-center gap-1">
                                        <MapPin className="h-2.5 w-2.5" />
                                        {schedule.room}
                                      </div>
                                    )}
                                    
                                    {/* Quick actions on hover */}
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDeleteDialog(schedule);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {language === 'en' ? 'All Schedules' : 'جميع الجداول'}
              <Badge variant="secondary" className="ml-2">
                {filteredSchedules.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {WORK_DAYS.map(day => {
                  const daySchedules = filteredSchedules.filter(s => s.day === day);
                  if (daySchedules.length === 0) return null;

                  return (
                    <div key={day} className="space-y-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {language === 'en' ? day : DAYS_AR[DAYS_EN.indexOf(day)]}
                        <Badge variant="outline">{daySchedules.length}</Badge>
                      </h3>
                      <div className="grid gap-2 pl-6">
                        {daySchedules
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map(schedule => (
                            <div
                              key={schedule.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center min-w-[80px]">
                                  <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                                  <span className="text-xs font-medium">{schedule.time}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{schedule.subject}</span>
                                    <Badge variant="secondary">
                                      {schedule.classes?.name || `${schedule.classes?.grade}-${schedule.classes?.section}`}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                    {schedule.teachers?.profiles?.full_name && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {schedule.teachers.profiles.full_name}
                                      </span>
                                    )}
                                    {schedule.room && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {schedule.room}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openEditDialog(schedule)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openDeleteDialog(schedule)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}

                {filteredSchedules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'en' ? 'No schedules found' : 'لم يتم العثور على جداول'}</p>
                    <p className="text-sm mt-1">
                      {language === 'en' 
                        ? 'Add schedules from the Classes page or click "Add Schedule" above' 
                        : 'أضف جداول من صفحة الصفوف أو اضغط "إضافة جدول" أعلاه'}
                    </p>
                    <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Create First Schedule' : 'إنشاء أول جدول'}
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Add Schedule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add Schedule Entry' : 'إضافة جدول'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Create a new schedule entry for a class' 
                : 'إنشاء جدول جديد لصف'}
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={() => handleAddSchedule()}>
              {language === 'en' ? 'Add Schedule' : 'إضافة الجدول'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Schedule Entry' : 'تعديل الجدول'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Update the schedule entry details' 
                : 'تحديث تفاصيل الجدول'}
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); setSelectedSchedule(null); }}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={() => handleUpdateSchedule()}>
              {language === 'en' ? 'Save Changes' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Delete Schedule Entry' : 'حذف الجدول'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Are you sure you want to delete this schedule entry? This action cannot be undone.' 
                : 'هل أنت متأكد من حذف هذا الجدول؟ لا يمكن التراجع عن هذا الإجراء.'}
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="p-4 bg-muted rounded-lg">
              <p><strong>{language === 'en' ? 'Subject:' : 'المادة:'}</strong> {selectedSchedule.subject}</p>
              <p><strong>{language === 'en' ? 'Day:' : 'اليوم:'}</strong> {selectedSchedule.day}</p>
              <p><strong>{language === 'en' ? 'Time:' : 'الوقت:'}</strong> {selectedSchedule.time}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setSelectedSchedule(null); }}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button variant="destructive" onClick={handleDeleteSchedule}>
              {language === 'en' ? 'Delete' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Warning Dialog */}
      <Dialog open={isConflictDialogOpen} onOpenChange={(open) => { if (!open) cancelConflictAction(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {language === 'en' ? 'Schedule Conflict Detected' : 'تم اكتشاف تعارض في الجدول'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'The schedule you are trying to create conflicts with existing entries.' 
                : 'الجدول الذي تحاول إنشاءه يتعارض مع إدخالات موجودة.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {conflict.type === 'teacher' 
                    ? (language === 'en' ? 'Teacher Conflict' : 'تعارض المعلم')
                    : (language === 'en' ? 'Room Conflict' : 'تعارض الغرفة')}
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-1 text-sm">
                  {conflict.type === 'teacher' ? (
                    <p>
                      <strong>{conflict.details.teachers?.profiles?.full_name || language === 'en' ? 'Teacher' : 'المعلم'}</strong>
                      {' '}
                      {language === 'en' 
                        ? 'is already teaching at this time:' 
                        : 'يُدرّس بالفعل في هذا الوقت:'}
                    </p>
                  ) : (
                    <p>
                      <strong>{conflict.details.room}</strong>
                      {' '}
                      {language === 'en' 
                        ? 'is already in use at this time:' 
                        : 'مستخدمة بالفعل في هذا الوقت:'}
                    </p>
                  )}
                  <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                    <p><strong>{language === 'en' ? 'Class:' : 'الصف:'}</strong> {conflict.details.classes?.name || `${conflict.details.classes?.grade}-${conflict.details.classes?.section}`}</p>
                    <p><strong>{language === 'en' ? 'Subject:' : 'المادة:'}</strong> {conflict.details.subject}</p>
                    <p><strong>{language === 'en' ? 'Day:' : 'اليوم:'}</strong> {conflict.details.day}</p>
                    <p><strong>{language === 'en' ? 'Time:' : 'الوقت:'}</strong> {conflict.details.time}</p>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={cancelConflictAction} className="w-full sm:w-auto">
              {language === 'en' ? 'Go Back & Edit' : 'العودة والتعديل'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleForceAction}
              className="w-full sm:w-auto"
            >
              {language === 'en' ? 'Create Anyway' : 'إنشاء على أي حال'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
