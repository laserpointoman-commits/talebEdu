import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Calendar } from 'lucide-react';

interface InstallmentPlan {
  id: string;
  fee_id: string;
  total_installments: number;
  installment_amount: number;
  frequency: string;
  status: string;
  fee: {
    student: {
      first_name: string;
      last_name: string;
    };
    fee_type: string;
    amount: number;
  };
}

export default function InstallmentPlansManager() {
  const { language } = useLanguage();
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentFees, setStudentFees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fee_id: '',
    total_installments: '3',
    frequency: 'monthly'
  });

  useEffect(() => {
    loadPlans();
    loadStudentFees();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('installment_plans')
        .select(`
          *,
          fee:student_fees(
            fee_type,
            amount,
            student:students(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data as any || []);
    } catch (error: any) {
      toast.error(language === 'en' ? 'Failed to load installment plans' : 'فشل تحميل خطط التقسيط');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentFees = async () => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          id,
          fee_type,
          amount,
          paid_amount,
          student:students(first_name, last_name)
        `)
        .eq('status', 'pending')
        .is('installment_plan_id', null);

      if (error) throw error;
      setStudentFees(data || []);
    } catch (error: any) {
      console.error('Error loading student fees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedFee = studentFees.find(f => f.id === formData.fee_id);
    if (!selectedFee) return;

    const totalInstallments = parseInt(formData.total_installments);
    const installmentAmount = selectedFee.amount / totalInstallments;

    try {
      // Create installment plan
      const { data: planData, error: planError } = await supabase
        .from('installment_plans')
        .insert([{
          fee_id: formData.fee_id,
          total_installments: totalInstallments,
          installment_amount: installmentAmount,
          frequency: formData.frequency,
          status: 'active'
        }])
        .select()
        .single();

      if (planError) throw planError;

      // Create installment schedule
      const scheduleData = [];
      const today = new Date();
      
      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = new Date(today);
        
        if (formData.frequency === 'monthly') {
          dueDate.setMonth(dueDate.getMonth() + i);
        } else if (formData.frequency === 'weekly') {
          dueDate.setDate(dueDate.getDate() + (i * 7));
        }

        scheduleData.push({
          plan_id: planData.id,
          installment_number: i + 1,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pending'
        });
      }

      const { error: scheduleError } = await supabase
        .from('installment_schedule')
        .insert(scheduleData);

      if (scheduleError) throw scheduleError;

      // Update student fee with installment plan
      const { error: updateError } = await supabase
        .from('student_fees')
        .update({ installment_plan_id: planData.id })
        .eq('id', formData.fee_id);

      if (updateError) throw updateError;

      toast.success(language === 'en' ? 'Installment plan created' : 'تم إنشاء خطة التقسيط');
      setDialogOpen(false);
      setFormData({
        fee_id: '',
        total_installments: '3',
        frequency: 'monthly'
      });
      loadPlans();
      loadStudentFees();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Create Installment Plan' : 'إنشاء خطة تقسيط'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {language === 'en' ? 'New Installment Plan' : 'خطة تقسيط جديدة'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'en' ? 'Select Student Fee' : 'اختر رسوم الطالب'}</Label>
                <Select value={formData.fee_id} onValueChange={(value) => setFormData({ ...formData, fee_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select fee' : 'اختر الرسوم'} />
                  </SelectTrigger>
                  <SelectContent>
                    {studentFees.map(fee => (
                      <SelectItem key={fee.id} value={fee.id}>
                        {fee.student.first_name} {fee.student.last_name} - {fee.fee_type} ({fee.amount.toFixed(3)} OMR)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Number of Installments' : 'عدد الأقساط'}</Label>
                  <Input
                    type="number"
                    min="2"
                    max="12"
                    value={formData.total_installments}
                    onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Frequency' : 'التكرار'}</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{language === 'en' ? 'Monthly' : 'شهري'}</SelectItem>
                      <SelectItem value="weekly">{language === 'en' ? 'Weekly' : 'أسبوعي'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.fee_id && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    {language === 'en' ? 'Installment Preview:' : 'معاينة الأقساط:'}
                  </p>
                  {(() => {
                    const fee = studentFees.find(f => f.id === formData.fee_id);
                    if (!fee) return null;
                    const installmentAmount = fee.amount / parseInt(formData.total_installments);
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">{language === 'en' ? 'Total Amount:' : 'المبلغ الإجمالي:'}</span>
                          <span className="text-sm font-medium">{fee.amount.toFixed(3)} OMR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">{language === 'en' ? 'Per Installment:' : 'لكل قسط:'}</span>
                          <span className="text-sm font-medium">{installmentAmount.toFixed(3)} OMR</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {language === 'en' ? 'Cancel' : 'إلغاء'}
                </Button>
                <Button type="submit">
                  {language === 'en' ? 'Create Plan' : 'إنشاء الخطة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'en' ? 'Student' : 'الطالب'}</TableHead>
              <TableHead>{language === 'en' ? 'Fee Type' : 'نوع الرسوم'}</TableHead>
              <TableHead>{language === 'en' ? 'Total Amount' : 'المبلغ الإجمالي'}</TableHead>
              <TableHead>{language === 'en' ? 'Installments' : 'الأقساط'}</TableHead>
              <TableHead>{language === 'en' ? 'Per Installment' : 'لكل قسط'}</TableHead>
              <TableHead>{language === 'en' ? 'Frequency' : 'التكرار'}</TableHead>
              <TableHead>{language === 'en' ? 'Status' : 'الحالة'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  {language === 'en' ? 'Loading...' : 'جاري التحميل...'}
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {language === 'en' ? 'No installment plans found' : 'لم يتم العثور على خطط تقسيط'}
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    {plan.fee.student.first_name} {plan.fee.student.last_name}
                  </TableCell>
                  <TableCell>{plan.fee.fee_type}</TableCell>
                  <TableCell>{plan.fee.amount.toFixed(3)} OMR</TableCell>
                  <TableCell>{plan.total_installments}</TableCell>
                  <TableCell>{plan.installment_amount.toFixed(3)} OMR</TableCell>
                  <TableCell>{plan.frequency}</TableCell>
                  <TableCell>
                    <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
