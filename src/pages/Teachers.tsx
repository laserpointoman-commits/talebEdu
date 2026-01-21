import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { Search, Edit, UserPlus, Mail, Phone, Eye, EyeOff, Trash2, Calendar, GraduationCap, MapPin, CreditCard, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schema for teacher form
const teacherSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  nameAr: z.string().trim().min(1, 'Arabic name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().regex(/^\+968\s?\d{4}\s?\d{4}$/, 'Invalid phone number'),
  subjects: z.string().min(1, 'Subjects are required').max(200),
  classes: z.string().min(1, 'Classes are required').max(200),
  qualification: z.string().min(1, 'Qualification is required').max(100),
  experience: z.string().min(1, 'Experience is required').max(50),
  joinDate: z.string().min(1, 'Join date is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

interface Teacher {
  id: string;
  employee_id: string;
  profile_id: string | null;
  experience_years: number | null;
  subjects: string[] | null;
  classes: string[] | null;
  qualification: string | null;
  join_date: string | null;
  profiles: {
    full_name: string;
    full_name_ar: string | null;
    email: string;
    phone: string | null;
    profile_image: string | null;
  } | null;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  class_teacher_id: string | null;
}

export default function Teachers() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClassAssignDialogOpen, setIsClassAssignDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [addForm, setAddForm] = useState({
    // Basic Information
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    password: '',
    // Professional Information
    subjects: '',
    classes: '',
    qualification: '',
    experience: '',
    joinDate: '',
    specialization: '',
    previousSchool: '',
    teachingCertificate: '',
    // Personal Information
    nationality: 'Omani',
    civilId: '',
    passportNumber: '',
    dateOfBirth: '',
    gender: 'male',
    maritalStatus: 'single',
    bloodGroup: '',
    // Address
    address: '',
    city: '',
    country: 'Oman',
    postalCode: '',
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    // Banking Information
    bankName: '',
    iban: '',
    accountNumber: '',
    // Employment Details
    contractType: 'full-time',
    salary: '',
    allowances: '',
    insuranceNumber: '',
    visaNumber: '',
    visaExpiry: '',
  });

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade, section, class_teacher_id')
        .order('grade', { ascending: true });

      if (error) throw error;
      setAvailableClasses(data || []);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
    }
  };

  const openClassAssignDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    // Find classes where this teacher is assigned
    const assignedClasses = availableClasses.filter(c => c.class_teacher_id === teacher.id);
    setSelectedClassIds(assignedClasses.map(c => c.id));
    setIsClassAssignDialogOpen(true);
  };

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSaveClassAssignments = async () => {
    if (!selectedTeacher) return;

    try {
      // Remove this teacher from all classes first
      await supabase
        .from('classes')
        .update({ class_teacher_id: null })
        .eq('class_teacher_id', selectedTeacher.id);

      // Assign selected classes to this teacher
      if (selectedClassIds.length > 0) {
        const { error } = await supabase
          .from('classes')
          .update({ class_teacher_id: selectedTeacher.id })
          .in('id', selectedClassIds);

        if (error) throw error;
      }

      // Update the teacher's classes array with class names
      const assignedClassNames = availableClasses
        .filter(c => selectedClassIds.includes(c.id))
        .map(c => c.name);

      await supabase
        .from('teachers')
        .update({ classes: assignedClassNames })
        .eq('id', selectedTeacher.id);

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Classes assigned successfully' : language === 'hi' ? 'कक्षाएँ सफलतापूर्वक नियुक्त की गईं' : 'تم تعيين الصفوف بنجاح',
      });

      setIsClassAssignDialogOpen(false);
      fetchTeachers();
      fetchClasses();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          profiles (
            full_name,
            full_name_ar,
            email,
            phone,
            profile_image
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.profiles?.full_name_ar?.includes(searchTerm) ||
    teacher.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = async (teacher: Teacher) => {
    try {
      // Fetch complete employee data
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('profile_id', teacher.profile_id)
        .single();

      if (empError && empError.code !== 'PGRST116') {
        console.error('Error fetching employee data:', empError);
      }

      setEditForm({
        id: teacher.id,
        profile_id: teacher.profile_id,
        employee_id: teacher.employee_id,
        // Basic Information
        name: teacher.profiles?.full_name || '',
        nameAr: teacher.profiles?.full_name_ar || '',
        email: teacher.profiles?.email || '',
        phone: teacher.profiles?.phone || '',
        // Professional Information
        subjects: teacher.subjects?.join(', ') || '',
        classes: teacher.classes?.join(', ') || '',
        qualification: teacher.qualification || '',
        experience: teacher.experience_years?.toString() || '',
        joinDate: teacher.join_date || '',
        specialization: employeeData?.custom_position || '',
        previousSchool: '',
        teachingCertificate: '',
        // Personal Information
        nationality: 'Omani',
        civilId: employeeData?.national_id || '',
        passportNumber: employeeData?.passport_number || '',
        dateOfBirth: '',
        gender: 'male',
        maritalStatus: 'single',
        bloodGroup: '',
        // Address
        address: '',
        city: '',
        country: 'Oman',
        postalCode: '',
        // Emergency Contact
        emergencyContactName: employeeData?.emergency_contact || '',
        emergencyContactPhone: employeeData?.emergency_phone || '',
        emergencyContactRelation: '',
        // Banking Information
        bankName: employeeData?.bank_name || '',
        iban: employeeData?.iban || '',
        accountNumber: employeeData?.bank_account || '',
        // Employment Details
        contractType: employeeData?.contract_type || 'full-time',
        salary: '',
        allowances: '',
        insuranceNumber: employeeData?.insurance_number || '',
        visaNumber: employeeData?.visa_number || '',
        visaExpiry: employeeData?.visa_expiry || '',
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Error preparing edit form:', error);
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: language === 'en' ? 'Failed to load teacher data' : language === 'hi' ? 'शिक्षक डेटा लोड करने में विफल' : 'فشل في تحميل بيانات المعلم',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Update teacher record
      const { error: teacherError } = await supabase
        .from('teachers')
        .update({
          subjects: editForm.subjects.split(',').map((s: string) => s.trim()),
          classes: editForm.classes.split(',').map((c: string) => c.trim()),
          qualification: editForm.qualification,
          experience_years: parseInt(editForm.experience) || 0,
          join_date: editForm.joinDate,
        })
        .eq('id', editForm.id);

      if (teacherError) throw teacherError;

      // Update profile
      if (editForm.profile_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: editForm.name,
            full_name_ar: editForm.nameAr,
            phone: editForm.phone,
          })
          .eq('id', editForm.profile_id);

        if (profileError) throw profileError;

        // Update employee record
        const { error: empError } = await supabase
          .from('employees')
          .update({
            custom_position: editForm.specialization,
            national_id: editForm.civilId,
            passport_number: editForm.passportNumber,
            bank_name: editForm.bankName,
            iban: editForm.iban,
            bank_account: editForm.accountNumber,
            emergency_contact: editForm.emergencyContactName,
            emergency_phone: editForm.emergencyContactPhone,
            visa_number: editForm.visaNumber,
            visa_expiry: editForm.visaExpiry,
            insurance_number: editForm.insuranceNumber,
            contract_type: editForm.contractType,
          })
          .eq('profile_id', editForm.profile_id);

        if (empError) console.error('Error updating employee record:', empError);
      }

      toast({
        title: t('common.save'),
        description: language === 'en' ? 'Teacher profile updated successfully' : language === 'hi' ? 'शिक्षक प्रोफाइल सफलतापूर्वक अपडेट किया गया' : 'تم تحديث ملف المعلم بنجاح',
      });
      setIsEditDialogOpen(false);
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    
    try {
      // Delete the teacher record
      const { error: teacherError } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherToDelete.id);

      if (teacherError) throw teacherError;

      // Delete the employee record if exists
      if (teacherToDelete.profile_id) {
        const { error: empError } = await supabase
          .from('employees')
          .delete()
          .eq('profile_id', teacherToDelete.profile_id);
        
        if (empError) console.error('Error deleting employee record:', empError);
      }

      toast({
        title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
        description: language === 'en' ? 'Teacher deleted successfully' : language === 'hi' ? 'शिक्षक सफलतापूर्वक हटाया गया' : 'تم حذف المعلم بنجاح',
      });
      
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
      fetchTeachers();
    } catch (error) {
      toast({
        title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleViewProfile = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsProfileDialogOpen(true);
  };

  const handleAddTeacher = async () => {
    try {
      teacherSchema.parse(addForm);
      
      // Generate employee ID
      const employeeId = `TCH${Date.now().toString().slice(-6)}`;
      
      // Save current session
      const currentSession = await supabase.auth.getSession();
      
      // Create the teacher's account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: {
          data: {
            full_name: addForm.name,
            full_name_ar: addForm.nameAr,
            phone: addForm.phone,
            role: 'teacher',
          },
        },
      });

      if (authError) throw authError;
      
      // Restore admin session to prevent automatic login as the new teacher
      if (currentSession.data.session) {
        await supabase.auth.setSession({
          access_token: currentSession.data.session.access_token,
          refresh_token: currentSession.data.session.refresh_token,
        });
      }

      if (authData.user) {
        // Create teacher record
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            employee_id: employeeId,
            profile_id: authData.user.id,
            subjects: addForm.subjects.split(',').map(s => s.trim()),
            classes: addForm.classes.split(',').map(c => c.trim()),
            qualification: addForm.qualification,
            experience_years: parseInt(addForm.experience),
            join_date: addForm.joinDate,
          });

        if (teacherError) throw teacherError;

        // Create employee record with additional information
        const { error: empError } = await supabase
          .from('employees')
          .insert({
            employee_id: employeeId,
            profile_id: authData.user.id,
            position: 'teacher',
            department: 'Education',
            national_id: addForm.civilId,
            passport_number: addForm.passportNumber,
            bank_name: addForm.bankName,
            iban: addForm.iban,
            bank_account: addForm.accountNumber,
            emergency_contact: addForm.emergencyContactName,
            emergency_phone: addForm.emergencyContactPhone,
            visa_number: addForm.visaNumber,
            visa_expiry: addForm.visaExpiry,
            insurance_number: addForm.insuranceNumber,
            contract_type: addForm.contractType,
            join_date: addForm.joinDate,
          });

        if (empError) console.error('Error creating employee record:', empError);

        toast({
          title: language === 'en' ? 'Success' : language === 'hi' ? 'सफलता' : 'نجاح',
          description: language === 'en' ? 'Teacher account created successfully' : language === 'hi' ? 'शिक्षक खाता सफलतापूर्वक बनाया गया' : 'تم إنشاء حساب المعلم بنجاح',
        });
        
        setIsAddDialogOpen(false);
        // Reset form with all fields
        setAddForm({
          name: '',
          nameAr: '',
          email: '',
          phone: '',
          password: '',
          subjects: '',
          classes: '',
          qualification: '',
          experience: '',
          joinDate: '',
          specialization: '',
          previousSchool: '',
          teachingCertificate: '',
          nationality: 'Omani',
          civilId: '',
          passportNumber: '',
          dateOfBirth: '',
          gender: 'male',
          maritalStatus: 'single',
          bloodGroup: '',
          address: '',
          city: '',
          country: 'Oman',
          postalCode: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelation: '',
          bankName: '',
          iban: '',
          accountNumber: '',
          contractType: 'full-time',
          salary: '',
          allowances: '',
          insuranceNumber: '',
          visaNumber: '',
          visaExpiry: '',
        });
        fetchTeachers();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: language === 'en' ? 'Validation Error' : language === 'hi' ? 'सत्यापन त्रुटि' : 'خطأ في التحقق',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: language === 'en' ? 'Error' : language === 'hi' ? 'त्रुटि' : 'خطأ',
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    }
  };

  if (profile?.role !== 'admin' && profile?.role !== 'developer') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">You don't have permission to view this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <LogoLoader fullScreen={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {language === 'en' ? 'Teachers' : language === 'hi' ? 'शिक्षक' : 'المعلمين'}
              </h2>
              <p className="text-indigo-100 text-sm">
                {language === 'en' ? 'Manage and view all teacher profiles' : language === 'hi' ? 'सभी शिक्षक प्रोफाइल प्रबंधित करें और देखें' : 'إدارة وعرض جميع ملفات المعلمين'}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0">
            <UserPlus className="h-4 w-4" />
            {language === 'en' ? 'Add Teacher' : language === 'hi' ? 'शिक्षक जोड़ें' : 'إضافة معلم'}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={language === 'en' ? 'Search by name, email or employee ID...' : language === 'hi' ? 'नाम, ईमेल या कर्मचारी आईडी से खोजें...' : 'البحث بالاسم أو البريد أو رقم الموظف...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeachers.map((teacher) => (
          <Card key={teacher.id} className="relative overflow-hidden border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-indigo-100 dark:ring-indigo-900/30">
                    <AvatarImage src={teacher.profiles?.profile_image || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      {teacher.profiles?.full_name?.charAt(0) || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {language === 'en' ? teacher.profiles?.full_name : teacher.profiles?.full_name_ar || teacher.profiles?.full_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {teacher.subjects?.join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(teacher)}
                    className="h-8 w-8 p-0 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <Edit className="h-4 w-4 text-indigo-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(teacher)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-xs font-medium">{teacher.employee_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{teacher.profiles?.email}</span>
                </div>
                {teacher.profiles?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{teacher.profiles.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{teacher.qualification || 'Bachelor of Education'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">
                    {language === 'en' ? 'Experience: ' : language === 'hi' ? 'अनुभव: ' : 'الخبرة: '}
                    {teacher.experience_years || 5} {language === 'en' ? 'years' : language === 'hi' ? 'वर्ष' : 'سنوات'}
                  </span>
                </div>
              </div>
              
              {/* Assigned Classes Section */}
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {language === 'en' ? 'Assigned Classes:' : language === 'hi' ? 'नियुक्त कक्षाएँ:' : 'الصفوف المعينة:'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    // Get classes assigned to this teacher from availableClasses
                    const assignedClasses = availableClasses.filter(c => c.class_teacher_id === teacher.id);
                    if (assignedClasses.length === 0) {
                      return (
                        <span className="text-xs text-muted-foreground italic">
                          {language === 'en' ? 'No classes assigned' : language === 'hi' ? 'कोई कक्षा नियुक्त नहीं' : 'لا يوجد صفوف معينة'}
                        </span>
                      );
                    }
                    return assignedClasses.map((classInfo) => (
                      <Badge 
                        key={classInfo.id} 
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary"
                      >
                        {classInfo.name}
                      </Badge>
                    ));
                  })()}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  variant="outline"
                  size="sm"
                  onClick={() => openClassAssignDialog(teacher)}
                >
                  <GraduationCap className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Assign Classes' : language === 'hi' ? 'कक्षाएँ नियुक्त करें' : 'تعيين صفوف'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewProfile(teacher)}
                >
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Teacher Dialog with Tabs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Create Teacher Account' : language === 'hi' ? 'शिक्षक खाता बनाएं' : 'إنشاء حساب معلم'}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">{language === 'en' ? 'Basic' : language === 'hi' ? 'मूल' : 'أساسي'}</TabsTrigger>
              <TabsTrigger value="professional">{language === 'en' ? 'Professional' : language === 'hi' ? 'पेशेवर' : 'مهني'}</TabsTrigger>
              <TabsTrigger value="personal">{language === 'en' ? 'Personal' : language === 'hi' ? 'व्यक्तिगत' : 'شخصي'}</TabsTrigger>
              <TabsTrigger value="address">{language === 'en' ? 'Address' : language === 'hi' ? 'पता' : 'العنوان'}</TabsTrigger>
              <TabsTrigger value="financial">{language === 'en' ? 'Financial' : language === 'hi' ? 'वित्तीय' : 'مالي'}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Name' : language === 'hi' ? 'नाम' : 'الاسم'}</Label>
                  <Input
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Name (Arabic)' : language === 'hi' ? 'नाम (अरबी)' : 'الاسم بالعربية'}</Label>
                  <Input
                    value={addForm.nameAr}
                    onChange={(e) => setAddForm({ ...addForm, nameAr: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Email' : language === 'hi' ? 'ईमेल' : 'البريد الإلكتروني'}</Label>
                  <Input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Password' : language === 'hi' ? 'पासवर्ड' : 'كلمة المرور'}</Label>
                  <div className="relative" dir="ltr">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="pr-12"
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Phone' : language === 'hi' ? 'फ़ोन' : 'الهاتف'}</Label>
                  <Input
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+968 9XXX XXXX"
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Join Date' : language === 'hi' ? 'शामिल होने की तारीख' : 'تاريخ الانضمام'}</Label>
                  <Input
                    type="date"
                    value={addForm.joinDate}
                    onChange={(e) => setAddForm({ ...addForm, joinDate: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="professional" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Subjects' : language === 'hi' ? 'विषय' : 'المواد'}</Label>
                  <Input
                    value={addForm.subjects}
                    onChange={(e) => setAddForm({ ...addForm, subjects: e.target.value })}
                    placeholder={language === 'en' ? 'e.g., Math, Science' : language === 'hi' ? 'जैसे, गणित, विज्ञान' : 'مثل: الرياضيات، العلوم'}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Classes' : language === 'hi' ? 'कक्षाएँ' : 'الصفوف'}</Label>
                  <Input
                    value={addForm.classes}
                    onChange={(e) => setAddForm({ ...addForm, classes: e.target.value })}
                    placeholder={language === 'en' ? 'e.g., 5A, 5B' : language === 'hi' ? 'जैसे, 5A, 5B' : 'مثل: 5أ، 5ب'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Qualification' : language === 'hi' ? 'योग्यता' : 'المؤهل'}</Label>
                  <Input
                    value={addForm.qualification}
                    onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Experience (years)' : language === 'hi' ? 'अनुभव (वर्ष)' : 'الخبرة (سنوات)'}</Label>
                  <Input
                    type="number"
                    value={addForm.experience}
                    onChange={(e) => setAddForm({ ...addForm, experience: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Specialization' : language === 'hi' ? 'विशेषज्ञता' : 'التخصص'}</Label>
                  <Input
                    value={addForm.specialization}
                    onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Previous School' : language === 'hi' ? 'पिछला स्कूल' : 'المدرسة السابقة'}</Label>
                  <Input
                    value={addForm.previousSchool}
                    onChange={(e) => setAddForm({ ...addForm, previousSchool: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Civil ID' : language === 'hi' ? 'सिविल आईडी' : 'البطاقة المدنية'}</Label>
                  <Input
                    value={addForm.civilId}
                    onChange={(e) => setAddForm({ ...addForm, civilId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Passport Number' : language === 'hi' ? 'पासपोर्ट नंबर' : 'رقم جواز السفر'}</Label>
                  <Input
                    value={addForm.passportNumber}
                    onChange={(e) => setAddForm({ ...addForm, passportNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Date of Birth' : language === 'hi' ? 'जन्म तिथि' : 'تاريخ الميلاد'}</Label>
                  <Input
                    type="date"
                    value={addForm.dateOfBirth}
                    onChange={(e) => setAddForm({ ...addForm, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Gender' : language === 'hi' ? 'लिंग' : 'الجنس'}</Label>
                  <Select value={addForm.gender} onValueChange={(value) => setAddForm({ ...addForm, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{language === 'en' ? 'Male' : language === 'hi' ? 'पुरुष' : 'ذكر'}</SelectItem>
                      <SelectItem value="female">{language === 'en' ? 'Female' : language === 'hi' ? 'महिला' : 'أنثى'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Nationality' : language === 'hi' ? 'राष्ट्रीयता' : 'الجنسية'}</Label>
                  <Input
                    value={addForm.nationality}
                    onChange={(e) => setAddForm({ ...addForm, nationality: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Marital Status' : language === 'hi' ? 'वैवाहिक स्थिति' : 'الحالة الاجتماعية'}</Label>
                  <Select value={addForm.maritalStatus} onValueChange={(value) => setAddForm({ ...addForm, maritalStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">{language === 'en' ? 'Single' : language === 'hi' ? 'अविवाहित' : 'أعزب'}</SelectItem>
                      <SelectItem value="married">{language === 'en' ? 'Married' : language === 'hi' ? 'विवाहित' : 'متزوج'}</SelectItem>
                      <SelectItem value="divorced">{language === 'en' ? 'Divorced' : language === 'hi' ? 'तलाकशुदा' : 'مطلق'}</SelectItem>
                      <SelectItem value="widowed">{language === 'en' ? 'Widowed' : language === 'hi' ? 'विधवा/विधुर' : 'أرمل'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="address" className="space-y-4">
              <div>
                <Label>{language === 'en' ? 'Address' : language === 'hi' ? 'पता' : 'العنوان'}</Label>
                <Input
                  value={addForm.address}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{language === 'en' ? 'City' : language === 'hi' ? 'शहर' : 'المدينة'}</Label>
                  <Input
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Country' : language === 'hi' ? 'देश' : 'البلد'}</Label>
                  <Input
                    value={addForm.country}
                    onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Postal Code' : language === 'hi' ? 'पिन कोड' : 'الرمز البريدي'}</Label>
                  <Input
                    value={addForm.postalCode}
                    onChange={(e) => setAddForm({ ...addForm, postalCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Emergency Contact Name' : language === 'hi' ? 'आपातकालीन संपर्क नाम' : 'اسم جهة الاتصال الطارئ'}</Label>
                  <Input
                    value={addForm.emergencyContactName}
                    onChange={(e) => setAddForm({ ...addForm, emergencyContactName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Emergency Phone' : language === 'hi' ? 'आपातकालीन फ़ोन' : 'هاتف الطوارئ'}</Label>
                  <Input
                    value={addForm.emergencyContactPhone}
                    onChange={(e) => setAddForm({ ...addForm, emergencyContactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Relation' : language === 'hi' ? 'संबंध' : 'صلة القرابة'}</Label>
                  <Input
                    value={addForm.emergencyContactRelation}
                    onChange={(e) => setAddForm({ ...addForm, emergencyContactRelation: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Bank Name' : language === 'hi' ? 'बैंक का नाम' : 'اسم البنك'}</Label>
                  <Input
                    value={addForm.bankName}
                    onChange={(e) => setAddForm({ ...addForm, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'IBAN' : language === 'hi' ? 'IBAN' : 'رقم الآيبان'}</Label>
                  <Input
                    value={addForm.iban}
                    onChange={(e) => setAddForm({ ...addForm, iban: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Account Number' : language === 'hi' ? 'खाता नंबर' : 'رقم الحساب'}</Label>
                  <Input
                    value={addForm.accountNumber}
                    onChange={(e) => setAddForm({ ...addForm, accountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Monthly Salary (OMR)' : language === 'hi' ? 'मासिक वेतन (OMR)' : 'الراتب الشهري (ر.ع)'}</Label>
                  <Input
                    type="number"
                    value={addForm.salary}
                    onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Insurance Number' : language === 'hi' ? 'बीमा नंबर' : 'رقم التأمين'}</Label>
                  <Input
                    value={addForm.insuranceNumber}
                    onChange={(e) => setAddForm({ ...addForm, insuranceNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Contract Type' : language === 'hi' ? 'अनुबंध प्रकार' : 'نوع العقد'}</Label>
                  <Select value={addForm.contractType} onValueChange={(value) => setAddForm({ ...addForm, contractType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">{language === 'en' ? 'Full Time' : language === 'hi' ? 'पूर्णकालिक' : 'دوام كامل'}</SelectItem>
                      <SelectItem value="part-time">{language === 'en' ? 'Part Time' : language === 'hi' ? 'अंशकालिक' : 'دوام جزئي'}</SelectItem>
                      <SelectItem value="contract">{language === 'en' ? 'Contract' : language === 'hi' ? 'अनुबंध' : 'عقد'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Visa Number' : language === 'hi' ? 'वीजा नंबर' : 'رقم التأشيرة'}</Label>
                  <Input
                    value={addForm.visaNumber}
                    onChange={(e) => setAddForm({ ...addForm, visaNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Visa Expiry' : language === 'hi' ? 'वीजा समाप्ति' : 'انتهاء التأشيرة'}</Label>
                  <Input
                    type="date"
                    value={addForm.visaExpiry}
                    onChange={(e) => setAddForm({ ...addForm, visaExpiry: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddTeacher}>
              {language === 'en' ? 'Create Account' : language === 'hi' ? 'खाता बनाएं' : 'إنشاء الحساب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Delete Teacher' : language === 'hi' ? 'शिक्षक हटाएं' : 'حذف المعلم'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? `Are you sure you want to delete ${teacherToDelete?.profiles?.full_name}? This action cannot be undone.`
                : language === 'hi'
                ? `क्या आप वाकई ${teacherToDelete?.profiles?.full_name} को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।`
                : `هل أنت متأكد من حذف ${teacherToDelete?.profiles?.full_name_ar || teacherToDelete?.profiles?.full_name}؟ لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {language === 'en' ? 'Delete' : language === 'hi' ? 'हटाएं' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Teacher Dialog with Tabs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Teacher Profile' : 'تعديل ملف المعلم'}
            </DialogTitle>
          </DialogHeader>
          {editForm && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">{language === 'en' ? 'Basic' : 'أساسي'}</TabsTrigger>
                <TabsTrigger value="professional">{language === 'en' ? 'Professional' : 'مهني'}</TabsTrigger>
                <TabsTrigger value="personal">{language === 'en' ? 'Personal' : 'شخصي'}</TabsTrigger>
                <TabsTrigger value="address">{language === 'en' ? 'Address' : 'العنوان'}</TabsTrigger>
                <TabsTrigger value="financial">{language === 'en' ? 'Financial' : 'مالي'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Name' : 'الاسم'}</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Name (Arabic)' : 'الاسم بالعربية'}</Label>
                    <Input
                      value={editForm.nameAr}
                      onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                    <Input
                      type="email"
                      value={editForm.email}
                      disabled
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Phone' : 'رقم الهاتف'}</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+968 9xxx xxxx"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Employee ID' : 'رقم الموظف'}</Label>
                    <Input
                      value={editForm.employee_id}
                      disabled
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="professional" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Subjects' : 'المواد الدراسية'}</Label>
                    <Input
                      value={editForm.subjects}
                      onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })}
                      placeholder={language === 'en' ? 'Math, Science, English' : 'رياضيات، علوم، انجليزي'}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Classes' : 'الصفوف'}</Label>
                    <Input
                      value={editForm.classes}
                      onChange={(e) => setEditForm({ ...editForm, classes: e.target.value })}
                      placeholder={language === 'en' ? 'Grade 5A, Grade 6B' : 'الصف 5أ، الصف 6ب'}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Qualification' : 'المؤهل العلمي'}</Label>
                    <Input
                      value={editForm.qualification}
                      onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                      placeholder={language === 'en' ? 'Bachelor of Education' : 'بكالوريوس تربية'}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Experience (years)' : 'الخبرة (سنوات)'}</Label>
                    <Input
                      type="number"
                      value={editForm.experience}
                      onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Join Date' : 'تاريخ الالتحاق'}</Label>
                    <Input
                      type="date"
                      value={editForm.joinDate}
                      onChange={(e) => setEditForm({ ...editForm, joinDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Specialization' : 'التخصص'}</Label>
                    <Input
                      value={editForm.specialization}
                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      placeholder={language === 'en' ? 'Mathematics Education' : 'تعليم الرياضيات'}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Previous School' : 'المدرسة السابقة'}</Label>
                    <Input
                      value={editForm.previousSchool}
                      onChange={(e) => setEditForm({ ...editForm, previousSchool: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Teaching Certificate' : 'شهادة التدريس'}</Label>
                    <Input
                      value={editForm.teachingCertificate}
                      onChange={(e) => setEditForm({ ...editForm, teachingCertificate: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Nationality' : 'الجنسية'}</Label>
                    <Select
                      value={editForm.nationality}
                      onValueChange={(value) => setEditForm({ ...editForm, nationality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Omani">Omani</SelectItem>
                        <SelectItem value="Egyptian">Egyptian</SelectItem>
                        <SelectItem value="Jordanian">Jordanian</SelectItem>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="Pakistani">Pakistani</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Civil ID' : 'البطاقة المدنية'}</Label>
                    <Input
                      value={editForm.civilId}
                      onChange={(e) => setEditForm({ ...editForm, civilId: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Passport Number' : 'رقم جواز السفر'}</Label>
                    <Input
                      value={editForm.passportNumber}
                      onChange={(e) => setEditForm({ ...editForm, passportNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Date of Birth' : 'تاريخ الميلاد'}</Label>
                    <Input
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Gender' : 'الجنس'}</Label>
                    <Select
                      value={editForm.gender}
                      onValueChange={(value) => setEditForm({ ...editForm, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{language === 'en' ? 'Male' : 'ذكر'}</SelectItem>
                        <SelectItem value="female">{language === 'en' ? 'Female' : 'أنثى'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Marital Status' : 'الحالة الاجتماعية'}</Label>
                    <Select
                      value={editForm.maritalStatus}
                      onValueChange={(value) => setEditForm({ ...editForm, maritalStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">{language === 'en' ? 'Single' : 'أعزب'}</SelectItem>
                        <SelectItem value="married">{language === 'en' ? 'Married' : 'متزوج'}</SelectItem>
                        <SelectItem value="divorced">{language === 'en' ? 'Divorced' : 'مطلق'}</SelectItem>
                        <SelectItem value="widowed">{language === 'en' ? 'Widowed' : 'أرمل'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Blood Group' : 'فصيلة الدم'}</Label>
                    <Select
                      value={editForm.bloodGroup}
                      onValueChange={(value) => setEditForm({ ...editForm, bloodGroup: value })}
                    >
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
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>{language === 'en' ? 'Address' : 'العنوان'}</Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder={language === 'en' ? 'Street address' : 'عنوان الشارع'}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'City' : 'المدينة'}</Label>
                    <Input
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder={language === 'en' ? 'Muscat' : 'مسقط'}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Country' : 'الدولة'}</Label>
                    <Input
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      placeholder="Oman"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Postal Code' : 'الرمز البريدي'}</Label>
                    <Input
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Emergency Contact Name' : 'اسم جهة اتصال الطوارئ'}</Label>
                    <Input
                      value={editForm.emergencyContactName}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Emergency Contact Phone' : 'هاتف الطوارئ'}</Label>
                    <Input
                      value={editForm.emergencyContactPhone}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                      placeholder="+968 9xxx xxxx"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Emergency Contact Relation' : 'صلة القرابة'}</Label>
                    <Input
                      value={editForm.emergencyContactRelation}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContactRelation: e.target.value })}
                      placeholder={language === 'en' ? 'Brother, Sister, Parent, etc.' : 'أخ، أخت، والد، إلخ'}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Bank Name' : 'اسم البنك'}</Label>
                    <Input
                      value={editForm.bankName}
                      onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                      placeholder="Bank Muscat"
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'IBAN' : 'رقم الآيبان'}</Label>
                    <Input
                      value={editForm.iban}
                      onChange={(e) => setEditForm({ ...editForm, iban: e.target.value })}
                      placeholder="OMxx xxxx xxxx xxxx xxxx xxx"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Account Number' : 'رقم الحساب'}</Label>
                    <Input
                      value={editForm.accountNumber}
                      onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Contract Type' : 'نوع العقد'}</Label>
                    <Select
                      value={editForm.contractType}
                      onValueChange={(value) => setEditForm({ ...editForm, contractType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">{language === 'en' ? 'Full Time' : 'دوام كامل'}</SelectItem>
                        <SelectItem value="part-time">{language === 'en' ? 'Part Time' : 'دوام جزئي'}</SelectItem>
                        <SelectItem value="contract">{language === 'en' ? 'Contract' : 'عقد'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Basic Salary' : 'الراتب الأساسي'}</Label>
                    <Input
                      type="number"
                      value={editForm.salary}
                      onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Allowances' : 'البدلات'}</Label>
                    <Input
                      type="number"
                      value={editForm.allowances}
                      onChange={(e) => setEditForm({ ...editForm, allowances: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Insurance Number' : 'رقم التأمين'}</Label>
                    <Input
                      value={editForm.insuranceNumber}
                      onChange={(e) => setEditForm({ ...editForm, insuranceNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'Visa Number' : 'رقم التأشيرة'}</Label>
                    <Input
                      value={editForm.visaNumber}
                      onChange={(e) => setEditForm({ ...editForm, visaNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Visa Expiry' : 'انتهاء التأشيرة'}</Label>
                    <Input
                      type="date"
                      value={editForm.visaExpiry}
                      onChange={(e) => setEditForm({ ...editForm, visaExpiry: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Teacher Profile' : 'ملف المعلم'}
            </DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedTeacher.profiles?.profile_image || ''} />
                  <AvatarFallback className="text-2xl">
                    {selectedTeacher.profiles?.full_name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {language === 'en' 
                      ? selectedTeacher.profiles?.full_name 
                      : selectedTeacher.profiles?.full_name_ar || selectedTeacher.profiles?.full_name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedTeacher.employee_id}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                  <p>{selectedTeacher.profiles?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Phone' : 'الهاتف'}</Label>
                  <p>{selectedTeacher.profiles?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Subjects' : 'المواد'}</Label>
                  <p>{selectedTeacher.subjects?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Classes' : 'الصفوف'}</Label>
                  <p>{selectedTeacher.classes?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Qualification' : 'المؤهل'}</Label>
                  <p>{selectedTeacher.qualification || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Experience' : 'الخبرة'}</Label>
                  <p>{selectedTeacher.experience_years ? `${selectedTeacher.experience_years} years` : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{language === 'en' ? 'Join Date' : 'تاريخ الانضمام'}</Label>
                  <p>{selectedTeacher.join_date || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Classes Dialog */}
      <Dialog open={isClassAssignDialogOpen} onOpenChange={setIsClassAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Assign Classes to' : 'تعيين صفوف إلى'} {selectedTeacher?.profiles?.full_name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {availableClasses.map((classInfo) => (
                <div
                  key={classInfo.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedClassIds.includes(classInfo.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleToggleClass(classInfo.id)}
                >
                  <Checkbox checked={selectedClassIds.includes(classInfo.id)} />
                  <div className="flex-1">
                    <p className="font-medium">{classInfo.name}</p>
                    <p className="text-sm text-muted-foreground">{classInfo.grade} - {classInfo.section}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClassAssignDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveClassAssignments}>
              {language === 'en' ? 'Save' : 'حفظ'} ({selectedClassIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}