import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import ExamManagement from '@/components/features/ExamManagement';

export default function Exams() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Show exam management for teachers and admins
  if (user?.role === 'teacher' || user?.role === 'admin') {
    return <ExamManagement />;
  }

  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };

  const upcomingExams = [
    {
      id: '1',
      subject: getText('Mathematics', 'الرياضيات', 'गणित'),
      examType: getText('Midterm', 'اختبار منتصف الفصل', 'मध्यावधि'),
      date: '2024-03-15',
      time: getText('09:00 AM', '09:00 ص', '09:00 AM'),
      duration: getText('2 hours', 'ساعتان', '2 घंटे'),
      room: getText('Hall A', 'قاعة أ', 'हॉल A'),
      syllabus: getText('Chapters 1-5', 'الفصول 1-5', 'अध्याय 1-5'),
    },
    {
      id: '2',
      subject: getText('Physics', 'الفيزياء', 'भौतिकी'),
      examType: getText('Midterm', 'اختبار منتصف الفصل', 'मध्यावधि'),
      date: '2024-03-17',
      time: getText('09:00 AM', '09:00 ص', '09:00 AM'),
      duration: getText('2 hours', 'ساعتان', '2 घंटे'),
      room: getText('Hall B', 'قاعة ب', 'हॉल B'),
      syllabus: getText('Units 1-4', 'الوحدات 1-4', 'यूनिट 1-4'),
    },
    {
      id: '3',
      subject: getText('English', 'اللغة الإنجليزية', 'अंग्रेज़ी'),
      examType: getText('Midterm', 'اختبار منتصف الفصل', 'मध्यावधि'),
      date: '2024-03-19',
      time: getText('10:00 AM', '10:00 ص', '10:00 AM'),
      duration: getText('1.5 hours', 'ساعة ونصف', '1.5 घंटे'),
      room: getText('Hall A', 'قاعة أ', 'हॉल A'),
      syllabus: getText('Literature & Grammar', 'الأدب والقواعد', 'साहित्य और व्याकरण'),
    },
    {
      id: '4',
      subject: getText('Chemistry', 'الكيمياء', 'रसायन विज्ञान'),
      examType: getText('Lab Exam', 'اختبار عملي', 'प्रयोगशाला परीक्षा'),
      date: '2024-03-20',
      time: getText('02:00 PM', '02:00 م', '02:00 PM'),
      duration: getText('3 hours', '3 ساعات', '3 घंटे'),
      room: getText('Lab 2', 'مختبر 2', 'प्रयोगशाला 2'),
      syllabus: getText('Practical Experiments', 'التجارب العملية', 'व्यावहारिक प्रयोग'),
    },
  ];

  const downloadExamSchedule = () => {
    // Create CSV content
    const headers = getText(
      'Subject,Exam Type,Date,Time,Duration,Room,Syllabus',
      'المادة,نوع الامتحان,التاريخ,الوقت,المدة,القاعة,المنهج',
      'विषय,परीक्षा प्रकार,तारीख,समय,अवधि,कमरा,पाठ्यक्रम'
    ).split(',');
    
    const csvContent = [
      headers.join(','),
      ...upcomingExams.map(exam => 
        [exam.subject, exam.examType, exam.date, exam.time, exam.duration, exam.room, exam.syllabus].join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `exam_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(language === 'en' ? 'Exam schedule downloaded successfully' : language === 'hi' ? 'परीक्षा शेड्यूल सफलतापूर्वक डाउनलोड किया गया' : 'تم تنزيل جدول الامتحانات بنجاح');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.examSchedule')}</h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'View upcoming exam schedules' : language === 'hi' ? 'आगामी परीक्षा कार्यक्रम देखें' : 'عرض جداول الامتحانات القادمة'}
          </p>
        </div>
        <Button onClick={downloadExamSchedule} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Download Schedule' : language === 'hi' ? 'शेड्यूल डाउनलोड करें' : 'تنزيل الجدول'}
        </Button>
      </div>

      <div className="grid gap-4">
        {upcomingExams.map((exam) => (
          <Card key={exam.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{exam.subject}</CardTitle>
                  <Badge className="mt-1" variant="outline">{exam.examType}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{exam.date}</p>
                  <p className="text-xs text-muted-foreground">{exam.time}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Duration' : language === 'hi' ? 'अवधि' : 'المدة'}</p>
                    <p className="text-sm font-medium">{exam.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Location' : language === 'hi' ? 'स्थान' : 'المكان'}</p>
                    <p className="text-sm font-medium">{exam.room}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Syllabus' : language === 'hi' ? 'पाठ्यक्रम' : 'المنهج'}</p>
                    <p className="text-sm font-medium">{exam.syllabus}</p>
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