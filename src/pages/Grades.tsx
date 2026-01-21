import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Award, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Gradient Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 p-6 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] bg-[length:20px_20px]" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold">{t('dashboard.grades')}</h2>
          <p className="mt-1 text-white/80 text-sm md:text-base">
            {language === 'en' ? 'View student grades' : language === 'hi' ? 'छात्र ग्रेड देखें' : 'عرض درجات الطلاب'}
          </p>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            title: language === 'en' ? 'Overall GPA' : language === 'hi' ? 'कुल जीपीए' : 'المعدل التراكمي',
            value: stats.overallGPA,
            suffix: '/ 4.0',
            icon: Trophy,
            gradient: 'from-amber-500 to-yellow-400',
            extra: <Progress value={(stats.overallGPA / 4) * 100} className="mt-2" />
          },
          {
            title: language === 'en' ? 'Total Exams' : language === 'hi' ? 'कुल परीक्षाएं' : 'إجمالي الاختبارات',
            value: stats.totalExams,
            icon: Award,
            gradient: 'from-blue-500 to-sky-400',
          },
          {
            title: language === 'en' ? 'Average Score' : language === 'hi' ? 'औसत स्कोर' : 'متوسط الدرجة',
            value: `${stats.averageScore}%`,
            icon: FileText,
            gradient: 'from-cyan-500 to-teal-400',
          },
          {
            title: language === 'en' ? 'Performance' : language === 'hi' ? 'प्रदर्शन' : 'الأداء',
            value: stats.averageScore >= 90 ? (language === 'en' ? 'Excellent' : language === 'hi' ? 'उत्कृष्ट' : 'ممتاز') :
                   stats.averageScore >= 80 ? (language === 'en' ? 'Good' : language === 'hi' ? 'अच्छा' : 'جيد جداً') :
                   stats.averageScore >= 70 ? (language === 'en' ? 'Fair' : language === 'hi' ? 'ठीक' : 'جيد') :
                   (language === 'en' ? 'Needs Work' : language === 'hi' ? 'सुधार की जरूरत' : 'يحتاج تحسين'),
            icon: TrendingUp,
            gradient: 'from-emerald-500 to-green-400',
          },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all">
              <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      {stat.suffix && <span className="text-sm text-muted-foreground">{stat.suffix}</span>}
                    </div>
                  </div>
                </div>
                {stat.extra}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Grades Table */}
      <Card className="overflow-hidden rounded-2xl shadow-md">
        <div className="h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-600" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            {language === 'en' ? 'Recent Grades' : language === 'hi' ? 'हाल के ग्रेड' : 'الدرجات الأخيرة'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
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
              {grades.map((grade, idx) => {
                const percentage = grade.exam.total_marks 
                  ? Math.round((grade.marks_obtained / grade.exam.total_marks) * 100)
                  : grade.marks_obtained;
                
                return (
                  <motion.div 
                    key={grade.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                        <span className={`font-bold text-lg ${getGradeColor(grade.grade)}`}>
                          {grade.grade || '-'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{grade.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {getExamTypeLabel(grade.exam.exam_type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
