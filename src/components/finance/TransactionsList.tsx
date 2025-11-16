import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Filter, Download, FileText, Image as ImageIcon, ArrowUpDown, Calendar, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  description_ar: string | null;
  payment_method: string | null;
  reference_number: string | null;
  transaction_number?: string | null;
  transaction_date: string;
  status: string | null;
  documents: any;
  created_at: string;
  updated_at: string | null;
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to ensure documents is always an array
      const transformedData = (data || []).map(t => ({
        ...t,
        documents: Array.isArray(t.documents) ? t.documents : 
                  (t.documents ? [t.documents] : [])
      }));
      
      setTransactions(transformedData as Transaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في جلب المعاملات' : 'Failed to fetch transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced real-time filtering
  const filteredTransactions = transactions
    .filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      
      // Date range filtering
      const transactionDate = new Date(t.transaction_date);
      if (dateFrom && transactionDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (transactionDate > endOfDay) return false;
      }
      
      // Enhanced search with amount, date, and transaction number
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        
        // Search by amount (number by number)
        const amountStr = t.amount.toString();
        if (amountStr.includes(searchTerm)) return true;
        
        // Search by transaction number
        if (t.transaction_number?.toLowerCase().includes(term)) return true;
        
        // Search by date
        const dateFormats = [
          format(transactionDate, 'yyyy-MM-dd'),
          format(transactionDate, 'dd/MM/yyyy'),
          format(transactionDate, 'MM/dd/yyyy'),
          format(transactionDate, 'yyyy'),
          format(transactionDate, 'MMMM yyyy'),
          format(transactionDate, 'dd'),
          format(transactionDate, 'MM'),
        ];
        if (dateFormats.some(dateFormat => dateFormat.toLowerCase().includes(term))) return true;
        
        // Search by description
        if (t.description?.toLowerCase().includes(term)) return true;
        if (t.description_ar?.toLowerCase().includes(term)) return true;
        
        // Search by reference number
        if (t.reference_number?.toLowerCase().includes(term)) return true;
        
        // Search by category
        const categoryLabel = getCategoryLabel(t.category);
        if (categoryLabel.toLowerCase().includes(term)) return true;
        
        // Search by payment method
        if (t.payment_method) {
          const methodLabel = getPaymentMethodLabel(t.payment_method);
          if (methodLabel.toLowerCase().includes(term)) return true;
        }
        
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return modifier * (new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
      } else {
        return modifier * (a.amount - b.amount);
      }
    });

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} OMR`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: { en: string; ar: string } } = {
      tuition_fees: { en: 'Tuition Fees', ar: 'رسوم دراسية' },
      registration_fees: { en: 'Registration Fees', ar: 'رسوم تسجيل' },
      transportation_fees: { en: 'Transportation Fees', ar: 'رسوم النقل' },
      activity_fees: { en: 'Activity Fees', ar: 'رسوم الأنشطة' },
      canteen_sales: { en: 'Canteen Sales', ar: 'مبيعات المقصف' },
      donations: { en: 'Donations', ar: 'تبرعات' },
      other_income: { en: 'Other Income', ar: 'دخل آخر' },
      salaries: { en: 'Salaries', ar: 'الرواتب' },
      utilities: { en: 'Utilities', ar: 'المرافق' },
      supplies: { en: 'Supplies', ar: 'اللوازم' },
      maintenance: { en: 'Maintenance', ar: 'الصيانة' },
      equipment: { en: 'Equipment', ar: 'المعدات' },
      transportation: { en: 'Transportation', ar: 'النقل' },
      marketing: { en: 'Marketing', ar: 'التسويق' },
      other_expense: { en: 'Other Expense', ar: 'مصروف آخر' },
    };
    return labels[category]?.[language] || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === '-') return '-';
    const labels: { [key: string]: { en: string; ar: string } } = {
      cash: { en: 'Cash', ar: 'نقدي' },
      bank_transfer: { en: 'Bank Transfer', ar: 'تحويل بنكي' },
      credit_card: { en: 'Credit Card', ar: 'بطاقة ائتمان' },
      debit_card: { en: 'Debit Card', ar: 'بطاقة خصم' },
      cheque: { en: 'Cheque', ar: 'شيك' },
    };
    return labels[method]?.[language] || method;
  };
  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Reference', 'Description', 'Status'];
    const rows = filteredTransactions.map(t => [
      format(new Date(t.transaction_date), 'yyyy-MM-dd'),
      t.type,
      getCategoryLabel(t.category),
      t.amount,
      t.payment_method || '',
      t.reference_number || '',
      t.description || '',
      t.status || 'completed'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{language === 'ar' ? 'المعاملات المالية' : 'Financial Transactions'}</CardTitle>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            {/* Date Range Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">
                  {language === 'ar' ? 'من تاريخ' : 'From Date'}
                </label>
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? (
                        format(dateFrom, "dd/MM/yyyy")
                      ) : (
                        <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => {
                        setDateFrom(date);
                        setDateFromOpen(false);
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">
                  {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                </label>
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? (
                        format(dateTo, "dd/MM/yyyy")
                      ) : (
                        <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => {
                        setDateTo(date);
                        setDateToOpen(false);
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                variant="outline"
                className="sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'مسح التواريخ' : 'Clear Dates'}
              </Button>
            </div>

            {/* Search and Other Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث بالرقم، المبلغ، أو الوصف...' : 'Search by number, amount, or description...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                size="sm"
                className={searchTerm ? '' : 'invisible'}
              >
                <X className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'مسح' : 'Clear'}
              </Button>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                  <SelectItem value="income">{language === 'ar' ? 'دخل' : 'Income'}</SelectItem>
                  <SelectItem value="expense">{language === 'ar' ? 'مصروف' : 'Expense'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{language === 'ar' ? 'التاريخ' : 'Date'}</SelectItem>
                  <SelectItem value="amount">{language === 'ar' ? 'المبلغ' : 'Amount'}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'رقم المعاملة' : 'Transaction No.'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                  <TableHead>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المرجع' : 'Reference'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المستندات' : 'Documents'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm font-semibold text-primary">
                      {transaction.transaction_number || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type === 'income' 
                          ? (language === 'ar' ? 'دخل' : 'Income')
                          : (language === 'ar' ? 'مصروف' : 'Expense')}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCategoryLabel(transaction.category)}</TableCell>
                    <TableCell>
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(transaction.payment_method || '-')}</TableCell>
                    <TableCell>{transaction.reference_number || '-'}</TableCell>
                    <TableCell>
                      {transaction.documents && transaction.documents.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {transaction.documents.some((d: any) => d.type?.startsWith('image/')) && (
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          )}
                          {transaction.documents.some((d: any) => d.type === 'application/pdf') && (
                            <FileText className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            ({transaction.documents.length})
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {transaction.status || 'completed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ar' ? 'لا توجد معاملات' : 'No transactions found'}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTransaction && (
        <TransactionDetailsDialog
          transaction={selectedTransaction as any}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </>
  );
}