import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, Calendar, Send, Download } from 'lucide-react';
import WalletTransfer from './WalletTransfer';

export default function WalletStudent() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
    
    // Listen for wallet updates
    const handleWalletUpdate = () => {
      if (user) {
        fetchWalletData();
      }
    };
    
    window.addEventListener('wallet-update', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('wallet-update', handleWalletUpdate);
    };
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (walletError) throw walletError;
      setBalance(walletData?.balance || 0);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <LogoLoader size="medium" text={true} fullScreen={true} />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {language === 'en' ? 'My Wallet' : 'محفظتي'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              {language === 'en' ? 'Current Balance' : 'الرصيد الحالي'}
            </p>
            <p className="text-4xl font-bold text-primary">
              <span className="number-display">{language === 'ar' ? `${balance.toFixed(2)} ر.ع` : `OMR ${balance.toFixed(2)}`}</span>
            </p>
            <div className="mt-4">
              <WalletTransfer />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'en' ? 'Transaction History' : 'سجل المعاملات'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'en' ? 'No transactions yet' : 'لا توجد معاملات بعد'}
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
                      transaction.type === 'deposit' || transaction.type === 'transfer_in'
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
                      transaction.type === 'deposit' || transaction.type === 'transfer_in' ? 'text-green-600' : 'text-red-600'
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
    </div>
  );
}
