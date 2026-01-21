import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudents } from '@/contexts/StudentsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { Search, Edit, Nfc, ScanLine, UserPlus, Trash2, GraduationCap } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import StudentRegistration from '@/components/features/StudentRegistration';
import { supabase } from '@/integrations/supabase/client';
import { nfcService } from '@/services/nfcService';
import { StudentCard } from '@/components/students/StudentCard';
import { StudentProfileDialog } from '@/components/students/StudentProfileDialog';

export default function Students() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { students, addStudent, updateStudent, deleteStudent, searchStudents } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isNfcDialogOpen, setIsNfcDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [writingNfc, setWritingNfc] = useState<string | null>(null);
  
  // Confirmation dialog states
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

  // Fetch teacher's assigned classes if user is a teacher
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (profile?.role === 'teacher' && user) {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (teacher) {
          const { data: classes } = await supabase
            .from('teacher_classes')
            .select(`
              class_id,
              classes (
                id,
                name,
                grade,
                section,
                total_students
              )
            `)
            .eq('teacher_id', teacher.id);

          if (classes) {
            setTeacherClasses(classes.map(c => c.classes).filter(Boolean));
          }
        }
      }
    };

    fetchTeacherClasses();
  }, [user, profile]);

  // Generate unique NFC and barcode
  const generateNfcCode = () => {
    const timestamp = Date.now();
    return `NFC${timestamp.toString().slice(-6)}`;
  };
  
  const generateBarcode = () => {
    const timestamp = Date.now();
    return `BAR${timestamp.toString().slice(-6)}`;
  };

  // Filter students based on teacher's assigned classes
  let baseStudents = students;
  if (profile?.role === 'teacher' && teacherClasses.length > 0) {
    if (selectedClass) {
      // If a class is selected, show only students from that class
      baseStudents = students.filter(student => 
        student.class === selectedClass.name
      );
    } else {
      // If no class selected, don't show any students yet
      baseStudents = [];
    }
  }
  
  const filteredStudents = searchTerm ? 
    baseStudents.filter(student => 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
    ) : baseStudents;
  
  // Map the new student structure to the old one for compatibility
  const mappedStudents = filteredStudents.map(student => ({
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
    nameAr: `${student.firstNameAr} ${student.lastNameAr}`,
    email: student.email,
    class: student.className || student.class || '',
    classId: student.classId,
    className: student.className,
    grade: student.grade,
    nfcId: student.nfcId || '',
    barcode: student.barcode || '',
    phone: student.phone || '',
    parentPhone: student.parentPhone || '',
    address: student.address || '',
    profileImage: student.profileImage || '',
    dateOfBirth: student.dateOfBirth || '',
    bloodGroup: student.bloodGroup || '',
    allergies: student.allergies || '',
    emergencyContact: student.emergencyContact || '',
    emergencyContactName: student.emergencyContactName || '',
    nationality: student.nationality || '',
    gender: student.gender || '',
    medicalConditions: student.medicalConditions || '',
  }));

  const handleEdit = (student: any) => {
    // Convert the mapped student back to the full Student structure for editing
    const fullStudent = students.find(s => s.id === student.id);
    if (fullStudent) {
      setEditingStudent(fullStudent);
      setIsRegistrationOpen(true);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setIsRegistrationOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewProfile = (student: any) => {
    setSelectedStudent(student);
    setIsProfileDialogOpen(true);
  };

  const handleNfcScan = async () => {
    try {
      const tagData = await nfcService.readTag();
      const nfcId = tagData?.id?.trim();

      if (!nfcId) {
        toast({
          title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
          description: language === 'en' ? 'Could not read NFC tag' : language === 'hi' ? 'NFC टैग पढ़ नहीं सका' : 'لم يتم قراءة بطاقة NFC',
          variant: 'destructive',
        });
        return;
      }

      // Prefer current in-memory list first (fast)
      let foundStudent = mappedStudents.find((s) => s.nfcId === nfcId);

      // Fallback to database lookup (ensures it works even if list is filtered)
      if (!foundStudent) {
        const { data: dbStudent, error } = await supabase
          .from('students')
          .select('*')
          .eq('nfc_id', nfcId)
          .maybeSingle();

        if (error) throw error;

        if (dbStudent) {
          foundStudent = {
            id: dbStudent.id,
            name: `${dbStudent.first_name ?? ''} ${dbStudent.last_name ?? ''}`.trim(),
            nameAr: `${dbStudent.first_name_ar ?? dbStudent.first_name ?? ''} ${dbStudent.last_name_ar ?? dbStudent.last_name ?? ''}`.trim(),
            email: dbStudent.email,
            class: dbStudent.class ?? '',
            classId: (dbStudent as any).class_id ?? '',
            className: '',
            grade: dbStudent.grade ?? '',
            nfcId: dbStudent.nfc_id ?? nfcId,
            barcode: dbStudent.barcode ?? '',
            phone: dbStudent.phone ?? '',
            parentPhone: dbStudent.parent_phone ?? '',
            address: dbStudent.address ?? '',
            profileImage: dbStudent.profile_image ?? '',
            dateOfBirth: dbStudent.date_of_birth ?? '',
            bloodGroup: dbStudent.blood_group ?? '',
            allergies: dbStudent.allergies ?? '',
            emergencyContact: dbStudent.emergency_contact ?? '',
            emergencyContactName: dbStudent.emergency_contact_name ?? '',
            nationality: dbStudent.nationality ?? '',
            gender: dbStudent.gender ?? '',
            medicalConditions: dbStudent.medical_conditions ?? '',
          };
        }
      }

      if (foundStudent) {
        setSelectedStudent(foundStudent);
        setIsProfileDialogOpen(true);
        toast({
          title: language === 'en' ? 'NFC Scan Successful' : language === 'hi' ? 'NFC स्कैन सफल' : 'تم المسح بنجاح',
          description: language === 'en' ? `Found student: ${foundStudent.name}` : language === 'hi' ? `छात्र मिला: ${foundStudent.name}` : `تم العثور على: ${foundStudent.nameAr}`,
        });
      } else {
        toast({
          title: language === 'en' ? 'Not Found' : language === 'hi' ? 'नहीं मिला' : 'لم يتم العثور',
          description: language === 'en' ? 'No student found with this NFC ID' : language === 'hi' ? 'इस NFC ID के साथ कोई छात्र नहीं मिला' : 'لم يتم العثور على طالب بهذا المعرف',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleWriteNFC = async (student: any) => {
    if (!student.nfcId) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: language === 'en' ? 'No NFC ID assigned to this student' : language === 'hi' ? 'इस छात्र को कोई NFC ID नियुक्त नहीं है' : 'لم يتم تعيين رقم NFC لهذا الطالب',
        variant: "destructive"
      });
      return;
    }

    setWritingNfc(student.id);
    try {
      // Write minimal data to fit on NFC tag (most tags have 48-144 bytes)
      const success = await nfcService.writeTag({
        id: student.nfcId,
        type: 'student' as const,
        name: student.name.substring(0, 20), // Truncate to save space
      });
      
      if (success) {
        toast({
          title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجح',
          description: language === 'en' ? 'NFC tag written successfully' : language === 'hi' ? 'NFC टैग सफलतापूर्वक लिखा गया' : 'تم كتابة بطاقة NFC بنجاح',
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setWritingNfc(null);
    }
  };

  const canEdit = profile?.role === 'admin' || profile?.role === 'teacher';

  const handleDelete = (student: any) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      toast({
        title: language === 'en' ? 'Student Deleted' : language === 'hi' ? 'छात्र हटाया गया' : 'تم حذف الطالب',
        description: language === 'en' 
          ? `${studentToDelete.name} has been deleted successfully` 
          : language === 'hi'
          ? `${studentToDelete.name} को सफलतापूर्वक हटा दिया गया`
          : `تم حذف ${studentToDelete.name} بنجاح`,
      });
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };
  
  const confirmBulkDelete = () => {
    selectedStudents.forEach(id => deleteStudent(id));
    const count = selectedStudents.length;
    setSelectedStudents([]);
    
    toast({
      title: language === 'en' ? 'Deleted Successfully' : language === 'hi' ? 'सफलतापूर्वक हटाया गया' : 'تم الحذف بنجاح',
      description: language === 'en' 
        ? `${count} students have been deleted successfully` 
        : language === 'hi'
        ? `${count} छात्रों को सफलतापूर्वक हटा दिया गया`
        : `تم حذف ${count} طلاب بنجاح`,
    });
    
    setBulkDeleteConfirmOpen(false);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === mappedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(mappedStudents.map(s => s.id));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader
        title="Students"
        titleAr="الطلاب"
        titleHi="छात्र"
        subtitle="Manage and view all student profiles"
        subtitleAr="إدارة وعرض جميع ملفات الطلاب"
        subtitleHi="सभी छात्र प्रोफाइल प्रबंधित करें और देखें"
        actions={
          <div className="flex gap-2">
            {selectedStudents.length > 0 && user?.role === 'admin' && (
              <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                {language === 'en' ? `Delete (${selectedStudents.length})` : language === 'hi' ? `हटाएं (${selectedStudents.length})` : `حذف (${selectedStudents.length})`}
              </Button>
            )}
            <Button onClick={() => setIsRegistrationOpen(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              {t('students.addStudent')}
            </Button>
          </div>
        }
      />

      {/* Show class selection for teachers */}
      {profile?.role === 'teacher' && !selectedClass && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Select a Class' : language === 'hi' ? 'एक कक्षा चुनें' : 'اختر فصلاً'}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teacherClasses.map((cls) => (
                <Card 
                  key={cls.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setSelectedClass(cls)}
                >
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-6">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg">
                        {language === 'en' ? `Class ${cls.name}` : language === 'hi' ? `कक्षा ${cls.name}` : `الصف ${cls.name}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' ? `Grade ${cls.grade} - Section ${cls.section}` : language === 'hi' ? `ग्रेड ${cls.grade} - सेक्शन ${cls.section}` : `الصف ${cls.grade} - القسم ${cls.section}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cls.total_students || 0} {language === 'en' ? 'students' : language === 'hi' ? 'छात्र' : 'طالب'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Show back button if teacher has selected a class */}
      {profile?.role === 'teacher' && selectedClass && (
        <div className="flex items-center gap-4 mb-4">
          <Button 
            onClick={() => setSelectedClass(null)}
            variant="outline"
            size="sm"
          >
            {language === 'en' ? '← Back to Classes' : language === 'hi' ? '← कक्षाओं पर वापस जाएं' : '→ العودة إلى الفصول'}
          </Button>
          <div className="text-lg font-medium">
            {language === 'en' ? `Class ${selectedClass.name}` : language === 'hi' ? `कक्षा ${selectedClass.name}` : `الصف ${selectedClass.name}`} - 
            {language === 'en' ? ` Grade ${selectedClass.grade}` : language === 'hi' ? ` ग्रेड ${selectedClass.grade}` : ` الصف ${selectedClass.grade}`}
          </div>
        </div>
      )}

      {/* Show search bar only if not a teacher or if a class is selected */}
      {(profile?.role !== 'teacher' || selectedClass) && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={language === 'en' ? 'Search by name, NFC, or barcode...' : language === 'hi' ? 'नाम, NFC, या बारकोड से खोजें...' : 'البحث بالاسم أو NFC أو الباركود...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 number-display"
              dir="ltr"
            />
          </div>
          <Button variant="outline" onClick={handleNfcScan}>
            <Nfc className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Scan NFC' : language === 'hi' ? 'NFC स्कैन करें' : 'مسح NFC'}
          </Button>
        </div>
      )}

      {/* Show students grid only if not a teacher or if a class is selected */}
      {(profile?.role !== 'teacher' || selectedClass) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mappedStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              language={language}
              isSelected={selectedStudents.includes(student.id)}
              isAdmin={user?.role === 'admin' || profile?.role === 'admin'}
              canEdit={canEdit}
              writingNfc={writingNfc === student.id}
              onSelect={() => toggleStudentSelection(student.id)}
              onEdit={() => handleEdit(student)}
              onDelete={() => handleDelete(student)}
              onWriteNfc={() => handleWriteNFC(student)}
              onViewProfile={() => handleViewProfile(student)}
            />
          ))}
        </div>
      )}

      {/* StudentRegistration Modal for Add/Edit */}
      <StudentRegistration 
        isOpen={isRegistrationOpen}
        onClose={() => {
          setIsRegistrationOpen(false);
          setEditingStudent(null);
        }}
        editingStudent={editingStudent}
      />

      {/* Profile Dialog */}
      <StudentProfileDialog
        student={selectedStudent}
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        language={language}
        canEdit={canEdit}
        writingNfc={writingNfc === selectedStudent?.id}
        onWriteNfc={() => selectedStudent && handleWriteNFC(selectedStudent)}
        onEdit={() => {
          if (selectedStudent) {
            const fullStudent = students.find(s => s.id === selectedStudent.id);
            if (fullStudent) {
              setEditingStudent(fullStudent);
              setIsProfileDialogOpen(false);
              setIsRegistrationOpen(true);
            }
          }
        }}
        t={t}
      />

      {/* NFC Reading Dialog */}
      <Dialog open={isNfcDialogOpen} onOpenChange={setIsNfcDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Reading NFC Card...' : language === 'hi' ? 'NFC कार्ड पढ़ रहा है...' : 'قراءة بطاقة NFC...'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Nfc className="h-16 w-16 text-primary animate-pulse" />
            <p className="mt-4 text-muted-foreground">
              {language === 'en' ? 'Please tap the NFC card' : language === 'hi' ? 'कृपया NFC कार्ड टैप करें' : 'يرجى تقريب بطاقة NFC'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Confirm Bulk Deletion' : language === 'hi' ? 'सामूहिक हटाने की पुष्टि करें' : 'تأكيد الحذف الجماعي'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? `Are you sure you want to delete ${selectedStudents.length} selected students? This action cannot be undone.`
                : language === 'hi'
                ? `क्या आप वाकई ${selectedStudents.length} चयनित छात्रों को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।`
                : `هل أنت متأكد من حذف ${selectedStudents.length} طالب محدد؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : language === 'hi' ? 'रद्द करें' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? `Delete ${selectedStudents.length} Students` : language === 'hi' ? `${selectedStudents.length} छात्र हटाएं` : `حذف ${selectedStudents.length} طالب`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Student Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Confirm Delete' : language === 'hi' ? 'हटाने की पुष्टि करें' : 'تأكيد الحذف'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? `Are you sure you want to delete ${studentToDelete?.name}? This action cannot be undone.`
                : language === 'hi'
                ? `क्या आप वाकई ${studentToDelete?.name} को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।`
                : `هل أنت متأكد من حذف ${studentToDelete?.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToDelete(null)}>
              {language === 'en' ? 'Cancel' : language === 'hi' ? 'रद्द करें' : 'إلغاء'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? 'Delete' : language === 'hi' ? 'हटाएं' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}