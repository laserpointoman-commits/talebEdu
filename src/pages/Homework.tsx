import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, Clock, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import LogoLoader from '@/components/LogoLoader';

const homeworkSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(1000),
  dueDate: z.string().min(1, 'Due date is required'),
  class: z.string().min(1, 'Class is required'),
});

interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: 'pending' | 'submitted' | 'overdue';
  class: string;
  teacher: string;
}

export default function Homework() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    class: '',
  });

  useEffect(() => {
    loadHomework();
    loadClasses();
  }, [user, profile]);

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name, grade, section')
      .order('name');
    setClasses(data || []);
  };

  const loadHomework = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('homework')
        .select(`
          id,
          subject,
          title,
          description,
          due_date,
          classes (
            name,
            grade,
            section
          ),
          teachers (
            profiles (
              full_name,
              full_name_ar
            )
          )
        `)
        .order('due_date', { ascending: true });

      // If user is a student, filter by their class
      if (profile.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('class')
          .eq('profile_id', user.id)
          .single();

        if (studentData?.class) {
          const { data: classData } = await supabase
            .from('classes')
            .select('id')
            .eq('name', studentData.class)
            .single();

          if (classData) {
            query = query.eq('class_id', classData.id);
          }
        }
      }

      // If user is a teacher, filter by their assignments
      if (profile.role === 'teacher') {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('profile_id', user.id)
          .single();

        if (teacherData) {
          query = query.eq('assigned_by', teacherData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mapped: HomeworkItem[] = (data || []).map((item: any) => {
        const dueDate = new Date(item.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        let status: 'pending' | 'submitted' | 'overdue' = 'pending';
        if (dueDate < today) {
          status = 'overdue';
        }
        // In a real app, we'd check homework_submissions table for submitted status

        return {
          id: item.id,
          subject: item.subject || 'Unknown',
          title: item.title || 'Untitled',
          description: item.description,
          dueDate: item.due_date,
          status,
          class: item.classes 
            ? `${item.classes.grade}-${item.classes.section}`
            : '-',
          teacher: language === 'ar'
            ? (item.teachers?.profiles?.full_name_ar || item.teachers?.profiles?.full_name || '-')
            : (item.teachers?.profiles?.full_name || '-')
        };
      });

      setHomework(mapped);
    } catch (error) {
      console.error('Error loading homework:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHomework = async () => {
    try {
      homeworkSchema.parse(formData);
      
      // Get teacher ID
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (!teacherData) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: language === 'en' ? 'Teacher record not found' : language === 'hi' ? 'शिक्षक रिकॉर्ड नहीं मिला' : 'لم يتم العثور على سجل المعلم',
        variant: 'destructive',
      });
        return;
      }

      // Get class ID from class name
      const selectedClass = classes.find(c => `${c.grade}-${c.section}` === formData.class || c.name === formData.class);
      
      const { error } = await supabase
        .from('homework')
        .insert({
          subject: formData.subject,
          title: formData.title,
          description: formData.description,
          due_date: formData.dueDate,
          class_id: selectedClass?.id,
          assigned_by: teacherData.id
        });

      if (error) throw error;

      toast({
        title: language === 'en' ? 'Homework Added' : language === 'hi' ? 'होमवर्क जोड़ा गया' : 'تم إضافة الواجب',
        description: language === 'en' ? 'Homework has been added successfully' : language === 'hi' ? 'होमवर्क सफलतापूर्वक जोड़ा गया' : 'تم إضافة الواجب بنجاح',
      });
      setIsAddDialogOpen(false);
      setFormData({ subject: '', title: '', description: '', dueDate: '', class: '' });
      loadHomework();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: language === 'en' ? 'Validation Error' : language === 'hi' ? 'सत्यापन त्रुटि' : 'خطأ في التحقق',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Error adding homework:', error);
        toast({
          title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
          description: language === 'en' ? 'Failed to add homework' : language === 'hi' ? 'होमवर्क जोड़ने में विफल' : 'فشل في إضافة الواجب',
          variant: 'destructive',
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">
          {language === 'en' ? 'Pending' : language === 'hi' ? 'लंबित' : 'معلق'}
        </Badge>;
      case 'submitted':
        return <Badge className="bg-success/10 text-success">
          {language === 'en' ? 'Submitted' : language === 'hi' ? 'जमा किया गया' : 'مُسلّم'}
        </Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive">
          {language === 'en' ? 'Overdue' : language === 'hi' ? 'अतिदेय' : 'متأخر'}
        </Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.homework')}</h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage and track homework assignments' : language === 'hi' ? 'होमवर्क असाइनमेंट प्रबंधित और ट्रैक करें' : 'إدارة وتتبع الواجبات المنزلية'}
          </p>
        </div>
        {profile?.role === 'teacher' && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Homework' : language === 'hi' ? 'होमवर्क जोड़ें' : 'إضافة واجب'}
          </Button>
        )}
      </div>

      {homework.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{language === 'en' ? 'No homework assignments found' : language === 'hi' ? 'कोई होमवर्क असाइनमेंट नहीं मिला' : 'لا توجد واجبات منزلية'}</p>
          </CardContent>
        </Card>
      ) : (
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
                <p className="text-sm mb-3">{hw.description || (language === 'en' ? 'No description' : language === 'hi' ? 'कोई विवरण नहीं' : 'لا يوجد وصف')}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {language === 'en' ? 'Due' : language === 'hi' ? 'जमा करने की तारीख' : 'موعد التسليم'}: {new Date(hw.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'hi' ? 'hi-IN' : 'en-US')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {hw.class}
                  </span>
                  {profile?.role !== 'teacher' && (
                    <span>{language === 'en' ? 'Teacher' : language === 'hi' ? 'शिक्षक' : 'المدرس'}: {hw.teacher}</span>
                  )}
                </div>
                {profile?.role === 'student' && hw.status === 'pending' && (
                  <Button className="mt-3" size="sm">
                    {language === 'en' ? 'Submit Homework' : language === 'hi' ? 'होमवर्क जमा करें' : 'تسليم الواجب'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Homework Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Add Homework' : language === 'hi' ? 'होमवर्क जोड़ें' : 'إضافة واجب'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="subject">{language === 'en' ? 'Subject' : language === 'hi' ? 'विषय' : 'المادة'}</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Mathematics' : language === 'hi' ? 'जैसे, गणित' : 'مثال: الرياضيات'}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="title">{language === 'en' ? 'Title' : language === 'hi' ? 'शीर्षक' : 'العنوان'}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Chapter 5 Exercises' : language === 'hi' ? 'जैसे, अध्याय 5 अभ्यास' : 'مثال: تمارين الفصل 5'}
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="description">{language === 'en' ? 'Description' : language === 'hi' ? 'विवरण' : 'الوصف'}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'en' ? 'Detailed instructions...' : language === 'hi' ? 'विस्तृत निर्देश...' : 'تعليمات مفصلة...'}
                maxLength={1000}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">{language === 'en' ? 'Due Date' : language === 'hi' ? 'जमा करने की तारीख' : 'موعد التسليم'}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="class">{language === 'en' ? 'Class' : language === 'hi' ? 'कक्षा' : 'الصف'}</Label>
              <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select class' : language === 'hi' ? 'कक्षा चुनें' : 'اختر الصف'} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={`${cls.grade}-${cls.section}`}>
                      {cls.name} ({cls.grade}-{cls.section})
                    </SelectItem>
                  ))}
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
