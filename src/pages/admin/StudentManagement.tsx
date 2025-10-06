import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, User, Scan, Smartphone } from "lucide-react";
import LogoLoader from "@/components/LogoLoader";
import AddStudentDialog from "@/components/admin/AddStudentDialog";

export default function StudentManagement() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [nfcSupported, setNfcSupported] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    loadStudents();
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

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
              <div className="flex items-center gap-2 text-sm">
                <Scan className="h-4 w-4 text-primary" />
                <span className="font-mono text-xs">{student.nfc_id}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{language === 'ar' ? 'الصف:' : 'Grade:'}</span>
                <span>{student.grade}</span>
              </div>
              {student.status === 'active' ? (
                <Badge className="bg-green-500">
                  {language === 'ar' ? 'نشط' : 'Active'}
                </Badge>
              ) : (
                <Badge variant="destructive">
                  {language === 'ar' ? 'غير نشط' : 'Inactive'}
                </Badge>
              )}
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