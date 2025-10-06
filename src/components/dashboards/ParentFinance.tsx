import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  CreditCard,
  FileText,
  DollarSign,
  Calendar,
  Download,
  TrendingUp,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import PaymentModal from '@/components/features/PaymentModal';

interface StudentFee {
  id: string;
  studentName: string;
  studentId: string;
  totalFees: number;
  paidAmount: number;
  remainingBalance: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
  lastPaymentDate?: string;
  academicYear: string;
  term: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: string;
  receiptNumber: string;
  studentName: string;
  description: string;
}

export default function ParentFinance() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Summary statistics
  const totalOutstanding = studentFees.reduce((sum, fee) => sum + fee.remainingBalance, 0);
  const totalPaid = studentFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const totalFees = studentFees.reduce((sum, fee) => sum + fee.totalFees, 0);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setWalletBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch students linked to this parent
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          first_name,
          last_name,
          first_name_ar,
          last_name_ar,
          grade,
          class
        `)
        .eq('parent_id', user?.id);

      if (studentsError) throw studentsError;

      // If parent has students, fetch their fees
      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        
        // Fetch student fees
        const { data: fees, error: feesError } = await supabase
          .from('student_fees')
          .select('*')
          .in('student_id', studentIds)
          .order('due_date', { ascending: true });

        if (feesError) throw feesError;

        // Format student fees data
        const formattedFees: StudentFee[] = fees?.map(fee => {
          const student = students.find(s => s.id === fee.student_id);
          const studentName = language === 'ar' 
            ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
            : `${student?.first_name} ${student?.last_name}`;
          
          return {
            id: fee.id,
            studentName: studentName,
            studentId: student?.student_id || 'N/A',
            totalFees: Number(fee.amount || 0),
            paidAmount: Number(fee.paid_amount || 0),
            remainingBalance: Number(fee.amount || 0) - Number(fee.paid_amount || 0),
            dueDate: fee.due_date,
            status: fee.status as 'paid' | 'partial' | 'overdue' | 'pending',
            lastPaymentDate: fee.updated_at,
            academicYear: fee.academic_year,
            term: fee.term
          };
        }) || [];

        setStudentFees(formattedFees);

        // Fetch payment history for all fees
        const feeIds = fees?.map(f => f.id) || [];
        if (feeIds.length > 0) {
          const { data: transactions, error: transError } = await supabase
            .from('payment_transactions')
            .select(`
              *,
              student_fees (
                student_id,
                fee_type,
                term
              )
            `)
            .in('fee_id', feeIds)
            .order('payment_date', { ascending: false })
            .limit(20);

          if (transError) throw transError;

          const formattedPayments: PaymentHistory[] = transactions?.map(trans => {
            const student = students.find(s => s.id === trans.student_fees?.student_id);
            const studentName = language === 'ar' 
              ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
              : `${student?.first_name} ${student?.last_name}`;
            
            return {
              id: trans.id,
              date: trans.payment_date,
              amount: trans.amount,
              method: trans.payment_method,
              status: 'completed',
              receiptNumber: trans.receipt_number || 'N/A',
              studentName: studentName || 'N/A',
              description: `${trans.student_fees?.fee_type || 'Fee'} - ${trans.student_fees?.term || ''}`
            };
          }) || [];

          setPaymentHistory(formattedPayments);
        }
      } else {
        // No students linked to this parent
        setStudentFees([]);
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to load financial data' : 'فشل في تحميل البيانات المالية',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (feeId: string) => {
    const fee = studentFees.find(f => f.id === feeId);
    if (!fee) return;

    // Check if wallet has sufficient balance
    if (walletBalance < fee.remainingBalance) {
      toast({
        title: language === 'en' ? 'Insufficient Balance' : 'رصيد غير كافي',
        description: language === 'en' 
          ? `Your wallet balance (${walletBalance.toFixed(2)} OMR) is less than the fee amount (${fee.remainingBalance.toFixed(2)} OMR)`
          : `رصيد محفظتك (${walletBalance.toFixed(2)} ريال) أقل من مبلغ الرسوم (${fee.remainingBalance.toFixed(2)} ريال)`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('process_fee_payment_from_wallet', {
        p_fee_id: feeId,
        p_amount: fee.remainingBalance
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast({
          title: language === 'en' ? 'Payment Successful' : 'تم الدفع بنجاح',
          description: language === 'en' 
            ? `Payment of ${fee.remainingBalance.toFixed(2)} OMR has been processed`
            : `تم معالجة دفعة بقيمة ${fee.remainingBalance.toFixed(2)} ريال`
        });
        
        // Refresh data
        fetchFinancialData();
        fetchWalletBalance();
      } else {
        toast({
          title: language === 'en' ? 'Payment Failed' : 'فشل الدفع',
          description: result?.message || (language === 'en' ? 'Unable to process payment' : 'غير قادر على معالجة الدفع'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to process payment' : 'فشل في معالجة الدفع',
        variant: 'destructive'
      });
    }
  };

  const downloadReceipt = (paymentId: string) => {
    toast({
      title: language === 'en' ? 'Downloading Receipt' : 'تحميل الإيصال',
      description: language === 'en' ? 'Your receipt is being downloaded' : 'جاري تحميل الإيصال'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: 'default' as const, icon: CheckCircle, className: 'bg-success/10 text-success border-success' },
      partial: { variant: 'secondary' as const, icon: Clock, className: 'bg-warning/10 text-warning border-warning' },
      overdue: { variant: 'destructive' as const, icon: AlertCircle, className: '' },
      pending: { variant: 'secondary' as const, icon: Clock, className: '' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
        <Icon className="h-3 w-3" />
        {language === 'en' ? status.charAt(0).toUpperCase() + status.slice(1) : 
          status === 'paid' ? 'مدفوع' : 
          status === 'partial' ? 'جزئي' : 
          status === 'overdue' ? 'متأخر' : 'معلق'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Total Fees' : 'إجمالي الرسوم'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFees.toFixed(2)} OMR</div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'Academic Year 2023-2024' : 'السنة الدراسية 2023-2024'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Total Paid' : 'المدفوع'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalPaid.toFixed(2)} OMR</div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? `${((totalPaid/totalFees) * 100).toFixed(0)}% completed` : 
                `${((totalPaid/totalFees) * 100).toFixed(0)}% مكتمل`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Outstanding' : 'المتبقي'}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totalOutstanding.toFixed(2)} OMR</div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'Due by Feb 15, 2024' : 'يستحق بتاريخ 15 فبراير 2024'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Wallet Balance' : 'رصيد المحفظة'}
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{walletBalance.toFixed(2)} OMR</div>
            <Button variant="link" className="p-0 h-auto text-xs">
              {language === 'en' ? 'Top up wallet →' : 'شحن المحفظة ←'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fees">
            {language === 'en' ? 'Student Fees' : 'رسوم الطلاب'}
          </TabsTrigger>
          <TabsTrigger value="history">
            {language === 'en' ? 'Payment History' : 'سجل المدفوعات'}
          </TabsTrigger>
          <TabsTrigger value="invoices">
            {language === 'en' ? 'Invoices' : 'الفواتير'}
          </TabsTrigger>
        </TabsList>

        {/* Student Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          {studentFees.map((fee) => (
            <Card key={fee.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{fee.studentName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Student ID:' : 'رقم الطالب:'} {fee.studentId}
                    </p>
                  </div>
                  {getStatusBadge(fee.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Academic Year' : 'السنة الدراسية'}
                      </span>
                      <span className="font-medium">{fee.academicYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Term' : 'الفصل الدراسي'}
                      </span>
                      <span className="font-medium">{fee.term}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Due Date' : 'تاريخ الاستحقاق'}
                      </span>
                      <span className="font-medium">{format(new Date(fee.dueDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Total Fees' : 'إجمالي الرسوم'}
                      </span>
                      <span className="font-medium">{fee.totalFees.toFixed(2)} OMR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Paid Amount' : 'المبلغ المدفوع'}
                      </span>
                      <span className="font-medium text-success">{fee.paidAmount.toFixed(2)} OMR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Remaining' : 'المتبقي'}
                      </span>
                      <span className="font-bold text-warning">{fee.remainingBalance.toFixed(2)} OMR</span>
                    </div>
                  </div>
                </div>
                
                {fee.remainingBalance > 0 && (
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={() => handlePayment(fee.id)}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      {language === 'en' ? 'Pay Now' : 'ادفع الآن'}
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {language === 'en' ? 'Payment Plan' : 'خطة الدفع'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Recent Payments' : 'المدفوعات الأخيرة'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-success/10 rounded-full">
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">{payment.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.date), 'MMM dd, yyyy')} • {payment.method}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'en' ? 'Receipt:' : 'رقم الإيصال:'} {payment.receiptNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{payment.amount.toFixed(2)} OMR</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadReceipt(payment.id)}
                          className="mt-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {language === 'en' ? 'Receipt' : 'الإيصال'}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'en' ? 'No payment history available' : 'لا يوجد سجل مدفوعات'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Invoices & Statements' : 'الفواتير والكشوفات'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {language === 'en' ? 'January 2024 Statement' : 'كشف يناير 2024'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Generated on Jan 31, 2024' : 'تم إنشاؤه في 31 يناير 2024'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {language === 'en' ? 'Fee Structure 2023-2024' : 'هيكل الرسوم 2023-2024'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Academic year fee breakdown' : 'تفاصيل رسوم السنة الدراسية'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal />
      )}
    </div>
  );
}