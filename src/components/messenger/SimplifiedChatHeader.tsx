import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Phone, Video, Users } from 'lucide-react';
import { Conversation, GroupChat } from '@/hooks/useMessenger';
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.div 
      className="px-2 py-2 flex items-center gap-2 shrink-0"
      dir="ltr"
      style={{ 
        backgroundColor: colors.headerBg,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white/10 relative active:scale-95 transition-transform"
        style={{ color: colors.textPrimary }}
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              className="absolute -top-1 -left-1 text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full"
              style={{ backgroundColor: colors.unreadBadge, color: 'white' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
      
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={onViewContact}
        className="cursor-pointer"
      >
        <Avatar 
          className="h-9 w-9 border-2" 
          style={{ borderColor: colors.divider }}
        >
          <AvatarImage src={image || undefined} />
          <AvatarFallback style={{ backgroundColor: colors.accent, color: 'white' }}>
            {group ? <Users className="h-4 w-4" /> : name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </motion.div>
      
      <button 
        className="flex-1 min-w-0 text-left active:opacity-80 transition-opacity"
        onClick={onViewContact}
      >
        <h2 
          className="font-semibold text-sm truncate" 
          style={{ color: colors.textPrimary }}
        >
          {name}
        </h2>
        <AnimatePresence mode="wait">
          <motion.p 
            key={isTyping ? 'typing' : isOnline ? 'online' : 'offline'}
            className="text-[11px] truncate"
            style={{ 
              color: isTyping ? colors.accent : (isOnline ? colors.accentLight : colors.textSecondary)
            }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {getStatusText()}
          </motion.p>
        </AnimatePresence>
      </button>
      
      {/* Simplified: Only voice and video call buttons */}
      <div className="flex items-center gap-0">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/10" 
            style={{ color: colors.textPrimary }}
            onClick={onVideoCall}
          >
            <Video className="h-4 w-4" />
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/10" 
            style={{ color: colors.textPrimary }}
            onClick={onVoiceCall}
          >
            <Phone className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
