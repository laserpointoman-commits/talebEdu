import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { wrapBidiText } from '@/utils/bidirectional';

interface FeeConfigStepProps {
  feeConfig: any;
  onFeeConfigChange: (config: any) => void;
}

export default function FeeConfigStep({ feeConfig, onFeeConfigChange }: FeeConfigStepProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const updateConfig = (field: string, value: any) => {
    onFeeConfigChange({ ...feeConfig, [field]: value });
  };

  const calculateInstallments = () => {
    if (!feeConfig.enableInstallments || !feeConfig.amount || !feeConfig.installments) {
      return [];
    }

    const totalAmount = parseFloat(feeConfig.amount) - (parseFloat(feeConfig.discount) || 0);
    const installmentAmount = totalAmount / parseInt(feeConfig.installments);
    const schedule = [];

    const startDate = feeConfig.dueDate ? new Date(feeConfig.dueDate) : new Date();
    
    for (let i = 0; i < parseInt(feeConfig.installments); i++) {
      const dueDate = new Date(startDate);
      
      if (feeConfig.frequency === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (feeConfig.frequency === 'quarterly') {
        dueDate.setMonth(dueDate.getMonth() + (i * 3));
      } else if (feeConfig.frequency === 'semi-annual') {
        dueDate.setMonth(dueDate.getMonth() + (i * 6));
      }

      schedule.push({
        installment: i + 1,
        amount: installmentAmount,
        dueDate: dueDate
      });
    }

    return schedule;
  };

  const installmentSchedule = calculateInstallments();
  const netAmount = (parseFloat(feeConfig.amount) || 0) - (parseFloat(feeConfig.discount) || 0);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {language === 'en' ? 'Fee Configuration' : 'إعداد الرسوم'}
        </h3>

        {/* Base Fee */}
        <div className="space-y-2">
          <Label htmlFor="amount">
            {language === 'en' ? 'Base Fee Amount (OMR)' : 'المبلغ الأساسي للرسوم (ر.ع)'}
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            value={feeConfig.amount}
            onChange={(e) => updateConfig('amount', e.target.value)}
            required
            dir="ltr"
          />
        </div>

        {/* Academic Year */}
        <div className="space-y-2">
          <Label htmlFor="academic_year">
            {language === 'en' ? 'Academic Year' : 'العام الدراسي'}
          </Label>
          <Input
            id="academic_year"
            value={feeConfig.academic_year}
            onChange={(e) => updateConfig('academic_year', e.target.value)}
            placeholder="2024-2025"
            dir="ltr"
          />
        </div>

        {/* Fee Type */}
        <div className="space-y-2">
          <Label htmlFor="fee_type">
            {language === 'en' ? 'Fee Type' : 'نوع الرسوم'}
          </Label>
          <Select
            value={feeConfig.fee_type}
            onValueChange={(value) => updateConfig('fee_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tuition">{language === 'en' ? 'Tuition' : 'الرسوم الدراسية'}</SelectItem>
              <SelectItem value="registration">{language === 'en' ? 'Registration' : 'التسجيل'}</SelectItem>
              <SelectItem value="books">{language === 'en' ? 'Books' : 'الكتب'}</SelectItem>
              <SelectItem value="uniform">{language === 'en' ? 'Uniform' : 'الزي المدرسي'}</SelectItem>
              <SelectItem value="activities">{language === 'en' ? 'Activities' : 'الأنشطة'}</SelectItem>
              <SelectItem value="transport">{language === 'en' ? 'Transport' : 'النقل'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label>
            {language === 'en' ? 'Due Date' : 'تاريخ الاستحقاق'}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {feeConfig.dueDate ? (
                  <span dir="ltr">{format(new Date(feeConfig.dueDate), 'PPP', { locale: isRTL ? ar : undefined })}</span>
                ) : (
                  <span>{language === 'en' ? 'Pick a date' : 'اختر تاريخاً'}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={feeConfig.dueDate ? new Date(feeConfig.dueDate) : undefined}
                onSelect={(date) => updateConfig('dueDate', date?.toISOString().split('T')[0])}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Discount Section */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-medium">
              {language === 'en' ? 'Discount (Optional)' : 'الخصم (اختياري)'}
            </h4>
            <div className="space-y-2">
              <Label htmlFor="discount">
                {language === 'en' ? 'Discount Amount (OMR)' : 'مبلغ الخصم (ر.ع)'}
              </Label>
              <Input
                id="discount"
                type="number"
                step="0.001"
                value={feeConfig.discount}
                onChange={(e) => updateConfig('discount', e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_reason">
                {language === 'en' ? 'Discount Reason' : 'سبب الخصم'}
              </Label>
              <Input
                id="discount_reason"
                value={feeConfig.discount_reason}
                onChange={(e) => updateConfig('discount_reason', e.target.value)}
                placeholder={language === 'en' ? 'e.g., Sibling discount, Scholarship' : 'مثال: خصم الأخوة، منحة دراسية'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Installment Plan */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 space-y-4">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h4 className="font-medium">
                {language === 'en' ? 'Installment Plan' : 'خطة التقسيط'}
              </h4>
              <Switch
                checked={feeConfig.enableInstallments}
                onCheckedChange={(checked) => updateConfig('enableInstallments', checked)}
              />
            </div>

            {feeConfig.enableInstallments && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="installments">
                      {language === 'en' ? 'Number of Installments' : 'عدد الأقساط'}
                    </Label>
                    <Input
                      id="installments"
                      type="number"
                      min="2"
                      max="12"
                      value={feeConfig.installments}
                      onChange={(e) => updateConfig('installments', e.target.value)}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">
                      {language === 'en' ? 'Frequency' : 'التكرار'}
                    </Label>
                    <Select
                      value={feeConfig.frequency}
                      onValueChange={(value) => updateConfig('frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{language === 'en' ? 'Monthly' : 'شهري'}</SelectItem>
                        <SelectItem value="quarterly">{language === 'en' ? 'Quarterly' : 'ربع سنوي'}</SelectItem>
                        <SelectItem value="semi-annual">{language === 'en' ? 'Semi-Annual' : 'نصف سنوي'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Schedule Preview */}
                {installmentSchedule.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">
                      {language === 'en' ? 'Payment Schedule Preview' : 'معاينة جدول الدفع'}
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {installmentSchedule.map((item) => (
                        <div
                          key={item.installment}
                          className={`flex items-center justify-between text-sm p-2 bg-background rounded ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <span>
                            {language === 'en' ? 'Installment' : 'القسط'} {item.installment}
                          </span>
                          <span dir="ltr" className="font-semibold">
                            {wrapBidiText(item.amount.toFixed(3))} {language === 'en' ? 'OMR' : 'ر.ع'}
                          </span>
                          <span dir="ltr" className="text-muted-foreground text-xs">
                            {format(item.dueDate, 'MMM dd', { locale: isRTL ? ar : undefined })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{language === 'en' ? 'Base Amount:' : 'المبلغ الأساسي:'}</span>
                <span className="font-semibold" dir="ltr">{wrapBidiText(parseFloat(feeConfig.amount || 0).toFixed(3))} {language === 'en' ? 'OMR' : 'ر.ع'}</span>
              </div>
              {parseFloat(feeConfig.discount || 0) > 0 && (
                <div className={`flex justify-between text-green-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span>{language === 'en' ? 'Discount:' : 'الخصم:'}</span>
                  <span className="font-semibold" dir="ltr">- {wrapBidiText(parseFloat(feeConfig.discount || 0).toFixed(3))} {language === 'en' ? 'OMR' : 'ر.ع'}</span>
                </div>
              )}
              <div className={`flex justify-between text-lg font-bold border-t pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{language === 'en' ? 'Total Due:' : 'المبلغ الإجمالي:'}</span>
                <span dir="ltr">{wrapBidiText(netAmount.toFixed(3))} {language === 'en' ? 'OMR' : 'ر.ع'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
