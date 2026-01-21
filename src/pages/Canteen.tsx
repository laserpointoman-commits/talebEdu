import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Coffee, Apple, Sandwich, Wallet, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CanteenManagement from '@/components/features/CanteenManagement';
import ParentalControl from '@/components/features/ParentalControl';

export default function Canteen() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [walletBalance, setWalletBalance] = useState(0);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchPurchaseHistory();
      fetchMenuItems();
    }

    // Setup realtime subscriptions
    const channel = supabase
      .channel('canteen-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'canteen_items'
        },
        () => {
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('canteen_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      
      // Map to component format
      const mapped = data?.map(item => ({
        id: item.id,
        name: item.name,
        nameAr: item.name_ar || item.name,
        price: item.price,
        category: item.category,
        available: item.available,
        icon: item.icon === '🍽️' ? Sandwich : item.icon === '☕' ? Coffee : item.icon === '🍎' ? Apple : Package
      })) || [];
      
      setMenuItems(mapped);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setWalletBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'purchase')
        .ilike('description', '%canteen%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPurchaseHistory(data || []);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    }
  };

  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };

  // Only show canteen for students and parents
  if (effectiveRole !== 'student' && effectiveRole !== 'parent' && effectiveRole !== 'admin' && effectiveRole !== 'developer') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {getText('Access Restricted', 'الوصول مقيد', 'पहुंच प्रतिबंधित')}
          </h3>
          <p className="text-muted-foreground">
            {getText(
              'This section is available for students and parents only',
              'هذا القسم متاح للطلاب والآباء فقط',
              'यह अनुभाग केवल छात्रों और अभिभावकों के लिए उपलब्ध है'
            )}
          </p>
        </Card>
      </div>
    );
  }

  // Admin sees a management view
  if (effectiveRole === 'admin') {
    return <CanteenManagement />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] bg-[length:20px_20px]" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold">{t('dashboard.canteen')}</h2>
          <p className="mt-1 text-white/80 text-sm md:text-base">
            {getText('School canteen menu', 'قائمة المقصف المدرسي', 'स्कूल कैंटीन मेन्यू')}
          </p>
        </div>
      </div>

      {/* Wallet Balance */}
      <Card className="overflow-hidden rounded-2xl shadow-md border-0 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600" />
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  {getText('Wallet Balance', 'رصيد المحفظة', 'वॉलेट बैलेंस')}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {language === 'ar' ? `${walletBalance.toFixed(2)} ر.ع` : `OMR ${walletBalance.toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items - Read Only View */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          {getText('Menu Items', 'قائمة الطعام', 'मेन्यू आइटम')}
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {menuItems.map((item, idx) => (
            <Card key={item.id} className="overflow-hidden rounded-xl hover:shadow-lg transition-all group border-0 shadow-md">
              <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-rose-600" />
                  </div>
                  <Badge variant={item.available ? 'default' : 'secondary'} className={item.available ? 'bg-emerald-500' : ''}>
                    {item.available ? getText('Available', 'متوفر', 'उपलब्ध') : getText('Sold Out', 'نفذ', 'बिक गया')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg mb-1">{language === 'en' ? item.name : item.nameAr}</p>
                <p className="text-sm text-muted-foreground mb-3">{item.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    {language === 'ar' ? `${item.price.toFixed(2)} ر.ع` : `OMR ${item.price.toFixed(2)}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Purchase History */}
      {purchaseHistory.length > 0 && (
        <Card className="overflow-hidden rounded-2xl shadow-md">
          <div className="h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              {getText('Recent Purchases', 'المشتريات الأخيرة', 'हाल की खरीदारी')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchaseHistory.slice(0, 5).map((purchase, idx) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? purchase.description_ar || purchase.description : purchase.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'hi' ? 'hi-IN' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-red-600">
                    {language === 'ar' 
                      ? `${Math.abs(purchase.amount).toFixed(2)} ر.ع`
                      : `OMR ${Math.abs(purchase.amount).toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}