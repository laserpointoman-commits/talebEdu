import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calculator, Users, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  employee_id: string;
  profile_id?: string;
  position: string;
  custom_position?: string;
  profile?: {
    id?: string;
    full_name: string;
    full_name_ar?: string;
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  name_ar?: string;
  type: string;
}

interface AddPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPayrollDialog({ open, onOpenChange, onSuccess }: AddPayrollDialogProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [calculatedSalary, setCalculatedSalary] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    payment_method_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    base_salary: '',
    bonuses: '0',
    deductions: '0',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchPaymentMethods();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profile:profiles!employees_profile_id_fkey(*)
        `)
        .eq('employment_status', 'active');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const calculateSalary = async () => {
    if (!selectedEmployee) {
      toast({
        title: t('Error'),
        description: language === 'en' ? 'Please select an employee' : 'الرجاء اختيار موظف',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const periodStart = startOfMonth(new Date(formData.year, formData.month - 1));
      const periodEnd = endOfMonth(periodStart);

      // Call the calculate_employee_salary function
      const { data, error } = await supabase
        .rpc('calculate_employee_salary', {
          p_employee_id: selectedEmployee,
          p_period_start: format(periodStart, 'yyyy-MM-dd'),
          p_period_end: format(periodEnd, 'yyyy-MM-dd')
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const salaryData = data[0];
        setCalculatedSalary(salaryData);
        setFormData(prev => ({
          ...prev,
          base_salary: salaryData.base_salary.toString(),
          bonuses: salaryData.bonuses?.toString() || '0',
          deductions: salaryData.deductions?.toString() || '0'
        }));
      }
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayroll = async () => {
    if (!selectedEmployee || !formData.payment_method_id) {
      toast({
        title: t('Error'),
        description: language === 'en' ? 'Please fill all required fields' : 'الرجاء ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const periodStart = startOfMonth(new Date(formData.year, formData.month - 1));
      const periodEnd = endOfMonth(periodStart);
      
      const netSalary = parseFloat(formData.base_salary) + 
                       parseFloat(formData.bonuses) - 
                       parseFloat(formData.deductions);

      // Get the teacher record for compatibility
      const selectedEmp = employees.find(e => e.id === selectedEmployee);
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', selectedEmp?.profile_id || '')
        .maybeSingle();

      // Create payroll record (still uses teacher_id for backward compatibility)
      const { error } = await supabase
        .from('payroll_records')
        .insert({
          teacher_id: teacherData?.id || null,
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd'),
          base_salary: parseFloat(formData.base_salary),
          bonuses: parseFloat(formData.bonuses),
          deductions: parseFloat(formData.deductions),
          net_salary: netSalary,
          payment_method_id: formData.payment_method_id,
          notes: formData.notes || null,
          payment_status: 'pending',
          working_days: calculatedSalary?.working_days || 22,
          present_days: calculatedSalary?.present_days || 22,
          absent_days: calculatedSalary?.absent_days || 0,
          leave_days: calculatedSalary?.leave_days || 0,
          total_hours: calculatedSalary?.total_hours || 176,
          overtime_hours: calculatedSalary?.overtime_hours || 0
        });

      if (error) throw error;

      toast({
        title: t('Success'),
        description: language === 'en' ? 'Payroll record created successfully' : 'تم إنشاء سجل الرواتب بنجاح',
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setCalculatedSalary(null);
    setFormData({
      payment_method_id: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      base_salary: '',
      bonuses: '0',
      deductions: '0',
      notes: ''
    });
  };

  const getPositionLabel = (position: string, custom?: string) => {
    if (position === 'other' && custom) return custom;
    const positionMap: any = {
      teacher: language === 'en' ? 'Teacher' : 'معلم',
      bus_driver: language === 'en' ? 'Bus Driver' : 'سائق حافلة',
      manager: language === 'en' ? 'Manager' : 'مدير',
      cleaner: language === 'en' ? 'Cleaner' : 'عامل نظافة',
      secretary: language === 'en' ? 'Secretary' : 'سكرتير',
      accountant: language === 'en' ? 'Accountant' : 'محاسب',
      nurse: language === 'en' ? 'Nurse' : 'ممرض',
      security: language === 'en' ? 'Security' : 'أمن',
      cafeteria_staff: language === 'en' ? 'Cafeteria Staff' : 'موظف كافتيريا',
      maintenance: language === 'en' ? 'Maintenance' : 'صيانة',
    };
    return positionMap[position] || position;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Add New Payroll' : 'إضافة راتب جديد'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' ? 'Create a new payroll record for an employee' : 'إنشاء سجل راتب جديد للموظف'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>{language === 'en' ? 'Select Employee' : 'اختر الموظف'}</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'en' ? 'Choose an employee...' : 'اختر موظفًا...'} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {language === 'en' 
                          ? employee.profile?.full_name 
                          : employee.profile?.full_name_ar || employee.profile?.full_name}
                      </span>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline" className="text-xs">
                          {employee.employee_id}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getPositionLabel(employee.position, employee.custom_position)}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Month' : 'الشهر'}</Label>
              <Select 
                value={formData.month.toString()} 
                onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month - 1), 'MMMM')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Year' : 'السنة'}</Label>
              <Select 
                value={formData.year.toString()} 
                onValueChange={(value) => setFormData({...formData, year: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calculate Button */}
          {selectedEmployee && (
            <Button 
              onClick={calculateSalary} 
              className="w-full"
              disabled={loading}
            >
              <Calculator className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Calculate Salary' : 'احسب الراتب'}
            </Button>
          )}

          {/* Salary Details */}
          {calculatedSalary && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">
                {language === 'en' ? 'Salary Calculation' : 'حساب الراتب'}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">
                    {language === 'en' ? 'Working Days' : 'أيام العمل'}
                  </Label>
                  <p className="font-medium">{calculatedSalary.working_days}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {language === 'en' ? 'Present Days' : 'أيام الحضور'}
                  </Label>
                  <p className="font-medium">{calculatedSalary.present_days}</p>
                </div>
              </div>
            </div>
          )}

          {/* Salary Adjustments */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Base Salary' : 'الراتب الأساسي'}</Label>
              <Input
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({...formData, base_salary: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Bonuses' : 'المكافآت'}</Label>
              <Input
                type="number"
                value={formData.bonuses}
                onChange={(e) => setFormData({...formData, bonuses: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Deductions' : 'الخصومات'}</Label>
              <Input
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Net Salary Display */}
          {formData.base_salary && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {language === 'en' ? 'Net Salary' : 'صافي الراتب'}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {(parseFloat(formData.base_salary || '0') + 
                    parseFloat(formData.bonuses || '0') - 
                    parseFloat(formData.deductions || '0')).toFixed(2)} OMR
                </span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>{language === 'en' ? 'Payment Method' : 'طريقة الدفع'}</Label>
            <Select 
              value={formData.payment_method_id} 
              onValueChange={(value) => setFormData({...formData, payment_method_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder={language === 'en' ? 'Select payment method...' : 'اختر طريقة الدفع...'} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {language === 'en' ? method.name : method.name_ar || method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{language === 'en' ? 'Notes (Optional)' : 'ملاحظات (اختياري)'}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder={language === 'en' ? 'Add any notes...' : 'أضف أي ملاحظات...'}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'en' ? 'Cancel' : 'إلغاء'}
          </Button>
          <Button 
            onClick={handleCreatePayroll} 
            disabled={loading || !selectedEmployee || !formData.payment_method_id || !formData.base_salary}
          >
            {loading 
              ? (language === 'en' ? 'Creating...' : 'جاري الإنشاء...') 
              : (language === 'en' ? 'Create Payroll' : 'إنشاء الراتب')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}