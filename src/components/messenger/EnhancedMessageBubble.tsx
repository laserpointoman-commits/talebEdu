import { useState, useRef, useCallback, memo } from 'react';
import { Check, CheckCheck, Clock, Reply, Forward, Trash2, Copy, Smile, MoreVertical, FileText, Download, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { QUICK_REACTIONS, STAR_COLOR, TASK_STATUS_COLORS } from './MessengerThemeColors';
import { Message } from '@/hooks/useMessenger';
import { Button } from '@/components/ui/button';
import { VoiceMessageBubble } from './VoiceMessageBubble';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EnhancedMessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (messageId: string, forEveryone: boolean) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
  isStarred?: boolean;
  isArabic?: boolean;
  colors: {
    messageSent: string;
    messageReceived: string;
    textPrimary: string;
    textMuted: string;
    textSecondary: string;
    timeTextSent: string;
    timeTextReceived: string;
    checkGray: string;
    checkBlue: string;
    checkDelivered: string;
    accent: string;
    bgTertiary: string;
    divider: string;
    missedCall: string;
    taskAccept: string;
    taskDecline: string;
  };
}

export function EnhancedMessageBubble({
  message,
  isOwnMessage,
  onReply,
  onForward,
  onDelete,
  onReact,
  onRemoveReaction,
  onStar,
  isStarred = false,
  isArabic = false,
  colors
}: EnhancedMessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  const formatTime = (dateStr: string) => format(new Date(dateStr), 'h:mm a');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced status icon with distinct colors
  const getStatusIcon = () => {
    if (message.is_read) {
      return <CheckCheck className="h-4 w-4" style={{ color: colors.checkBlue }} />;
    } else if (message.is_delivered) {
      return <CheckCheck className="h-4 w-4" style={{ color: colors.checkDelivered }} />;
    } else {
      return <Check className="h-4 w-4" style={{ color: colors.checkGray }} />;
    }
  };

  // Get audio URL from attachments for voice messages
  const getVoiceAudioUrl = (): string | null => {
    if (message.message_type === 'voice' && message.attachments && message.attachments.length > 0) {
      return message.attachments[0].file_url;
    }
    return null;
  };

  const isTaskMessage = message.message_type === 'task';
  const taskStatus = (message as any).task_status;

  // Long press handlers for mobile
  const handleTouchStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setShowMobileMenu(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Right-click handler for desktop
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMobileMenu(true);
  }, []);

  // Action handlers
  const handleReply = () => {
    setShowMobileMenu(false);
    onReply?.(message);
  };

  const handleForward = () => {
    setShowMobileMenu(false);
    onForward?.(message);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setShowMobileMenu(false);
  };

  const handleStar = () => {
    setShowMobileMenu(false);
    onStar?.(message.id);
  };

  const handleDeleteForMe = () => {
    setShowMobileMenu(false);
    onDelete?.(message.id, false);
  };

  const handleDeleteForEveryone = () => {
    setShowMobileMenu(false);
    onDelete?.(message.id, true);
  };

  // Handle deleted message
  if (message.deleted_for_everyone) {
    return (
      <div className={cn("flex mb-1", isOwnMessage ? "justify-end" : "justify-start")}>
        <div 
          className="max-w-[75%] rounded-lg px-3 py-2 italic"
          style={{ 
            backgroundColor: isOwnMessage ? colors.messageSent : colors.messageReceived,
            opacity: 0.7
          }}
        >
          <p className="text-sm" style={{ color: colors.textMuted }}>
            🚫 {t('This message was deleted', 'تم حذف هذه الرسالة')}
          </p>
        </div>
      </div>
    );
  }

  // Get time text color based on bubble type
  const timeColor = isOwnMessage ? colors.timeTextSent : colors.timeTextReceived;

  return (
    <>
      {/* Mobile Action Menu Modal */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => setShowMobileMenu(false)}
        >
          <div 
            className="w-[280px] rounded-xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: colors.bgTertiary }}
            onClick={e => e.stopPropagation()}
          >
            {/* Quick reactions */}
            <div className="flex justify-center gap-3 p-4 border-b" style={{ borderColor: colors.divider }}>
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  className="text-2xl hover:scale-125 transition-transform p-2"
                  onClick={() => {
                    onReact?.(message.id, emoji);
                    setShowMobileMenu(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {/* Action buttons */}
            <div className="py-2">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={handleReply}
              >
                <Reply className="h-5 w-5" style={{ color: colors.accent }} />
                <span style={{ color: colors.textPrimary }}>{t('Reply', 'رد')}</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={handleForward}
              >
                <Forward className="h-5 w-5" style={{ color: colors.accent }} />
                <span style={{ color: colors.textPrimary }}>{t('Forward', 'إعادة توجيه')}</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={handleCopy}
              >
                <Copy className="h-5 w-5" style={{ color: colors.accent }} />
                <span style={{ color: colors.textPrimary }}>{t('Copy', 'نسخ')}</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={handleStar}
              >
                <Star className="h-5 w-5" fill={isStarred ? STAR_COLOR : 'none'} style={{ color: isStarred ? STAR_COLOR : colors.accent }} />
                <span style={{ color: isStarred ? STAR_COLOR : colors.textPrimary }}>
                  {isStarred ? t('Unstar', 'إلغاء التميز') : t('Star', 'تمييز')}
                </span>
              </button>
              <div className="h-px my-1" style={{ backgroundColor: colors.divider }} />
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={handleDeleteForMe}
              >
                <Trash2 className="h-5 w-5" style={{ color: colors.missedCall }} />
                <span style={{ color: colors.missedCall }}>{t('Delete for me', 'حذف لي')}</span>
              </button>
              {isOwnMessage && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  onClick={handleDeleteForEveryone}
                >
                  <Trash2 className="h-5 w-5" style={{ color: colors.missedCall }} />
                  <span style={{ color: colors.missedCall }}>{t('Delete for everyone', 'حذف للجميع')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <motion.div 
        className={cn("flex mb-1 group relative", isOwnMessage ? "justify-end" : "justify-start")}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => !dropdownOpen && setShowActions(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={handleContextMenu}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        layout
      >
        <div className="max-w-[75%] relative">
          {/* Starred indicator */}
          {isStarred && (
            <Star 
              className="absolute -top-2 -right-2 h-4 w-4 z-10" 
              fill={STAR_COLOR} 
              style={{ color: STAR_COLOR }} 
            />
          )}

          {/* Reply Preview */}
          {message.reply_to && (
            <div 
              className="rounded-t-lg px-3 py-2 border-l-4"
              style={{ 
                backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                borderLeftColor: colors.accent
              }}
            >
              <p className="text-xs font-medium" style={{ color: colors.accent }}>
                {isOwnMessage ? t('You', 'أنت') : t('Reply', 'رد')}
              </p>
              <p className="text-xs truncate" style={{ color: colors.textMuted }}>
                {message.reply_to.content || '📎 Attachment'}
              </p>
            </div>
          )}

          {/* Message Bubble */}
          <div 
            className={cn(
              "rounded-lg px-3 py-1.5 relative select-none",
              message.reply_to && "rounded-t-none"
            )}
            style={{ 
              backgroundColor: isOwnMessage ? colors.messageSent : colors.messageReceived 
            }}
          >
            {/* Forwarded label */}
            {message.forwarded_from_id && (
              <div className="flex items-center gap-1 mb-1">
                <Forward className="h-3 w-3" style={{ color: colors.textMuted }} />
                <span className="text-xs italic" style={{ color: colors.textMuted }}>
                  {t('Forwarded', 'محول')}
                </span>
              </div>
            )}

            {/* Voice message */}
            {message.message_type === 'voice' && message.voice_duration && (
              (() => {
                const audioUrl = getVoiceAudioUrl();
                if (audioUrl) {
                  return (
                    <VoiceMessageBubble
                      audioUrl={audioUrl}
                      duration={message.voice_duration}
                      isOwnMessage={isOwnMessage}
                      colors={colors}
                    />
                  );
                }
                return (
                  <div className="flex items-center gap-2 text-sm" style={{ color: colors.textMuted }}>
                    <span>🎤 Voice message ({message.voice_duration}s)</span>
                  </div>
                );
              })()
            )}

            {/* Task message */}
            {isTaskMessage && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TASK_STATUS_COLORS[taskStatus as keyof typeof TASK_STATUS_COLORS] || TASK_STATUS_COLORS.pending }}
                  />
                  <span className="text-xs font-medium" style={{ color: colors.accent }}>
                    {t('Task', 'مهمة')}
                  </span>
                </div>
                <p 
                  className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                  style={{ color: colors.textPrimary }}
                >
                  {message.content}
                </p>
                {taskStatus === 'pending' && !isOwnMessage && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="flex-1 h-8"
                      style={{ backgroundColor: colors.taskAccept }}
                    >
                      {t('Accept', 'قبول')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      style={{ 
                        borderColor: colors.taskDecline,
                        color: colors.taskDecline
                      }}
                    >
                      {t('Decline', 'رفض')}
                    </Button>
                  </div>
                )}
                {taskStatus === 'accepted' && (
                  <span className="text-xs" style={{ color: colors.taskAccept }}>
                    ✓ {t('Accepted', 'تم القبول')}
                  </span>
                )}
                {taskStatus === 'declined' && (
                  <span className="text-xs" style={{ color: colors.taskDecline }}>
                    ✗ {t('Declined', 'تم الرفض')}
                  </span>
                )}
              </div>
            )}

            {/* Text content */}
            {message.content && message.message_type !== 'voice' && !isTaskMessage && (
              <p 
                className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                style={{ color: colors.textPrimary }}
              >
                {message.content}
              </p>
            )}

            {/* Attachments - Skip audio attachments for voice messages (handled by VoiceMessageBubble) */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-1 space-y-1">
                {message.attachments
                  .filter(attachment => {
                    // Skip audio attachments for voice messages - they're rendered by VoiceMessageBubble
                    if (message.message_type === 'voice' && attachment.file_type.startsWith('audio/')) {
                      return false;
                    }
                    return true;
                  })
                  .map(attachment => (
                  <div key={attachment.id}>
                    {attachment.file_type.startsWith('image/') ? (
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="rounded max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(attachment.file_url, '_blank')}
                      />
                    ) : attachment.file_type.startsWith('video/') ? (
                      <video
                        src={attachment.file_url}
                        controls
                        className="rounded max-w-full"
                      />
                    ) : (
                      <a
                        href={attachment.file_url}
                        download={attachment.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs rounded p-2"
                        style={{ backgroundColor: colors.bgTertiary }}
                      >
                        <div 
                          className="w-10 h-10 rounded flex items-center justify-center"
                          style={{ backgroundColor: colors.accent }}
                        >
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block" style={{ color: colors.textPrimary }}>
                            {attachment.file_name}
                          </span>
                          <span style={{ color: colors.textMuted }}>
                            {formatFileSize(attachment.file_size)} • {attachment.file_type.split('/')[1]?.toUpperCase()}
                          </span>
                        </div>
                        <Download className="h-4 w-4" style={{ color: colors.textSecondary }} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Time and status - More visible with shadow for contrast */}
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span 
                className="text-[11px] font-semibold drop-shadow-sm"
                style={{ 
                  color: timeColor,
                  textShadow: isOwnMessage 
                    ? '0 1px 2px rgba(0,0,0,0.3)' 
                    : '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {formatTime(message.created_at)}
              </span>
              {isOwnMessage && (
                <span className="flex items-center drop-shadow-sm">
                  {getStatusIcon()}
                </span>
              )}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div 
              className={cn(
                "absolute -bottom-2 px-1.5 py-0.5 rounded-full text-sm flex items-center gap-0.5",
                isOwnMessage ? "left-2" : "right-2"
              )}
              style={{ backgroundColor: colors.bgTertiary }}
            >
              {[...new Set(message.reactions.map(r => r.emoji))].map(emoji => (
                <span key={emoji}>{emoji}</span>
              ))}
              {message.reactions.length > 1 && (
                <span className="text-xs ml-0.5" style={{ color: colors.textMuted }}>
                  {message.reactions.length}
                </span>
              )}
            </div>
          )}

          {/* Hover actions for desktop/tablet */}
          {(showActions || dropdownOpen) && (
            <div 
              className={cn(
                "absolute top-0 flex items-center gap-1 p-1 rounded-lg",
                isOwnMessage ? "-left-24" : "-right-24"
              )}
              style={{ backgroundColor: colors.bgTertiary }}
            >
              {/* Quick reactions */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-white/10"
                  >
                    <Smile className="h-4 w-4" style={{ color: colors.textSecondary }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-2 border-0"
                  style={{ backgroundColor: colors.bgTertiary }}
                >
                  <div className="flex gap-1">
                    {QUICK_REACTIONS.map(emoji => (
                      <button
                        key={emoji}
                        className="text-xl hover:scale-125 transition-transform p-1"
                        onClick={() => onReact?.(message.id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu 
                open={dropdownOpen} 
                onOpenChange={(open) => {
                  setDropdownOpen(open);
                  if (!open) {
                    // Delay hiding actions to prevent flicker
                    setTimeout(() => setShowActions(false), 100);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-white/10"
                  >
                    <MoreVertical className="h-4 w-4" style={{ color: colors.textSecondary }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="border-0 min-w-[180px] z-[300]"
                  style={{ backgroundColor: colors.bgTertiary }}
                  onPointerDownOutside={() => setDropdownOpen(false)}
                >
                  <DropdownMenuItem onClick={handleReply} className="cursor-pointer" style={{ color: colors.textPrimary }}>
                    <Reply className="h-4 w-4 mr-2" /> {t('Reply', 'رد')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleForward} className="cursor-pointer" style={{ color: colors.textPrimary }}>
                    <Forward className="h-4 w-4 mr-2" /> {t('Forward', 'إعادة توجيه')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy} className="cursor-pointer" style={{ color: colors.textPrimary }}>
                    <Copy className="h-4 w-4 mr-2" /> {t('Copy', 'نسخ')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStar} className="cursor-pointer" style={{ color: isStarred ? STAR_COLOR : colors.textPrimary }}>
                    <Star className="h-4 w-4 mr-2" fill={isStarred ? STAR_COLOR : 'none'} /> 
                    {isStarred ? t('Unstar', 'إلغاء التميز') : t('Star', 'تمييز')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ backgroundColor: colors.divider }} />
                  <DropdownMenuItem onClick={handleDeleteForMe} className="cursor-pointer" style={{ color: colors.missedCall }}>
                    <Trash2 className="h-4 w-4 mr-2" /> {t('Delete for me', 'حذف لي')}
                  </DropdownMenuItem>
                  {isOwnMessage && (
                    <DropdownMenuItem onClick={handleDeleteForEveryone} className="cursor-pointer" style={{ color: colors.missedCall }}>
                      <Trash2 className="h-4 w-4 mr-2" /> {t('Delete for everyone', 'حذف للجميع')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
