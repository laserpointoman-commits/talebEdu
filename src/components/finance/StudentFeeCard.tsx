import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, DollarSign, Clock, Calendar, History, Send } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import EditFeeDialog from './EditFeeDialog';
import RecordPaymentDialog from './RecordPaymentDialog';
import FeeHistoryTimeline from './FeeHistoryTimeline';
import { wrapBidiText } from '@/utils/bidirectional';
import { getText } from '@/utils/i18n';

interface StudentFeeCardProps {
  studentFee: any;
  onUpdate: () => void;
}

export default function StudentFeeCard({ studentFee, onUpdate }: StudentFeeCardProps) {
  const { language } = useLanguage();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const student = studentFee.student;
  const balance = studentFee.total_amount - (studentFee.paid_amount || 0);
  const isOverdue = new Date(studentFee.due_date) < new Date() && balance > 0;
  const daysUntilDue = differenceInDays(new Date(studentFee.due_date), new Date());

  const t = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);

  const getStatusBadge = () => {
    if (studentFee.status === 'paid') {
      return <Badge className="bg-green-500">{t('Paid', 'مدفوع', 'भुगतान किया गया')}</Badge>;
    } else if (studentFee.status === 'overdue') {
      return <Badge variant="destructive">{t('Overdue', 'متأخر', 'अतिदेय')}</Badge>;
    } else if (studentFee.status === 'partial') {
      return <Badge className="bg-yellow-500">{t('Partial', 'جزئي', 'आंशिक')}</Badge>;
    } else {
      return <Badge variant="secondary">{t('Pending', 'قيد الانتظار', 'लंबित')}</Badge>;
    }
  };

  const isRTL = language === 'ar';

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className={`pb-3 ${isRTL ? 'text-right' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Avatar>
              <AvatarImage src={student?.profile_image} />
              <AvatarFallback>{student?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {isRTL ? student?.full_name_ar || student?.full_name : student?.full_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('Grade', 'الصف', 'ग्रेड')} {student?.class}
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Fee Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {t('Total Fee', 'إجمالي الرسوم', 'कुल शुल्क')}
              </p>
              <p className="text-lg font-bold" dir="ltr">{wrapBidiText(studentFee.total_amount)} {t('OMR', 'ر.ع', 'OMR')}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {t('Paid', 'المدفوع', 'भुगतान किया गया')}
              </p>
              <p className="text-lg font-bold text-green-600" dir="ltr">{wrapBidiText(studentFee.paid_amount || 0)} {t('OMR', 'ر.ع', 'OMR')}</p>
            </div>
            <div className={`p-3 rounded-lg ${balance > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
              <p className="text-xs text-muted-foreground mb-1">
                {t('Balance', 'المتبقي', 'बकाया')}
              </p>
              <p className={`text-lg font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`} dir="ltr">
                {wrapBidiText(balance)} {t('OMR', 'ر.ع', 'OMR')}
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {t('Due Date', 'تاريخ الاستحقاق', 'देय तिथि')}
              </p>
              <p className="text-sm font-semibold" dir="ltr">
                {format(new Date(studentFee.due_date), 'MMM dd, yyyy', { locale: isRTL ? ar : undefined })}
              </p>
              {daysUntilDue >= 0 && balance > 0 && (
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {wrapBidiText(daysUntilDue)} {t('days left', 'يوم متبقي', 'दिन शेष')}
                </p>
              )}
              {isOverdue && (
                <p className="text-xs text-destructive" dir="ltr">
                  {wrapBidiText(Math.abs(daysUntilDue))} {t('days overdue', 'يوم متأخر', 'दिन अतिदेय')}
                </p>
              )}
            </div>
          </div>

          {/* Discount Info */}
          {studentFee.discount_amount > 0 && (
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {t('Discount Applied', 'خصم مطبق', 'छूट लागू')}
              </p>
              <p className="text-sm font-semibold text-blue-600" dir="ltr">
                {wrapBidiText(studentFee.discount_amount)} {t('OMR', 'ر.ع', 'OMR')}
              </p>
            </div>
          )}

          {/* Installment Info */}
          {studentFee.installment_plans && studentFee.installment_plans.length > 0 && (
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {t('Installment Plan', 'خطة التقسيط', 'किस्त योजना')}
              </p>
              <p className="text-sm font-semibold">
                {studentFee.installment_plans[0].total_installments} {t('installments', 'قسط', 'किस्तें')} • 
                {' '}{studentFee.installment_plans[0].frequency === 'monthly' ? t('Monthly', 'شهري', 'मासिक') : 
                     studentFee.installment_plans[0].frequency === 'quarterly' ? t('Quarterly', 'ربع سنوي', 'त्रैमासिक') : 
                     t('Semi-Annual', 'نصف سنوي', 'अर्धवार्षिक')}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`grid grid-cols-2 gap-2 pt-2 ${isRTL ? 'direction-rtl' : ''}`}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {t('Edit', 'تعديل', 'संपादित करें')}
            </Button>
            {balance > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setPaymentDialogOpen(true)}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                {t('Record Payment', 'تسجيل دفعة', 'भुगतान दर्ज करें')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryDialogOpen(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              {t('History', 'السجل', 'इतिहास')}
            </Button>
            {balance > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {t('Reminder', 'تذكير', 'रिमाइंडर')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <EditFeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        studentFee={studentFee}
        onSuccess={onUpdate}
      />

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        studentFee={studentFee}
        onSuccess={onUpdate}
      />

      <FeeHistoryTimeline
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        studentId={student?.id}
        studentFeeId={studentFee.id}
      />
    </>
  );
}
