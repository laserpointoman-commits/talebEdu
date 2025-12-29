import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Wallet, 
  BookOpen, 
  CalendarDays, 
  StickyNote, 
  Trophy,
  TrendingUp,
  Award,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface StudentProfileProps {
  studentId: string;
  onClose?: () => void;
}

export default function StudentProfile({ studentId, onClose }: StudentProfileProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('grades');

  // Fetch student data from database
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          parent:profiles!students_parent_id_fkey(full_name, full_name_ar, phone, email)
        `)
        .eq('id', studentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId
  });

  // Fetch grades from database
  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['student-grades', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          exam:exams(subject, exam_type, date, total_marks)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studentId
  });

  // Fetch wallet balance
  const { data: walletBalance } = useQuery({
    queryKey: ['student-wallet', studentId],
    queryFn: async () => {
      if (!student?.profile_id) return null;
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', student.profile_id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.balance || 0;
    },
    enabled: !!student?.profile_id
  });

  // Fetch attendance stats
  const { data: attendanceStats } = useQuery({
    queryKey: ['student-attendance-stats', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', studentId);
      if (error) throw error;
      
      const total = data.length;
      const present = data.filter(r => r.status === 'present' || r.status === 'late').length;
      return total > 0 ? Math.round((present / total) * 100) : 100;
    },
    enabled: !!studentId
  });

  // Fetch homework
  const { data: homeworkSubmissions = [] } = useQuery({
    queryKey: ['student-homework', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select(`
          *,
          homework:homework(title, subject, due_date)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!studentId
  });

  const tabs = [
    { id: 'grades', label: language === 'en' ? 'Grades' : 'الدرجات', icon: GraduationCap },
    { id: 'wallet', label: language === 'en' ? 'Wallet' : 'المحفظة', icon: Wallet },
    { id: 'homework', label: language === 'en' ? 'Homework' : 'الواجبات', icon: BookOpen },
    { id: 'schedule', label: language === 'en' ? 'Schedule' : 'الجدول', icon: CalendarDays },
    { id: 'notes', label: language === 'en' ? 'Notes' : 'الملاحظات', icon: StickyNote },
  ];

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-muted-foreground';
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-warning';
    if (grade.startsWith('C')) return 'text-info';
    return 'text-destructive';
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    const gradePoints: Record<string, number> = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0
    };
    const total = grades.reduce((sum, g) => sum + (gradePoints[g.grade || ''] || 0), 0);
    return (total / grades.length).toFixed(2);
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{language === 'en' ? 'Student not found' : 'الطالب غير موجود'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Info Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              {student.profile_image ? (
                <img src={student.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {language === 'en' 
                  ? `${student.first_name} ${student.last_name}`
                  : `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`}
              </h2>
              <p className="text-muted-foreground">
                {language === 'en' ? 'Class' : 'الصف'} {student.class} | 
                {language === 'en' ? ' Student ID:' : ' رقم الطالب:'} {student.student_id}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="number-display">{student.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {language === 'en' ? 'Parent:' : 'ولي الأمر:'} {' '}
                    {language === 'en' 
                      ? student.parent?.full_name 
                      : (student.parent?.full_name_ar || student.parent?.full_name) || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{student.address || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          {/* Grade Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Overall GPA' : 'المعدل التراكمي'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  <span className="text-2xl font-bold">{calculateGPA()}</span>
                  <span className="text-sm text-muted-foreground">/ 4.0</span>
                </div>
                <Progress value={(parseFloat(calculateGPA()) / 4) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Total Exams' : 'إجمالي الاختبارات'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{grades.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Average Score' : 'متوسط الدرجات'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <span className="text-2xl font-bold">
                    {grades.length > 0 
                      ? Math.round(grades.reduce((sum, g) => sum + g.marks_obtained, 0) / grades.length)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Attendance' : 'الحضور'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-info" />
                  <span className="text-2xl font-bold">{attendanceStats || 100}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grades List */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Academic Grades' : 'الدرجات الأكاديمية'}</CardTitle>
            </CardHeader>
            <CardContent>
              {gradesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : grades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === 'en' ? 'No grades recorded yet' : 'لا توجد درجات مسجلة بعد'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grades.map((grade) => (
                    <div key={grade.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className={`font-bold text-lg ${getGradeColor(grade.grade)}`}>
                              {grade.grade || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{grade.exam?.subject || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              {grade.exam?.exam_type || 'Exam'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {grade.exam?.total_marks 
                              ? Math.round((grade.marks_obtained / grade.exam.total_marks) * 100)
                              : grade.marks_obtained}%
                          </p>
                          <p className="text-xs text-muted-foreground">{grade.exam?.date}</p>
                          {grade.remarks && (
                            <Badge variant="secondary" className="mt-2">
                              {grade.remarks}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={grade.exam?.total_marks 
                          ? (grade.marks_obtained / grade.exam.total_marks) * 100
                          : grade.marks_obtained} 
                        className="mt-3" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'wallet' && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Student Wallet' : 'محفظة الطالب'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Wallet className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-3xl font-bold">{walletBalance || 0} OMR</p>
              <p className="text-muted-foreground mt-2">
                {language === 'en' ? 'Current Balance' : 'الرصيد الحالي'}
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <Button>
                  {language === 'en' ? 'Add Funds' : 'إضافة رصيد'}
                </Button>
                <Button variant="outline">
                  {language === 'en' ? 'Transaction History' : 'سجل المعاملات'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'homework' && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Homework' : 'الواجبات'}</CardTitle>
          </CardHeader>
          <CardContent>
            {homeworkSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'en' ? 'No homework assignments' : 'لا توجد واجبات'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {homeworkSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {submission.homework?.title || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {submission.homework?.subject}
                      </p>
                    </div>
                    <Badge variant={submission.status === 'submitted' ? 'default' : 'secondary'}>
                      {submission.status === 'submitted' 
                        ? (language === 'en' ? 'Submitted' : 'مقدم')
                        : (language === 'en' ? 'Pending' : 'قيد الانتظار')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Class Schedule' : 'جدول الحصص'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CalendarDays className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'en' ? 'Schedule details will appear here' : 'ستظهر تفاصيل الجدول هنا'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notes' && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Teacher Notes' : 'ملاحظات المعلم'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'en' ? 'No notes available' : 'لا توجد ملاحظات'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
