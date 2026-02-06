import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import PageHeader from '@/components/layouts/PageHeader';
import { format } from 'date-fns';

interface Fee {
  id: string;
  fee_type: string;
  amount: number;
  paid_amount: number;
  due_date: string | null;
  status: string;
}

export default function StudentFees() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<Fee[]>([]);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (studentId && user) {
      loadData();
    }
  }, [studentId, user]);

  const loadData = async () => {
    try {
      // Verify parent owns this student
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('parent_id', user?.id)
        .single();

      if (error || !studentData) {
        navigate('/dashboard');
        return;
      }

      setStudent(studentData);

      // Get student fees
      const { data: feesData } = await supabase
        .from('student_fees')
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });

      setFees(feesData || []);
    } catch (error) {
      console.error('Error loading fees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  const totalFees = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.paid_amount), 0);
  const totalDue = totalFees - totalPaid;
  const paymentProgress = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

  const getStatusBadge = (status: string, dueDate: string | null) => {
    if (status === 'paid') {
      return { icon: CheckCircle, label: language === 'ar' ? 'مدفوع' : 'Paid', variant: 'default' as const, color: 'text-green-600' };
    }
    if (dueDate && new Date(dueDate) < new Date()) {
      return { icon: AlertTriangle, label: language === 'ar' ? 'متأخر' : 'Overdue', variant: 'destructive' as const, color: 'text-red-600' };
    }
    return { icon: Clock, label: language === 'ar' ? 'معلق' : 'Pending', variant: 'secondary' as const, color: 'text-yellow-600' };
  };

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PageHeader />
      <div className="h-12" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} />
      <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'الرسوم الدراسية' : 'School Fees'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'المتبقي للدفع' : 'Amount Due'}
              </p>
              <p className="text-3xl font-bold text-primary">
                {totalDue.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'ar' ? 'المدفوع' : 'Paid'}: {totalPaid.toFixed(3)} OMR
              </span>
              <span className="text-muted-foreground">
                {language === 'ar' ? 'الإجمالي' : 'Total'}: {totalFees.toFixed(3)} OMR
              </span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Fees List */}
      <div className="space-y-3">
        <h2 className="font-semibold">
          {language === 'ar' ? 'تفاصيل الرسوم' : 'Fee Details'}
        </h2>
        
        {fees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد رسوم مسجلة' : 'No fees recorded'}
              </p>
            </CardContent>
          </Card>
        ) : (
          fees.map((fee) => {
            const status = getStatusBadge(fee.status, fee.due_date);
            const StatusIcon = status.icon;
            const remaining = Number(fee.amount) - Number(fee.paid_amount);
            
            return (
              <Card key={fee.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${status.color}`} />
                      <div>
                        <h3 className="font-semibold">{fee.fee_type}</h3>
                        {fee.due_date && (
                          <p className="text-sm text-muted-foreground">
                            {language === 'ar' ? 'تاريخ الاستحقاق:' : 'Due:'} {format(new Date(fee.due_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">{language === 'ar' ? 'المبلغ' : 'Amount'}</p>
                      <p className="font-semibold">{Number(fee.amount).toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{language === 'ar' ? 'المدفوع' : 'Paid'}</p>
                      <p className="font-semibold text-green-600">{Number(fee.paid_amount).toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{language === 'ar' ? 'المتبقي' : 'Due'}</p>
                      <p className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {remaining.toFixed(3)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}
