import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  GraduationCap,
  Calendar,
  Bus,
  ShoppingBag,
  Wallet,
  Users,
  AlertCircle,
  BookOpen,
  DollarSign,
  Shield,
  Car,
  Wrench,
  Info
} from 'lucide-react';

type NotificationType = 
  | 'system_announcements'
  | 'grade_updates'
  | 'homework_assigned'
  | 'exam_schedule'
  | 'attendance_alerts'
  | 'bus_arrival'
  | 'canteen_orders'
  | 'wallet_transactions'
  | 'child_attendance'
  | 'child_grades'
  | 'child_homework'
  | 'child_bus_location'
  | 'payment_reminders'
  | 'school_announcements'
  | 'class_assignments'
  | 'student_submissions'
  | 'parent_messages'
  | 'schedule_changes'
  | 'leave_approvals'
  | 'payroll_updates'
  | 'user_registrations'
  | 'system_errors'
  | 'payment_received'
  | 'leave_requests'
  | 'bus_issues'
  | 'security_alerts'
  | 'route_changes'
  | 'student_pickup'
  | 'emergency_alerts'
  | 'vehicle_maintenance';

interface NotificationPreference {
  id: string;
  user_id?: string;
  notification_type: NotificationType;
  enabled: boolean | null;
  email_enabled: boolean | null;
  push_enabled: boolean | null;
  sms_enabled: boolean | null;
  created_at?: string;
  updated_at?: string;
}

const NotificationSettings = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const notificationConfig: Record<NotificationType, { icon: React.ReactNode; label: { en: string; ar: string }; description: { en: string; ar: string } }> = {
    // System-wide
    system_announcements: {
      icon: <Info className="h-4 w-4" />,
      label: { en: 'System Announcements', ar: 'إعلانات النظام' },
      description: { en: 'Important system updates and announcements', ar: 'تحديثات وإعلانات النظام المهمة' }
    },
    
    // Student notifications
    grade_updates: {
      icon: <GraduationCap className="h-4 w-4" />,
      label: { en: 'Grade Updates', ar: 'تحديثات الدرجات' },
      description: { en: 'Notifications when new grades are posted', ar: 'إشعارات عند نشر درجات جديدة' }
    },
    homework_assigned: {
      icon: <BookOpen className="h-4 w-4" />,
      label: { en: 'Homework Assignments', ar: 'الواجبات المنزلية' },
      description: { en: 'New homework assignments from teachers', ar: 'واجبات منزلية جديدة من المعلمين' }
    },
    exam_schedule: {
      icon: <Calendar className="h-4 w-4" />,
      label: { en: 'Exam Schedule', ar: 'جدول الامتحانات' },
      description: { en: 'Upcoming exam schedules and changes', ar: 'جداول الامتحانات القادمة والتغييرات' }
    },
    attendance_alerts: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: { en: 'Attendance Alerts', ar: 'تنبيهات الحضور' },
      description: { en: 'Notifications about attendance status', ar: 'إشعارات حول حالة الحضور' }
    },
    bus_arrival: {
      icon: <Bus className="h-4 w-4" />,
      label: { en: 'Bus Arrival', ar: 'وصول الحافلة' },
      description: { en: 'Bus arrival and departure notifications', ar: 'إشعارات وصول ومغادرة الحافلة' }
    },
    canteen_orders: {
      icon: <ShoppingBag className="h-4 w-4" />,
      label: { en: 'Canteen Orders', ar: 'طلبات المقصف' },
      description: { en: 'Order status and updates', ar: 'حالة الطلبات والتحديثات' }
    },
    wallet_transactions: {
      icon: <Wallet className="h-4 w-4" />,
      label: { en: 'Wallet Transactions', ar: 'معاملات المحفظة' },
      description: { en: 'Payment and wallet activity', ar: 'المدفوعات ونشاط المحفظة' }
    },
    
    // Parent notifications
    child_attendance: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: { en: "Child's Attendance", ar: 'حضور الطفل' },
      description: { en: "Your child's attendance updates", ar: 'تحديثات حضور طفلك' }
    },
    child_grades: {
      icon: <GraduationCap className="h-4 w-4" />,
      label: { en: "Child's Grades", ar: 'درجات الطفل' },
      description: { en: "New grades for your child", ar: 'درجات جديدة لطفلك' }
    },
    child_homework: {
      icon: <BookOpen className="h-4 w-4" />,
      label: { en: "Child's Homework", ar: 'واجبات الطفل' },
      description: { en: "Homework assigned to your child", ar: 'الواجبات المنزلية المكلف بها طفلك' }
    },
    child_bus_location: {
      icon: <Bus className="h-4 w-4" />,
      label: { en: "Child's Bus Location", ar: 'موقع حافلة الطفل' },
      description: { en: 'Real-time bus tracking for your child', ar: 'تتبع الحافلة في الوقت الفعلي لطفلك' }
    },
    payment_reminders: {
      icon: <DollarSign className="h-4 w-4" />,
      label: { en: 'Payment Reminders', ar: 'تذكيرات الدفع' },
      description: { en: 'Fee payment reminders', ar: 'تذكيرات دفع الرسوم' }
    },
    school_announcements: {
      icon: <Info className="h-4 w-4" />,
      label: { en: 'School Announcements', ar: 'إعلانات المدرسة' },
      description: { en: 'Important school announcements', ar: 'إعلانات المدرسة المهمة' }
    },
    
    // Teacher notifications
    class_assignments: {
      icon: <Users className="h-4 w-4" />,
      label: { en: 'Class Assignments', ar: 'تكليفات الصف' },
      description: { en: 'New class assignments and updates', ar: 'تكليفات وتحديثات الصف الجديدة' }
    },
    student_submissions: {
      icon: <BookOpen className="h-4 w-4" />,
      label: { en: 'Student Submissions', ar: 'تسليمات الطلاب' },
      description: { en: 'Homework and assignment submissions', ar: 'تسليمات الواجبات والمهام' }
    },
    parent_messages: {
      icon: <MessageSquare className="h-4 w-4" />,
      label: { en: 'Parent Messages', ar: 'رسائل أولياء الأمور' },
      description: { en: 'Messages from parents', ar: 'رسائل من أولياء الأمور' }
    },
    schedule_changes: {
      icon: <Calendar className="h-4 w-4" />,
      label: { en: 'Schedule Changes', ar: 'تغييرات الجدول' },
      description: { en: 'Class schedule modifications', ar: 'تعديلات جدول الحصص' }
    },
    leave_approvals: {
      icon: <Calendar className="h-4 w-4" />,
      label: { en: 'Leave Approvals', ar: 'الموافقات على الإجازات' },
      description: { en: 'Leave request status updates', ar: 'تحديثات حالة طلبات الإجازة' }
    },
    payroll_updates: {
      icon: <DollarSign className="h-4 w-4" />,
      label: { en: 'Payroll Updates', ar: 'تحديثات الرواتب' },
      description: { en: 'Salary and payroll notifications', ar: 'إشعارات الرواتب والمدفوعات' }
    },
    
    // Admin notifications
    user_registrations: {
      icon: <Users className="h-4 w-4" />,
      label: { en: 'User Registrations', ar: 'تسجيلات المستخدمين' },
      description: { en: 'New user registration alerts', ar: 'تنبيهات تسجيل المستخدمين الجدد' }
    },
    system_errors: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: { en: 'System Errors', ar: 'أخطاء النظام' },
      description: { en: 'Critical system error notifications', ar: 'إشعارات أخطاء النظام الحرجة' }
    },
    payment_received: {
      icon: <DollarSign className="h-4 w-4" />,
      label: { en: 'Payment Received', ar: 'استلام المدفوعات' },
      description: { en: 'Payment confirmation notifications', ar: 'إشعارات تأكيد المدفوعات' }
    },
    leave_requests: {
      icon: <Calendar className="h-4 w-4" />,
      label: { en: 'Leave Requests', ar: 'طلبات الإجازة' },
      description: { en: 'Staff leave request notifications', ar: 'إشعارات طلبات إجازة الموظفين' }
    },
    bus_issues: {
      icon: <Bus className="h-4 w-4" />,
      label: { en: 'Bus Issues', ar: 'مشاكل الحافلات' },
      description: { en: 'Bus breakdown and delay alerts', ar: 'تنبيهات تعطل وتأخر الحافلات' }
    },
    security_alerts: {
      icon: <Shield className="h-4 w-4" />,
      label: { en: 'Security Alerts', ar: 'تنبيهات الأمان' },
      description: { en: 'Security and safety notifications', ar: 'إشعارات الأمن والسلامة' }
    },
    
    // Driver notifications
    route_changes: {
      icon: <Car className="h-4 w-4" />,
      label: { en: 'Route Changes', ar: 'تغييرات المسار' },
      description: { en: 'Bus route modifications', ar: 'تعديلات مسار الحافلة' }
    },
    student_pickup: {
      icon: <Users className="h-4 w-4" />,
      label: { en: 'Student Pickup', ar: 'استلام الطلاب' },
      description: { en: 'Student pickup notifications', ar: 'إشعارات استلام الطلاب' }
    },
    emergency_alerts: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: { en: 'Emergency Alerts', ar: 'تنبيهات الطوارئ' },
      description: { en: 'Emergency situation alerts', ar: 'تنبيهات حالات الطوارئ' }
    },
    vehicle_maintenance: {
      icon: <Wrench className="h-4 w-4" />,
      label: { en: 'Vehicle Maintenance', ar: 'صيانة المركبة' },
      description: { en: 'Vehicle maintenance reminders', ar: 'تذكيرات صيانة المركبة' }
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [profile?.id]);

  const fetchPreferences = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', profile.id) as { data: NotificationPreference[] | null; error: any };

      if (error) throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to load notification settings' : 'فشل تحميل إعدادات الإشعارات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (type: NotificationType, field: 'enabled' | 'email_enabled' | 'push_enabled' | 'sms_enabled', value: boolean) => {
    setPreferences(prev => {
      const existing = prev.find(p => p.notification_type === type);
      if (existing) {
        return prev.map(p => 
          p.notification_type === type 
            ? { ...p, [field]: value }
            : p
        );
      } else {
        return [...prev, {
          id: crypto.randomUUID(),
          notification_type: type,
          enabled: field === 'enabled' ? value : true,
          email_enabled: field === 'email_enabled' ? value : true,
          push_enabled: field === 'push_enabled' ? value : true,
          sms_enabled: field === 'sms_enabled' ? value : false
        }];
      }
    });
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      for (const pref of preferences) {
        const { error } = await supabase
          .from('notification_preferences' as any)
          .upsert({
            user_id: profile.id,
            notification_type: pref.notification_type,
            enabled: pref.enabled,
            email_enabled: pref.email_enabled,
            push_enabled: pref.push_enabled,
            sms_enabled: pref.sms_enabled
          }, {
            onConflict: 'user_id,notification_type'
          }) as { error: any };

        if (error) throw error;
      }

      toast({
        title: language === 'en' ? 'Settings Saved' : 'تم حفظ الإعدادات',
        description: language === 'en' ? 'Your notification preferences have been updated' : 'تم تحديث تفضيلات الإشعارات الخاصة بك',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to save notification settings' : 'فشل حفظ إعدادات الإشعارات',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getPreference = (type: NotificationType) => {
    return preferences.find(p => p.notification_type === type) || {
      id: '',
      notification_type: type,
      enabled: true,
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false
    };
  };

  const getRelevantNotifications = (): NotificationType[] => {
    switch (profile?.role) {
      case 'student':
        return [
          'system_announcements',
          'grade_updates',
          'homework_assigned',
          'exam_schedule',
          'attendance_alerts',
          'bus_arrival',
          'canteen_orders',
          'wallet_transactions'
        ];
      case 'parent':
        return [
          'system_announcements',
          'child_attendance',
          'child_grades',
          'child_homework',
          'child_bus_location',
          'payment_reminders',
          'school_announcements'
        ];
      case 'teacher':
        return [
          'system_announcements',
          'class_assignments',
          'student_submissions',
          'parent_messages',
          'schedule_changes',
          'leave_approvals',
          'payroll_updates'
        ];
      case 'admin':
        return [
          'system_announcements',
          'user_registrations',
          'system_errors',
          'payment_received',
          'leave_requests',
          'bus_issues',
          'security_alerts'
        ];
      case 'driver':
        return [
          'system_announcements',
          'route_changes',
          'student_pickup',
          'emergency_alerts',
          'vehicle_maintenance'
        ];
      default:
        return ['system_announcements'];
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            {language === 'en' ? 'Loading notification settings...' : 'جاري تحميل إعدادات الإشعارات...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const relevantNotifications = getRelevantNotifications();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' ? 'اختر الإشعارات التي تريد تلقيها وكيفية تلقيها' : 'Choose which notifications you want to receive and how'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {relevantNotifications.map((type) => {
          const config = notificationConfig[type];
          const pref = getPreference(type);
          
          return (
            <div key={type} className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    {config.icon}
                    {language === 'ar' ? config.label.ar : config.label.en}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? config.description.ar : config.description.en}
                  </p>
                </div>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={(checked) => handleToggle(type, 'enabled', checked)}
                />
              </div>
              
              {pref.enabled && (
                <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3" />
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </Label>
                    <Switch
                      checked={pref.email_enabled}
                      onCheckedChange={(checked) => handleToggle(type, 'email_enabled', checked)}
                      className="scale-90"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <Smartphone className="h-3 w-3" />
                      {language === 'ar' ? 'الإشعارات الفورية' : 'Push Notifications'}
                    </Label>
                    <Switch
                      checked={pref.push_enabled}
                      onCheckedChange={(checked) => handleToggle(type, 'push_enabled', checked)}
                      className="scale-90"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-3 w-3" />
                      {language === 'ar' ? 'الرسائل النصية' : 'SMS'}
                    </Label>
                    <Switch
                      checked={pref.sms_enabled}
                      onCheckedChange={(checked) => handleToggle(type, 'sms_enabled', checked)}
                      className="scale-90"
                    />
                  </div>
                </div>
              )}
              
              <Separator />
            </div>
          );
        })}
        
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving 
              ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;