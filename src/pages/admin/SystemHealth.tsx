import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Activity, 
  AlertTriangle, 
  Archive, 
  CheckCircle, 
  Clock, 
  Database,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Users,
  Wallet,
  Bell,
  Bus,
  FileText
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SystemHealth {
  active_students: number;
  active_teachers: number;
  active_parents: number;
  today_attendance: number;
  today_bus_logs: number;
  today_transactions: number;
  pending_notifications: number;
  failed_notifications: number;
  unresolved_errors_24h: number;
  errors_last_hour: number;
  total_wallet_balance: number;
  admin_wallet_balance: number;
  last_checked: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
  metadata: any;
}

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  function_name: string;
  resolved: boolean;
  created_at: string;
}

export default function SystemHealth() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();
  const [isArchiving, setIsArchiving] = useState(false);

  // Fetch system health
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_health_dashboard")
        .select("*")
        .single();
      if (error) throw error;
      return data as SystemHealth;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Fetch error logs
  const { data: errorLogs, isLoading: errorsLoading } = useQuery({
    queryKey: ["error-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ErrorLog[];
    },
  });

  // Run dry run archive
  const archiveDryRun = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("archive-old-data", {
        body: { dryRun: true, daysOld: 365 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.info(
        `Would archive: ${data.wouldArchive.attendance_records} attendance, ${data.wouldArchive.wallet_transactions} transactions, ${data.wouldArchive.bus_boarding_logs} bus logs`
      );
    },
    onError: (error: any) => {
      toast.error("Failed to check archival: " + error.message);
    },
  });

  // Run actual archive
  const runArchive = useMutation({
    mutationFn: async () => {
      setIsArchiving(true);
      const { data, error } = await supabase.functions.invoke("archive-old-data", {
        body: { dryRun: false, daysOld: 365 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Archived old records successfully`);
      queryClient.invalidateQueries({ queryKey: ["system-health"] });
      setIsArchiving(false);
    },
    onError: (error: any) => {
      toast.error("Archive failed: " + error.message);
      setIsArchiving(false);
    },
  });

  // Check for alerts
  const checkAlerts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-error-alert", {
        body: { checkOnly: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.alertsTriggered) {
        toast.warning(`${data.alerts.length} alert(s) detected`);
      } else {
        toast.success("System healthy - no alerts");
      }
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(isRTL ? "ar-OM" : "en-US");
  };

  const getHealthStatus = () => {
    if (!health) return "unknown";
    if (health.unresolved_errors_24h > 10 || health.failed_notifications > 50) return "critical";
    if (health.errors_last_hour > 5 || health.pending_notifications > 500) return "warning";
    return "healthy";
  };

  const healthStatus = getHealthStatus();

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Server className="h-6 w-6" />
              {isRTL ? "صحة النظام" : "System Health"}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? "مراقبة أداء النظام في الوقت الفعلي" : "Real-time system performance monitoring"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetchHealth()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {isRTL ? "تحديث" : "Refresh"}
            </Button>
            <Button variant="outline" onClick={() => checkAlerts.mutate()}>
              <Bell className="h-4 w-4 mr-2" />
              {isRTL ? "فحص التنبيهات" : "Check Alerts"}
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        <Card className={`border-2 ${
          healthStatus === "healthy" ? "border-green-500 bg-green-500/10" :
          healthStatus === "warning" ? "border-yellow-500 bg-yellow-500/10" :
          healthStatus === "critical" ? "border-red-500 bg-red-500/10" :
          "border-muted"
        }`}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {healthStatus === "healthy" ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : healthStatus === "warning" ? (
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {healthStatus === "healthy" ? (isRTL ? "النظام يعمل بشكل سليم" : "System Healthy") :
                   healthStatus === "warning" ? (isRTL ? "تحذير - يتطلب الانتباه" : "Warning - Attention Required") :
                   (isRTL ? "حرج - يتطلب إجراء فوري" : "Critical - Immediate Action Required")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? `آخر فحص: ${health ? formatDate(health.last_checked) : "-"}` : 
                   `Last checked: ${health ? formatDate(health.last_checked) : "-"}`}
                </p>
              </div>
            </div>
            <Badge variant={healthStatus === "healthy" ? "default" : healthStatus === "warning" ? "secondary" : "destructive"}>
              {healthStatus.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{isRTL ? "الطلاب النشطون" : "Active Students"}</span>
              </div>
              <p className="text-2xl font-bold mt-2">{health?.active_students || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">{isRTL ? "حضور اليوم" : "Today's Attendance"}</span>
              </div>
              <p className="text-2xl font-bold mt-2">{health?.today_attendance || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">{isRTL ? "سجلات الباص" : "Bus Logs Today"}</span>
              </div>
              <p className="text-2xl font-bold mt-2">{health?.today_bus_logs || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">{isRTL ? "المعاملات اليوم" : "Transactions Today"}</span>
              </div>
              <p className="text-2xl font-bold mt-2">{health?.today_transactions || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Notification & Error Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {isRTL ? "حالة الإشعارات" : "Notification Queue"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>{isRTL ? "في الانتظار" : "Pending"}</span>
                <Badge variant="secondary">{health?.pending_notifications || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>{isRTL ? "فاشل" : "Failed"}</span>
                <Badge variant={health?.failed_notifications && health.failed_notifications > 0 ? "destructive" : "default"}>
                  {health?.failed_notifications || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {isRTL ? "الأخطاء" : "Errors"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>{isRTL ? "آخر ساعة" : "Last Hour"}</span>
                <Badge variant={health?.errors_last_hour && health.errors_last_hour > 0 ? "destructive" : "default"}>
                  {health?.errors_last_hour || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>{isRTL ? "غير محلول (24 ساعة)" : "Unresolved (24h)"}</span>
                <Badge variant={health?.unresolved_errors_24h && health.unresolved_errors_24h > 5 ? "destructive" : "secondary"}>
                  {health?.unresolved_errors_24h || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="errors" className="w-full">
          <TabsList>
            <TabsTrigger value="errors">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isRTL ? "سجل الأخطاء" : "Error Logs"}
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="h-4 w-4 mr-2" />
              {isRTL ? "سجل التدقيق" : "Audit Logs"}
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Database className="h-4 w-4 mr-2" />
              {isRTL ? "الصيانة" : "Maintenance"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? "الأخطاء الأخيرة" : "Recent Errors"}</CardTitle>
                <CardDescription>{isRTL ? "آخر 50 خطأ في النظام" : "Last 50 system errors"}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {errorsLoading ? (
                    <p className="text-muted-foreground">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
                  ) : errorLogs?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
                      <p>{isRTL ? "لا توجد أخطاء" : "No errors found"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {errorLogs?.map((log) => (
                        <div key={log.id} className="border rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge variant={log.resolved ? "default" : "destructive"}>
                              {log.error_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">{log.error_message}</p>
                          {log.function_name && (
                            <p className="text-xs text-muted-foreground">
                              Function: {log.function_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? "سجل التدقيق" : "Audit Trail"}</CardTitle>
                <CardDescription>{isRTL ? "تتبع جميع إجراءات المسؤول" : "Track all admin actions"}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {auditLoading ? (
                    <p className="text-muted-foreground">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
                  ) : auditLogs?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mb-2" />
                      <p>{isRTL ? "لا توجد سجلات" : "No audit logs yet"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs?.map((log) => (
                        <div key={log.id} className="border rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">
                            Table: <span className="font-medium">{log.table_name}</span>
                          </p>
                          {log.record_id && (
                            <p className="text-xs text-muted-foreground">
                              Record: {log.record_id}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    {isRTL ? "أرشفة البيانات" : "Data Archival"}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? "أرشفة السجلات الأقدم من سنة" : "Archive records older than 1 year"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {isRTL 
                      ? "نقل السجلات القديمة إلى جداول الأرشيف لتحسين الأداء"
                      : "Move old records to archive tables to improve performance"}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => archiveDryRun.mutate()}
                      disabled={archiveDryRun.isPending}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {isRTL ? "معاينة" : "Preview"}
                    </Button>
                    <Button 
                      onClick={() => runArchive.mutate()}
                      disabled={isArchiving}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      {isArchiving ? (isRTL ? "جاري الأرشفة..." : "Archiving...") : (isRTL ? "تشغيل الأرشفة" : "Run Archive")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {isRTL ? "حذف بيانات GDPR" : "GDPR Data Deletion"}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? "حذف بيانات الطالب بالكامل" : "Completely remove student data"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {isRTL
                      ? "استخدم هذا لحذف جميع بيانات الطالب للامتثال لـ GDPR"
                      : "Use this to delete all student data for GDPR compliance"}
                  </p>
                  <Button variant="destructive" disabled>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isRTL ? "حذف بيانات الطالب" : "Delete Student Data"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "انتقل إلى إدارة الطلاب لتنفيذ الحذف" : "Go to Student Management to perform deletion"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
