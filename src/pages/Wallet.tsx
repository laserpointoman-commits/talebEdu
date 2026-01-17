import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet as WalletIcon, Loader2 } from "lucide-react";
import LogoLoader from "@/components/LogoLoader";
import WalletTopUp from "@/components/wallet/WalletTopUp";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import LowBalanceAlert from "@/components/wallet/LowBalanceAlert";
import { getText } from "@/utils/i18n";

export default function Wallet() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBalance();
      subscribeToBalance();
    }
  }, [user]);

  const loadBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToBalance = () => {
    if (!user) return;

    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_balances',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && 'balance' in payload.new) {
            setBalance(payload.new.balance as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  const t = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <WalletIcon className="h-8 w-8 text-primary" />
          {t('Digital Wallet', 'المحفظة الرقمية', 'डिजिटल वॉलेट')}
        </h1>
        <p className="text-muted-foreground">
          {t('Manage your balance and transactions', 'إدارة رصيدك والمعاملات المالية', 'अपना बैलेंस और लेनदेन प्रबंधित करें')}
        </p>
      </div>

      {/* Low Balance Alert */}
      <LowBalanceAlert threshold={20} />

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            {t('Current Balance', 'الرصيد الحالي', 'वर्तमान शेष')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balance !== null ? (
            <>
              <div className="text-5xl font-bold mb-2">
                {balance.toFixed(2)} {t('OMR', 'ريال', 'OMR')}
              </div>
              <p className="text-primary-foreground/80">
                {t('Available to spend', 'متاح للإنفاق', 'खर्च के लिए उपलब्ध')}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('Loading...', 'جاري التحميل...', 'लोड हो रहा है...')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Up Section */}
        <WalletTopUp onSuccess={loadBalance} />

        {/* Transaction History */}
        <TransactionHistory />
      </div>
    </div>
  );
}