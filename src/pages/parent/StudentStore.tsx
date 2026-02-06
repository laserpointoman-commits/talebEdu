import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Store, Package, ShoppingCart, Plus, Minus, Check, 
  MapPin, Clock, Phone, MessageSquare, Truck, Building2, X,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import PageHeader from '@/components/layouts/PageHeader';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface StoreItem {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  category: string;
  available: boolean;
  icon: string | null;
  stock_quantity: number;
}

interface CartItem extends StoreItem {
  quantity: number;
  size?: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any;
  notes: string | null;
}

type CheckoutStep = 'cart' | 'details' | 'confirmation';

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
  const [parentWalletBalance, setParentWalletBalance] = useState(0);
  
  // Checkout flow
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'classroom'>('pickup');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [showSizeDialog, setShowSizeDialog] = useState<StoreItem | null>(null);

  useEffect(() => {
    if (studentId && user) {
      loadData();
    }
  }, [studentId, user]);

  const loadData = async () => {
    try {
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

      const { data: items } = await supabase
        .from('store_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true });

      setStoreItems(items || []);

      const { data: wallet } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();

      setParentWalletBalance(wallet?.balance || 0);

      const { data: ordersData } = await supabase
        .from('store_orders')
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

  const isUniformItem = (category: string) => category === 'Uniforms';

  const addToCart = (item: StoreItem, size?: string) => {
    if (isUniformItem(item.category) && !size) {
      setShowSizeDialog(item);
      return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.id === item.id && c.size === size);
      if (existing) {
        if (existing.quantity >= item.stock_quantity) {
          toast.error(language === 'ar' ? 'لا يوجد مخزون كافي' : 'Not enough stock');
          return prev;
        }
        return prev.map(c => 
          c.id === item.id && c.size === size 
            ? { ...c, quantity: c.quantity + 1 } 
            : c
        );
      }
      return [...prev, { ...item, quantity: 1, size }];
    });

    if (size) {
      setSelectedSize(prev => ({ ...prev, [item.id]: size }));
      setShowSizeDialog(null);
    }
  };

  const removeFromCart = (itemId: string, size?: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId && c.size === size);
      if (existing && existing.quantity > 1) {
        return prev.map(c => 
          c.id === itemId && c.size === size 
            ? { ...c, quantity: c.quantity - 1 } 
            : c
        );
      }
      return prev.filter(c => !(c.id === itemId && c.size === size));
    });
  };

  const removeItemCompletely = (itemId: string, size?: string) => {
    setCart(prev => prev.filter(c => !(c.id === itemId && c.size === size)));
  };

  const getCartQuantity = (itemId: string) => {
    return cart.filter(c => c.id === itemId).reduce((sum, c) => sum + c.quantity, 0);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePurchase = async () => {
    if (cart.length === 0) return;

    if (cartTotal > parentWalletBalance) {
      toast.error(language === 'ar' ? 'رصيد المحفظة غير كافي' : 'Insufficient wallet balance');
      return;
    }

    setPurchasing(true);
    try {
      const orderItems = cart.map(c => ({ 
        id: c.id, 
        name: c.name, 
        name_ar: c.name_ar,
        quantity: c.quantity, 
        price: c.price,
        size: c.size,
        category: c.category
      }));

      const { data: order, error: orderError } = await supabase
        .from('store_orders')
        .insert({
          student_id: studentId,
          parent_id: user?.id,
          items: orderItems,
          total_amount: cartTotal,
          status: 'pending',
          payment_method: 'wallet',
          notes: `${deliveryMethod === 'classroom' ? 'Deliver to classroom' : 'Pickup from store'}${orderNotes ? ` - ${orderNotes}` : ''}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const newBalance = parentWalletBalance - cartTotal;
      const { error: walletError } = await supabase
        .from('wallet_balances')
        .update({ balance: newBalance })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      await supabase.from('wallet_transactions').insert({
        user_id: user?.id,
        amount: -cartTotal,
        balance_after: newBalance,
        type: 'purchase',
        description: language === 'ar' ? 'طلب من متجر المدرسة' : 'School store order'
      });

      for (const item of cart) {
        await supabase
          .from('store_items')
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq('id', item.id);
      }

      setCheckoutStep('confirmation');
      setParentWalletBalance(newBalance);
    } catch (error) {
      console.error('Error purchasing:', error);
      toast.error(language === 'ar' ? 'فشل الطلب' : 'Order failed');
    } finally {
      setPurchasing(false);
    }
  };

  const resetCheckout = () => {
    setShowCheckout(false);
    setCheckoutStep('cart');
    setCart([]);
    setOrderNotes('');
    setDeliveryMethod('pickup');
    loadData();
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  const groupedItems = storeItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, StoreItem[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Stationery': return '✏️';
      case 'Books': return '📚';
      case 'Uniforms': return '👔';
      default: return '📦';
    }
  };

  const getCategoryName = (category: string) => {
    if (language === 'ar') {
      switch (category) {
        case 'Stationery': return 'القرطاسية';
        case 'Books': return 'الكتب المدرسية';
        case 'Uniforms': return 'الزي المدرسي';
        default: return category;
      }
    }
    return category;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { label: language === 'ar' ? 'تم التسليم' : 'Delivered', variant: 'default' as const, color: 'bg-green-500' };
      case 'pending': return { label: language === 'ar' ? 'قيد التجهيز' : 'Preparing', variant: 'secondary' as const, color: 'bg-yellow-500' };
      case 'ready': return { label: language === 'ar' ? 'جاهز للاستلام' : 'Ready for Pickup', variant: 'outline' as const, color: 'bg-blue-500' };
      case 'processing': return { label: language === 'ar' ? 'قيد المعالجة' : 'Processing', variant: 'secondary' as const, color: 'bg-orange-500' };
      default: return { label: status, variant: 'outline' as const, color: 'bg-gray-500' };
    }
  };

  const uniformSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const shoeSizes = ['28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];

  const getSizesForItem = (item: StoreItem) => {
    if (item.name.toLowerCase().includes('shoe')) return shoeSizes;
    return uniformSizes;
  };

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-none bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PageHeader />
      <div className="h-12" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} />
      <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'المتجر الخاص' : 'Private Store'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Store Info Card */}
      <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-200 dark:border-pink-900/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-pink-500/20 rounded-full">
              <Store className="h-6 w-6 text-pink-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-semibold text-lg">
                  {language === 'ar' ? 'المتجر الخاص' : 'Private Store'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'قرطاسية • كتب مدرسية • زي مدرسي'
                    : 'Stationery • Textbooks • School Uniforms'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {language === 'ar' ? '7:00 ص - 2:00 م' : '7:00 AM - 2:00 PM'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {language === 'ar' ? 'المبنى الرئيسي - الطابق الأرضي' : 'Main Building - Ground Floor'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  +968 2412 3456
                </span>
              </div>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'رصيد محفظتك' : 'Your Wallet Balance'}
              </p>
              <p className="text-xl font-bold text-pink-600">
                {parentWalletBalance.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
              <Check className="h-3 w-3 mr-1" />
              {language === 'ar' ? 'متجر معتمد' : 'Verified Store'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <div className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {language === 'ar' ? 'المنتجات' : 'Products'}
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
                  <span>{getCategoryIcon(category)}</span>
                  {getCategoryName(category)}
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {items.length} {language === 'ar' ? 'منتج' : 'items'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {items.map((item) => {
                  const qty = getCartQuantity(item.id);
                  const outOfStock = item.stock_quantity <= 0;
                  const needsSize = isUniformItem(item.category);
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        outOfStock ? 'bg-muted/50 opacity-60' : 'bg-accent/50 hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{item.icon || '📦'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {language === 'ar' ? item.name_ar || item.name : item.name}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-primary">
                              {Number(item.price).toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                            </p>
                            {needsSize && (
                              <Badge variant="outline" className="text-xs">
                                {language === 'ar' ? 'اختر المقاس' : 'Select Size'}
                              </Badge>
                            )}
                            {outOfStock && (
                              <Badge variant="destructive" className="text-xs">
                                {language === 'ar' ? 'نفذ المخزون' : 'Out of Stock'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!outOfStock && (
                          qty > 0 && !needsSize ? (
                            <div className="flex items-center gap-1 bg-primary/10 rounded-full px-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-bold w-5 text-center text-sm">{qty}</span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => addToCart(item)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant={qty > 0 ? "secondary" : "default"}
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {qty > 0 
                                ? (language === 'ar' ? `(${qty}) إضافة` : `Add (${qty})`)
                                : (language === 'ar' ? 'إضافة' : 'Add')}
                            </Button>
                          )
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

      {/* Order History */}
      {orders.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {language === 'ar' ? 'طلباتي' : 'My Orders'}
          </h2>
          
          {orders.map((order) => {
            const status = getStatusBadge(order.status);
            const itemCount = Array.isArray(order.items) 
              ? order.items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
              : 0;
            
            return (
              <Card key={order.id} className="overflow-hidden">
                <div className={`h-1 ${status.color}`} />
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold">
                          {Number(order.total_amount).toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                        </p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {itemCount} {language === 'ar' ? 'منتج' : 'items'} • {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </p>
                      {order.notes && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {order.notes}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Size Selection Dialog */}
      <Dialog open={!!showSizeDialog} onOpenChange={() => setShowSizeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{showSizeDialog?.icon}</span>
              {language === 'ar' ? 'اختر المقاس' : 'Select Size'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? showSizeDialog?.name_ar || showSizeDialog?.name
                : showSizeDialog?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-4">
            {showSizeDialog && getSizesForItem(showSizeDialog).map((size) => (
              <Button
                key={size}
                variant="outline"
                className="h-12"
                onClick={() => showSizeDialog && addToCart(showSizeDialog, size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md p-0 gap-0 max-h-[85vh] flex flex-col">
          {checkoutStep === 'cart' && (
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 pb-2 flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                </DialogTitle>
                <DialogDescription>
                  {cartItemCount} {language === 'ar' ? 'منتج' : 'items'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-3 py-2">
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${idx}`} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {language === 'ar' ? item.name_ar || item.name : item.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {Number(item.price).toFixed(3)} × {item.quantity}
                          </p>
                          {item.size && (
                            <Badge variant="outline" className="text-xs">{item.size}</Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-sm">
                        {(item.price * item.quantity).toFixed(3)}
                      </p>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-destructive flex-shrink-0"
                        onClick={() => removeItemCompletely(item.id, item.size)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 pt-2 border-t bg-background flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">{language === 'ar' ? 'المجموع' : 'Total'}</span>
                  <span className="text-xl font-bold">{cartTotal.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}</span>
                </div>
                <Button className="w-full" onClick={() => setCheckoutStep('details')}>
                  {language === 'ar' ? 'متابعة الطلب' : 'Continue to Order'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {checkoutStep === 'details' && (
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 pb-2 flex-shrink-0">
                <DialogTitle>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</DialogTitle>
                <DialogDescription>
                  {language === 'ar' ? 'اختر طريقة الاستلام' : 'Choose delivery method'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      {language === 'ar' ? 'طريقة الاستلام' : 'Delivery Method'}
                    </Label>
                    <div className="space-y-2">
                      <div 
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                        onClick={() => setDeliveryMethod('pickup')}
                      >
                        <div className={`w-4 h-4 mt-1 rounded-full border-2 flex items-center justify-center ${deliveryMethod === 'pickup' ? 'border-primary' : 'border-muted-foreground'}`}>
                          {deliveryMethod === 'pickup' && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {language === 'ar' ? 'استلام من المتجر' : 'Store Pickup'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'ar' 
                              ? 'استلم طلبك من المتجر الخاص'
                              : 'Pick up your order from the private store'}
                          </p>
                        </div>
                      </div>
                      <div 
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === 'classroom' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                        onClick={() => setDeliveryMethod('classroom')}
                      >
                        <div className={`w-4 h-4 mt-1 rounded-full border-2 flex items-center justify-center ${deliveryMethod === 'classroom' ? 'border-primary' : 'border-muted-foreground'}`}>
                          {deliveryMethod === 'classroom' && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {language === 'ar' ? 'توصيل للفصل' : 'Classroom Delivery'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'ar' 
                              ? `سيتم توصيل الطلب لـ ${student?.first_name} في فصله`
                              : `Order will be delivered to ${student?.first_name}'s classroom`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                      {language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                    </Label>
                    <Textarea 
                      id="notes"
                      placeholder={language === 'ar' ? 'أي ملاحظات خاصة بالطلب...' : 'Any special notes for your order...'}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>

                  <Card className="bg-accent/50">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {language === 'ar' ? 'وقت التجهيز المتوقع:' : 'Estimated preparation:'}
                        </span>
                        <span className="font-medium">
                          {language === 'ar' ? '1-2 أيام عمل' : '1-2 business days'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'ar' ? 'المنتجات' : 'Items'}</span>
                      <span>{cartTotal.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'ar' ? 'التوصيل' : 'Delivery'}</span>
                      <span className="text-green-600">{language === 'ar' ? 'مجاني' : 'Free'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                      <span>{cartTotal.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}</span>
                    </div>
                  </div>

                  {cartTotal > parentWalletBalance && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {language === 'ar' ? 'رصيد المحفظة غير كافي' : 'Insufficient wallet balance'}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 pt-2 border-t bg-background flex-shrink-0">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCheckoutStep('cart')} className="flex-shrink-0">
                    {language === 'ar' ? 'رجوع' : 'Back'}
                  </Button>
                  <Button 
                    onClick={handlePurchase} 
                    disabled={purchasing || cartTotal > parentWalletBalance}
                    className="flex-1"
                  >
                    {purchasing 
                      ? (language === 'ar' ? 'جاري الطلب...' : 'Placing Order...')
                      : (language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'confirmation' && (
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar' ? 'تم الطلب بنجاح!' : 'Order Placed Successfully!'}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {deliveryMethod === 'classroom'
                  ? (language === 'ar' 
                      ? `سيتم توصيل الطلب لـ ${student?.first_name} في فصله خلال 1-2 يوم`
                      : `Order will be delivered to ${student?.first_name}'s classroom within 1-2 days`)
                  : (language === 'ar'
                      ? 'سنقوم بإعلامك عندما يكون طلبك جاهزاً للاستلام من المتجر الخاص'
                      : 'We will notify you when your order is ready for pickup from the private store')}
              </p>
              <Card className="bg-accent/50 text-left mb-6">
                <CardContent className="py-4 space-y-2">
                  <p className="font-medium text-sm mb-2">{language === 'ar' ? 'معلومات الاستلام' : 'Pickup Information'}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{language === 'ar' ? 'المبنى الرئيسي - الطابق الأرضي' : 'Main Building - Ground Floor'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{language === 'ar' ? '7:00 ص - 2:00 م' : '7:00 AM - 2:00 PM'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>+968 2412 3456</span>
                  </div>
                </CardContent>
              </Card>
              <Button className="w-full" onClick={resetCheckout}>
                {language === 'ar' ? 'تم' : 'Done'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button */}
      {cart.length > 0 && !showCheckout && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50">
          <Card className="shadow-xl border-2 border-pink-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-pink-600" />
                    <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  </div>
                  <span className="font-medium">
                    {language === 'ar' ? 'سلة التسوق' : 'Cart'}
                  </span>
                </div>
                <span className="text-xl font-bold text-pink-600">
                  {cartTotal.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                </span>
              </div>
              <Button 
                className="w-full bg-pink-600 hover:bg-pink-700" 
                onClick={() => setShowCheckout(true)}
              >
                {language === 'ar' ? 'إتمام الطلب' : 'Checkout'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}