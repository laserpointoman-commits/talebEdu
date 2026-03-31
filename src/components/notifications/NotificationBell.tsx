import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications, AppNotification } from '@/hooks/use-notifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, hi } from 'date-fns/locale';

const typeIcons: Record<string, string> = {
  child_attendance: '📍',
  child_bus_location: '🚌',
  child_grades: '📊',
  child_homework: '📝',
  payment_reminders: '💰',
  system_announcements: '📢',
  grade_updates: '🎓',
  homework_assigned: '📚',
  exam_schedule: '📋',
  attendance_alerts: '⏰',
  bus_arrival: '🚍',
  bus_boarding: '🚌',
  bus_exit: '🚌',
  wallet_transactions: '💳',
  school_announcements: '🏫',
  payment_received: '✅',
};

// Arabic translation map for notification titles
const titleTranslations: Record<string, string> = {
  'Student Boarded Bus': 'الطالب صعد الحافلة',
  'Student Exited Bus': 'الطالب نزل من الحافلة',
  'Student Entered School': 'الطالب دخل المدرسة',
  'Student Exited School': 'الطالب خرج من المدرسة',
  'Grade Updated': 'تحديث الدرجة',
  'New Homework': 'واجب جديد',
  'Payment Received': 'تم استلام الدفعة',
  'Payment Reminder': 'تذكير بالدفع',
  'System Announcement': 'إعلان النظام',
  'School Announcement': 'إعلان المدرسة',
  'Attendance Alert': 'تنبيه الحضور',
  'Bus Arrival': 'وصول الحافلة',
  'Wallet Transaction': 'عملية المحفظة',
  'Exam Schedule': 'جدول الاختبارات',
};

function translateMessage(message: string, language: string): string {
  if (language !== 'ar') return message;
  
  // Translate common patterns in messages
  let translated = message;
  translated = translated.replace(/boarded the bus at/g, 'صعد الحافلة في');
  translated = translated.replace(/exited the bus at/g, 'نزل من الحافلة في');
  translated = translated.replace(/entered school at/g, 'دخل المدرسة في');
  translated = translated.replace(/exited school at/g, 'خرج من المدرسة في');
  translated = translated.replace(/Bus (\d+)/g, 'الحافلة $1');
  
  return translated;
}

function translateTitle(title: string, language: string): string {
  if (language !== 'ar') return title;
  return titleTranslations[title] || title;
}

function getTimeAgo(dateStr: string, language: string) {
  try {
    const locale = language === 'ar' ? ar : language === 'hi' ? hi : undefined;
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale });
  } catch {
    return '';
  }
}

// Map notification types to their target routes
function getNotificationRoute(notification: AppNotification): string | null {
  const type = notification.notification_type;
  const data = notification.data as Record<string, any> | null;

  switch (type) {
    case 'bus_boarding':
    case 'bus_exit':
    case 'bus_arrival':
    case 'child_bus_location':
      // Navigate to bus tracking — if student_id is available, go to student-specific tracking
      if (data?.student_id) {
        return `/dashboard/student/${data.student_id}/bus-tracking`;
      }
      return '/dashboard/tracking';

    case 'child_attendance':
    case 'attendance_alerts':
      if (data?.student_id) {
        return `/dashboard/student/${data.student_id}/attendance`;
      }
      return '/dashboard/attendance';

    case 'child_grades':
    case 'grade_updates':
      if (data?.student_id) {
        return `/dashboard/student/${data.student_id}/grades`;
      }
      return '/dashboard/grades';

    case 'child_homework':
    case 'homework_assigned':
      return '/dashboard/homework';

    case 'payment_reminders':
    case 'payment_received':
    case 'wallet_transactions':
      if (data?.student_id) {
        return `/dashboard/student/${data.student_id}/fees`;
      }
      return '/dashboard/finance';

    case 'exam_schedule':
      return '/dashboard/exams';

    case 'system_announcements':
    case 'school_announcements':
      return '/dashboard';

    default:
      return null;
  }
}

function NotificationItem({
  notification,
  onRead,
  onNavigate,
  language,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
  onNavigate: (route: string) => void;
  language: string;
}) {
  const icon = typeIcons[notification.notification_type] || '🔔';
  const route = getNotificationRoute(notification);

  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    if (route) {
      onNavigate(route);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-start p-3 border-b border-border last:border-0 transition-colors hover:bg-muted/50',
        !notification.read && 'bg-primary/5',
        route && 'cursor-pointer'
      )}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg mt-0.5 shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm font-medium truncate', !notification.read && 'text-primary')}>
              {translateTitle(notification.title, language)}
            </p>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {translateMessage(notification.message, language)}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            {getTimeAgo(notification.created_at, language)}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const getText = (en: string, ar: string) => (language === 'ar' ? ar : en);

  const handleNavigate = (route: string) => {
    setOpen(false);
    navigate(route);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 md:h-9 md:w-9 rounded-lg hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground border-0 flex items-center justify-center rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 md:w-96 p-0 bg-background shadow-xl border-border"
        align="end"
        sideOffset={8}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">
            {getText('Notifications', 'الإشعارات')}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary hover:text-primary/80"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
              {getText('Mark all read', 'تحديد الكل كمقروء')}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[60vh] overflow-y-auto touch-pan-y [-webkit-overflow-scrolling:touch]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">{getText('No notifications yet', 'لا توجد إشعارات بعد')}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={markAsRead}
                onNavigate={handleNavigate}
                language={language}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
