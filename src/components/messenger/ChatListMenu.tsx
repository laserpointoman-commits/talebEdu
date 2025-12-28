import { useState } from 'react';
import { MoreVertical, CheckCheck, CheckSquare, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatListMenuProps {
  onSelectChats: () => void;
  onMarkAllRead: () => void;
  isSelectMode: boolean;
  onCancelSelect: () => void;
  selectedCount: number;
  isArabic?: boolean;
  colors: {
    textPrimary: string;
    textSecondary: string;
    bgTertiary: string;
    accent: string;
    divider: string;
  };
}

export function ChatListMenu({
  onSelectChats,
  onMarkAllRead,
  isSelectMode,
  onCancelSelect,
  selectedCount,
  isArabic = false,
  colors
}: ChatListMenuProps) {
  const t = (en: string, ar: string) => isArabic ? ar : en;

  if (isSelectMode) {
    return (
      <div className="flex items-center gap-2">
        <span 
          className="text-sm font-medium"
          style={{ color: colors.textPrimary }}
        >
          {selectedCount} {t('selected', 'محدد')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-white/10"
          onClick={onCancelSelect}
        >
          <X className="h-5 w-5" style={{ color: colors.textPrimary }} />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 hover:bg-white/10 rounded-full"
        >
          <MoreVertical className="h-5 w-5" style={{ color: colors.textSecondary }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="min-w-[180px] border-0"
        style={{ backgroundColor: colors.bgTertiary }}
      >
        <DropdownMenuItem 
          onClick={onSelectChats}
          className="flex items-center gap-3 py-3 cursor-pointer"
          style={{ color: colors.textPrimary }}
        >
          <CheckSquare className="h-5 w-5" style={{ color: colors.accent }} />
          {t('Select chats', 'تحديد المحادثات')}
        </DropdownMenuItem>
        <DropdownMenuSeparator style={{ backgroundColor: colors.divider }} />
        <DropdownMenuItem 
          onClick={onMarkAllRead}
          className="flex items-center gap-3 py-3 cursor-pointer"
          style={{ color: colors.textPrimary }}
        >
          <CheckCheck className="h-5 w-5" style={{ color: colors.accent }} />
          {t('Mark all as read', 'تعليم الكل كمقروء')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
