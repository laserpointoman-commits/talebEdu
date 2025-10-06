import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, Plus, Send, Calendar, TrendingUp, TrendingDown, AlertCircle, Download, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import LogoLoader from '@/components/LogoLoader';
import WalletTransfer from './WalletTransfer';

export default function WalletComponent() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Check if user has access to wallet
  const allowedRoles = ['parent', 'student', 'teacher', 'developer'];
  const hasAccess = profile && allowedRoles.includes(profile.role);

  useEffect(() => {
    if (user && hasAccess) {
      fetchWalletData();
    } else if (profile && !hasAccess) {
      setLoading(false);
    }
    
    // Listen for wallet updates
    const handleWalletUpdate = () => {
      if (user && hasAccess) {
        fetchWalletData();
      }
    };
    
    window.addEventListener('wallet-update', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('wallet-update', handleWalletUpdate);
    };
  }, [user, hasAccess]);

  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (walletError && walletError.code !== 'PGRST116') throw walletError;

      if (!walletData && !walletError) {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('wallet_balances')
          .insert([{ user_id: user?.id, balance: 0 }])
          .select()
          .single();

        if (createError) throw createError;
        setBalance(0);
      } else {
        setBalance(walletData?.balance || 0);
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);

    try {
      const newBalance = balance + amount;

      // Update balance
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update({ balance: newBalance })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: user?.id,
          amount: amount,
          type: 'deposit',
          description: language === 'ar' ? 'إضافة رصيد' : 'Wallet Top-up',
          description_ar: 'إضافة رصيد',
          balance_after: newBalance
        }]);

      if (transactionError) throw transactionError;

      setBalance(newBalance);
      toast({
        title: language === 'ar' ? 'تم إضافة الرصيد' : 'Funds Added',
        description: language === 'ar' 
          ? `تم إضافة ${amount.toFixed(2)} ر.ع إلى محفظتك`
          : `Added OMR ${amount.toFixed(2)} to your wallet`,
      });

      setShowTopUp(false);
      setTopUpAmount('');
      fetchWalletData();
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Redirect if user doesn't have access
  if (!loading && profile && !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">
          {language === 'ar' ? 'غير مصرح' : 'Access Denied'}
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          {language === 'ar' 
            ? 'ليس لديك صلاحية الوصول إلى هذه الصفحة. المحفظة متاحة فقط للطلاب وأولياء الأمور.'
            : 'You do not have permission to access this page. Wallet is only available for students and parents.'}
        </p>
        <Button onClick={() => window.history.back()}>
          {language === 'ar' ? 'العودة' : 'Go Back'}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <LogoLoader size="medium" text={true} fullScreen={true} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {language === 'ar' ? 'محفظتي' : 'My Wallet'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg">
              <p className="text-sm opacity-90">
                {language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}
              </p>
              <p className="text-4xl font-bold mt-2">
                <span className="number-display">{language === 'ar' ? `${balance.toFixed(2)} ر.ع` : `OMR ${balance.toFixed(2)}`}</span>
              </p>
              <div className="flex gap-2 mt-6">
                <Button size="sm" variant="secondary" onClick={() => setShowTopUp(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {language === 'ar' ? 'إضافة رصيد' : 'Add Funds'}
                </Button>
                <WalletTransfer />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ar' ? 'المعاملات الأخيرة' : 'Recent Transactions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ar' ? 'لا توجد معاملات بعد' : 'No transactions yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'deposit' 
                        ? 'bg-green-500/10 text-green-600' 
                        : transaction.type === 'transfer_out' 
                        ? 'bg-orange-500/10 text-orange-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : transaction.type === 'transfer_in' ? (
                        <Download className="h-4 w-4" />
                      ) : transaction.type === 'transfer_out' ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {language === 'ar' ? transaction.description_ar || transaction.description : transaction.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}
                      {language === 'ar' 
                        ? <span className="number-display">{Math.abs(transaction.amount).toFixed(2)} ر.ع</span>
                        : <span className="number-display">OMR {Math.abs(transaction.amount).toFixed(2)}</span>}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {transaction.type === 'deposit' 
                        ? (language === 'en' ? 'Deposit' : 'إيداع')
                        : transaction.type === 'transfer_in'
                        ? (language === 'en' ? 'Received' : 'استلام')
                        : transaction.type === 'transfer_out'
                        ? (language === 'en' ? 'Sent' : 'إرسال')
                        : (language === 'en' ? 'Purchase' : 'شراء')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Up Dialog */}
      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {language === 'ar' ? 'إضافة رصيد' : 'Add Funds'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'ar' ? 'المبلغ (ر.ع)' : 'Amount (OMR)'}</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder={language === 'ar' ? 'أدخل المبلغ' : 'Enter amount'}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                dir="ltr"
                className="number-display"
              />
            </div>
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                {language === 'ar' 
                  ? 'في التطبيق الفعلي، سيتم توجيهك لبوابة الدفع الإلكتروني'
                  : 'In production, you will be redirected to payment gateway'}
              </p>
            </div>
            <Button 
              onClick={handleTopUp} 
              className="w-full"
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center">
                  <LogoLoader size="small" />
                  <span className="ml-2">{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
                </span>
              ) : (
                language === 'ar' ? 'إضافة الرصيد' : 'Add Funds'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
