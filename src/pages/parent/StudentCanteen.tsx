import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ShoppingBag, Ban, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
  items: any;
}

export default function StudentCanteen() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<any>({
    daily_limit: 5,
    blocked_categories: [],
    is_active: true
  });

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

      // Load categories
      const { data: categoriesData } = await supabase
        .from('canteen_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      setCategories(categoriesData || []);

      // Load existing settings
      const { data: settingsData } = await supabase
        .from('allowance_settings')
        .select('*')
        .eq('student_id', studentId)
        .eq('parent_id', user?.id)
        .maybeSingle();

      if (settingsData) {
        setSettings({
          daily_limit: settingsData.daily_limit || 5,
          blocked_categories: settingsData.blocked_categories || [],
          is_active: settingsData.is_active !== false
        });
      }

      // Load recent orders
      const { data: ordersData } = await supabase
        .from('canteen_orders')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading canteen data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('allowance_settings')
        .upsert({
          student_id: studentId,
          parent_id: user?.id,
          daily_limit: settings.daily_limit,
          blocked_categories: settings.blocked_categories,
          is_active: settings.is_active,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id'
        });

      if (error) throw error;
      toast.success(language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(language === 'ar' ? 'فشل في الحفظ' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const blocked = settings.blocked_categories || [];
    if (blocked.includes(categoryId)) {
      setSettings({
        ...settings,
        blocked_categories: blocked.filter((id: string) => id !== categoryId)
      });
    } else {
      setSettings({
        ...settings,
        blocked_categories: [...blocked, categoryId]
      });
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/student/${studentId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'إدارة المقصف' : 'Canteen Controls'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Main Toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${settings.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {settings.is_active ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Ban className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {language === 'ar' ? 'السماح بالشراء من المقصف' : 'Allow Canteen Purchases'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {settings.is_active 
                    ? (language === 'ar' ? 'يمكن للطالب الشراء' : 'Student can make purchases')
                    : (language === 'ar' ? 'الشراء موقوف' : 'Purchases disabled')}
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.is_active}
              onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Daily Limit */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">
            {language === 'ar' ? 'الحد اليومي' : 'Daily Spending Limit'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={settings.daily_limit}
              onChange={(e) => setSettings({ ...settings, daily_limit: Number(e.target.value) })}
              className="w-32"
              min={0}
              step={0.5}
            />
            <span className="text-muted-foreground">{language === 'ar' ? 'ر.ع' : 'OMR'}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {language === 'ar' 
              ? 'الحد الأقصى للمشتريات اليومية'
              : 'Maximum daily purchase amount'}
          </p>
        </CardContent>
      </Card>

      {/* Category Restrictions */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Ban className="h-4 w-4" />
            {language === 'ar' ? 'حظر الفئات' : 'Block Categories'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {categories.map((cat) => {
            const isBlocked = settings.blocked_categories?.includes(cat.id);
            return (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <span className="font-medium">
                  {language === 'ar' ? cat.name_ar || cat.name : cat.name}
                </span>
                <Badge 
                  variant={isBlocked ? 'destructive' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(cat.id)}
                >
                  {isBlocked 
                    ? (language === 'ar' ? 'محظور' : 'Blocked')
                    : (language === 'ar' ? 'مسموح' : 'Allowed')}
                </Badge>
              </div>
            );
          })}
          
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {language === 'ar' ? 'لا توجد فئات' : 'No categories available'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={saving} className="w-full">
        {saving 
          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
          : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
      </Button>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              {language === 'ar' ? 'المشتريات الأخيرة' : 'Recent Purchases'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {Number(order.total_amount).toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
