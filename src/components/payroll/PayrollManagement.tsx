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
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Send, Calculator, Edit, Eye, Download, AlertCircle, Search, CreditCard, Users, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddPayrollDialog } from './AddPayrollDialog';

interface PayrollManagementProps {
  onWalletUpdate: () => void;
}

export default function PayrollManagement({ onWalletUpdate }: PayrollManagementProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [teachers, setTeachers] = useState<any[]>([]);
  const [payrollConfig, setPayrollConfig] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [showAddPayrollDialog, setShowAddPayrollDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nfcSearch, setNfcSearch] = useState('');
  const [showTeacherSelection, setShowTeacherSelection] = useState(true);
  const [adminWallet, setAdminWallet] = useState(0);
  const [configForm, setConfigForm] = useState({
    base_salary: '',
    hourly_rate: '',
    payment_frequency: 'monthly',
    bank_account: ''
  });
  const [calculationPeriod, setCalculationPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch teachers with their profiles
      const { data: teachersData } = await supabase
        .from('teachers')
        .select(`
          *,
          profile:profiles!teachers_profile_id_fkey(*)
        `);

      // Fetch payroll configurations
      const { data: configData } = await supabase
        .from('payroll_config')
        .select('*');

      // Fetch recent payroll records
      const { data: recordsData } = await supabase
        .from('payroll_records')
        .select(`
          *,
          teacher:teachers!payroll_records_teacher_id_fkey(
            *,
            profile:profiles!teachers_profile_id_fkey(*)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch admin wallet balance
      const { data: walletData } = await supabase
        .from('admin_wallets')
        .select('balance')
        .single();

      setTeachers(teachersData || []);
      setPayrollConfig(configData || []);
      setPayrollRecords(recordsData || []);
      setAdminWallet(walletData?.balance || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('Error'),
        description: t('Failed to load data'),
        variant: 'destructive'
      });
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedTeacher || !configForm.base_salary) {
      toast({
        title: t('Error'),
        description: t('Please fill required fields'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const existingConfig = payrollConfig.find(c => c.teacher_id === selectedTeacher.id);
      
      if (existingConfig) {
        const { error } = await supabase
          .from('payroll_config')
          .update({
            base_salary: parseFloat(configForm.base_salary),
            hourly_rate: configForm.hourly_rate ? parseFloat(configForm.hourly_rate) : null,
            payment_frequency: configForm.payment_frequency,
            bank_account: configForm.bank_account || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payroll_config')
          .insert({
            teacher_id: selectedTeacher.id,
            base_salary: parseFloat(configForm.base_salary),
            hourly_rate: configForm.hourly_rate ? parseFloat(configForm.hourly_rate) : null,
            payment_frequency: configForm.payment_frequency,
            bank_account: configForm.bank_account || null
          });

        if (error) throw error;
      }

      toast({
        title: t('Success'),
        description: t('Payroll configuration saved')
      });
      setShowConfigDialog(false);
      fetchData();
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

  const calculateSalary = async () => {
    if (!selectedTeacher) return;

    setLoading(true);
    try {
      const periodStart = startOfMonth(new Date(calculationPeriod.year, calculationPeriod.month - 1));
      const periodEnd = endOfMonth(periodStart);

      // Call the calculate_teacher_salary function
      const { data, error } = await supabase
        .rpc('calculate_teacher_salary', {
          p_teacher_id: selectedTeacher.id,
          p_period_start: format(periodStart, 'yyyy-MM-dd'),
          p_period_end: format(periodEnd, 'yyyy-MM-dd')
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const salaryData = data[0];
        
        // Create payroll record
        const { error: recordError } = await supabase
          .from('payroll_records')
          .insert({
            teacher_id: selectedTeacher.id,
            period_start: format(periodStart, 'yyyy-MM-dd'),
            period_end: format(periodEnd, 'yyyy-MM-dd'),
            base_salary: salaryData.base_salary,
            working_days: salaryData.working_days,
            present_days: salaryData.present_days,
            absent_days: salaryData.absent_days,
            leave_days: salaryData.leave_days,
            total_hours: salaryData.total_hours,
            overtime_hours: salaryData.overtime_hours,
            deductions: salaryData.deductions,
            bonuses: salaryData.bonuses,
            net_salary: salaryData.net_salary,
            payment_status: 'pending'
          });

        if (recordError) throw recordError;

        toast({
          title: t('Success'),
          description: t('Salary calculated successfully')
        });
        setShowCalculateDialog(false);
        fetchData();
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

  const processSalaryPayment = async () => {
    if (!selectedRecord) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .rpc('process_salary_payment', {
          p_payroll_record_id: selectedRecord.id
        });

      if (error) throw error;

      toast({
        title: t('Success'),
        description: t('Salary payment processed successfully')
      });
      setShowPaymentDialog(false);
      fetchData();
      onWalletUpdate();
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

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    const nameMatch = teacher.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     teacher.profile?.full_name_ar?.includes(searchQuery);
    const nfcMatch = nfcSearch ? teacher.nfc_id === nfcSearch : true;
    return nameMatch && nfcMatch;
  });

  const handleSelectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setShowTeacherSelection(false);
  };

  const handleNFCSearch = async () => {
    if (!nfcSearch) return;
    
    const teacher = teachers.find(t => t.nfc_id === nfcSearch);
    if (teacher) {
      handleSelectTeacher(teacher);
    } else {
      toast({
        title: language === 'en' ? 'Not Found' : 'غير موجود',
        description: language === 'en' ? 'No teacher found with this NFC ID' : 'لم يتم العثور على معلم بهذا المعرف',
        variant: 'destructive'
      });
    }
  };

  // Show teacher selection screen if no teacher is selected
  if (showTeacherSelection) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {language === 'en' ? 'Select Teacher for Payroll Management' : 'اختر المعلم لإدارة كشوف المرتبات'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="search" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <TabsList className={`grid w-full grid-cols-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <TabsTrigger value="search">
                  <Search className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Search by Name' : 'البحث بالاسم'}
                </TabsTrigger>
                <TabsTrigger value="nfc">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'NFC Card' : 'بطاقة NFC'}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={language === 'en' ? 'Search teacher by name...' : 'ابحث عن المعلم بالاسم...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTeachers.map((teacher) => {
                    const config = payrollConfig.find(c => c.teacher_id === teacher.id);
                    return (
                      <Card 
                        key={teacher.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleSelectTeacher(teacher)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold">
                              {language === 'en' ? teacher.profile?.full_name : teacher.profile?.full_name_ar || teacher.profile?.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {language === 'en' ? 'Employee ID' : 'رقم الموظف'}: {teacher.employee_id}
                            </p>
                            {config ? (
                              <Badge variant="default">
                                {language === 'en' ? 'Configured' : 'مُعد'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {language === 'en' ? 'Not Configured' : 'غير مُعد'}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="nfc" className="space-y-4">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'en' ? 'Scan or enter NFC card ID' : 'امسح أو أدخل معرف بطاقة NFC'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={language === 'en' ? 'NFC Card ID' : 'معرف بطاقة NFC'}
                      value={nfcSearch}
                      onChange={(e) => setNfcSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleNFCSearch}>
                      {language === 'en' ? 'Search' : 'بحث'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main payroll management screen for selected teacher
  return (
    <div className="space-y-6">
      {/* Selected Teacher Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTeacherSelection(true);
                  setSelectedTeacher(null);
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Change Teacher' : 'تغيير المعلم'}
              </Button>
              <Button
                onClick={() => setShowAddPayrollDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Add New Payroll' : 'إضافة راتب جديد'}
              </Button>
              <div>
                <h2 className="text-xl font-bold">
                  {language === 'en' ? selectedTeacher?.profile?.full_name : selectedTeacher?.profile?.full_name_ar || selectedTeacher?.profile?.full_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Employee ID' : 'رقم الموظف'}: {selectedTeacher?.employee_id}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {t('payroll.adminWallet')}: {adminWallet.toLocaleString('en-US')} OMR
            </Badge>
          </div>
        </CardHeader>
      </Card>
      
      {/* Add Payroll Dialog */}
      <AddPayrollDialog 
        open={showAddPayrollDialog}
        onOpenChange={setShowAddPayrollDialog}
        onSuccess={() => {
          fetchData();
          onWalletUpdate();
        }}
      />

      {/* Teacher Payroll Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('payroll.payrollConfiguration')}</span>
            <Button
              onClick={() => {
                const config = payrollConfig.find(c => c.teacher_id === selectedTeacher.id);
                if (config) {
                  setConfigForm({
                    base_salary: config.base_salary.toString(),
                    hourly_rate: config.hourly_rate?.toString() || '',
                    payment_frequency: config.payment_frequency,
                    bank_account: config.bank_account || ''
                  });
                } else {
                  setConfigForm({
                    base_salary: '',
                    hourly_rate: '',
                    payment_frequency: 'monthly',
                    bank_account: ''
                  });
                }
                setShowConfigDialog(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {payrollConfig.find(c => c.teacher_id === selectedTeacher?.id) ? t('Edit Configuration') : t('Setup Payroll')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const config = payrollConfig.find(c => c.teacher_id === selectedTeacher?.id);
            if (!config) {
              return (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {language === 'en' ? 'No payroll configuration found for this teacher' : 'لم يتم العثور على إعدادات كشوف المرتبات لهذا المعلم'}
                  </p>
                  <Button onClick={() => setShowConfigDialog(true)}>
                    {language === 'en' ? 'Configure Now' : 'قم بالإعداد الآن'}
                  </Button>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('payroll.baseSalary')}</Label>
                  <p className="text-lg font-semibold">{config.base_salary.toLocaleString('en-US')} OMR</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('payroll.hourlyRate')}</Label>
                  <p className="text-lg font-semibold">{config.hourly_rate ? `${config.hourly_rate.toLocaleString('en-US')} OMR` : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('payroll.frequency')}</Label>
                  <p className="text-lg font-semibold">{t(config.payment_frequency)}</p>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => setShowCalculateDialog(true)}
                    className="w-full"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {t('payroll.calculateSalary')}
                  </Button>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Teacher's Payroll Records */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payroll.payrollHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payroll.period')}</TableHead>
                <TableHead>{t('payroll.baseSalary')}</TableHead>
                <TableHead>{t('payroll.deductions')}</TableHead>
                <TableHead>{t('payroll.bonuses')}</TableHead>
                <TableHead>{t('payroll.netSalary')}</TableHead>
                <TableHead>{t('payroll.status')}</TableHead>
                <TableHead>{t('payroll.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords
                .filter(record => record.teacher_id === selectedTeacher?.id)
                .map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.period_start), 'MMM yyyy')}</TableCell>
                    <TableCell>{record.base_salary.toLocaleString('en-US')} OMR</TableCell>
                    <TableCell className="text-red-500">-{record.deductions.toLocaleString('en-US')} OMR</TableCell>
                    <TableCell className="text-green-500">+{record.bonuses.toLocaleString('en-US')} OMR</TableCell>
                    <TableCell className="font-bold">{record.net_salary.toLocaleString('en-US')} OMR</TableCell>
                    <TableCell>
                      <Badge variant={record.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {t(record.payment_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {record.payment_status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowPaymentDialog(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {t('payroll.pay')}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* View details */}}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Configure Payroll')}</DialogTitle>
            <DialogDescription>
              {t('Set up payroll configuration for')} {selectedTeacher?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('Base Salary (OMR)')}</Label>
              <Input
                type="number"
                step="0.001"
                value={configForm.base_salary}
                onChange={(e) => setConfigForm({...configForm, base_salary: e.target.value})}
              />
            </div>
            <div>
              <Label>{t('Hourly Rate (OMR) - Optional')}</Label>
              <Input
                type="number"
                step="0.001"
                value={configForm.hourly_rate}
                onChange={(e) => setConfigForm({...configForm, hourly_rate: e.target.value})}
              />
            </div>
            <div>
              <Label>{t('Payment Frequency')}</Label>
              <Select
                value={configForm.payment_frequency}
                onValueChange={(value) => setConfigForm({...configForm, payment_frequency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('Monthly')}</SelectItem>
                  <SelectItem value="bi-weekly">{t('Bi-Weekly')}</SelectItem>
                  <SelectItem value="weekly">{t('Weekly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('Bank Account (Optional)')}</Label>
              <Input
                value={configForm.bank_account}
                onChange={(e) => setConfigForm({...configForm, bank_account: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleSaveConfig} disabled={loading}>
              {loading ? t('Saving...') : t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculate Salary Dialog */}
      <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Calculate Salary')}</DialogTitle>
            <DialogDescription>
              {t('Calculate salary for')} {selectedTeacher?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('Month')}</Label>
              <Select
                value={calculationPeriod.month.toString()}
                onValueChange={(value) => setCalculationPeriod({...calculationPeriod, month: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month - 1), 'MMMM')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('Year')}</Label>
              <Select
                value={calculationPeriod.year.toString()}
                onValueChange={(value) => setCalculationPeriod({...calculationPeriod, year: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalculateDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={calculateSalary} disabled={loading}>
              {loading ? t('Calculating...') : t('Calculate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Process Salary Payment')}</DialogTitle>
            <DialogDescription>
              {t('Confirm salary payment processing')}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-900 dark:text-orange-300">
                    {t('Payment Confirmation')}
                  </p>
                  <p className="text-orange-700 dark:text-orange-400 mt-1">
                    {t('You are about to transfer')} <strong>{selectedRecord.net_salary.toLocaleString('en-US')} OMR</strong> {t('to')} {selectedRecord.teacher?.profile?.full_name}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Period')}:</span>
                  <span>{format(new Date(selectedRecord.period_start), 'MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Working Days')}:</span>
                  <span>{selectedRecord.working_days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Present Days')}:</span>
                  <span>{selectedRecord.present_days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Deductions')}:</span>
                  <span className="text-red-500">{selectedRecord.deductions.toLocaleString('en-US')} OMR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Bonuses')}:</span>
                  <span className="text-green-500">{selectedRecord.bonuses.toLocaleString('en-US')} OMR</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('Net Salary')}:</span>
                  <span className="text-primary">{selectedRecord.net_salary.toLocaleString('en-US')} OMR</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={processSalaryPayment} disabled={loading} variant="default">
              {loading ? t('Processing...') : t('Confirm Payment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}