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
  MapPin
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  nameAr?: string;
  class: string;
  section: string;
  rollNumber: string;
  email: string;
  phone: string;
  address: string;
  parentName: string;
  parentPhone: string;
  profileImage?: string;
  walletBalance: number;
  attendance: number;
}

interface Grade {
  id: string;
  subject: string;
  grade: string;
  score: number;
  examType: string;
  date: string;
  term: string;
  teacher: string;
  notes?: string;
}

interface StudentProfileProps {
  studentId: string;
  onClose?: () => void;
}

export default function StudentProfile({ studentId, onClose }: StudentProfileProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('grades');

  // Mock student data
  const student: Student = {
    id: studentId,
    name: 'Ahmed Ali',
    nameAr: 'أحمد علي',
    class: '10',
    section: 'A',
    rollNumber: '101',
    email: 'ahmed.ali@school.edu',
    phone: '+966 50 123 4567',
    address: 'Riyadh, Saudi Arabia',
    parentName: 'Ali Mohammed',
    parentPhone: '+966 50 987 6543',
    walletBalance: 250,
    attendance: 92
  };

  // Mock grades data
  const grades: Grade[] = [
    { 
      id: '1',
      subject: language === 'en' ? 'Mathematics' : 'الرياضيات', 
      grade: 'A', 
      score: 95, 
      examType: language === 'en' ? 'Midterm' : 'اختبار منتصف الفصل',
      date: '2024-03-01',
      term: language === 'en' ? 'First Term' : 'الفصل الأول',
      teacher: 'Mr. Hassan',
      notes: 'Excellent performance'
    },
    { 
      id: '2',
      subject: language === 'en' ? 'Physics' : 'الفيزياء', 
      grade: 'B+', 
      score: 88, 
      examType: language === 'en' ? 'Quiz' : 'اختبار قصير',
      date: '2024-03-05',
      term: language === 'en' ? 'First Term' : 'الفصل الأول',
      teacher: 'Dr. Sarah'
    },
    { 
      id: '3',
      subject: language === 'en' ? 'English' : 'اللغة الإنجليزية', 
      grade: 'A-', 
      score: 92, 
      examType: language === 'en' ? 'Assignment' : 'واجب',
      date: '2024-03-07',
      term: language === 'en' ? 'First Term' : 'الفصل الأول',
      teacher: 'Ms. Emily'
    }
  ];

  const overallGPA = 3.75;
  const totalCredits = 24;
  const rank = 5;
  const totalStudents = 150;

  const tabs = [
    { id: 'grades', label: language === 'en' ? 'Grades' : 'الدرجات', icon: GraduationCap },
    { id: 'wallet', label: language === 'en' ? 'Wallet' : 'المحفظة', icon: Wallet },
    { id: 'homework', label: language === 'en' ? 'Homework' : 'الواجبات', icon: BookOpen },
    { id: 'schedule', label: language === 'en' ? 'Schedule' : 'الجدول', icon: CalendarDays },
    { id: 'notes', label: language === 'en' ? 'Notes' : 'الملاحظات', icon: StickyNote },
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-warning';
    if (grade.startsWith('C')) return 'text-info';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Student Info Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{language === 'en' ? student.name : student.nameAr}</h2>
              <p className="text-muted-foreground">
                {language === 'en' ? 'Class' : 'الصف'} {student.class}-{student.section} | 
                {language === 'en' ? ' Roll' : ' رقم'} #{student.rollNumber}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="number-display">{student.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{language === 'en' ? 'Parent:' : 'ولي الأمر:'} {student.parentName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{student.address}</span>
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
                  {language === 'en' ? 'Attendance' : 'الحضور'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-info" />
                  <span className="text-2xl font-bold">{student.attendance}%</span>
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
              <div className="space-y-3">
                {grades.map((grade) => (
                  <div key={grade.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className={`font-bold text-lg ${getGradeColor(grade.grade)}`}>
                            {grade.grade}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-lg">{grade.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {grade.examType} • {grade.term}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === 'en' ? 'Teacher:' : 'المعلم:'} {grade.teacher}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{grade.score}%</p>
                        <p className="text-xs text-muted-foreground">{grade.date}</p>
                        {grade.notes && (
                          <Badge variant="secondary" className="mt-2">
                            {grade.notes}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={grade.score} className="mt-3" />
                  </div>
                ))}
              </div>
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
              <p className="text-3xl font-bold">{student.walletBalance} SAR</p>
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
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {language === 'en' ? `Assignment ${i}` : `الواجب ${i}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Mathematics' : 'الرياضيات'}
                    </p>
                  </div>
                  <Badge variant={i === 1 ? 'default' : 'secondary'}>
                    {i === 1 ? (language === 'en' ? 'Pending' : 'قيد الانتظار') : (language === 'en' ? 'Completed' : 'مكتمل')}
                  </Badge>
                </div>
              ))}
            </div>
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
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">
                  {language === 'en' ? 'Behavioral Note' : 'ملاحظة سلوكية'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 
                    'Student shows excellent participation in class activities.' : 
                    'يظهر الطالب مشاركة ممتازة في أنشطة الفصل.'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Mr. Hassan - 2024-03-15</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}