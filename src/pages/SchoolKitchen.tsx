import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChefHat, 
  Calendar,
  Calendar as CalendarIcon, 
  Clock,
  Utensils, 
  Flame,
  Wheat,
  Sandwich,
  Pizza,
  Soup,
  Apple,
  Coffee,
  Fish,
  MessageSquare,
  DollarSign,
  AlertCircle,
  ShoppingCart
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import KitchenManagement from '@/components/features/KitchenManagement';
import MealCart, { CartItem } from '@/components/features/MealCart';
import { supabase } from '@/integrations/supabase/client';

interface SchoolMeal {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: 'breakfast' | 'lunch' | 'snack';
  serving_time: 'breakfast' | 'lunch';
  price: number;
  calories: number;
  ingredients: string[] | null;
  allergens: string[] | null;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
  available_days: string[] | null;
  max_orders: number;
  icon: string;
}

interface ParentMealOrder {
  id: string;
  mealId: string;
  dayOfWeek: string;
  studentName: string;
  specialNotes: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered';
  orderedAt: Date;
  startDate?: string;
  endDate?: string;
}

const mealIcons: Record<string, any> = {
  sandwich: Sandwich,
  pizza: Pizza,
  soup: Soup,
  apple: Apple,
  coffee: Coffee,
  fish: Fish,
  wheat: Wheat,
  utensils: Utensils
};

export default function SchoolKitchen() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const [schoolMeals, setSchoolMeals] = useState<SchoolMeal[]>([]);
  const [parentOrders, setParentOrders] = useState<ParentMealOrder[]>([]);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>('monday');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<SchoolMeal | null>(null);
  const [specialNotes, setSpecialNotes] = useState('');
  const [studentName, setStudentName] = useState('');

  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;
  const [activeTab, setActiveTab] = useState('menu');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load meals from database
  useEffect(() => {
    fetchMeals();
    fetchOrders();
    fetchWalletBalance();

    // Setup realtime subscriptions
    const mealsChannel = supabase
      .channel('meals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals'
        },
        () => {
          fetchMeals();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(mealsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [profile?.id]);

  const fetchWalletBalance = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setWalletBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchoolMeals((data || []) as SchoolMeal[]);
    } catch (error: any) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('meal_orders')
        .select(`
          *,
          meal:meals(*)
        `)
        .eq('parent_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const mappedOrders = data.map(order => ({
          id: order.id,
          mealId: order.meal_id,
          dayOfWeek: '',
          studentName: '',
          specialNotes: order.special_instructions || '',
          status: order.status as 'pending' | 'confirmed' | 'preparing' | 'delivered',
          orderedAt: new Date(order.created_at),
          startDate: order.order_date
        }));
        setParentOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Get days of the week with translations
  const daysOfWeek = [
    { value: 'monday', label: language === 'en' ? 'Monday' : 'الإثنين' },
    { value: 'tuesday', label: language === 'en' ? 'Tuesday' : 'الثلاثاء' },
    { value: 'wednesday', label: language === 'en' ? 'Wednesday' : 'الأربعاء' },
    { value: 'thursday', label: language === 'en' ? 'Thursday' : 'الخميس' },
    { value: 'friday', label: language === 'en' ? 'Friday' : 'الجمعة' },
    { value: 'saturday', label: language === 'en' ? 'Saturday' : 'السبت' },
    { value: 'sunday', label: language === 'en' ? 'Sunday' : 'الأحد' }
  ];

  // Filter meals available for the selected day
  const availableMeals = schoolMeals.filter(meal => 
    meal.available_days?.includes(selectedDayOfWeek)
  );

  // Get orders for the parent
  const myOrders = parentOrders.filter(order => {
    return true;
  });

  const scheduledOrders = myOrders.filter(order => order.status === 'confirmed');
  const pendingOrders = myOrders.filter(order => order.status === 'pending');

  const handleAddToCart = () => {
    if (!selectedMeal || !studentName.trim()) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' 
          ? 'Please select a meal and enter student name' 
          : 'الرجاء اختيار وجبة وإدخال اسم الطالب',
        variant: 'destructive',
      });
      return;
    }

    const newCartItem: CartItem = {
      id: Date.now().toString(),
      mealId: selectedMeal.id,
      mealName: selectedMeal.name,
      mealNameAr: selectedMeal.name_ar || selectedMeal.name,
      dayOfWeek: selectedDayOfWeek as any,
      studentName,
      quantity: 1,
      price: selectedMeal.price,
      servingTime: selectedMeal.serving_time
    };

    setCartItems([...cartItems, newCartItem]);
    
    toast({
      title: language === 'en' ? 'Added to Cart' : 'تمت الإضافة إلى السلة',
      description: language === 'en' 
        ? `${selectedMeal.name} added to cart for ${studentName}`
        : `تمت إضافة ${selectedMeal.name_ar} إلى السلة لـ ${studentName}`,
    });

    setIsOrderDialogOpen(false);
    setSelectedMeal(null);
    setSpecialNotes('');
    setStudentName('');
  };

  const handleCheckout = async (paymentMethod: 'visa' | 'wallet') => {
    if (!profile?.id) return;
    
    try {
      // Create orders in database
      for (const item of cartItems) {
        const { error } = await supabase
          .from('meal_orders')
          .insert({
            parent_id: profile.id,
            student_id: null, // You may want to link to actual student
            meal_id: item.mealId,
            order_date: format(new Date(), 'yyyy-MM-dd'),
            serving_time: item.servingTime,
            quantity: item.quantity,
            status: 'confirmed',
            special_instructions: item.studentName, // Storing student name temporarily
            total_amount: item.price * item.quantity
          });

        if (error) throw error;
      }

      if (paymentMethod === 'wallet') {
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setWalletBalance(prev => prev - totalAmount);
      }

      setCartItems([]);
      await fetchOrders(); // Refresh orders list
      
      toast({
        title: language === 'en' ? 'Order Confirmed' : 'تم تأكيد الطلب',
        description: language === 'en' 
          ? 'Your meal orders have been confirmed'
          : 'تم تأكيد طلبات الوجبات الخاصة بك',
      });
    } catch (error) {
      console.error('Error creating orders:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' 
          ? 'Failed to confirm orders'
          : 'فشل في تأكيد الطلبات',
        variant: 'destructive',
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('meal_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      await fetchOrders(); // Refresh orders list
      
      toast({
        title: language === 'en' ? 'Order Cancelled' : 'تم إلغاء الطلب',
        description: language === 'en' 
          ? 'The meal order has been cancelled'
          : 'تم إلغاء طلب الوجبة',
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' 
          ? 'Failed to cancel order'
          : 'فشل في إلغاء الطلب',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'preparing': return 'bg-primary/10 text-primary';
      case 'delivered': return 'bg-muted-foreground/10 text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  // Show Kitchen Management for admin
  if (effectiveRole === 'admin') {
    return <KitchenManagement />;
  }

  // Only show read-only view for parent and student
  if (effectiveRole !== 'parent' && effectiveRole !== 'student') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="p-8 text-center">
          <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'en' ? 'Access Restricted' : 'الوصول مقيد'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'This section is available for parents and students only'
              : 'هذا القسم متاح للآباء والطلاب فقط'}
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <LogoLoader fullScreen={true} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ChefHat className="h-8 w-8" />
            {language === 'en' ? 'School Kitchen' : 'مطبخ المدرسة'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {language === 'en' 
              ? 'View meals and weekly menu from our school kitchen'
              : 'عرض الوجبات والقائمة الأسبوعية من مطبخ المدرسة'}
          </p>
        </div>
      </div>

      {/* Day of Week Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="min-w-fit">
              {language === 'en' ? 'View menu for:' : 'عرض القائمة لـ:'}
            </Label>
            <Select 
              value={selectedDayOfWeek}
              onValueChange={(value: any) => setSelectedDayOfWeek(value)}
            >
              <SelectTrigger className="flex-1 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map(day => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {availableMeals.length > 0 
                ? `${availableMeals.length} ${language === 'en' ? 'meals available' : 'وجبات متاحة'}`
                : language === 'en' ? 'No meals available' : 'لا توجد وجبات متاحة'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Meals - Read Only View */}
      {availableMeals.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            {language === 'en' ? 'Available Meals' : 'الوجبات المتاحة'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {availableMeals.map(meal => {
              const MealIcon = mealIcons[meal.icon] || Utensils;
              return (
                <Card key={meal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <MealIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {language === 'en' ? meal.name : meal.name_ar}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {language === 'en' ? meal.description : meal.description_ar}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {meal.serving_time === 'breakfast' 
                              ? (language === 'en' ? 'Breakfast (7-9 AM)' : 'فطور (7-9 ص)')
                              : (language === 'en' ? 'Lunch (12-2 PM)' : 'غداء (12-2 م)')
                            }
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {meal.calories} cal
                          </span>
                          <span className="font-semibold text-primary">
                            OMR {meal.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {meal.is_vegetarian && (
                            <Badge variant="outline" className="text-xs">
                              {language === 'en' ? 'Vegetarian' : 'نباتي'}
                            </Badge>
                          )}
                          {meal.is_gluten_free && (
                            <Badge variant="outline" className="text-xs">
                              {language === 'en' ? 'Gluten-Free' : 'خالي من الغلوتين'}
                            </Badge>
                          )}
                          {meal.is_dairy_free && (
                            <Badge variant="outline" className="text-xs">
                              {language === 'en' ? 'Dairy-Free' : 'خالي من الألبان'}
                            </Badge>
                          )}
                        </div>
                        {meal.allergens && meal.allergens.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <AlertCircle className="h-3 w-3 text-warning" />
                            <span className="text-xs text-muted-foreground">
                              {language === 'en' ? 'Contains:' : 'يحتوي على:'} {meal.allergens.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Menu Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === 'en' ? 'Weekly Menu' : 'قائمة الأسبوع'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {daysOfWeek.map((day, index) => {
              const dayMeals = schoolMeals.filter(meal => 
                meal.available_days?.includes(day.value)
              );
              const date = addDays(new Date(), index);
              
              return (
                <Card key={day.value} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="text-center">
                      <p className="font-semibold">
                        {day.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(date, 'MMM dd')}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[150px]">
                      {dayMeals.length > 0 ? (
                        <div className="space-y-2">
                          {dayMeals.map(meal => {
                            const MealIcon = mealIcons[meal.icon] || Utensils;
                            return (
                              <div 
                                key={meal.id}
                                className="p-2 rounded-lg bg-secondary/50"
                              >
                                <div className="flex items-start gap-2">
                                  <MealIcon className="h-4 w-4 mt-1 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {language === 'en' ? meal.name : meal.name_ar}
                                    </p>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {meal.serving_time}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          {language === 'en' ? 'No meals' : 'لا توجد وجبات'}
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}