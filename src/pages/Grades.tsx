import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Award, FileText } from 'lucide-react';
import GradeManagement from '@/components/features/GradeManagement';
import StudentProfile from '@/components/features/StudentProfile';

export default function Grades() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const grades = [
    { 
      subject: language === 'en' ? 'Mathematics' : 'الرياضيات', 
      grade: 'A', 
      score: 95, 
      examType: language === 'en' ? 'Midterm' : 'اختبار منتصف الفصل', 
      date: '2024-03-01' 
    },
    { 
      subject: language === 'en' ? 'Physics' : 'الفيزياء', 
      grade: 'B+', 
      score: 88, 
      examType: language === 'en' ? 'Quiz' : 'اختبار قصير', 
      date: '2024-03-05' 
    },
    { 
      subject: language === 'en' ? 'English' : 'اللغة الإنجليزية', 
      grade: 'A-', 
      score: 92, 
      examType: language === 'en' ? 'Assignment' : 'واجب', 
      date: '2024-03-07' 
    },
    { 
      subject: language === 'en' ? 'Arabic' : 'اللغة العربية', 
      grade: 'A', 
      score: 94, 
      examType: language === 'en' ? 'Midterm' : 'اختبار منتصف الفصل', 
      date: '2024-03-01' 
    },
    { 
      subject: language === 'en' ? 'Chemistry' : 'الكيمياء', 
      grade: 'B', 
      score: 85, 
      examType: language === 'en' ? 'Lab Report' : 'تقرير المختبر', 
      date: '2024-03-08' 
    },
    { 
      subject: language === 'en' ? 'History' : 'التاريخ', 
      grade: 'A', 
      score: 96, 
      examType: language === 'en' ? 'Essay' : 'مقال', 
      date: '2024-03-06' 
    },
  ];

  const overallGPA = 3.75;
  const totalCredits = 24;
  const rank = 5;
  const totalStudents = 150;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-warning';
    if (grade.startsWith('C')) return 'text-info';
    return 'text-destructive';
  };

  // Check if user is teacher or admin - they can manage grades
  if (user?.role === 'teacher' || user?.role === 'admin') {
    return <GradeManagement />;
  }

  // For students and parents - show read-only grades view
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.grades')}</h2>
        <p className="text-muted-foreground">
          {language === 'en' ? 'View student grades' : 'عرض درجات الطلاب'}
        </p>
      </div>

      {/* Overview Stats */}
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
              <span className="text-2xl font-bold">{overallGPA}</span>
              <span className="text-sm text-muted-foreground">/ 4.0</span>
            </div>
            <Progress value={(overallGPA / 4) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Credits' : 'إجمالي الساعات'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{totalCredits}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Class Rank' : 'الترتيب في الفصل'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">{rank}</span>
              <span className="text-sm text-muted-foreground">/ {totalStudents}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Average Score' : 'متوسط الدرجة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-info" />
              <span className="text-2xl font-bold">91.5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'en' ? 'Recent Grades' : 'الدرجات الأخيرة'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {grades.map((grade, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className={`font-bold ${getGradeColor(grade.grade)}`}>{grade.grade}</span>
                  </div>
                  <div>
                    <p className="font-medium">{grade.subject}</p>
                    <p className="text-sm text-muted-foreground">{grade.examType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{grade.score}%</p>
                    <p className="text-xs text-muted-foreground">{grade.date}</p>
                  </div>
                  <Progress value={grade.score} className="w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}