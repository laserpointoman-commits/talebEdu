import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle2, XCircle, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PendingStudent {
  id: string;
  full_name?: string;
  full_name_ar?: string;
  class: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  pending_student_approvals?: Array<{
    rejection_reason?: string;
  }>;
}

interface PendingStudentsListProps {
  students?: PendingStudent[];
  onRefresh?: () => void;
}

export default function PendingStudentsList({ students: propStudents, onRefresh: propOnRefresh }: PendingStudentsListProps = {}) {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<PendingStudent[]>(propStudents || []);
  const [loading, setLoading] = useState(!propStudents);
  const [canRegisterMore, setCanRegisterMore] = useState(false);

  useEffect(() => {
    if (propStudents) {
      setStudents(propStudents);
      setLoading(false);
    } else {
      loadPendingStudents();
    }
  }, [profile, propStudents]);

  const loadPendingStudents = async () => {
    if (!profile?.id || propStudents) return;

    try {
      // Load all students (approved and pending)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          pending_student_approvals(rejection_reason)
        `)
        .eq('parent_id', profile.id)
        .eq('visible_to_parent', false)
        .order('submitted_at', { ascending: false });

      if (studentsError) throw studentsError;

      setStudents((studentsData || []) as PendingStudent[]);

      // Check if can register more
      const { data: profileData } = await supabase
        .from('profiles')
        .select('expected_students_count, registered_students_count')
        .eq('id', profile.id)
        .single();

      if (profileData) {
        setCanRegisterMore(
          (profileData.registered_students_count || 0) < (profileData.expected_students_count || 0)
        );
      }

      if (propOnRefresh) propOnRefresh();
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> {language === 'en' ? 'Approved' : 'موافق عليه'}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> {language === 'en' ? 'Rejected' : 'مرفوض'}</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {language === 'en' ? 'Pending' : 'قيد الانتظار'}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const pendingStudents = students.filter(s => s.approval_status === 'pending');
  const approvedStudents = students.filter(s => s.approval_status === 'approved');
  const rejectedStudents = students.filter(s => s.approval_status === 'rejected');

  return (
    <div className="space-y-6">
      {pendingStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              {language === 'en' ? 'Pending Approval' : 'في انتظار الموافقة'}
              <Badge variant="secondary">{pendingStudents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {language === 'en' ? student.full_name : student.full_name_ar || student.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {language === 'en' ? 'Submitted' : 'تم الإرسال'}: {new Date(student.submitted_at).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA')}
                    </p>
                  </div>
                </div>
                {getStatusBadge(student.approval_status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {rejectedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              {language === 'en' ? 'Needs Attention' : 'يحتاج إلى اهتمام'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rejectedStudents.map((student) => (
              <div key={student.id} className="p-4 border border-destructive/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {language === 'en' ? student.full_name : student.full_name_ar || student.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{language === 'en' ? 'Class' : 'الصف'}: {student.class}</p>
                    </div>
                  </div>
                  {getStatusBadge(student.approval_status)}
                </div>
                {student.pending_student_approvals?.[0]?.rejection_reason && (
                  <div className="bg-destructive/5 p-3 rounded border border-destructive/20">
                    <p className="text-sm font-medium mb-1">{language === 'en' ? 'Reason:' : 'السبب:'}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.pending_student_approvals[0].rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {canRegisterMore && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              {language === 'en' 
                ? 'You can register more students'
                : 'يمكنك تسجيل المزيد من الطلاب'}
            </p>
            <Button onClick={() => navigate('/dashboard/register-student')}>
              {language === 'en' ? 'Register Another Student' : 'تسجيل طالب آخر'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
