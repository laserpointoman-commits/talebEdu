import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Store, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';
import { format } from 'date-fns';

interface StoreItem {
  id: string;
  name: string;
  name_ar: string | null;
  price: number;
  category: string;
  available: boolean;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any;
}

export default function StudentStore() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

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

      // Store items would be loaded from a store table if it exists
      // For now, we'll leave this empty as school store may need to be set up
      setStoreItems([]);
      setOrders([]);
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;

  const studentName = language === 'ar' 
    ? `${student?.first_name_ar || student?.first_name} ${student?.last_name_ar || student?.last_name}`
    : `${student?.first_name} ${student?.last_name}`;

  // Group items by category
  const groupedItems = storeItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, StoreItem[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { label: language === 'ar' ? 'مكتمل' : 'Completed', variant: 'default' as const };
      case 'pending': return { label: language === 'ar' ? 'قيد الانتظار' : 'Pending', variant: 'secondary' as const };
      case 'cancelled': return { label: language === 'ar' ? 'ملغي' : 'Cancelled', variant: 'destructive' as const };
      default: return { label: status, variant: 'outline' as const };
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/student/${studentId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {language === 'ar' ? 'متجر المدرسة' : 'School Store'}
          </h1>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/20 rounded-full">
              <Store className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <p className="font-semibold">
                {language === 'ar' ? 'متجر الزي والمستلزمات' : 'Uniforms & Supplies Store'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'اطلب الزي والمستلزمات المدرسية'
                  : 'Order school uniforms and supplies'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Items */}
      <div className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {language === 'ar' ? 'المنتجات المتاحة' : 'Available Products'}
        </h2>
        
        {Object.keys(groupedItems).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد منتجات متاحة' : 'No products available'}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm text-muted-foreground uppercase">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <span className="font-medium">
                      {language === 'ar' ? item.name_ar || item.name : item.name}
                    </span>
                    <span className="font-bold text-primary">
                      {Number(item.price).toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {language === 'ar' ? 'الطلبات السابقة' : 'Order History'}
          </h2>
          
          {orders.map((order) => {
            const status = getStatusBadge(order.status);
            return (
              <Card key={order.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {Number(order.total_amount).toFixed(3)} {language === 'ar' ? 'ر.ع' : 'OMR'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
