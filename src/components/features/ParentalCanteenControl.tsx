import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShoppingBag, Save, DollarSign } from 'lucide-react';

interface CanteenItem {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  category: string;
  icon: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  first_name_ar: string;
  last_name_ar: string;
}

interface Restriction {
  allowed_items: string[];
  daily_limit: number | null;
}

export default function ParentalCanteenControl() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [items, setItems] = useState<CanteenItem[]>([]);
  const [restriction, setRestriction] = useState<Restriction>({
    allowed_items: [],
    daily_limit: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStudents();
      loadItems();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      loadRestrictions();
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, first_name_ar, last_name_ar')
      .eq('parent_id', user?.id);

    if (error) {
      toast.error(language === 'en' ? 'Failed to load students' : 'فشل تحميل الطلاب');
      return;
    }

    setStudents(data || []);
    if (data && data.length > 0) {
      setSelectedStudent(data[0]);
    }
  };

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('canteen_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true });

    if (error) {
      toast.error(language === 'en' ? 'Failed to load items' : 'فشل تحميل العناصر');
      return;
    }

    setItems(data || []);
  };

  const loadRestrictions = async () => {
    if (!selectedStudent) return;

    const { data, error } = await supabase
      .from('canteen_restrictions')
      .select('allowed_items, daily_limit')
      .eq('student_id', selectedStudent.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading restrictions:', error);
      return;
    }

    if (data) {
      setRestriction({
        allowed_items: data.allowed_items || [],
        daily_limit: data.daily_limit
      });
    } else {
      // No restrictions set, allow all
      setRestriction({
        allowed_items: [],
        daily_limit: null
      });
    }
  };

  const toggleItem = (itemId: string) => {
    const newAllowedItems = restriction.allowed_items.includes(itemId)
      ? restriction.allowed_items.filter(id => id !== itemId)
      : [...restriction.allowed_items, itemId];

    setRestriction({ ...restriction, allowed_items: newAllowedItems });
  };

  const selectAll = () => {
    setRestriction({ ...restriction, allowed_items: items.map(i => i.id) });
  };

  const deselectAll = () => {
    setRestriction({ ...restriction, allowed_items: [] });
  };

  const saveRestrictions = async () => {
    if (!selectedStudent || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('canteen_restrictions')
        .upsert({
          student_id: selectedStudent.id,
          parent_id: user.id,
          allowed_items: restriction.allowed_items,
          daily_limit: restriction.daily_limit
        });

      if (error) throw error;

      toast.success(
        language === 'en' 
          ? 'Restrictions saved successfully!' 
          : 'تم حفظ القيود بنجاح!'
      );
    } catch (error) {
      console.error('Error saving restrictions:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to save restrictions' 
          : 'فشل حفظ القيود'
      );
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CanteenItem[]>);

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'No students found' 
              : 'لا يوجد طلاب'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {language === 'en' ? 'Canteen Purchase Controls' : 'ضوابط شراء المقصف'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label>{language === 'en' ? 'Select Student' : 'اختر الطالب'}</Label>
            <div className="flex gap-2 flex-wrap">
              {students.map(student => (
                <Button
                  key={student.id}
                  variant={selectedStudent?.id === student.id ? 'default' : 'outline'}
                  onClick={() => setSelectedStudent(student)}
                >
                  {language === 'en' 
                    ? `${student.first_name} ${student.last_name}` 
                    : `${student.first_name_ar || student.first_name} ${student.last_name_ar || student.last_name}`
                  }
                </Button>
              ))}
            </div>
          </div>

          {/* Daily Limit */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {language === 'en' ? 'Daily Spending Limit (OMR)' : 'الحد الأقصى للإنفاق اليومي (ر.ع)'}
            </Label>
            <Input
              type="number"
              step="0.001"
              min="0"
              placeholder={language === 'en' ? 'No limit' : 'بدون حد'}
              value={restriction.daily_limit || ''}
              onChange={(e) => setRestriction({
                ...restriction,
                daily_limit: e.target.value ? parseFloat(e.target.value) : null
              })}
            />
            <p className="text-xs text-muted-foreground">
              {language === 'en' 
                ? 'Leave empty for no limit' 
                : 'اتركه فارغاً لعدم وجود حد'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Items Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{language === 'en' ? 'Allowed Items' : 'العناصر المسموح بها'}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                {language === 'en' ? 'Select All' : 'اختر الكل'}
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAll}>
                {language === 'en' ? 'Deselect All' : 'إلغاء تحديد الكل'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {restriction.allowed_items.length === 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {language === 'en' 
                  ? '⚠️ No items selected - student can buy everything' 
                  : '⚠️ لم يتم اختيار أي عناصر - يمكن للطالب شراء كل شيء'}
              </p>
            </div>
          )}

          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-lg">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryItems.map(item => {
                  const isAllowed = restriction.allowed_items.length === 0 || 
                    restriction.allowed_items.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        isAllowed 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-muted/50'
                      }`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox
                        checked={isAllowed}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon || '🍽️'}</span>
                          <div>
                            <p className="font-medium">
                              {language === 'en' ? item.name : item.name_ar || item.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.price.toFixed(3)} {language === 'en' ? 'OMR' : 'ر.ع'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge variant={isAllowed ? 'default' : 'secondary'}>
                        {isAllowed 
                          ? (language === 'en' ? 'Allowed' : 'مسموح')
                          : (language === 'en' ? 'Blocked' : 'محظور')
                        }
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button
              onClick={saveRestrictions}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading 
                ? (language === 'en' ? 'Saving...' : 'جاري الحفظ...')
                : (language === 'en' ? 'Save Changes' : 'حفظ التغييرات')
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}