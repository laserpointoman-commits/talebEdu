import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Scan, 
  CreditCard, 
  Banknote,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { nfcService } from '@/services/nfcService';
import CanteenManagement from '@/components/features/CanteenManagement';
import CanteenReports from '@/components/features/CanteenReports';

interface CanteenItem {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  category: string;
  available: boolean;
  icon: string;
}

interface CartItem extends CanteenItem {
  quantity: number;
}

interface Student {
  id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  first_name_ar: string;
  last_name_ar: string;
  nfc_id: string;
  wallet_balance: number;
  restrictions: {
    allowed_items: string[];
    daily_limit: number | null;
  } | null;
}

export default function CanteenDashboard() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('pos');
  const [items, setItems] = useState<CanteenItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadCategories();
    loadItems();
    loadRecentOrders();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('canteen_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    setCategories(data || []);
  };

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('canteen_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true });

    if (error) {
      toast.error(language === 'ar' ? 'فشل تحميل العناصر' : language === 'hi' ? 'आइटम लोड करने में विफल' : 'Failed to load items');
      return;
    }

    setItems(data || []);
  };

  const loadRecentOrders = async () => {
    const { data } = await supabase
      .from('canteen_orders')
      .select('*, students(full_name, full_name_ar)')
      .order('created_at', { ascending: false })
      .limit(10);

    setRecentOrders(data || []);
  };

  const handleNFCScan = async () => {
    setIsScanning(true);
    try {
      const nfcData = await nfcService.readTag();
      if (nfcData) {
        await loadStudentByNFC(nfcData.id);
      }
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل مسح NFC' : language === 'hi' ? 'NFC स्कैन विफल' : 'NFC scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const loadStudentByNFC = async (nfcId: string) => {
    const { data: studentData, error } = await supabase
      .from('students')
      .select(`
        id,
        profile_id,
        first_name,
        last_name,
        first_name_ar,
        last_name_ar,
        nfc_id
      `)
      .eq('nfc_id', nfcId)
      .single();

    if (error || !studentData) {
      toast.error(language === 'ar' ? 'الطالب غير موجود' : language === 'hi' ? 'छात्र नहीं मिला' : 'Student not found');
      return;
    }

    // Get wallet balance
    const { data: walletData } = await supabase
      .from('wallet_balances')
      .select('balance')
      .eq('user_id', studentData.profile_id)
      .single();

    // Get restrictions
    const { data: restrictionsData } = await supabase
      .from('canteen_restrictions')
      .select('allowed_items, daily_limit')
      .eq('student_id', studentData.id)
      .single();

    setStudent({
      ...studentData,
      wallet_balance: walletData?.balance || 0,
      restrictions: restrictionsData
    });

    setCart([]);
    const fullName = language === 'ar'
      ? `${studentData.first_name_ar || studentData.first_name} ${studentData.last_name_ar || studentData.last_name}`
      : `${studentData.first_name} ${studentData.last_name}`;
    
    toast.success(
      language === 'ar' 
        ? `مرحباً ${fullName}!` 
        : language === 'hi'
        ? `स्वागत है ${fullName}!`
        : `Welcome ${fullName}!`
    );
  };

  const addToCart = (item: CanteenItem) => {
    if (student?.restrictions?.allowed_items && 
        student.restrictions.allowed_items.length > 0 &&
        !student.restrictions.allowed_items.includes(item.id)) {
      toast.error(
        language === 'ar' 
          ? 'هذا العنصر محظور من قبل ولي الأمر' 
          : language === 'hi'
          ? 'यह आइटम अभिभावक द्वारा प्रतिबंधित है'
          : 'This item is restricted by parent'
      );
      return;
    }

    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(c => c.id === itemId ? { ...c, quantity } : c));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const processPayment = async (method: 'cash' | 'wallet') => {
    const total = getTotalAmount();

    if (method === 'wallet') {
      if (!student) {
        toast.error(language === 'ar' ? 'لم يتم اختيار طالب' : language === 'hi' ? 'कोई छात्र नहीं चुना गया' : 'No student selected');
        return;
      }

      if (student.restrictions?.daily_limit && total > student.restrictions.daily_limit) {
        toast.error(
          language === 'ar' 
            ? 'المبلغ يتجاوز الحد اليومي' 
            : language === 'hi'
            ? 'राशि दैनिक सीमा से अधिक है'
            : 'Amount exceeds daily limit'
        );
        return;
      }

      if (student.wallet_balance < total) {
        toast.error(
          language === 'ar' 
            ? 'رصيد المحفظة غير كافٍ' 
            : language === 'hi'
            ? 'वॉलेट बैलेंस अपर्याप्त'
            : 'Insufficient wallet balance'
        );
        return;
      }

      // Deduct from wallet
      const { data: walletData } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', student.profile_id)
        .single();

      const { error: walletError } = await supabase
        .from('wallet_balances')
        .update({ balance: (walletData?.balance || 0) - total })
        .eq('user_id', student.profile_id);

      if (walletError) {
        toast.error(language === 'ar' ? 'فشلت العملية' : language === 'hi' ? 'भुगतान विफल' : 'Payment failed');
        return;
      }

      // Create transaction
      const { data: transactionData } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: student.profile_id,
          type: 'payment',
          amount: total,
          balance_after: (walletData?.balance || 0) - total,
          description: 'Canteen purchase',
          description_ar: 'شراء من المقصف'
        })
        .select()
        .single();

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Create order
      const { error: orderError } = await supabase
        .from('canteen_orders')
        .insert({
          student_id: student.id,
          items: cart.map(c => ({
            item_id: c.id,
            name: c.name,
            price: c.price,
            quantity: c.quantity
          })),
          total_amount: total,
          payment_method: method,
          transaction_id: transactionData?.id,
          served_by: currentUser?.id
        });

      if (orderError) {
        toast.error(language === 'ar' ? 'فشل إنشاء الطلب' : language === 'hi' ? 'ऑर्डर बनाने में विफल' : 'Failed to create order');
        return;
      }
    } else {
      // Cash payment - just create order
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { error: orderError } = await supabase
        .from('canteen_orders')
        .insert({
          student_id: student?.id || null,
          items: cart.map(c => ({
            item_id: c.id,
            name: c.name,
            price: c.price,
            quantity: c.quantity
          })),
          total_amount: total,
          payment_method: method,
          served_by: currentUser?.id
        });

      if (orderError) {
        toast.error(language === 'ar' ? 'فشل إنشاء الطلب' : language === 'hi' ? 'ऑर्डर बनाने में विफल' : 'Failed to create order');
        return;
      }
    }

    toast.success(
      language === 'ar' 
        ? 'تمت العملية بنجاح!' 
        : language === 'hi'
        ? 'भुगतान सफल!'
        : 'Payment successful!'
    );

    // Reset
    setCart([]);
    setStudent(null);
    loadRecentOrders();
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name_ar?.includes(searchQuery)
  );

  const groupedItems = categories.reduce((acc, category) => {
    const categoryItems = filteredItems.filter(item => item.category === category.name);
    if (categoryItems.length > 0) {
      acc[category.name] = {
        items: categoryItems,
        icon: category.icon,
        name_ar: category.name_ar
      };
    }
    return acc;
  }, {} as Record<string, { items: CanteenItem[], icon: string, name_ar: string | null }>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {language === 'ar' ? 'نظام المقصف' : language === 'hi' ? 'कैंटीन सिस्टम' : 'Canteen System'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'إدارة نقطة البيع الكاملة' : language === 'hi' ? 'संपूर्ण पॉइंट ऑफ सेल प्रबंधन' : 'Complete point of sale management'}
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Card className="border-2">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b h-14">
                <TabsTrigger value="pos" className="gap-2 data-[state=active]:bg-primary/10">
                  <LayoutDashboard className="h-4 w-4" />
                  {language === 'ar' ? 'نقطة البيع' : language === 'hi' ? 'पॉइंट ऑफ सेल' : 'Point of Sale'}
                </TabsTrigger>
                <TabsTrigger value="inventory" className="gap-2 data-[state=active]:bg-primary/10">
                  <Package className="h-4 w-4" />
                  {language === 'ar' ? 'المخزون' : language === 'hi' ? 'इन्वेंटरी' : 'Inventory'}
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-primary/10">
                  <TrendingUp className="h-4 w-4" />
                  {language === 'ar' ? 'التقارير' : language === 'hi' ? 'रिपोर्ट' : 'Reports'}
                </TabsTrigger>
              </TabsList>

              {/* POS Tab */}
              <TabsContent value="pos" className="p-6 mt-0">
                <div className="space-y-6">
                  {/* NFC Scan Button */}
                  <div className="flex justify-end">
                    <Button 
                      size="lg"
                      onClick={handleNFCScan}
                      disabled={isScanning}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <Scan className="mr-2 h-5 w-5" />
                      {isScanning 
                        ? (language === 'ar' ? 'جاري المسح...' : language === 'hi' ? 'स्कैनिंग...' : 'Scanning...')
                        : (language === 'ar' ? 'مسح NFC' : language === 'hi' ? 'NFC स्कैन करें' : 'Scan NFC')
                      }
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث عن عنصر...' : language === 'hi' ? 'आइटम खोजें...' : 'Search items...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items Grid */}
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([categoryName, categoryData]: [string, { items: CanteenItem[], icon: string, name_ar: string | null }]) => (
                <Card key={categoryName}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>{categoryData.icon}</span>
                      <span>{language === 'ar' ? categoryData.name_ar || categoryName : categoryName}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categoryData.items.map(item => {
                        const isRestricted = student?.restrictions?.allowed_items && 
                          student.restrictions.allowed_items.length > 0 &&
                          !student.restrictions.allowed_items.includes(item.id);

                        return (
                          <Button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            disabled={isRestricted}
                            className={`h-auto flex flex-col items-center p-4 ${
                              isRestricted ? 'opacity-50' : ''
                            }`}
                            variant="outline"
                          >
                            <div className="text-3xl mb-2">{item.icon || '🍽️'}</div>
                            <div className="font-semibold text-sm text-center">
                              {language === 'ar' ? item.name_ar || item.name : item.name}
                            </div>
                            <div className="text-primary font-bold mt-1">
                              {item.price.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                            </div>
                            {isRestricted && (
                              <Badge variant="destructive" className="mt-2 text-xs">
                                {language === 'ar' ? 'محظور' : language === 'hi' ? 'प्रतिबंधित' : 'Restricted'}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-4">
            {/* Student Info */}
            {student && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'الطالب' : language === 'hi' ? 'छात्र' : 'Student'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-semibold">
                      {language === 'ar' 
                        ? `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`
                        : `${student.first_name} ${student.last_name}`
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">{student.nfc_id}</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'الرصيد:' : language === 'hi' ? 'शेष:' : 'Balance:'}</span>
                    <span className="font-bold text-primary">
                      {student.wallet_balance.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                    </span>
                  </div>
                  {student.restrictions?.daily_limit && (
                    <div className="flex justify-between text-sm">
                      <span>{language === 'ar' ? 'الحد اليومي:' : language === 'hi' ? 'दैनिक सीमा:' : 'Daily Limit:'}</span>
                      <span className="font-bold">
                        {student.restrictions.daily_limit.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {language === 'en' ? 'Cart' : 'السلة'}
                  </span>
                  <Badge>{cart.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {language === 'en' ? 'Cart is empty' : 'السلة فارغة'}
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {language === 'en' ? item.name : item.name_ar || item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.price.toFixed(3)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 space-y-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>{language === 'en' ? 'Total:' : 'المجموع:'}</span>
                        <span className="text-primary">
                          {getTotalAmount().toFixed(3)} {language === 'en' ? 'OMR' : 'ر.ع'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => processPayment('wallet')}
                          disabled={!student}
                          className="bg-gradient-to-r from-primary to-primary/80"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {language === 'en' ? 'Wallet' : 'محفظة'}
                        </Button>
                        <Button
                          onClick={() => processPayment('cash')}
                          variant="outline"
                        >
                          <Banknote className="mr-2 h-4 w-4" />
                          {language === 'en' ? 'Cash' : 'نقدي'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {language === 'en' ? 'Recent Orders' : 'الطلبات الأخيرة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">
                          {order.students?.[language === 'en' ? 'full_name' : 'full_name_ar'] || 'Guest'}
                        </p>
                        <p className="text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-SA')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{order.total_amount.toFixed(3)}</p>
                        <Badge variant={order.payment_method === 'wallet' ? 'default' : 'secondary'}>
                          {order.payment_method}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
                  </div>
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="p-6 mt-0">
                <CanteenManagement />
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="p-6 mt-0">
                <CanteenReports />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}