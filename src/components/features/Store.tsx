import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAsyncLoading } from '@/hooks/use-async-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Plus, Minus, X, Wallet, Package, CheckCircle2 } from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface Product {
  id: string;
  name: string;
  name_ar: string | null;
  category: 'textbooks' | 'uniforms' | 'supplies';
  price: number;
  image: string | null;
  description: string | null;
  description_ar: string | null;
  sizes: string[] | null;
  in_stock: boolean;
  stock_quantity: number;
}

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

export default function Store() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { executeAsync } = useAsyncLoading('store-data');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'textbooks' | 'uniforms' | 'supplies'>('all');
  const [walletBalance, setWalletBalance] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    executeAsync(async () => {
      await fetchProducts();
      if (user) {
        await fetchWalletBalance();
      }
    });
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
    } catch (error: any) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product: Product, size?: string) => {
    if (product.sizes && !size) {
      toast({
        title: language === 'ar' ? 'يرجى اختيار المقاس' : 'Please select a size',
        variant: 'destructive'
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && item.selectedSize === size
      );
      
      if (existing) {
        return prev.map(item => 
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });

    toast({
      title: language === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to cart',
    });
  };

  const updateQuantity = (id: string, size: string | undefined, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedSize === size) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string, size?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === id && item.selectedSize === size)
    ));
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required',
        description: language === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please login to continue',
        variant: 'destructive'
      });
      return;
    }
    setIsCheckoutOpen(true);
  };

  const processPayment = async () => {
    if (!user) return;

    if (paymentMethod === 'wallet' && walletBalance < subtotal) {
      toast({
        title: language === 'ar' ? 'رصيد غير كافٍ' : 'Insufficient Balance',
        description: language === 'ar' 
          ? 'رصيد المحفظة غير كافٍ لإتمام الشراء'
          : 'Wallet balance is insufficient for this purchase',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            name_ar: item.name_ar,
            quantity: item.quantity,
            price: item.price,
            selectedSize: item.selectedSize
          })),
          total_amount: subtotal,
          payment_method: paymentMethod,
          status: 'completed'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Update wallet if payment method is wallet
      if (paymentMethod === 'wallet') {
        const { error: walletError } = await supabase
          .from('wallet_balances')
          .update({ balance: walletBalance - subtotal })
          .eq('user_id', user.id);

        if (walletError) throw walletError;

        // Record transaction
        await supabase
          .from('wallet_transactions')
          .insert([{
            user_id: user.id,
            amount: -subtotal,
            type: 'purchase',
            description: language === 'ar' ? 'شراء من المتجر' : 'Store Purchase',
            description_ar: 'شراء من المتجر',
            balance_after: walletBalance - subtotal
          }]);

        setWalletBalance(walletBalance - subtotal);
      }

      toast({
        title: language === 'ar' ? 'تم تأكيد الطلب' : 'Order Confirmed',
        description: language === 'ar' 
          ? 'سيتم استلام الطلب عند الوصول للمدرسة' 
          : 'Order will be collected at school arrival',
      });

      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {language === 'ar' ? 'المتجر المدرسي' : 'School Store'}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <Badge variant="destructive" className="px-1.5">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsList className={`grid w-full grid-cols-4 mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <TabsTrigger value="all">
                {language === 'ar' ? 'الكل' : 'All'}
              </TabsTrigger>
              <TabsTrigger value="textbooks">
                {language === 'ar' ? 'الكتب' : 'Textbooks'}
              </TabsTrigger>
              <TabsTrigger value="uniforms">
                {language === 'ar' ? 'الزي' : 'Uniforms'}
              </TabsTrigger>
              <TabsTrigger value="supplies">
                {language === 'ar' ? 'اللوازم' : 'Supplies'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedCategory}>
              {loading ? (
                <div className="flex justify-center py-12">
                  <LogoLoader />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد منتجات متاحة' : 'No products available'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square relative bg-gradient-to-br from-accent/20 to-accent/5">
                        <img 
                          src={product.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400'} 
                          alt={language === 'ar' ? product.name_ar || product.name : product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">
                          {language === 'ar' ? product.name_ar || product.name : product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {language === 'ar' ? product.description_ar || product.description : product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-primary">
                            <span className="number-display">{language === 'ar' ? `${Number(product.price).toFixed(2)} ر.ع` : `OMR ${Number(product.price).toFixed(2)}`}</span>
                          </span>
                          <ProductAddButton 
                            product={product} 
                            onAdd={addToCart}
                            language={language}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'السلة فارغة' : 'Cart is empty'}
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3 p-4 bg-accent/5 rounded-lg">
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400'} 
                    alt={language === 'ar' ? item.name_ar || item.name : item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {language === 'ar' ? item.name_ar || item.name : item.name}
                    </h4>
                    {item.selectedSize && (
                      <Badge variant="secondary" className="mt-1">
                        {language === 'ar' ? 'المقاس' : 'Size'}: {item.selectedSize}
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.selectedSize, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.selectedSize, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="ml-auto font-bold text-primary">
                        {language === 'ar'
                          ? <span className="number-display">{(Number(item.price) * item.quantity).toFixed(2)} ر.ع</span>
                          : <span className="number-display">OMR {(Number(item.price) * item.quantity).toFixed(2)}</span>}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeFromCart(item.id, item.selectedSize)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
                  <span className="text-primary">
                    {language === 'ar' 
                      ? `${subtotal.toFixed(2)} ر.ع`
                      : `OMR ${subtotal.toFixed(2)}`}
                  </span>
                </div>
                <Button onClick={handleCheckout} className="w-full" size="lg">
                  {language === 'ar' ? 'إتمام الشراء' : 'Proceed to Checkout'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {language === 'ar' ? 'إتمام الشراء' : 'Checkout'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Wallet Balance */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {language === 'ar' ? 'رصيد المحفظة' : 'Wallet Balance'}
                  </span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {language === 'ar' ? `${walletBalance.toFixed(2)} ر.ع` : `OMR ${walletBalance.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg mb-2 hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wallet className="h-4 w-4" />
                    {language === 'ar' ? 'المحفظة' : 'Wallet'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Order Summary */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </Label>
              <div className="space-y-2 p-4 bg-accent/5 rounded-lg">
                {cart.map(item => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex justify-between text-sm">
                    <span>
                      {language === 'ar' ? item.name_ar || item.name : item.name} x{item.quantity}
                      {item.selectedSize && ` (${item.selectedSize})`}
                    </span>
                    <span className="font-medium">
                      {language === 'ar' 
                        ? `${(Number(item.price) * item.quantity).toFixed(2)} ر.ع`
                        : `OMR ${(Number(item.price) * item.quantity).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
              <span className="text-primary text-2xl">
                {language === 'ar' 
                  ? `${subtotal.toFixed(2)} ر.ع`
                  : `OMR ${subtotal.toFixed(2)}`}
              </span>
            </div>

            {/* Warning for insufficient balance */}
            {paymentMethod === 'wallet' && walletBalance < subtotal && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center">
                  {language === 'ar' 
                    ? 'رصيد المحفظة غير كافٍ. يرجى إضافة رصيد للمتابعة.'
                    : 'Insufficient wallet balance. Please add funds to continue.'}
                </p>
              </div>
            )}

            <Button 
              onClick={processPayment} 
              className="w-full" 
              size="lg"
              disabled={processing || (paymentMethod === 'wallet' && walletBalance < subtotal)}
            >
              {processing ? (
                <div className="flex items-center">
                  <div className="mr-2">
                    <LogoLoader size="small" text={false} />
                  </div>
                  {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </div>
              ) : (
                language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProductAddButton({ 
  product, 
  onAdd, 
  language 
}: { 
  product: Product; 
  onAdd: (product: Product, size?: string) => void;
  language: string;
}) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showSizeDialog, setShowSizeDialog] = useState(false);

  const handleAdd = () => {
    if (product.sizes && product.sizes.length > 0) {
      setShowSizeDialog(true);
    } else {
      onAdd(product);
    }
  };

  const confirmAdd = () => {
    if (selectedSize) {
      onAdd(product, selectedSize);
      setShowSizeDialog(false);
      setSelectedSize('');
    }
  };

  return (
    <>
      <Button 
        size="sm" 
        disabled={!product.in_stock}
        onClick={handleAdd}
        className="gap-1"
      >
        <Plus className="h-4 w-4" />
        {language === 'ar' ? 'إضافة' : 'Add'}
      </Button>

      <Dialog open={showSizeDialog} onOpenChange={setShowSizeDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'اختر المقاس' : 'Select Size'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
              <div className="grid grid-cols-2 gap-2">
                {product.sizes?.map(size => (
                  <div key={size} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                    <RadioGroupItem value={size} id={size} />
                    <Label htmlFor={size} className="cursor-pointer flex-1 text-center font-medium">
                      {size}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Button 
              onClick={confirmAdd} 
              className="w-full"
              disabled={!selectedSize}
            >
              {language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
