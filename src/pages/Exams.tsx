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

  const upcomingExams = [
    {
      id: '1',
      subject: language === 'en' ? 'Mathematics' : 'الرياضيات',
      examType: language === 'en' ? 'Midterm' : 'اختبار منتصف الفصل',
      date: '2024-03-15',
      time: language === 'en' ? '09:00 AM' : '09:00 ص',
      duration: language === 'en' ? '2 hours' : 'ساعتان',
      room: language === 'en' ? 'Hall A' : 'قاعة أ',
      syllabus: language === 'en' ? 'Chapters 1-5' : 'الفصول 1-5',
    },
    {
      id: '2',
      subject: language === 'en' ? 'Physics' : 'الفيزياء',
      examType: language === 'en' ? 'Midterm' : 'اختبار منتصف الفصل',
      date: '2024-03-17',
      time: language === 'en' ? '09:00 AM' : '09:00 ص',
      duration: language === 'en' ? '2 hours' : 'ساعتان',
      room: language === 'en' ? 'Hall B' : 'قاعة ب',
      syllabus: language === 'en' ? 'Units 1-4' : 'الوحدات 1-4',
    },
    {
      id: '3',
      subject: language === 'en' ? 'English' : 'اللغة الإنجليزية',
      examType: language === 'en' ? 'Midterm' : 'اختبار منتصف الفصل',
      date: '2024-03-19',
      time: language === 'en' ? '10:00 AM' : '10:00 ص',
      duration: language === 'en' ? '1.5 hours' : 'ساعة ونصف',
      room: language === 'en' ? 'Hall A' : 'قاعة أ',
      syllabus: language === 'en' ? 'Literature & Grammar' : 'الأدب والقواعد',
    },
    {
      id: '4',
      subject: language === 'en' ? 'Chemistry' : 'الكيمياء',
      examType: language === 'en' ? 'Lab Exam' : 'اختبار عملي',
      date: '2024-03-20',
      time: language === 'en' ? '02:00 PM' : '02:00 م',
      duration: language === 'en' ? '3 hours' : '3 ساعات',
      room: language === 'en' ? 'Lab 2' : 'مختبر 2',
      syllabus: language === 'en' ? 'Practical Experiments' : 'التجارب العملية',
    },
  ];

  const downloadExamSchedule = () => {
    // Create CSV content
    const headers = language === 'en' 
      ? ['Subject', 'Exam Type', 'Date', 'Time', 'Duration', 'Room', 'Syllabus']
      : ['المادة', 'نوع الامتحان', 'التاريخ', 'الوقت', 'المدة', 'القاعة', 'المنهج'];
    
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

    toast.success(language === 'en' ? 'Exam schedule downloaded successfully' : 'تم تنزيل جدول الامتحانات بنجاح');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.examSchedule')}</h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'View upcoming exam schedules' : 'عرض جداول الامتحانات القادمة'}
          </p>
        </div>
        <Button onClick={downloadExamSchedule} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Download Schedule' : 'تنزيل الجدول'}
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
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Duration' : 'المدة'}</p>
                    <p className="text-sm font-medium">{exam.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Location' : 'المكان'}</p>
                    <p className="text-sm font-medium">{exam.room}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === 'en' ? 'Syllabus' : 'المنهج'}</p>
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