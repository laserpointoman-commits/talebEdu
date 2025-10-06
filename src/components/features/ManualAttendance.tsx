import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface ManualAttendanceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanType: 'attendance_in' | 'attendance_out' | 'bus_in' | 'bus_out';
  location: string;
  onSuccess?: (student: any) => void;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
}

interface Student {
  id: string;
  student_id: string;
  profile_id: string;
  parent_id: string | null;
  class: string;
  profiles: {
    full_name: string;
    full_name_ar: string | null;
  } | null;
}

export default function ManualAttendance({ open, onOpenChange, scanType, location, onSuccess }: ManualAttendanceProps) {
  const { language } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClasses();
    }
  }, [open]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade, section')
        .order('grade', { ascending: true })
        .order('section', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل الفصول' : 'Failed to load classes');
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          profile_id,
          parent_id,
          class,
          profiles!students_profile_id_fkey (
            full_name,
            full_name_ar
          )
        `)
        .eq('class', classId)
        .order('student_id', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل الطلاب' : 'Failed to load students');
    }
  };

  const sendParentNotification = async (studentId: string, parentId: string | null, studentName: string) => {
    if (!parentId) return;

    try {
      const actionType = scanType.includes('in') ? 'entered' : 'left';
      const locationDesc = scanType.includes('bus') ? 'bus' : 'school';
      
      const notificationTitle = language === 'ar' 
        ? `${actionType === 'entered' ? 'دخول' : 'مغادرة'} ${studentName}`
        : `${studentName} ${actionType}`;
      
      const notificationMessage = language === 'ar'
        ? `${studentName} ${actionType === 'entered' ? 'دخل' : 'غادر'} ${locationDesc === 'bus' ? 'الحافلة' : 'المدرسة'} في ${location}`
        : `${studentName} has ${actionType} the ${locationDesc} at ${location}`;

      await supabase.from('notification_history').insert({
        user_id: parentId,
        notification_type: locationDesc === 'bus' ? 'child_bus_location' : 'child_attendance',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          student_id: studentId,
          action: actionType,
          location: location,
          timestamp: new Date().toISOString()
        }
      });

      console.log('Parent notification sent successfully');
    } catch (error) {
      console.error('Error sending parent notification:', error);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedStudent) {
      toast.error(language === 'ar' ? 'يرجى اختيار طالب' : 'Please select a student');
      return;
    }

    setLoading(true);
    try {
      const student = students.find(s => s.id === selectedStudent);
      if (!student) throw new Error('Student not found');

      const studentName = language === 'ar' 
        ? student.profiles?.full_name_ar || student.profiles?.full_name || ''
        : student.profiles?.full_name || '';

      // Record attendance in checkpoint_logs
      const { error: logError } = await supabase.from('checkpoint_logs').insert({
        student_id: student.id,
        student_name: studentName,
        nfc_id: student.student_id,
        type: scanType,
        location: location,
        timestamp: new Date().toISOString(),
        synced: true
      });

      if (logError) throw logError;

      // Send notification to parent
      await sendParentNotification(student.id, student.parent_id, studentName);

      toast.success(
        language === 'ar' 
          ? `✓ تم تسجيل حضور ${studentName}` 
          : `✓ Attendance marked for ${studentName}`
      );

      // Call success callback
      if (onSuccess) {
        onSuccess({
          id: student.id,
          name: studentName,
          class: selectedClass
        });
      }

      // Reset and close
      setSelectedClass('');
      setSelectedStudent('');
      setStudents([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error(language === 'ar' ? 'فشل في تسجيل الحضور' : 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {language === 'ar' ? 'تسجيل حضور يدوي' : 'Manual Attendance'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'الفصل' : 'Class'}</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر الفصل' : 'Select class'} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade} - {cls.section})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الطالب' : 'Student'}</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر الطالب' : 'Select student'} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.student_id} - {language === 'ar' 
                        ? student.profiles?.full_name_ar || student.profiles?.full_name
                        : student.profiles?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">{language === 'ar' ? 'الموقع: ' : 'Location: '}</span>
              {location}
            </p>
            <p className="text-sm mt-1">
              <span className="font-medium">{language === 'ar' ? 'النوع: ' : 'Type: '}</span>
              {scanType.includes('in') 
                ? (language === 'ar' ? 'دخول' : 'Entry')
                : (language === 'ar' ? 'خروج' : 'Exit')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleMarkAttendance} disabled={!selectedStudent || loading}>
            {loading 
              ? (language === 'ar' ? 'جاري التسجيل...' : 'Marking...')
              : (language === 'ar' ? 'تسجيل الحضور' : 'Mark Attendance')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
