import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft,
  Wallet,
  ShoppingBag,
  Ban,
  Check,
  Save,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LogoLoader from '@/components/LogoLoader';

interface AllowanceSettings {
  id?: string;
  daily_limit: number;
  weekly_limit: number;
  auto_deduct_on_entry: boolean;
  entry_allowance_amount: number;
  blocked_categories: string[];
  allowed_categories: string[];
  is_active: boolean;
}

interface CanteenCategory {
  id: string;
  name: string;
  name_ar: string;
}

export default function StudentWalletControl() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [categories, setCategories] = useState<CanteenCategory[]>([]);
  const [settings, setSettings] = useState<AllowanceSettings>({
    daily_limit: 5.000,
    weekly_limit: 25.000,
    auto_deduct_on_entry: false,
    entry_allowance_amount: 1.000,
    blocked_categories: [],
    allowed_categories: [],
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

      // Load wallet balance
      const { data: wallet } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', studentId)
        .single();
      
      setWalletBalance(wallet?.balance || 0);

      // Load existing allowance settings
      const { data: existingSettings } = await supabase
        .from('allowance_settings')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (existingSettings) {
        setSettings({
          id: existingSettings.id,
          daily_limit: existingSettings.daily_limit || 5.000,
          weekly_limit: existingSettings.weekly_limit || 25.000,
          auto_deduct_on_entry: existingSettings.auto_deduct_on_entry || false,
          entry_allowance_amount: existingSettings.entry_allowance_amount || 1.000,
          blocked_categories: existingSettings.blocked_categories || [],
          allowed_categories: existingSettings.allowed_categories || [],
          is_active: existingSettings.is_active !== false
        });
      }

      // Load canteen categories
      const { data: categoriesData } = await supabase
        .from('canteen_categories')
        .select('id, name, name_ar')
        .eq('is_active', true)
        .order('display_order');

      setCategories(categoriesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsData = {
        student_id: studentId,
        parent_id: user?.id,
        daily_limit: settings.daily_limit,
        weekly_limit: settings.weekly_limit,
        auto_deduct_on_entry: settings.auto_deduct_on_entry,
        entry_allowance_amount: settings.entry_allowance_amount,
        blocked_categories: settings.blocked_categories,
        allowed_categories: settings.allowed_categories,
        is_active: settings.is_active
      };

      if (settings.id) {
        await supabase
          .from('allowance_settings')
          .update(settingsData)
          .eq('id', settings.id);
      } else {
        await supabase
          .from('allowance_settings')
          .insert(settingsData);
      }

      toast.success(language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(language === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlockedCategory = (categoryId: string) => {
    setSettings(prev => {
      const blocked = prev.blocked_categories.includes(categoryId)
        ? prev.blocked_categories.filter(c => c !== categoryId)
        : [...prev.blocked_categories, categoryId];
      
      // Remove from allowed if added to blocked
      const allowed = prev.allowed_categories.filter(c => !blocked.includes(c));
      
      return { ...prev, blocked_categories: blocked, allowed_categories: allowed };
    });
  };

  const toggleAllowedCategory = (categoryId: string) => {
    setSettings(prev => {
      const allowed = prev.allowed_categories.includes(categoryId)
        ? prev.allowed_categories.filter(c => c !== categoryId)
        : [...prev.allowed_categories, categoryId];
      
      // Remove from blocked if added to allowed
      const blocked = prev.blocked_categories.filter(c => !allowed.includes(c));
      
      return { ...prev, allowed_categories: allowed, blocked_categories: blocked };
    });
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/student/${studentId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'إدارة المحفظة' : 'Wallet Management'}
          </h1>
          <p className="text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Current Balance */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Wallet className="h-12 w-12" />
            <div>
              <p className="text-sm opacity-80">
                {language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}
              </p>
              <p className="text-3xl font-bold">
                {walletBalance.toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {language === 'ar' ? 'حدود الإنفاق' : 'Spending Limits'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'تعيين حدود الإنفاق اليومية والأسبوعية'
              : 'Set daily and weekly spending limits'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'الحد اليومي (ر.ع)' : 'Daily Limit (OMR)'}</Label>
              <Input
                type="number"
                step="0.100"
                value={settings.daily_limit}
                onChange={(e) => setSettings(prev => ({ ...prev, daily_limit: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الحد الأسبوعي (ر.ع)' : 'Weekly Limit (OMR)'}</Label>
              <Input
                type="number"
                step="0.100"
                value={settings.weekly_limit}
                onChange={(e) => setSettings(prev => ({ ...prev, weekly_limit: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Auto Deduct on Entry */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">
                {language === 'ar' ? 'خصم تلقائي عند الدخول' : 'Auto-deduct on School Entry'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'خصم المصروف تلقائياً عند مسح NFC عند البوابة'
                  : 'Automatically deduct allowance when NFC is scanned at gate'}
              </p>
            </div>
            <Switch
              checked={settings.auto_deduct_on_entry}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_deduct_on_entry: checked }))}
            />
          </div>

          {settings.auto_deduct_on_entry && (
            <div>
              <Label>{language === 'ar' ? 'مبلغ المصروف اليومي (ر.ع)' : 'Daily Allowance Amount (OMR)'}</Label>
              <Input
                type="number"
                step="0.100"
                value={settings.entry_allowance_amount}
                onChange={(e) => setSettings(prev => ({ ...prev, entry_allowance_amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {language === 'ar' ? 'صلاحيات المنتجات' : 'Product Permissions'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'حدد المنتجات المسموحة أو المحظورة'
              : 'Select which products are allowed or blocked'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {categories.map((category) => {
                const isBlocked = settings.blocked_categories.includes(category.id);
                const isAllowed = settings.allowed_categories.includes(category.id);
                
                return (
                  <div 
                    key={category.id}
                    className={`p-4 rounded-lg border flex items-center justify-between ${
                      isBlocked ? 'bg-red-500/10 border-red-500/30' :
                      isAllowed ? 'bg-green-500/10 border-green-500/30' : ''
                    }`}
                  >
                    <span className="font-medium">
                      {language === 'ar' ? category.name_ar || category.name : category.name}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isAllowed ? 'default' : 'outline'}
                        className={isAllowed ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => toggleAllowedCategory(category.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={isBlocked ? 'destructive' : 'outline'}
                        onClick={() => toggleBlockedCategory(category.id)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <Check className="h-4 w-4 inline-block text-green-600 mr-1" />
              {language === 'ar' ? 'مسموح' : 'Allowed'} | 
              <Ban className="h-4 w-4 inline-block text-red-600 mx-1" />
              {language === 'ar' ? 'محظور' : 'Blocked'} | 
              {language === 'ar' ? ' فارغ = كل المنتجات مسموحة' : ' Empty = All products allowed'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        className="w-full h-14 text-lg" 
        onClick={saveSettings}
        disabled={saving}
      >
        <Save className="mr-2 h-5 w-5" />
        {saving 
          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
          : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
      </Button>
    </div>
  );
}