import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet as WalletIcon, Loader2, TrendingUp, ArrowUpRight, CreditCard } from "lucide-react";
import LogoLoader from "@/components/LogoLoader";
import WalletTopUp from "@/components/wallet/WalletTopUp";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import LowBalanceAlert from "@/components/wallet/LowBalanceAlert";
import { getText } from "@/utils/i18n";
import { motion } from "framer-motion";

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
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-sky-500 to-primary p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <WalletIcon className="h-6 w-6" />
            </div>
            {t('Digital Wallet', 'المحفظة الرقمية', 'डिजिटल वॉलेट')}
          </h1>
          <p className="text-white/80 mt-1">
            {t('Manage your balance and transactions', 'إدارة رصيدك والمعاملات المالية', 'अपना बैलेंस और लेनदेन प्रबंधित करें')}
          </p>
        </div>
      </div>

      {/* Low Balance Alert */}
      <LowBalanceAlert threshold={20} />

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-xl rounded-2xl bg-gradient-to-br from-primary via-primary to-sky-600 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-white/90">
              <WalletIcon className="h-5 w-5" />
              {t('Current Balance', 'الرصيد الحالي', 'वर्तमान शेष')}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {balance !== null ? (
              <>
                <div className="text-5xl font-bold mb-2">
                  {balance.toFixed(2)} <span className="text-2xl">{t('OMR', 'ريال', 'OMR')}</span>
                </div>
                <p className="text-white/70 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
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
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('Quick Top-Up', 'شحن سريع', 'त्वरित टॉप-अप')}</p>
                  <p className="text-lg font-semibold text-green-600">{t('Add Funds', 'إضافة رصيد', 'धनराशि जोड़ें')}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10">
                  <ArrowUpRight className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('Payment Methods', 'طرق الدفع', 'भुगतान विधियाँ')}</p>
                  <p className="text-lg font-semibold text-purple-600">{t('Card/Bank', 'بطاقة/بنك', 'कार्ड/बैंक')}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                  <CreditCard className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Up Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <WalletTopUp onSuccess={loadBalance} />
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TransactionHistory />
        </motion.div>
      </div>
    </div>
  );
}
