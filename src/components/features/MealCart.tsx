import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingCart, Trash2, CreditCard, Wallet, Plus, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  mealId: string;
  mealName: string;
  mealNameAr: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  studentName: string;
  quantity: number;
  price: number;
  servingTime: 'breakfast' | 'lunch';
}

interface MealCartProps {
  cartItems: CartItem[];
  onUpdateCart: (items: CartItem[]) => void;
  onCheckout: (paymentMethod: 'visa' | 'wallet') => void;
  walletBalance: number;
}

export default function MealCart({ cartItems, onUpdateCart, onCheckout, walletBalance }: MealCartProps) {
  const { language } = useLanguage();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'wallet'>('wallet');

  const daysOfWeek = [
    { value: 'monday', label: language === 'en' ? 'Monday' : 'الإثنين' },
    { value: 'tuesday', label: language === 'en' ? 'Tuesday' : 'الثلاثاء' },
    { value: 'wednesday', label: language === 'en' ? 'Wednesday' : 'الأربعاء' },
    { value: 'thursday', label: language === 'en' ? 'Thursday' : 'الخميس' },
    { value: 'friday', label: language === 'en' ? 'Friday' : 'الجمعة' },
    { value: 'saturday', label: language === 'en' ? 'Saturday' : 'السبت' },
    { value: 'sunday', label: language === 'en' ? 'Sunday' : 'الأحد' }
  ];

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleQuantityChange = (itemId: string, change: number) => {
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    onUpdateCart(updatedItems);
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    onUpdateCart(updatedItems);
    toast({
      title: language === 'en' ? 'Item Removed' : 'تم حذف العنصر',
      description: language === 'en' ? 'Item removed from cart' : 'تم حذف العنصر من السلة',
    });
  };

  const handleCheckout = () => {
    if (paymentMethod === 'wallet' && walletBalance < totalAmount) {
      toast({
        title: language === 'en' ? 'Insufficient Balance' : 'رصيد غير كافي',
        description: language === 'en' 
          ? 'Your wallet balance is insufficient for this purchase' 
          : 'رصيد محفظتك غير كافي لهذا الشراء',
        variant: 'destructive',
      });
      return;
    }

    onCheckout(paymentMethod);
    setIsCheckoutOpen(false);
    
    toast({
      title: language === 'en' ? 'Order Confirmed' : 'تم تأكيد الطلب',
      description: language === 'en' 
        ? `Payment of OMR ${totalAmount.toFixed(2)} processed via ${paymentMethod === 'visa' ? 'Visa' : 'Wallet'}` 
        : `تمت معالجة دفعة بقيمة ${totalAmount.toFixed(2)} ر.ع عبر ${paymentMethod === 'visa' ? 'فيزا' : 'المحفظة'}`,
    });
  };

  if (cartItems.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {language === 'en' ? 'Your cart is empty' : 'سلة التسوق فارغة'}
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {language === 'en' ? 'Shopping Cart' : 'سلة التسوق'}
            <Badge className="ml-auto">{cartItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map(item => {
            const dayLabel = daysOfWeek.find(d => d.value === item.dayOfWeek)?.label;
            
            return (
              <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">
                    {language === 'en' ? item.mealName : item.mealNameAr}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? `For: ${item.studentName}` : `لـ: ${item.studentName}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? `Every ${dayLabel}` : `كل ${dayLabel}`} • {item.servingTime === 'breakfast' ? '7-9 AM' : '12-2 PM'}
                  </p>
                  <p className="font-semibold text-primary mt-1">
                    OMR {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 min-w-[40px] text-center">{item.quantity}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>{language === 'en' ? 'Total:' : 'المجموع:'}</span>
              <span className="text-primary">OMR {totalAmount.toFixed(2)}</span>
            </div>
            <Button 
              className="w-full mt-4" 
              size="lg"
              onClick={() => setIsCheckoutOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Proceed to Checkout' : 'المتابعة للدفع'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Select Payment Method' : 'اختر طريقة الدفع'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Total Amount:' : 'المبلغ الإجمالي:'}
                </span>
                <span className="font-semibold">OMR {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Items:' : 'العناصر:'}
                </span>
                <span>{cartItems.length}</span>
              </div>
            </div>

            <RadioGroup value={paymentMethod} onValueChange={(value: 'visa' | 'wallet') => setPaymentMethod(value)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>{language === 'en' ? 'Wallet' : 'المحفظة'}</span>
                    <Badge variant="outline" className="ml-auto">
                      OMR {walletBalance.toFixed(2)}
                    </Badge>
                  </div>
                  {walletBalance < totalAmount && (
                    <p className="text-xs text-destructive mt-1">
                      {language === 'en' ? 'Insufficient balance' : 'رصيد غير كافي'}
                    </p>
                  )}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="visa" id="visa" />
                <Label htmlFor="visa" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>{language === 'en' ? 'Visa Card' : 'بطاقة فيزا'}</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={paymentMethod === 'wallet' && walletBalance < totalAmount}
            >
              {language === 'en' ? 'Confirm Payment' : 'تأكيد الدفع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}