import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpRight, ArrowDownRight, History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  description_ar: string;
  created_at: string;
  payment_method?: string;
}

export default function TransactionHistory() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
      subscribeToTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTransactions = () => {
    if (!user) return;

    const channel = supabase
      .channel(`transactions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setTransactions(prev => [payload.new as Transaction, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'top_up' || type === 'deposit' || type === 'transfer_in') {
      return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    }
    return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
  };

  const getTransactionColor = (type: string) => {
    if (type === 'top_up' || type === 'deposit' || type === 'transfer_in') {
      return 'text-green-600';
    }
    return 'text-orange-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {language === 'ar' ? 'سجل المعاملات' : language === 'hi' ? 'लेनदेन इतिहास' : 'Transaction History'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'ar' ? 'لا توجد معاملات بعد' : language === 'hi' ? 'अभी तक कोई लेनदेन नहीं' : 'No transactions yet'}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type.includes('top_up') || transaction.type.includes('deposit') || transaction.type.includes('in')
                        ? 'bg-green-500/10'
                        : 'bg-orange-500/10'
                    }`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    <div>
                      <p className="font-medium text-sm">
                        {language === 'ar' ? transaction.description_ar : transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy h:mm a')}
                      </p>
                      {transaction.payment_method && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {transaction.payment_method}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type.includes('top_up') || transaction.type.includes('deposit') || transaction.type.includes('in') ? '+' : '-'}
                      {Math.abs(transaction.amount).toFixed(2)} OMR
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'الرصيد:' : language === 'hi' ? 'शेष:' : 'Balance:'} {transaction.balance_after.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
