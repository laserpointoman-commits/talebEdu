import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Award, FileText } from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';
import GradeManagement from '@/components/features/GradeManagement';

interface GradeData {
  id: string;
  subject: string;
  grade: string | null;
  marks_obtained: number;
  remarks: string | null;
  exam: {
    exam_type: string;
    date: string;
    total_marks: number | null;
  };
}

export default function Grades() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overallGPA: 0,
    totalExams: 0,
    averageScore: 0,
  });

  useEffect(() => {
    if (user && profile) {
      loadGrades();
    }
  }, [user, profile]);

  const loadGrades = async () => {
    try {
      // First get the student ID for the current user
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (studentError || !studentData) {
        // If user is a parent, get their children's grades
        if (profile?.role === 'parent') {
          const { data: children } = await supabase
            .from('students')
            .select('id')
            .eq('parent_id', user?.id);
          
          if (children && children.length > 0) {
            const { data: gradesData, error: gradesError } = await supabase
              .from('grades')
              .select(`
                id,
                marks_obtained,
                grade,
                remarks,
                exams!inner (
                  exam_type,
                  date,
                  total_marks,
                  subject
                )
              `)
              .in('student_id', children.map(c => c.id))
              .order('created_at', { ascending: false })
              .limit(20);

            if (!gradesError && gradesData) {
              const mapped = gradesData.map((g: any) => ({
                id: g.id,
                subject: g.exams?.subject || 'Unknown',
                grade: g.grade,
                marks_obtained: g.marks_obtained,
                remarks: g.remarks,
                exam: {
                  exam_type: g.exams?.exam_type || 'Exam',
                  date: g.exams?.date || new Date().toISOString(),
                  total_marks: g.exams?.total_marks || 100
                }
              }));
              setGrades(mapped);
              calculateStats(mapped);
            }
          }
        }
        setLoading(false);
        return;
      }

      // Fetch grades for the student
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          marks_obtained,
          grade,
          remarks,
          exams!inner (
            exam_type,
            date,
            total_marks,
            subject
          )
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });

      if (!gradesError && gradesData) {
        const mapped = gradesData.map((g: any) => ({
          id: g.id,
          subject: g.exams?.subject || 'Unknown',
          grade: g.grade,
          marks_obtained: g.marks_obtained,
          remarks: g.remarks,
          exam: {
            exam_type: g.exams?.exam_type || 'Exam',
            date: g.exams?.date || new Date().toISOString(),
            total_marks: g.exams?.total_marks || 100
          }
        }));
        setGrades(mapped);
        calculateStats(mapped);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (gradeData: GradeData[]) => {
    if (gradeData.length === 0) {
      setStats({ overallGPA: 0, totalExams: 0, averageScore: 0 });
      return;
    }

    const totalScore = gradeData.reduce((sum, g) => {
      const percentage = g.exam.total_marks 
        ? (g.marks_obtained / g.exam.total_marks) * 100 
        : g.marks_obtained;
      return sum + percentage;
    }, 0);

    const averageScore = totalScore / gradeData.length;
    const gpa = (averageScore / 100) * 4; // Convert to 4.0 scale

    setStats({
      overallGPA: Math.round(gpa * 100) / 100,
      totalExams: gradeData.length,
      averageScore: Math.round(averageScore * 10) / 10,
    });
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-muted-foreground';
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-warning';
    if (grade.startsWith('C')) return 'text-info';
    return 'text-destructive';
  };

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string; hi: string }> = {
      midterm: { en: 'Midterm', ar: 'اختبار منتصف الفصل', hi: 'मध्यावधि' },
      final: { en: 'Final', ar: 'الاختبار النهائي', hi: 'अंतिम' },
      quiz: { en: 'Quiz', ar: 'اختبار قصير', hi: 'प्रश्नोत्तरी' },
      assignment: { en: 'Assignment', ar: 'واجب', hi: 'असाइनमेंट' },
      project: { en: 'Project', ar: 'مشروع', hi: 'प्रोजेक्ट' },
      lab: { en: 'Lab Report', ar: 'تقرير المختبر', hi: 'लैब रिपोर्ट' },
    };
    return labels[type]?.[language === 'ar' ? 'ar' : language === 'hi' ? 'hi' : 'en'] || type;
  };

  // Check if user is teacher or admin - they can manage grades
  if (profile?.role === 'teacher' || profile?.role === 'admin') {
    return <GradeManagement />;
  }

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  // For students and parents - show read-only grades view
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.grades')}</h2>
        <p className="text-muted-foreground">
          {language === 'en' ? 'View student grades' : language === 'hi' ? 'छात्र ग्रेड देखें' : 'عرض درجات الطلاب'}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Overall GPA' : language === 'hi' ? 'कुल जीपीए' : 'المعدل التراكمي'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold">{stats.overallGPA}</span>
              <span className="text-sm text-muted-foreground">/ 4.0</span>
            </div>
            <Progress value={(stats.overallGPA / 4) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Exams' : language === 'hi' ? 'कुल परीक्षाएं' : 'إجمالي الاختبارات'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalExams}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Average Score' : language === 'hi' ? 'औसत स्कोर' : 'متوسط الدرجة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-info" />
              <span className="text-2xl font-bold">{stats.averageScore}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Performance' : language === 'hi' ? 'प्रदर्शन' : 'الأداء'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">
                {stats.averageScore >= 90 ? (language === 'en' ? 'Excellent' : language === 'hi' ? 'उत्कृष्ट' : 'ممتاز') :
                 stats.averageScore >= 80 ? (language === 'en' ? 'Good' : language === 'hi' ? 'अच्छा' : 'جيد جداً') :
                 stats.averageScore >= 70 ? (language === 'en' ? 'Fair' : language === 'hi' ? 'ठीक' : 'جيد') :
                 (language === 'en' ? 'Needs Work' : language === 'hi' ? 'सुधार की जरूरत' : 'يحتاج تحسين')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'en' ? 'Recent Grades' : language === 'hi' ? 'हाल के ग्रेड' : 'الدرجات الأخيرة'}</CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'en' ? 'No grades found' : language === 'hi' ? 'कोई ग्रेड नहीं मिला' : 'لا توجد درجات'}</p>
              <p className="text-sm mt-2">
                {language === 'en' 
                  ? 'Grades will appear here once exams are graded'
                  : language === 'hi' ? 'परीक्षाओं की ग्रेडिंग के बाद ग्रेड यहाँ दिखाई देंगे'
                  : 'ستظهر الدرجات هنا بعد تصحيح الاختبارات'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map((grade) => {
                const percentage = grade.exam.total_marks 
                  ? Math.round((grade.marks_obtained / grade.exam.total_marks) * 100)
                  : grade.marks_obtained;
                
                return (
                  <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className={`font-bold ${getGradeColor(grade.grade)}`}>
                          {grade.grade || '-'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{grade.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {getExamTypeLabel(grade.exam.exam_type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {grade.marks_obtained}/{grade.exam.total_marks || 100}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(grade.exam.date).toLocaleDateString(
                            language === 'ar' ? 'ar-SA' : language === 'hi' ? 'hi-IN' : 'en-US'
                          )}
                        </p>
                      </div>
                      <Progress value={percentage} className="w-20" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
