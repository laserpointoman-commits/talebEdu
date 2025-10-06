import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NFCScanner from "@/components/nfc/NFCScanner";
import { ShoppingCart, Wallet, Plus, Minus, CreditCard } from "lucide-react";
import LogoLoader from "@/components/LogoLoader";

export default function CafeteriaPayment() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('canteen_items')
        .select('*')
        .eq('available', true);

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (student: any) => {
    setScannedStudent(student);
    
    // Get student wallet balance
    const { data: wallet } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', student.id)
      .single();

    setScannedStudent({ ...student, wallet_balance: wallet?.balance || 0 });
  };

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalAmount = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = items.find(i => i.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const handleCheckout = async () => {
    if (!scannedStudent) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء مسح سوار الطالب أولاً' : 'Please scan student wristband first',
        variant: "destructive"
      });
      return;
    }

    const totalAmount = getTotalAmount();
    
    if (scannedStudent.wallet_balance < totalAmount) {
      toast({
        title: language === 'ar' ? 'رصيد غير كافٍ' : 'Insufficient Balance',
        description: language === 'ar' 
          ? `الرصيد الحالي: ${scannedStudent.wallet_balance.toFixed(2)} ريال`
          : `Current balance: ${scannedStudent.wallet_balance.toFixed(2)} OMR`,
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      // Process purchase - record in wallet transactions
      const purchaseItems = Object.entries(cart).map(([itemId, quantity]) => {
        const item = items.find(i => i.id === itemId);
        return { item_id: itemId, name: item?.name, quantity, price: item?.price };
      });

      // Deduct from wallet
      await supabase
        .from('wallet_balances')
        .update({ 
          balance: scannedStudent.wallet_balance - totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', scannedStudent.id);

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_id: scannedStudent.id,
        type: 'payment',
        amount: totalAmount,
        balance_after: scannedStudent.wallet_balance - totalAmount,
        description: 'Cafeteria purchase',
        description_ar: 'شراء من المقصف'
      });

      toast({
        title: language === 'ar' ? 'تمت العملية بنجاح' : 'Purchase Successful',
        description: language === 'ar' 
          ? `تم خصم ${totalAmount.toFixed(2)} ريال`
          : `${totalAmount.toFixed(2)} OMR deducted`,
      });

      // Reset
      setCart({});
      setScannedStudent(null);

    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ في الدفع' : 'Payment Error',
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  const totalAmount = getTotalAmount();
  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'ar' ? 'المقصف المدرسي' : 'School Cafeteria'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'نظام دفع ذكي بدون نقود' : 'Cashless payment system'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NFC Scanner & Cart */}
        <div className="lg:col-span-1 space-y-6">
          <NFCScanner
            scanType="cafeteria"
            location="School Cafeteria"
            onScanSuccess={handleScanSuccess}
          />

          {scannedStudent && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'الطالب' : 'Student'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">
                  {scannedStudent.first_name} {scannedStudent.last_name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'الرصيد' : 'Balance'}
                  </span>
                  <Badge className="text-base">
                    {scannedStudent.wallet_balance.toFixed(2)} OMR
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cart Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {language === 'ar' ? 'السلة' : 'Cart'}
                {cartItemsCount > 0 && (
                  <Badge variant="secondary">{cartItemsCount}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(cart).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {language === 'ar' ? 'السلة فارغة' : 'Cart is empty'}
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {Object.entries(cart).map(([itemId, quantity]) => {
                      const item = items.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={itemId} className="flex items-center justify-between text-sm">
                          <span>{language === 'ar' ? item.name_ar : item.name}</span>
                          <span className="font-medium">
                            {quantity} x {item.price.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between font-bold text-lg">
                      <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                      <span>{totalAmount.toFixed(2)} OMR</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    disabled={!scannedStudent || processing}
                    className="w-full h-12"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {processing 
                      ? (language === 'ar' ? 'جاري الدفع...' : 'Processing...') 
                      : (language === 'ar' ? 'ادفع الآن' : 'Pay Now')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {language === 'ar' ? item.name_ar : item.name}
                      </CardTitle>
                      <CardDescription>{item.category}</CardDescription>
                    </div>
                    <Badge className="text-base">
                      {item.price.toFixed(2)} OMR
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {cart[item.id] ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-lg w-8 text-center">
                          {cart[item.id]}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(item.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge variant="secondary">
                        {(item.price * cart[item.id]).toFixed(2)} OMR
                      </Badge>
                    </div>
                  ) : (
                    <Button
                      onClick={() => addToCart(item.id)}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}