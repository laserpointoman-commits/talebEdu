import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { wrapBidiText } from '@/utils/bidirectional';

interface EditFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentFee: any;
  onSuccess: () => void;
}

export default function EditFeeDialog({ open, onOpenChange, studentFee, onSuccess }: EditFeeDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    total_amount: '',
    discount_amount: '',
    due_date: '',
    notes: ''
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    if (studentFee && open) {
      setFormData({
        total_amount: studentFee.total_amount?.toString() || '',
        discount_amount: studentFee.discount_amount?.toString() || '0',
        due_date: studentFee.due_date || '',
        notes: studentFee.notes || ''
      });
    }
  }, [studentFee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const oldValues = {
        total_amount: studentFee.total_amount,
        discount_amount: studentFee.discount_amount,
        due_date: studentFee.due_date,
        notes: studentFee.notes
      };

      const newValues = {
        total_amount: parseFloat(formData.total_amount),
        discount_amount: parseFloat(formData.discount_amount || '0'),
        due_date: formData.due_date,
        notes: formData.notes
      };

      // Update student fee
      const { error: updateError } = await supabase
        .from('student_fees')
        .update({
          total_amount: newValues.total_amount,
          discount_amount: newValues.discount_amount,
          due_date: newValues.due_date,
          notes: newValues.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentFee.id);

      if (updateError) throw updateError;

      // Create history entry
      const changes = [];
      if (oldValues.total_amount !== newValues.total_amount) {
        changes.push(`Total amount: ${oldValues.total_amount} → ${newValues.total_amount}`);
      }
      if (oldValues.discount_amount !== newValues.discount_amount) {
        changes.push(`Discount: ${oldValues.discount_amount} → ${newValues.discount_amount}`);
      }
      if (oldValues.due_date !== newValues.due_date) {
        changes.push(`Due date: ${oldValues.due_date} → ${newValues.due_date}`);
      }

      const { error: historyError } = await supabase
        .from('student_fee_history')
        .insert({
          student_fee_id: studentFee.id,
          student_id: studentFee.student_id,
          action_type: 'updated',
          changed_by: user?.id,
          old_values: oldValues,
          new_values: newValues,
          description: `Fee details updated: ${changes.join(', ')}`,
          description_ar: `تم تحديث تفاصيل الرسوم: ${changes.join('، ')}`
        });

      if (historyError) throw historyError;

      toast.success(language === 'en' ? 'Fee updated successfully' : 'تم تحديث الرسوم بنجاح');
      onOpenChange(false);
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
            {language === 'en' ? 'Edit Fee Details' : 'تعديل تفاصيل الرسوم'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en'
              ? 'Update fee information. All changes will be tracked in the history.'
              : 'تحديث معلومات الرسوم. سيتم تتبع جميع التغييرات في السجل.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total_amount">
              {language === 'en' ? 'Total Amount (OMR)' : 'المبلغ الإجمالي (ر.ع)'}
            </Label>
            <Input
              id="total_amount"
              type="number"
              step="0.001"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_amount">
              {language === 'en' ? 'Discount Amount (OMR)' : 'مبلغ الخصم (ر.ع)'}
            </Label>
            <Input
              id="discount_amount"
              type="number"
              step="0.001"
              value={formData.discount_amount}
              onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">
              {language === 'en' ? 'Due Date' : 'تاريخ الاستحقاق'}
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {language === 'en' ? 'Notes' : 'ملاحظات'}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
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
              {language === 'en' ? 'Save Changes' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
