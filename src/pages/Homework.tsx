import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, Clock, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const homeworkSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(1000),
  dueDate: z.string().min(1, 'Due date is required'),
  class: z.string().min(1, 'Class is required'),
});

export default function Homework() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    class: '',
  });

  const homework = [
    {
      id: '1',
      subject: language === 'en' ? 'Mathematics' : 'الرياضيات',
      title: language === 'en' ? 'Algebra Problem Set' : 'مجموعة مسائل الجبر',
      description: language === 'en' ? 'Complete exercises 1-20 from Chapter 5' : 'أكمل التمارين 1-20 من الفصل 5',
      dueDate: '2024-03-15',
      status: 'pending',
      class: '10-A',
      teacher: language === 'en' ? 'Ahmed Hassan' : 'أحمد حسن',
    },
    {
      id: '2',
      subject: language === 'en' ? 'Physics' : 'الفيزياء',
      title: language === 'en' ? 'Lab Report' : 'تقرير المختبر',
      description: language === 'en' ? 'Write a detailed report on the pendulum experiment' : 'اكتب تقريرًا مفصلاً عن تجربة البندول',
      dueDate: '2024-03-13',
      status: 'submitted',
      class: '10-A',
      teacher: language === 'en' ? 'Ahmed Hassan' : 'أحمد حسن',
    },
    {
      id: '3',
      subject: language === 'en' ? 'English' : 'اللغة الإنجليزية',
      title: language === 'en' ? 'Essay Writing' : 'كتابة مقال',
      description: language === 'en' ? 'Write a 500-word essay on climate change' : 'اكتب مقالاً من 500 كلمة عن تغير المناخ',
      dueDate: '2024-03-12',
      status: 'overdue',
      class: '10-A',
      teacher: language === 'en' ? 'Fatima Al-Said' : 'فاطمة السعيد',
    },
  ];

  const handleAddHomework = () => {
    try {
      homeworkSchema.parse(formData);
      toast({
        title: language === 'en' ? 'Homework Added' : 'تم إضافة الواجب',
        description: language === 'en' ? 'Homework has been added successfully' : 'تم إضافة الواجب بنجاح',
      });
      setIsAddDialogOpen(false);
      setFormData({ subject: '', title: '', description: '', dueDate: '', class: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: language === 'en' ? 'Validation Error' : 'خطأ في التحقق',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">
          {language === 'en' ? 'Pending' : 'معلق'}
        </Badge>;
      case 'submitted':
        return <Badge className="bg-success/10 text-success">
          {language === 'en' ? 'Submitted' : 'مُسلّم'}
        </Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive">
          {language === 'en' ? 'Overdue' : 'متأخر'}
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.homework')}</h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage and track homework assignments' : 'إدارة وتتبع الواجبات المنزلية'}
          </p>
        </div>
        {user?.role === 'teacher' && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Homework' : 'إضافة واجب'}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {homework.map((hw) => (
          <Card key={hw.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{hw.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{hw.subject}</p>
                  </div>
                </div>
                {getStatusBadge(hw.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{hw.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {language === 'en' ? 'Due' : 'موعد التسليم'}: {hw.dueDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {hw.class}
                </span>
                {user?.role !== 'teacher' && (
                  <span>{language === 'en' ? 'Teacher' : 'المدرس'}: {hw.teacher}</span>
                )}
              </div>
              {user?.role === 'student' && hw.status === 'pending' && (
                <Button className="mt-3" size="sm">
                  {language === 'en' ? 'Submit Homework' : 'تسليم الواجب'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Homework Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Add Homework' : 'إضافة واجب'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="subject">{language === 'en' ? 'Subject' : 'المادة'}</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Mathematics' : 'مثال: الرياضيات'}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="title">{language === 'en' ? 'Title' : 'العنوان'}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Chapter 5 Exercises' : 'مثال: تمارين الفصل 5'}
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="description">{language === 'en' ? 'Description' : 'الوصف'}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'en' ? 'Detailed instructions...' : 'تعليمات مفصلة...'}
                maxLength={1000}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">{language === 'en' ? 'Due Date' : 'موعد التسليم'}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="class">{language === 'en' ? 'Class' : 'الصف'}</Label>
              <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select class' : 'اختر الصف'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10-A">10-A</SelectItem>
                  <SelectItem value="10-B">10-B</SelectItem>
                  <SelectItem value="11-A">11-A</SelectItem>
                  <SelectItem value="11-B">11-B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddHomework}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}