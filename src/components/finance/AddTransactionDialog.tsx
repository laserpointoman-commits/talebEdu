import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, X, FileText, Image, CalendarIcon, Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  nfc_id?: string;
}

export function AddTransactionDialog({ onTransactionAdded }: { onTransactionAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileSearchOpen, setProfileSearchOpen] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    description_ar: '',
    payment_method: 'cash',
    reference_number: '',
    transaction_date: new Date()
  });

  // Fetch profiles when dialog opens
  useEffect(() => {
    if (open) {
      fetchProfiles();
    }
  }, [open]);

  const fetchProfiles = async () => {
    try {
      // First, fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Then fetch students with NFC IDs
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('profile_id, nfc_id');

      if (!studentsError && studentsData) {
        // Merge NFC IDs with profiles
        const profilesWithNfc = profilesData?.map(profile => {
          const student = studentsData.find(s => s.profile_id === profile.id);
          return {
            ...profile,
            nfc_id: student?.nfc_id || undefined
          };
        }) || [];
        setProfiles(profilesWithNfc);
      } else {
        setProfiles(profilesData || []);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `transactions/${new Date().getFullYear()}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('transaction-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('transaction-documents')
          .getPublicUrl(filePath);

        return {
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size
        };
      });

      const newFiles = await Promise.all(uploadPromises);
      setUploadedFiles([...uploadedFiles, ...newFiles]);

      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description: language === 'ar' ? 'تم رفع الملفات بنجاح' : 'Files uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل رفع الملفات' : 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const filteredProfiles = profiles.filter(profile => {
    const search = profileSearch.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(search) ||
      profile.phone?.toLowerCase().includes(search) ||
      profile.email?.toLowerCase().includes(search) ||
      profile.nfc_id?.toLowerCase().includes(search)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // If profile is selected and type is expense, deduct from wallet
      if (selectedProfile && formData.type === 'expense') {
        const { data: walletData, error: walletError } = await supabase
          .from('wallet_balances')
          .select('balance')
          .eq('user_id', selectedProfile.id)
          .single();

        if (walletError && walletError.code !== 'PGRST116') {
          throw walletError;
        }

        const currentBalance = walletData?.balance || 0;
        const transactionAmount = parseFloat(formData.amount);

        if (currentBalance < transactionAmount) {
          toast({
            title: language === 'ar' ? 'رصيد غير كافي' : 'Insufficient Balance',
            description: language === 'ar' ? 
              `الرصيد المتاح: ${currentBalance} ريال عماني` : 
              `Available balance: ${currentBalance} OMR`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Deduct from wallet
        const { error: updateError } = await supabase
          .from('wallet_balances')
          .upsert({
            user_id: selectedProfile.id,
            balance: currentBalance - transactionAmount
          });

        if (updateError) throw updateError;

        // Create wallet transaction record
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: selectedProfile.id,
            type: 'withdrawal',
            amount: transactionAmount,
            balance_after: currentBalance - transactionAmount,
            description: formData.description || `${formData.category} transaction`,
            description_ar: formData.description_ar || `معاملة ${formData.category}`
          });
      }

      // Create the financial transaction
      const { error } = await supabase
        .from('financial_transactions')
        .insert([{
          type: formData.type,
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          description_ar: formData.description_ar || null,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          transaction_date: format(formData.transaction_date, 'yyyy-MM-dd'),
          user_id: selectedProfile?.id || profile?.id,
          status: 'completed',
          documents: uploadedFiles.length > 0 ? JSON.parse(JSON.stringify(uploadedFiles)) : []
        }]);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description: language === 'ar' ? 'تمت إضافة المعاملة بنجاح' : 'Transaction added successfully',
      });

      // Reset form
      setFormData({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        description_ar: '',
        payment_method: 'cash',
        reference_number: '',
        transaction_date: new Date()
      });
      setUploadedFiles([]);
      setSelectedProfile(null);
      setProfileSearch('');

      setOpen(false);
      onTransactionAdded?.();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إضافة المعاملة' : 'Failed to add transaction',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {language === 'ar' ? 'إضافة معاملة' : 'Add Transaction'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إضافة معاملة جديدة' : 'Add New Transaction'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Number - Auto-generated */}
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <Label className="text-muted-foreground">{language === 'ar' ? 'رقم المعاملة' : 'Transaction Number'}</Label>
            <div className="mt-1 font-mono text-lg font-semibold text-foreground" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
              {String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{new Date().getFullYear()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'سيتم توليد الرقم تلقائياً عند الحفظ' : 'Will be auto-generated upon saving'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">
                {language === 'ar' ? 'النوع' : 'Type'} *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">{language === 'ar' ? 'دخل' : 'Income'}</SelectItem>
                  <SelectItem value="expense">{language === 'ar' ? 'مصروف' : 'Expense'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">
                {language === 'ar' ? 'الفئة' : 'Category'} *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'income' ? (
                    <>
                      <SelectItem value="tuition_fees">{language === 'ar' ? 'رسوم دراسية' : 'Tuition Fees'}</SelectItem>
                      <SelectItem value="registration_fees">{language === 'ar' ? 'رسوم تسجيل' : 'Registration Fees'}</SelectItem>
                      <SelectItem value="transportation_fees">{language === 'ar' ? 'رسوم النقل' : 'Transportation Fees'}</SelectItem>
                      <SelectItem value="activity_fees">{language === 'ar' ? 'رسوم الأنشطة' : 'Activity Fees'}</SelectItem>
                      <SelectItem value="canteen_sales">{language === 'ar' ? 'مبيعات المقصف' : 'Canteen Sales'}</SelectItem>
                      <SelectItem value="donations">{language === 'ar' ? 'تبرعات' : 'Donations'}</SelectItem>
                      <SelectItem value="other_income">{language === 'ar' ? 'دخل آخر' : 'Other Income'}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="salaries">{language === 'ar' ? 'الرواتب' : 'Salaries'}</SelectItem>
                      <SelectItem value="utilities">{language === 'ar' ? 'المرافق' : 'Utilities'}</SelectItem>
                      <SelectItem value="supplies">{language === 'ar' ? 'اللوازم' : 'Supplies'}</SelectItem>
                      <SelectItem value="maintenance">{language === 'ar' ? 'الصيانة' : 'Maintenance'}</SelectItem>
                      <SelectItem value="equipment">{language === 'ar' ? 'المعدات' : 'Equipment'}</SelectItem>
                      <SelectItem value="transportation">{language === 'ar' ? 'النقل' : 'Transportation'}</SelectItem>
                      <SelectItem value="marketing">{language === 'ar' ? 'التسويق' : 'Marketing'}</SelectItem>
                      <SelectItem value="other_expense">{language === 'ar' ? 'مصروف آخر' : 'Other Expense'}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Profile Selection */}
          <div>
            <Label>
              {language === 'ar' ? 'ربط بملف شخصي' : 'Link to Profile'}
              <span className="text-muted-foreground text-xs ml-2">
                {language === 'ar' ? '(اختياري)' : '(Optional)'}
              </span>
            </Label>
            <Popover open={profileSearchOpen} onOpenChange={setProfileSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={profileSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedProfile ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{selectedProfile.full_name}</span>
                      {selectedProfile.phone && (
                        <span className="text-muted-foreground text-xs">({selectedProfile.phone})</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'ابحث بالاسم أو الهاتف أو NFC' : 'Search by name, phone or NFC'}
                    </span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={language === 'ar' ? 'ابحث عن ملف شخصي...' : 'Search profile...'}
                    value={profileSearch}
                    onValueChange={setProfileSearch}
                  />
                  <CommandEmpty>
                    {language === 'ar' ? 'لا توجد نتائج' : 'No profiles found'}
                  </CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {filteredProfiles.slice(0, 50).map((prof) => (
                      <CommandItem
                        key={prof.id}
                        value={`${prof.full_name} ${prof.phone || ''} ${prof.email || ''} ${prof.nfc_id || ''}`}
                        onSelect={() => {
                          setSelectedProfile(prof);
                          setProfileSearchOpen(false);
                          setProfileSearch('');
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{prof.full_name}</span>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            {prof.phone && <span>📱 {prof.phone}</span>}
                            {prof.email && <span>✉️ {prof.email}</span>}
                            {prof.nfc_id && <span>💳 {prof.nfc_id}</span>}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedProfile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setSelectedProfile(null)}
              >
                <X className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'إلغاء الربط' : 'Remove Link'}
              </Button>
            )}
            {selectedProfile && formData.type === 'expense' && (
              <p className="text-xs text-yellow-600 mt-2">
                {language === 'ar' ? 
                  `سيتم خصم المبلغ من محفظة ${selectedProfile.full_name}` : 
                  `Amount will be deducted from ${selectedProfile.full_name}'s wallet`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">
                {language === 'ar' ? 'المبلغ (ر.ع)' : 'Amount (OMR)'} *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="payment_method">
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{language === 'ar' ? 'نقدي' : 'Cash'}</SelectItem>
                  <SelectItem value="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
                  <SelectItem value="credit_card">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</SelectItem>
                  <SelectItem value="debit_card">{language === 'ar' ? 'بطاقة خصم' : 'Debit Card'}</SelectItem>
                  <SelectItem value="cheque">{language === 'ar' ? 'شيك' : 'Cheque'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction_date">
                {language === 'ar' ? 'التاريخ' : 'Date'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.transaction_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.transaction_date ? (
                      format(formData.transaction_date, "dd/MM/yyyy")
                    ) : (
                      <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.transaction_date}
                    onSelect={(date) => date && setFormData({ ...formData, transaction_date: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="reference_number">
                {language === 'ar' ? 'رقم المرجع' : 'Reference Number'}
              </Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">
              {language === 'ar' ? 'الوصف' : 'Description'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={language === 'ar' ? 'أدخل وصف المعاملة...' : 'Enter transaction description...'}
              rows={3}
            />
          </div>

          {language === 'ar' && (
            <div>
              <Label htmlFor="description_ar">
                الوصف بالعربية
              </Label>
              <Textarea
                id="description_ar"
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="أدخل وصف المعاملة بالعربية..."
                rows={3}
                dir="rtl"
              />
            </div>
          )}

          {/* File Upload Section */}
          <div className="space-y-3">
            <Label>
              {language === 'ar' ? 'المستندات والصور' : 'Documents & Images'}
            </Label>
            
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'انقر لرفع الملفات أو اسحبها هنا' : 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'PDF، JPG، PNG حتى 10MB' : 'PDF, JPG, PNG up to 10MB'}
                  </span>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading 
                ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...') 
                : (language === 'ar' ? 'إضافة' : 'Add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}