import { useState, useRef, useEffect } from 'react';
import { Conversation, GroupChat } from '@/hooks/useMessenger';
import { useMessengerTheme } from '@/contexts/MessengerThemeContext';
import { getMessengerColors, MESSENGER_GRADIENTS } from './MessengerThemeColors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancedMessageBubble } from './EnhancedMessageBubble';
import { ChatInput } from './ChatInput';
import { MessengerSettingsWithTheme } from './MessengerSettingsWithTheme';
import { MessengerContacts } from './MessengerContacts';
import { MessengerCalls } from './MessengerCalls';
import { DesktopChatItem } from './DesktopChatItem';
import { TypingIndicator } from './TypingIndicator';
import { OnlineStatusBadge } from './OnlineStatusBadge';
import { ChatListMenu } from './ChatListMenu';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { 
  Search, 
  MessageCircle, 
  Users,
  Phone,
  Video,
  Settings,
  ArrowLeft,
  Archive,
  Filter,
  Plus,
  PhoneCall,
  UserCircle
} from 'lucide-react';

interface MessengerDesktopLayoutProps {
  profile: any;
  user: any;
  conversations: Conversation[];
  groups: GroupChat[];
  messages: any[];
  callLogs: any[];
  selectedConversation: Conversation | null;
  selectedGroup: GroupChat | null;
  onSelectConversation: (conv: Conversation) => void;
  onSelectGroup: (group: GroupChat) => void;
  onSendMessage: (content: string, files: File[], replyToMsg?: any) => void;
  onVoiceSend: (audioBlob: Blob, duration: number) => void;
  onTyping: (recipientId: string, typing: boolean) => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onDeleteMessage: (msgId: string, forEveryone: boolean) => void;
  onReact: (msgId: string, emoji: string) => void;
  onRemoveReaction: (msgId: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onBack: () => void;
  onDeleteChat?: (convId: string) => void;
  onArchiveChat?: (convId: string) => void;
  onPinChat?: (convId: string) => void;
  onMarkAllRead?: () => void;
  onContactInfoClick?: () => void;
  pinnedChats?: Set<string>;
  canPin?: boolean;
  isArabic?: boolean;
  searchUsers?: (query: string) => Promise<any[]>;
}

type SidebarTab = 'chats' | 'groups' | 'contacts' | 'calls' | 'settings';

export function MessengerDesktopLayout({
  profile,
  user,
  conversations,
  groups,
  messages,
  callLogs,
  selectedConversation,
  selectedGroup,
  onSelectConversation,
  onSelectGroup,
  onSendMessage,
  onVoiceSend,
  onTyping,
  onVoiceCall,
  onVideoCall,
  onDeleteMessage,
  onReact,
  onRemoveReaction,
  onNewChat,
  onNewGroup,
  onBack,
  onDeleteChat,
  onArchiveChat,
  onPinChat,
  onMarkAllRead,
  onContactInfoClick,
  pinnedChats = new Set(),
  canPin = false,
  isArabic,
  searchUsers
}: MessengerDesktopLayoutProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Dynamic theme
  const { isDark } = useMessengerTheme();
  const colors = getMessengerColors(isDark);
  
  // Force LTR layout for consistent UI, text direction handled separately
  const t = (en: string, ar: string) => isArabic ? ar : en;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatChatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return isArabic ? 'أمس' : 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'dd/MM/yyyy');
  };

  const groupMessagesByDate = (msgs: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.created_at);
      let key: string;
      if (isToday(date)) {
        key = isArabic ? 'اليوم' : 'Today';
      } else if (isYesterday(date)) {
        key = isArabic ? 'أمس' : 'Yesterday';
      } else {
        key = format(date, 'MMMM d, yyyy');
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(msg);
    });
    return grouped;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentChat = selectedConversation || selectedGroup;
  const chatName = selectedConversation?.recipient_name || selectedGroup?.name || '';
  const chatImage = selectedConversation?.recipient_image || selectedGroup?.image_url || '';
  const isOnline = selectedConversation?.is_online || false;
  const isTyping = selectedConversation?.is_typing || false;

  return (
    <div 
      className="fixed inset-0 flex z-[100]" 
      style={{ backgroundColor: colors.bg }}
      dir="ltr"
    >
      {/* Left Sidebar */}
      <div 
        className="w-[400px] xl:w-[420px] flex flex-col border-r shrink-0"
        style={{ borderColor: colors.divider, backgroundColor: colors.bgSecondary }}
      >
        {/* Sidebar Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ backgroundColor: colors.headerBg }}
        >
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-white/10 shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" style={{ color: colors.textPrimary }} />
            </Button>
            <Avatar className="h-10 w-10 cursor-pointer" onClick={() => setActiveTab('settings')}>
              <AvatarImage src={profile?.profile_image || profile?.avatar_url} />
              <AvatarFallback style={{ backgroundColor: colors.accent }}>
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold" style={{ color: colors.textPrimary }}>
              {t('Messenger', 'المحادثات')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Chat list menu with select and mark all read */}
            <ChatListMenu
              onSelectChats={() => setIsSelectMode(true)}
              onMarkAllRead={onMarkAllRead || (() => {})}
              isSelectMode={isSelectMode}
              onCancelSelect={() => {
                setIsSelectMode(false);
                setSelectedChats(new Set());
              }}
              selectedCount={selectedChats.size}
              isArabic={isArabic}
              colors={colors}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-white/10"
                    onClick={activeTab === 'groups' ? onNewGroup : onNewChat}
                  >
                    <Plus className="h-5 w-5" style={{ color: colors.textSecondary }} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {activeTab === 'groups' 
                    ? t('New group', 'مجموعة جديدة')
                    : t('New chat', 'محادثة جديدة')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 shrink-0" style={{ backgroundColor: colors.bgSecondary }}>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
              style={{ color: colors.textMuted }} 
            />
            <Input
              placeholder={t('Search or start new chat', 'ابحث أو ابدأ محادثة جديدة')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-16 border-0 rounded-lg h-9"
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary }}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-white/10"
            >
              <Filter className="h-4 w-4" style={{ color: colors.textMuted }} />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SidebarTab)} className="shrink-0">
          <TabsList 
            className="w-full justify-start gap-0 h-12 rounded-none border-b p-0"
            style={{ backgroundColor: colors.bgSecondary, borderColor: colors.divider }}
          >
            <TabsTrigger 
              value="chats" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none transition-colors"
              style={{ 
                borderColor: activeTab === 'chats' ? colors.accent : 'transparent',
                color: activeTab === 'chats' ? colors.accent : colors.textSecondary 
              }}
            >
              <MessageCircle className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="groups" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none transition-colors"
              style={{ 
                borderColor: activeTab === 'groups' ? colors.accent : 'transparent',
                color: activeTab === 'groups' ? colors.accent : colors.textSecondary 
              }}
            >
              <Users className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="contacts" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none transition-colors"
              style={{ 
                borderColor: activeTab === 'contacts' ? colors.accent : 'transparent',
                color: activeTab === 'contacts' ? colors.accent : colors.textSecondary 
              }}
            >
              <UserCircle className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="calls" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none transition-colors"
              style={{ 
                borderColor: activeTab === 'calls' ? colors.accent : 'transparent',
                color: activeTab === 'calls' ? colors.accent : colors.textSecondary 
              }}
            >
              <PhoneCall className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-1 h-full rounded-none border-b-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none transition-colors"
              style={{ 
                borderColor: activeTab === 'settings' ? colors.accent : 'transparent',
                color: activeTab === 'settings' ? colors.accent : colors.textSecondary 
              }}
            >
              <Settings className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        <ScrollArea className="flex-1">
          {activeTab === 'settings' ? (
            <MessengerSettingsWithTheme profile={profile} isArabic={isArabic} />
          ) : activeTab === 'contacts' ? (
            <MessengerContacts
              onSelectContact={(contact) => {
                const newConv: Conversation = {
                  id: contact.id,
                  recipient_id: contact.id,
                  recipient_name: contact.full_name,
                  recipient_image: contact.profile_image,
                  last_message: null,
                  last_message_time: null,
                  unread_count: 0,
                  is_group: false,
                  is_online: false
                };
                onSelectConversation(newConv);
              }}
              isArabic={isArabic}
            />
          ) : activeTab === 'calls' ? (
            <MessengerCalls 
              callLogs={callLogs} 
              isArabic={isArabic} 
              searchUsers={searchUsers}
              currentUserId={user?.id}
            />
          ) : (
            <>
              {/* Archived (only for chats) */}
              {activeTab === 'chats' && (
                <div 
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                >
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: colors.bgTertiary }}
                  >
                    <Archive className="h-5 w-5" style={{ color: colors.accent }} />
                  </div>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>
                    {t('Archived', 'مؤرشف')}
                  </span>
                </div>
              )}

              {/* Groups */}
              {(activeTab === 'groups' || (activeTab === 'chats' && filteredGroups.length > 0)) && 
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${
                      selectedGroup?.id === group.id ? 'bg-white/10' : ''
                    }`}
                    style={{ borderBottom: `1px solid ${colors.divider}` }}
                    onClick={() => onSelectGroup(group)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={group.image_url || undefined} />
                      <AvatarFallback style={{ backgroundColor: colors.accent }}>
                        <Users className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate" style={{ color: colors.textPrimary }}>
                          {group.name}
                        </span>
                        {group.last_message_time && (
                          <span className="text-xs shrink-0 ml-2" style={{ color: colors.textMuted }}>
                            {formatChatTime(group.last_message_time)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                        {group.description || t('Group chat', 'محادثة جماعية')}
                      </p>
                    </div>
                    {group.unread_count > 0 && (
                      <Badge 
                        className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs shrink-0"
                        style={{ backgroundColor: colors.accentLight }}
                      >
                        {group.unread_count}
                      </Badge>
                    )}
                  </div>
                ))}

              {/* Conversations with context menu */}
              {activeTab === 'chats' && filteredConversations.map((conv) => (
                <DesktopChatItem
                  key={conv.recipient_id}
                  conversation={conv}
                  isSelected={selectedConversation?.recipient_id === conv.recipient_id}
                  onClick={() => onSelectConversation(conv)}
                  onDelete={onDeleteChat}
                  onArchive={onArchiveChat}
                  onPin={onPinChat}
                  isPinned={pinnedChats.has(conv.recipient_id)}
                  canPin={canPin}
                  isArabic={isArabic}
                  colors={colors}
                  formatTime={formatChatTime}
                />
              ))}

              {/* Empty state */}
              {((activeTab === 'chats' && filteredConversations.length === 0 && filteredGroups.length === 0) ||
                (activeTab === 'groups' && filteredGroups.length === 0)) && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div 
                    className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: colors.bgTertiary }}
                  >
                    {activeTab === 'groups' ? (
                      <Users className="h-10 w-10" style={{ color: colors.textMuted }} />
                    ) : (
                      <MessageCircle className="h-10 w-10" style={{ color: colors.textMuted }} />
                    )}
                  </div>
                  <p className="text-center" style={{ color: colors.textSecondary }}>
                    {activeTab === 'groups' 
                      ? t('No groups yet', 'لا توجد مجموعات بعد')
                      : t('No conversations', 'لا توجد محادثات')}
                  </p>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: colors.bg }}>
        {currentChat ? (
          <>
            {/* Simplified Chat Header - no three-dot menu, no search, no camera */}
            <div 
              className="flex items-center justify-between px-4 py-2 shrink-0 border-b"
              style={{ backgroundColor: colors.headerBg, borderColor: colors.divider }}
            >
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onContactInfoClick}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chatImage || undefined} />
                    <AvatarFallback style={{ backgroundColor: colors.accent }}>
                      {selectedGroup ? <Users className="h-5 w-5 text-white" /> : chatName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && !selectedGroup && (
                    <div 
                      className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
                      style={{ backgroundColor: colors.accentLight, borderColor: colors.headerBg }}
                    />
                  )}
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    {chatName}
                  </p>
                  {/* Online/Typing status indicator */}
                  {selectedGroup ? (
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {t('Group chat', 'محادثة جماعية')}
                    </p>
                  ) : (
                    <OnlineStatusBadge
                      isOnline={isOnline}
                      isTyping={isTyping}
                      lastSeen={selectedConversation?.last_seen}
                      isArabic={isArabic}
                      colors={colors}
                    />
                  )}
                </div>
              </div>
              {/* Only voice and video call buttons - simplified */}
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-white/10"
                        onClick={onVideoCall}
                      >
                        <Video className="h-5 w-5" style={{ color: colors.textSecondary }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('Video call', 'مكالمة فيديو')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-white/10"
                        onClick={onVoiceCall}
                      >
                        <Phone className="h-5 w-5" style={{ color: colors.textSecondary }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('Voice call', 'مكالمة صوتية')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea 
              className="flex-1 px-4 lg:px-16 py-4"
              style={{ 
                backgroundColor: colors.chatBg,
                backgroundImage: isDark
                  ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                  : 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2338BDF8\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            >
              <div className="max-w-4xl mx-auto space-y-1">
                {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                  <div key={date}>
                    <div className="flex justify-center my-4">
                      <span 
                        className="px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm"
                        style={{ 
                          backgroundColor: colors.bgTertiary, 
                          color: colors.textSecondary 
                        }}
                      >
                        {date}
                      </span>
                    </div>
                    {(dateMessages as any[]).map((msg) => (
                      <EnhancedMessageBubble
                        key={msg.id}
                        message={msg}
                        isOwnMessage={msg.sender_id === user?.id}
                        onReply={(m) => setReplyTo(m)}
                        onForward={() => {}}
                        onDelete={(msgId, forEveryone) => onDeleteMessage(msgId, forEveryone)}
                        onReact={(msgId, emoji) => onReact(msgId, emoji)}
                        onRemoveReaction={(msgId) => onRemoveReaction(msgId)}
                        isArabic={isArabic}
                        colors={colors}
                      />
                    ))}
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <TypingIndicator 
                    colors={colors} 
                    userName={selectedConversation?.recipient_name}
                    isArabic={isArabic} 
                  />
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <ChatInput
              onSend={(content, files) => onSendMessage(content, files, replyTo)}
              onVoiceSend={onVoiceSend}
              onTyping={(typing) => onTyping(selectedConversation?.recipient_id || '', typing)}
              replyingTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              isArabic={isArabic}
            />
          </>
        ) : (
          // Empty state - No chat selected
          <div className="flex-1 flex flex-col items-center justify-center" style={{ backgroundColor: colors.bg }}>
            <div 
              className="h-32 w-32 rounded-full flex items-center justify-center mb-6"
              style={{ background: MESSENGER_GRADIENTS.accent }}
            >
              <MessageCircle className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-2xl font-light mb-2" style={{ color: colors.textPrimary }}>
              {t('Welcome to Messenger', 'مرحباً في المحادثات')}
            </h2>
            <p className="text-center max-w-md" style={{ color: colors.textSecondary }}>
              {t('Select a chat from the list to start messaging', 'اختر محادثة من القائمة للبدء في المراسلة')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
