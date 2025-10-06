import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, CreditCard, FileText, Hash, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  description_ar: string;
  payment_method: string;
  reference_number: string;
  transaction_number?: string;
  transaction_date: string;
  status: string;
  documents: any[];
  created_at: string;
  updated_at: string;
}

interface TransactionDetailsDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailsDialog({ 
  transaction, 
  open, 
  onOpenChange 
}: TransactionDetailsDialogProps) {
  const { language } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
    }).format(amount);
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
    const labels: { [key: string]: { en: string; ar: string } } = {
      cash: { en: 'Cash', ar: 'نقدي' },
      bank_transfer: { en: 'Bank Transfer', ar: 'تحويل بنكي' },
      credit_card: { en: 'Credit Card', ar: 'بطاقة ائتمان' },
      debit_card: { en: 'Debit Card', ar: 'بطاقة خصم' },
      cheque: { en: 'Cheque', ar: 'شيك' },
    };
    return labels[method]?.[language] || method;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{language === 'ar' ? 'تفاصيل المعاملة' : 'Transaction Details'}</span>
            <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
              {transaction.type === 'income' 
                ? (language === 'ar' ? 'دخل' : 'Income')
                : (language === 'ar' ? 'مصروف' : 'Expense')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Number */}
          {transaction.transaction_number && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? 'رقم المعاملة' : 'Transaction Number'}
              </span>
              <p className="text-lg font-bold font-mono text-primary mt-1">
                {transaction.transaction_number}
              </p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {language === 'ar' ? 'المبلغ' : 'Amount'}
              </span>
              <span className={`text-2xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{language === 'ar' ? 'التاريخ' : 'Date'}</span>
                </div>
                <span className="font-medium">
                  {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</span>
                </div>
                <span className="font-medium">
                  {getPaymentMethodLabel(transaction.payment_method)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{language === 'ar' ? 'الفئة' : 'Category'}</span>
                </div>
                <span className="font-medium">
                  {getCategoryLabel(transaction.category)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>{language === 'ar' ? 'رقم المرجع' : 'Reference'}</span>
                </div>
                <span className="font-medium">
                  {transaction.reference_number || '-'}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {(transaction.description || transaction.description_ar) && (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </h4>
                <p className="text-sm">
                  {language === 'ar' 
                    ? (transaction.description_ar || transaction.description)
                    : (transaction.description || transaction.description_ar)}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Documents */}
          {transaction.documents && transaction.documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                {language === 'ar' ? 'المستندات المرفقة' : 'Attached Documents'}
              </h4>
              
              <div className="space-y-2">
                {transaction.documents.map((doc: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {doc.type?.startsWith('image/') ? (
                          <ImageIcon className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[300px]">
                            {doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.size ? formatFileSize(doc.size) : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Preview for images */}
                    {doc.type?.startsWith('image/') && (
                      <div className="mt-3">
                        <img 
                          src={doc.url} 
                          alt={doc.name}
                          className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(doc.url, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status and Metadata */}
          <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'الحالة' : 'Status'}</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {transaction.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</span>
              <span>{format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')}</span>
            </div>
            {transaction.updated_at !== transaction.created_at && (
              <div className="flex justify-between">
                <span>{language === 'ar' ? 'آخر تحديث' : 'Last Updated'}</span>
                <span>{format(new Date(transaction.updated_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}