import { useState } from 'react';
import { Conversation, GroupChat } from '@/hooks/useMessenger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, MessageCircle, Clock } from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';

interface MessengerSearchProps {
  conversations: Conversation[];
  groups: GroupChat[];
  onSelectConversation: (conv: Conversation) => void;
  onSelectGroup: (group: GroupChat) => void;
  isArabic?: boolean;
}

export function MessengerSearch({
  conversations,
  groups,
  onSelectConversation,
  onSelectGroup,
  isArabic
}: MessengerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasResults = filteredConversations.length > 0 || filteredGroups.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="px-4 py-3 shrink-0" style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}>
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
            style={{ color: WHATSAPP_COLORS.textMuted }} 
          />
          <Input
            placeholder={isArabic ? 'ابحث في الرسائل والمحادثات...' : 'Search messages and chats...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 border-0 rounded-xl h-12 text-base"
            style={{ backgroundColor: WHATSAPP_COLORS.inputBg, color: WHATSAPP_COLORS.textPrimary }}
            autoFocus
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {searchQuery ? (
          <>
            {/* Groups Results */}
            {filteredGroups.length > 0 && (
              <>
                <h3 
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: WHATSAPP_COLORS.textMuted }}
                >
                  {isArabic ? 'المجموعات' : 'Groups'}
                </h3>
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                    onClick={() => onSelectGroup(group)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={group.image_url || undefined} />
                      <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                        <Users className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                        {group.name}
                      </p>
                      <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                        {group.members?.length || 0} {isArabic ? 'أعضاء' : 'members'}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Conversations Results */}
            {filteredConversations.length > 0 && (
              <>
                <h3 
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: WHATSAPP_COLORS.textMuted }}
                >
                  {isArabic ? 'المحادثات' : 'Chats'}
                </h3>
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.recipient_id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                    onClick={() => onSelectConversation(conv)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.recipient_image || undefined} />
                      <AvatarFallback style={{ backgroundColor: WHATSAPP_COLORS.accent }}>
                        {conv.recipient_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                        {conv.recipient_name}
                      </p>
                      <p className="text-sm truncate" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                        {conv.last_message || (isArabic ? 'بدء محادثة' : 'Start a conversation')}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* No Results */}
            {!hasResults && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div 
                  className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: WHATSAPP_COLORS.bgTertiary }}
                >
                  <Search className="h-10 w-10" style={{ color: WHATSAPP_COLORS.textMuted }} />
                </div>
                <p className="text-center font-medium mb-1" style={{ color: WHATSAPP_COLORS.textPrimary }}>
                  {isArabic ? 'لا توجد نتائج' : 'No results found'}
                </p>
                <p className="text-center text-sm" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                  {isArabic ? 'جرب البحث بكلمات مختلفة' : 'Try searching with different keywords'}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Recent Searches / Suggestions */
          <div className="px-4 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" style={{ color: WHATSAPP_COLORS.textMuted }} />
              <span className="text-sm font-medium" style={{ color: WHATSAPP_COLORS.textSecondary }}>
                {isArabic ? 'البحث الأخير' : 'Recent searches'}
              </span>
            </div>
            <p className="text-sm text-center py-8" style={{ color: WHATSAPP_COLORS.textMuted }}>
              {isArabic ? 'ابحث عن أشخاص أو مجموعات أو رسائل' : 'Search for people, groups, or messages'}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
