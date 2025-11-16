import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletTopUpProps {
  onSuccess?: () => void;
}

export default function WalletTopUp({ onSuccess }: WalletTopUpProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleTopUp = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(language === 'ar' ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    setLoading(true);

    try {
      // Get current balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') throw walletError;

      const currentBalance = walletData?.balance || 0;
      const topUpAmount = Number(amount);
      const newBalance = currentBalance + topUpAmount;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .upsert({
          user_id: user.id,
          balance: newBalance,
          currency: 'OMR',
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'top_up',
          amount: topUpAmount,
          balance_after: newBalance,
          description: `Wallet top-up via ${paymentMethod === 'card' ? 'Card' : 'Bank Transfer'}`,
          description_ar: `شحن المحفظة عبر ${paymentMethod === 'card' ? 'البطاقة' : 'التحويل البنكي'}`,
          payment_method: paymentMethod
        });

      if (transactionError) throw transactionError;

      toast.success(
        language === 'ar' 
          ? `تم إضافة ${topUpAmount} ريال عماني بنجاح` 
          : `Successfully added ${topUpAmount} OMR`
      );

      setAmount('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Top-up error:', error);
      toast.error(language === 'ar' ? 'فشل شحن المحفظة' : 'Failed to top up wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {language === 'ar' ? 'شحن المحفظة' : 'Top Up Wallet'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'أضف أموال إلى محفظتك للمدفوعات المدرسية'
            : 'Add funds to your wallet for school payments'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Amounts */}
        <div>
          <Label className="mb-3 block">
            {language === 'ar' ? 'مبالغ سريعة' : 'Quick Amounts'}
          </Label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant={amount === quickAmount.toString() ? 'default' : 'outline'}
                onClick={() => setAmount(quickAmount.toString())}
                className="w-full"
              >
                {quickAmount}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">
            {language === 'ar' ? 'المبلغ المخصص' : 'Custom Amount'}
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10"
              min="1"
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              OMR
            </span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <Label>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</Label>
          <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-4 w-4" />
                {language === 'ar' ? 'بطاقة ائتمان/خصم' : 'Credit/Debit Card'}
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                <Wallet className="h-4 w-4" />
                {language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleTopUp} 
          disabled={loading || !amount}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'شحن المحفظة' : 'Top Up Wallet'}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {language === 'ar' 
            ? 'سيتم إضافة الأموال إلى محفظتك على الفور'
            : 'Funds will be added to your wallet immediately'}
        </p>
      </CardContent>
    </Card>
  );
}
