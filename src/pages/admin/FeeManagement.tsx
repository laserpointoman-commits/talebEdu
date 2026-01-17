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
import { getText } from '@/utils/i18n';

export default function FeeManagement() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  const isRTL = language === 'ar';
  const t = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);

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
        title="Fee Management"
        titleAr="إدارة الرسوم"
        titleHi="शुल्क प्रबंधन"
        subtitle="Manage student fees, record payments, and track payment history"
        subtitleAr="إدارة رسوم الطلاب وتسجيل المدفوعات وتتبع سجل الدفع"
        subtitleHi="छात्र शुल्क प्रबंधित करें, भुगतान रिकॉर्ड करें और भुगतान इतिहास ट्रैक करें"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('Total Due', 'إجمالي المستحق', 'कुल बकाया')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" dir="ltr">
              {wrapBidiText(totals.total.toFixed(3))} {t('OMR', 'ر.ع', 'OMR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('Total Collected', 'إجمالي المحصل', 'कुल प्राप्त')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" dir="ltr">
              {wrapBidiText(totals.paid.toFixed(3))} {t('OMR', 'ر.ع', 'OMR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('Overdue', 'المتأخر', 'अतिदेय')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" dir="ltr">
              {wrapBidiText(totals.overdue.toFixed(3))} {t('OMR', 'ر.ع', 'OMR')}
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
                placeholder={t('Search by student name or class...', 'البحث باسم الطالب أو الصف...', 'छात्र का नाम या कक्षा से खोजें...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('Status', 'الحالة', 'स्थिति')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Status', 'جميع الحالات', 'सभी स्थिति')}</SelectItem>
                <SelectItem value="pending">{t('Pending', 'قيد الانتظار', 'लंबित')}</SelectItem>
                <SelectItem value="partial">{t('Partial', 'جزئي', 'आंशिक')}</SelectItem>
                <SelectItem value="paid">{t('Paid', 'مدفوع', 'भुगतान किया गया')}</SelectItem>
                <SelectItem value="overdue">{t('Overdue', 'متأخر', 'अतिदेय')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('Grade', 'الصف', 'ग्रेड')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Grades', 'جميع الصفوف', 'सभी ग्रेड')}</SelectItem>
                {uniqueGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {t('Export', 'تصدير', 'निर्यात')}
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
            {t('No student fees found', 'لا توجد رسوم للطلاب', 'कोई छात्र शुल्क नहीं मिला')}
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
