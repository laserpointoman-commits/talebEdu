import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Phone, Video, MoreVertical, Search, Users } from 'lucide-react';
import { MESSENGER_COLORS } from './MessengerTheme';
import { Conversation, GroupChat } from '@/hooks/useMessenger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  conversation?: Conversation | null;
  group?: GroupChat | null;
  onBack: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onSearch?: () => void;
  onViewContact?: () => void;
  onMuteNotifications?: () => void;
  onClearChat?: () => void;
  isArabic?: boolean;
  unreadCount?: number;
}

export function ChatHeader({
  conversation,
  group,
  onBack,
  onVoiceCall,
  onVideoCall,
  onSearch,
  onViewContact,
  onMuteNotifications,
  onClearChat,
  isArabic = false,
  unreadCount = 0
}: ChatHeaderProps) {
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const name = group?.name || conversation?.recipient_name || '';
  const image = group?.image_url || conversation?.recipient_image || null;
  const isOnline = conversation?.is_online;
  const isTyping = conversation?.is_typing;
  const memberCount = group?.members?.length;

  const getStatusText = () => {
    if (group) {
      return `${memberCount} ${t('participants', 'مشارك')}`;
    }
    if (isTyping) {
      return t('typing...', 'يكتب...');
    }
    if (isOnline) {
      return t('online', 'متصل');
    }
    return t('last seen recently', 'شوهد مؤخراً');
  };

  return (
    <div 
      className="px-2 py-2 flex items-center gap-2"
      style={{ backgroundColor: MESSENGER_COLORS.headerBg }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 hover:bg-white/10 relative"
        style={{ color: MESSENGER_COLORS.textPrimary }}
        onClick={onBack}
      >
        <ArrowLeft className="h-5 w-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -left-1 text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full"
            style={{ backgroundColor: MESSENGER_COLORS.unreadBadge, color: 'white' }}
          >
            {unreadCount}
          </span>
        )}
      </Button>
      
      <Avatar className="h-10 w-10 border-2" style={{ borderColor: MESSENGER_COLORS.divider }}>
        <AvatarImage src={image || undefined} />
        <AvatarFallback style={{ backgroundColor: MESSENGER_COLORS.accent, color: 'white' }}>
          {group ? <Users className="h-5 w-5" /> : name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <button 
        className="flex-1 min-w-0 text-left"
        onClick={onViewContact}
      >
        <h2 
          className="font-medium text-base truncate" 
          style={{ color: MESSENGER_COLORS.textPrimary }}
        >
          {name}
        </h2>
        <p 
          className="text-xs truncate"
          style={{ 
            color: isTyping ? MESSENGER_COLORS.accent : (isOnline ? MESSENGER_COLORS.accentLight : MESSENGER_COLORS.textSecondary)
          }}
        >
          {getStatusText()}
        </p>
      </button>
      
      <div className="flex items-center gap-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 hover:bg-white/10" 
          style={{ color: MESSENGER_COLORS.textPrimary }}
          onClick={onVideoCall}
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 hover:bg-white/10" 
          style={{ color: MESSENGER_COLORS.textPrimary }}
          onClick={onVoiceCall}
        >
          <Phone className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-white/10" 
              style={{ color: MESSENGER_COLORS.textPrimary }}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            className="border-0"
            style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
          >
            <DropdownMenuItem 
              onClick={onViewContact}
              style={{ color: MESSENGER_COLORS.textPrimary }}
            >
              {group ? t('Group info', 'معلومات المجموعة') : t('View contact', 'عرض جهة الاتصال')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onSearch}
              style={{ color: MESSENGER_COLORS.textPrimary }}
            >
              {t('Search', 'بحث')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onMuteNotifications}
              style={{ color: MESSENGER_COLORS.textPrimary }}
            >
              {t('Mute notifications', 'كتم الإشعارات')}
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: MESSENGER_COLORS.divider }} />
            <DropdownMenuItem 
              onClick={onClearChat}
              style={{ color: MESSENGER_COLORS.missedCall }}
            >
              {t('Clear chat', 'مسح المحادثة')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}