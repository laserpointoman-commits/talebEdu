import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Ban, Check, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CanteenItem {
  id: string;
  name: string;
  name_ar: string | null;
  category: string;
  icon: string | null;
  price: number;
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
  const [canteenItems, setCanteenItems] = useState<CanteenItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [blockedItems, setBlockedItems] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; item: CanteenItem | null; action: 'block' | 'unblock' }>({
    open: false,
    item: null,
    action: 'block'
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

      // Load canteen items
      const { data: items } = await supabase
        .from('canteen_items')
        .select('id, name, name_ar, category, icon, price')
        .eq('available', true)
        .order('category');

      setCanteenItems(items || []);

      // Load existing restrictions
      const { data: restrictions } = await supabase
        .from('canteen_restrictions')
        .select('allowed_items')
        .eq('student_id', studentId)
        .eq('parent_id', user?.id)
        .maybeSingle();

      // allowed_items contains blocked items (inverted logic for this use case)
      if (restrictions?.allowed_items) {
        setBlockedItems(restrictions.allowed_items);
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

  const handleItemClick = (item: CanteenItem) => {
    const isCurrentlyBlocked = blockedItems.includes(item.id);
    setConfirmDialog({
      open: true,
      item,
      action: isCurrentlyBlocked ? 'unblock' : 'block'
    });
  };

  const confirmToggle = () => {
    if (confirmDialog.item) {
      setBlockedItems(prev => {
        if (prev.includes(confirmDialog.item!.id)) {
          return prev.filter(id => id !== confirmDialog.item!.id);
        }
        return [...prev, confirmDialog.item!.id];
      });
    }
    setConfirmDialog({ open: false, item: null, action: 'block' });
  };

  const toggleItemBlock = (itemId: string) => {
    setBlockedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  const saveRestrictions = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('canteen_restrictions')
        .upsert({
          student_id: studentId,
          parent_id: user?.id,
          allowed_items: blockedItems, // storing blocked items in allowed_items field
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id'
        });

      if (error) throw error;
      toast.success(language === 'ar' ? 'تم حفظ القيود' : 'Restrictions saved');
    } catch (error) {
      console.error('Error saving restrictions:', error);
      toast.error(language === 'ar' ? 'فشل في الحفظ' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  // Group items by category
  const groupedItems = canteenItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CanteenItem[]>);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'إدارة المقصف' : 'Canteen Controls'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-200 dark:border-orange-900/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <Ban className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold">
                {language === 'ar' ? 'حظر المنتجات' : 'Block Products'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'حدد المنتجات التي لا تريد للطالب شراءها'
                  : 'Select products you want to restrict from the student'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items to Block */}
      <div className="space-y-4">
        {Object.keys(groupedItems).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد منتجات' : 'No products available'}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm text-muted-foreground uppercase flex items-center gap-2">
                  <span>{items[0]?.icon || '📦'}</span>
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {items.map((item) => {
                  const isBlocked = blockedItems.includes(item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        isBlocked 
                          ? 'bg-red-500/10 border border-red-500/30' 
                          : 'bg-accent/50 hover:bg-accent'
                      }`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon || '📦'}</span>
                        <div>
                          <p className="font-medium">
                            {language === 'ar' ? item.name_ar || item.name : item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {Number(item.price).toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={isBlocked ? 'destructive' : 'secondary'}
                        className="cursor-pointer"
                      >
                        {isBlocked ? (
                          <>
                            <Ban className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'محظور' : 'Blocked'}
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'مسموح' : 'Allowed'}
                          </>
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {blockedItems.length > 0 && (
        <Card className="bg-red-500/5 border-red-200 dark:border-red-900/30">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {language === 'ar' 
                ? `${blockedItems.length} منتجات محظورة`
                : `${blockedItems.length} products blocked`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button onClick={saveRestrictions} disabled={saving} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        {saving 
          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
          : (language === 'ar' ? 'حفظ القيود' : 'Save Restrictions')}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, item: null, action: 'block' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'block' 
                ? (language === 'ar' ? 'حظر المنتج؟' : 'Block Product?')
                : (language === 'ar' ? 'إلغاء الحظر؟' : 'Unblock Product?')}
            </AlertDialogTitle>
            <AlertDialogDescription className="flex items-center gap-3 pt-2">
              <span className="text-2xl">{confirmDialog.item?.icon || '📦'}</span>
              <span>
                {confirmDialog.action === 'block' 
                  ? (language === 'ar' 
                      ? `هل تريد حظر "${confirmDialog.item?.name_ar || confirmDialog.item?.name}" من المقصف؟`
                      : `Do you want to block "${confirmDialog.item?.name}" from the canteen?`)
                  : (language === 'ar' 
                      ? `هل تريد إلغاء حظر "${confirmDialog.item?.name_ar || confirmDialog.item?.name}"؟`
                      : `Do you want to unblock "${confirmDialog.item?.name}"?`)}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmToggle}
              className={confirmDialog.action === 'block' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog.action === 'block' 
                ? (language === 'ar' ? 'حظر' : 'Block')
                : (language === 'ar' ? 'إلغاء الحظر' : 'Unblock')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}