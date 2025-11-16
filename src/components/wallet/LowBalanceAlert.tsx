import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LowBalanceAlertProps {
  threshold?: number;
  onTopUpClick?: () => void;
}

export default function LowBalanceAlert({ threshold = 20, onTopUpClick }: LowBalanceAlertProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [balance, setBalance] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (user) {
      loadBalance();
      subscribeToBalance();
    }
  }, [user]);

  useEffect(() => {
    if (balance !== null && balance < threshold) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [balance, threshold]);

  const loadBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const subscribeToBalance = () => {
    if (!user) return;

    const channel = supabase
      .channel(`balance-${user.id}`)
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

  return (
    <AnimatePresence>
      {showAlert && balance !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="destructive" className="border-amber-500 bg-amber-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>
                {language === 'ar' ? 'رصيد منخفض' : 'Low Balance'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onTopUpClick}
                className="ml-4"
              >
                <Wallet className="h-3 w-3 mr-1" />
                {language === 'ar' ? 'شحن الآن' : 'Top Up Now'}
              </Button>
            </AlertTitle>
            <AlertDescription>
              {language === 'ar' 
                ? `رصيدك الحالي ${balance.toFixed(2)} ريال عماني منخفض. يُنصح بشحن المحفظة للتأكد من عدم انقطاع الخدمات.`
                : `Your current balance of ${balance.toFixed(2)} OMR is low. Please top up to ensure uninterrupted services.`}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
