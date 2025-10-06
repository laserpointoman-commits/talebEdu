import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  Clock,
  Coffee,
  Apple,
  Cookie,
  Pizza,
  ShoppingBag,
  Ban,
  Check,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CategoryRestriction {
  category: string;
  allowed: boolean;
  maxDailyAmount?: number;
}

interface TimeRestriction {
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface StudentRestrictions {
  studentId: string;
  studentName: string;
  dailySpendingLimit: number;
  weeklySpendingLimit: number;
  categoryRestrictions: CategoryRestriction[];
  timeRestrictions: TimeRestriction;
  blockedItems: string[];
  allowedItems: string[];
}

const categoryIcons: Record<string, any> = {
  'Main': Pizza,
  'Drinks': Coffee,
  'Healthy': Apple,
  'Bakery': Cookie,
  'Snacks': ShoppingBag,
};

export default function ParentalControl() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<StudentRestrictions[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRestrictions | null>(null);
  const [canteenItems, setCanteenItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCanteenItems();
    fetchParentalControls();
  }, []);

  const fetchParentalControls = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      // First get all students for this parent
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('parent_id', profile.id);
      
      if (studentsError) throw studentsError;
      
      // Get parental controls for these students
      const { data: controlsData, error: controlsError } = await supabase
        .from('parental_controls')
        .select('*')
        .eq('parent_id', profile.id);
      
      if (controlsError) throw controlsError;
      
      // Merge students with their controls or create defaults
      const mergedStudents = (studentsData || []).map(student => {
        const controls = controlsData?.find(c => c.student_id === student.id);
        
        return {
          studentId: student.id,
          studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          dailySpendingLimit: controls?.daily_spending_limit || 5,
          weeklySpendingLimit: (controls as any)?.weekly_spending_limit || 25,
          categoryRestrictions: (controls as any)?.category_restrictions || [
            { category: 'Main', allowed: true, maxDailyAmount: 3 },
            { category: 'Drinks', allowed: true, maxDailyAmount: 2 },
            { category: 'Healthy', allowed: true },
            { category: 'Bakery', allowed: false },
            { category: 'Snacks', allowed: false },
          ],
          timeRestrictions: (controls as any)?.time_restrictions || {
            startTime: '07:00',
            endTime: '14:00',
            enabled: true
          },
          blockedItems: (controls as any)?.blocked_items || [],
          allowedItems: (controls as any)?.allowed_items || []
        };
      });
      
      setStudents(mergedStudents);
      if (mergedStudents.length > 0) {
        setSelectedStudent(mergedStudents[0]);
      }
    } catch (error) {
      console.error('Error fetching parental controls:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' 
          ? 'Failed to load parental controls' 
          : 'فشل في تحميل الرقابة الأبوية',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCanteenItems = async () => {
    try {
      const { data, error } = await supabase
        .from('canteen_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setCanteenItems(data || []);
    } catch (error) {
      console.error('Error fetching canteen items:', error);
    }
  };

  const handleSaveRestrictions = async () => {
    if (!profile?.id || !selectedStudent) return;
    
    setLoading(true);
    try {
      const controlData = {
        student_id: selectedStudent.studentId,
        parent_id: profile.id,
        daily_spending_limit: selectedStudent.dailySpendingLimit,
        weekly_spending_limit: selectedStudent.weeklySpendingLimit,
        category_restrictions: selectedStudent.categoryRestrictions as any,
        time_restrictions: selectedStudent.timeRestrictions as any,
        blocked_items: selectedStudent.blockedItems as any,
        allowed_items: selectedStudent.allowedItems as any,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('parental_controls')
        .upsert([controlData], {
          onConflict: 'student_id'
        });
      
      if (error) throw error;
      
      toast({
        title: language === 'en' ? 'Settings Saved' : 'تم حفظ الإعدادات',
        description: language === 'en' 
          ? 'Parental control settings have been updated successfully' 
          : 'تم تحديث إعدادات الرقابة الأبوية بنجاح',
      });
    } catch (error) {
      console.error('Error saving parental controls:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' 
          ? 'Failed to save settings' 
          : 'فشل في حفظ الإعدادات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStudentRestriction = (field: string, value: any) => {
    setSelectedStudent(prev => ({ ...prev, [field]: value }));
    setStudents(students.map(s => 
      s.studentId === selectedStudent.studentId 
        ? { ...selectedStudent, [field]: value }
        : s
    ));
  };

  const updateCategoryRestriction = (category: string, field: string, value: any) => {
    const updatedRestrictions = selectedStudent.categoryRestrictions.map(r =>
      r.category === category ? { ...r, [field]: value } : r
    );
    updateStudentRestriction('categoryRestrictions', updatedRestrictions);
  };

  const toggleBlockedItem = (itemId: string) => {
    const blockedItems = selectedStudent.blockedItems.includes(itemId)
      ? selectedStudent.blockedItems.filter(id => id !== itemId)
      : [...selectedStudent.blockedItems, itemId];
    updateStudentRestriction('blockedItems', blockedItems);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6" />
                {language === 'en' ? 'Parental Control' : 'الرقابة الأبوية'}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {language === 'en' 
                  ? 'Manage spending limits and restrictions for your children' 
                  : 'إدارة حدود الإنفاق والقيود لأطفالك'}
              </p>
            </div>
            <Button onClick={handleSaveRestrictions}>
              {language === 'en' ? 'Save Settings' : 'حفظ الإعدادات'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="spending" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsList className={`grid w-full grid-cols-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <TabsTrigger value="spending">
                <DollarSign className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Spending' : 'الإنفاق'}
              </TabsTrigger>
              <TabsTrigger value="categories">
                <ShoppingBag className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Categories' : 'الفئات'}
              </TabsTrigger>
              <TabsTrigger value="items">
                <Ban className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Items' : 'العناصر'}
              </TabsTrigger>
              <TabsTrigger value="time">
                <Clock className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Time' : 'الوقت'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spending" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Daily Spending Limit (OMR)' : 'حد الإنفاق اليومي (ر.ع)'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={selectedStudent.dailySpendingLimit}
                    onChange={(e) => updateStudentRestriction('dailySpendingLimit', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'en' 
                      ? 'Maximum amount that can be spent per day' 
                      : 'الحد الأقصى للمبلغ الذي يمكن إنفاقه يوميًا'}
                  </p>
                </div>
                <div>
                  <Label>{language === 'en' ? 'Weekly Spending Limit (OMR)' : 'حد الإنفاق الأسبوعي (ر.ع)'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={selectedStudent.weeklySpendingLimit}
                    onChange={(e) => updateStudentRestriction('weeklySpendingLimit', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'en' 
                      ? 'Maximum amount that can be spent per week' 
                      : 'الحد الأقصى للمبلغ الذي يمكن إنفاقه أسبوعيًا'}
                  </p>
                </div>
              </div>

              <Card className="bg-warning/10 border-warning">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {language === 'en' ? 'Spending Alert' : 'تنبيه الإنفاق'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === 'en' 
                          ? 'You will receive notifications when your child reaches 80% of their spending limit' 
                          : 'ستتلقى إشعارات عندما يصل طفلك إلى 80٪ من حد الإنفاق'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4 mt-6">
              <p className="text-sm text-muted-foreground">
                {language === 'en' 
                  ? 'Control which categories your child can purchase from' 
                  : 'تحكم في الفئات التي يمكن لطفلك الشراء منها'}
              </p>
              
              {selectedStudent.categoryRestrictions.map((restriction) => {
                const IconComponent = categoryIcons[restriction.category] || ShoppingBag;
                return (
                  <Card key={restriction.category}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{restriction.category}</p>
                            <p className="text-sm text-muted-foreground">
                              {restriction.allowed 
                                ? (language === 'en' ? 'Allowed' : 'مسموح')
                                : (language === 'en' ? 'Blocked' : 'محظور')
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {restriction.allowed && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">
                                {language === 'en' ? 'Daily Limit:' : 'الحد اليومي:'}
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={restriction.maxDailyAmount || ''}
                                onChange={(e) => updateCategoryRestriction(
                                  restriction.category, 
                                  'maxDailyAmount', 
                                  parseFloat(e.target.value) || undefined
                                )}
                                className="w-20"
                                placeholder="∞"
                              />
                              <span className="text-sm text-muted-foreground">
                                {language === 'ar' ? 'ر.ع' : 'OMR'}
                              </span>
                            </div>
                          )}
                          <Switch
                            checked={restriction.allowed}
                            onCheckedChange={(checked) => 
                              updateCategoryRestriction(restriction.category, 'allowed', checked)
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="items" className="space-y-4 mt-6">
              <p className="text-sm text-muted-foreground">
                {language === 'en' 
                  ? 'Block specific items from being purchased' 
                  : 'حظر عناصر محددة من الشراء'}
              </p>

              <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                {canteenItems.map((item) => {
                  const isBlocked = selectedStudent.blockedItems.includes(item.id);
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isBlocked ? 'bg-destructive/5 border-destructive/20' : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isBlocked ? (
                          <Ban className="h-4 w-4 text-destructive" />
                        ) : (
                          <Check className="h-4 w-4 text-success" />
                        )}
                        <div>
                          <p className="font-medium">
                            {language === 'en' ? item.name : item.name_ar || item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.category} - {language === 'ar' 
                              ? `${item.price.toFixed(2)} ر.ع`
                              : `OMR ${item.price.toFixed(2)}`
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={isBlocked ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => toggleBlockedItem(item.id)}
                      >
                        {isBlocked 
                          ? (language === 'en' ? 'Blocked' : 'محظور')
                          : (language === 'en' ? 'Allowed' : 'مسموح')
                        }
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="time" className="space-y-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">
                    {language === 'en' ? 'Time Restrictions' : 'قيود الوقت'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Set specific hours when purchases are allowed' 
                      : 'تحديد ساعات محددة عندما يُسمح بالشراء'}
                  </p>
                </div>
                <Switch
                  checked={selectedStudent.timeRestrictions.enabled}
                  onCheckedChange={(checked) => 
                    updateStudentRestriction('timeRestrictions', {
                      ...selectedStudent.timeRestrictions,
                      enabled: checked
                    })
                  }
                />
              </div>

              {selectedStudent.timeRestrictions.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'en' ? 'Start Time' : 'وقت البداية'}</Label>
                    <Input
                      type="time"
                      value={selectedStudent.timeRestrictions.startTime}
                      onChange={(e) => 
                        updateStudentRestriction('timeRestrictions', {
                          ...selectedStudent.timeRestrictions,
                          startTime: e.target.value
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>{language === 'en' ? 'End Time' : 'وقت النهاية'}</Label>
                    <Input
                      type="time"
                      value={selectedStudent.timeRestrictions.endTime}
                      onChange={(e) => 
                        updateStudentRestriction('timeRestrictions', {
                          ...selectedStudent.timeRestrictions,
                          endTime: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {language === 'en' ? 'School Hours' : 'ساعات المدرسة'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === 'en' 
                          ? 'Purchases outside school hours will be automatically blocked' 
                          : 'سيتم حظر المشتريات خارج ساعات المدرسة تلقائيًا'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'en' ? 'Recent Purchases' : 'المشتريات الأخيرة'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { item: 'Chicken Sandwich', time: '10:30 AM', amount: 2.5, status: 'allowed' },
              { item: 'Fresh Juice', time: '11:15 AM', amount: 1.5, status: 'allowed' },
              { item: 'Chocolate Bar', time: '12:00 PM', amount: 1.0, status: 'blocked' },
            ].map((purchase, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {purchase.status === 'blocked' ? (
                    <Ban className="h-4 w-4 text-destructive" />
                  ) : (
                    <Check className="h-4 w-4 text-success" />
                  )}
                  <div>
                    <p className="font-medium">{purchase.item}</p>
                    <p className="text-sm text-muted-foreground">{purchase.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {language === 'ar' 
                      ? `${purchase.amount.toFixed(2)} ر.ع`
                      : `OMR ${purchase.amount.toFixed(2)}`
                    }
                  </p>
                  <Badge variant={purchase.status === 'blocked' ? 'destructive' : 'default'}>
                    {purchase.status === 'blocked' 
                      ? (language === 'en' ? 'Blocked' : 'محظور')
                      : (language === 'en' ? 'Allowed' : 'مسموح')
                    }
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}