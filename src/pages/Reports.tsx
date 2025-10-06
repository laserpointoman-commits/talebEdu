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
  Activity
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface Report {
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

  const reports: Report[] = [
    {
      id: '1',
      title: 'Monthly Attendance Report',
      titleAr: 'تقرير الحضور الشهري',
      type: 'attendance',
      date: new Date(),
      status: 'completed',
      generatedBy: profile?.full_name || 'System',
      description: 'Comprehensive attendance analysis for all students',
      descriptionAr: 'تحليل شامل للحضور لجميع الطلاب'
    },
    {
      id: '2',
      title: 'Bus Route Efficiency Report',
      titleAr: 'تقرير كفاءة مسارات الحافلات',
      type: 'transport',
      date: subDays(new Date(), 2),
      status: 'completed',
      generatedBy: 'Ali Mohammed',
      description: 'Analysis of bus routes and timing optimization',
      descriptionAr: 'تحليل مسارات الحافلات وتحسين التوقيت'
    },
    {
      id: '3',
      title: 'Student Performance Overview',
      titleAr: 'نظرة عامة على أداء الطلاب',
      type: 'performance',
      date: subDays(new Date(), 5),
      status: 'processing',
      generatedBy: 'Academic Department',
      description: 'Quarterly academic performance metrics',
      descriptionAr: 'مقاييس الأداء الأكاديمي الربع سنوية'
    },
    {
      id: '4',
      title: 'Financial Summary Report',
      titleAr: 'تقرير الملخص المالي',
      type: 'financial',
      date: subDays(new Date(), 7),
      status: 'completed',
      generatedBy: 'Finance Department',
      description: 'Monthly financial transactions and fee collection',
      descriptionAr: 'المعاملات المالية الشهرية وتحصيل الرسوم'
    },
    {
      id: '5',
      title: 'Safety Incident Report',
      titleAr: 'تقرير حوادث السلامة',
      type: 'incident',
      date: subDays(new Date(), 10),
      status: 'completed',
      generatedBy: 'Safety Officer',
      description: 'Documentation of safety incidents and resolutions',
      descriptionAr: 'توثيق حوادث السلامة والحلول'
    }
  ];

  const stats = [
    {
      title: language === 'en' ? 'Total Reports' : 'إجمالي التقارير',
      value: '156',
      change: '+12%',
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: language === 'en' ? 'This Month' : 'هذا الشهر',
      value: '24',
      change: '+8%',
      icon: Calendar,
      color: 'text-accent'
    },
    {
      title: language === 'en' ? 'Pending' : 'قيد الانتظار',
      value: '3',
      change: '-2',
      icon: Clock,
      color: 'text-warning'
    },
    {
      title: language === 'en' ? 'Completed' : 'مكتمل',
      value: '21',
      change: '+10',
      icon: CheckCircle,
      color: 'text-success'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { 
        label: language === 'en' ? 'Completed' : 'مكتمل', 
        variant: 'default' as const 
      },
      pending: { 
        label: language === 'en' ? 'Pending' : 'قيد الانتظار', 
        variant: 'outline' as const 
      },
      processing: { 
        label: language === 'en' ? 'Processing' : 'قيد المعالجة', 
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
            {language === 'en' ? 'My Reports' : 'تقاريري'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {language === 'en' 
              ? 'View and manage your driving reports'
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
                    {language === 'en' ? 'Total Reports' : 'إجمالي التقارير'}
                  </p>
                  <p className="text-2xl font-bold">12</p>
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
                    {language === 'en' ? 'This Month' : 'هذا الشهر'}
                  </p>
                  <p className="text-2xl font-bold">3</p>
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
                    {language === 'en' ? 'Incidents' : 'الحوادث'}
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
            <CardTitle>{language === 'en' ? 'Recent Reports' : 'التقارير الأخيرة'}</CardTitle>
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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {language === 'en' ? 'Reports & Analytics' : 'التقارير والتحليلات'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {language === 'en' 
              ? 'Generate and view comprehensive school reports'
              : 'إنشاء وعرض تقارير المدرسة الشاملة'}
          </p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          {language === 'en' ? 'Export All' : 'تصدير الكل'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs mt-1 ${
                    stat.change.startsWith('+') ? 'text-success' : 'text-destructive'
                  }`}>
                    {stat.change} {language === 'en' ? 'from last month' : 'من الشهر الماضي'}
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
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
            {language === 'en' ? 'Filters' : 'الفلاتر'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>{language === 'en' ? 'Search' : 'بحث'}</Label>
              <Input
                placeholder={language === 'en' ? 'Search reports...' : 'البحث في التقارير...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Type' : 'النوع'}</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'en' ? 'All Types' : 'جميع الأنواع'}
                  </SelectItem>
                  <SelectItem value="attendance">
                    {language === 'en' ? 'Attendance' : 'الحضور'}
                  </SelectItem>
                  <SelectItem value="transport">
                    {language === 'en' ? 'Transport' : 'النقل'}
                  </SelectItem>
                  <SelectItem value="performance">
                    {language === 'en' ? 'Performance' : 'الأداء'}
                  </SelectItem>
                  <SelectItem value="financial">
                    {language === 'en' ? 'Financial' : 'المالية'}
                  </SelectItem>
                  <SelectItem value="incident">
                    {language === 'en' ? 'Incidents' : 'الحوادث'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'en' ? 'Date Range' : 'النطاق الزمني'}</Label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">
                    {language === 'en' ? 'Today' : 'اليوم'}
                  </SelectItem>
                  <SelectItem value="thisWeek">
                    {language === 'en' ? 'This Week' : 'هذا الأسبوع'}
                  </SelectItem>
                  <SelectItem value="thisMonth">
                    {language === 'en' ? 'This Month' : 'هذا الشهر'}
                  </SelectItem>
                  <SelectItem value="lastMonth">
                    {language === 'en' ? 'Last Month' : 'الشهر الماضي'}
                  </SelectItem>
                  <SelectItem value="thisYear">
                    {language === 'en' ? 'This Year' : 'هذه السنة'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                {language === 'en' ? 'Generate Report' : 'إنشاء تقرير'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="all" className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className={language === 'ar' ? 'flex-row-reverse' : ''}>
          <TabsTrigger value="all">
            {language === 'en' ? 'All Reports' : 'جميع التقارير'}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {language === 'en' ? 'Analytics' : 'التحليلات'}
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            {language === 'en' ? 'Scheduled' : 'المجدولة'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-6 space-y-3">
                  {filteredReports.map(report => (
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
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {language === 'en' ? 'Report Distribution' : 'توزيع التقارير'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Chart visualization here' : 'عرض الرسم البياني هنا'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {language === 'en' ? 'Monthly Trends' : 'الاتجاهات الشهرية'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Trend analysis here' : 'تحليل الاتجاهات هنا'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Scheduled Reports' : 'التقارير المجدولة'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'en' 
                    ? 'No scheduled reports. Set up automatic report generation.'
                    : 'لا توجد تقارير مجدولة. قم بإعداد إنشاء التقارير التلقائية.'}
                </p>
                <Button className="mt-4">
                  {language === 'en' ? 'Schedule Report' : 'جدولة تقرير'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}