import { CallLog } from '@/hooks/useMessenger';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock } from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';
import { format } from 'date-fns';

interface MessengerCallsProps {
  callLogs: CallLog[];
  isArabic?: boolean;
}

export function MessengerCalls({ callLogs, isArabic }: MessengerCallsProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Quick Actions */}
      <div 
        className="flex justify-around py-4 border-b shrink-0" 
        style={{ borderColor: WHATSAPP_COLORS.divider }}
      >
        <div className="flex flex-col items-center gap-2">
          <div 
            className="h-14 w-14 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: WHATSAPP_COLORS.accent }}
          >
            <Phone className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-medium" style={{ color: WHATSAPP_COLORS.textSecondary }}>
            {isArabic ? 'اتصال' : 'Call'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div 
            className="h-14 w-14 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
          >
            <Clock className="h-6 w-6" style={{ color: WHATSAPP_COLORS.textSecondary }} />
          </div>
          <span className="text-xs font-medium" style={{ color: WHATSAPP_COLORS.textSecondary }}>
            {isArabic ? 'جدولة' : 'Schedule'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div 
            className="h-14 w-14 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
          >
            <Video className="h-6 w-6" style={{ color: WHATSAPP_COLORS.textSecondary }} />
          </div>
          <span className="text-xs font-medium" style={{ color: WHATSAPP_COLORS.textSecondary }}>
            {isArabic ? 'فيديو' : 'Video'}
          </span>
        </div>
      </div>

      {/* Call History */}
      <ScrollArea className="flex-1">
        <h3 
          className="px-4 py-3 text-sm font-semibold sticky top-0"
          style={{ color: WHATSAPP_COLORS.textSecondary, backgroundColor: WHATSAPP_COLORS.bg }}
        >
          {isArabic ? 'الأخيرة' : 'Recent'}
        </h3>
        
        {callLogs.length > 0 ? (
          callLogs.map((call) => (
            <div 
              key={call.id} 
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
              style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                  {call.caller_name?.charAt(0) || call.recipient_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p 
                  className="font-medium truncate"
                  style={{ 
                    color: call.status === 'missed' ? WHATSAPP_COLORS.missedCall : WHATSAPP_COLORS.textPrimary 
                  }}
                >
                  {call.caller_name || call.recipient_name || (isArabic ? 'مكالمة' : 'Call')}
                </p>
                <div className="flex items-center gap-1.5">
                  {call.status === 'missed' ? (
                    <PhoneMissed className="h-4 w-4" style={{ color: WHATSAPP_COLORS.missedCall }} />
                  ) : call.caller_id ? (
                    <PhoneOutgoing className="h-4 w-4" style={{ color: WHATSAPP_COLORS.accentLight }} />
                  ) : (
                    <PhoneIncoming className="h-4 w-4" style={{ color: WHATSAPP_COLORS.accentLight }} />
                  )}
                  <span className="text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                    {format(new Date(call.started_at), 'MMM d, HH:mm')}
                  </span>
                  {call.duration && (
                    <span className="text-sm" style={{ color: WHATSAPP_COLORS.textMuted }}>
                      • {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full shrink-0 hover:bg-white/10"
              >
                {call.call_type === 'video' ? (
                  <Video className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                ) : (
                  <Phone className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
                )}
              </Button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div 
              className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
            >
              <Phone className="h-10 w-10" style={{ color: WHATSAPP_COLORS.textMuted }} />
            </div>
            <p className="text-center mb-1 font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'لا توجد مكالمات' : 'No calls yet'}
            </p>
            <p className="text-center text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
              {isArabic ? 'اضغط على زر الاتصال للبدء' : 'Tap the call button to start'}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
