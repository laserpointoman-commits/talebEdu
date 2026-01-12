import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2, User, Clock } from 'lucide-react';
import StudentApprovalDialog from '@/components/admin/StudentApprovalDialog';

export default function StudentApprovalDashboard() {
  const { language } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    loadPendingStudents();
  }, []);

  const loadPendingStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles!students_parent_id_fkey(full_name, email, phone)')
        .eq('approval_status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader
        title="Student Approval"
        titleAr="الموافقة على الطلاب"
        subtitle="Review and approve pending student registrations"
        subtitleAr="مراجعة والموافقة على تسجيلات الطلاب المعلقة"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {language === 'en' ? 'Pending Student Approvals' : 'موافقات الطلاب المعلقة'}
            <Badge>{students.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {language === 'en' ? 'No pending approvals' : 'لا توجد موافقات معلقة'}
            </p>
          ) : (
            <div className="space-y-4">
              {students.map((student) => {
                const studentName = student.first_name && student.last_name 
                  ? `${student.first_name} ${student.last_name}`
                  : student.full_name || 'Unknown Student';
                
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <User className="w-10 h-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Parent:' : 'ولي الأمر:'} {student.profiles?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'en' ? 'Grade:' : 'الصف:'} {student.grade} {student.class && `- ${student.class}`}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setSelectedStudent(student)}>
                      {language === 'en' ? 'Review' : 'مراجعة'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <StudentApprovalDialog
          student={selectedStudent}
          open={!!selectedStudent}
          onOpenChange={(open) => !open && setSelectedStudent(null)}
          onSuccess={loadPendingStudents}
        />
      )}
    </div>
  );
}
