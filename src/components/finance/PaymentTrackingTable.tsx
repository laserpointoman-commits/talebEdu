import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Mail, Search } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentRecord {
  id: string;
  student: {
    first_name: string;
    last_name: string;
    class: string;
  };
  fee_type: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  discount_amount: number;
}

export default function PaymentTrackingTable() {
  const { language } = useLanguage();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          id,
          fee_type,
          amount,
          paid_amount,
          due_date,
          status,
          discount_amount,
          student:students(first_name, last_name, class)
        `)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setPayments(data as any || []);
    } catch (error: any) {
      toast.error(language === 'en' ? 'Failed to load payments' : 'فشل تحميل المدفوعات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      partial: 'secondary',
      pending: 'outline',
      overdue: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['Student', 'Class', 'Fee Type', 'Total', 'Paid', 'Remaining', 'Due Date', 'Status'];
    const rows = filteredPayments.map(p => [
      `${p.student.first_name} ${p.student.last_name}`,
      p.student.class,
      p.fee_type,
      p.amount,
      p.paid_amount,
      (p.amount - p.paid_amount).toFixed(3),
      p.due_date,
      p.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success(language === 'en' ? 'Report exported' : 'تم تصدير التقرير');
  };

  const sendReminder = async (feeId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-payment-reminder', {
        body: { fee_id: feeId }
      });

      if (error) throw error;
      toast.success(language === 'en' ? 'Reminder sent' : 'تم إرسال التذكير');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const fullName = `${payment.student.first_name} ${payment.student.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesGrade = gradeFilter === 'all' || payment.student.class === gradeFilter;
    return matchesSearch && matchesStatus && matchesGrade;
  });

  const uniqueGrades = Array.from(new Set(payments.map(p => p.student.class))).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'en' ? 'Search students...' : 'بحث عن طلاب...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'en' ? 'All Status' : 'كل الحالات'}</SelectItem>
            <SelectItem value="paid">{language === 'en' ? 'Paid' : 'مدفوع'}</SelectItem>
            <SelectItem value="partial">{language === 'en' ? 'Partial' : 'جزئي'}</SelectItem>
            <SelectItem value="pending">{language === 'en' ? 'Pending' : 'قيد الانتظار'}</SelectItem>
            <SelectItem value="overdue">{language === 'en' ? 'Overdue' : 'متأخر'}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'en' ? 'All Grades' : 'كل الصفوف'}</SelectItem>
            {uniqueGrades.map(grade => (
              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Export' : 'تصدير'}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'en' ? 'Student' : 'الطالب'}</TableHead>
              <TableHead>{language === 'en' ? 'Class' : 'الصف'}</TableHead>
              <TableHead>{language === 'en' ? 'Fee Type' : 'نوع الرسوم'}</TableHead>
              <TableHead>{language === 'en' ? 'Total' : 'المجموع'}</TableHead>
              <TableHead>{language === 'en' ? 'Paid' : 'المدفوع'}</TableHead>
              <TableHead>{language === 'en' ? 'Remaining' : 'المتبقي'}</TableHead>
              <TableHead>{language === 'en' ? 'Due Date' : 'تاريخ الاستحقاق'}</TableHead>
              <TableHead>{language === 'en' ? 'Status' : 'الحالة'}</TableHead>
              <TableHead className="text-right">{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  {language === 'en' ? 'Loading...' : 'جاري التحميل...'}
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  {language === 'en' ? 'No payments found' : 'لم يتم العثور على مدفوعات'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => {
                const remaining = payment.amount - payment.paid_amount;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.student.first_name} {payment.student.last_name}
                    </TableCell>
                    <TableCell>{payment.student.class}</TableCell>
                    <TableCell>{payment.fee_type}</TableCell>
                    <TableCell>{payment.amount.toFixed(3)} OMR</TableCell>
                    <TableCell>{payment.paid_amount.toFixed(3)} OMR</TableCell>
                    <TableCell className={remaining > 0 ? 'text-destructive font-medium' : ''}>
                      {remaining.toFixed(3)} OMR
                    </TableCell>
                    <TableCell>{new Date(payment.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      {payment.status !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendReminder(payment.id)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
