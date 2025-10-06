import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateAdminPassword } from '@/components/temp/UpdateAdminPassword';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Code, Settings, Database, Users, Shield, Activity, 
  Terminal, Bug, Zap, Globe, Bell, CreditCard, 
  Package, GitBranch, Clock, AlertCircle, CheckCircle,
  RefreshCw, Download, Upload, Trash2, Edit, Eye,
  Lock, Unlock, Play, Pause, BarChart, PieChart,
  Server, Cpu, HardDrive, Wifi, WifiOff, ChevronRight,
  UserCircle, GraduationCap, Car, School, Monitor,
  FileText, Search, Filter, Copy, Save, FolderOpen,
  Layers, Box, Gauge, Wrench, Palette, Mail,
  MessageSquare, Phone, MapPin, Calendar, Link,
  Cloud, CloudOff, Archive, AlertTriangle, Info
} from 'lucide-react';

interface RoleCard {
  role: 'admin' | 'teacher' | 'parent' | 'student' | 'driver' | 'canteen';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ReactNode;
  color: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  activeUsers: number;
  apiCalls: number;
  errorRate: number;
}

interface FeatureToggle {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  enabled: boolean;
  category: string;
}

const DeveloperDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isRTL = language === 'ar';
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');
  const [isLoading, setIsLoading] = useState(false);
  
  // System metrics state
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    storage: 38,
    activeUsers: 127,
    apiCalls: 15420,
    errorRate: 0.3
  });

  // Feature toggles state
  const [features, setFeatures] = useState<FeatureToggle[]>([
    { id: '1', name: 'NFC Authentication', nameAr: 'مصادقة NFC', description: 'Enable NFC card authentication', descriptionAr: 'تمكين مصادقة بطاقة NFC', enabled: true, category: 'auth' },
    { id: '2', name: 'Biometric Login', nameAr: 'تسجيل الدخول البيومتري', description: 'Allow biometric authentication', descriptionAr: 'السماح بالمصادقة البيومترية', enabled: true, category: 'auth' },
    { id: '3', name: 'Real-time Tracking', nameAr: 'التتبع في الوقت الفعلي', description: 'Enable live bus tracking', descriptionAr: 'تمكين تتبع الحافلة المباشر', enabled: true, category: 'transport' },
    { id: '4', name: 'Push Notifications', nameAr: 'الإشعارات الفورية', description: 'Send push notifications', descriptionAr: 'إرسال الإشعارات الفورية', enabled: false, category: 'communication' },
    { id: '5', name: 'Payment Gateway', nameAr: 'بوابة الدفع', description: 'Online payment processing', descriptionAr: 'معالجة الدفع عبر الإنترنت', enabled: true, category: 'finance' },
    { id: '6', name: 'AI Chatbot', nameAr: 'روبوت الدردشة الذكي', description: 'AI-powered support chat', descriptionAr: 'دردشة الدعم بالذكاء الاصطناعي', enabled: false, category: 'support' },
  ]);

  // Simulate real-time metrics update
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(100, Math.max(0, prev.memory + (Math.random() - 0.5) * 5)),
        storage: Math.min(100, Math.max(0, prev.storage + (Math.random() - 0.5) * 2)),
        activeUsers: Math.max(0, prev.activeUsers + Math.floor((Math.random() - 0.5) * 10)),
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 50),
        errorRate: Math.min(5, Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.2))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const roles: RoleCard[] = [
    {
      role: 'admin',
      title: 'Administrator',
      titleAr: 'المسؤول',
      description: 'Full system control',
      descriptionAr: 'التحكم الكامل في النظام',
      icon: <Shield className="h-5 w-5" />,
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    },
    {
      role: 'teacher',
      title: 'Teacher',
      titleAr: 'المعلم',
      description: 'Academic management',
      descriptionAr: 'الإدارة الأكاديمية',
      icon: <School className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    {
      role: 'parent',
      title: 'Parent',
      titleAr: 'ولي الأمر',
      description: 'Student monitoring',
      descriptionAr: 'مراقبة الطالب',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    {
      role: 'student',
      title: 'Student',
      titleAr: 'الطالب',
      description: 'Academic access',
      descriptionAr: 'الوصول الأكاديمي',
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    {
      role: 'driver',
      title: 'Driver',
      titleAr: 'السائق',
      description: 'Transport management',
      descriptionAr: 'إدارة النقل',
      icon: <Car className="h-5 w-5" />,
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    },
    {
      role: 'canteen',
      title: 'Canteen Staff',
      titleAr: 'موظف المقصف',
      description: 'POS & sales management',
      descriptionAr: 'إدارة المبيعات ونقطة البيع',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  ];

  const handleRoleSwitch = (role: string) => {
    setSelectedRole(role);
    sessionStorage.setItem('developerViewRole', role);
    toast.success(language === 'ar' 
      ? `تم التبديل إلى دور ${roles.find(r => r.role === role)?.titleAr}`
      : `Switched to ${role} role`
    );
    // Reload to apply the role change
    setTimeout(() => window.location.href = '/dashboard', 500);
  };

  const handleFeatureToggle = (featureId: string) => {
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, enabled: !f.enabled } : f
    ));
    const feature = features.find(f => f.id === featureId);
    toast.success(language === 'ar' 
      ? `${feature?.nameAr} ${feature?.enabled ? 'معطل' : 'مفعل'}`
      : `${feature?.name} ${feature?.enabled ? 'disabled' : 'enabled'}`
    );
  };

  const handleClearCache = () => {
    sessionStorage.clear();
    localStorage.clear();
    toast.success(language === 'ar' ? 'تم مسح ذاكرة التخزين المؤقت' : 'Cache cleared successfully');
  };

  const handleExportData = async () => {
    setIsLoading(true);
    // Simulate data export
    setTimeout(() => {
      setIsLoading(false);
      toast.success(language === 'ar' ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
    }, 2000);
  };

  const handleRunDiagnostics = async () => {
    setIsLoading(true);
    // Simulate diagnostics
    setTimeout(() => {
      setIsLoading(false);
      toast.success(language === 'ar' ? 'اكتمل التشخيص - لا توجد مشاكل' : 'Diagnostics complete - No issues found');
    }, 3000);
  };

  return (
    <div className={`container max-w-full mx-auto p-4 md:p-6 space-y-4 overflow-x-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Compact Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="py-3 px-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Code className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">
                {language === 'ar' ? 'لوحة تحكم المطور' : 'Developer Control Panel'}
              </CardTitle>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Badge 
                variant={selectedEnvironment === 'production' ? 'destructive' : selectedEnvironment === 'staging' ? 'secondary' : 'outline'} 
                className="text-xs px-2 py-1"
              >
                <Monitor className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                <span>{language === 'ar' ? 'مطور' : 'Dev'}</span>
              </Badge>
              <Select value={selectedEnvironment} onValueChange={(value) => {
                setSelectedEnvironment(value);
                toast.info(language === 'ar' 
                  ? `تم التبديل إلى بيئة ${value === 'development' ? 'التطوير' : value === 'staging' ? 'التجريب' : 'الإنتاج'}`
                  : `Switched to ${value} environment`
                );
              }}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm">Development</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="staging">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Staging</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="production">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm">Production</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Password Reset Tool */}
      <UpdateAdminPassword />

      {/* Role Testing - Prominent Position */}
      <Card className="border-2 border-primary/30 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <UserCircle className="h-5 w-5" />
            {language === 'ar' ? 'اختبار الأدوار' : 'Role Testing'}
          </CardTitle>
          <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'قم بالتبديل بين الأدوار المختلفة لاختبار الميزات' : 'Switch between different roles to test features'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 ${isRTL ? 'direction-rtl' : ''}`}>
            {roles.map((role) => (
              <Card
                key={role.role}
                className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                  selectedRole === role.role ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleRoleSwitch(role.role)}
              >
                <CardContent className={`p-4 text-center ${isRTL ? 'rtl' : 'ltr'}`}>
                  <div className={`mx-auto mb-2 p-3 rounded-full ${role.color} w-fit`}>
                    {role.icon}
                  </div>
                  <h3 className="font-semibold text-sm">
                    {language === 'ar' ? role.titleAr : role.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? role.descriptionAr : role.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Visibility Control */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Eye className="h-5 w-5" />
            {language === 'ar' ? 'التحكم في ظهور الميزات' : 'Feature Visibility Control'}
          </CardTitle>
          <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'إدارة الميزات المرئية لكل دور' : 'Manage which features are visible for each role'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/dashboard/admin/feature-visibility')}
            className="w-full"
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'فتح لوحة التحكم' : 'Open Control Panel'}
          </Button>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className={`overflow-x-auto pb-2`} dir={isRTL ? 'rtl' : 'ltr'}>
          <TabsList className={`inline-flex h-auto gap-2 bg-card p-1 min-w-full lg:min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <TabsTrigger 
              value="settings" 
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 px-3 py-2 data-[state=active]:bg-gray-600 data-[state=active]:text-white`}
            >
              <Settings className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'إعدادات' : 'Settings'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 px-3 py-2 data-[state=active]:bg-red-500 data-[state=active]:text-white`}
            >
              <Terminal className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'سجلات' : 'Logs'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 px-3 py-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white`}
            >
              <Link className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'تكاملات' : 'Integrate'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="features" 
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 px-3 py-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-white`}
            >
              <Zap className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'ميزات' : 'Features'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 px-3 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white`}
            >
              <Users className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'مستخدمون' : 'Users'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="database" 
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 px-3 py-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white`}
            >
              <Database className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'البيانات' : 'Database'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="monitoring" 
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 px-3 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white`}
            >
              <Activity className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'مراقبة' : 'Monitor'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="overview" 
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 px-3 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white`}
            >
              <Gauge className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'نظرة' : 'Overview'}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* System Status */}
          <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${isRTL ? 'direction-rtl' : ''}`}>
            <Card>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'حالة النظام' : 'System Status'}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {language === 'ar' ? 'نشط' : 'Operational'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'جميع الأنظمة تعمل' : 'All systems running'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? '+12% من الأمس' : '+12% from yesterday'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'طلبات API' : 'API Requests'}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.apiCalls.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'آخر 24 ساعة' : 'Last 24 hours'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'معدل الخطأ' : 'Error Rate'}
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold number-display">{metrics.errorRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? '↓ 0.2% من الأمس' : '↓ 0.2% from yesterday'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الإجراءات السريعة' : 'Quick Actions'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أدوات التطوير والصيانة السريعة' : 'Quick development and maintenance tools'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <Card 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                onClick={() => {
                  if (!isLoading) {
                    handleClearCache();
                  }
                }}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors">
                    <Trash2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="font-semibold text-sm">{language === 'ar' ? 'مسح الذاكرة' : 'Clear Cache'}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'حذف البيانات المؤقتة' : 'Remove temp data'}</p>
                </CardContent>
              </Card>

              <Card 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                onClick={() => {
                  if (!isLoading) {
                    handleExportData();
                  }
                }}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                    <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="font-semibold text-sm">{language === 'ar' ? 'تصدير البيانات' : 'Export Data'}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'تنزيل كل البيانات' : 'Download all data'}</p>
                </CardContent>
              </Card>

              <Card 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                onClick={() => {
                  if (!isLoading) {
                    handleRunDiagnostics();
                  }
                }}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 group-hover:bg-red-200 dark:group-hover:bg-red-900/30 transition-colors">
                    <Bug className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="font-semibold text-sm">{language === 'ar' ? 'تشخيص الأخطاء' : 'Diagnostics'}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'فحص المشاكل' : 'Check for issues'}</p>
                </CardContent>
              </Card>

              <Card 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                onClick={() => navigate('/dashboard/admin/users')}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="font-semibold text-sm">{language === 'ar' ? 'المستخدمون' : 'Users'}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'إدارة الحسابات' : 'Manage accounts'}</p>
                </CardContent>
              </Card>

              <Card 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                onClick={() => window.location.reload()}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                    <RefreshCw className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="font-semibold text-sm">{language === 'ar' ? 'إعادة تحميل' : 'Reload'}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'تحديث التطبيق' : 'Refresh app'}</p>
                </CardContent>
              </Card>

              <Card 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                onClick={() => navigate('/dashboard/devices')}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/30 transition-colors">
                    <Monitor className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="font-semibold text-sm">{language === 'ar' ? 'الأجهزة' : 'Devices'}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'إدارة الأجهزة' : 'Manage devices'}</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'مراقبة الأداء' : 'Performance Monitoring'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">{language === 'ar' ? 'استخدام المعالج' : 'CPU Usage'}</Label>
                    <span className="text-sm font-medium">{metrics.cpu.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.cpu} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">{language === 'ar' ? 'استخدام الذاكرة' : 'Memory Usage'}</Label>
                    <span className="text-sm font-medium">{metrics.memory.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.memory} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">{language === 'ar' ? 'استخدام التخزين' : 'Storage Usage'}</Label>
                    <span className="text-sm font-medium">{metrics.storage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.storage} className="h-2" />
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{language === 'ar' ? 'حالة الخادم' : 'Server Status'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{language === 'ar' ? 'خادم الويب' : 'Web Server'}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <Wifi className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'متصل' : 'Online'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <Database className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'متصل' : 'Connected'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{language === 'ar' ? 'ذاكرة التخزين المؤقت' : 'Cache'}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <HardDrive className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'نشط' : 'Active'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{language === 'ar' ? 'إحصائيات النظام' : 'System Stats'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{language === 'ar' ? 'زمن الاستجابة' : 'Response Time'}</span>
                      <span className="text-sm font-medium">142ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{language === 'ar' ? 'معدل النقل' : 'Throughput'}</span>
                      <span className="text-sm font-medium">1.2k req/s</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إدارة قاعدة البيانات' : 'Database Management'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder={language === 'ar' ? 'البحث في الجداول...' : 'Search tables...'} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Tables Overview</CardTitle>
                      <Badge variant="outline">
                        <Database className="h-3 w-3 mr-1" />
                        PostgreSQL
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['profiles', 'students', 'teachers', 'classes', 'attendance_records', 'grades'].map((table) => (
                        <div key={table} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                          <span className="text-sm font-medium">{table}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" className="justify-start">
                    <Upload className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'نسخ احتياطي' : 'Backup Database'}
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'مزامنة البيانات' : 'Sync Data'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder={language === 'ar' ? 'البحث عن المستخدمين...' : 'Search users...'} 
                  className="max-w-sm"
                />
                <Button variant="outline">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {['Admin Users', 'Teachers', 'Students', 'Parents', 'Drivers', 'Staff'].map((userType) => (
                  <Card key={userType}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{userType}</CardTitle>
                        <Badge variant="outline">
                          {Math.floor(Math.random() * 100) + 20}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full">
                        {language === 'ar' ? 'إدارة' : 'Manage'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{language === 'ar' ? 'أذونات المستخدمين' : 'User Permissions'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{language === 'ar' ? 'السماح بالتسجيل الذاتي' : 'Allow Self-Registration'}</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{language === 'ar' ? 'التحقق من البريد الإلكتروني' : 'Email Verification Required'}</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{language === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}</Label>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إدارة الميزات' : 'Feature Management'}</CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'تمكين أو تعطيل ميزات التطبيق للاختبار'
                  : 'Enable or disable application features for testing'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature) => (
                  <Card key={feature.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm">
                            {isRTL ? feature.nameAr : feature.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {isRTL ? feature.descriptionAr : feature.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {feature.category}
                          </Badge>
                          <Switch 
                            checked={feature.enabled}
                            onCheckedChange={() => handleFeatureToggle(feature.id)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ar' ? 'بيئة الاختبار' : 'Testing Environment'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {language === 'ar' ? 'وضع الاختبار' : 'Test Mode'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'تمكين وضع الاختبار' : 'Enable Test Mode'}</Label>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {language === 'ar' ? 'البيانات التجريبية' : 'Mock Data'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        <Database className="mr-2 h-4 w-4" />
                        {language === 'ar' ? 'توليد بيانات تجريبية' : 'Generate Mock Data'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'التكاملات الخارجية' : 'External Integrations'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {language === 'ar' ? 'بوابة الدفع' : 'Payment Gateway'}
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-800">
                        {language === 'ar' ? 'متصل' : 'Connected'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Stripe</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'إدارة' : 'Configure'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {language === 'ar' ? 'خدمة البريد الإلكتروني' : 'Email Service'}
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-800">
                        {language === 'ar' ? 'متصل' : 'Connected'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">SendGrid</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'إدارة' : 'Configure'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {language === 'ar' ? 'خدمة الرسائل القصيرة' : 'SMS Service'}
                      </CardTitle>
                      <Badge variant="outline">
                        {language === 'ar' ? 'غير متصل' : 'Not Connected'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Twilio</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'إعداد' : 'Setup'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {language === 'ar' ? 'التخزين السحابي' : 'Cloud Storage'}
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-800">
                        {language === 'ar' ? 'متصل' : 'Connected'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Supabase Storage</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'إدارة' : 'Configure'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{language === 'ar' ? 'مفاتيح API' : 'API Keys'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'مفتاح API العام' : 'Public API Key'}</Label>
                    <div className="flex gap-2">
                      <Input type="password" value="pk_test_********************************" readOnly />
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'مفتاح API السري' : 'Secret API Key'}</Label>
                    <div className="flex gap-2">
                      <Input type="password" value="sk_test_********************************" readOnly />
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'سجلات النظام' : 'System Logs'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع السجلات' : 'All Logs'}</SelectItem>
                    <SelectItem value="error">{language === 'ar' ? 'أخطاء' : 'Errors'}</SelectItem>
                    <SelectItem value="warning">{language === 'ar' ? 'تحذيرات' : 'Warnings'}</SelectItem>
                    <SelectItem value="info">{language === 'ar' ? 'معلومات' : 'Info'}</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  placeholder={language === 'ar' ? 'البحث في السجلات...' : 'Search logs...'} 
                  className="max-w-sm"
                />
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800">INFO</Badge>
                    <span className="text-muted-foreground">[2024-01-01 12:00:00]</span>
                    <span>User authentication successful: user@example.com</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">WARN</Badge>
                    <span className="text-muted-foreground">[2024-01-01 11:58:00]</span>
                    <span>Rate limit approaching for API endpoint /api/users</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-red-100 text-red-800">ERROR</Badge>
                    <span className="text-muted-foreground">[2024-01-01 11:55:00]</span>
                    <span>Database connection timeout - retrying...</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800">INFO</Badge>
                    <span className="text-muted-foreground">[2024-01-01 11:50:00]</span>
                    <span>Scheduled backup completed successfully</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">DEBUG</Badge>
                    <span className="text-muted-foreground">[2024-01-01 11:45:00]</span>
                    <span>Cache invalidated for key: user_sessions_*</span>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'تصدير السجلات' : 'Export Logs'}
                </Button>
                <Button variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'مسح السجلات' : 'Clear Logs'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إعدادات النظام' : 'System Settings'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اسم التطبيق' : 'Application Name'}</Label>
                    <Input defaultValue="TalebEdu" />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'المنطقة الزمنية' : 'Timezone'}</Label>
                    <Select defaultValue="UTC+3">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC+3">UTC+3 (Riyadh)</SelectItem>
                        <SelectItem value="UTC+4">UTC+4 (Dubai)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'تنسيق التاريخ' : 'Date Format'}</Label>
                    <Select defaultValue="DD/MM/YYYY">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{language === 'ar' ? 'فرض كلمة مرور قوية' : 'Enforce Strong Passwords'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'يتطلب 8 أحرف على الأقل مع أرقام ورموز' : 'Require minimum 8 characters with numbers and symbols'}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{language === 'ar' ? 'انتهاء الجلسة التلقائي' : 'Auto Session Timeout'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'تسجيل الخروج بعد 30 دقيقة من عدم النشاط' : 'Logout after 30 minutes of inactivity'}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{language === 'ar' ? 'تسجيل الأنشطة' : 'Activity Logging'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'تسجيل جميع أنشطة المستخدمين' : 'Log all user activities'}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ar' ? 'النسخ الاحتياطي والاستعادة' : 'Backup & Recovery'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {language === 'ar' ? 'النسخ الاحتياطي التلقائي' : 'Automatic Backup'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'ممكّن' : 'Enabled'}</Label>
                        <Switch defaultChecked />
                      </div>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">{language === 'ar' ? 'كل ساعة' : 'Hourly'}</SelectItem>
                          <SelectItem value="daily">{language === 'ar' ? 'يومياً' : 'Daily'}</SelectItem>
                          <SelectItem value="weekly">{language === 'ar' ? 'أسبوعياً' : 'Weekly'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {language === 'ar' ? 'آخر نسخة احتياطية' : 'Last Backup'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? '2024-01-01 03:00 ص' : '2024-01-01 03:00 AM'}
                      </div>
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        {language === 'ar' ? 'تنزيل النسخة' : 'Download Backup'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperDashboard;