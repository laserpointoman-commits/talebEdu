import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, User, Scan, Smartphone, Eye, Wifi, Nfc } from "lucide-react";
import LogoLoader from "@/components/LogoLoader";
import AddStudentDialog from "@/components/admin/AddStudentDialog";
import StudentNFCDialog from "@/components/admin/StudentNFCDialog";
import { nfcService } from "@/services/nfcService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StudentManagement() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [nfcSupported, setNfcSupported] = useState(false);
  const [checkingNfc, setCheckingNfc] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [nfcDialogOpen, setNfcDialogOpen] = useState(false);
  const [nfcStudent, setNfcStudent] = useState<any>(null);
  const [writingNfc, setWritingNfc] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
    checkNfcSupport();
  }, []);

  const checkNfcSupport = async () => {
    setCheckingNfc(true);
    // Give the native plugin time to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    const supported = nfcService.isSupported();
    setNfcSupported(supported);
    setCheckingNfc(false);
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWriteNFC = async (student: any) => {
    setWritingNfc(student.id);
    try {
      const nfcData = {
        id: student.nfc_id,
        type: 'student' as const,
        name: `${student.first_name} ${student.last_name}`,
        additionalData: {
          studentId: student.student_id,
          grade: student.grade,
          class: student.class
        }
      };
      
      const success = await nfcService.writeTag(nfcData);
      if (success) {
        toast({
          title: language === 'ar' ? 'نجح' : 'Success',
          description: language === 'ar' ? 'تم كتابة بطاقة NFC بنجاح' : 'NFC tag written successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setWritingNfc(null);
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nfc_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'إدارة الطلاب' : 'Student Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'عرض وإدارة جميع الطلاب' : 'View and manage all students'}
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {language === 'ar' ? 'إضافة طالب' : 'Add Student'}
        </Button>
      </div>

      <AddStudentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={loadStudents}
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'بحث بالاسم، رقم الطالب، أو NFC...' : 'Search by name, student ID, or NFC...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {language === 'ar' && student.first_name_ar
                      ? `${student.first_name_ar} ${student.last_name_ar}`
                      : `${student.first_name} ${student.last_name}`}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{student.student_id}</Badge>
                    <Badge variant="outline">{student.class}</Badge>
                  </div>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Scan className="h-4 w-4 text-primary" />
                  <span className="font-mono text-xs">{student.nfc_id || (language === 'ar' ? 'لم يتم تعيين' : 'Not assigned')}</span>
                </div>
                {student.nfc_id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleWriteNFC(student)}
                    disabled={writingNfc === student.id}
                  >
                    <Nfc className={`h-4 w-4 ${writingNfc === student.id ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{language === 'ar' ? 'الصف:' : 'Grade:'}</span>
                <span>{student.grade}</span>
              </div>
              <div className="flex items-center gap-2">
                {student.status === 'active' ? (
                  <Badge className="bg-green-500">
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    {language === 'ar' ? 'غير نشط' : 'Inactive'}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedStudent(student);
                    setDetailsDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تفاصيل' : 'Details'}
                </Button>
                <Button
                  variant={student.nfc_id ? "default" : "secondary"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setNfcStudent(student);
                    setNfcDialogOpen(true);
                  }}
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'NFC' : 'NFC'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لم يتم العثور على طلاب' : 'No students found'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Student Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تفاصيل الطالب' : 'Student Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                  </p>
                  <p className="text-base">{selectedStudent.first_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'اسم العائلة' : 'Last Name'}
                  </p>
                  <p className="text-base">{selectedStudent.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'رقم الطالب' : 'Student ID'}
                  </p>
                  <p className="text-base font-mono">{selectedStudent.student_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الصف' : 'Grade'}
                  </p>
                  <p className="text-base">{selectedStudent.grade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الفصل' : 'Class'}
                  </p>
                  <p className="text-base">{selectedStudent.class}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الجنس' : 'Gender'}
                  </p>
                  <p className="text-base">{selectedStudent.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
                  </p>
                  <p className="text-base">{selectedStudent.date_of_birth || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'فصيلة الدم' : 'Blood Group'}
                  </p>
                  <p className="text-base">{selectedStudent.blood_group || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الجنسية' : 'Nationality'}
                  </p>
                  <p className="text-base">{selectedStudent.nationality || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'رقم NFC' : 'NFC ID'}
                  </p>
                  <p className="text-base font-mono">{selectedStudent.nfc_id || language === 'ar' ? 'لم يتم تعيين' : 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </p>
                  <p className="text-base">{selectedStudent.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'هاتف ولي الأمر' : 'Parent Phone'}
                  </p>
                  <p className="text-base">{selectedStudent.parent_phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'العنوان' : 'Address'}
                  </p>
                  <p className="text-base">{selectedStudent.address || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الحساسية' : 'Allergies'}
                  </p>
                  <p className="text-base">{selectedStudent.allergies || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الحالة الطبية' : 'Medical Conditions'}
                  </p>
                  <p className="text-base">{selectedStudent.medical_conditions || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'اسم جهة الاتصال الطارئة' : 'Emergency Contact Name'}
                  </p>
                  <p className="text-base">{selectedStudent.emergency_contact_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'رقم الاتصال الطارئ' : 'Emergency Contact'}
                  </p>
                  <p className="text-base">{selectedStudent.emergency_contact || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NFC Dialog */}
      <StudentNFCDialog
        student={nfcStudent}
        open={nfcDialogOpen}
        onOpenChange={setNfcDialogOpen}
      />

      {/* NFC Instructions */}
      {nfcSupported && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              {language === 'ar' ? 'تعليمات NFC' : 'NFC Instructions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {language === 'ar' 
                ? '📱 تأكد من تفعيل NFC في إعدادات الجهاز'
                : '📱 Ensure NFC is enabled in device settings'}
            </p>
            <p>
              {language === 'ar' 
                ? '🔒 اقترب من السوار (أقل من 5 سم)'
                : '🔒 Hold device near wristband (less than 5cm)'}
            </p>
            <p>
              {language === 'ar' 
                ? '✨ سيتم التسجيل تلقائياً عند الاقتراب'
                : '✨ Automatic registration on proximity'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}