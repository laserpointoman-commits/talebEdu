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
import { Search, Edit, Nfc, ScanLine, UserPlus, Trash2, GraduationCap } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import StudentRegistration from '@/components/features/StudentRegistration';
import { supabase } from '@/integrations/supabase/client';

// Removed mock students - using StudentsContext instead

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
    class: student.class,
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

  const handleNfcRead = () => {
    setIsNfcDialogOpen(true);
    // Simulate NFC reading
    setTimeout(() => {
      const randomStudent = mappedStudents[Math.floor(Math.random() * mappedStudents.length)];
      setSelectedStudent(randomStudent);
      setIsNfcDialogOpen(false);
      setIsProfileDialogOpen(true);
      toast({
        title: 'NFC Read Successful',
        description: `Found student: ${randomStudent.name}`,
      });
    }, 2000);
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
        title: language === 'en' ? 'Student Deleted' : 'تم حذف الطالب',
        description: language === 'en' 
          ? `${studentToDelete.name} has been deleted successfully` 
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
      title: language === 'en' ? 'Deleted Successfully' : 'تم الحذف بنجاح',
      description: language === 'en' 
        ? `${count} students have been deleted successfully` 
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.students')}</h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Manage and view all student profiles' : 'إدارة وعرض جميع ملفات الطلاب'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedStudents.length > 0 && user?.role === 'admin' && (
            <Button onClick={handleBulkDelete} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'en' 
                ? `Delete (${selectedStudents.length})` 
                : `حذف (${selectedStudents.length})`}
            </Button>
          )}
          <Button onClick={handleNfcRead} variant="outline">
            <Nfc className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Read NFC' : 'قراءة NFC'}
          </Button>
          <Button onClick={handleAddStudent}>
            <UserPlus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Student' : 'إضافة طالب'}
          </Button>
        </div>
      </div>

      {/* Show class selection for teachers */}
      {profile?.role === 'teacher' && !selectedClass && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Select a Class' : 'اختر فصلاً'}
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
                        {language === 'en' ? `Class ${cls.name}` : `الصف ${cls.name}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' ? `Grade ${cls.grade} - Section ${cls.section}` : `الصف ${cls.grade} - القسم ${cls.section}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cls.total_students || 0} {language === 'en' ? 'students' : 'طالب'}
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
            {language === 'en' ? '← Back to Classes' : '→ العودة إلى الفصول'}
          </Button>
          <div className="text-lg font-medium">
            {language === 'en' ? `Class ${selectedClass.name}` : `الصف ${selectedClass.name}`} - 
            {language === 'en' ? ` Grade ${selectedClass.grade}` : ` الصف ${selectedClass.grade}`}
          </div>
        </div>
      )}

      {/* Show search bar only if not a teacher or if a class is selected */}
      {(profile?.role !== 'teacher' || selectedClass) && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={language === 'en' ? 'Search by name, NFC, or barcode...' : 'البحث بالاسم أو NFC أو الباركود...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 number-display"
              dir="ltr"
            />
          </div>
          <Button variant="outline">
            <ScanLine className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Scan Barcode' : 'مسح الباركود'}
          </Button>
        </div>
      )}

      {/* Show students grid only if not a teacher or if a class is selected */}
      {(profile?.role !== 'teacher' || selectedClass) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mappedStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow relative">
            {user?.role === 'admin' && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={() => toggleStudentSelection(student.id)}
                />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.profileImage} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {language === 'en' ? student.name : student.nameAr}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{student.class}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(student)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NFC ID:</span>
                  <span className="font-medium">{student.nfcId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.status')}:</span>
                  <span className="text-success font-medium">{t('common.active')}</span>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => handleViewProfile(student)}
              >
                {language === 'en' ? 'View Full Profile' : 'عرض الملف الكامل'}
              </Button>
            </CardContent>
          </Card>
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
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Student Profile' : 'ملف الطالب'}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={selectedStudent.profileImage} />
                  <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold">
                    {language === 'en' ? selectedStudent.name : selectedStudent.nameAr}
                  </h3>
                  <p className="text-muted-foreground number-display">{selectedStudent.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('parent.grade')}: <span className="number-display">{selectedStudent.grade}</span> | {t('common.class')}: <span className="number-display">{selectedStudent.class}</span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('common.nfcId')}</Label>
                  <p className="font-medium number-display">{selectedStudent.nfcId || (language === 'ar' ? 'لم يتم تعيين' : 'Not assigned')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('common.barcode')}</Label>
                  <p className="font-medium number-display">{selectedStudent.barcode || (language === 'ar' ? 'لم يتم تعيين' : 'Not assigned')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('common.phone')}</Label>
                  <p className="font-medium number-display">{selectedStudent.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('common.parentPhone')}</Label>
                  <p className="font-medium number-display">{selectedStudent.parentPhone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('common.dateOfBirth')}</Label>
                  <p className="font-medium number-display">{selectedStudent.dateOfBirth || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('common.bloodGroup')}</Label>
                  <p className="font-medium">{selectedStudent.bloodGroup || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'ar' ? 'الجنسية' : 'Nationality'}</Label>
                  <p className="font-medium">{selectedStudent.nationality || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'ar' ? 'الجنس' : 'Gender'}</Label>
                  <p className="font-medium">{selectedStudent.gender || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">{t('common.address')}</Label>
                  <p className="font-medium">{selectedStudent.address || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'ar' ? 'جهة الاتصال الطارئة' : 'Emergency Contact'}</Label>
                  <p className="font-medium">{selectedStudent.emergencyContactName || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'ar' ? 'هاتف الطوارئ' : 'Emergency Phone'}</Label>
                  <p className="font-medium number-display">{selectedStudent.emergencyContact || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">{language === 'ar' ? 'الحالة الطبية' : 'Medical Conditions'}</Label>
                  <p className="font-medium">{selectedStudent.medicalConditions || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">{t('common.allergies')}</Label>
                  <p className="font-medium">{selectedStudent.allergies || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NFC Reading Dialog */}
      <Dialog open={isNfcDialogOpen} onOpenChange={setIsNfcDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Reading NFC Card...' : 'قراءة بطاقة NFC...'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Nfc className="h-16 w-16 text-primary animate-pulse" />
            <p className="mt-4 text-muted-foreground">
              {language === 'en' ? 'Please tap the NFC card' : 'يرجى تقريب بطاقة NFC'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Confirm Bulk Deletion' : 'تأكيد الحذف الجماعي'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? `Are you sure you want to delete ${selectedStudents.length} selected students? This action cannot be undone.`
                : `هل أنت متأكد من حذف ${selectedStudents.length} طالب محدد؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? `Delete ${selectedStudents.length} Students` : `حذف ${selectedStudents.length} طالب`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Student Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Confirm Delete' : 'تأكيد الحذف'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? `Are you sure you want to delete ${studentToDelete?.name}? This action cannot be undone.`
                : `هل أنت متأكد من حذف ${studentToDelete?.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToDelete(null)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? 'Delete' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}