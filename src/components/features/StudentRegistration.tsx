import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudents } from '@/contexts/StudentsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Camera, Upload, User, School, Phone, MapPin, Calendar, AlertCircle, Bus, Utensils, ShoppingBag, FileText, Edit, Save, X, Trash2, GraduationCap, Users, Heart, CheckSquare, BookmarkCheck } from 'lucide-react';
import { z } from 'zod';

// Validation schema
const studentSchema = z.object({
  // Basic Information
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  firstNameAr: z.string().trim().min(1, 'Arabic first name is required').max(50),
  lastNameAr: z.string().trim().min(1, 'Arabic last name is required').max(50),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required' }),
  nationality: z.string().min(1, 'Nationality is required'),
  civilId: z.string().trim().min(1, 'Civil ID is required').max(20),
  
  // Academic Information
  grade: z.string().min(1, 'Grade is required'),
  class: z.string().min(1, 'Class is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  previousSchool: z.string().optional(),
  
  // Contact Information
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().regex(/^\+968\s?\d{4}\s?\d{4}$/, 'Invalid phone number'),
  address: z.string().trim().min(1, 'Address is required').max(200),
  
  // Parent/Guardian Information
  parentName: z.string().trim().min(1, 'Parent name is required').max(100),
  parentNameAr: z.string().trim().min(1, 'Arabic parent name is required').max(100),
  parentPhone: z.string().trim().regex(/^\+968\s?\d{4}\s?\d{4}$/, 'Invalid parent phone'),
  parentEmail: z.string().trim().email('Invalid parent email').max(255),
  parentOccupation: z.string().optional(),
  relationship: z.string().min(1, 'Relationship is required'),
  
  // Medical Information
  bloodGroup: z.string().min(1, 'Blood group is required'),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  medications: z.string().optional(),
  emergencyContact: z.string().trim().regex(/^\+968\s?\d{4}\s?\d{4}$/, 'Invalid emergency contact'),
  emergencyContactName: z.string().trim().min(1, 'Emergency contact name is required'),
  
  // Agreements
  transportationAgreement: z.boolean(),
});

interface StudentRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent?: any;
}

// Students are now fetched from StudentsContext - no mock data needed

export default function StudentRegistration({ isOpen, onClose, editingStudent }: StudentRegistrationProps) {
  const { language } = useLanguage();
  const { students, addStudent, updateStudent, deleteStudent } = useStudents();
  const [activeTab, setActiveTab] = useState('basic');
  const [profileImage, setProfileImage] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Load data when editing student changes
  useEffect(() => {
    if (editingStudent) {
      setFormData({
        firstName: editingStudent.firstName || '',
        lastName: editingStudent.lastName || '',
        firstNameAr: editingStudent.firstNameAr || '',
        lastNameAr: editingStudent.lastNameAr || '',
        dateOfBirth: editingStudent.dateOfBirth || '',
        gender: editingStudent.gender || '',
        nationality: editingStudent.nationality || 'Omani',
        civilId: editingStudent.civilId || '',
        grade: editingStudent.grade || '',
        class: editingStudent.class || '',
        academicYear: editingStudent.academicYear || new Date().getFullYear().toString(),
        enrollmentDate: editingStudent.enrollmentDate || new Date().toISOString().split('T')[0],
        previousSchool: editingStudent.previousSchool || '',
        email: editingStudent.email || '',
        phone: editingStudent.phone || '+968 ',
        address: editingStudent.address || '',
        parentName: editingStudent.parentName || '',
        parentNameAr: editingStudent.parentNameAr || '',
        parentPhone: editingStudent.parentPhone || '+968 ',
        parentEmail: editingStudent.parentEmail || '',
        parentOccupation: editingStudent.parentOccupation || '',
        relationship: editingStudent.relationship || '',
        bloodGroup: editingStudent.bloodGroup || '',
        allergies: editingStudent.allergies || '',
        medicalConditions: editingStudent.medicalConditions || '',
        medications: editingStudent.medications || '',
        emergencyContact: editingStudent.emergencyContact || '+968 ',
        emergencyContactName: editingStudent.emergencyContactName || '',
        transportationAgreement: editingStudent.transportationAgreement || false,
      });
      setProfileImage(editingStudent.profileImage || '');
      setIsEditMode(true);
    } else {
      // Reset for new student
      setFormData({
        firstName: '',
        lastName: '',
        firstNameAr: '',
        lastNameAr: '',
        dateOfBirth: '',
        gender: '',
        nationality: 'Omani',
        civilId: '',
        grade: '',
        class: '',
        academicYear: new Date().getFullYear().toString(),
        enrollmentDate: new Date().toISOString().split('T')[0],
        previousSchool: '',
        email: '',
        phone: '+968 ',
        address: '',
        parentName: '',
        parentNameAr: '',
        parentPhone: '+968 ',
        parentEmail: '',
        parentOccupation: '',
        relationship: '',
        bloodGroup: '',
        allergies: '',
        medicalConditions: '',
        medications: '',
        emergencyContact: '+968 ',
        emergencyContactName: '',
        transportationAgreement: false,
      });
      setProfileImage('');
      setIsEditMode(false);
    }
  }, [editingStudent]);
  
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    firstNameAr: '',
    lastNameAr: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Omani',
    civilId: '',
    
    // Academic Information
    grade: '',
    class: '',
    academicYear: new Date().getFullYear().toString(),
    enrollmentDate: new Date().toISOString().split('T')[0],
    previousSchool: '',
    
    // Contact Information
    email: '',
    phone: '+968 ',
    address: '',
    
    // Parent/Guardian Information
    parentName: '',
    parentNameAr: '',
    parentPhone: '+968 ',
    parentEmail: '',
    parentOccupation: '',
    relationship: '',
    
    // Medical Information
    bloodGroup: '',
    allergies: '',
    medicalConditions: '',
    medications: '',
    emergencyContact: '+968 ',
    emergencyContactName: '',
    
    // Agreements
    transportationAgreement: false,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: language === 'en' ? 'File too large' : 'الملف كبير جداً',
          description: language === 'en' ? 'Please select an image under 5MB' : 'الرجاء اختيار صورة أقل من 5 ميجابايت',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    try {
      studentSchema.parse(formData);
      
      if (editingStudent && editingStudent.id) {
        // Update existing student
        updateStudent(editingStudent.id, {
          ...formData,
          profileImage: profileImage || editingStudent.profileImage || undefined,
        });
        
        toast({
          title: language === 'en' ? 'Update Successful' : 'التحديث ناجح',
          description: language === 'en' 
            ? `Student ${formData.firstName} ${formData.lastName} has been updated successfully`
            : `تم تحديث الطالب ${formData.firstNameAr} ${formData.lastNameAr} بنجاح`,
        });
      } else {
        // Add new student
        const newStudent = {
          ...formData,
          profileImage: profileImage || undefined,
        };
        
      addStudent(newStudent);
      
      toast({
        title: language === 'en' ? 'Registration Successful' : 'التسجيل ناجح',
        description: language === 'en' 
          ? `Student ${formData.firstName} ${formData.lastName} has been registered successfully`
          : `تم تسجيل الطالب ${formData.firstNameAr} ${formData.lastNameAr} بنجاح`,
      });
      
      // Reset form data after successful registration
      setFormData({
        firstName: '',
        lastName: '',
        firstNameAr: '',
        lastNameAr: '',
        dateOfBirth: '',
        gender: '',
        nationality: 'Omani',
        civilId: '',
        grade: '',
        class: '',
        academicYear: new Date().getFullYear().toString(),
        enrollmentDate: new Date().toISOString().split('T')[0],
        previousSchool: '',
        email: '',
        phone: '+968 ',
        address: '',
        parentName: '',
        parentNameAr: '',
        parentPhone: '+968 ',
        parentEmail: '',
        parentOccupation: '',
        relationship: '',
        bloodGroup: '',
        allergies: '',
        medicalConditions: '',
        medications: '',
        emergencyContact: '+968 ',
        emergencyContactName: '',
        transportationAgreement: false,
      });
      setProfileImage('');
      setActiveTab('basic');
    }
    
    onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: language === 'en' ? 'Validation Error' : 'خطأ في التحقق',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        
        // Navigate to the tab with the error
        const errorField = error.errors[0].path[0] as string;
        if (['firstName', 'lastName', 'firstNameAr', 'lastNameAr', 'dateOfBirth', 'gender', 'nationality', 'civilId'].includes(errorField)) {
          setActiveTab('basic');
        } else if (['grade', 'class', 'academicYear', 'enrollmentDate', 'previousSchool'].includes(errorField)) {
          setActiveTab('academic');
        } else if (['email', 'phone', 'address'].includes(errorField)) {
          setActiveTab('contact');
        } else if (errorField.startsWith('parent') || errorField === 'relationship') {
          setActiveTab('parent');
        } else if (errorField.includes('medical') || errorField.includes('emergency') || errorField === 'bloodGroup' || errorField === 'allergies') {
          setActiveTab('medical');
        } else {
          setActiveTab('agreements');
        }
      }
    }
  };
  
  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setIsEditMode(true);
    // Load student data into form
    setFormData({
      ...student,
      phone: student.phone || '+968 ',
      parentPhone: student.parentPhone || '+968 ',
      emergencyContact: student.emergencyContact || '+968 ',
    });
    setProfileImage(student.profileImage || '');
  };

  const handleSaveEdit = () => {
    if (selectedStudent) {
      updateStudent(selectedStudent.id, { ...formData, profileImage });
    }
    
    toast({
      title: language === 'en' ? 'Student Updated' : 'تم تحديث الطالب',
      description: language === 'en' 
        ? `Student information has been updated successfully`
        : `تم تحديث معلومات الطالب بنجاح`,
    });
    
    setIsEditMode(false);
    setSelectedStudent(null);
  };

  const handleDeleteStudent = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (editingStudent && editingStudent.id) {
      deleteStudent(editingStudent.id);
      toast({
        title: language === 'en' ? 'Student Deleted' : 'تم حذف الطالب',
        description: language === 'en' 
          ? `${editingStudent.firstName} ${editingStudent.lastName} has been deleted successfully`
          : `تم حذف ${editingStudent.firstNameAr} ${editingStudent.lastNameAr} بنجاح`,
      });
      setDeleteConfirmOpen(false);
      onClose();
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">
            {editingStudent 
              ? (language === 'en' ? 'Edit Student' : 'تعديل طالب')
              : (language === 'en' ? 'Student Registration' : 'تسجيل طالب')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsList className={`grid grid-cols-7 w-full mb-4 sticky top-0 z-10 bg-background ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <TabsTrigger value="basic" className="flex items-center justify-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Basic' : 'الأساسية'}</span>
              </TabsTrigger>
              <TabsTrigger value="academic" className="flex items-center justify-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Academic' : 'الأكاديمية'}</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center justify-center gap-1.5">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Contact' : 'الاتصال'}</span>
              </TabsTrigger>
              <TabsTrigger value="parent" className="flex items-center justify-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Parent' : 'ولي الأمر'}</span>
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex items-center justify-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Medical' : 'الطبية'}</span>
              </TabsTrigger>
              <TabsTrigger value="agreements" className="flex items-center justify-center gap-1.5">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Agreements' : 'الموافقات'}</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center justify-center gap-1.5">
                <BookmarkCheck className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Saved' : 'المحفوظون'}</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="pb-4">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={profileImage} />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                      <Camera className="h-4 w-4" />
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{language === 'en' ? 'First Name' : 'الاسم الأول'}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={language === 'en' ? 'Enter first name' : 'أدخل الاسم الأول'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{language === 'en' ? 'Last Name' : 'اسم العائلة'}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={language === 'en' ? 'Enter last name' : 'أدخل اسم العائلة'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstNameAr">{language === 'en' ? 'First Name (Arabic)' : 'الاسم الأول (عربي)'}</Label>
                    <Input
                      id="firstNameAr"
                      value={formData.firstNameAr}
                      onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })}
                      placeholder={language === 'en' ? 'Enter Arabic first name' : 'أدخل الاسم الأول بالعربية'}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastNameAr">{language === 'en' ? 'Last Name (Arabic)' : 'اسم العائلة (عربي)'}</Label>
                    <Input
                      id="lastNameAr"
                      value={formData.lastNameAr}
                      onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })}
                      placeholder={language === 'en' ? 'Enter Arabic last name' : 'أدخل اسم العائلة بالعربية'}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">{language === 'en' ? 'Date of Birth' : 'تاريخ الميلاد'}</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">{language === 'en' ? 'Gender' : 'الجنس'}</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select gender' : 'اختر الجنس'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{language === 'en' ? 'Male' : 'ذكر'}</SelectItem>
                        <SelectItem value="female">{language === 'en' ? 'Female' : 'أنثى'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nationality">{language === 'en' ? 'Nationality' : 'الجنسية'}</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder={language === 'en' ? 'Enter nationality' : 'أدخل الجنسية'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="civilId">{language === 'en' ? 'Civil ID' : 'البطاقة المدنية'}</Label>
                    <Input
                      id="civilId"
                      value={formData.civilId}
                      onChange={(e) => setFormData({ ...formData, civilId: e.target.value })}
                      placeholder={language === 'en' ? 'Enter civil ID' : 'أدخل رقم البطاقة المدنية'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Academic Information Tab */}
              <TabsContent value="academic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade">{language === 'en' ? 'Grade' : 'الصف'}</Label>
                    <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select grade' : 'اختر الصف'} />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                          <SelectItem key={g} value={g.toString()}>
                            {language === 'en' ? `Grade ${g}` : `الصف ${g}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="class">{language === 'en' ? 'Class' : 'الفصل'}</Label>
                    <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select class' : 'اختر الفصل'} />
                      </SelectTrigger>
                      <SelectContent>
                        {['A', 'B', 'C', 'D'].map(c => (
                          <SelectItem key={c} value={`${formData.grade}-${c}`}>{formData.grade}-{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="academicYear">{language === 'en' ? 'Academic Year' : 'السنة الدراسية'}</Label>
                    <Input
                      id="academicYear"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      placeholder={language === 'en' ? 'e.g., 2024' : 'مثلاً، 2024'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="enrollmentDate">{language === 'en' ? 'Enrollment Date' : 'تاريخ التسجيل'}</Label>
                    <Input
                      id="enrollmentDate"
                      type="date"
                      value={formData.enrollmentDate}
                      onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="previousSchool">{language === 'en' ? 'Previous School (Optional)' : 'المدرسة السابقة (اختياري)'}</Label>
                    <Input
                      id="previousSchool"
                      value={formData.previousSchool}
                      onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                      placeholder={language === 'en' ? 'Enter previous school name' : 'أدخل اسم المدرسة السابقة'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={language === 'en' ? 'student@school.om' : 'student@school.om'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{language === 'en' ? 'Phone' : 'رقم الهاتف'}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+968 9123 4567"
                      type="tel"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">{language === 'en' ? 'Address' : 'العنوان'}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={language === 'en' ? 'Enter full address' : 'أدخل العنوان الكامل'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Parent/Guardian Information Tab */}
              <TabsContent value="parent" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentName">{language === 'en' ? 'Parent/Guardian Name' : 'اسم ولي الأمر'}</Label>
                    <Input
                      id="parentName"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder={language === 'en' ? 'Enter parent name' : 'أدخل اسم ولي الأمر'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentNameAr">{language === 'en' ? 'Parent Name (Arabic)' : 'اسم ولي الأمر (عربي)'}</Label>
                    <Input
                      id="parentNameAr"
                      value={formData.parentNameAr}
                      onChange={(e) => setFormData({ ...formData, parentNameAr: e.target.value })}
                      placeholder={language === 'en' ? 'Enter Arabic parent name' : 'أدخل اسم ولي الأمر بالعربية'}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship">{language === 'en' ? 'Relationship' : 'صلة القرابة'}</Label>
                    <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select relationship' : 'اختر صلة القرابة'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">{language === 'en' ? 'Father' : 'الأب'}</SelectItem>
                        <SelectItem value="mother">{language === 'en' ? 'Mother' : 'الأم'}</SelectItem>
                        <SelectItem value="guardian">{language === 'en' ? 'Guardian' : 'الوصي'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="parentPhone">{language === 'en' ? 'Parent Phone' : 'هاتف ولي الأمر'}</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="+968 9123 4567"
                      type="tel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentEmail">{language === 'en' ? 'Parent Email' : 'بريد ولي الأمر'}</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      placeholder={language === 'en' ? 'parent@email.com' : 'parent@email.com'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentOccupation">{language === 'en' ? 'Parent Occupation (Optional)' : 'مهنة ولي الأمر (اختياري)'}</Label>
                    <Input
                      id="parentOccupation"
                      value={formData.parentOccupation}
                      onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                      placeholder={language === 'en' ? 'Enter occupation' : 'أدخل المهنة'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Medical Information Tab */}
              <TabsContent value="medical" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bloodGroup">{language === 'en' ? 'Blood Group' : 'فصيلة الدم'}</Label>
                    <Select value={formData.bloodGroup} onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'en' ? 'Select blood group' : 'اختر فصيلة الدم'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactName">{language === 'en' ? 'Emergency Contact Name' : 'اسم جهة الاتصال للطوارئ'}</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      placeholder={language === 'en' ? 'Enter contact name' : 'أدخل اسم جهة الاتصال'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContact">{language === 'en' ? 'Emergency Contact Number' : 'رقم الطوارئ'}</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="+968 9123 4567"
                      type="tel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="allergies">{language === 'en' ? 'Allergies (Optional)' : 'الحساسية (اختياري)'}</Label>
                    <Input
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder={language === 'en' ? 'e.g., Peanuts, Dairy' : 'مثلاً، الفول السوداني، منتجات الألبان'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="medicalConditions">{language === 'en' ? 'Medical Conditions (Optional)' : 'الحالات الطبية (اختياري)'}</Label>
                    <Input
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                      placeholder={language === 'en' ? 'Enter any medical conditions' : 'أدخل أي حالات طبية'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="medications">{language === 'en' ? 'Medications (Optional)' : 'الأدوية (اختياري)'}</Label>
                    <Input
                      id="medications"
                      value={formData.medications}
                      onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                      placeholder={language === 'en' ? 'Enter any regular medications' : 'أدخل أي أدوية منتظمة'}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Agreements Tab */}
              <TabsContent value="agreements" className="space-y-4">
                <div className="space-y-4">
                  <div className={`flex items-start ${language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <Checkbox
                      id="transportation"
                      checked={formData.transportationAgreement}
                      onCheckedChange={(checked) => setFormData({ ...formData, transportationAgreement: checked as boolean })}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="transportation" className="flex items-center gap-2 cursor-pointer">
                        <Bus className="h-4 w-4" />
                        {language === 'en' ? 'Transportation Agreement' : 'اتفاقية النقل'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' 
                          ? 'I agree to enroll my child in the school transportation service'
                          : 'أوافق على تسجيل طفلي في خدمة النقل المدرسي'}
                      </p>
                    </div>
                  </div>
                  
                </div>
              </TabsContent>
              
              {/* Saved Students Tab */}
              <TabsContent value="saved" className="space-y-4">
                <div className="grid gap-4">
                  {students.map((student) => (
                    <Card key={student.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={student.profileImage} />
                            <AvatarFallback>{student.firstName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {language === 'en' 
                                ? `${student.firstName} ${student.lastName}`
                                : `${student.firstNameAr} ${student.lastNameAr}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'en' ? `Grade ${student.grade} - Class ${student.class}` : `الصف ${student.grade} - الفصل ${student.class}`}
                            </p>
                            <div className="flex gap-4 mt-1">
                              {student.transportationAgreement && (
                                <span className="text-xs flex items-center gap-1 text-success">
                                  <Bus className="h-3 w-3" />
                                  {language === 'en' ? 'Transportation' : 'النقل'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 border-t mt-auto">
          <div className="flex justify-between w-full">
            <div>
              {editingStudent && (
                <Button variant="destructive" onClick={handleDeleteStudent}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Delete Student' : 'حذف الطالب'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setIsEditMode(false);
                    setSelectedStudent(null);
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Cancel Edit' : 'إلغاء التعديل'}
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    <Save className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Save Changes' : 'حفظ التغييرات'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose}>
                    {language === 'en' ? 'Cancel' : 'إلغاء'}
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingStudent 
                      ? (language === 'en' ? 'Update Student' : 'تحديث الطالب')
                      : (language === 'en' ? 'Register Student' : 'تسجيل الطالب')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {language === 'en' ? 'Confirm Deletion' : 'تأكيد الحذف'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {language === 'en' 
              ? `Are you sure you want to delete ${editingStudent?.firstName} ${editingStudent?.lastName}? This action cannot be undone.`
              : `هل أنت متأكد من حذف ${editingStudent?.firstNameAr} ${editingStudent?.lastNameAr}؟ لا يمكن التراجع عن هذا الإجراء.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {language === 'en' ? 'Delete Student' : 'حذف الطالب'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}