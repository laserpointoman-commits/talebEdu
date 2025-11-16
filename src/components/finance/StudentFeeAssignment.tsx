import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Users } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class: string;
  parent_id: string;
}

interface FeeStructure {
  id: string;
  fee_type: string;
  amount: number;
  grade: string;
  academic_year: string;
}

export default function StudentFeeAssignment() {
  const { language } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  const [formData, setFormData] = useState({
    fee_structure_id: '',
    due_date: '',
    discount_amount: '',
    discount_reason: '',
    custom_amount: '',
    description: ''
  });

  useEffect(() => {
    loadStudents();
    loadFeeStructures();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, class, parent_id')
        .eq('approval_status', 'approved')
        .order('first_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error(language === 'en' ? 'Failed to load students' : 'فشل تحميل الطلاب');
    }
  };

  const loadFeeStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('fee_structure')
        .select('*')
        .order('grade')
        .order('fee_type');

      if (error) throw error;
      setFeeStructures(data || []);
    } catch (error: any) {
      toast.error(language === 'en' ? 'Failed to load fee structures' : 'فشل تحميل هياكل الرسوم');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      toast.error(language === 'en' ? 'Please select at least one student' : 'يرجى اختيار طالب واحد على الأقل');
      return;
    }

    const selectedStructure = feeStructures.find(f => f.id === formData.fee_structure_id);
    if (!selectedStructure) {
      toast.error(language === 'en' ? 'Please select a fee structure' : 'يرجى اختيار هيكل رسوم');
      return;
    }

    try {
      const amount = formData.custom_amount 
        ? parseFloat(formData.custom_amount)
        : selectedStructure.amount;
      
      const discountAmount = formData.discount_amount ? parseFloat(formData.discount_amount) : 0;
      const totalAmount = amount - discountAmount;

      const feesData = selectedStudents.map(studentId => ({
        student_id: studentId,
        fee_type: selectedStructure.fee_type,
        amount: totalAmount,
        paid_amount: 0,
        due_date: formData.due_date,
        academic_year: selectedStructure.academic_year,
        term: 'Term 1',
        status: 'pending',
        discount_amount: discountAmount,
        discount_reason: formData.discount_reason || null
      }));

      const { error } = await supabase
        .from('student_fees')
        .insert(feesData);

      if (error) throw error;

      toast.success(
        language === 'en' 
          ? `Fee assigned to ${selectedStudents.length} student(s)` 
          : `تم تعيين الرسوم لـ ${selectedStudents.length} طالب`
      );

      setDialogOpen(false);
      setSelectedStudents([]);
      setFormData({
        fee_structure_id: '',
        due_date: '',
        discount_amount: '',
        discount_reason: '',
        custom_amount: '',
        description: ''
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllByGrade = (grade: string) => {
    const studentsInGrade = students.filter(s => s.class === grade).map(s => s.id);
    setSelectedStudents(studentsInGrade);
  };

  const selectedStructure = feeStructures.find(f => f.id === formData.fee_structure_id);
  const baseAmount = formData.custom_amount 
    ? parseFloat(formData.custom_amount) 
    : selectedStructure?.amount || 0;
  const discountAmount = formData.discount_amount ? parseFloat(formData.discount_amount) : 0;
  const finalAmount = baseAmount - discountAmount;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Assign Fee' : 'تعيين رسوم'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === 'en' ? 'Assign Fee to Students' : 'تعيين رسوم للطلاب'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'en' ? 'Select Fee Structure' : 'اختر هيكل الرسوم'}</Label>
                <Select value={formData.fee_structure_id} onValueChange={(value) => setFormData({ ...formData, fee_structure_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'en' ? 'Select fee structure' : 'اختر هيكل الرسوم'} />
                  </SelectTrigger>
                  <SelectContent>
                    {feeStructures.map(structure => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.grade} - {structure.fee_type} - {structure.amount.toFixed(3)} OMR
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Due Date' : 'تاريخ الاستحقاق'}</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Custom Amount (Optional)' : 'مبلغ مخصص (اختياري)'}</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.custom_amount}
                    onChange={(e) => setFormData({ ...formData, custom_amount: e.target.value })}
                    placeholder={selectedStructure ? `${selectedStructure.amount.toFixed(3)}` : '0.000'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Discount Amount' : 'مبلغ الخصم'}</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    placeholder="0.000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Discount Reason' : 'سبب الخصم'}</Label>
                  <Input
                    value={formData.discount_reason}
                    onChange={(e) => setFormData({ ...formData, discount_reason: e.target.value })}
                    placeholder={language === 'en' ? 'e.g., Scholarship' : 'مثل: منحة دراسية'}
                  />
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'en' ? 'Base Amount:' : 'المبلغ الأساسي:'}</span>
                    <span>{baseAmount.toFixed(3)} OMR</span>
                  </div>
                  <div className="flex justify-between text-sm text-destructive">
                    <span>{language === 'en' ? 'Discount:' : 'الخصم:'}</span>
                    <span>-{discountAmount.toFixed(3)} OMR</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                    <span>{language === 'en' ? 'Final Amount:' : 'المبلغ النهائي:'}</span>
                    <span>{finalAmount.toFixed(3)} OMR</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Select Students' : 'اختر الطلاب'}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedStudents.length === students.length) {
                        setSelectedStudents([]);
                      } else {
                        setSelectedStudents(students.map(s => s.id));
                      }
                    }}
                  >
                    {selectedStudents.length === students.length 
                      ? (language === 'en' ? 'Deselect All' : 'إلغاء تحديد الكل')
                      : (language === 'en' ? 'Select All' : 'تحديد الكل')}
                  </Button>
                </div>
                <div className="border rounded-lg p-3 max-h-[300px] overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      {language === 'en' ? 'No students found' : 'لم يتم العثور على طلاب'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {students.map(student => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={student.id}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                          />
                          <label htmlFor={student.id} className="text-sm cursor-pointer flex-1">
                            {student.first_name} {student.last_name} - {student.class}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedStudents.length} {language === 'en' ? 'student(s) selected' : 'طالب محدد'}
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {language === 'en' ? 'Cancel' : 'إلغاء'}
                </Button>
                <Button type="submit">
                  {language === 'en' ? 'Assign Fee' : 'تعيين الرسوم'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
