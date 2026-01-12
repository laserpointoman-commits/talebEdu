import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';

interface Grade {
  id: string;
  subject: string;
  exam_type: string;
  marks_obtained: number;
  total_marks: number;
  grade: string | null;
  date: string;
}

export default function StudentGrades() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (studentId && user) {
      loadData();
    }
  }, [studentId, user]);

  const loadData = async () => {
    try {
      // Verify parent owns this student
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('parent_id', user?.id)
        .single();

      if (error || !studentData) {
        navigate('/dashboard');
        return;
      }

      setStudent(studentData);

      // Get grades with exam info
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*, exams(subject, exam_type, date, total_marks)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      const formattedGrades = (gradesData || []).map((g: any) => ({
        id: g.id,
        subject: g.exams?.subject || 'Unknown',
        exam_type: g.exams?.exam_type || 'Exam',
        marks_obtained: Number(g.marks_obtained) || 0,
        total_marks: Number(g.exams?.total_marks) || 100,
        grade: g.grade,
        date: g.exams?.date || g.created_at
      }));

      setGrades(formattedGrades);
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  // Calculate overall average
  const overallAverage = grades.length > 0 
    ? grades.reduce((sum, g) => sum + (g.marks_obtained / g.total_marks * 100), 0) / grades.length
    : 0;

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90) return { label: 'A+', variant: 'default' as const };
    if (percentage >= 80) return { label: 'A', variant: 'default' as const };
    if (percentage >= 70) return { label: 'B', variant: 'secondary' as const };
    if (percentage >= 60) return { label: 'C', variant: 'secondary' as const };
    return { label: 'D', variant: 'destructive' as const };
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'الدرجات' : 'Grades'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Overall Performance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-full">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'المعدل العام' : 'Overall Average'}
                </p>
                <p className={`text-3xl font-bold ${getGradeColor(overallAverage)}`}>
                  {overallAverage.toFixed(1)}%
                </p>
              </div>
            </div>
            <Badge {...getGradeBadge(overallAverage)} className="text-lg px-4 py-1">
              {getGradeBadge(overallAverage).label}
            </Badge>
          </div>
          <Progress value={overallAverage} className="h-2" />
        </CardContent>
      </Card>

      {/* Grades List */}
      <div className="space-y-3">
        <h2 className="font-semibold">
          {language === 'ar' ? 'سجل الدرجات' : 'Grade History'}
        </h2>
        
        {grades.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد درجات مسجلة بعد' : 'No grades recorded yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          grades.map((grade) => {
            const percentage = (grade.marks_obtained / grade.total_marks) * 100;
            return (
              <Card key={grade.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{grade.subject}</h3>
                      <p className="text-sm text-muted-foreground">{grade.exam_type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getGradeColor(percentage)}`}>
                        {grade.marks_obtained}/{grade.total_marks}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(grade.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
