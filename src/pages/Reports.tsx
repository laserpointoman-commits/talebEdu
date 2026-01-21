import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  Bus,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  PieChart,
  BarChart3,
  Activity,
  Loader2
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ReportData {
  id: string;
  title: string;
  titleAr: string;
  type: 'attendance' | 'transport' | 'incident' | 'performance' | 'financial';
  date: Date;
  status: 'completed' | 'pending' | 'processing';
  generatedBy: string;
  description: string;
  descriptionAr: string;
}

export default function Reports() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const [selectedDateRange, setSelectedDateRange] = useState('thisMonth');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch attendance stats
  const { data: attendanceStats } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('status, date')
        .gte('date', startOfMonth(new Date()).toISOString().split('T')[0]);
      if (error) throw error;
      
      const total = data.length;
      const present = data.filter(r => r.status === 'present').length;
      const absent = data.filter(r => r.status === 'absent').length;
      return { total, present, absent, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
    }
  });

  // Fetch financial stats
  const { data: financialStats } = useQuery({
    queryKey: ['financial-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('amount, type')
        .gte('transaction_date', startOfMonth(new Date()).toISOString().split('T')[0]);
      if (error) throw error;
      
      const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { income, expense, total: data.length };
    }
  });

  // Fetch student count
  const { data: studentCount = 0 } = useQuery({
    queryKey: ['student-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch bus count
  const { data: busCount = 0 } = useQuery({
    queryKey: ['bus-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('buses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      if (error) throw error;
      return count || 0;
    }
  });

  // Generate dynamic reports based on actual data
  const reports: ReportData[] = [
    {
      id: '1',
      title: 'Monthly Attendance Report',
      titleAr: 'تقرير الحضور الشهري',
      type: 'attendance',
      date: new Date(),
      status: 'completed',
      generatedBy: profile?.full_name || 'System',
      description: `Attendance rate: ${attendanceStats?.rate || 0}% - ${attendanceStats?.present || 0} present out of ${attendanceStats?.total || 0} records`,
      descriptionAr: `معدل الحضور: ${attendanceStats?.rate || 0}% - ${attendanceStats?.present || 0} حاضر من ${attendanceStats?.total || 0} سجل`
    },
    {
      id: '2',
      title: 'Transport Overview',
      titleAr: 'نظرة عامة على النقل',
      type: 'transport',
      date: subDays(new Date(), 2),
      status: 'completed',
      generatedBy: 'System',
      description: `${busCount} active buses serving students`,
      descriptionAr: `${busCount} حافلة نشطة تخدم الطلاب`
    },
    {
      id: '3',
      title: 'Student Enrollment Report',
      titleAr: 'تقرير تسجيل الطلاب',
      type: 'performance',
      date: subDays(new Date(), 5),
      status: 'completed',
      generatedBy: 'Academic Department',
      description: `${studentCount} active students enrolled`,
      descriptionAr: `${studentCount} طالب نشط مسجل`
    },
    {
      id: '4',
      title: 'Financial Summary Report',
      titleAr: 'تقرير الملخص المالي',
      type: 'financial',
      date: subDays(new Date(), 7),
      status: 'completed',
      generatedBy: 'Finance Department',
      description: `Income: ${financialStats?.income || 0} OMR | Expenses: ${financialStats?.expense || 0} OMR`,
      descriptionAr: `الدخل: ${financialStats?.income || 0} ر.ع | المصروفات: ${financialStats?.expense || 0} ر.ع`
    }
  ];

  const stats = [
    {
      title: language === 'en' ? 'Total Students' : language === 'hi' ? 'कुल छात्र' : 'إجمالي الطلاب',
      value: studentCount.toString(),
      change: '+5%',
      icon: Users,
      color: 'text-primary'
    },
    {
      title: language === 'en' ? 'Attendance Rate' : language === 'hi' ? 'उपस्थिति दर' : 'معدل الحضور',
      value: `${attendanceStats?.rate || 0}%`,
      change: '+2%',
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      title: language === 'en' ? 'Active Buses' : language === 'hi' ? 'सक्रिय बसें' : 'الحافلات النشطة',
      value: busCount.toString(),
      change: '0',
      icon: Bus,
      color: 'text-accent'
    },
    {
      title: language === 'en' ? 'This Month Revenue' : language === 'hi' ? 'इस महीने का राजस्व' : 'إيرادات هذا الشهر',
      value: `${financialStats?.income || 0}`,
      change: '+8%',
      icon: DollarSign,
      color: 'text-warning'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { 
        label: language === 'en' ? 'Completed' : language === 'hi' ? 'पूर्ण' : 'مكتمل', 
        variant: 'default' as const 
      },
      pending: { 
        label: language === 'en' ? 'Pending' : language === 'hi' ? 'लंबित' : 'قيد الانتظار', 
        variant: 'outline' as const 
      },
      processing: { 
        label: language === 'en' ? 'Processing' : language === 'hi' ? 'प्रक्रिया में' : 'قيد المعالجة', 
        variant: 'secondary' as const 
      }
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <Users className="h-4 w-4" />;
      case 'transport':
        return <Bus className="h-4 w-4" />;
      case 'incident':
        return <AlertCircle className="h-4 w-4" />;
      case 'performance':
        return <TrendingUp className="h-4 w-4" />;
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    if (selectedType !== 'all' && report.type !== selectedType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.title.toLowerCase().includes(query) ||
        report.titleAr.includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.descriptionAr.includes(query)
      );
    }
    return true;
  });

  // Show driver-specific reports
  if (user?.role === 'driver') {
    const driverReports = reports.filter(r => r.type === 'transport' || r.type === 'incident');
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {language === 'en' ? 'My Reports' : language === 'hi' ? 'मेरी रिपोर्ट' : 'تقاريري'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {language === 'en' 
              ? 'View and manage your driving reports'
              : language === 'hi'
              ? 'अपनी ड्राइविंग रिपोर्ट देखें और प्रबंधित करें'
              : 'عرض وإدارة تقارير القيادة الخاصة بك'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Total Reports' : language === 'hi' ? 'कुल रिपोर्ट' : 'إجمالي التقارير'}
                  </p>
                  <p className="text-2xl font-bold">{driverReports.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'This Month' : language === 'hi' ? 'इस महीने' : 'هذا الشهر'}
                  </p>
                  <p className="text-2xl font-bold">{driverReports.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Incidents' : language === 'hi' ? 'घटनाएं' : 'الحوادث'}
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <AlertCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Recent Reports' : language === 'hi' ? 'हाल की रिपोर्ट' : 'التقارير الأخيرة'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {driverReports.map(report => (
                  <div key={report.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-background rounded-lg">
                          {getTypeIcon(report.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {language === 'en' ? report.title : report.titleAr}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {language === 'en' ? report.description : report.descriptionAr}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(report.date, 'MMM dd, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {report.generatedBy}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin view
  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 via-primary to-sky-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {language === 'en' ? 'Reports & Analytics' : language === 'hi' ? 'रिपोर्ट और विश्लेषिकी' : 'التقارير والتحليلات'}
              </h2>
              <p className="text-sky-100 text-sm">
                {language === 'en' 
                  ? 'Generate and view comprehensive school reports'
                  : language === 'hi'
                  ? 'व्यापक स्कूल रिपोर्ट बनाएं और देखें'
                  : 'إنشاء وعرض تقارير المدرسة الشاملة'}
              </p>
            </div>
          </div>
          <Button className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0">
            <Download className="h-4 w-4" />
            {language === 'en' ? 'Export All' : language === 'hi' ? 'सभी निर्यात करें' : 'تصدير الكل'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-primary to-sky-600" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className={`text-xs mt-1 ${
                    stat.change.startsWith('+') ? 'text-green-500' : 'text-muted-foreground'
                  }`}>
                    {stat.change} {language === 'en' ? 'from last month' : language === 'hi' ? 'पिछले महीने से' : 'من الشهر الماضي'}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-400/20 to-primary/20 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {language === 'en' ? 'Filters' : language === 'hi' ? 'फ़िल्टर' : 'الفلاتر'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>{language === 'en' ? 'Search' : language === 'hi' ? 'खोजें' : 'بحث'}</Label>
              <Input
                placeholder={language === 'en' ? 'Search reports...' : language === 'hi' ? 'रिपोर्ट खोजें...' : 'البحث في التقارير...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Type' : language === 'hi' ? 'प्रकार' : 'النوع'}</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'en' ? 'All Types' : language === 'hi' ? 'सभी प्रकार' : 'جميع الأنواع'}
                  </SelectItem>
                  <SelectItem value="attendance">
                    {language === 'en' ? 'Attendance' : language === 'hi' ? 'उपस्थिति' : 'الحضور'}
                  </SelectItem>
                  <SelectItem value="transport">
                    {language === 'en' ? 'Transport' : language === 'hi' ? 'परिवहन' : 'النقل'}
                  </SelectItem>
                  <SelectItem value="performance">
                    {language === 'en' ? 'Performance' : language === 'hi' ? 'प्रदर्शन' : 'الأداء'}
                  </SelectItem>
                  <SelectItem value="financial">
                    {language === 'en' ? 'Financial' : language === 'hi' ? 'वित्तीय' : 'المالية'}
                  </SelectItem>
                  <SelectItem value="incident">
                    {language === 'en' ? 'Incidents' : language === 'hi' ? 'घटनाएं' : 'الحوادث'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'en' ? 'Date Range' : language === 'hi' ? 'तिथि सीमा' : 'النطاق الزمني'}</Label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">
                    {language === 'en' ? 'Today' : language === 'hi' ? 'आज' : 'اليوم'}
                  </SelectItem>
                  <SelectItem value="thisWeek">
                    {language === 'en' ? 'This Week' : language === 'hi' ? 'इस सप्ताह' : 'هذا الأسبوع'}
                  </SelectItem>
                  <SelectItem value="thisMonth">
                    {language === 'en' ? 'This Month' : language === 'hi' ? 'इस महीने' : 'هذا الشهر'}
                  </SelectItem>
                  <SelectItem value="lastMonth">
                    {language === 'en' ? 'Last Month' : language === 'hi' ? 'पिछला महीना' : 'الشهر الماضي'}
                  </SelectItem>
                  <SelectItem value="thisYear">
                    {language === 'en' ? 'This Year' : language === 'hi' ? 'इस साल' : 'هذه السنة'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                {language === 'en' ? 'Generate Report' : language === 'hi' ? 'रिपोर्ट बनाएं' : 'إنشاء تقرير'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="all" className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className={language === 'ar' ? 'flex-row-reverse' : ''}>
          <TabsTrigger value="all">
            {language === 'en' ? 'All Reports' : language === 'hi' ? 'सभी रिपोर्ट' : 'جميع التقارير'}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {language === 'en' ? 'Analytics' : language === 'hi' ? 'विश्लेषिकी' : 'التحليلات'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-6 space-y-3">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === 'en' ? 'No reports found' : language === 'hi' ? 'कोई रिपोर्ट नहीं मिली' : 'لا توجد تقارير'}</p>
                    </div>
                  ) : (
                    filteredReports.map(report => (
                      <div key={report.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-background rounded-lg">
                              {getTypeIcon(report.type)}
                            </div>
                            <div>
                              <h4 className="font-semibold">
                                {language === 'en' ? report.title : report.titleAr}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {language === 'en' ? report.description : report.descriptionAr}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(report.date, 'MMM dd, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {report.generatedBy}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(report.status)}
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {language === 'en' ? 'Attendance Overview' : language === 'hi' ? 'उपस्थिति अवलोकन' : 'نظرة عامة على الحضور'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-success">{attendanceStats?.rate || 0}%</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === 'en' ? 'Average Attendance Rate' : language === 'hi' ? 'औसत उपस्थिति दर' : 'متوسط معدل الحضور'}
                    </p>
                    <div className="flex gap-4 justify-center mt-4 text-sm">
                      <span className="text-success">
                        {language === 'en' ? 'Present:' : language === 'hi' ? 'उपस्थित:' : 'حاضر:'} {attendanceStats?.present || 0}
                      </span>
                      <span className="text-destructive">
                        {language === 'en' ? 'Absent:' : language === 'hi' ? 'अनुपस्थित:' : 'غائب:'} {attendanceStats?.absent || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {language === 'en' ? 'Financial Summary' : language === 'hi' ? 'वित्तीय सारांश' : 'الملخص المالي'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{financialStats?.income || 0} OMR</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === 'en' ? 'Total Revenue This Month' : language === 'hi' ? 'इस महीने कुल राजस्व' : 'إجمالي الإيرادات هذا الشهر'}
                    </p>
                    <div className="flex gap-4 justify-center mt-4 text-sm">
                      <span className="text-success">
                        {language === 'en' ? 'Income:' : language === 'hi' ? 'आय:' : 'الدخل:'} {financialStats?.income || 0}
                      </span>
                      <span className="text-destructive">
                        {language === 'en' ? 'Expenses:' : language === 'hi' ? 'व्यय:' : 'المصروفات:'} {financialStats?.expense || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
