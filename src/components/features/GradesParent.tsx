import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, GraduationCap, Calendar, Clock, BookOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  first_name_ar: string;
  last_name_ar: string;
  grade: string;
  class: string;
}

interface Grade {
  id: string;
  marks_obtained: number;
  grade: string;
  remarks: string;
  created_at: string;
  exams: {
    subject: string;
    exam_type: string;
    total_marks: number;
    date: string;
  };
}

interface Exam {
  id: string;
  subject: string;
  exam_type: string;
  date: string;
  time: string;
  total_marks: number;
  duration: string;
  room: string;
}

export default function GradesParent() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      loadGrades();
      loadUpcomingExams();
      subscribeToGrades();
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, first_name_ar, last_name_ar, grade, class')
        .eq('parent_id', user?.id);

      if (error) throw error;
      
      setStudents(data || []);
      if (data && data.length > 0) {
        setSelectedStudent(data[0]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error(language === 'ar' ? 'فشل تحميل الطلاب' : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    if (!selectedStudent) return;

    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          id,
          marks_obtained,
          grade,
          remarks,
          created_at,
          exams (
            subject,
            exam_type,
            total_marks,
            date
          )
        `)
        .eq('student_id', selectedStudent.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setGrades(data || []);
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const loadUpcomingExams = async () => {
    if (!selectedStudent) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('class_id', selectedStudent.class)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingExams(data || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const subscribeToGrades = () => {
    if (!selectedStudent) return;

    const channel = supabase
      .channel(`grades-${selectedStudent.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grades',
          filter: `student_id=eq.${selectedStudent.id}`
        },
        () => {
          loadGrades();
          toast.success(language === 'ar' ? 'تم إضافة درجة جديدة' : 'New grade added');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateGPA = () => {
    if (grades.length === 0) return '0.00';
    const total = grades.reduce((sum, g) => {
      const percentage = (g.marks_obtained / (g.exams?.total_marks || 100)) * 100;
      return sum + percentage;
    }, 0);
    return (total / grades.length / 25).toFixed(2);
  };

  const getGradeColor = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-green-600';
    if (grade?.startsWith('B')) return 'text-blue-600';
    if (grade?.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'en' ? 'Students' : 'الطلاب'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Select a student to view their grades and information' : 'اختر طالباً لعرض درجاته ومعلوماته'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student) => (
            <Card 
              key={student.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedStudent(student)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {language === 'en' 
                        ? `${student.first_name} ${student.last_name}`
                        : `${student.first_name_ar} ${student.last_name_ar}`
                      }
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>{student.grade} - {student.class}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const gpa = calculateGPA();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {language === 'en'
                  ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                  : `${selectedStudent.first_name_ar} ${selectedStudent.last_name_ar}`
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedStudent.grade} - {selectedStudent.class}
              </p>
            </div>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
            {language === 'en' ? 'Back to Students' : 'العودة للطلاب'}
          </Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {language === 'en' ? 'GPA' : 'المعدل التراكمي'}
            </span>
            <span className="text-2xl font-bold text-primary">{gpa}</span>
          </div>
          <Progress value={parseFloat(gpa) * 25} className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {language === 'en' ? 'Total Grades' : 'مجموع الدرجات'}
            </span>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{grades.length}</div>
              <div className="text-xs text-muted-foreground">
                {language === 'en' ? 'Recorded' : 'مسجلة'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grades">
            {language === 'en' ? 'Grades' : 'الدرجات'}
          </TabsTrigger>
          <TabsTrigger value="exams">
            {language === 'en' ? 'Upcoming Exams' : 'الامتحانات القادمة'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {language === 'en' ? 'Recent Grades' : 'الدرجات الأخيرة'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد درجات بعد' : 'No grades yet'}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {grades.map((gradeItem) => (
                      <div key={gradeItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{gradeItem.exams?.subject}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline">{gradeItem.exams?.exam_type}</Badge>
                            <span>{format(new Date(gradeItem.exams?.date), 'MMM dd, yyyy')}</span>
                          </div>
                          {gradeItem.remarks && (
                            <p className="text-sm text-muted-foreground mt-1">{gradeItem.remarks}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getGradeColor(gradeItem.grade)}`}>
                            {gradeItem.grade}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {gradeItem.marks_obtained}/{gradeItem.exams?.total_marks || 100}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {language === 'en' ? 'Upcoming Exams' : 'الامتحانات القادمة'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد امتحانات قادمة' : 'No upcoming exams'}
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{exam.subject}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(exam.date), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{exam.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{exam.exam_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {exam.duration} • {language === 'ar' ? 'غرفة' : 'Room'} {exam.room}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {language === 'en' ? 'Upcoming' : 'قادم'}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-2">
                          {exam.total_marks} {language === 'ar' ? 'درجة' : 'marks'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
