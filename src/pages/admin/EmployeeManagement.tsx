import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  CreditCard,
  Building,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';

interface Employee {
  id: string;
  profile_id: string;
  employee_id: string;
  position: string;
  custom_position?: string;
  department?: string;
  nfc_id?: string;
  join_date: string;
  contract_type: string;
  employment_status: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  national_id?: string;
  passport_number?: string;
  visa_number?: string;
  visa_expiry?: string;
  insurance_number?: string;
  profile?: any;
}

const positionOptions = [
  { value: 'teacher', label: 'Teacher', label_ar: 'معلم' },
  { value: 'bus_driver', label: 'Bus Driver', label_ar: 'سائق حافلة' },
  { value: 'manager', label: 'Manager', label_ar: 'مدير' },
  { value: 'cleaner', label: 'Cleaner', label_ar: 'عامل نظافة' },
  { value: 'secretary', label: 'Secretary', label_ar: 'سكرتير' },
  { value: 'accountant', label: 'Accountant', label_ar: 'محاسب' },
  { value: 'nurse', label: 'Nurse', label_ar: 'ممرض' },
  { value: 'security', label: 'Security', label_ar: 'أمن' },
  { value: 'cafeteria_staff', label: 'Cafeteria Staff', label_ar: 'موظف كافتيريا' },
  { value: 'maintenance', label: 'Maintenance', label_ar: 'صيانة' },
  { value: 'other', label: 'Other', label_ar: 'أخرى' },
];

export default function EmployeeManagement() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    full_name_ar: '',
    email: '',
    phone: '',
    position: 'teacher',
    custom_position: '',
    department: '',
    contract_type: 'full-time',
    national_id: '',
    passport_number: '',
    visa_number: '',
    visa_expiry: '',
    insurance_number: '',
    bank_name: '',
    bank_account: '',
    iban: '',
    emergency_contact: '',
    emergency_phone: '',
    password: 'School@123' // Default password
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profile:profiles!employees_profile_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast({
        title: t('Error'),
        description: t('Failed to load employees'),
        variant: 'destructive'
      });
    }
  };

  const handleAddEmployee = async () => {
    if (!formData.full_name || !formData.email || !formData.position) {
      toast({
        title: t('Error'),
        description: t('Please fill required fields'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            full_name_ar: formData.full_name_ar,
            role: formData.position === 'teacher' ? 'teacher' : 
                  formData.position === 'bus_driver' ? 'driver' : 'staff'
          }
        }
      });

      if (authError) throw authError;

      // Wait for profile to be created by trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get employee ID and NFC ID
      const { data: employeeIdData } = await supabase
        .rpc('generate_employee_id', { p_position: formData.position as any });
      
      const { data: nfcIdData } = await supabase
        .rpc('generate_nfc_id', { p_position: formData.position as any });

      // Create employee record
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          profile_id: authData.user?.id || null,
          employee_id: employeeIdData || 'EMP-' + Date.now(),
          nfc_id: nfcIdData || null,
          position: formData.position as Database["public"]["Enums"]["employee_position"],
          custom_position: formData.position === 'other' ? formData.custom_position : null,
          department: formData.department || null,
          contract_type: formData.contract_type,
          employment_status: 'active',
          national_id: formData.national_id || null,
          passport_number: formData.passport_number || null,
          visa_number: formData.visa_number || null,
          visa_expiry: formData.visa_expiry || null,
          insurance_number: formData.insurance_number || null,
          bank_name: formData.bank_name || null,
          bank_account: formData.bank_account || null,
          iban: formData.iban || null,
          emergency_contact: formData.emergency_contact || null,
          emergency_phone: formData.emergency_phone || null,
        });

      if (employeeError) throw employeeError;

      toast({
        title: t('Success'),
        description: t('Employee added successfully'),
      });

      setShowAddDialog(false);
      resetForm();
      fetchEmployees();
    } catch (error: any) {
      console.error('Error adding employee:', error);
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
    setFormData({
      full_name: '',
      full_name_ar: '',
      email: '',
      phone: '',
      position: 'teacher',
      custom_position: '',
      department: '',
      contract_type: 'full-time',
      national_id: '',
      passport_number: '',
      visa_number: '',
      visa_expiry: '',
      insurance_number: '',
      bank_name: '',
      bank_account: '',
      iban: '',
      emergency_contact: '',
      emergency_phone: '',
      password: 'School@123'
    });
  };

  const getPositionBadge = (position: string) => {
    const colors: any = {
      teacher: 'bg-blue-100 text-blue-800',
      bus_driver: 'bg-yellow-100 text-yellow-800',
      manager: 'bg-purple-100 text-purple-800',
      cleaner: 'bg-gray-100 text-gray-800',
      secretary: 'bg-pink-100 text-pink-800',
      accountant: 'bg-green-100 text-green-800',
      nurse: 'bg-red-100 text-red-800',
      security: 'bg-indigo-100 text-indigo-800',
      cafeteria_staff: 'bg-orange-100 text-orange-800',
      maintenance: 'bg-cyan-100 text-cyan-800',
      other: 'bg-gray-100 text-gray-800',
    };

    const positionInfo = positionOptions.find(p => p.value === position);
    const label = language === 'en' ? positionInfo?.label : positionInfo?.label_ar;

    return (
      <Badge className={colors[position] || colors.other}>
        {label || position}
      </Badge>
    );
  };

  const filteredEmployees = employees.filter(emp => {
    const query = searchQuery.toLowerCase();
    return emp.profile?.full_name?.toLowerCase().includes(query) ||
           emp.profile?.full_name_ar?.includes(query) ||
           emp.employee_id?.toLowerCase().includes(query) ||
           emp.nfc_id?.toLowerCase().includes(query) ||
           emp.profile?.email?.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {language === 'en' ? 'Employee Management' : 'إدارة الموظفين'}
            </CardTitle>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Add Employee' : 'إضافة موظف'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={language === 'en' ? 'Search employees...' : 'البحث عن الموظفين...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Employee Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'en' ? 'Employee ID' : 'رقم الموظف'}</TableHead>
                  <TableHead>{language === 'en' ? 'Name' : 'الاسم'}</TableHead>
                  <TableHead>{language === 'en' ? 'Position' : 'المنصب'}</TableHead>
                  <TableHead>{language === 'en' ? 'Department' : 'القسم'}</TableHead>
                  <TableHead>{language === 'en' ? 'NFC ID' : 'معرف NFC'}</TableHead>
                  <TableHead>{language === 'en' ? 'Status' : 'الحالة'}</TableHead>
                  <TableHead>{language === 'en' ? 'Join Date' : 'تاريخ الانضمام'}</TableHead>
                  <TableHead>{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employee_id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {language === 'en' ? employee.profile?.full_name : employee.profile?.full_name_ar || employee.profile?.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{employee.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPositionBadge(employee.position)}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {employee.nfc_id || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.employment_status === 'active' ? 'default' : 'secondary'}>
                        {employee.employment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(employee.join_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add New Employee' : 'إضافة موظف جديد'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Enter all employee information' : 'أدخل جميع معلومات الموظف'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {language === 'en' ? 'Basic Information' : 'المعلومات الأساسية'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Full Name (English)' : 'الاسم الكامل (الإنجليزية)'}</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Full Name (Arabic)' : 'الاسم الكامل (العربية)'}</Label>
                  <Input
                    value={formData.full_name_ar}
                    onChange={(e) => setFormData({...formData, full_name_ar: e.target.value})}
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Phone' : 'الهاتف'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {language === 'en' ? 'Employment Information' : 'معلومات التوظيف'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Position' : 'المنصب'}</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {language === 'en' ? option.label : option.label_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.position === 'other' && (
                  <div>
                    <Label>{language === 'en' ? 'Custom Position' : 'منصب مخصص'}</Label>
                    <Input
                      value={formData.custom_position}
                      onChange={(e) => setFormData({...formData, custom_position: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <Label>{language === 'en' ? 'Department' : 'القسم'}</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Contract Type' : 'نوع العقد'}</Label>
                  <Select value={formData.contract_type} onValueChange={(value) => setFormData({...formData, contract_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">{language === 'en' ? 'Full Time' : 'دوام كامل'}</SelectItem>
                      <SelectItem value="part-time">{language === 'en' ? 'Part Time' : 'دوام جزئي'}</SelectItem>
                      <SelectItem value="contract">{language === 'en' ? 'Contract' : 'عقد'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Legal Documents */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {language === 'en' ? 'Legal Documents' : 'الوثائق القانونية'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'National ID' : 'الهوية الوطنية'}</Label>
                  <Input
                    value={formData.national_id}
                    onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Passport Number' : 'رقم جواز السفر'}</Label>
                  <Input
                    value={formData.passport_number}
                    onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Visa Number' : 'رقم التأشيرة'}</Label>
                  <Input
                    value={formData.visa_number}
                    onChange={(e) => setFormData({...formData, visa_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Visa Expiry' : 'انتهاء التأشيرة'}</Label>
                  <Input
                    type="date"
                    value={formData.visa_expiry}
                    onChange={(e) => setFormData({...formData, visa_expiry: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Insurance Number' : 'رقم التأمين'}</Label>
                  <Input
                    value={formData.insurance_number}
                    onChange={(e) => setFormData({...formData, insurance_number: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {language === 'en' ? 'Banking Information' : 'المعلومات المصرفية'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Bank Name' : 'اسم البنك'}</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Account Number' : 'رقم الحساب'}</Label>
                  <Input
                    value={formData.bank_account}
                    onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'IBAN' : 'IBAN'}</Label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => setFormData({...formData, iban: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {language === 'en' ? 'Emergency Contact' : 'جهة اتصال الطوارئ'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Contact Name' : 'اسم جهة الاتصال'}</Label>
                  <Input
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Contact Phone' : 'هاتف جهة الاتصال'}</Label>
                  <Input
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleAddEmployee} disabled={loading}>
              {loading ? (language === 'en' ? 'Adding...' : 'جاري الإضافة...') : 
                        (language === 'en' ? 'Add Employee' : 'إضافة موظف')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}