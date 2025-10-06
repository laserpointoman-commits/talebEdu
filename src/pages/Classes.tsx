import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Users, Clock, Calendar, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ClassSchedule {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher_id: string;
  room: string;
  teachers?: {
    employee_id: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  class_teacher_id: string | null;
  total_students: number;
  created_at: string;
  updated_at: string;
  teachers?: {
    employee_id: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
  class_schedules: ClassSchedule[];
}

interface Teacher {
  id: string;
  employee_id: string;
  profiles: {
    full_name: string;
  } | null;
}

export default function Classes() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    grade: '',
    section: '',
    class_teacher_id: '',
  });
  const [newSchedule, setNewSchedule] = useState({
    day: '',
    time: '',
    subject: '',
    teacher_id: '',
    room: '',
  });

  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teachers:class_teacher_id (
            id,
            employee_id,
            profiles (
              full_name
            )
          ),
          class_schedules (
            id,
            day,
            time,
            subject,
            teacher_id,
            room,
            teachers (
              employee_id,
              profiles (
                full_name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          employee_id,
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleCreateClass = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          name: newClass.name,
          grade: newClass.grade,
          section: newClass.section,
          class_teacher_id: newClass.class_teacher_id === 'none' ? null : newClass.class_teacher_id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : 'نجاح',
        description: language === 'en' ? 'Class created successfully' : 'تم إنشاء الصف بنجاح',
      });

      setIsCreateDialogOpen(false);
      setNewClass({ name: '', grade: '', section: '', class_teacher_id: '' });
      fetchClasses();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedClass || !newSchedule.day || !newSchedule.time || !newSchedule.subject) return;

    try {
      const { error } = await supabase
        .from('class_schedules')
        .insert([{
          class_id: selectedClass.id,
          day: newSchedule.day,
          time: newSchedule.time,
          subject: newSchedule.subject,
          teacher_id: newSchedule.teacher_id || null,
          room: newSchedule.room,
        }]);

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : 'نجاح',
        description: language === 'en' ? 'Schedule added successfully' : 'تم إضافة الجدول بنجاح',
      });

      setIsScheduleDialogOpen(false);
      setNewSchedule({ day: '', time: '', subject: '', teacher_id: '', room: '' });
      fetchClasses();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : 'نجاح',
        description: language === 'en' ? 'Class deleted successfully' : 'تم حذف الصف بنجاح',
      });

      fetchClasses();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.classes')}</h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage class schedules and information' : 'إدارة جداول الصفوف والمعلومات'}
          </p>
        </div>
        {profile?.role === 'admin' && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Class' : 'إضافة صف'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classInfo) => (
          <Card key={classInfo.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{classInfo.name}</CardTitle>
                {profile?.role === 'admin' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedClass(classInfo);
                        setIsScheduleDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClass(classInfo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{language === 'en' ? 'Grade' : 'الصف'}: {classInfo.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{language === 'en' ? 'Section' : 'الشعبة'}: {classInfo.section}</span>
                </div>
                {classInfo.teachers?.profiles?.full_name && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{language === 'en' ? 'Teacher' : 'المعلم'}: {classInfo.teachers.profiles.full_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{language === 'en' ? 'Schedules' : 'الجداول'}: {classInfo.class_schedules.length}</span>
                </div>
              </div>

              {classInfo.class_schedules.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">{language === 'en' ? 'Schedule' : 'الجدول'}</h4>
                  <div className="space-y-1 text-xs">
                    {classInfo.class_schedules.slice(0, 3).map((schedule) => (
                      <div key={schedule.id} className="flex justify-between">
                        <span>{schedule.day} - {schedule.subject}</span>
                        <span>{schedule.time}</span>
                      </div>
                    ))}
                    {classInfo.class_schedules.length > 3 && (
                      <div className="text-muted-foreground">
                        +{classInfo.class_schedules.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Class Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Create New Class' : 'إنشاء صف جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="className">{language === 'en' ? 'Class Name' : 'اسم الصف'}</Label>
              <Input
                id="className"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Class 10-A' : 'مثل: الصف 10-أ'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade">{language === 'en' ? 'Grade' : 'الصف'}</Label>
                <Input
                  id="grade"
                  value={newClass.grade}
                  onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                  placeholder={language === 'en' ? 'e.g., 10' : 'مثل: 10'}
                />
              </div>
              <div>
                <Label htmlFor="section">{language === 'en' ? 'Section' : 'الشعبة'}</Label>
                <Input
                  id="section"
                  value={newClass.section}
                  onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                  placeholder={language === 'en' ? 'e.g., A' : 'مثل: أ'}
                />
              </div>
            </div>
            <div>
              <Label>{language === 'en' ? 'Class Teacher (Optional)' : 'معلم الصف (اختياري)'}</Label>
              <Select value={newClass.class_teacher_id} onValueChange={(value) => setNewClass({ ...newClass, class_teacher_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select a teacher' : 'اختر معلماً'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{language === 'en' ? 'No Teacher' : 'بدون معلم'}</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.profiles?.full_name || teacher.employee_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateClass}>
              {language === 'en' ? 'Create Class' : 'إنشاء الصف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add Schedule' : 'إضافة جدول'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Day' : 'اليوم'}</Label>
                <Select value={newSchedule.day} onValueChange={(value) => setNewSchedule({ ...newSchedule, day: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select day' : 'اختر اليوم'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">{language === 'en' ? 'Sunday' : 'الأحد'}</SelectItem>
                    <SelectItem value="Monday">{language === 'en' ? 'Monday' : 'الإثنين'}</SelectItem>
                    <SelectItem value="Tuesday">{language === 'en' ? 'Tuesday' : 'الثلاثاء'}</SelectItem>
                    <SelectItem value="Wednesday">{language === 'en' ? 'Wednesday' : 'الأربعاء'}</SelectItem>
                    <SelectItem value="Thursday">{language === 'en' ? 'Thursday' : 'الخميس'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time">{language === 'en' ? 'Time' : 'الوقت'}</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">{language === 'en' ? 'Subject' : 'المادة'}</Label>
              <Input
                id="subject"
                value={newSchedule.subject}
                onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Mathematics' : 'مثل: الرياضيات'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Teacher' : 'المعلم'}</Label>
                <Select value={newSchedule.teacher_id} onValueChange={(value) => setNewSchedule({ ...newSchedule, teacher_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select teacher' : 'اختر معلماً'} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.profiles?.full_name || teacher.employee_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="room">{language === 'en' ? 'Room' : 'الغرفة'}</Label>
                <Input
                  id="room"
                  value={newSchedule.room}
                  onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })}
                  placeholder={language === 'en' ? 'e.g., Room 101' : 'مثل: غرفة 101'}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddSchedule}>
              {language === 'en' ? 'Add Schedule' : 'إضافة الجدول'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}