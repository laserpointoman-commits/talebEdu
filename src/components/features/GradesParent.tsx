import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, GraduationCap, Calendar, Clock, BookOpen, TrendingUp, Award } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  nameAr: string;
  grade: string;
  class: string;
  image?: string;
}

export default function GradesParent() {
  const { language } = useLanguage();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const students: Student[] = [
    {
      id: '1',
      name: 'Mohammed Ali',
      nameAr: 'محمد علي',
      grade: 'Grade 10',
      class: '10A',
      image: undefined,
    },
    {
      id: '2',
      name: 'Fatima Ali',
      nameAr: 'فاطمة علي',
      grade: 'Grade 8',
      class: '8B',
      image: undefined,
    },
  ];

  const studentGrades = {
    '1': {
      gpa: 3.75,
      rank: 5,
      totalStudents: 30,
      grades: [
        { subject: language === 'en' ? 'Mathematics' : 'الرياضيات', grade: 'A', score: 92, examType: language === 'en' ? 'Midterm' : 'منتصف الفصل' },
        { subject: language === 'en' ? 'Physics' : 'الفيزياء', grade: 'B+', score: 87, examType: language === 'en' ? 'Quiz' : 'اختبار قصير' },
        { subject: language === 'en' ? 'English' : 'اللغة الإنجليزية', grade: 'A-', score: 90, examType: language === 'en' ? 'Assignment' : 'واجب' },
      ],
      upcomingExams: [
        { subject: language === 'en' ? 'Chemistry' : 'الكيمياء', date: '2024-03-20', time: '9:00 AM' },
        { subject: language === 'en' ? 'History' : 'التاريخ', date: '2024-03-22', time: '11:00 AM' },
      ],
    },
    '2': {
      gpa: 3.85,
      rank: 3,
      totalStudents: 28,
      grades: [
        { subject: language === 'en' ? 'Mathematics' : 'الرياضيات', grade: 'A+', score: 95, examType: language === 'en' ? 'Midterm' : 'منتصف الفصل' },
        { subject: language === 'en' ? 'Science' : 'العلوم', grade: 'A', score: 93, examType: language === 'en' ? 'Lab Report' : 'تقرير المختبر' },
        { subject: language === 'en' ? 'Arabic' : 'اللغة العربية', grade: 'A-', score: 89, examType: language === 'en' ? 'Essay' : 'مقال' },
      ],
      upcomingExams: [
        { subject: language === 'en' ? 'Geography' : 'الجغرافيا', date: '2024-03-21', time: '10:00 AM' },
        { subject: language === 'en' ? 'Computer Science' : 'علوم الحاسوب', date: '2024-03-23', time: '2:00 PM' },
      ],
    },
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

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
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={student.image} />
                    <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {language === 'en' ? student.name : student.nameAr}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">{student.grade}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Class' : 'الصف'} {student.class}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        GPA: {studentGrades[student.id as keyof typeof studentGrades].gpa}
                      </span>
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

  const currentStudentGrades = studentGrades[selectedStudent.id as keyof typeof studentGrades];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedStudent(null)}
            className="mb-2"
          >
            ← {language === 'en' ? 'Back to Students' : 'العودة إلى الطلاب'}
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'en' ? selectedStudent.name : selectedStudent.nameAr}
          </h2>
          <p className="text-muted-foreground">
            {selectedStudent.grade} - {language === 'en' ? 'Class' : 'الصف'} {selectedStudent.class}
          </p>
        </div>
      </div>

      <Tabs defaultValue="grades" className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className={language === 'ar' ? 'flex-row-reverse' : ''}>
          <TabsTrigger value="grades">
            <GraduationCap className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Grades' : 'الدرجات'}
          </TabsTrigger>
          <TabsTrigger value="exams">
            <Calendar className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Upcoming Exams' : 'الامتحانات القادمة'}
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Schedule' : 'الجدول'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'en' ? 'GPA' : 'المعدل'}</p>
                    <p className="text-2xl font-bold">{currentStudentGrades.gpa}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'en' ? 'Class Rank' : 'الترتيب'}</p>
                    <p className="text-2xl font-bold">
                      {currentStudentGrades.rank}/{currentStudentGrades.totalStudents}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'en' ? 'Subjects' : 'المواد'}</p>
                    <p className="text-2xl font-bold">{currentStudentGrades.grades.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Recent Grades' : 'الدرجات الأخيرة'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentStudentGrades.grades.map((grade, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{grade.subject}</p>
                        <p className="text-xs text-muted-foreground">{grade.examType}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${getGradeColor(grade.grade)}`}>
                          {grade.grade}
                        </span>
                        <p className="text-sm text-muted-foreground">{grade.score}%</p>
                      </div>
                    </div>
                    <Progress value={grade.score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          {currentStudentGrades.upcomingExams.map((exam, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{exam.subject}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{exam.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{exam.time}</span>
                      </div>
                    </div>
                  </div>
                  <Badge>{language === 'en' ? 'Upcoming' : 'قادم'}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                {language === 'en' ? 'Class schedule will be displayed here' : 'سيتم عرض جدول الحصص هنا'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}