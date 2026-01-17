import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, FileText, Plus, Edit, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Exam {
  id: string;
  subject: string;
  examType: string;
  classId: string;
  className: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  syllabus: string;
  status: 'draft' | 'pending_approval' | 'approved';
  createdBy: string;
  approvedBy?: string;
  approvalDate?: string;
}

export default function ExamManagement() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [exams, setExams] = useState<Exam[]>([
    {
      id: '1',
      subject: 'Mathematics',
      examType: 'Midterm',
      classId: 'class-1',
      className: 'Grade 10A',
      date: '2024-03-15',
      time: '09:00 AM',
      duration: '2 hours',
      room: 'Hall A',
      syllabus: 'Chapters 1-5',
      status: 'approved',
      createdBy: 'teacher-1',
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    status: 'draft',
    createdBy: user?.id,
  });

  const classes = [
    { id: 'class-1', name: language === 'en' ? 'Grade 10A' : 'الصف العاشر أ' },
    { id: 'class-2', name: language === 'en' ? 'Grade 10B' : 'الصف العاشر ب' },
    { id: 'class-3', name: language === 'en' ? 'Grade 11A' : 'الصف الحادي عشر أ' },
  ];

  const handleAddExam = () => {
    const exam: Exam = {
      ...newExam as Exam,
      id: Date.now().toString(),
      createdBy: user?.id || '',
    };
    setExams([...exams, exam]);
    setIsAddDialogOpen(false);
    setNewExam({ status: 'draft', createdBy: user?.id });
    toast.success(language === 'en' ? 'Exam saved as draft' : language === 'hi' ? 'परीक्षा ड्राफ्ट के रूप में सहेजी गई' : 'تم حفظ الامتحان كمسودة');
  };

  const handleSubmitForApproval = (examId: string) => {
    setExams(exams.map(exam => 
      exam.id === examId ? { ...exam, status: 'pending_approval' as const } : exam
    ));
    toast.info(language === 'en' ? 'Exam submitted for approval' : language === 'hi' ? 'परीक्षा अनुमोदन के लिए जमा की गई' : 'تم إرسال الامتحان للموافقة');
  };

  const handleApproveExam = (examId: string) => {
    setExams(exams.map(exam => 
      exam.id === examId ? { 
        ...exam, 
        status: 'approved' as const,
        approvedBy: user?.id,
        approvalDate: new Date().toISOString()
      } : exam
    ));
    toast.success(language === 'en' ? 'Exam approved and notifications sent' : language === 'hi' ? 'परीक्षा स्वीकृत और सूचनाएं भेजी गईं' : 'تمت الموافقة على الامتحان وإرسال الإشعارات');
    setIsApprovalDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">{language === 'en' ? 'Draft' : language === 'hi' ? 'ड्राफ्ट' : 'مسودة'}</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{language === 'en' ? 'Pending Approval' : language === 'hi' ? 'अनुमोदन लंबित' : 'في انتظار الموافقة'}</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{language === 'en' ? 'Approved' : language === 'hi' ? 'स्वीकृत' : 'معتمد'}</Badge>;
      default:
        return null;
    }
  };

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {language === 'en' ? 'Exam Management' : language === 'hi' ? 'परीक्षा प्रबंधन' : 'إدارة الامتحانات'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Create and manage exam schedules' : language === 'hi' ? 'परीक्षा कार्यक्रम बनाएं और प्रबंधित करें' : 'إنشاء وإدارة جداول الامتحانات'}
          </p>
        </div>
        {isTeacher && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Add Exam' : language === 'hi' ? 'परीक्षा जोड़ें' : 'إضافة امتحان'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{language === 'en' ? 'Add New Exam' : language === 'hi' ? 'नई परीक्षा जोड़ें' : 'إضافة امتحان جديد'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Subject' : language === 'hi' ? 'विषय' : 'المادة'}</Label>
                    <Input
                      value={newExam.subject || ''}
                      onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Exam Type' : language === 'hi' ? 'परीक्षा प्रकार' : 'نوع الامتحان'}</Label>
                    <Select 
                      value={newExam.examType}
                      onValueChange={(value) => setNewExam({ ...newExam, examType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select type' : language === 'hi' ? 'प्रकार चुनें' : 'اختر النوع'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="midterm">{language === 'en' ? 'Midterm' : language === 'hi' ? 'मध्यावधि' : 'منتصف الفصل'}</SelectItem>
                        <SelectItem value="final">{language === 'en' ? 'Final' : language === 'hi' ? 'अंतिम' : 'نهائي'}</SelectItem>
                        <SelectItem value="quiz">{language === 'en' ? 'Quiz' : language === 'hi' ? 'प्रश्नोत्तरी' : 'اختبار قصير'}</SelectItem>
                        <SelectItem value="lab">{language === 'en' ? 'Lab Exam' : language === 'hi' ? 'प्रयोगशाला परीक्षा' : 'اختبار عملي'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Class' : language === 'hi' ? 'कक्षा' : 'الصف'}</Label>
                    <Select 
                      value={newExam.classId}
                      onValueChange={(value) => {
                        const selectedClass = classes.find(c => c.id === value);
                        setNewExam({ ...newExam, classId: value, className: selectedClass?.name });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select class' : language === 'hi' ? 'कक्षा चुनें' : 'اختر الصف'} />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Date' : language === 'hi' ? 'तारीख' : 'التاريخ'}</Label>
                    <Input
                      type="date"
                      value={newExam.date || ''}
                      onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Time' : language === 'hi' ? 'समय' : 'الوقت'}</Label>
                    <Input
                      type="time"
                      value={newExam.time || ''}
                      onChange={(e) => setNewExam({ ...newExam, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Duration' : language === 'hi' ? 'अवधि' : 'المدة'}</Label>
                    <Input
                      value={newExam.duration || ''}
                      onChange={(e) => setNewExam({ ...newExam, duration: e.target.value })}
                      placeholder={language === 'en' ? '2 hours' : language === 'hi' ? '2 घंटे' : 'ساعتان'}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Room' : language === 'hi' ? 'कमरा' : 'القاعة'}</Label>
                    <Input
                      value={newExam.room || ''}
                      onChange={(e) => setNewExam({ ...newExam, room: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>{language === 'en' ? 'Syllabus' : language === 'hi' ? 'पाठ्यक्रम' : 'المنهج'}</Label>
                  <Textarea
                    value={newExam.syllabus || ''}
                    onChange={(e) => setNewExam({ ...newExam, syllabus: e.target.value })}
                    placeholder={language === 'en' ? 'Enter syllabus details...' : language === 'hi' ? 'पाठ्यक्रम विवरण दर्ज करें...' : 'أدخل تفاصيل المنهج...'}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {language === 'en' ? 'Cancel' : language === 'hi' ? 'रद्द करें' : 'إلغاء'}
                </Button>
                <Button onClick={handleAddExam}>
                  {language === 'en' ? 'Save as Draft' : language === 'hi' ? 'ड्राफ्ट के रूप में सहेजें' : 'حفظ كمسودة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {exams.map((exam) => (
          <Card key={exam.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {exam.subject}
                    {getStatusBadge(exam.status)}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-1">
                    <Badge variant="outline">{exam.examType}</Badge>
                    <span className="text-sm text-muted-foreground">{exam.className}</span>
                  </div>
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
              
              {isTeacher && exam.status === 'draft' && exam.createdBy === user?.id && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Edit' : 'تعديل'}
                  </Button>
                  <Button size="sm" onClick={() => handleSubmitForApproval(exam.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Submit for Approval' : 'إرسال للموافقة'}
                  </Button>
                </div>
              )}
              
              {isAdmin && exam.status === 'pending_approval' && (
                <div className="mt-4 flex gap-2">
                  <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => setSelectedExam(exam)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {language === 'en' ? 'Approve' : language === 'hi' ? 'स्वीकृत करें' : 'موافقة'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{language === 'en' ? 'Approve Exam' : language === 'hi' ? 'परीक्षा स्वीकृत करें' : 'الموافقة على الامتحان'}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' 
                            ? 'Approving this exam will send notifications to all students and parents in the selected class.'
                            : language === 'hi'
                            ? 'इस परीक्षा को स्वीकृत करने से चयनित कक्षा के सभी छात्रों और अभिभावकों को सूचनाएं भेजी जाएंगी।'
                            : 'الموافقة على هذا الامتحان ستؤدي إلى إرسال إشعارات لجميع الطلاب وأولياء الأمور في الصف المحدد.'}
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                          {language === 'en' ? 'Cancel' : language === 'hi' ? 'रद्द करें' : 'إلغاء'}
                        </Button>
                        <Button onClick={() => selectedExam && handleApproveExam(selectedExam.id)}>
                          {language === 'en' ? 'Approve & Notify' : language === 'hi' ? 'स्वीकृत करें और सूचित करें' : 'موافقة وإشعار'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}