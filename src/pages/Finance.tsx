import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { TrendingUp, TrendingDown, Wallet, CreditCard, Users, Calendar, Download, ArrowUpRight, ArrowDownRight, FileText, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoLoader from '@/components/LogoLoader';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AddTransactionDialog } from '@/components/finance/AddTransactionDialog';
import { TransactionsList } from '@/components/finance/TransactionsList';

interface FinancialAccount {
  id: string;
  name: string;
  name_ar: string;
  account_type: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  transaction_date: string;
  status: string;
  user_name?: string;
}

const Finance = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netIncome, setNetIncome] = useState(0);
  const [outstandingFees, setOutstandingFees] = useState(0);
  const [incomeChange, setIncomeChange] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch financial accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('financial_accounts')
        .select('*')
        .order('name');

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Fetch ALL transactions to calculate totals
      const { data: allTransData, error: allTransError } = await supabase
        .from('financial_transactions')
        .select('*');

      if (allTransError) throw allTransError;

      // Calculate totals from actual transactions
      const revenue = allTransData?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const expenses = allTransData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      setTotalRevenue(revenue);
      setTotalExpenses(expenses);
      setNetIncome(revenue - expenses);

      // Fetch outstanding fees from student_fees table
      const { data: feesData, error: feesError } = await supabase
        .from('student_fees')
        .select('amount, paid_amount');
      
      if (!feesError && feesData) {
        const outstanding = feesData.reduce((sum, fee) => {
          const remaining = Number(fee.amount || 0) - Number(fee.paid_amount || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
        setOutstandingFees(outstanding);
      } else {
        setOutstandingFees(0);
      }

      // Fetch recent transactions
      const { data: transData, error: transError } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(10);

      if (transError) throw transError;
      setTransactions(transData || []);

      // Fetch real monthly data from database
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: monthlyTransactions, error: monthlyError } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', sixMonthsAgo.toISOString());
      
      if (!monthlyError && monthlyTransactions) {
        // Group by month
        const monthlyMap = new Map();
        const categoryMap = new Map();
        
        monthlyTransactions.forEach(trans => {
          const date = new Date(trans.transaction_date);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { month: monthKey, revenue: 0, expenses: 0, profit: 0 });
          }
          
          const entry = monthlyMap.get(monthKey);
          if (trans.type === 'income') {
            entry.revenue += Number(trans.amount);
            
            // Track revenue by category for pie chart
            const category = trans.category || 'Other';
            if (!categoryMap.has(category)) {
              categoryMap.set(category, 0);
            }
            categoryMap.set(category, categoryMap.get(category) + Number(trans.amount));
          } else {
            entry.expenses += Number(trans.amount);
          }
          entry.profit = entry.revenue - entry.expenses;
        });
        
        setMonthlyData(Array.from(monthlyMap.values()));
        
        // Set pie chart data from categories
        const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const pieChartData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }));
        setPieData(pieChartData);
      } else {
        setMonthlyData([]);
        setPieData([]);
      }

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل البيانات المالية' : 'Failed to load financial data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} OMR`;
  };


  if (effectiveRole !== 'admin' && effectiveRole !== 'parent' && effectiveRole !== 'finance' && effectiveRole !== 'developer') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {language === 'ar' ? 'ليس لديك صلاحية لعرض هذه الصفحة' : 'You do not have permission to view this page'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LogoLoader size="large" text={true} fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-7xl space-y-6">
        <PageHeader
          showBackButton
          title="Financial System"
          titleAr="النظام المالي"
          subtitle="Comprehensive Financial Dashboard"
          subtitleAr="لوحة التحكم المالية الشاملة"
          actions={
            <div className="flex gap-2">
              <AddTransactionDialog onTransactionAdded={fetchFinancialData} />
              <Button className="bg-gradient-to-r from-primary to-primary/80" variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
            </div>
          }
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/dashboard/finance')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                    <span className="text-sm">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/dashboard/finance')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}
                  </p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(totalExpenses)}
                  </p>
                  <div className="flex items-center mt-2 text-red-600 dark:text-red-400">
                    <span className="text-sm">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/dashboard/finance')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {language === 'ar' ? 'صافي الدخل' : 'Net Income'}
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(netIncome)}
                  </p>
                  <div className="flex items-center mt-2 text-blue-600 dark:text-blue-400">
                    <span className="text-sm">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/dashboard/reports')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {language === 'ar' ? 'الرسوم المستحقة' : 'Outstanding Fees'}
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(outstandingFees)}
                  </p>
                  <div className="flex items-center mt-2 text-purple-600 dark:text-purple-400">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">{language === 'ar' ? 'مستحق' : 'Outstanding'}</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Tabs - Added margin-top for spacing */}
        <Tabs defaultValue="transactions" className="space-y-4 mt-8">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto lg:mx-0 h-auto p-1 bg-muted" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 flex items-center">
              <FileText className={`w-6 h-6 mr-2 ${language === 'ar' ? 'ml-2' : ''} text-blue-500 [&[data-state=active]]:text-primary-foreground`} />
              <span className="[&[data-state=active]]:text-primary-foreground">
                {language === 'ar' ? 'المعاملات' : 'Transactions'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 flex items-center">
              <TrendingUp className={`w-6 h-6 mr-2 ${language === 'ar' ? 'ml-2' : ''} text-green-500 [&[data-state=active]]:text-primary-foreground`} />
              <span className="[&[data-state=active]]:text-primary-foreground">
                {language === 'ar' ? 'نظرة عامة' : 'Overview'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 flex items-center">
              <Wallet className={`w-6 h-6 mr-2 ${language === 'ar' ? 'ml-2' : ''} text-yellow-500 [&[data-state=active]]:text-primary-foreground`} />
              <span className="[&[data-state=active]]:text-primary-foreground">
                {language === 'ar' ? 'الإيرادات' : 'Revenue'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 flex items-center">
              <Calendar className={`w-6 h-6 mr-2 ${language === 'ar' ? 'ml-2' : ''} text-purple-500 [&[data-state=active]]:text-primary-foreground`} />
              <span className="[&[data-state=active]]:text-primary-foreground">
                {language === 'ar' ? 'التحليل' : 'Analysis'}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <TransactionsList />
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'الأداء المالي الشهري' : 'Monthly Financial Performance'}</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="w-full overflow-x-auto">
                    <ResponsiveContainer width="100%" height={300} minWidth={300}>
                      <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} width={60} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorExpenses)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'توزيع الإيرادات' : 'Revenue Distribution'}</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="w-full overflow-x-auto">
                    <ResponsiveContainer width="100%" height={300} minWidth={250}>
                      <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius="70%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value: any, entry: any) => `${value}: ${entry.payload.value.toFixed(3)} OMR`}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'تحليل الإيرادات' : 'Revenue Analysis'}</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={350} minWidth={400}>
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} width={60} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                       <Bar dataKey="revenue" name={language === 'ar' ? 'الإيرادات' : 'Revenue'} fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                       <Bar dataKey="profit" name={language === 'ar' ? 'الربح' : 'Profit'} fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((account) => (
                <Card key={account.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {account.account_type.toUpperCase()}
                        </p>
                        <p className="text-lg font-semibold mt-1">
                          {language === 'ar' ? account.name_ar : account.name}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
                        </span>
                        <span className={account.account_type === 'revenue' ? 'text-green-600' : 'text-red-600'}>
                          {language === 'ar' 
                            ? (account.account_type === 'revenue' ? 'إيرادات' : 'مصروفات')
                            : (account.account_type === 'revenue' ? 'Revenue' : 'Expense')
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Finance;