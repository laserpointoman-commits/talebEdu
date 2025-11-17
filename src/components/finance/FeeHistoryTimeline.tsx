import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, DollarSign, Tag, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { wrapBidiText } from '@/utils/bidirectional';

interface FeeHistoryTimelineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentFeeId: string;
}

export default function FeeHistoryTimeline({ open, onOpenChange, studentId, studentFeeId }: FeeHistoryTimelineProps) {
  const { language } = useLanguage();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isRTL = language === 'ar';

  useEffect(() => {
    if (open && studentFeeId) {
      loadHistory();
    }
  }, [open, studentFeeId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_fee_history')
        .select(`
          *,
          changer:profiles!changed_by(full_name, full_name_ar)
        `)
        .eq('student_fee_id', studentFeeId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Plus className="h-5 w-5 text-blue-500" />;
      case 'updated':
        return <Edit className="h-5 w-5 text-orange-500" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'discount_added':
      case 'discount_removed':
        return <Tag className="h-5 w-5 text-purple-500" />;
      case 'due_date_changed':
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels = {
      created: { en: 'Fee Created', ar: 'إنشاء الرسوم' },
      updated: { en: 'Fee Updated', ar: 'تحديث الرسوم' },
      payment: { en: 'Payment Received', ar: 'استلام دفعة' },
      discount_added: { en: 'Discount Added', ar: 'إضافة خصم' },
      discount_removed: { en: 'Discount Removed', ar: 'إزالة خصم' },
      late_fee_added: { en: 'Late Fee Added', ar: 'إضافة رسوم تأخير' },
      due_date_changed: { en: 'Due Date Changed', ar: 'تغيير تاريخ الاستحقاق' },
      note_added: { en: 'Note Added', ar: 'إضافة ملاحظة' },
    };
    return labels[actionType as keyof typeof labels]?.[language] || actionType;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-width-[600px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Fee History' : 'سجل الرسوم'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en'
              ? 'Complete history of all changes and transactions'
              : 'السجل الكامل لجميع التغييرات والمعاملات'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className={`space-y-4 ${isRTL ? 'border-r-2' : 'border-l-2'} border-muted pl-6 pr-2`}>
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`relative ${isRTL ? 'pr-6' : 'pl-6'}`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute ${isRTL ? 'right-0 -translate-x-1/2' : 'left-0 translate-x-1/2'} -translate-y-1 bg-background p-1`}>
                    {getActionIcon(entry.action_type)}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className={`flex items-start justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {getActionLabel(entry.action_type)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? entry.description_ar || entry.description : entry.description}
                        </p>
                      </div>
                      {entry.amount && (
                        <Badge variant={entry.action_type === 'payment' ? 'default' : 'secondary'}>
                          <span dir="ltr">{wrapBidiText(entry.amount)} {language === 'en' ? 'OMR' : 'ر.ع'}</span>
                        </Badge>
                      )}
                    </div>

                    {/* Payment details */}
                    {entry.payment_method && (
                      <div className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                        <span className="font-medium">
                          {language === 'en' ? 'Method:' : 'الطريقة:'}
                        </span>{' '}
                        {entry.payment_method}
                        {entry.transaction_reference && (
                          <>
                            {' • '}
                            <span className="font-medium">
                              {language === 'en' ? 'Ref:' : 'رقم:'}
                            </span>{' '}
                            <span dir="ltr">{entry.transaction_reference}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className={`flex items-center gap-4 text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span dir="ltr">
                        {format(new Date(entry.changed_at), 'MMM dd, yyyy HH:mm', { locale: isRTL ? ar : undefined })}
                      </span>
                      {entry.changer && (
                        <>
                          <span>•</span>
                          <span>
                            {language === 'en' ? 'by' : 'بواسطة'}{' '}
                            {isRTL ? entry.changer.full_name_ar || entry.changer.full_name : entry.changer.full_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'en' ? 'No history available' : 'لا يوجد سجل'}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
