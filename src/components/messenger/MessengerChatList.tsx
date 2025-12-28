import { useState } from 'react';
import { Conversation, GroupChat } from '@/hooks/useMessenger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Archive, CheckCheck, Users } from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

interface MessengerChatListProps {
  conversations: Conversation[];
  groups: GroupChat[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConversation: (conv: Conversation) => void;
  onSelectGroup: (group: GroupChat) => void;
  onNewChat: () => void;
  showGroupsOnly?: boolean;
  isArabic?: boolean;
}

export function MessengerChatList({
  conversations,
  groups,
  searchTerm,
  onSearchChange,
  onSelectConversation,
  onSelectGroup,
  showGroupsOnly = false,
  isArabic
}: MessengerChatListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'favorites'>('all');

  const formatChatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return isArabic ? 'أمس' : 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'dd/MM/yyyy');
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'unread') return matchesSearch && conv.unread_count > 0;
    return matchesSearch;
  });

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-4 py-2 shrink-0" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
            style={{ color: WHATSAPP_COLORS.textMuted }} 
          />
          <Input
            placeholder={isArabic ? 'ابحث أو ابدأ محادثة جديدة' : 'Search or start new chat'}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-0 rounded-xl h-10"
            style={{ backgroundColor: WHATSAPP_COLORS.inputBg, color: WHATSAPP_COLORS.textPrimary }}
          />
        </div>
      </div>

      {/* Filter chips (only for chats, not groups) */}
      {!showGroupsOnly && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto shrink-0" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
          {(['all', 'unread', 'favorites'] as const).map((f) => (
            <button
              key={f}
              className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: filter === f ? WHATSAPP_COLORS.accent : WHATSAPP_COLORS.bgTertiary,
                color: filter === f ? 'white' : WHATSAPP_COLORS.textSecondary
              }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? (isArabic ? 'الكل' : 'All') :
               f === 'unread' ? (isArabic ? 'غير مقروء' : 'Unread') :
               (isArabic ? 'المفضلة' : 'Favorites')}
            </button>
          ))}
        </div>
      )}

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {/* Archived section */}
        {!showGroupsOnly && (
          <div 
            className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
            style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
          >
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
            >
              <Archive className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
            </div>
            <span className="font-medium" style={{ color: WHATSAPP_COLORS.textPrimary }}>
              {isArabic ? 'مؤرشف' : 'Archived'}
            </span>
          </div>
        )}

        {/* Groups */}
        {(showGroupsOnly || filter === 'all') && filteredGroups.map((group) => (
          <div
            key={group.id}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-white/10 hover:bg-white/5"
            style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
            onClick={() => onSelectGroup(group)}
          >
            <Avatar className="h-14 w-14">
              <AvatarImage src={group.image_url || undefined} />
              <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                <Users className="h-6 w-6 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {group.name}
                </span>
                {group.last_message_time && (
                  <span className="text-xs" style={{ color: WHATSAPP_COLORS.textMuted }}>
                    {formatChatTime(group.last_message_time)}
                  </span>
                )}
              </div>
              <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                {group.description || (isArabic ? 'محادثة جماعية' : 'Group chat')}
              </p>
            </div>
            {group.unread_count > 0 && (
              <Badge 
                className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: WHATSAPP_COLORS.accentLight }}
              >
                {group.unread_count}
              </Badge>
            )}
          </div>
        ))}

        {/* Conversations */}
        {!showGroupsOnly && filteredConversations.map((conv) => (
          <div
            key={conv.recipient_id}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-white/10 hover:bg-white/5"
            style={{ borderBottom: `1px solid ${WHATSAPP_COLORS.divider}` }}
            onClick={() => onSelectConversation(conv)}
          >
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage src={conv.recipient_image || undefined} />
                <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                  {conv.recipient_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              {conv.is_online && (
                <div 
                  className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2"
                  style={{ backgroundColor: WHATSAPP_COLORS.accentLight, borderColor: WHATSAPP_COLORS.bg }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {conv.recipient_name}
                </span>
                <span 
                  className="text-xs" 
                  style={{ color: conv.unread_count > 0 ? WHATSAPP_COLORS.accentLight : WHATSAPP_COLORS.textMuted }}
                >
                  {conv.last_message_time && formatChatTime(conv.last_message_time)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <CheckCheck className="h-4 w-4 shrink-0" style={{ color: WHATSAPP_COLORS.checkBlue }} />
                  <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                    {conv.last_message || (isArabic ? 'لا توجد رسائل بعد' : 'No messages yet')}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <Badge 
                    className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: WHATSAPP_COLORS.accentLight }}
                  >
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredConversations.length === 0 && filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div 
              className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
            >
              {showGroupsOnly ? (
                <Users className="h-10 w-10" style={{ color: WHATSAPP_COLORS.textMuted }} />
              ) : (
                <Search className="h-10 w-10" style={{ color: WHATSAPP_COLORS.textMuted }} />
              )}
            </div>
            <p className="text-center" style={{ color: WHATSAPP_COLORS.textSecondary }}>
              {showGroupsOnly 
                ? (isArabic ? 'لا توجد مجموعات بعد' : 'No groups yet')
                : (isArabic ? 'لا توجد محادثات' : 'No conversations')}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
