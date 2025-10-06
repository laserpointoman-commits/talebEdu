import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChefHat,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Utensils,
  Flame,
  Wheat,
  Fish,
  Coffee,
  Apple,
  Sandwich,
  Pizza,
  Soup,
  Save,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAsyncLoading } from '@/hooks/use-async-loading';

interface Meal {
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

const mealIcons = {
  sandwich: Sandwich,
  pizza: Pizza,
  soup: Soup,
  apple: Apple,
  coffee: Coffee,
  fish: Fish,
  wheat: Wheat,
  utensils: Utensils
};

export default function KitchenManagement() {
  const { language } = useLanguage();
  const { executeAsync } = useAsyncLoading();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [formData, setFormData] = useState<Partial<Meal>>({
    serving_time: 'lunch',
    category: 'lunch',
    price: 0,
    calories: 0,
    ingredients: [],
    allergens: [],
    available_days: [],
    is_vegetarian: false,
    is_gluten_free: false,
    is_dairy_free: false,
    max_orders: 50,
    icon: 'utensils'
  });

  useEffect(() => {
    executeAsync(async () => {
      await fetchMeals();
    });
  }, []);

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeals((data || []) as Meal[]);
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

  const handleSaveMeal = async () => {
    if (!formData.name || !formData.name_ar) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Please fill in all required fields' : 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingMeal) {
        const { data, error } = await supabase
          .from('meals')
          .update({
            name: formData.name,
            name_ar: formData.name_ar,
            description: formData.description,
            description_ar: formData.description_ar,
            category: formData.category,
            serving_time: formData.serving_time,
            price: formData.price,
            calories: formData.calories,
            ingredients: formData.ingredients,
            allergens: formData.allergens,
            is_vegetarian: formData.is_vegetarian,
            is_gluten_free: formData.is_gluten_free,
            is_dairy_free: formData.is_dairy_free,
            available_days: formData.available_days,
            max_orders: formData.max_orders,
            icon: formData.icon
          })
          .eq('id', editingMeal.id)
          .select()
          .single();

        if (error) throw error;

        setMeals(meals.map(meal => 
          meal.id === editingMeal.id ? (data as Meal) : meal
        ));
        toast({
          title: language === 'en' ? 'Success' : 'نجاح',
          description: language === 'en' ? 'Meal updated successfully' : 'تم تحديث الوجبة بنجاح'
        });
      } else {
        const { data, error } = await supabase
          .from('meals')
          .insert([{
            name: formData.name,
            name_ar: formData.name_ar || null,
            description: formData.description || null,
            description_ar: formData.description_ar || null,
            category: formData.category || 'lunch',
            serving_time: formData.serving_time || 'lunch',
            price: formData.price || 0,
            calories: formData.calories || 0,
            ingredients: formData.ingredients || null,
            allergens: formData.allergens || null,
            is_vegetarian: formData.is_vegetarian || false,
            is_gluten_free: formData.is_gluten_free || false,
            is_dairy_free: formData.is_dairy_free || false,
            available_days: formData.available_days || null,
            max_orders: formData.max_orders || 50,
            icon: formData.icon || 'utensils'
          }])
          .select()
          .single();

        if (error) throw error;

        setMeals([data as Meal, ...meals]);
        toast({
          title: language === 'en' ? 'Success' : 'نجاح',
          description: language === 'en' ? 'Meal added successfully' : 'تمت إضافة الوجبة بنجاح'
        });
      }

      setIsAddDialogOpen(false);
      setEditingMeal(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMeals(meals.filter(meal => meal.id !== id));
      toast({
        title: language === 'en' ? 'Success' : 'نجاح',
        description: language === 'en' ? 'Meal deleted successfully' : 'تم حذف الوجبة بنجاح'
      });
    } catch (error: any) {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData(meal);
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      serving_time: 'lunch',
      category: 'lunch',
      price: 0,
      calories: 0,
      ingredients: [],
      allergens: [],
      available_days: [],
      is_vegetarian: false,
      is_gluten_free: false,
      is_dairy_free: false,
      max_orders: 50,
      icon: 'utensils'
    });
  };

  const handleToggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days?.includes(day) 
        ? prev.available_days.filter(d => d !== day)
        : [...(prev.available_days || []), day]
    }));
  };

  const IconComponent = formData.icon ? mealIcons[formData.icon as keyof typeof mealIcons] : Utensils;

  // Weekly menu view
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const getNextWeekDate = (dayIndex: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilNext = (dayIndex - currentDay + 7) % 7 || 7;
    return addDays(today, daysUntilNext);
  };

  const getMealsForDay = (day: string) => {
    return meals.filter(meal => 
      meal.available_days?.includes(day.toLowerCase())
    );
  };

  if (loading) {
    return (
      <LogoLoader fullScreen={true} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">
            {language === 'en' ? 'Kitchen Management' : 'إدارة المطبخ'}
          </h1>
        </div>
        <Button onClick={() => {
          resetForm();
          setEditingMeal(null);
          setIsAddDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Add Meal' : 'إضافة وجبة'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Breakfast Items' : 'وجبات الإفطار'}
                </p>
                <p className="text-2xl font-bold">
                  {meals.filter(m => m.category === 'breakfast').length}
                </p>
              </div>
              <Coffee className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Lunch Items' : 'وجبات الغداء'}
                </p>
                <p className="text-2xl font-bold">
                  {meals.filter(m => m.category === 'lunch').length}
                </p>
              </div>
              <Utensils className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Snacks' : 'الوجبات الخفيفة'}
                </p>
                <p className="text-2xl font-bold">
                  {meals.filter(m => m.category === 'snack').length}
                </p>
              </div>
              <Apple className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Total Meals' : 'إجمالي الوجبات'}
                </p>
                <p className="text-2xl font-bold">{meals.length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Menu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === 'en' ? 'Weekly Menu' : 'قائمة الأسبوع'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const dayMeals = getMealsForDay(day);
              const date = getNextWeekDate(index + 1);
              
              return (
                <Card key={day} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="text-center">
                      <p className="font-semibold capitalize">
                        {language === 'en' ? day : 
                          day === 'monday' ? 'الإثنين' :
                          day === 'tuesday' ? 'الثلاثاء' :
                          day === 'wednesday' ? 'الأربعاء' :
                          day === 'thursday' ? 'الخميس' :
                          day === 'friday' ? 'الجمعة' :
                          day === 'saturday' ? 'السبت' : 'الأحد'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(date, 'MMM dd')}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[200px]">
                      {dayMeals.length > 0 ? (
                        <div className="space-y-2">
                          {dayMeals.map(meal => {
                            const MealIcon = mealIcons[meal.icon as keyof typeof mealIcons] || Utensils;
                            return (
                              <div 
                                key={meal.id}
                                className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
                                onClick={() => handleEditMeal(meal)}
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

      {/* All Meals List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'en' ? 'All Meals' : 'جميع الوجبات'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map(meal => {
              const MealIcon = mealIcons[meal.icon as keyof typeof mealIcons] || Utensils;
              
              return (
                <Card key={meal.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <MealIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {language === 'en' ? meal.name : meal.name_ar}
                          </h3>
                          <Badge variant="secondary" className="mt-1">
                            {meal.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditMeal(meal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteMeal(meal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {language === 'en' ? meal.description : meal.description_ar}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {language === 'en' ? 'Price' : 'السعر'}
                        </span>
                        <span className="font-medium">{meal.price} OMR</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {language === 'en' ? 'Calories' : 'السعرات'}
                        </span>
                        <span className="font-medium flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {meal.calories}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {language === 'en' ? 'Serving' : 'التقديم'}
                        </span>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {meal.serving_time}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {meal.is_vegetarian && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'en' ? 'Vegetarian' : 'نباتي'}
                        </Badge>
                      )}
                      {meal.is_gluten_free && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'en' ? 'Gluten-Free' : 'خالي من الجلوتين'}
                        </Badge>
                      )}
                      {meal.is_dairy_free && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'en' ? 'Dairy-Free' : 'خالي من الألبان'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {editingMeal 
                ? (language === 'en' ? 'Edit Meal' : 'تعديل الوجبة')
                : (language === 'en' ? 'Add New Meal' : 'إضافة وجبة جديدة')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Name (English)' : 'الاسم (إنجليزي)'}</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={language === 'en' ? 'Meal name' : 'اسم الوجبة'}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Name (Arabic)' : 'الاسم (عربي)'}</Label>
              <Input 
                value={formData.name_ar || ''} 
                onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                placeholder={language === 'en' ? 'اسم الوجبة' : 'Meal name'}
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Description (English)' : 'الوصف (إنجليزي)'}</Label>
              <Textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder={language === 'en' ? 'Meal description' : 'وصف الوجبة'}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Description (Arabic)' : 'الوصف (عربي)'}</Label>
              <Textarea 
                value={formData.description_ar || ''} 
                onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                placeholder={language === 'en' ? 'وصف الوجبة' : 'Meal description'}
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Category' : 'الفئة'}</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({...formData, category: value as 'breakfast' | 'lunch' | 'snack'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">
                    {language === 'en' ? 'Breakfast' : 'إفطار'}
                  </SelectItem>
                  <SelectItem value="lunch">
                    {language === 'en' ? 'Lunch' : 'غداء'}
                  </SelectItem>
                  <SelectItem value="snack">
                    {language === 'en' ? 'Snack' : 'وجبة خفيفة'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Serving Time' : 'وقت التقديم'}</Label>
              <Select 
                value={formData.serving_time} 
                onValueChange={(value) => setFormData({...formData, serving_time: value as 'breakfast' | 'lunch'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">
                    {language === 'en' ? 'Breakfast' : 'إفطار'}
                  </SelectItem>
                  <SelectItem value="lunch">
                    {language === 'en' ? 'Lunch' : 'غداء'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Icon' : 'الأيقونة'}</Label>
              <Select 
                value={formData.icon} 
                onValueChange={(value) => setFormData({...formData, icon: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandwich">Sandwich</SelectItem>
                  <SelectItem value="pizza">Pizza</SelectItem>
                  <SelectItem value="soup">Soup</SelectItem>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="coffee">Coffee</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="wheat">Wheat</SelectItem>
                  <SelectItem value="utensils">Utensils</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Price (OMR)' : 'السعر (ريال)'}</Label>
              <Input 
                type="number" 
                step="0.1"
                value={formData.price || 0} 
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Calories' : 'السعرات الحرارية'}</Label>
              <Input 
                type="number" 
                value={formData.calories || 0} 
                onChange={(e) => setFormData({...formData, calories: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Max Orders' : 'الحد الأقصى للطلبات'}</Label>
              <Input 
                type="number" 
                value={formData.max_orders || 50} 
                onChange={(e) => setFormData({...formData, max_orders: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === 'en' ? 'Available Days' : 'الأيام المتاحة'}</Label>
            <div className="flex flex-wrap gap-3">
              {weekDays.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    checked={formData.available_days?.includes(day) || false}
                    onCheckedChange={() => handleToggleDay(day)}
                  />
                  <Label className="capitalize cursor-pointer">
                    {language === 'en' ? day : 
                      day === 'monday' ? 'الإثنين' :
                      day === 'tuesday' ? 'الثلاثاء' :
                      day === 'wednesday' ? 'الأربعاء' :
                      day === 'thursday' ? 'الخميس' :
                      day === 'friday' ? 'الجمعة' :
                      day === 'saturday' ? 'السبت' : 'الأحد'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === 'en' ? 'Dietary Options' : 'خيارات النظام الغذائي'}</Label>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={formData.is_vegetarian || false}
                  onCheckedChange={(checked) => setFormData({...formData, is_vegetarian: checked as boolean})}
                />
                <Label className="cursor-pointer">
                  {language === 'en' ? 'Vegetarian' : 'نباتي'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={formData.is_gluten_free || false}
                  onCheckedChange={(checked) => setFormData({...formData, is_gluten_free: checked as boolean})}
                />
                <Label className="cursor-pointer">
                  {language === 'en' ? 'Gluten-Free' : 'خالي من الجلوتين'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={formData.is_dairy_free || false}
                  onCheckedChange={(checked) => setFormData({...formData, is_dairy_free: checked as boolean})}
                />
                <Label className="cursor-pointer">
                  {language === 'en' ? 'Dairy-Free' : 'خالي من الألبان'}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setEditingMeal(null);
              resetForm();
            }}>
              <X className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleSaveMeal}>
              <Save className="h-4 w-4 mr-2" />
              {editingMeal 
                ? (language === 'en' ? 'Update Meal' : 'تحديث الوجبة')
                : (language === 'en' ? 'Add Meal' : 'إضافة الوجبة')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}