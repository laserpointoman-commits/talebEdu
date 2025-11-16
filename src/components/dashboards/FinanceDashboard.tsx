import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  TrendingUp, 
  Receipt, 
  CreditCard,
  FileText,
  PieChart,
  Calculator,
  BanknoteIcon,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LogoLoader from '@/components/LogoLoader';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    outstandingFees: 0,
    studentsWithFees: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      // Get total revenue (income transactions)
      const { data: incomeData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'income');

      const totalRevenue = incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get total expenses
      const { data: expenseData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'expense');

      const totalExpenses = expenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get outstanding fees from fee_payments and student_fees tables
      const { data: feesData } = await supabase
        .from('fee_payments')
        .select('amount');

      const outstandingFees = 0; // Calculate based on unpaid fees
      const studentsWithFees = 0;

      // Get recent transactions
      const { data: recentData } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(3);

      const formattedActivity = recentData?.map(trans => ({
        title: language === 'ar' ? (trans.description_ar || trans.description) : trans.description,
        amount: `${Number(trans.amount).toFixed(3)} OMR`,
        time: new Date(trans.transaction_date).toLocaleString(language === 'ar' ? 'ar-OM' : 'en-US'),
        type: trans.type === 'income' ? 'income' : 'expense'
      })) || [];

      setStats({
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        outstandingFees,
        studentsWithFees
      });

      setRecentActivity(formattedActivity);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const financeModules = [
    {
      title: language === 'ar' ? 'لوحة التحكم المالية' : 'Financial Dashboard',
      description: language === 'ar' ? 'عرض الإحصائيات والتقارير المالية' : 'View financial statistics and reports',
      icon: PieChart,
      path: '/dashboard/finance',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: language === 'ar' ? 'إدارة الحسابات' : 'Account Management',
      description: language === 'ar' ? 'إدارة الحسابات المالية والميزانيات' : 'Manage financial accounts and budgets',
      icon: Calculator,
      path: '/dashboard/finance',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: language === 'ar' ? 'المعاملات' : 'Transactions',
      description: language === 'ar' ? 'عرض وإدارة جميع المعاملات المالية' : 'View and manage all financial transactions',
      icon: Receipt,
      path: '/dashboard/finance',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: language === 'ar' ? 'رسوم الطلاب' : 'Student Fees',
      description: language === 'ar' ? 'إدارة رسوم الطلاب والمدفوعات' : 'Manage student fees and payments',
      icon: CreditCard,
      path: '/dashboard/finance',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: language === 'ar' ? 'التقارير المالية' : 'Financial Reports',
      description: language === 'ar' ? 'إنشاء وتصدير التقارير المالية' : 'Generate and export financial reports',
      icon: FileText,
      path: '/dashboard/finance',
      color: 'from-rose-500 to-rose-600'
    },
    {
      title: language === 'ar' ? 'الرواتب' : 'Payroll',
      description: language === 'ar' ? 'إدارة رواتب الموظفين' : 'Manage employee salaries',
      icon: BanknoteIcon,
      path: '/dashboard/payroll',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const quickStats = [
    {
      label: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
      value: `${stats.totalRevenue.toFixed(3)} OMR`,
      change: '',
      positive: true
    },
    {
      label: language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses',
      value: `${stats.totalExpenses.toFixed(3)} OMR`,
      change: '',
      positive: false
    },
    {
      label: language === 'ar' ? 'صافي الدخل' : 'Net Income',
      value: `${stats.netIncome.toFixed(3)} OMR`,
      change: '',
      positive: true
    },
    {
      label: language === 'ar' ? 'الرسوم المستحقة' : 'Outstanding Fees',
      value: `${stats.outstandingFees.toFixed(3)} OMR`,
      change: `${stats.studentsWithFees} ${language === 'ar' ? 'طالب' : 'students'}`,
      positive: null
    }
  ];

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          {language === 'ar' 
            ? `مرحباً ${profile?.full_name_ar || profile?.full_name}` 
            : `Welcome ${profile?.full_name}`}
        </h1>
        <p className="text-sm sm:text-base opacity-90">
          {language === 'ar' 
            ? 'لوحة التحكم المالي - إدارة جميع العمليات المالية للمدرسة'
            : 'Finance Dashboard - Manage all school financial operations'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card 
            key={index} 
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
            onClick={() => navigate('/dashboard/finance')}
          >
          
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
              {stat.positive !== null && (
                <div className="flex items-center mt-2">
                  <TrendingUp 
                    className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${
                      stat.positive ? 'text-green-600' : 'text-red-600 rotate-180'
                    }`} 
                  />
                  <span className={`text-xs sm:text-sm ${
                    stat.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              )}
              {stat.positive === null && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">{stat.change}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Finance Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {financeModules.map((module, index) => (
          <Card 
            key={index} 
            className="hover:shadow-xl transition-all cursor-pointer border-0 min-h-[100px] md:min-h-[120px]"
            onClick={() => navigate(module.path)}
          >
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-gradient-to-r ${module.color} flex items-center justify-center`}>
                  <module.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-base sm:text-lg mb-1">{module.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card 
        className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        onClick={() => navigate('/dashboard/finance')}
      >
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'لا توجد معاملات حديثة' : 'No recent transactions'}
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${
                      activity.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      <Wallet className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        activity.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{activity.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <p className={`font-semibold text-sm sm:text-base whitespace-nowrap ${
                    activity.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {activity.type === 'income' ? '+' : '-'}{activity.amount}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;