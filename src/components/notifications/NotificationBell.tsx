import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
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
  wallet_transactions: '💳',
  school_announcements: '🏫',
  payment_received: '✅',
};

function getTimeAgo(dateStr: string, language: string) {
  try {
    const locale = language === 'ar' ? ar : language === 'hi' ? hi : undefined;
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale });
  } catch {
    return '';
  }
}

function NotificationItem({
  notification,
  onRead,
  language,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
  language: string;
}) {
  const icon = typeIcons[notification.notification_type] || '🔔';

  return (
    <button
      onClick={() => !notification.read && onRead(notification.id)}
      className={cn(
        'w-full text-start p-3 border-b border-border last:border-0 transition-colors hover:bg-muted/50',
        !notification.read && 'bg-primary/5'
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg mt-0.5 shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm font-medium truncate', !notification.read && 'text-primary')}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
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

  const getText = (en: string, ar: string) => (language === 'ar' ? ar : en);

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
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-red-500 text-white border-0 flex items-center justify-center rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 md:w-96 p-0 bg-background shadow-xl border-border"
        align="end"
        sideOffset={8}
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
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              {getText('Mark all read', 'تحديد الكل كمقروء')}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-80">
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
                language={language}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
