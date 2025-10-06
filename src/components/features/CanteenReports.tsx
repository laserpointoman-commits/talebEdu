import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Award,
  Users,
  Package,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { format } from 'date-fns';

interface SalesData {
  total_sales: number;
  total_orders: number;
  unique_customers: number;
  average_order: number;
}

interface TopItem {
  item_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface DailySales {
  date: string;
  total_amount: number;
  order_count: number;
}

export default function CanteenReports() {
  const { language } = useLanguage();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
    }

    // Load sales summary
    const { data: orders } = await supabase
      .from('canteen_orders')
      .select('total_amount, student_id, created_at')
      .gte('created_at', startDate.toISOString());

    if (orders) {
      const uniqueStudents = new Set(orders.map(o => o.student_id).filter(Boolean));
      setSalesData({
        total_sales: orders.reduce((sum, o) => sum + o.total_amount, 0),
        total_orders: orders.length,
        unique_customers: uniqueStudents.size,
        average_order: orders.length > 0 
          ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length 
          : 0
      });
    }

    // Load top selling items
    const { data: orderItems } = await supabase
      .from('canteen_orders')
      .select('items, total_amount')
      .gte('created_at', startDate.toISOString());

    if (orderItems) {
      const itemStats: Record<string, { quantity: number; revenue: number }> = {};
      
      orderItems.forEach(order => {
        const items = order.items as any[];
        items.forEach(item => {
          if (!itemStats[item.name]) {
            itemStats[item.name] = { quantity: 0, revenue: 0 };
          }
          itemStats[item.name].quantity += item.quantity;
          itemStats[item.name].revenue += item.price * item.quantity;
        });
      });

      const sortedItems = Object.entries(itemStats)
        .map(([name, stats]) => ({
          item_name: name,
          total_quantity: stats.quantity,
          total_revenue: stats.revenue
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      setTopItems(sortedItems);
    }

    // Load daily sales for chart
    const { data: dailyOrders } = await supabase
      .from('canteen_orders')
      .select('total_amount, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (dailyOrders) {
      const dailyStats: Record<string, { amount: number; count: number }> = {};
      
      dailyOrders.forEach(order => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (!dailyStats[date]) {
          dailyStats[date] = { amount: 0, count: 0 };
        }
        dailyStats[date].amount += order.total_amount;
        dailyStats[date].count += 1;
      });

      const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        total_amount: stats.amount,
        order_count: stats.count
      }));

      setDailySales(dailyData);
    }

    // Load payment methods breakdown
    const { data: paymentData } = await supabase
      .from('canteen_orders')
      .select('payment_method, total_amount')
      .gte('created_at', startDate.toISOString());

    if (paymentData) {
      const methodStats: Record<string, { count: number; amount: number }> = {};
      
      paymentData.forEach(order => {
        const method = order.payment_method;
        if (!methodStats[method]) {
          methodStats[method] = { count: 0, amount: 0 };
        }
        methodStats[method].count += 1;
        methodStats[method].amount += order.total_amount;
      });

      const methodData = Object.entries(methodStats).map(([method, stats]) => ({
        method,
        count: stats.count,
        amount: stats.amount,
        percentage: paymentData.length > 0 ? (stats.count / paymentData.length) * 100 : 0
      }));

      setPaymentMethods(methodData);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          {language === 'en' ? 'Sales Reports' : 'تقارير المبيعات'}
        </h2>
        <Tabs value={period} onValueChange={(v: any) => setPeriod(v)}>
          <TabsList>
            <TabsTrigger value="today">
              {language === 'en' ? 'Today' : 'اليوم'}
            </TabsTrigger>
            <TabsTrigger value="week">
              {language === 'en' ? 'This Week' : 'هذا الأسبوع'}
            </TabsTrigger>
            <TabsTrigger value="month">
              {language === 'en' ? 'This Month' : 'هذا الشهر'}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={language === 'en' ? 'Total Sales' : 'إجمالي المبيعات'}
          value={`${salesData?.total_sales.toFixed(3) || '0.000'} ${language === 'en' ? 'OMR' : 'ر.ع'}`}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          title={language === 'en' ? 'Total Orders' : 'إجمالي الطلبات'}
          value={salesData?.total_orders || 0}
          icon={ShoppingCart}
          trend="up"
          trendValue="+8.2%"
        />
        <StatCard
          title={language === 'en' ? 'Customers' : 'العملاء'}
          value={salesData?.unique_customers || 0}
          icon={Users}
        />
        <StatCard
          title={language === 'en' ? 'Avg Order' : 'متوسط الطلب'}
          value={`${salesData?.average_order.toFixed(3) || '0.000'} ${language === 'en' ? 'OMR' : 'ر.ع'}`}
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {language === 'en' ? 'Top Selling Items' : 'الأصناف الأكثر مبيعاً'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'en' ? 'Item' : 'الصنف'}</TableHead>
                  <TableHead>{language === 'en' ? 'Qty' : 'الكمية'}</TableHead>
                  <TableHead>{language === 'en' ? 'Revenue' : 'الإيراد'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.map((item, index) => (
                  <TableRow key={item.item_name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{item.item_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.total_quantity}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {item.total_revenue.toFixed(3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {language === 'en' ? 'Payment Methods' : 'طرق الدفع'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map(method => (
                <div key={method.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{method.method}</span>
                    <Badge>{method.count} {language === 'en' ? 'orders' : 'طلب'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {method.percentage.toFixed(1)}%
                    </span>
                    <span className="font-bold text-primary">
                      {method.amount.toFixed(3)} {language === 'en' ? 'OMR' : 'ر.ع'}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === 'en' ? 'Daily Sales Trend' : 'اتجاه المبيعات اليومية'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailySales.map(day => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">
                  {format(new Date(day.date), 'MMM dd')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{day.order_count} {language === 'en' ? 'orders' : 'طلب'}</span>
                    <span className="font-bold text-primary">
                      {day.total_amount.toFixed(3)} {language === 'en' ? 'OMR' : 'ر.ع'}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${salesData ? (day.total_amount / salesData.total_sales) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
