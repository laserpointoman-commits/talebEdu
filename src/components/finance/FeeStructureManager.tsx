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
import { Plus, Edit, Trash } from 'lucide-react';

interface FeeStructure {
  id: string;
  academic_year: string;
  grade: string;
  fee_type: string;
  amount: number;
  payment_frequency: string;
  description: string;
}

export default function FeeStructureManager() {
  const { language } = useLanguage();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);

  const [formData, setFormData] = useState({
    academic_year: new Date().getFullYear().toString(),
    grade: '',
    fee_type: '',
    amount: '',
    payment_frequency: 'term',
    description: ''
  });

  useEffect(() => {
    loadStructures();
  }, []);

  const loadStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('fee_structure')
        .select('*')
        .order('academic_year', { ascending: false })
        .order('grade', { ascending: true });

      if (error) throw error;
      setStructures(data || []);
    } catch (error: any) {
      toast.error(language === 'en' ? 'Failed to load fee structures' : 'فشل تحميل هياكل الرسوم');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const feeData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingStructure) {
        const { error } = await supabase
          .from('fee_structure')
          .update(feeData)
          .eq('id', editingStructure.id);

        if (error) throw error;
        toast.success(language === 'en' ? 'Fee structure updated' : 'تم تحديث هيكل الرسوم');
      } else {
        const { error } = await supabase
          .from('fee_structure')
          .insert([feeData]);

        if (error) throw error;
        toast.success(language === 'en' ? 'Fee structure created' : 'تم إنشاء هيكل الرسوم');
      }

      setDialogOpen(false);
      setEditingStructure(null);
      setFormData({
        academic_year: new Date().getFullYear().toString(),
        grade: '',
        fee_type: '',
        amount: '',
        payment_frequency: 'term',
        description: ''
      });
      loadStructures();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      academic_year: structure.academic_year,
      grade: structure.grade,
      fee_type: structure.fee_type,
      amount: structure.amount.toString(),
      payment_frequency: structure.payment_frequency || 'term',
      description: structure.description || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to delete this fee structure?' : 'هل أنت متأكد من حذف هيكل الرسوم هذا؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fee_structure')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(language === 'en' ? 'Fee structure deleted' : 'تم حذف هيكل الرسوم');
      loadStructures();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingStructure(null)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Add Fee Structure' : 'إضافة هيكل رسوم'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingStructure 
                  ? (language === 'en' ? 'Edit Fee Structure' : 'تعديل هيكل الرسوم')
                  : (language === 'en' ? 'New Fee Structure' : 'هيكل رسوم جديد')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Academic Year' : 'السنة الدراسية'}</Label>
                  <Input
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="2024"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Grade' : 'الصف'}</Label>
                  <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                        <SelectItem key={grade} value={`Grade ${grade}`}>
                          {language === 'en' ? `Grade ${grade}` : `الصف ${grade}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'en' ? 'Fee Type' : 'نوع الرسوم'}</Label>
                <Select value={formData.fee_type} onValueChange={(value) => setFormData({ ...formData, fee_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">{language === 'en' ? 'Tuition' : 'الرسوم الدراسية'}</SelectItem>
                    <SelectItem value="books">{language === 'en' ? 'Books' : 'الكتب'}</SelectItem>
                    <SelectItem value="activities">{language === 'en' ? 'Activities' : 'الأنشطة'}</SelectItem>
                    <SelectItem value="transport">{language === 'en' ? 'Transport' : 'النقل'}</SelectItem>
                    <SelectItem value="registration">{language === 'en' ? 'Registration' : 'التسجيل'}</SelectItem>
                    <SelectItem value="other">{language === 'en' ? 'Other' : 'أخرى'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Amount (OMR)' : 'المبلغ (ر.ع)'}</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Payment Frequency' : 'تكرار الدفع'}</Label>
                  <Select value={formData.payment_frequency} onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term">{language === 'en' ? 'Per Term' : 'لكل فصل'}</SelectItem>
                      <SelectItem value="semester">{language === 'en' ? 'Per Semester' : 'لكل نصف سنة'}</SelectItem>
                      <SelectItem value="annual">{language === 'en' ? 'Annual' : 'سنوي'}</SelectItem>
                      <SelectItem value="monthly">{language === 'en' ? 'Monthly' : 'شهري'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'en' ? 'Description' : 'الوصف'}</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={language === 'en' ? 'Optional description' : 'وصف اختياري'}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {language === 'en' ? 'Cancel' : 'إلغاء'}
                </Button>
                <Button type="submit">
                  {editingStructure 
                    ? (language === 'en' ? 'Update' : 'تحديث')
                    : (language === 'en' ? 'Create' : 'إنشاء')}
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
              <TableHead>{language === 'en' ? 'Year' : 'السنة'}</TableHead>
              <TableHead>{language === 'en' ? 'Grade' : 'الصف'}</TableHead>
              <TableHead>{language === 'en' ? 'Fee Type' : 'نوع الرسوم'}</TableHead>
              <TableHead>{language === 'en' ? 'Amount' : 'المبلغ'}</TableHead>
              <TableHead>{language === 'en' ? 'Frequency' : 'التكرار'}</TableHead>
              <TableHead className="text-right">{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {language === 'en' ? 'Loading...' : 'جاري التحميل...'}
                </TableCell>
              </TableRow>
            ) : structures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {language === 'en' ? 'No fee structures found' : 'لم يتم العثور على هياكل رسوم'}
                </TableCell>
              </TableRow>
            ) : (
              structures.map((structure) => (
                <TableRow key={structure.id}>
                  <TableCell>{structure.academic_year}</TableCell>
                  <TableCell>{structure.grade}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{structure.fee_type}</Badge>
                  </TableCell>
                  <TableCell>{structure.amount.toFixed(3)} OMR</TableCell>
                  <TableCell>{structure.payment_frequency}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(structure)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(structure.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
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
