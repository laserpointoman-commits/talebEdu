import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import { format, isAfter, isBefore, isToday } from 'date-fns';

interface Exam {
  id: string;
  subject: string;
  exam_type: string;
  date: string;
  time: string;
  duration: string;
  room: string | null;
  total_marks: number | null;
}

export default function StudentExams() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
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

      // Get exams for student's class
      if (studentData.class_id) {
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('class_id', studentData.class_id)
          .order('date', { ascending: true });

        setExams(examsData || []);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  const now = new Date();
  const upcomingExams = exams.filter(e => isAfter(new Date(e.date), now) || isToday(new Date(e.date)));
  const pastExams = exams.filter(e => isBefore(new Date(e.date), now) && !isToday(new Date(e.date)));

  const getExamStatus = (date: string) => {
    const examDate = new Date(date);
    if (isToday(examDate)) return { label: language === 'ar' ? 'اليوم' : 'Today', variant: 'destructive' as const };
    if (isAfter(examDate, now)) return { label: language === 'ar' ? 'قادم' : 'Upcoming', variant: 'default' as const };
    return { label: language === 'ar' ? 'منتهي' : 'Completed', variant: 'secondary' as const };
  };

  const ExamCard = ({ exam }: { exam: Exam }) => {
    const status = getExamStatus(exam.date);
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{exam.subject}</h3>
              <Badge variant="outline" className="mt-1">{exam.exam_type}</Badge>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(exam.date), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {exam.time} ({exam.duration})
            </div>
            {exam.room && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="h-4 w-4" />
                {language === 'ar' ? `قاعة: ${exam.room}` : `Room: ${exam.room}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'الامتحانات' : 'Exams'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Upcoming Exams */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {language === 'ar' ? 'الامتحانات القادمة' : 'Upcoming Exams'}
        </h2>
        
        {upcomingExams.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد امتحانات قادمة' : 'No upcoming exams'}
              </p>
            </CardContent>
          </Card>
        ) : (
          upcomingExams.map(exam => <ExamCard key={exam.id} exam={exam} />)
        )}
      </div>

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">
            {language === 'ar' ? 'الامتحانات السابقة' : 'Past Exams'}
          </h2>
          {pastExams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      )}
    </div>
  );
}
