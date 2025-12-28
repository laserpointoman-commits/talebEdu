import { useState } from 'react';
import { Check, CheckCheck, Clock, Reply, Forward, Trash2, Copy, Smile, MoreVertical, FileText, Download, Play, Pause, Mic, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MESSENGER_COLORS, QUICK_REACTIONS, STAR_COLOR, TASK_STATUS_COLORS } from './MessengerTheme';
import { Message } from '@/hooks/useMessenger';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface MessageBubbleProps {
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
}

export function MessageBubble({
  message,
  isOwnMessage,
  onReply,
  onForward,
  onDelete,
  onReact,
  onRemoveReaction,
  onStar,
  isStarred = false,
  isArabic = false
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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

  const getStatusIcon = () => {
    if (message.is_read) {
      return <CheckCheck className="h-4 w-4" style={{ color: MESSENGER_COLORS.checkBlue }} />;
    } else if (message.is_delivered) {
      return <CheckCheck className="h-4 w-4" style={{ color: MESSENGER_COLORS.checkGray }} />;
    } else {
      return <Check className="h-4 w-4" style={{ color: MESSENGER_COLORS.checkGray }} />;
    }
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [1, 1.5, 2, 0.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  // Check if this is a task message
  const isTaskMessage = message.message_type === 'task';
  const taskStatus = (message as any).task_status; // 'pending' | 'accepted' | 'declined'

  // Handle deleted message
  if (message.deleted_for_everyone) {
    return (
      <div className={cn("flex mb-1", isOwnMessage ? "justify-end" : "justify-start")}>
        <div 
          className="max-w-[75%] rounded-lg px-3 py-2 italic"
          style={{ 
            backgroundColor: isOwnMessage ? MESSENGER_COLORS.messageSent : MESSENGER_COLORS.messageReceived,
            opacity: 0.7
          }}
        >
          <p className="text-sm" style={{ color: MESSENGER_COLORS.textMuted }}>
            🚫 {t('This message was deleted', 'تم حذف هذه الرسالة')}
          </p>
        </div>
      </div>
    );
  }

  const userReaction = message.reactions?.find(r => r.user_id === message.sender_id);

  const messageActions = (
    <>
      <ContextMenuItem 
        onClick={() => onReply?.(message)}
        className="flex items-center gap-2"
        style={{ color: MESSENGER_COLORS.textPrimary }}
      >
        <Reply className="h-4 w-4" />
        {t('Reply', 'رد')}
      </ContextMenuItem>
      <ContextMenuItem 
        onClick={() => onForward?.(message)}
        className="flex items-center gap-2"
        style={{ color: MESSENGER_COLORS.textPrimary }}
      >
        <Forward className="h-4 w-4" />
        {t('Forward', 'إعادة توجيه')}
      </ContextMenuItem>
      <ContextMenuItem 
        onClick={() => navigator.clipboard.writeText(message.content || '')}
        className="flex items-center gap-2"
        style={{ color: MESSENGER_COLORS.textPrimary }}
      >
        <Copy className="h-4 w-4" />
        {t('Copy', 'نسخ')}
      </ContextMenuItem>
      <ContextMenuItem 
        onClick={() => onStar?.(message.id)}
        className="flex items-center gap-2"
        style={{ color: isStarred ? STAR_COLOR : MESSENGER_COLORS.textPrimary }}
      >
        <Star className="h-4 w-4" fill={isStarred ? STAR_COLOR : 'none'} />
        {isStarred ? t('Unstar', 'إلغاء التميز') : t('Star', 'تمييز')}
      </ContextMenuItem>
      <ContextMenuSeparator style={{ backgroundColor: MESSENGER_COLORS.divider }} />
      <ContextMenuItem 
        onClick={() => onDelete?.(message.id, false)}
        className="flex items-center gap-2"
        style={{ color: MESSENGER_COLORS.missedCall }}
      >
        <Trash2 className="h-4 w-4" />
        {t('Delete for me', 'حذف لي')}
      </ContextMenuItem>
      {isOwnMessage && (
        <ContextMenuItem 
          onClick={() => onDelete?.(message.id, true)}
          className="flex items-center gap-2"
          style={{ color: MESSENGER_COLORS.missedCall }}
        >
          <Trash2 className="h-4 w-4" />
          {t('Delete for everyone', 'حذف للجميع')}
        </ContextMenuItem>
      )}
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          className={cn("flex mb-1 group relative", isOwnMessage ? "justify-end" : "justify-start")}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
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
                  borderLeftColor: MESSENGER_COLORS.accent
                }}
              >
                <p className="text-xs font-medium" style={{ color: MESSENGER_COLORS.accent }}>
                  {isOwnMessage ? t('You', 'أنت') : t('Reply', 'رد')}
                </p>
                <p className="text-xs truncate" style={{ color: MESSENGER_COLORS.textMuted }}>
                  {message.reply_to.content || '📎 Attachment'}
                </p>
              </div>
            )}

            {/* Message Bubble */}
            <div 
              className={cn(
                "rounded-lg px-3 py-1.5 relative",
                message.reply_to && "rounded-t-none"
              )}
              style={{ 
                backgroundColor: isOwnMessage ? MESSENGER_COLORS.messageSent : MESSENGER_COLORS.messageReceived 
              }}
            >
              {/* Forwarded label */}
              {message.forwarded_from_id && (
                <div className="flex items-center gap-1 mb-1">
                  <Forward className="h-3 w-3" style={{ color: MESSENGER_COLORS.textMuted }} />
                  <span className="text-xs italic" style={{ color: MESSENGER_COLORS.textMuted }}>
                    {t('Forwarded', 'محول')}
                  </span>
                </div>
              )}

              {/* Voice message */}
              {message.message_type === 'voice' && message.voice_duration && (
                <div className="flex items-center gap-3 min-w-[200px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    style={{ backgroundColor: MESSENGER_COLORS.accent }}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="h-1 rounded-full" style={{ backgroundColor: MESSENGER_COLORS.textMuted }}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ backgroundColor: MESSENGER_COLORS.accent, width: isPlaying ? '60%' : '0%' }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs" style={{ color: MESSENGER_COLORS.textMuted }}>
                        {formatDuration(message.voice_duration)}
                      </span>
                      <button 
                        onClick={cyclePlaybackSpeed}
                        className="text-xs px-1 rounded"
                        style={{ 
                          backgroundColor: MESSENGER_COLORS.bgTertiary,
                          color: MESSENGER_COLORS.textSecondary 
                        }}
                      >
                        {playbackSpeed}x
                      </button>
                    </div>
                  </div>
                  <Mic className="h-4 w-4" style={{ color: MESSENGER_COLORS.accent }} />
                </div>
              )}

              {/* Task message */}
              {isTaskMessage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TASK_STATUS_COLORS[taskStatus as keyof typeof TASK_STATUS_COLORS] || TASK_STATUS_COLORS.pending }}
                    />
                    <span className="text-xs font-medium" style={{ color: MESSENGER_COLORS.accent }}>
                      {t('Task', 'مهمة')}
                    </span>
                  </div>
                  <p 
                    className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                    style={{ color: MESSENGER_COLORS.textPrimary }}
                  >
                    {message.content}
                  </p>
                  {taskStatus === 'pending' && !isOwnMessage && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8"
                        style={{ backgroundColor: MESSENGER_COLORS.taskAccept }}
                      >
                        {t('Accept', 'قبول')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8"
                        style={{ 
                          borderColor: MESSENGER_COLORS.taskDecline,
                          color: MESSENGER_COLORS.taskDecline
                        }}
                      >
                        {t('Decline', 'رفض')}
                      </Button>
                    </div>
                  )}
                  {taskStatus === 'accepted' && (
                    <span className="text-xs" style={{ color: MESSENGER_COLORS.taskAccept }}>
                      ✓ {t('Accepted', 'تم القبول')}
                    </span>
                  )}
                  {taskStatus === 'declined' && (
                    <span className="text-xs" style={{ color: MESSENGER_COLORS.taskDecline }}>
                      ✗ {t('Declined', 'تم الرفض')}
                    </span>
                  )}
                </div>
              )}

              {/* Text content */}
              {message.content && message.message_type !== 'voice' && !isTaskMessage && (
                <p 
                  className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                  style={{ color: MESSENGER_COLORS.textPrimary }}
                >
                  {message.content}
                </p>
              )}

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-1 space-y-1">
                  {message.attachments.map(attachment => (
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
                          style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
                        >
                          <div 
                            className="w-10 h-10 rounded flex items-center justify-center"
                            style={{ backgroundColor: MESSENGER_COLORS.accent }}
                          >
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="truncate block" style={{ color: MESSENGER_COLORS.textPrimary }}>
                              {attachment.file_name}
                            </span>
                            <span style={{ color: MESSENGER_COLORS.textMuted }}>
                              {formatFileSize(attachment.file_size)} • {attachment.file_type.split('/')[1]?.toUpperCase()}
                            </span>
                          </div>
                          <Download className="h-4 w-4" style={{ color: MESSENGER_COLORS.textSecondary }} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Time and status */}
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[10px]" style={{ color: MESSENGER_COLORS.textMuted }}>
                  {formatTime(message.created_at)}
                </span>
                {isOwnMessage && getStatusIcon()}
              </div>
            </div>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div 
                className={cn(
                  "absolute -bottom-2 px-1.5 py-0.5 rounded-full text-sm flex items-center gap-0.5",
                  isOwnMessage ? "left-2" : "right-2"
                )}
                style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
              >
                {[...new Set(message.reactions.map(r => r.emoji))].map(emoji => (
                  <span key={emoji}>{emoji}</span>
                ))}
                {message.reactions.length > 1 && (
                  <span className="text-xs ml-0.5" style={{ color: MESSENGER_COLORS.textMuted }}>
                    {message.reactions.length}
                  </span>
                )}
              </div>
            )}

            {/* Hover actions */}
            {showActions && (
              <div 
                className={cn(
                  "absolute top-0 flex items-center gap-1 p-1 rounded-lg",
                  isOwnMessage ? "-left-24" : "-right-24"
                )}
                style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
              >
                {/* Quick reactions */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-white/10"
                    >
                      <Smile className="h-4 w-4" style={{ color: MESSENGER_COLORS.textSecondary }} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-2 border-0"
                    style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
                  >
                    <div className="flex gap-1">
                      {QUICK_REACTIONS.map(emoji => (
                        <button
                          key={emoji}
                          className="text-xl hover:scale-125 transition-transform p-1"
                          onClick={() => {
                            if (userReaction?.emoji === emoji) {
                              onRemoveReaction?.(message.id);
                            } else {
                              onReact?.(message.id, emoji);
                            }
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* More options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-white/10"
                    >
                      <MoreVertical className="h-4 w-4" style={{ color: MESSENGER_COLORS.textSecondary }} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="border-0"
                    style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
                  >
                    <DropdownMenuItem 
                      onClick={() => onReply?.(message)}
                      style={{ color: MESSENGER_COLORS.textPrimary }}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      {t('Reply', 'رد')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onForward?.(message)}
                      style={{ color: MESSENGER_COLORS.textPrimary }}
                    >
                      <Forward className="h-4 w-4 mr-2" />
                      {t('Forward', 'إعادة توجيه')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigator.clipboard.writeText(message.content || '')}
                      style={{ color: MESSENGER_COLORS.textPrimary }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {t('Copy', 'نسخ')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onStar?.(message.id)}
                      style={{ color: isStarred ? STAR_COLOR : MESSENGER_COLORS.textPrimary }}
                    >
                      <Star className="h-4 w-4 mr-2" fill={isStarred ? STAR_COLOR : 'none'} />
                      {isStarred ? t('Unstar', 'إلغاء التميز') : t('Star', 'تمييز')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(message.id, false)}
                      style={{ color: MESSENGER_COLORS.missedCall }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('Delete for me', 'حذف لي')}
                    </DropdownMenuItem>
                    {isOwnMessage && (
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(message.id, true)}
                        style={{ color: MESSENGER_COLORS.missedCall }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('Delete for everyone', 'حذف للجميع')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent 
        className="border-0 w-48"
        style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
      >
        {messageActions}
      </ContextMenuContent>
    </ContextMenu>
  );
}