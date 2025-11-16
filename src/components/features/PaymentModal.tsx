import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  feeId?: string;
  totalAmount?: number;
  paidAmount?: number;
  onSuccess?: () => void;
}

export default function PaymentModal({ feeId, totalAmount = 5000, paidAmount = 3500, onSuccess }: PaymentModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const remaining = totalAmount - paidAmount;

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(language === 'en' ? 'Please enter a valid amount' : 'يرجى إدخال مبلغ صالح');
      return;
    }

    if (parseFloat(amount) > remaining) {
      toast.error(language === 'en' ? 'Amount exceeds remaining balance' : 'المبلغ يتجاوز الرصيد المتبقي');
      return;
    }

    setProcessing(true);
    try {
      // Call payment processing function
      const { data, error } = await supabase.rpc('process_fee_payment_from_wallet', {
        p_fee_id: feeId,
        p_amount: parseFloat(amount)
      });

      if (error) throw error;

      // Send receipt email
      if (data.payment_id) {
        await supabase.functions.invoke('send-payment-receipt', {
          body: { payment_id: data.payment_id }
        });
      }

      toast.success(language === 'en' ? 'Payment successful! Receipt sent to your email.' : 'تم الدفع بنجاح! تم إرسال الإيصال إلى بريدك الإلكتروني.');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('feature.payments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              <div className="bg-accent/5 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('parent.totalFees')}</span>
                  <span className="font-medium">{totalAmount.toFixed(3)} OMR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('parent.paid')}</span>
                  <span className="font-medium text-success">{paidAmount.toFixed(3)} OMR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('parent.remaining')}</span>
                  <span className="font-bold text-destructive">{remaining.toFixed(3)} OMR</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="amount">{language === 'en' ? 'Amount to Pay (OMR)' : 'المبلغ المطلوب دفعه (ر.ع)'}</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.001"
                    placeholder="0.000" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={remaining}
                    className="mt-1 number-display"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'en' 
                      ? `You can pay any amount up to ${remaining.toFixed(3)} OMR` 
                      : `يمكنك دفع أي مبلغ يصل إلى ${remaining.toFixed(3)} ر.ع`}
                  </p>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handlePayment}
                disabled={processing || !amount}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {processing 
                  ? (language === 'en' ? 'Processing...' : 'جاري المعالجة...')
                  : (language === 'en' ? 'Pay from Wallet' : 'الدفع من المحفظة')}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {language === 'en' 
                  ? 'Payment will be deducted from your wallet balance' 
                  : 'سيتم خصم المبلغ من رصيد محفظتك'}
              </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}