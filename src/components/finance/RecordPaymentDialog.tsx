import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { wrapBidiText } from '@/utils/bidirectional';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentFee: any;
  onSuccess: () => void;
}

export default function RecordPaymentDialog({ open, onOpenChange, studentFee, onSuccess }: RecordPaymentDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const isRTL = language === 'ar';
  const maxPayment = studentFee?.total_amount - (studentFee?.paid_amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentAmount = parseFloat(formData.amount);

      if (paymentAmount <= 0) {
        throw new Error(language === 'en' ? 'Payment amount must be greater than zero' : 'يجب أن يكون مبلغ الدفع أكبر من الصفر');
      }

      if (paymentAmount > maxPayment) {
        throw new Error(language === 'en' ? 'Payment amount exceeds balance' : 'مبلغ الدفع يتجاوز الرصيد المتبقي');
      }

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}`;

      // Create payment transaction
      const { data: payment, error: paymentError } = await supabase
        .from('payment_transactions')
        .insert({
          fee_id: studentFee.id,
          parent_id: studentFee.student.parent_id,
          amount: paymentAmount,
          payment_method: formData.payment_method,
          transaction_reference: formData.transaction_reference || null,
          payment_date: formData.payment_date,
          receipt_number: receiptNumber,
          notes: formData.notes,
          created_by: user?.id
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update student fee paid amount
      const newPaidAmount = (studentFee.paid_amount || 0) + paymentAmount;
      const { error: updateError } = await supabase
        .from('student_fees')
        .update({
          paid_amount: newPaidAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentFee.id);

      if (updateError) throw updateError;

      // Get new balance for history
      const newBalance = studentFee.total_amount - newPaidAmount;

      // Create history entry
      const { error: historyError } = await supabase
        .from('student_fee_history')
        .insert({
          student_fee_id: studentFee.id,
          student_id: studentFee.student_id,
          action_type: 'payment',
          changed_by: user?.id,
          amount: paymentAmount,
          payment_method: formData.payment_method,
          transaction_reference: formData.transaction_reference || null,
          description: `Payment received: ${paymentAmount} OMR via ${formData.payment_method}. Receipt: ${receiptNumber}. Remaining balance: ${newBalance} OMR`,
          description_ar: `تم استلام الدفعة: ${paymentAmount} ر.ع عبر ${formData.payment_method}. الإيصال: ${receiptNumber}. الرصيد المتبقي: ${newBalance} ر.ع`,
          new_values: {
            paid_amount: newPaidAmount,
            balance: newBalance,
            receipt_number: receiptNumber
          }
        });

      if (historyError) throw historyError;

      toast.success(language === 'en' ? 'Payment recorded successfully' : 'تم تسجيل الدفعة بنجاح');
      onOpenChange(false);
      setFormData({
        amount: '',
        payment_method: 'cash',
        transaction_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-width-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Record Payment' : 'تسجيل دفعة'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en'
              ? `Record a payment for ${studentFee?.student?.full_name}. Maximum: ${wrapBidiText(maxPayment?.toFixed(3))} OMR`
              : `تسجيل دفعة لـ ${studentFee?.student?.full_name_ar || studentFee?.student?.full_name}. الحد الأقصى: ${wrapBidiText(maxPayment?.toFixed(3))} ر.ع`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              {language === 'en' ? 'Payment Amount (OMR)' : 'مبلغ الدفعة (ر.ع)'}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              max={maxPayment}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              dir="ltr"
              placeholder={`Max: ${maxPayment?.toFixed(3)}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">
              {language === 'en' ? 'Payment Date' : 'تاريخ الدفع'}
            </Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">
              {language === 'en' ? 'Payment Method' : 'طريقة الدفع'}
            </Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{language === 'en' ? 'Cash' : 'نقداً'}</SelectItem>
                <SelectItem value="bank_transfer">{language === 'en' ? 'Bank Transfer' : 'تحويل بنكي'}</SelectItem>
                <SelectItem value="card">{language === 'en' ? 'Card' : 'بطاقة'}</SelectItem>
                <SelectItem value="check">{language === 'en' ? 'Check' : 'شيك'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_reference">
              {language === 'en' ? 'Transaction Reference (Optional)' : 'رقم المعاملة (اختياري)'}
            </Label>
            <Input
              id="transaction_reference"
              value={formData.transaction_reference}
              onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {language === 'en' ? 'Notes (Optional)' : 'ملاحظات (اختياري)'}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'en' ? 'Record Payment' : 'تسجيل الدفعة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
