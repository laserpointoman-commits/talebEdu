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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.canteen')}</h2>
        <p className="text-muted-foreground">
          {getText('School canteen menu', 'قائمة المقصف المدرسي', 'स्कूल कैंटीन मेन्यू')}
        </p>
      </div>

      {/* Wallet Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {getText('Wallet Balance', 'رصيد المحفظة', 'वॉलेट बैलेंस')}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {language === 'ar' ? `${walletBalance.toFixed(2)} ر.ع` : `OMR ${walletBalance.toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items - Read Only View */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{getText('Menu Items', 'قائمة الطعام', 'मेन्यू आइटम')}</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {menuItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <item.icon className="h-8 w-8 text-primary" />
                  <Badge variant={item.available ? 'default' : 'secondary'}>
                    {item.available ? getText('Available', 'متوفر', 'उपलब्ध') : getText('Sold Out', 'نفذ', 'बिक गया')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-lg mb-1">{language === 'en' ? item.name : item.nameAr}</p>
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
        <Card>
          <CardHeader>
            <CardTitle>{getText('Recent Purchases', 'المشتريات الأخيرة', 'हाल की खरीदारी')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchaseHistory.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? purchase.description_ar || purchase.description : purchase.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'hi' ? 'hi-IN' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-red-600">
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