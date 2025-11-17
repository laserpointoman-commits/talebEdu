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

  const getStatusBadge = () => {
    if (studentFee.status === 'paid') {
      return <Badge className="bg-green-500">{language === 'en' ? 'Paid' : 'مدفوع'}</Badge>;
    } else if (studentFee.status === 'overdue') {
      return <Badge variant="destructive">{language === 'en' ? 'Overdue' : 'متأخر'}</Badge>;
    } else if (studentFee.status === 'partial') {
      return <Badge className="bg-yellow-500">{language === 'en' ? 'Partial' : 'جزئي'}</Badge>;
    } else {
      return <Badge variant="secondary">{language === 'en' ? 'Pending' : 'قيد الانتظار'}</Badge>;
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
                {language === 'en' ? 'Grade' : 'الصف'} {student?.class}
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
                {language === 'en' ? 'Total Fee' : 'إجمالي الرسوم'}
              </p>
              <p className="text-lg font-bold" dir="ltr">{wrapBidiText(studentFee.total_amount)} {language === 'en' ? 'OMR' : 'ر.ع'}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'en' ? 'Paid' : 'المدفوع'}
              </p>
              <p className="text-lg font-bold text-green-600" dir="ltr">{wrapBidiText(studentFee.paid_amount || 0)} {language === 'en' ? 'OMR' : 'ر.ع'}</p>
            </div>
            <div className={`p-3 rounded-lg ${balance > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'en' ? 'Balance' : 'المتبقي'}
              </p>
              <p className={`text-lg font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`} dir="ltr">
                {wrapBidiText(balance)} {language === 'en' ? 'OMR' : 'ر.ع'}
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'en' ? 'Due Date' : 'تاريخ الاستحقاق'}
              </p>
              <p className="text-sm font-semibold" dir="ltr">
                {format(new Date(studentFee.due_date), 'MMM dd, yyyy', { locale: isRTL ? ar : undefined })}
              </p>
              {daysUntilDue >= 0 && balance > 0 && (
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {wrapBidiText(daysUntilDue)} {language === 'en' ? 'days left' : 'يوم متبقي'}
                </p>
              )}
              {isOverdue && (
                <p className="text-xs text-destructive" dir="ltr">
                  {wrapBidiText(Math.abs(daysUntilDue))} {language === 'en' ? 'days overdue' : 'يوم متأخر'}
                </p>
              )}
            </div>
          </div>

          {/* Discount Info */}
          {studentFee.discount_amount > 0 && (
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'en' ? 'Discount Applied' : 'خصم مطبق'}
              </p>
              <p className="text-sm font-semibold text-blue-600" dir="ltr">
                {wrapBidiText(studentFee.discount_amount)} {language === 'en' ? 'OMR' : 'ر.ع'}
              </p>
            </div>
          )}

          {/* Installment Info */}
          {studentFee.installment_plans && studentFee.installment_plans.length > 0 && (
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'en' ? 'Installment Plan' : 'خطة التقسيط'}
              </p>
              <p className="text-sm font-semibold">
                {studentFee.installment_plans[0].total_installments} {language === 'en' ? 'installments' : 'قسط'} • 
                {' '}{studentFee.installment_plans[0].frequency === 'monthly' ? (language === 'en' ? 'Monthly' : 'شهري') : 
                     studentFee.installment_plans[0].frequency === 'quarterly' ? (language === 'en' ? 'Quarterly' : 'ربع سنوي') : 
                     (language === 'en' ? 'Semi-Annual' : 'نصف سنوي')}
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
              {language === 'en' ? 'Edit' : 'تعديل'}
            </Button>
            {balance > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setPaymentDialogOpen(true)}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                {language === 'en' ? 'Record Payment' : 'تسجيل دفعة'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryDialogOpen(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              {language === 'en' ? 'History' : 'السجل'}
            </Button>
            {balance > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {language === 'en' ? 'Reminder' : 'تذكير'}
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
