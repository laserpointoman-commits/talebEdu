import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Phone, Video, Users } from 'lucide-react';
import { Conversation, GroupChat } from '@/hooks/useMessenger';

interface SimplifiedChatHeaderProps {
  conversation?: Conversation | null;
  group?: GroupChat | null;
  onBack: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onViewContact?: () => void;
  isArabic?: boolean;
  unreadCount?: number;
  colors: {
    headerBg: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentLight: string;
    unreadBadge: string;
    divider: string;
  };
}

export function SimplifiedChatHeader({
  conversation,
  group,
  onBack,
  onVoiceCall,
  onVideoCall,
  onViewContact,
  isArabic = false,
  unreadCount = 0,
  colors
}: SimplifiedChatHeaderProps) {
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
      className="px-2 py-2 flex items-center gap-2 shrink-0"
      style={{ backgroundColor: colors.headerBg }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 hover:bg-white/10 relative"
        style={{ color: colors.textPrimary }}
        onClick={onBack}
      >
        <ArrowLeft className="h-5 w-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -left-1 text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full"
            style={{ backgroundColor: colors.unreadBadge, color: 'white' }}
          >
            {unreadCount}
          </span>
        )}
      </Button>
      
      <Avatar 
        className="h-10 w-10 border-2 cursor-pointer" 
        style={{ borderColor: colors.divider }}
        onClick={onViewContact}
      >
        <AvatarImage src={image || undefined} />
        <AvatarFallback style={{ backgroundColor: colors.accent, color: 'white' }}>
          {group ? <Users className="h-5 w-5" /> : name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <button 
        className="flex-1 min-w-0 text-left"
        onClick={onViewContact}
      >
        <h2 
          className="font-medium text-base truncate" 
          style={{ color: colors.textPrimary }}
        >
          {name}
        </h2>
        <p 
          className="text-xs truncate"
          style={{ 
            color: isTyping ? colors.accent : (isOnline ? colors.accentLight : colors.textSecondary)
          }}
        >
          {getStatusText()}
        </p>
      </button>
      
      {/* Simplified: Only voice and video call buttons - no three-dot menu, no search, no camera */}
      <div className="flex items-center gap-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 hover:bg-white/10" 
          style={{ color: colors.textPrimary }}
          onClick={onVideoCall}
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 hover:bg-white/10" 
          style={{ color: colors.textPrimary }}
          onClick={onVoiceCall}
        >
          <Phone className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
