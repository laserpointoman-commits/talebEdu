import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { BookOpen, Users, Clock, Calendar, Plus, Trash2, GraduationCap, MapPin, Search, UserPlus, Eye, User, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Student {
  id: string;
  student_id: string;
  first_name: string | null;
  last_name: string | null;
  first_name_ar: string | null;
  last_name_ar: string | null;
  grade: string | null;
  class: string | null;
  class_id: string | null;
  profile_image: string | null;
}

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
  room: string | null;
  capacity: number | null;
  academic_year: string | null;
  description: string | null;
  class_teacher_id: string | null;
  total_students: number;
  created_at: string;
  updated_at: string;
  teachers?: {
    id: string;
    employee_id: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
  class_schedules: ClassSchedule[];
  students: Student[];
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
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  
  const [newClass, setNewClass] = useState({
    name: '',
    grade: '',
    section: '',
    room: '',
    capacity: '30',
    academic_year: '2024-2025',
    description: '',
  });
  
  const [newSchedule, setNewSchedule] = useState({
    day: '',
    time: '',
    subject: '',
    teacher_id: '',
    room: '',
  });

  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchAllStudents();
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
        .order('grade', { ascending: true });

      if (error) throw error;

      // Fetch students for each class
      const classesWithStudents = await Promise.all((data || []).map(async (classInfo) => {
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, student_id, first_name, last_name, first_name_ar, last_name_ar, grade, class, class_id, profile_image')
          .eq('class_id', classInfo.id)
          .eq('approval_status', 'approved');

        if (studentsError) console.error('Error fetching students:', studentsError);

        return {
          ...classInfo,
          students: students || [],
          total_students: students?.length || 0,
        };
      }));

      setClasses(classesWithStudents);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
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

  const fetchAllStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name, first_name_ar, last_name_ar, grade, class, class_id, profile_image')
        .eq('approval_status', 'approved')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setAllStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
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
          room: newClass.room || null,
          capacity: parseInt(newClass.capacity) || 30,
          academic_year: newClass.academic_year,
          description: newClass.description || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Class created successfully' : language === 'hi' ? 'कक्षा सफलतापूर्वक बनाई गई' : 'تم إنشاء الصف بنجاح',
      });

      setIsCreateDialogOpen(false);
      setNewClass({ name: '', grade: '', section: '', room: '', capacity: '30', academic_year: '2024-2025', description: '' });
      fetchClasses();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
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
          room: newSchedule.room || selectedClass.room,
        }]);

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Schedule added successfully' : language === 'hi' ? 'शेड्यूल सफलतापूर्वक जोड़ा गया' : 'تم إضافة الجدول بنجاح',
      });

      setIsScheduleDialogOpen(false);
      setNewSchedule({ day: '', time: '', subject: '', teacher_id: '', room: '' });
      fetchClasses();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      // First remove students from class
      await supabase
        .from('students')
        .update({ class_id: null })
        .eq('class_id', classId);

      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Class deleted successfully' : language === 'hi' ? 'कक्षा सफलतापूर्वक हटाई गई' : 'تم حذف الصف بنجاح',
      });

      fetchClasses();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openStudentsDialog = (classInfo: ClassInfo) => {
    setSelectedClass(classInfo);
    setSelectedStudentIds(classInfo.students.map(s => s.id));
    setStudentSearchTerm('');
    setIsStudentsDialogOpen(true);
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveStudentAssignments = async () => {
    if (!selectedClass) return;

    try {
      // Remove all students from this class first
      await supabase
        .from('students')
        .update({ class_id: null })
        .eq('class_id', selectedClass.id);

      // Assign selected students to this class
      if (selectedStudentIds.length > 0) {
        const { error } = await supabase
          .from('students')
          .update({ class_id: selectedClass.id })
          .in('id', selectedStudentIds);

        if (error) throw error;
      }

      // Update total students count
      await supabase
        .from('classes')
        .update({ total_students: selectedStudentIds.length })
        .eq('id', selectedClass.id);

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Students assigned successfully' : language === 'hi' ? 'छात्र सफलतापूर्वक नियुक्त किए गए' : 'تم تعيين الطلاب بنجاح',
      });

      setIsStudentsDialogOpen(false);
      fetchClasses();
      fetchAllStudents();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = allStudents.filter(student => {
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
    const fullNameAr = `${student.first_name_ar || ''} ${student.last_name_ar || ''}`;
    const searchLower = studentSearchTerm.toLowerCase();
    return fullName.includes(searchLower) || 
           fullNameAr.includes(studentSearchTerm) ||
           student.student_id?.toLowerCase().includes(searchLower);
  });

  // Group students by assigned/unassigned
  const assignedStudents = filteredStudents.filter(s => selectedStudentIds.includes(s.id));
  const unassignedStudents = filteredStudents.filter(s => !selectedStudentIds.includes(s.id) && !s.class_id);
  const otherClassStudents = filteredStudents.filter(s => !selectedStudentIds.includes(s.id) && s.class_id && s.class_id !== selectedClass?.id);

  // Get unique grades and sections for filtering
  const uniqueGrades = [...new Set(classes.map(c => c.grade))].sort();
  const uniqueSections = [...new Set(classes.map(c => c.section))].sort();

  // Filter classes based on selected filters
  const filteredClasses = classes.filter(c => {
    const matchesGrade = filterGrade === 'all' || c.grade === filterGrade;
    const matchesSection = filterSection === 'all' || c.section === filterSection;
    return matchesGrade && matchesSection;
  });

  if (effectiveRole !== 'admin' && effectiveRole !== 'teacher' && effectiveRole !== 'developer') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">You don't have permission to view this page</p>
      </div>
    );
  }

  if (loading) {
    return <LogoLoader size="large" text={true} fullScreen={true} />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader
        title="Classes"
        titleAr="الصفوف"
        titleHi="कक्षाएँ"
        subtitle="Manage classes and assign students"
        subtitleAr="إدارة الصفوف وتعيين الطلاب"
        subtitleHi="कक्षाओं का प्रबंधन करें और छात्रों को नियुक्त करें"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={language === 'en' ? 'Grade' : language === 'hi' ? 'ग्रेड' : 'الصف'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'en' ? 'All Grades' : language === 'hi' ? 'सभी ग्रेड' : 'جميع الصفوف'}
                </SelectItem>
                {uniqueGrades.map(grade => (
                  <SelectItem key={grade} value={grade}>
                    {language === 'en' ? `Grade ${grade}` : language === 'hi' ? `ग्रेड ${grade}` : `الصف ${grade}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={language === 'en' ? 'Section' : language === 'hi' ? 'सेक्शन' : 'الشعبة'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'en' ? 'All Sections' : language === 'hi' ? 'सभी सेक्शन' : 'جميع الشعب'}
              </SelectItem>
              {uniqueSections.map(section => (
                <SelectItem key={section} value={section}>
                  {language === 'en' ? `Section ${section}` : language === 'hi' ? `सेक्शन ${section}` : `الشعبة ${section}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filterGrade !== 'all' || filterSection !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setFilterGrade('all'); setFilterSection('all'); }}
            >
              {language === 'en' ? 'Clear' : language === 'hi' ? 'साफ़ करें' : 'مسح'}
            </Button>
          )}
        </div>

        {effectiveRole === 'admin' && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Class' : language === 'hi' ? 'कक्षा जोड़ें' : 'إضافة صف'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((classInfo) => (
          <Card key={classInfo.id} className="relative overflow-hidden border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600" />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{classInfo.name}</CardTitle>
                    <CardDescription>
                      {classInfo.academic_year || '2024-2025'}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={classInfo.students.length > 0 ? 'default' : 'secondary'}
                  className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {classInfo.students.length} / {classInfo.capacity || 30}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-50/50 dark:bg-cyan-900/10">
                  <GraduationCap className="h-4 w-4 text-cyan-500" />
                  <span>{language === 'en' ? 'Grade' : language === 'hi' ? 'ग्रेड' : 'الصف'}: {classInfo.grade}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>{language === 'en' ? 'Section' : language === 'hi' ? 'सेक्शन' : 'الشعبة'}: {classInfo.section}</span>
                </div>
                {classInfo.room && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{language === 'en' ? 'Room' : language === 'hi' ? 'कमरा' : 'الغرفة'}: {classInfo.room}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{classInfo.class_schedules.length} {language === 'en' ? 'schedules' : language === 'hi' ? 'शेड्यूल' : 'جداول'}</span>
                </div>
              </div>

              {classInfo.teachers?.profiles?.full_name && (
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-lg">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{classInfo.teachers.profiles.full_name}</span>
                </div>
              )}

              {/* Student avatars preview */}
              {classInfo.students.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {classInfo.students.slice(0, 5).map((student) => (
                      <Avatar key={student.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={student.profile_image || undefined} />
                        <AvatarFallback className="text-xs">
                          {(student.first_name?.[0] || '') + (student.last_name?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {classInfo.students.length > 5 && (
                    <span className="text-sm text-muted-foreground">
                      +{classInfo.students.length - 5} {language === 'en' ? 'more' : language === 'hi' ? 'और' : 'آخرون'}
                    </span>
                  )}
                </div>
              )}

              {effectiveRole === 'admin' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openStudentsDialog(classInfo)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {language === 'en' ? 'Assign Students' : language === 'hi' ? 'छात्र नियुक्त करें' : 'تعيين طلاب'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedClass(classInfo);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedClass(classInfo);
                      setIsScheduleDialogOpen(true);
                    }}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClass(classInfo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {classes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === 'en' ? 'No classes found. Create your first class!' : language === 'hi' ? 'कोई कक्षा नहीं मिली। अपनी पहली कक्षा बनाएं!' : 'لا توجد صفوف. أنشئ صفك الأول!'}
            </p>
          </div>
        )}
      </div>

      {/* Create Class Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Create New Class' : language === 'hi' ? 'नई कक्षा बनाएं' : 'إنشاء صف جديد'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Fill in the class details below' : language === 'hi' ? 'नीचे कक्षा विवरण भरें' : 'أملأ تفاصيل الصف أدناه'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{language === 'en' ? 'Basic Info' : language === 'hi' ? 'मूल जानकारी' : 'معلومات أساسية'}</TabsTrigger>
              <TabsTrigger value="details">{language === 'en' ? 'Details' : language === 'hi' ? 'विवरण' : 'التفاصيل'}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="className">{language === 'en' ? 'Class Name' : language === 'hi' ? 'कक्षा का नाम' : 'اسم الصف'} *</Label>
                <Input
                  id="className"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder={language === 'en' ? 'e.g., Class 10-A' : language === 'hi' ? 'जैसे, कक्षा 10-A' : 'مثل: الصف 10-أ'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grade">{language === 'en' ? 'Grade' : language === 'hi' ? 'ग्रेड' : 'الصف'} *</Label>
                  <Select value={newClass.grade} onValueChange={(value) => setNewClass({ ...newClass, grade: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'en' ? 'Select grade' : language === 'hi' ? 'ग्रेड चुनें' : 'اختر الصف'} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={`Grade ${g}`}>
                          {language === 'en' ? `Grade ${g}` : language === 'hi' ? `ग्रेड ${g}` : `الصف ${g}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="section">{language === 'en' ? 'Section' : language === 'hi' ? 'सेक्शन' : 'الشعبة'} *</Label>
                  <Select value={newClass.section} onValueChange={(value) => setNewClass({ ...newClass, section: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'en' ? 'Select section' : language === 'hi' ? 'सेक्शन चुनें' : 'اختر الشعبة'} />
                    </SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'C', 'D', 'E', 'F'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="academic_year">{language === 'en' ? 'Academic Year' : language === 'hi' ? 'शैक्षणिक वर्ष' : 'العام الدراسي'}</Label>
                <Select value={newClass.academic_year} onValueChange={(value) => setNewClass({ ...newClass, academic_year: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room">{language === 'en' ? 'Room Number' : language === 'hi' ? 'कमरा नंबर' : 'رقم الغرفة'}</Label>
                  <Input
                    id="room"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    placeholder={language === 'en' ? 'e.g., Room 101' : language === 'hi' ? 'जैसे, कमरा 101' : 'مثل: غرفة 101'}
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">{language === 'en' ? 'Capacity' : language === 'hi' ? 'क्षमता' : 'السعة'}</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newClass.capacity}
                    onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">{language === 'en' ? 'Description' : language === 'hi' ? 'विवरण' : 'الوصف'}</Label>
                <Textarea
                  id="description"
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder={language === 'en' ? 'Optional class description...' : language === 'hi' ? 'वैकल्पिक कक्षा विवरण...' : 'وصف اختياري للصف...'}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleCreateClass}
              disabled={!newClass.name || !newClass.grade || !newClass.section}
            >
              {language === 'en' ? 'Create Class' : language === 'hi' ? 'कक्षा बनाएं' : 'إنشاء الصف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Students Dialog */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Assign Students to' : language === 'hi' ? 'छात्रों को असाइन करें' : 'تعيين الطلاب إلى'} {selectedClass?.name}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? `Select students to assign to this class. Currently ${selectedStudentIds.length} students selected.`
                : language === 'hi'
                ? `इस कक्षा में असाइन करने के लिए छात्र चुनें। वर्तमान में ${selectedStudentIds.length} छात्र चयनित।`
                : `اختر الطلاب للتعيين في هذا الصف. تم اختيار ${selectedStudentIds.length} طالب حالياً.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={language === 'en' ? 'Search students...' : language === 'hi' ? 'छात्र खोजें...' : 'البحث عن طلاب...'}
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {assignedStudents.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-primary mb-2">
                  {language === 'en' ? 'Assigned to this class' : language === 'hi' ? 'इस कक्षा में असाइन' : 'معينون في هذا الصف'} ({assignedStudents.length})
                </h4>
                <div className="space-y-2">
                  {assignedStudents.map((student) => (
                    <StudentItem
                      key={student.id}
                      student={student}
                      isSelected={true}
                      onToggle={() => handleToggleStudent(student.id)}
                      language={language}
                    />
                  ))}
                </div>
              </div>
            )}

            {unassignedStudents.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {language === 'en' ? 'Available students' : language === 'hi' ? 'उपलब्ध छात्र' : 'الطلاب المتاحون'} ({unassignedStudents.length})
                </h4>
                <div className="space-y-2">
                  {unassignedStudents.map((student) => (
                    <StudentItem
                      key={student.id}
                      student={student}
                      isSelected={false}
                      onToggle={() => handleToggleStudent(student.id)}
                      language={language}
                    />
                  ))}
                </div>
              </div>
            )}

            {otherClassStudents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-600 mb-2">
                  {language === 'en' ? 'Assigned to other classes' : language === 'hi' ? 'अन्य कक्षाओं में असाइन' : 'معينون في صفوف أخرى'} ({otherClassStudents.length})
                </h4>
                <div className="space-y-2">
                  {otherClassStudents.map((student) => (
                    <StudentItem
                      key={student.id}
                      student={student}
                      isSelected={false}
                      onToggle={() => handleToggleStudent(student.id)}
                      language={language}
                      warning
                    />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStudentsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveStudentAssignments}>
              {language === 'en' ? 'Save Assignments' : language === 'hi' ? 'असाइनमेंट सहेजें' : 'حفظ التعيينات'} ({selectedStudentIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Class Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClass?.name}</DialogTitle>
            <DialogDescription>
              {selectedClass?.grade} - {language === 'en' ? 'Section' : language === 'hi' ? 'सेक्शन' : 'الشعبة'} {selectedClass?.section}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students">
                <Users className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Students' : language === 'hi' ? 'छात्र' : 'الطلاب'} ({selectedClass?.students.length || 0})
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <Clock className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Schedule' : language === 'hi' ? 'शेड्यूल' : 'الجدول'} ({selectedClass?.class_schedules.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-4">
              <ScrollArea className="h-[400px]">
                {selectedClass?.students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'en' ? 'No students assigned to this class' : language === 'hi' ? 'इस कक्षा में कोई छात्र असाइन नहीं' : 'لا يوجد طلاب معينون في هذا الصف'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedClass?.students.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar>
                          <AvatarImage src={student.profile_image || undefined} />
                          <AvatarFallback>
                            {(student.first_name?.[0] || '') + (student.last_name?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.student_id}
                          </p>
                        </div>
                        <Badge variant="outline">{student.grade}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              <ScrollArea className="h-[400px]">
                {selectedClass?.class_schedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'en' ? 'No schedule entries' : language === 'hi' ? 'कोई शेड्यूल प्रविष्टि नहीं' : 'لا توجد جداول'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedClass?.class_schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{schedule.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.day} - {schedule.time}
                          </p>
                        </div>
                        <div className="text-right">
                          {schedule.teachers?.profiles?.full_name && (
                            <p className="text-sm">{schedule.teachers.profiles.full_name}</p>
                          )}
                          {schedule.room && (
                            <p className="text-xs text-muted-foreground">{schedule.room}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add Schedule to' : language === 'hi' ? 'शेड्यूल जोड़ें' : 'إضافة جدول إلى'} {selectedClass?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Day' : language === 'hi' ? 'दिन' : 'اليوم'}</Label>
                <Select value={newSchedule.day} onValueChange={(value) => setNewSchedule({ ...newSchedule, day: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select day' : language === 'hi' ? 'दिन चुनें' : 'اختر اليوم'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">{language === 'en' ? 'Sunday' : language === 'hi' ? 'रविवार' : 'الأحد'}</SelectItem>
                    <SelectItem value="Monday">{language === 'en' ? 'Monday' : language === 'hi' ? 'सोमवार' : 'الإثنين'}</SelectItem>
                    <SelectItem value="Tuesday">{language === 'en' ? 'Tuesday' : language === 'hi' ? 'मंगलवार' : 'الثلاثاء'}</SelectItem>
                    <SelectItem value="Wednesday">{language === 'en' ? 'Wednesday' : language === 'hi' ? 'बुधवार' : 'الأربعاء'}</SelectItem>
                    <SelectItem value="Thursday">{language === 'en' ? 'Thursday' : language === 'hi' ? 'गुरुवार' : 'الخميس'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time">{language === 'en' ? 'Time' : language === 'hi' ? 'समय' : 'الوقت'}</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">{language === 'en' ? 'Subject' : language === 'hi' ? 'विषय' : 'المادة'}</Label>
              <Input
                id="subject"
                value={newSchedule.subject}
                onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Mathematics' : language === 'hi' ? 'जैसे, गणित' : 'مثل: الرياضيات'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'en' ? 'Teacher' : language === 'hi' ? 'शिक्षक' : 'المعلم'}</Label>
                <Select value={newSchedule.teacher_id} onValueChange={(value) => setNewSchedule({ ...newSchedule, teacher_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select teacher' : language === 'hi' ? 'शिक्षक चुनें' : 'اختر معلماً'} />
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
                <Label htmlFor="room">{language === 'en' ? 'Room' : language === 'hi' ? 'कमरा' : 'الغرفة'}</Label>
                <Input
                  id="room"
                  value={newSchedule.room}
                  onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })}
                  placeholder={selectedClass?.room || (language === 'en' ? 'Room number' : language === 'hi' ? 'कमरा नंबर' : 'رقم الغرفة')}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleAddSchedule}
              disabled={!newSchedule.day || !newSchedule.time || !newSchedule.subject}
            >
              {language === 'en' ? 'Add Schedule' : language === 'hi' ? 'शेड्यूल जोड़ें' : 'إضافة الجدول'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Student item component
function StudentItem({ 
  student, 
  isSelected, 
  onToggle, 
  language,
  warning = false 
}: { 
  student: Student; 
  isSelected: boolean; 
  onToggle: () => void;
  language: string;
  warning?: boolean;
}) {
  return (
    <div 
      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10 border-primary' : warning ? 'bg-orange-50 border-orange-200' : 'hover:bg-muted'
      }`}
      onClick={onToggle}
    >
      <Checkbox checked={isSelected} onChange={onToggle} />
      <Avatar className="h-10 w-10">
        <AvatarImage src={student.profile_image || undefined} />
        <AvatarFallback>
          {(student.first_name?.[0] || '') + (student.last_name?.[0] || '')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {language === 'ar' && student.first_name_ar 
            ? `${student.first_name_ar} ${student.last_name_ar}`
            : `${student.first_name} ${student.last_name}`
          }
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {student.student_id} • {student.grade}
        </p>
      </div>
      {warning && (
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          {language === 'en' ? 'Other class' : language === 'hi' ? 'अन्य कक्षा' : 'صف آخر'}
        </Badge>
      )}
    </div>
  );
}
