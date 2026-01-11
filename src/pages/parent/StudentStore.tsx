import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Store, Package, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StoreItem {
  id: string;
  name: string;
  name_ar: string | null;
  price: number;
  category: string;
  available: boolean;
  icon: string | null;
}

interface CartItem extends StoreItem {
  quantity: number;
}

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
  items: any;
}

export default function StudentStore() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (studentId && user) {
      loadData();
    }
  }, [studentId, user]);

  const loadData = async () => {
    try {
      // Verify parent owns this student
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('parent_id', user?.id)
        .single();

      if (error || !studentData) {
        navigate('/dashboard');
        return;
      }

      setStudent(studentData);

      // Load canteen items as store items
      const { data: items } = await supabase
        .from('canteen_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true });

      setStoreItems(items || []);

      // Load student wallet balance
      const { data: wallet } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', studentId)
        .maybeSingle();

      setWalletBalance(wallet?.balance || 0);

      // Load recent orders
      const { data: ordersData } = await supabase
        .from('canteen_orders')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: StoreItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.id !== itemId);
    });
  };

  const getCartQuantity = (itemId: string) => {
    return cart.find(c => c.id === itemId)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePurchase = async () => {
    if (cart.length === 0) return;

    if (cartTotal > walletBalance) {
      toast.error(language === 'ar' ? 'رصيد المحفظة غير كافي' : 'Insufficient wallet balance');
      return;
    }

    setPurchasing(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('canteen_orders')
        .insert({
          student_id: studentId,
          items: cart.map(c => ({ id: c.id, name: c.name, quantity: c.quantity, price: c.price })),
          total_amount: cartTotal,
          payment_method: 'wallet'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('wallet_balances')
        .update({ balance: walletBalance - cartTotal })
        .eq('user_id', studentId);

      if (walletError) throw walletError;

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_id: studentId,
        amount: -cartTotal,
        balance_after: walletBalance - cartTotal,
        type: 'purchase',
        description: language === 'ar' ? 'شراء من المتجر' : 'Store purchase'
      });

      toast.success(language === 'ar' ? 'تمت عملية الشراء بنجاح' : 'Purchase completed successfully');
      setCart([]);
      setWalletBalance(prev => prev - cartTotal);
      loadData();
    } catch (error) {
      console.error('Error purchasing:', error);
      toast.error(language === 'ar' ? 'فشلت عملية الشراء' : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  // Group items by category
  const groupedItems = storeItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, StoreItem[]>);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/student/${studentId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'متجر المدرسة' : 'School Store'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Wallet Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'رصيد المحفظة' : 'Wallet Balance'}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {walletBalance.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Items */}
      <div className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {language === 'ar' ? 'المنتجات المتاحة' : 'Available Products'}
        </h2>
        
        {Object.keys(groupedItems).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد منتجات متاحة' : 'No products available'}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm text-muted-foreground uppercase flex items-center gap-2">
                  <span>{items[0]?.icon || '📦'}</span>
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {items.map((item) => {
                  const qty = getCartQuantity(item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon || '📦'}</span>
                        <div>
                          <p className="font-medium">
                            {language === 'ar' ? item.name_ar || item.name : item.name}
                          </p>
                          <p className="text-sm text-primary font-bold">
                            {Number(item.price).toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {qty > 0 ? (
                          <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold w-6 text-center">{qty}</span>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {language === 'ar' ? 'أضف' : 'Add'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {language === 'ar' ? 'الطلبات السابقة' : 'Order History'}
          </h2>
          
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {Number(order.total_amount).toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <Badge variant="default">
                    <Check className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'مكتمل' : 'Completed'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50">
          <Card className="shadow-lg border-primary">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {cart.reduce((sum, c) => sum + c.quantity, 0)} {language === 'ar' ? 'منتج' : 'items'}
                  </span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {cartTotal.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                </span>
              </div>
              <Button 
                className="w-full" 
                onClick={handlePurchase}
                disabled={purchasing || cartTotal > walletBalance}
              >
                {purchasing 
                  ? (language === 'ar' ? 'جاري الشراء...' : 'Processing...')
                  : cartTotal > walletBalance
                    ? (language === 'ar' ? 'رصيد غير كافي' : 'Insufficient Balance')
                    : (language === 'ar' ? 'إتمام الشراء' : 'Complete Purchase')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}