import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, 
  ChefHat, 
  Package, 
  Store,
  TrendingUp,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';
import CanteenManagement from '@/components/features/CanteenManagement';
import KitchenManagement from '@/components/features/KitchenManagement';
import StoreManagement from '@/components/features/StoreManagement';

export default function ShopManagement() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('canteen');

  // Mock statistics - these would come from the database
  const stats = {
    totalRevenue: 15423.50,
    todayRevenue: 342.75,
    totalOrders: 1245,
    todayOrders: 56,
    totalCustomers: 423,
    activeProducts: 145,
    lowStock: 12,
    pendingOrders: 8
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Store className="h-8 w-8" />
          {language === 'en' ? 'Shop Management' : 'إدارة المتجر'}
        </h2>
        <p className="text-muted-foreground mt-1">
          {language === 'en' 
            ? 'Manage all school shop operations - canteen, kitchen, and store' 
            : 'إدارة جميع عمليات متجر المدرسة - المقصف والمطبخ والمتجر'}
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Total Revenue' : 'إجمالي الإيرادات'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {language === 'ar' 
                ? `${stats.totalRevenue.toFixed(2)} ر.ع`
                : `OMR ${stats.totalRevenue.toFixed(2)}`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? '+20.1% from last month' : '+20.1% من الشهر الماضي'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? "Today's Sales" : 'مبيعات اليوم'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {language === 'ar' 
                ? `${stats.todayRevenue.toFixed(2)} ر.ع`
                : `OMR ${stats.todayRevenue.toFixed(2)}`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todayOrders} {language === 'en' ? 'orders' : 'طلبات'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Active Customers' : 'العملاء النشطون'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? '+180 this semester' : '+180 هذا الفصل'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Pending Orders' : 'الطلبات المعلقة'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStock} {language === 'en' ? 'items low stock' : 'عناصر مخزون منخفض'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none border-b bg-background h-14">
              <TabsTrigger 
                value="canteen" 
                className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                {language === 'en' ? 'Canteen' : 'المقصف'}
              </TabsTrigger>
              <TabsTrigger 
                value="kitchen" 
                className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
              >
                <ChefHat className="h-4 w-4" />
                {language === 'en' ? 'Kitchen' : 'المطبخ'}
              </TabsTrigger>
              <TabsTrigger 
                value="store" 
                className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
              >
                <Package className="h-4 w-4" />
                {language === 'en' ? 'Store' : 'المتجر'}
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="canteen" className="mt-0">
                <CanteenManagement />
              </TabsContent>
              
              <TabsContent value="kitchen" className="mt-0">
                <KitchenManagement />
              </TabsContent>
              
              <TabsContent value="store" className="mt-0">
                <StoreManagement />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}