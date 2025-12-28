import { Circle } from 'lucide-react';

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  lastSeen?: string;
  isTyping?: boolean;
  isArabic?: boolean;
  colors: {
    accentLight: string;
    textSecondary: string;
    textMuted: string;
  };
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function OnlineStatusBadge({
  isOnline,
  lastSeen,
  isTyping,
  isArabic = false,
  colors,
  showText = true,
  size = 'md'
}: OnlineStatusBadgeProps) {
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  };

  const getStatusText = () => {
    if (isTyping) {
      return t('typing...', 'يكتب...');
    }
    if (isOnline) {
      return t('online', 'متصل');
    }
    if (lastSeen) {
      const date = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t('just now', 'الآن');
      if (diffMins < 60) return `${diffMins} ${t('min ago', 'دقيقة')}`;
      if (diffHours < 24) return `${diffHours} ${t('hours ago', 'ساعات')}`;
      if (diffDays < 7) return `${diffDays} ${t('days ago', 'أيام')}`;
      return t('offline', 'غير متصل');
    }
    return t('offline', 'غير متصل');
  };

  const statusColor = isOnline || isTyping ? colors.accentLight : colors.textMuted;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Circle
          className={sizeClasses[size]}
          fill={statusColor}
          style={{ color: statusColor }}
        />
        {isOnline && (
          <span className="absolute inset-0 animate-ping rounded-full opacity-75" style={{ backgroundColor: statusColor }} />
        )}
      </div>
      {showText && (
        <span
          className="text-xs"
          style={{ color: isOnline || isTyping ? colors.accentLight : colors.textSecondary }}
        >
          {getStatusText()}
        </span>
      )}
    </div>
  );
}
