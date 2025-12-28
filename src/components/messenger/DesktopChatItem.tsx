import { useState } from 'react';
import { Conversation } from '@/hooks/useMessenger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, Archive, Pin, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface DesktopChatItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (convId: string) => void;
  onArchive?: (convId: string) => void;
  onPin?: (convId: string) => void;
  isPinned?: boolean;
  canPin?: boolean;
  isArabic?: boolean;
  colors: {
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentLight: string;
    checkBlue: string;
    divider: string;
    bgSecondary: string;
    bgTertiary: string;
    swipeDelete: string;
    swipeArchive: string;
    swipePin: string;
  };
  formatTime: (timestamp: string | null) => string;
}

export function DesktopChatItem({
  conversation,
  isSelected,
  onClick,
  onDelete,
  onArchive,
  onPin,
  isPinned = false,
  canPin = false,
  isArabic = false,
  colors,
  formatTime
}: DesktopChatItemProps) {
  const [showHoverActions, setShowHoverActions] = useState(false);
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const contextMenuContent = (
    <>
      {canPin && (
        <ContextMenuItem
          onClick={() => onPin?.(conversation.recipient_id)}
          className="flex items-center gap-2"
          style={{ color: colors.textPrimary }}
        >
          <Pin className="h-4 w-4" style={{ color: colors.swipePin }} />
          {isPinned ? t('Unpin', 'إلغاء التثبيت') : t('Pin', 'تثبيت')}
        </ContextMenuItem>
      )}
      <ContextMenuItem
        onClick={() => onArchive?.(conversation.recipient_id)}
        className="flex items-center gap-2"
        style={{ color: colors.textPrimary }}
      >
        <Archive className="h-4 w-4" style={{ color: colors.swipeArchive }} />
        {t('Archive', 'أرشفة')}
      </ContextMenuItem>
      <ContextMenuSeparator style={{ backgroundColor: colors.divider }} />
      <ContextMenuItem
        onClick={() => onDelete?.(conversation.recipient_id)}
        className="flex items-center gap-2"
        style={{ color: colors.swipeDelete }}
      >
        <Trash2 className="h-4 w-4" />
        {t('Delete chat', 'حذف المحادثة')}
      </ContextMenuItem>
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 relative",
            isSelected && "bg-white/10"
          )}
          style={{ borderBottom: `1px solid ${colors.divider}` }}
          onClick={onClick}
          onMouseEnter={() => setShowHoverActions(true)}
          onMouseLeave={() => setShowHoverActions(false)}
        >
          {/* Pin indicator */}
          {isPinned && (
            <div className="absolute top-2 right-2">
              <Pin className="h-3 w-3" style={{ color: colors.swipePin }} />
            </div>
          )}

          <div className="relative shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.recipient_image || undefined} />
              <AvatarFallback style={{ backgroundColor: colors.accent }}>
                {conversation.recipient_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {conversation.is_online && (
              <div
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2"
                style={{ backgroundColor: colors.accentLight, borderColor: colors.bgSecondary }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate" style={{ color: colors.textPrimary }}>
                {conversation.recipient_name}
              </span>
              <span
                className="text-xs shrink-0 ml-2"
                style={{ color: conversation.unread_count > 0 ? colors.accentLight : colors.textMuted }}
              >
                {conversation.last_message_time && formatTime(conversation.last_message_time)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCheck className="h-4 w-4 shrink-0" style={{ color: colors.checkBlue }} />
              <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                {conversation.last_message || t('No messages yet', 'لا توجد رسائل بعد')}
              </p>
              {/* Typing indicator */}
              {conversation.is_typing && (
                <span className="text-xs italic ml-1" style={{ color: colors.accentLight }}>
                  {t('typing...', 'يكتب...')}
                </span>
              )}
              {conversation.unread_count > 0 && (
                <Badge
                  className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs shrink-0 ml-auto"
                  style={{ backgroundColor: colors.accentLight }}
                >
                  {conversation.unread_count}
                </Badge>
              )}
            </div>
          </div>

          {/* Hover actions dropdown */}
          {showHoverActions && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" style={{ color: colors.textSecondary }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.divider}` }}
                >
                  {canPin && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onPin?.(conversation.recipient_id);
                      }}
                      className="flex items-center gap-2"
                      style={{ color: colors.textPrimary }}
                    >
                      <Pin className="h-4 w-4" style={{ color: colors.swipePin }} />
                      {isPinned ? t('Unpin', 'إلغاء التثبيت') : t('Pin', 'تثبيت')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive?.(conversation.recipient_id);
                    }}
                    className="flex items-center gap-2"
                    style={{ color: colors.textPrimary }}
                  >
                    <Archive className="h-4 w-4" style={{ color: colors.swipeArchive }} />
                    {t('Archive', 'أرشفة')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ backgroundColor: colors.divider }} />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(conversation.recipient_id);
                    }}
                    className="flex items-center gap-2"
                    style={{ color: colors.swipeDelete }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('Delete chat', 'حذف المحادثة')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.divider}` }}>
        {contextMenuContent}
      </ContextMenuContent>
    </ContextMenu>
  );
}
