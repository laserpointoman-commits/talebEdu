import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Filter,
  Plus
} from 'lucide-react';
import StudentProfile from './StudentProfile';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  name: string;
  nameAr?: string;
  class: string;
  section: string;
  rollNumber: string;
  profileImage?: string;
  nfcId?: string;
}

interface Grade {
  id?: string;
  studentId: string;
  subject: string;
  score: number;
  grade: string;
  examType: string;
  term: string;
  date: string;
  notes?: string;
  status: 'draft' | 'approved';
  teacherId: string;
  teacherName: string;
}

export default function GradeManagement() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);

  // Form state for grade entry
  const [gradeForm, setGradeForm] = useState<Partial<Grade>>({
    subject: '',
    score: 0,
    examType: '',
    term: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'draft'
  });

  // Fetch students based on teacher's assigned classes
  useEffect(() => {
    const fetchTeacherStudents = async () => {
      if (!user || profile?.role !== 'teacher') return;

      // Get teacher ID
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!teacher) return;

      // Get teacher's assigned classes
      const { data: classes } = await supabase
        .from('teacher_classes')
        .select(`
          class_id,
          classes (
            id,
            name,
            grade,
            section
          )
        `)
        .eq('teacher_id', teacher.id);

      if (classes) {
        setTeacherClasses(classes.map(c => c.classes));
        
        // Fetch students from these classes
        const classNames = classes.map(c => c.classes?.name).filter(Boolean);
        const { data: studentsData } = await supabase
          .from('students')
          .select(`
            *,
            profiles!students_profile_id_fkey (
              full_name,
              full_name_ar,
              email
            )
          `)
          .in('class', classNames);

        if (studentsData) {
          const mappedStudents = studentsData.map(s => ({
            id: s.id,
            name: s.profiles?.full_name || 'Unknown',
            nameAr: s.profiles?.full_name_ar,
            class: s.class || '',
            section: '',
            rollNumber: s.nfc_id || '',
            nfcId: s.nfc_id
          }));
          setStudents(mappedStudents);
        }
      }
    };

    fetchTeacherStudents();
  }, [user, profile]);

  const subjects = [
    { value: 'math', label: language === 'en' ? 'Mathematics' : 'الرياضيات' },
    { value: 'physics', label: language === 'en' ? 'Physics' : 'الفيزياء' },
    { value: 'chemistry', label: language === 'en' ? 'Chemistry' : 'الكيمياء' },
    { value: 'english', label: language === 'en' ? 'English' : 'اللغة الإنجليزية' },
    { value: 'arabic', label: language === 'en' ? 'Arabic' : 'اللغة العربية' },
    { value: 'history', label: language === 'en' ? 'History' : 'التاريخ' },
    { value: 'biology', label: language === 'en' ? 'Biology' : 'الأحياء' },
  ];

  const examTypes = [
    { value: 'midterm', label: language === 'en' ? 'Midterm Exam' : 'اختبار منتصف الفصل' },
    { value: 'final', label: language === 'en' ? 'Final Exam' : 'الاختبار النهائي' },
    { value: 'quiz', label: language === 'en' ? 'Quiz' : 'اختبار قصير' },
    { value: 'assignment', label: language === 'en' ? 'Assignment' : 'واجب' },
    { value: 'project', label: language === 'en' ? 'Project' : 'مشروع' },
    { value: 'lab', label: language === 'en' ? 'Lab Report' : 'تقرير المختبر' },
    { value: 'presentation', label: language === 'en' ? 'Presentation' : 'عرض تقديمي' },
  ];

  const terms = [
    { value: 'first', label: language === 'en' ? 'First Term' : 'الفصل الأول' },
    { value: 'second', label: language === 'en' ? 'Second Term' : 'الفصل الثاني' },
    { value: 'third', label: language === 'en' ? 'Third Term' : 'الفصل الثالث' },
  ];

  const classes = ['10', '11', '12'];

  const calculateGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.nameAr?.includes(searchTerm) ||
                         student.rollNumber.includes(searchTerm) ||
                         student.nfcId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleAddGrade = (student: Student) => {
    setSelectedStudent(student);
    setGradeForm({
      subject: '',
      score: 0,
      examType: '',
      term: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'draft'
    });
    setEditingGrade(null);
    setShowGradeDialog(true);
  };

  const handleEditGrade = (student: Student, grade: Grade) => {
    setSelectedStudent(student);
    setGradeForm(grade);
    setEditingGrade(grade);
    setShowGradeDialog(true);
  };

  const handleSaveGrade = (approve: boolean = false) => {
    if (!selectedStudent || !gradeForm.subject || !gradeForm.examType || !gradeForm.term) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Please fill all required fields' : 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    const grade: Grade = {
      ...gradeForm as Grade,
      studentId: selectedStudent.id,
      grade: calculateGrade(gradeForm.score || 0),
      status: approve ? 'approved' : 'draft',
      teacherId: user?.id || '',
      teacherName: profile?.full_name || ''
    };

    toast({
      title: approve ? 
        (language === 'en' ? 'Grade Approved' : 'تم اعتماد الدرجة') :
        (language === 'en' ? 'Grade Saved as Draft' : 'تم حفظ الدرجة كمسودة'),
      description: language === 'en' ? 
        `Grade for ${selectedStudent.name} has been ${approve ? 'approved' : 'saved'}` :
        `تم ${approve ? 'اعتماد' : 'حفظ'} درجة ${selectedStudent.nameAr || selectedStudent.name}`
    });

    setShowGradeDialog(false);
    setSelectedStudent(null);
    setGradeForm({});
  };

  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setShowProfileDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {language === 'en' ? 'Grade Management' : 'إدارة الدرجات'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'en' ? 
            'Add, edit and approve student grades' : 
            'إضافة وتعديل واعتماد درجات الطلاب'}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'en' ? 'Search by name, roll number or NFC...' : 'البحث بالاسم أو الرقم أو NFC...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'en' ? 'Select Class' : 'اختر الصف'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'en' ? 'All Classes' : 'جميع الصفوف'}</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>
                    {language === 'en' ? `Class ${cls}` : `الصف ${cls}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'en' ? 'Select Subject' : 'اختر المادة'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'en' ? 'All Subjects' : 'جميع المواد'}</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {language === 'en' ? student.name : student.nameAr}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Class' : 'الصف'} {student.class}-{student.section} | 
                      {language === 'en' ? ' Roll' : ' رقم'} #{student.rollNumber}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Recent Grades Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === 'en' ? 'Mathematics' : 'الرياضيات'}
                  </span>
                  <Badge variant="secondary">A+</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === 'en' ? 'Physics' : 'الفيزياء'}
                  </span>
                  <Badge variant="secondary">B+</Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleAddGrade(student)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Add Grade' : 'إضافة درجة'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleViewProfile(student)}
                >
                  {language === 'en' ? 'View Profile' : 'عرض الملف'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grade Entry Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? 
                (language === 'en' ? 'Edit Grade' : 'تعديل الدرجة') :
                (language === 'en' ? 'Add New Grade' : 'إضافة درجة جديدة')}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {language === 'en' ? selectedStudent.name : selectedStudent.nameAr}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Class' : 'الصف'} {selectedStudent.class}-{selectedStudent.section}
                  </p>
                </div>
              </div>

              {/* Grade Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Subject' : 'المادة'} *</Label>
                  <Select 
                    value={gradeForm.subject} 
                    onValueChange={(value) => setGradeForm({...gradeForm, subject: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'en' ? 'Select subject' : 'اختر المادة'} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Exam Type' : 'نوع الاختبار'} *</Label>
                  <Select 
                    value={gradeForm.examType} 
                    onValueChange={(value) => setGradeForm({...gradeForm, examType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'en' ? 'Select type' : 'اختر النوع'} />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Term' : 'الفصل الدراسي'} *</Label>
                  <Select 
                    value={gradeForm.term} 
                    onValueChange={(value) => setGradeForm({...gradeForm, term: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'en' ? 'Select term' : 'اختر الفصل'} />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map(term => (
                        <SelectItem key={term.value} value={term.value}>
                          {term.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Date' : 'التاريخ'} *</Label>
                  <Input 
                    type="date" 
                    value={gradeForm.date}
                    onChange={(e) => setGradeForm({...gradeForm, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Score (%)' : 'الدرجة (%)'} *</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({...gradeForm, score: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Letter Grade' : 'التقدير'}</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                    <span className="font-medium">
                      {calculateGrade(gradeForm.score || 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>{language === 'en' ? 'Notes (Optional)' : 'ملاحظات (اختياري)'}</Label>
                  <Textarea 
                    rows={3}
                    placeholder={language === 'en' ? 
                      'Add any additional notes or comments...' : 
                      'أضف أي ملاحظات أو تعليقات إضافية...'}
                    value={gradeForm.notes}
                    onChange={(e) => setGradeForm({...gradeForm, notes: e.target.value})}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowGradeDialog(false)}>
                  <X className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Cancel' : 'إلغاء'}
                </Button>
                <Button variant="secondary" onClick={() => handleSaveGrade(false)}>
                  <Save className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Save as Draft' : 'حفظ كمسودة'}
                </Button>
                <Button onClick={() => handleSaveGrade(true)}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Approve & Submit' : 'اعتماد وإرسال'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <StudentProfile 
              studentId={selectedStudent.id}
              onClose={() => setShowProfileDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}