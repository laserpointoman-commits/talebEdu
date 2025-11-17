import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Download } from 'lucide-react';
import StudentFeeCard from '@/components/finance/StudentFeeCard';
import { PageHeader } from '@/components/ui/page-header';
import { wrapBidiText } from '@/utils/bidirectional';

export default function FeeManagement() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  const isRTL = language === 'ar';

  useEffect(() => {
    loadStudentFees();
  }, []);

  const loadStudentFees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          *,
          student:students(
            id,
            full_name,
            full_name_ar,
            class,
            profile_image,
            parent_id
          ),
          installment_plans(*)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setStudentFees(data || []);
    } catch (error) {
      console.error('Error loading student fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFees = studentFees.filter((fee) => {
    const matchesSearch =
      fee.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.student?.full_name_ar?.includes(searchTerm) ||
      fee.student?.class?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;
    const matchesGrade = gradeFilter === 'all' || fee.student?.class === gradeFilter;

    return matchesSearch && matchesStatus && matchesGrade;
  });

  const uniqueGrades = Array.from(new Set(studentFees.map((fee) => fee.student?.class).filter(Boolean)));

  const calculateTotals = () => {
    const total = filteredFees.reduce((sum, fee) => sum + (fee.total_amount || 0), 0);
    const paid = filteredFees.reduce((sum, fee) => sum + (fee.paid_amount || 0), 0);
    const overdue = filteredFees
      .filter((fee) => fee.status === 'overdue')
      .reduce((sum, fee) => sum + (fee.total_amount - (fee.paid_amount || 0)), 0);

    return { total, paid, overdue };
  };

  const totals = calculateTotals();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        showBackButton
        title="Fee Management"
        titleAr="إدارة الرسوم"
        subtitle="Manage student fees, record payments, and track payment history"
        subtitleAr="إدارة رسوم الطلاب وتسجيل المدفوعات وتتبع سجل الدفع"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Due' : 'إجمالي المستحق'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" dir="ltr">
              {wrapBidiText(totals.total.toFixed(3))} {language === 'en' ? 'OMR' : 'ر.ع'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Total Collected' : 'إجمالي المحصل'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" dir="ltr">
              {wrapBidiText(totals.paid.toFixed(3))} {language === 'en' ? 'OMR' : 'ر.ع'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'en' ? 'Overdue' : 'المتأخر'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" dir="ltr">
              {wrapBidiText(totals.overdue.toFixed(3))} {language === 'en' ? 'OMR' : 'ر.ع'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className={`flex flex-col md:flex-row gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1 relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={language === 'en' ? 'Search by student name or class...' : 'البحث باسم الطالب أو الصف...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={language === 'en' ? 'Status' : 'الحالة'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'en' ? 'All Status' : 'جميع الحالات'}</SelectItem>
                <SelectItem value="pending">{language === 'en' ? 'Pending' : 'قيد الانتظار'}</SelectItem>
                <SelectItem value="partial">{language === 'en' ? 'Partial' : 'جزئي'}</SelectItem>
                <SelectItem value="paid">{language === 'en' ? 'Paid' : 'مدفوع'}</SelectItem>
                <SelectItem value="overdue">{language === 'en' ? 'Overdue' : 'متأخر'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={language === 'en' ? 'Grade' : 'الصف'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'en' ? 'All Grades' : 'جميع الصفوف'}</SelectItem>
                {uniqueGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {language === 'en' ? 'Export' : 'تصدير'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fee Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredFees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {language === 'en' ? 'No student fees found' : 'لا توجد رسوم للطلاب'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFees.map((fee) => (
            <StudentFeeCard
              key={fee.id}
              studentFee={fee}
              onUpdate={loadStudentFees}
            />
          ))}
        </div>
      )}
    </div>
  );
}
